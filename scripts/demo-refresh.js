#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const CopybookSystem = require('./copybook-system');

async function demoRefreshFeature() {
    console.log(chalk.cyan.bold('🎬 刷新数据功能演示\n'));
    console.log(chalk.gray('这个演示将展示如何使用刷新数据功能\n'));

    const system = new CopybookSystem();
    const demoCopybookName = '刷新演示字帖';

    try {
        // 1. 创建演示字帖
        console.log(chalk.blue('📝 步骤1: 创建演示字帖'));
        
        const config = {
            title: '刷新数据功能演示',
            description: '演示如何使用刷新数据功能',
            fonts: ['kaishu', 'xingshu'],
            colors: {
                theme: '#e8f5e8',
                border: '#4caf50'
            },
            content: {
                motto: '学而时习之，不亦说乎'
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

        const configPath = path.join(system.copybooksDir, `${demoCopybookName}.config.json`);
        const txtPath = path.join(system.copybooksDir, `${demoCopybookName}.txt`);
        const jsonPath = path.join(system.copybooksDir, `${demoCopybookName}.json`);

        await fs.writeJson(configPath, config, { spaces: 2 });
        await fs.writeFile(txtPath, '学而时习之 不亦说乎');
        
        console.log(chalk.green('   ✅ 演示字帖创建成功'));
        console.log(chalk.gray(`   📁 配置文件: ${demoCopybookName}.config.json`));
        console.log(chalk.gray(`   📄 文本文件: ${demoCopybookName}.txt`));

        // 2. 初次生成数据
        console.log(chalk.blue('\n📊 步骤2: 初次生成JSON数据'));
        let result = await system.generateJsonFromTxt(demoCopybookName);
        console.log(chalk.green(`   ✅ ${result.message}`));

        let data = await fs.readJson(jsonPath);
        console.log(chalk.gray('   📋 初始数据:'));
        data.forEach((item, index) => {
            console.log(chalk.gray(`      ${index + 1}. ${item.word} -> ${item.pinyin}`));
        });

        // 3. 模拟用户编辑txt文件
        console.log(chalk.blue('\n✏️  步骤3: 模拟用户编辑txt文件'));
        console.log(chalk.gray('   假设用户直接编辑了txt文件，添加了更多汉字...'));
        
        const newContent = `学而时习之 不亦说乎
有朋自远方来 不亦乐乎
人不知而不愠 不亦君子乎`;
        
        await fs.writeFile(txtPath, newContent);
        console.log(chalk.green('   ✅ txt文件已更新'));
        console.log(chalk.gray('   📝 新内容:'));
        console.log(chalk.gray(`      "${newContent.replace(/\n/g, ' | ')}"`));

        // 4. 演示刷新过程
        console.log(chalk.blue('\n🔄 步骤4: 刷新JSON数据'));
        console.log(chalk.gray('   这就是用户在界面中选择"🔄 刷新数据"时发生的过程...'));
        
        // 显示刷新前的状态
        console.log(chalk.yellow('\n   📊 刷新前状态:'));
        console.log(chalk.gray(`      汉字数量: ${data.length} 个`));
        console.log(chalk.gray(`      最后更新: ${config.updatedAt}`));

        // 执行刷新
        result = await system.generateJsonFromTxt(demoCopybookName);
        
        // 显示刷新后的状态
        data = await fs.readJson(jsonPath);
        const updatedConfig = await fs.readJson(configPath);
        
        console.log(chalk.green('\n   ✅ 数据刷新完成!'));
        console.log(chalk.yellow('   📊 刷新后状态:'));
        console.log(chalk.gray(`      汉字数量: ${data.length} 个`));
        console.log(chalk.gray(`      最后更新: ${updatedConfig.updatedAt}`));

        console.log(chalk.gray('\n   📋 刷新后的完整数据:'));
        data.forEach((item, index) => {
            console.log(chalk.gray(`      ${index + 1}. ${item.word} -> ${item.pinyin}`));
        });

        // 5. 展示实际使用场景
        console.log(chalk.blue('\n💡 步骤5: 实际使用场景'));
        console.log(chalk.gray('   在实际使用中，您可以:'));
        console.log(chalk.gray('   1. 用任何文本编辑器打开 .txt 文件'));
        console.log(chalk.gray('   2. 添加、删除或修改汉字'));
        console.log(chalk.gray('   3. 保存文件'));
        console.log(chalk.gray('   4. 在字帖管理界面选择"🔄 刷新数据"'));
        console.log(chalk.gray('   5. 系统会自动重新生成拼音数据'));

        // 6. 编译演示
        console.log(chalk.blue('\n🔨 步骤6: 编译演示字帖'));
        console.log(chalk.gray('   现在可以编译这个字帖了...'));
        
        const results = await system.compileCopybook(demoCopybookName, ['kaishu']);
        if (results[0].success) {
            console.log(chalk.green(`   ✅ 编译成功: ${results[0].outputName}`));
        }

        console.log(chalk.cyan.bold('\n🎉 刷新数据功能演示完成！'));
        console.log(chalk.green('\n✨ 主要优势:'));
        console.log(chalk.gray('   • 支持外部编辑器编辑汉字'));
        console.log(chalk.gray('   • 自动提取汉字并去重'));
        console.log(chalk.gray('   • AI智能生成拼音'));
        console.log(chalk.gray('   • 安全的确认机制'));
        console.log(chalk.gray('   • 实时预览和对比'));

        // 询问是否保留演示数据
        const inquirer = require('inquirer');
        const { keepDemo } = await inquirer.prompt([
            {
                type: 'confirm',
                name: 'keepDemo',
                message: '是否保留演示字帖？',
                default: false
            }
        ]);

        if (!keepDemo) {
            await fs.remove(configPath);
            await fs.remove(txtPath);
            await fs.remove(jsonPath);
            console.log(chalk.green('\n🧹 演示数据已清理'));
        } else {
            console.log(chalk.blue('\n📚 演示字帖已保留，您可以在主界面中查看和管理'));
        }

    } catch (error) {
        console.log(chalk.red(`❌ 演示失败: ${error.message}`));
        console.error(error);
    }
}

if (require.main === module) {
    demoRefreshFeature().catch(error => {
        console.error(chalk.red('❌ 演示异常:'), error.message);
        process.exit(1);
    });
}

module.exports = demoRefreshFeature; 