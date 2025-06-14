#!/usr/bin/env node

const CopybookSystem = require('./copybook-system');
const chalk = require('chalk');

async function testSystem() {
  console.log(chalk.cyan('🧪 测试新字帖系统...'));
  
  const system = new CopybookSystem();
  
  try {
    // 1. 获取所有字帖
    console.log(chalk.blue('\n1. 获取字帖列表...'));
    const copybooks = await system.getAllCopybooks();
    console.log(chalk.green(`✅ 找到 ${copybooks.length} 个字帖`));
    
    copybooks.forEach(cb => {
      console.log(chalk.gray(`  - ${cb.name} (${cb.wordCount}字) [${cb.config.fonts.join(', ')}]`));
    });
    
    // 2. 测试编译第一个字帖
    if (copybooks.length > 0) {
      const firstCopybook = copybooks[0];
      console.log(chalk.blue(`\n2. 测试编译: ${firstCopybook.name}`));
      
      const results = await system.compileCopybook(firstCopybook.name, [firstCopybook.config.fonts[0]]);
      
      if (results.length > 0 && results[0].success) {
        console.log(chalk.green(`✅ 编译成功: ${results[0].outputName}`));
      } else {
        console.log(chalk.red('❌ 编译失败'));
      }
    }
    
    console.log(chalk.green('\n🎉 测试完成！'));
    
  } catch (error) {
    console.error(chalk.red('❌ 测试失败:'), error.message);
    console.error(error.stack);
  }
}

if (require.main === module) {
  testSystem();
} 