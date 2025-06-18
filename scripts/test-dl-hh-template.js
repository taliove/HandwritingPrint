#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const CopybookSystem = require('./copybook-system');

async function testDlHhTemplate() {
  console.log(chalk.cyan('🧪 测试对临横行模板功能（纯文本格式）'));
  
  const system = new CopybookSystem();
  
  // 创建测试数据 - 保留标点符号和原始格式的文本
  const testTexts = {
    '对临测试-古诗': `静夜思
李白

床前明月光，疑是地上霜。
举头望明月，低头思故乡。

登鹳雀楼
王之涣

白日依山尽，黄河入海流。
欲穷千里目，更上一层楼。`,

    '对临测试-散文': `春天来了，万物复苏。桃花盛开，柳絮飞舞。
小鸟在枝头欢快地歌唱，春风轻抚着大地。
这是一个充满希望的季节，让人心情愉悦。

夏日炎炎，荷花盛开。池塘里的荷叶田田，粉色的荷花亭亭玉立。
蜻蜓点水，鱼儿游弋。这样的景色，让人陶醉不已。`,

    '对临测试-论语': `学而时习之，不亦说乎？有朋自远方来，不亦乐乎？
人不知而不愠，不亦君子乎？

温故而知新，可以为师矣。
知之为知之，不知为不知，是知也。
三人行，必有我师焉：择其善者而从之，其不善者而改之。`
  };
  
  const testCases = [
    {
      name: '对临测试-古诗',
      config: {
        title: '古诗词对临练习',
        description: '测试对临字帖 - 古诗格式',
        fonts: ['kaishu'],
        templateType: 'dl_hh',
        colors: {
          theme: '#b2f2bb',
          border: '#40c057'
        },
        content: {
          motto: '熟读唐诗三百首，不会作诗也会吟'
        },
        output: {
          format: '$字帖名-$字体'
        },
        layout: {
          margin: '1.2cm',
          paper: 'a4'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      name: '对临测试-散文',
      config: {
        title: '散文对临练习',
        description: '测试对临字帖 - 散文格式',
        fonts: ['kaishu'],
        templateType: 'dl_hh',
        colors: {
          theme: '#e7f5ff',
          border: '#339af0'
        },
        content: {
          motto: '文章千古事，得失寸心知'
        },
        output: {
          format: '$字帖名-$字体'
        },
        layout: {
          margin: '1cm',
          paper: 'a5'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    },
    {
      name: '对临测试-论语',
      config: {
        title: '论语对临练习',
        description: '测试对临字帖 - 论语格式',
        fonts: ['kaishu'],
        templateType: 'dl_hh',
        colors: {
          theme: '#fff3cd',
          border: '#ffc107'
        },
        content: {
          motto: '温故而知新，可以为师矣'
        },
        output: {
          format: '$字帖名-$字体'
        },
        layout: {
          margin: '1.2cm',
          paper: 'a4'
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
      
      // 创建txt文件 - 保留原始格式和标点符号
      const txtPath = path.join(system.copybooksDir, `${testCase.name}.txt`);
      const txtContent = testTexts[testCase.name];
      await fs.writeFile(txtPath, txtContent, 'utf8');
      
      console.log(chalk.green(`✅ ${testCase.name} 创建完成`));
      console.log(chalk.gray(`   文本内容: ${txtContent.substring(0, 50)}...`));
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
          results.forEach(result => {
            if (!result.success) {
              console.log(chalk.red(`    ${result.error}`));
            }
          });
        }
      } catch (error) {
        console.error(chalk.red(`❌ ${testCase.name} 编译失败: ${error.message}`));
      }
    }
    
    console.log(chalk.green('\n🎉 对临横行模板测试完成！'));
    console.log(chalk.cyan('📝 重要特性：'));
    console.log(chalk.cyan('  ✅ 直接读取txt文件，无需JSON处理'));
    console.log(chalk.cyan('  ✅ 完整保留标点符号和原始格式'));
    console.log(chalk.cyan('  ✅ 不进行拼音处理'));
    console.log(chalk.cyan('  ✅ 支持诗歌、散文、古文等各种文本格式'));
    console.log(chalk.cyan('📁 请查看 output 目录中生成的PDF文件'));
    
  } catch (error) {
    console.error(chalk.red('❌ 测试失败:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testDlHhTemplate().catch(console.error);
}

module.exports = testDlHhTemplate; 