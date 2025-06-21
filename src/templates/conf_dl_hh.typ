//  对临横行 - 图层覆盖版本 (一行文字一行空白)
#import "@preview/cetz:0.3.0"
#import "@preview/cuti:0.2.1": show-cn-fakebold

// 导入配置文件
#import "config.typ": *

// 字体配置将从config.typ中读取，不在这里硬编码

// 根据纸张大小动态调整参数
#let get_layout_params(paper) = {
  if paper == "a5" {
    (
      font_size: 18pt,       // 字体大小 - 适合对临练习
      title_size: 22pt,      // 标题字体
      margin: (left: 1.5cm, right: 1.5cm, top: 2cm, bottom: 2cm),
      line_height: 3.2cm,    // 行高（文字+对临空间）- 增加空间
    )
  } else {
    (
      font_size: 1.2cm,       // 字体大小 - 适合对临练习
      title_size: 1.2cm,      // 标题字体
      margin: (left: 2cm, right: 2cm, top: 2.5cm, bottom: 2cm),
      line_height: 4cm,      // 行高（文字+对临空间）- 增加空间
    )
  }
}

// 创建对临练习区域的背景图层
#let create_practice_overlay(paper) = {
  let params = get_layout_params(paper)
  
  // 检测当前页面是否有标题
  context {
    let page_num = counter(page).get().first()
    let has_title = page_num == 1
    
    // 计算标题占用的高度
    let title_height = if has_title { 
      params.title_size + 1cm  // 标题字体大小 + 间距
    } else { 
      0cm 
    }
    
    // 从内容区域开始放置，配合dx/dy偏移
    place(
      top + left,
      dx: params.margin.left - 0.4cm,  // 从左边距开始
      dy: params.margin.top + title_height - 0.4cm,   // 从上边距+标题高度开始
      cetz.canvas(length: 1pt, {
        import cetz.draw: *
        
        // 使用A4纸张的标准尺寸
        let page_width = if paper == "a5" { 14.8cm } else { 21cm }
        let page_height = if paper == "a5" { 21cm } else { 29.7cm }
        
        // 内容区域尺寸（考虑标题占用的空间）
        let content_width = page_width - params.margin.left - params.margin.right + 0.8cm
        let available_height = page_height - params.margin.top - params.margin.bottom - title_height + 0.8cm
        
        // 计算可容纳的文本行数
        let num_text_lines = calc.ceil(available_height * 2 / params.line_height) + 1
        // 绘制整个练习区域的背景
        rect(
          (0cm, 0cm),
          (content_width, available_height),
          fill: rgb(245, 245, 245, 150),
          stroke: (
            paint: rgb(100, 100, 100, 200),
            thickness: 1.5pt
          )
        )
        
        // 为每一行文本在下方画练习线
        for i in range(num_text_lines) {
          // 因为坐标系以底部为0，向上为正，所以需要从顶部向下计算
          // 文本行的位置（从顶部开始计算，但坐标系是底部为0）
          // 判断是否为第一页，如果是第一页需要调整起始位置
          let text_line_y_from_top = if has_title {
            // 第一页有标题，需要额外的偏移
            2.1cm + i * 1.72cm
          } else {
            // 非第一页，使用标准偏移
            1.685cm + i * 1.72cm
          }
          let text_line_y = available_height - text_line_y_from_top
          
          // 练习线位置：在文本行下方（坐标系中是更小的y值）
          let practice_line_y = text_line_y
          
          // 确保练习线不超出内容区域（y > 0）
          if practice_line_y >= 0cm {
            // 画练习线
            line(
              (0.2cm, practice_line_y),
              (content_width - 0.2cm, practice_line_y),
              stroke: (
                paint: rgb(180, 180, 180, 200),
                thickness: 0.3pt,
                dash: "dashed"
              )
            )
          }
        }
      })
    )
  }
}

// 主函数 - 使用更简洁的接口
#let pages(
  title,
  sign, 
  text_content,
  paper: "a4",
  leading: none,
) = {
  // 设置默认值
  let params = get_layout_params(paper)
  let actual_leading = if leading == none { params.line_height } else { leading }
  // 设置页面
  set page(
    paper: paper,
    margin: (
      left: params.margin.left,
      right: params.margin.right,
      top: params.margin.top,
      bottom: 3cm
    ),
    background: create_practice_overlay(paper)
  )
  // 设置段落样式 - 关键是大行间距
  set par(
    justify: true,
    leading: actual_leading,     // 大行间距，为练习区域留空间
    first-line-indent: 0em,
    spacing: 0.6em
  )
  
  // 设置文本样式
  set text(
    font: themeFont, 
    size: params.font_size, 
    fill: textColor
  )
  
  // 标题（只在第一页显示）
  context {
    let page_num = counter(page).get().first()
    if page_num == 1 {
      align(center)[
        #set text(size: params.title_size, font: titleFont, weight: "bold")
        #title
      ]
      v(1cm)
    }
  }
  
  // 主要文本内容 - 让Typst自动处理换行和分页
  text_content
  
  // 页脚签名
  place(
    bottom + center,
    dx: 0cm, dy: 0.5cm,
    text(size: 10pt, fill: rgb(150, 150, 150))[#sign]
  )
}

// 兼容性函数 - 单页版本
#let one_page(
  title, 
  sign, 
  text_content, 
  paper: "a4", 
  show_title: true, 
  leading: none
) = {
  pages(title, sign, text_content, paper: paper, leading: leading)
}

// 兼容性conf函数 - 与现有系统保持一致
#let conf(
  paper: "a4",
  flipped: false, //是否为横向
  margin: 1cm,
  leading: none,
  doc,
) = {
  show: show-cn-fakebold
  
  // 设置默认值
  let params = get_layout_params(paper)
  let actual_leading = if leading == none { params.line_height } else { leading }
  
  set page(
    paper: paper,
    flipped: flipped,
    margin: params.margin,
    background: create_practice_overlay(paper),
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
  
  // 设置段落样式 - 关键是大行间距
  set par(
    justify: true,
    leading: actual_leading,     // 大行间距，为练习区域留空间
    first-line-indent: 2em,
    spacing: 0.6em
  )
  
  // 设置文本样式
  set text(
    font: themeFont, 
    size: params.font_size, 
    fill: textColor
  )
  
  doc
} 