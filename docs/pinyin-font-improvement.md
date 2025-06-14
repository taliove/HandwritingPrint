# 拼音字体智能优化功能

## 功能说明

为了解决长拼音（如"shuang"、"chuang"、"zhuang"等）在田字格中溢出的问题，我们实现了基于字符间距控制的智能优化方案，这比单纯缩小字体更加优雅和有效。

## 实现逻辑

- **拼音字符数 < 5**: 正常字体 + 正常间距 (0.6cm + tracking: 0em)
- **拼音字符数 = 5**: 正常字体 + 紧缩间距 (0.6cm + tracking: -0.03em)
- **拼音字符数 >= 6**: 小字体 + 紧缩间距 (0.5cm + tracking: -0.05em)

## 技术实现

### 修改文件
- `src/templates/conf_py.typ` - 主要实现文件

### 核心代码
```typst
// 根据拼音字符数动态调整字体属性 - 使用更优雅的解决方案
let (dynamic_pinyin_size, dynamic_tracking) = if pinyin.len() >= 6 {
  // 6个字符及以上：使用字符间距紧缩 + 适度缩小字体
  let base_size = if pinyinSize == 0.6cm { 0.5cm } else { 
    let size_val = pinyinSize / 1cm
    (size_val - 0.1) * 1cm
  }
  (base_size, -0.05em)  // 负值表示字符间距紧缩
} else if pinyin.len() >= 5 {
  // 5个字符：仅使用字符间距紧缩
  (pinyinSize, -0.03em)
} else {
  // 短拼音：正常间距
  (pinyinSize, 0em)
}

// 应用字体大小和字符间距
text(font: pinyinFont, fill: color, size: dynamic_pinyin_size, tracking: dynamic_tracking, pinyin)
```

## 测试验证

### 测试脚本
- `scripts/test-pinyin-improvements.js` - 专门的测试脚本
- 运行命令: `npm run test:pinyin`

### 测试用例
测试包含以下拼音长度的汉字：
- 短拼音 (2-4字符): 你(ni), 好(hao), 世(shi), 界(jie) - 正常字体+正常间距
- 中等拼音 (5字符): 光(guang) - 正常字体+紧缩间距 (tracking: -0.03em)
- 长拼音 (6字符): 双(shuang), 创(chuang), 装(zhuang) - 小字体+紧缩间距 (0.5cm + tracking: -0.05em)

## 效果对比

### 修改前
- 所有拼音使用相同字体大小和间距 (0.6cm + 正常间距)
- 长拼音如"shuang"、"chuang"、"zhuang"容易溢出田字格

### 修改后  
- 短拼音 (<5字符): 正常字体+正常间距 (0.6cm + tracking: 0em)
- 中等拼音 (5字符): 正常字体+紧缩间距 (0.6cm + tracking: -0.03em)
- 长拼音 (>=6字符): 小字体+紧缩间距 (0.5cm + tracking: -0.05em)
- **核心优势**: 使用字符间距控制比单纯缩小字体更优雅，保持了字体的可读性

## 兼容性

- 完全向后兼容现有配置
- 自动适配不同的 `pinyinSize` 配置值
- 不影响现有字帖的生成

## 使用方法

功能已自动集成到系统中，无需额外配置。所有新生成的字帖都会自动应用此功能。 