#import "templates/conf_dl_hh.typ": *
#import "templates/config.typ": *

#show: conf.with(
  paper: "${layout.paper}",
  margin: ${layout.margin}
)

#let data = json("data/${dataFile}")
#let title = "${title}"
#let sign = "${content.sign}"

// 生成对临横行字帖
pages(title, sign, data, data.len(), paper: "${layout.paper}") 