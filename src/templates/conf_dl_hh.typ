//  对临横行 - 配置化版本 (一行文字一行空白)
#import "@preview/cetz:0.3.0"
#import "@preview/cuti:0.2.1": show-cn-fakebold

// 导入配置文件
#import "config.typ": *

#let conf(
  paper: "a4",
  flipped: false, //是否为横向
  margin: 1cm,
  leading: 2.38cm, // 行间距参数，可配置
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
      grid_height: 3.2cm,    // 栅格单元高度（文字区+对临区）
      title_size: 26pt,      // 标题字体
      margin: 1cm,           // 页面边距
      max_lines: 8          // A4最大栅格行数
    )
  }
}

// 生成单页内容，支持指定文字内容
#let one_page(title, sign, text_content, paper: "a4", show_title: true, leading: 2.38cm) = {
  let params = get_layout_params(paper)
  
  // 标题区域（只在第一页显示）
  let titleContent = if show_title {
    block(
      width: 100%,
      height: 2cm,
      align(center + horizon)[
        #set text(size: params.title_size, font: titleFont, fill: textColor)
        #title
      ]
    )
  } else {
    block(width: 100%, height: 0.5cm, [])
  }
  
  // 主文本区域 - 固定间距栅格系统
  let text_height = 1.6cm  // 文字实际占用高度
  let practice_height = 1.6cm  // 对临区域高度
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
                fill: none, 
                []
              ),
              // 对临区域（灰色背景）
              block(
                width: 100%, 
                height: practice_height,
                fill: luma(230),
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
            justify: true,
            leading: leading,  // 使用可配置的行间距
            spacing: 0em,
            first-line-indent: 2em
          )
          #text_content
        ]
      )
    }
  )
  
  // 整体页面布局
  stack(
    dir: ttb,
    titleContent,
    textContent,
  )
}

// 智能分页函数 - 直接接收文本内容
#let pages(title, sign, text_content, paper: "a4", leading: 2.38cm) = {
  let params = get_layout_params(paper)
  let chars = text_content.clusters()
  
  // 估算每行可容纳的字符数
  let chars_per_line = if paper == "a5" { 15 } else { 18 }
  let lines_per_page = params.max_lines
  let chars_per_page = chars_per_line * lines_per_page
  
  // 计算需要多少页
  let total_pages = calc.ceil(chars.len() / chars_per_page)
  
  // 生成所有页面
  for page_num in range(total_pages) {
    let start_pos = page_num * chars_per_page
    let end_pos = calc.min(start_pos + chars_per_page, chars.len())
    
    // 找到合适的断句位置（避免在词中间断开）
    if end_pos < chars.len() {
      let break_pos = end_pos
      // 向前寻找合适的断句点
      while break_pos > start_pos and break_pos < chars.len() {
        let char = chars.at(break_pos)
        if char in ("。", "，", "；", "：", "！", "？", "、", " ", "\n") {
          break_pos += 1
          break
        }
        break_pos -= 1
      }
      if break_pos > start_pos {
        end_pos = break_pos
      }
    }
    
    let page_text = chars.slice(start_pos, end_pos).join("")
    
    // 生成页面（第一页显示标题，后续页面不显示）
    one_page(title, sign, page_text, paper: paper, show_title: page_num == 0, leading: leading)
    
    // 如果不是最后一页，添加分页符
    if page_num < total_pages - 1 {
      pagebreak()
    }
  }
} 