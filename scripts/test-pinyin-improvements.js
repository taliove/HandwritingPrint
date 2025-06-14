#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const CopybookSystem = require('./copybook-system');

async function testPinyinImprovements() {
  console.log(chalk.cyan.bold('🧪 测试拼音字体大小动态调整功能\n'));

  const system = new CopybookSystem();
  const testCopybookName = '拼音字体测试';

  try {
    // 1. 创建测试数据，包含不同长度的拼音
    console.log(chalk.blue('1. 创建测试数据'));
    const testData = [
      { word: '你', pinyin: 'nǐ' },      // 2个字符 - 正常字体
      { word: '好', pinyin: 'hǎo' },     // 3个字符 - 正常字体
      { word: '世', pinyin: 'shì' },     // 3个字符 - 正常字体
      { word: '界', pinyin: 'jiè' },     // 3个字符 - 正常字体
      { word: '光', pinyin: 'guāng' },   // 5个字符 - 中等字体(0.5cm)
      { word: '双', pinyin: 'shuāng' },  // 6个字符 - 小字体(0.4cm)
      { word: '创', pinyin: 'chuàng' },  // 6个字符 - 小字体(0.4cm)
      { word: '装', pinyin: 'zhuāng' },  // 6个字符 - 小字体(0.4cm)
      { word: '庄', pinyin: 'zhuāng' },  // 6个字符 - 小字体(0.4cm)
      { word: '状', pinyin: 'zhuàng' },  // 6个字符 - 小字体(0.4cm)
    ];

    // 2. 创建测试字帖配置
    const testConfig = {
      name: testCopybookName,
      title: '拼音字体大小测试',
      description: '测试长拼音字体自动缩小功能',
      fonts: ['kaishu'],
      colors: {
        theme: '#b2f2bb',
        border: '#40c057'
      },
      content: {
        motto: '测试拼音字体动态调整 - shuang, chuang, zhuang, guang'
      },
      output: {
        format: '$字帖名-$字体-测试'
      }
    };

    // 3. 保存测试数据
    const copybooksDir = path.join(process.cwd(), 'copybooks');
    await fs.ensureDir(copybooksDir);
    
    const configPath = path.join(copybooksDir, `${testCopybookName}.config.json`);
    const dataPath = path.join(copybooksDir, `${testCopybookName}.json`);
    
    await fs.writeJson(configPath, testConfig, { spaces: 2 });
    await fs.writeJson(dataPath, testData, { spaces: 2 });

    console.log(chalk.green(`✅ 测试数据已创建`));
    console.log(chalk.gray(`   配置文件: ${configPath}`));
    console.log(chalk.gray(`   数据文件: ${dataPath}`));

    // 4. 显示测试数据详情
    console.log(chalk.blue('\n2. 测试数据详情'));
    console.log(chalk.gray('   以下拼音应该使用不同的字体大小:'));
    testData.forEach((item, index) => {
      let fontSizeInfo;
      if (item.pinyin.length >= 6) {
        fontSizeInfo = chalk.red('小字体+紧缩间距 (0.5cm + tracking: -0.05em)');
      } else if (item.pinyin.length >= 5) {
        fontSizeInfo = chalk.yellow('正常字体+紧缩间距 (0.6cm + tracking: -0.03em)');
      } else {
        fontSizeInfo = chalk.green('正常字体+正常间距 (0.6cm)');
      }
      console.log(chalk.gray(`   ${index + 1}. ${item.word} -> ${item.pinyin} (${item.pinyin.length}字符) - ${fontSizeInfo}`));
    });

    // 5. 编译测试字帖
    console.log(chalk.blue('\n3. 编译测试字帖'));
    console.log(chalk.gray('   正在生成PDF文件...'));
    
    const results = await system.compileCopybook(testCopybookName, ['kaishu']);
    
    if (results[0].success) {
      console.log(chalk.green(`✅ 编译成功: ${results[0].outputName}`));
      console.log(chalk.gray(`   输出路径: ${results[0].outputPath}`));
      console.log(chalk.cyan('\n📋 请检查生成的PDF文件:'));
      console.log(chalk.gray('   • "你"、"好"、"世"、"界" 的拼音应该是正常字体+正常间距'));
      console.log(chalk.gray('   • "光" 的拼音应该是正常字体+紧缩间距'));
      console.log(chalk.gray('   • "双"、"创"、"装"、"庄"、"状" 的拼音应该是小字体+紧缩间距'));
    } else {
      console.log(chalk.red(`❌ 编译失败: ${results[0].error}`));
    }

    console.log(chalk.cyan.bold('\n🎉 拼音字体优化测试完成！'));
    console.log(chalk.green('\n✨ 新的优化策略:'));
    console.log(chalk.gray('   • 拼音字符数 < 5: 正常字体 + 正常间距 (0.6cm)'));
    console.log(chalk.gray('   • 拼音字符数 = 5: 正常字体 + 紧缩间距 (tracking: -0.03em)'));
    console.log(chalk.gray('   • 拼音字符数 >= 6: 小字体 + 紧缩间距 (0.5cm + tracking: -0.05em)'));
    console.log(chalk.gray('   • 使用字符间距控制比单纯缩小字体更优雅！'));

  } catch (error) {
    console.error(chalk.red('❌ 测试失败:'), error.message);
    console.error(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testPinyinImprovements().catch(console.error);
}

module.exports = testPinyinImprovements; 