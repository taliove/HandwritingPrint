#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');
const inquirer = require('inquirer');
const { execSync } = require('child_process');
const { Worker } = require('worker_threads');
const AIService = require('./ai-service');

class CopybookSystem {
  constructor() {
    this.copybooksDir = path.join(__dirname, '../copybooks');
    this.templatesDir = path.join(__dirname, '../src/templates');
    this.outputDir = path.join(__dirname, '../output');
    this.aiService = new AIService();
    this.ensureDirectories();
  }

  async ensureDirectories() {
    await fs.ensureDir(this.copybooksDir);
    await fs.ensureDir(this.outputDir);
  }

  // 获取所有字帖
  async getAllCopybooks() {
    const files = await fs.readdir(this.copybooksDir);
    const copybooks = [];

    for (const file of files) {
      if (file.endsWith('.config.json')) {
        const name = file.replace('.config.json', '');
        const configPath = path.join(this.copybooksDir, file);
        const txtPath = path.join(this.copybooksDir, `${name}.txt`);
        const jsonPath = path.join(this.copybooksDir, `${name}.json`);

        try {
          const config = await fs.readJson(configPath);
          const txtExists = await fs.pathExists(txtPath);
          const jsonExists = await fs.pathExists(jsonPath);
          
          let wordCount = 0;
          if (jsonExists) {
            const data = await fs.readJson(jsonPath);
            wordCount = Array.isArray(data) ? data.length : 0;
          }

          copybooks.push({
            name,
            config,
            txtExists,
            jsonExists,
            wordCount,
            configPath,
            txtPath,
            jsonPath
          });
        } catch (error) {
          console.warn(chalk.yellow(`⚠️  跳过损坏的配置文件: ${file}`));
        }
      }
    }

    return copybooks;
  }

  // 创建新字帖
  async createCopybook() {
    console.log(chalk.cyan('\n📝 创建新字帖'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'name',
        message: '字帖名称:',
        validate: (input) => {
          if (!input.trim()) return '请输入字帖名称';
          if (input.includes('/') || input.includes('\\')) return '名称不能包含路径分隔符';
          return true;
        }
      },
      {
        type: 'input',
        name: 'title',
        message: '显示标题:',
        default: (answers) => answers.name
      },
      {
        type: 'input',
        name: 'description',
        message: '描述 (可选):',
        default: ''
      },
      {
        type: 'checkbox',
        name: 'fonts',
        message: '选择字体:',
        choices: [
          { name: '楷书', value: 'kaishu', checked: true },
          { name: '行书', value: 'xingshu' },
          { name: '隶书', value: 'lishu' }
        ],
        validate: (choices) => choices.length > 0 || '至少选择一种字体'
      },
      {
        type: 'input',
        name: 'theme',
        message: '主题颜色:',
        default: '#b2f2bb'
      },
      {
        type: 'input',
        name: 'border',
        message: '边框颜色:',
        default: '#40c057'
      },
      {
        type: 'input',
        name: 'motto',
        message: '座右铭:',
        default: '业精于勤而荒于嬉，行成于思而毁于随'
      },
      {
        type: 'input',
        name: 'outputFormat',
        message: '输出文件名格式:',
        default: '$字帖名-$字体-$字数字-$生成日期',
        suffix: ' (可用变量: $字帖名, $字体, $字数字, $生成日期)'
      },
      {
        type: 'confirm',
        name: 'inputWords',
        message: '现在输入汉字?',
        default: false
      }
    ]);

