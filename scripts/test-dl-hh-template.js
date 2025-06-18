#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const CopybookSystem = require('./copybook-system');

async function testDlHhTemplate() {
  console.log(chalk.cyan('🧪 测试对临横行模板功能'));
  
  const system = new CopybookSystem();
  
  // 创建测试数据
  const testData = [
    { word: '春', pinyin: 'chūn' },
    { word: '夏', pinyin: 'xià' },
    { word: '秋', pinyin: 'qiū' },
    { word: '冬', pinyin: 'dōng' },
    { word: '梅', pinyin: 'méi' },
    { word: '兰', pinyin: 'lán' },
    { word: '竹', pinyin: 'zhú' },
    { word: '菊', pinyin: 'jú' },
    { word: '诗', pinyin: 'shī' },
    { word: '词', pinyin: 'cí' },
    { word: '歌', pinyin: 'gē' },
    { word: '赋', pinyin: 'fù' },
    { word: '琴', pinyin: 'qín' },
    { word: '棋', pinyin: 'qí' },
    { word: '书', pinyin: 'shū' },
    { word: '画', pinyin: 'huà' },
    { word: '山', pinyin: 'shān' },
    { word: '水', pinyin: 'shuǐ' },
    { word: '花', pinyin: 'huā' },
    { word: '鸟', pinyin: 'niǎo' }
  ];
  
  const testCases = [
    {
      name: '对临横行测试-A4',
      config: {
        title: '对临横行测试 (A4)',
        description: '测试对临横行模板 - A4纸张',
        fonts: ['kaishu'],
        templateType: 'dl_hh',
        colors: {
          theme: '#b2f2bb',
          border: '#40c057'
        },
        content: {
          motto: '业精于勤而荒于嬉，行成于思而毁于随'
        },
        output: {
          format: '$字帖名-$字体'
        },
        layout: {
          columnCount: 12,
          wordCount: 8,
          margin: '1.2cm',
          traceCount: 1,
          paper: 'a4'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      name: '对临横行测试-A5',
      config: {
        title: '对临横行测试 (A5)',
        description: '测试对临横行模板 - A5纸张',
        fonts: ['kaishu'],
        templateType: 'dl_hh',
        colors: {
          theme: '#e7f5ff',
          border: '#339af0'
        },
        content: {
          motto: '读书破万卷，下笔如有神'
        },
        output: {
          format: '$字帖名-$字体'
        },
        layout: {
          columnCount: 12,
          wordCount: 8,
          margin: '1cm',
          traceCount: 1,
          paper: 'a5'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    }
  ];
  
  try {
    // 创建测试字帖
    for (const testCase of testCases) {
      console.log(chalk.yellow(`\n📝 创建测试字帖: ${testCase.name}`));
      
      // 创建配置文件
      const configPath = path.join(system.copybooksDir, `${testCase.name}.config.json`);
      await fs.writeJson(configPath, testCase.config, { spaces: 2 });
      
      // 创建txt文件
      const txtPath = path.join(system.copybooksDir, `${testCase.name}.txt`);
      const txtContent = testData.map(item => item.word).join('\n');
      await fs.writeFile(txtPath, txtContent);
      
      // 创建json文件
      const jsonPath = path.join(system.copybooksDir, `${testCase.name}.json`);
      await fs.writeJson(jsonPath, testData, { spaces: 2 });
      
      console.log(chalk.green(`✅ ${testCase.name} 创建完成`));
    }
    
    // 编译测试字帖
    console.log(chalk.cyan('\n🔨 开始编译测试字帖...'));
    
    for (const testCase of testCases) {
      console.log(chalk.yellow(`\n📖 编译: ${testCase.name}`));
      
      try {
        const results = await system.compileCopybook(testCase.name);
        const successResults = results.filter(r => r.success);
        
        if (successResults.length > 0) {
          console.log(chalk.green(`✅ ${testCase.name} 编译成功`));
          successResults.forEach(result => {
            console.log(chalk.green(`  📄 ${result.outputName}`));
          });
        } else {
          console.log(chalk.red(`❌ ${testCase.name} 编译失败`));
        }
      } catch (error) {
        console.error(chalk.red(`❌ ${testCase.name} 编译失败: ${error.message}`));
      }
    }
    
    console.log(chalk.green('\n🎉 对临横行模板测试完成！'));
    console.log(chalk.cyan('📁 请查看 output 目录中生成的PDF文件'));
    
  } catch (error) {
    console.error(chalk.red(`❌ 测试失败: ${error.message}`));
    console.error(error.stack);
  }
}

// 运行测试
if (require.main === module) {
  testDlHhTemplate().catch(console.error);
}

module.exports = testDlHhTemplate; 