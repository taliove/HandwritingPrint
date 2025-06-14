# 拼音字体大小动态调整功能

## 功能说明

为了解决长拼音（如"shuang"、"chuang"、"zhuang"等）在田字格中溢出的问题，我们实现了拼音字体大小的动态调整功能。

## 实现逻辑

- **拼音字符数 < 5**: 使用正常字体大小 (默认 0.6cm)
- **拼音字符数 = 5**: 使用中等字体大小 (0.5cm，减少0.1cm)
- **拼音字符数 >= 6**: 使用最小字体大小 (0.4cm，减少0.2cm)

## 技术实现

### 修改文件
- `src/templates/conf_py.typ` - 主要实现文件

### 核心代码
```typst
// 根据拼音字符数动态调整字体大小
let dynamic_pinyin_size = if pinyin.len() >= 6 {
  // 6个字符及以上：进一步缩小（减少0.2cm）
  let base_size = if pinyinSize == 0.6cm { 0.4cm } else { 
    let size_val = pinyinSize / 1cm
    (size_val - 0.2) * 1cm
  }
  base_size
} else if pinyin.len() >= 5 {
  // 5个字符：适度缩小（减少0.1cm）
  let base_size = if pinyinSize == 0.6cm { 0.5cm } else { 
    let size_val = pinyinSize / 1cm
    (size_val - 0.1) * 1cm
  }
  base_size
} else {
  pinyinSize
}
```

## 测试验证

### 测试脚本
- `scripts/test-pinyin-improvements.js` - 专门的测试脚本
- 运行命令: `npm run test:pinyin`

### 测试用例
测试包含以下拼音长度的汉字：
- 短拼音 (2-4字符): 你(ni), 好(hao), 世(shi), 界(jie) - 使用正常字体 (0.6cm)
- 中等拼音 (5字符): 光(guang) - 使用中等字体 (0.5cm)
- 长拼音 (6字符): 双(shuang), 创(chuang), 装(zhuang) - 使用最小字体 (0.4cm)

## 效果对比

### 修改前
- 所有拼音使用相同字体大小 (0.6cm)
- 长拼音如"shuang"、"chuang"、"zhuang"可能溢出田字格

### 修改后  
- 短拼音 (<5字符): 0.6cm (正常大小)
- 中等拼音 (5字符): 0.5cm (适度缩小)
- 长拼音 (>=6字符): 0.4cm (进一步缩小)
- 分级调整，有效防止各种长度拼音的溢出问题

## 兼容性

- 完全向后兼容现有配置
- 自动适配不同的 `pinyinSize` 配置值
- 不影响现有字帖的生成

## 使用方法

功能已自动集成到系统中，无需额外配置。所有新生成的字帖都会自动应用此功能。 