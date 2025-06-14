#!/usr/bin/env node

const chalk = require('chalk');
const CopybookSystem = require('./copybook-system');
const AIService = require('./ai-service');

async function testAIFeature() {
  console.log(chalk.cyan.bold('🧪 测试AI拼音生成功能\n'));

  const system = new CopybookSystem();
  const aiService = new AIService();

  // 1. 测试汉字提取
  console.log(chalk.blue('1. 测试汉字提取功能'));
  const testText = `
        你好世界！这是一个测试。
        Hello World 123
        春天来了，花儿开了。
        ！@#$%^&*()
        学习编程很有趣
    `;
    
  const characters = aiService.extractChineseCharacters(testText);
  console.log(`   提取到 ${characters.length} 个汉字: ${characters.join('、')}`);
  console.log(chalk.green('   ✅ 汉字提取测试通过\n'));

  // 2. 测试AI配置状态
  console.log(chalk.blue('2. 检查AI配置状态'));
  const summary = aiService.getConfigSummary();
  console.log(`   启用状态: ${summary.enabled ? chalk.green('已启用') : chalk.yellow('未启用')}`);
  console.log(`   API密钥: ${summary.hasApiKey ? chalk.green('已配置') : chalk.red('未配置')}`);
  console.log(`   服务商: ${summary.provider}`);
  console.log(`   模型: ${summary.model}\n`);

  // 3. 测试拼音生成（无论是否配置AI）
  console.log(chalk.blue('3. 测试拼音生成'));
  try {
    const pinyinData = await aiService.generatePinyin(['你', '好', '世', '界']);
    console.log('   生成结果:');
    pinyinData.forEach(item => {
      console.log(`     ${item.character} -> ${item.pinyin}`);
    });
    console.log(chalk.green('   ✅ 拼音生成测试通过\n'));
  } catch (error) {
    console.log(chalk.red(`   ❌ 拼音生成失败: ${error.message}\n`));
  }

  // 4. 创建测试字帖
  console.log(chalk.blue('4. 创建AI测试字帖'));
  const testCopybookName = 'AI测试字帖';
    
  try {
    // 检查是否已存在
    const copybooks = await system.getAllCopybooks();
    const existing = copybooks.find(cb => cb.name === testCopybookName);
        
    if (existing) {
      console.log(chalk.yellow('   测试字帖已存在，跳过创建'));
    } else {
      // 创建配置文件
      const fs = require('fs-extra');
      const path = require('path');
            
      const config = {
        title: 'AI拼音生成测试',
        description: '测试AI自动生成拼音功能',
        fonts: ['kaishu'],
        colors: {
          theme: '#e3f2fd',
          border: '#2196f3'
        },
        content: {
          motto: 'AI让学习更智能'
        },
        output: {
          format: '$字帖名-$字体-$字数字-$生成日期'
        },
        layout: {
          columnCount: 12,
          wordCount: 8,
          margin: '1.2cm'
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const configPath = path.join(system.copybooksDir, `${testCopybookName}.config.json`);
      const txtPath = path.join(system.copybooksDir, `${testCopybookName}.txt`);

      await fs.writeJson(configPath, config, { spaces: 2 });
      await fs.writeFile(txtPath, '人工智能 机器学习 深度学习 自然语言处理');
            
      console.log(chalk.green('   ✅ 测试字帖创建成功'));
    }

    // 5. 测试从txt生成json
    console.log(chalk.blue('5. 测试AI生成JSON数据'));
    const result = await system.generateJsonFromTxt(testCopybookName);
    console.log(chalk.green(`   ✅ ${result.message}\n`));

    // 6. 查看生成的数据
    console.log(chalk.blue('6. 查看生成的数据'));
    const fs = require('fs-extra');
    const path = require('path');
    const jsonPath = path.join(system.copybooksDir, `${testCopybookName}.json`);
    const data = await fs.readJson(jsonPath);
        
    console.log('   生成的数据:');
    data.forEach((item, index) => {
      console.log(`     ${index + 1}. ${item.word} -> ${item.pinyin}`);
    });

  } catch (error) {
    console.log(chalk.red(`   ❌ 测试失败: ${error.message}`));
  }

  console.log(chalk.cyan.bold('\n🎉 AI功能测试完成！'));
    
  if (!aiService.isConfigured()) {
    console.log(chalk.yellow('\n💡 提示: 要启用AI拼音生成，请运行 npm start 并选择 "🤖 AI配置"'));
  }
}

if (require.main === module) {
  testAIFeature().catch(error => {
    console.error(chalk.red('❌ 测试异常:'), error.message);
    process.exit(1);
  });
}

module.exports = testAIFeature; 