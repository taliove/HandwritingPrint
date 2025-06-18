//  对临横行 - 配置化版本 (一行文字一行空白)
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
    footer: context [
      #set align(right)
      #set text(8pt)
      #counter(page).display(
        "1 / 1",
        both: true,
      )
    ]
  )
  set text(
    font: themeFont,
    size: 12pt
  )
  set par(
    justify: false,
    leading: 0.3em,
    spacing: 0.5em,
  )
  doc
}

#let blank(width) = box(width:width)
#let underline(length) = {
  box(width: 1fr, line(length: length, stroke: luma(180)))
}

//  中线
#let centerLineContent = block(width:100%, height:1.2cm, place(center+horizon,line(start: (0%, 0%), end: (100%, 0%),stroke: (paint: themeColor, thickness: 1pt, dash: ("dot", 2pt, 4pt, 2pt)))))

// 这个函数已经不需要了，直接在one_page中实现

// 将文字数组转换为段落文本
#let words_to_paragraph(word_array) = {
  word_array.map(item => {
    if type(item) == dictionary and "word" in item {
      item.word
    } else {
      str(item)
    }
  }).join("")
}

// 安全地分割字符串，处理Unicode字符边界
#let safe_slice_text(text, chars_per_line) = {
  let chars = text.clusters()  // 使用clusters()获取字符数组，正确处理Unicode
  let lines = ()
  let current_pos = 0
  
  while current_pos < chars.len() {
    let end_pos = calc.min(current_pos + chars_per_line, chars.len())
    let line_chars = chars.slice(current_pos, end_pos)
    lines.push(line_chars.join(""))
    current_pos = end_pos
  }
  
  return lines
}

// 根据纸张大小动态调整行数和字体
#let get_layout_params(paper) = {
  if paper == "a5" {
    (
      lines_per_page: 6,   // A5每页6对行（文字行+空行）
      font_size: 14pt,     // 稍小的字体
      line_height: 1.8cm,  // 增加行高给空行留空间
      chars_per_line: 18   // 每行字符数
    )
  } else {
    (
      lines_per_page: 8,   // A4每页8对行（文字行+空行）
      font_size: 30pt,     // 标准字体
      line_height: 1.8cm,  // 增加行高给空行留空间
      chars_per_line: 14   // 每行字符数
    )
  }
}

#let one_page(title, sign, wordss, paper: "a4") = {
  let params = get_layout_params(paper)
  let paragraph_text = words_to_paragraph(wordss)
  let text_lines = safe_slice_text(paragraph_text, params.chars_per_line)
  
  // 标题区域
  let titleContent = block(
    width: 100%,
    height: 1.5cm,
    align(center + horizon)[
      #set text(size: titleSize, font: titleFont, fill: textColor)
      #title
    ]
  )
  
  // 生成文字行和空行对
  let content_blocks = ()
  let line_count = calc.min(text_lines.len(), params.lines_per_page)
  
  for i in range(line_count) {
    let line_text = text_lines.at(i)
    
    // 文字行 - 左对齐
    let text_block = block(
      width: 100%,
      height: 1.5cm,
      inset: (left: 1cm, right: 1cm, top: 0.2cm, bottom: 0.2cm),
      align(left + horizon)[
        #set text(font: themeFont, size: params.font_size, fill: textColor)
        #set par(justify: false, leading: 0.3em)
        #line_text
      ]
    )
    
    // 空白行 - 完全空白
    let blank_block = block(
      width: 100%,
      height: 1.5cm,
      inset: (left: 1cm, right: 1cm),
      fill: luma(240)  // 添加淡灰色背景
    )
    // 横线元素
    let underline_block = block(
      width: 100%,
      inset: (left: 1cm, right: 1cm),
      stroke: (bottom: 0.3pt + luma(150))
    )
    
    content_blocks.push(text_block)
    content_blocks.push(blank_block)
    //content_blocks.push(underline_block)
  }
  
  // 签名区域
  let signContent = block(
    width: 100%,
    height: 1.2cm,
    inset: (left: 1cm, right: 1cm),
    align(left + horizon)[
      #set text(size: signSize, fill: textColor)
    ]
  )
  
  // 整体页面布局
  block(
    stroke: 1pt + borderColor,
    inset: 0.3cm,
    stack(
      dir: ttb,
      spacing: 0cm,
      titleContent,
      line(length: 100%, stroke: 0.3pt + luma(180)),
      ..content_blocks,
      signContent
    )
  )
}

// 生成单页内容
#let pages(title, sign, wordss, word_count, paper: "a4") = {
  // 直接生成正常的单页，不进行旋转
  one_page(title, sign, wordss, paper: paper)
} 