#!/usr/bin/env node

const CopybookSystem = require('./copybook-system');
const chalk = require('chalk');

async function testBatchCompile() {
  console.log(chalk.cyan('🧪 测试批量编译...'));
  
  const system = new CopybookSystem();
  
  try {
    const results = await system.compileAll(false); // 不使用多线程
    
    console.log(chalk.green(`\n🎉 批量编译完成！生成了 ${results.filter(r => r.success).length} 个文件`));
    
  } catch (error) {
    console.error(chalk.red('❌ 批量编译失败:'), error.message);
  }
}

if (require.main === module) {
  testBatchCompile();
} 