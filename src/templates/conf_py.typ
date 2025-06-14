//  带拼音格 - 配置化版本
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
  set align(center)
  set text(
    font: titleFont,
    size: 14pt
  )
  set par(
    justify: true,
    leading: 0cm,
    spacing: 0cm,
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
//  中线
#let centerLineContent = block(width:100%, height:1.2cm, place(center+horizon,line(start: (0%, 0%), end: (100%, 0%),stroke: (paint: themeColor, thickness: 1pt, dash: ("dot", 2pt, 4pt, 2pt)))))
#let mod = (a, b) => a - b * calc.floor(a / b)
#let one_box_canvas(width, font, font-size, color, word, pinyin) = {
  cetz.canvas({
    import cetz.draw: *
    set-style(stroke: 1pt + themeColor)
    rect((0, 0), (width, width+pyHeight), name: "outbox")
    rect((0, width), (width, width+pyHeight), name: "pinyin")
    line((0, width+pyHeight/3), (width, width+pyHeight/3), stroke: 0.5pt+themeColor)
    line((0, width+pyHeight*2/3), (width, width+pyHeight*2/3), stroke: 0.5pt+themeColor)

    rect((0, 0), (width, width), name: "box")
    set-style(stroke: 0.5pt + themeColor)
    rect((width/4, width/4), (width/2+width/4, width/2+width/4))
    line((0, 0), (width, width))
    line((width, 0), (0, width))
    line((width/2, 0), (width/2, width))
    line((0, width/2), (width, width/2))
    content((name: "box"), box(width: width, height: width, baseline: 50%, place(center+horizon,dy: -4pt, text(font: font,fill:color, size: font-size, word))))
    content((name: "pinyin"), box(width: width, height: width, baseline: 50%, place(center+horizon,dy: -1pt, text(font: pinyinFont,fill:color, size: pinyinSize, pinyin))))
  })
}

#let generate-rows(n) = (
  (auto, 2.5cm, 2.5cm, 2.5cm, 2.5cm, 1.2cm)
)


#let one_page(title, sign, wordss, word_total, column_count) = {
  let boxes = ()
  let n = 0
  let words-index = 0
  while n < word_total {
    let index = mod(n, 6);
  
    let w = if index == 0 or index == 1 { 
      words-index 
    } 
    else {
      -1
    };
    let word = if w >= 0 and w < wordss.len() { 
      if index > 0 {
        words-index = words-index + 1
      }
      wordss.at(w)
    }
    else { 
      (word:"", pinyin:"")
    }
    if index == 1 {
      boxes.push(one_box_canvas(boxSize, themeFont, wordSize, grayTextColor, word.word, word.pinyin))
    } else {
      boxes.push(one_box_canvas(boxSize, themeFont, wordSize, textColor, word.word, word.pinyin))
    }
    n = n + 1
  }
  
  let titleContent = block(height: 1cm, text(title, size: titleSize, font: titleFont))
  block(
    stroke: 1pt + borderColor,
    inset: (x: 0.2cm),
    grid(
      columns: (boxSize,)*column_count,
      rows: generate-rows(column_count),
      align: center + horizon,
      grid.header(grid.cell(colspan: column_count)[
        #titleContent
      ]),
      ..boxes,
      grid.footer(
        grid.cell(colspan: column_count)[
          #block(
            text(size: signSize)[#sign#blank(1cm)#underline(100%)年#blank(0.5cm)#underline(100%)月#blank(0.5cm)#underline(100%)日]
          )
        ]
      )
    )
  )
  bottomContent(true)
}

// 正常显示上下两页都是正向的
#let pages_bak(title, sign, wordss, wordTotal, columnCount) = {
  block(height: 100%,
    place(center+horizon,
      stack(
        dir: ttb,
        one_page(title, sign, wordss, wordTotal, columnCount),
        centerLineContent,
        one_page(title, sign, wordss, wordTotal, columnCount),
      )
    )
  )
}

// 上下翻转显示页面（上方正常，下方倒立）
#let pages(title, sign, wordss, wordTotal, columnCount) = {
  if enableRotation {
    block(height: 100%,
      place(center+horizon,
        stack(
          dir: ttb,
          block(width: 100%, rotate(180deg, one_page(title, sign, wordss, wordTotal, columnCount))),
          centerLineContent,
          one_page(title, sign, wordss, wordTotal, columnCount)
        )
      )
    )
  } else {
    pages_bak(title, sign, wordss, wordTotal, columnCount)
  }
}