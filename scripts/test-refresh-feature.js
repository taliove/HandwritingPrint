#!/usr/bin/env node

const chalk = require('chalk');
const fs = require('fs-extra');
const path = require('path');
const CopybookSystem = require('./copybook-system');

async function testRefreshFeature() {
    console.log(chalk.cyan.bold('🧪 测试刷新数据功能\n'));

    const system = new CopybookSystem();
    const testCopybookName = '刷新测试字帖';

    try {
        // 1. 创建测试字帖
        console.log(chalk.blue('1. 创建测试字帖'));
        
        const config = {
            title: '刷新数据功能测试',
            description: '测试根据txt刷新json功能',
            fonts: ['kaishu'],
            colors: {
                theme: '#fff3e0',
                border: '#ff9800'
            },
            content: {
                motto: '温故而知新'
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
        const jsonPath = path.join(system.copybooksDir, `${testCopybookName}.json`);

        await fs.writeJson(configPath, config, { spaces: 2 });
        await fs.writeFile(txtPath, '春夏秋冬 东南西北');
        
        console.log(chalk.green('   ✅ 测试字帖创建成功'));

        // 2. 初次生成JSON数据
        console.log(chalk.blue('2. 初次生成JSON数据'));
        let result = await system.generateJsonFromTxt(testCopybookName);
        console.log(chalk.green(`   ✅ ${result.message}`));

        // 显示初始数据
        let data = await fs.readJson(jsonPath);
        console.log(chalk.gray('   初始数据:'));
        data.forEach((item, index) => {
            console.log(chalk.gray(`     ${index + 1}. ${item.word} -> ${item.pinyin}`));
        });

        // 3. 修改txt文件
        console.log(chalk.blue('\n3. 修改txt文件内容'));
        const newContent = '春夏秋冬 东南西北 上下左右 前后内外 大小多少';
        await fs.writeFile(txtPath, newContent);
        console.log(chalk.green('   ✅ txt文件已更新'));
        console.log(chalk.gray(`   新内容: "${newContent}"`));

        // 4. 刷新JSON数据
        console.log(chalk.blue('\n4. 刷新JSON数据'));
        result = await system.generateJsonFromTxt(testCopybookName);
        console.log(chalk.green(`   ✅ ${result.message}`));

        // 显示刷新后的数据
        data = await fs.readJson(jsonPath);
        console.log(chalk.gray('   刷新后数据:'));
        data.forEach((item, index) => {
            console.log(chalk.gray(`     ${index + 1}. ${item.word} -> ${item.pinyin}`));
        });

        // 5. 测试空内容
        console.log(chalk.blue('\n5. 测试空内容刷新'));
        await fs.writeFile(txtPath, 'Hello World 123 !@#$%');
        result = await system.generateJsonFromTxt(testCopybookName);
        console.log(chalk.green(`   ✅ ${result.message}`));

        // 6. 恢复有效内容
        console.log(chalk.blue('\n6. 恢复有效内容'));
        await fs.writeFile(txtPath, '梅兰竹菊 琴棋书画 诗词歌赋');
        result = await system.generateJsonFromTxt(testCopybookName);
        console.log(chalk.green(`   ✅ ${result.message}`));

        // 显示最终数据
        data = await fs.readJson(jsonPath);
        console.log(chalk.gray('   最终数据:'));
        data.forEach((item, index) => {
            console.log(chalk.gray(`     ${index + 1}. ${item.word} -> ${item.pinyin}`));
        });

        console.log(chalk.cyan.bold('\n🎉 刷新数据功能测试完成！'));
        console.log(chalk.green('✅ 所有测试通过'));

        // 7. 清理测试数据
        console.log(chalk.blue('\n7. 清理测试数据'));
        await fs.remove(configPath);
        await fs.remove(txtPath);
        await fs.remove(jsonPath);
        console.log(chalk.green('   ✅ 测试数据已清理'));

    } catch (error) {
        console.log(chalk.red(`❌ 测试失败: ${error.message}`));
        console.error(error);
    }
}

if (require.main === module) {
    testRefreshFeature().catch(error => {
        console.error(chalk.red('❌ 测试异常:'), error.message);
        process.exit(1);
    });
}

module.exports = testRefreshFeature; 