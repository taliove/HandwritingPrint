#import "templates/conf_py.typ": *
#import "templates/config.typ": *

#show: conf.with(
  margin: ${layout.margin}
)

#let data = json("data/${dataFile}")
#let title = "${title}"
#let sign = "${content.sign}"
#let chunked = data.chunks(${layout.wordCount})

// 生成所有页面
#for chunk in chunked {
   pages(title, sign, chunk, ${layout.wordTotal}, ${layout.columnCount})
} 