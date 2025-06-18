//  对临横行 - 配置化版本
#import "@preview/cetz:0.3.0"
#import "@preview/cuti:0.2.1": show-cn-fakebold

// 导入配置文件
#import "config.typ": *

#let conf(
  paper: "a4",
  flipped: false, //是否为横向
  margin: 1cm,
  doc,
) = {
  show: show-cn-fakebold
  set page(
    paper: paper,
    flipped: flipped,
    margin: (x: margin, y: margin),
    numbering: "1 / 1",
    footer: context [
      #set align(right)
      #set text(8pt)
      #counter(page).display(
        "1 / 1",
        both: true,
      )
    ]
  )
  set align(left)
  set text(
    font: titleFont,
    size: 14pt
  )
  set par(
    justify: true,
    leading: 0.5cm,
    spacing: 0.5cm,
  )
  doc
}

#let blank(width) = box(width:width)
#let underline(length) = {
  box(width: 1fr, line(length: length, stroke: luma(180)))
}

#let score = block(text(size: signSize)[
  坐姿 #sym.star.stroked#sym.star.stroked#sym.star.stroked#sym.star.stroked#sym.star.stroked
  #blank(0.5cm)规范书写 #sym.star.stroked#sym.star.stroked#sym.star.stroked#sym.star.stroked#sym.star.stroked
  #blank(0.5cm)握笔姿势 #sym.star.stroked#sym.star.stroked#sym.star.stroked#sym.star.stroked#sym.star.stroked
])

//  底部的评价
#let bottomContent(containScore) = {
  if containScore and includeScore {
    block(width:100% - 0.2cm, height:0.8cm, stroke: 1pt + borderColor, place(center+horizon, score))
  } else {
    block(width:100%, height:1cm)
  }
}

// 生成一行文字内容
#let generate_text_line(words, line_height: 1.2cm) = {
  let content = ""
  for word in words {
    if word.word != "" {
      content += word.word
    }
  }
  
  block(
    width: 100%,
    height: line_height,
    inset: (left: 0.5cm, right: 0.5cm),
    align(left + horizon,
      text(
        font: themeFont,
        size: wordSize,
        fill: textColor,
        content
      )
    )
  )
}

// 生成一行空白练习行（带底线）
#let generate_blank_line(line_height: 1.2cm) = {
  block(
    width: 100%,
    height: line_height,
    inset: (left: 0.5cm, right: 0.5cm),
    align(left + horizon,
      line(
        length: 100%,
        stroke: (paint: luma(180), thickness: 1pt)
      )
    )
  )
}

// 生成标题行
#let generate_title(title) = {
  block(
    width: 100%,
    height: 1.5cm,
    stroke: (bottom: 1pt + borderColor),
    inset: (left: 0.5cm, right: 0.5cm),
    align(center + horizon,
      text(
        font: titleFont,
        size: titleSize,
        fill: textColor,
        title
      )
    )
  )
}

// 生成签名行
#let generate_signature(sign) = {
  block(
    width: 100%,
    height: 1cm,
    inset: (left: 0.5cm, right: 0.5cm),
    align(right + horizon,
      text(
        size: signSize,
        [#sign#blank(1cm)#underline(3cm)年#blank(0.5cm)#underline(2cm)月#blank(0.5cm)#underline(2cm)日]
      )
    )
  )
}

// 根据纸张大小计算每页行数
#let calculate_lines_per_page(paper) = {
  if paper == "a5" {
    6  // A5纸张每页6行文字（12行总计，包括空白行）
  } else {
    10 // A4纸张每页10行文字（20行总计，包括空白行）
  }
}

// 将单词数组分组为行
#let group_words_to_lines(words, chars_per_line) = {
  let lines = ()
  let current_line = ()
  let current_length = 0
  
  for word in words {
    if word.word != "" {
      if current_length + word.word.len() <= chars_per_line {
        current_line.push(word)
        current_length += word.word.len()
      } else {
        if current_line.len() > 0 {
          lines.push(current_line)
          current_line = (word,)
          current_length = word.word.len()
        }
      }
    }
  }
  
  if current_line.len() > 0 {
    lines.push(current_line)
  }
  
  return lines
}

// 生成一页内容
#let generate_page(title, sign, word_lines, paper) = {
  let lines_per_page = calculate_lines_per_page(paper)
  let page_lines = word_lines.slice(0, calc.min(lines_per_page, word_lines.len()))
  
  let content_blocks = ()
  
  // 添加标题
  content_blocks.push(generate_title(title))
  
  // 添加文字行和空白行
  for line_words in page_lines {
    content_blocks.push(generate_text_line(line_words))
    content_blocks.push(generate_blank_line())
  }
  
  // 填充剩余空间
  let remaining_space = lines_per_page - page_lines.len()
  for i in range(remaining_space) {
    content_blocks.push(generate_blank_line())
    content_blocks.push(generate_blank_line())
  }
  
  // 添加签名行
  content_blocks.push(generate_signature(sign))
  
  return stack(dir: ttb, ..content_blocks)
}

// 主函数：生成对临横行字帖
#let pages(title, sign, wordss, wordTotal, paper: "a4") = {
  // 根据纸张大小确定每行字符数
  let chars_per_line = if paper == "a5" { 12 } else { 20 }
  
  // 将单词分组为行
  let word_lines = group_words_to_lines(wordss, chars_per_line)
  let lines_per_page = calculate_lines_per_page(paper)
  
  // 生成页面内容
  let current_line_index = 0
  
  while current_line_index < word_lines.len() {
    let page_word_lines = word_lines.slice(
      current_line_index, 
      calc.min(current_line_index + lines_per_page, word_lines.len())
    )
    
    // 生成页面
    block(
      height: 100%,
      stroke: 1pt + borderColor,
      inset: 0.2cm,
      generate_page(title, sign, page_word_lines, paper)
    )
    
    current_line_index += lines_per_page
    
    // 如果还有更多内容，添加分页符
    if current_line_index < word_lines.len() {
      pagebreak()
    }
  }
  
  // 添加底部评分区域
  bottomContent(true)
} 