    // 创建配置文件
    const config = {
      title: answers.title,
      description: answers.description,
      fonts: answers.fonts,
      colors: {
        theme: answers.theme,
        border: answers.border
      },
      content: {
        motto: answers.motto
      },
      output: {
        format: answers.outputFormat
      },
      layout: {
        columnCount: 12,
        wordCount: 8,
        margin: '1.2cm'
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const configPath = path.join(this.copybooksDir, `${answers.name}.config.json`);
    const txtPath = path.join(this.copybooksDir, `${answers.name}.txt`);

    await fs.writeJson(configPath, config, { spaces: 2 });
    await fs.writeFile(txtPath, '');

    console.log(chalk.green(`✅ 字帖 "${answers.name}" 创建成功`));

    if (answers.inputWords) {
      await this.editWords(answers.name);
    }

    return answers.name;
  }

  // 编辑汉字
  async editWords(name) {
    const txtPath = path.join(this.copybooksDir, `${name}.txt`);
    
    console.log(chalk.cyan(`\n✏️  编辑字帖 "${name}" 的汉字`));
    console.log(chalk.gray('提示: 每行一个汉字，或用空格分隔多个汉字'));
    
    const currentContent = await fs.readFile(txtPath, 'utf8').catch(() => '');
    
    const { words } = await inquirer.prompt([
      {
        type: 'editor',
        name: 'words',
        message: '请输入汉字:',
        default: currentContent
      }
    ]);

    await fs.writeFile(txtPath, words);
    await this.generateJsonFromTxt(name);
    
    console.log(chalk.green('✅ 汉字保存成功'));
  }

  // 从txt生成json
  async generateJsonFromTxt(name) {
    const txtPath = path.join(this.copybooksDir, `${name}.txt`);
    const jsonPath = path.join(this.copybooksDir, `${name}.json`);

    try {
      const content = await fs.readFile(txtPath, 'utf8');
      
      // 提取汉字，保留重复字符
      const characters = this.aiService.extractChineseCharacters(content);
      
      if (characters.length === 0) {
        console.log(chalk.yellow('⚠️  未找到汉字'));
        await fs.writeJson(jsonPath, [], { spaces: 2 });
        return { success: true, wordCount: 0, message: '未找到汉字，生成了空数据文件' };
      }

      console.log(chalk.blue(`📝 找到 ${characters.length} 个汉字: ${characters.slice(0, 10).join('、')}${characters.length > 10 ? '...' : ''}`));

      // 使用AI生成拼音
      let pinyinData;
      let hasError = false;
      let errorMessage = '';
      
      try {
        pinyinData = await this.aiService.generatePinyin(characters, true);
        
        // 检查是否有占位符拼音（表示部分失败）
        const placeholderCount = pinyinData.filter(item => item.pinyin.startsWith('pinyin_')).length;
        if (placeholderCount > 0) {
          console.log(chalk.yellow(`⚠️  ${placeholderCount} 个汉字使用了占位符拼音，建议检查AI配置`));
        }
        
      } catch (error) {
        hasError = true;
        errorMessage = error.message;
        console.error(chalk.red('❌ AI拼音生成失败:'), error.message);
        // 使用备用方案
        pinyinData = characters.map(char => ({ character: char, pinyin: '' }));
        console.log(chalk.yellow('🔄 已使用空拼音占位符，您可以后续手动编辑'));
      }

      // 转换为字帖格式
      const chars = pinyinData.map(item => ({
        word: item.character,
        pinyin: item.pinyin
      }));

      await fs.writeJson(jsonPath, chars, { spaces: 2 });
      
      // 更新配置文件的更新时间
      const configPath = path.join(this.copybooksDir, `${name}.config.json`);
      const config = await fs.readJson(configPath);
      config.updatedAt = new Date().toISOString();
      await fs.writeJson(configPath, config, { spaces: 2 });

      // 返回详细结果
      const result = {
        success: !hasError,
        wordCount: chars.length,
        message: hasError 
          ? `数据生成完成，但拼音生成失败: ${errorMessage}` 
          : `成功生成 ${chars.length} 个汉字的数据`
      };

      return result;
    } catch (error) {
      console.error(chalk.red('❌ 生成JSON失败:'), error.message);
      return { success: false, wordCount: 0, message: `生成失败: ${error.message}` };
    }
  }

  // 编译字帖
  async compileCopybook(name, fonts = null) {
    const copybooks = await this.getAllCopybooks();
    const copybook = copybooks.find(cb => cb.name === name);
    
    if (!copybook) {
      throw new Error(`字帖 "${name}" 不存在`);
    }

    if (!copybook.jsonExists) {
      console.log(chalk.yellow('⚠️  正在生成数据文件...'));
      await this.generateJsonFromTxt(name);
    }

    const targetFonts = fonts || copybook.config.fonts;
    const results = [];

    for (const font of targetFonts) {
      console.log(chalk.blue(`🖋️  编译字体: ${this.getFontDisplayName(font)}`));
      
      try {
        const outputName = this.generateOutputFilename(copybook, font);
        const result = await this.compileWithFont(copybook, font, outputName);
        results.push({ font, success: true, outputName, ...result });
        console.log(chalk.green(`✅ ${outputName} 编译完成`));
      } catch (error) {
        results.push({ font, success: false, error: error.message });
        console.error(chalk.red(`❌ ${this.getFontDisplayName(font)} 编译失败: ${error.message}`));
      }
    }

    return results;
  }

  // 生成输出文件名
  generateOutputFilename(copybook, font) {
    const format = copybook.config.output?.format || '$字帖名-$字体';
    const date = new Date().toISOString().split('T')[0];
    
    return format
      .replace(/\$字帖名/g, copybook.name)
      .replace(/\$字体/g, this.getFontDisplayName(font))
      .replace(/\$字数/g, copybook.wordCount.toString())
      .replace(/\$生成日期/g, date) + '.pdf';
  }

  // 获取字体显示名称
  getFontDisplayName(font) {
    const fontNames = {
      kaishu: '楷书',
      xingshu: '行书',
      lishu: '隶书'
    };
    return fontNames[font] || font;
  }

  // 使用指定字体编译
  async compileWithFont(copybook, font, outputName) {
    // 更新字体配置
    await this.updateFontConfig(font);
    
    // 生成临时typ文件到src目录
    const typContent = this.generateTypContent(copybook, font);
    const tempTypPath = path.join(__dirname, '../src', `${copybook.name}_${font}.typ`);
    const outputPath = path.join(this.outputDir, outputName);

    await fs.writeFile(tempTypPath, typContent);

    try {
      const rootDir = path.join(__dirname, '..');
      execSync(`typst compile --root "${rootDir}" "${tempTypPath}" "${outputPath}"`, {
        stdio: 'pipe',
        cwd: rootDir
      });

      // 清理临时文件
      await fs.remove(tempTypPath);

      return { outputPath };
    } catch (error) {
      // 清理临时文件
      await fs.remove(tempTypPath).catch(() => {});
      throw error;
    }
  }

  // 更新字体配置
  async updateFontConfig(font) {
    const ConfigManager = require('./config-manager');
    const configManager = new ConfigManager();
    
    try {
      await configManager.setFontSet(font);
      await configManager.updateTypstConfig();
    } catch (error) {
      console.warn(chalk.yellow(`⚠️  字体配置更新失败: ${error.message}`));
    }
  }

  // 生成typ文件内容
  generateTypContent(copybook, font) {
    return `#import "templates/conf_py.typ": *
#import "templates/config.typ": *

#show: conf.with(
  margin: ${copybook.config.layout?.margin || '1.2cm'}
)

#let data = json("../copybooks/${copybook.name}.json")
#let title = "${copybook.config.title}"
#let sign = "${copybook.config.content?.motto || '业精于勤而荒于嬉，行成于思而毁于随'}"
#let chunked = data.chunks(${copybook.config.layout?.wordCount || 8})

// 生成所有页面
#for chunk in chunked {
   pages(title, sign, chunk, ${copybook.config.layout?.wordTotal || 48}, ${copybook.config.layout?.columnCount || 12})
}`;
  }

  // 批量编译
  async compileAll(useMultithread = true) {
    const copybooks = await this.getAllCopybooks();
    const validCopybooks = copybooks.filter(cb => cb.jsonExists || cb.txtExists);

    if (validCopybooks.length === 0) {
      console.log(chalk.yellow('⚠️  没有可编译的字帖'));
      return [];
    }

    console.log(chalk.cyan(`🚀 开始批量编译 ${validCopybooks.length} 个字帖...`));

    const allResults = [];
    let successCount = 0;
    let totalFiles = 0;

    if (useMultithread && validCopybooks.length > 1) {
      // 多线程编译
      console.log(chalk.blue('🔄 使用多线程编译模式'));
      // TODO: 实现多线程编译
    }

    // 单线程编译
    for (const copybook of validCopybooks) {
      console.log(chalk.cyan(`\n📖 编译: ${copybook.name}`));
      
      try {
        const results = await this.compileCopybook(copybook.name);
        allResults.push(...results);
        
        const successResults = results.filter(r => r.success);
        successCount += successResults.length;
        totalFiles += results.length;
      } catch (error) {
        console.error(chalk.red(`❌ ${copybook.name} 编译失败: ${error.message}`));
        totalFiles += 1;
      }
    }

    this.printCompileSummary(successCount, totalFiles, allResults);
    return allResults;
  }

  // 打印编译统计
  printCompileSummary(successCount, totalCount, results) {
    console.log(chalk.cyan('\n📊 编译统计:'));
    console.log(`   总文件数: ${totalCount}`);
    console.log(`   成功: ${chalk.green(successCount)}`);
    console.log(`   失败: ${chalk.red(totalCount - successCount)}`);
    
    if (successCount > 0) {
      console.log(chalk.cyan('\n📄 生成的文件:'));
      results.filter(r => r.success).forEach(result => {
        console.log(chalk.green(`  ✅ ${result.outputName}`));
      });
    }
    
    if (successCount === totalCount) {
      console.log(chalk.green('\n🎉 所有文件编译完成！'));
    } else {
      console.log(chalk.yellow('\n⚠️  部分文件编译失败，请检查错误信息'));
    }
  }

  // 删除字帖
  async deleteCopybook(name) {
    const configPath = path.join(this.copybooksDir, `${name}.config.json`);
    const txtPath = path.join(this.copybooksDir, `${name}.txt`);
    const jsonPath = path.join(this.copybooksDir, `${name}.json`);

    const filesToDelete = [configPath, txtPath, jsonPath];
    const existingFiles = [];

    for (const file of filesToDelete) {
      if (await fs.pathExists(file)) {
        existingFiles.push(file);
      }
    }

    if (existingFiles.length === 0) {
      throw new Error(`字帖 "${name}" 不存在`);
    }

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确定删除字帖 "${name}" 吗？这将删除 ${existingFiles.length} 个文件`,
        default: false
      }
    ]);

    if (confirm) {
      for (const file of existingFiles) {
        await fs.remove(file);
      }
      console.log(chalk.green(`✅ 字帖 "${name}" 已删除`));
    } else {
      console.log(chalk.yellow('❌ 取消删除'));
    }
  }
}

module.exports = CopybookSystem; 