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
  doc
}

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

// 根据纸张大小动态调整栅格参数
#let get_layout_params(paper) = {
  if paper == "a5" {
    (
      font_size: 16pt,       // 字体大小
      grid_height: 2.8cm,    // 栅格单元高度（文字区+对临区）
      title_size: 30pt,      // 标题字体
      margin: 0.8cm,         // 页面边距
      max_lines: 12          // A5最大栅格行数
    )
  } else {
    (
      font_size: 26pt,       // 字体大小
      grid_height: 3cm,    // 栅格单元高度（文字区+对临区）
      title_size: 30pt,      // 标题字体
      margin: 1cm,           // 页面边距
      max_lines: 8          // A4最大栅格行数
    )
  }
}

#let one_page(title, sign, wordss, paper: "a4") = {
  let params = get_layout_params(paper)
  let paragraph_text = words_to_paragraph(wordss)
  
  // 标题区域
  let titleContent = block(
    width: 100%,
    height: 1.5cm,
    align(center + horizon)[
      #set text(size: params.title_size, font: titleFont, fill: textColor)
      #title
    ]
  )
  
  // 主文本区域 - 固定间距栅格系统
  let grid_unit = params.grid_height  // 栅格单元总高度
  let text_height = 1.5cm  // 文字实际占用高度
  let practice_height = 1.5cm  // 对临区域高度
  let total_grids = params.max_lines  // 栅格总数
  
  let textContent = block(
    width: 100%,
    inset: (left: params.margin, right: params.margin, top: 0cm, bottom: 0.8cm),
    {
      // 第一层：栅格背景
      place(top + left, dx: 0pt, dy: 0pt,
        // 使用stack创建规律的栅格背景
        stack(
          dir: ttb,
          spacing: 0pt,
          // 生成固定数量的栅格单元
          ..range(total_grids).map(i => 
            stack(
              dir: ttb,
              spacing: 0pt,
              // 文字区域（透明背景）
              block(
                width: 100%, 
                height: text_height, 
                fill: luma(100), 
                []
              ),
              // 对临区域（灰色背景）
              block(
                width: 100%, 
                height: practice_height,
                fill: luma(250),
                stroke: (
                  top: 0.2pt + luma(200),
                  bottom: 0.2pt + luma(200)
                ),
                inset: (left: 0.1cm, right: 0.1cm),
                []
              )
            )
          )
        )
      )
      
      // 第二层：文字内容
      place(top + left, dx: 0pt, dy: 0.4cm,  // 微调垂直位置
        align(left + top)[
          #set text(font: themeFont, size: params.font_size, fill: textColor)
          #set par(
            justify: false,
            leading: 4em,  // 行间距精确匹配对临区域高度
            spacing: 0em,
            first-line-indent: 2em
          )
          #paragraph_text
        ]
      )
    }
  )
  
  // 整体页面布局
  stack(
    dir: ttb,
    //spacing: 0.5cm,
    titleContent,
//    line(length: 100%, stroke: 0.5pt + luma(150)),
    textContent,
  )
}

#let pages(title, sign, wordss, word_count, paper: "a4") = {
  one_page(title, sign, wordss, paper: paper)
} 