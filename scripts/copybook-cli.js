#!/usr/bin/env node

const chalk = require('chalk');
const inquirer = require('inquirer');
const CopybookSystem = require('./copybook-system');

class CopybookCLI {
  constructor() {
    this.system = new CopybookSystem();
  }

  async start() {
    console.clear();
    console.log(chalk.cyan.bold('📚 练字打印工具'));
    console.log(chalk.gray('优雅的字帖管理与编译系统\n'));

    while (true) { // eslint-disable-line no-constant-condition
      try {
        const action = await this.showMainMenu();
        if (action === 'exit') break;
        
        await this.handleAction(action);
        
        // 暂停，等待用户按键继续
        if (action !== 'exit') {
          await this.pressAnyKey();
        }
      } catch (error) {
        console.error(chalk.red('❌ 操作失败:'), error.message);
        await this.pressAnyKey();
      }
    }

    console.log(chalk.cyan('\n👋 再见！'));
  }

  async showMainMenu() {
    const copybooks = await this.system.getAllCopybooks();
    const statusText = copybooks.length > 0 
      ? `${copybooks.length} 个字帖 (${copybooks.filter(cb => cb.jsonExists).length} 个可编译)`
      : '暂无字帖';

    console.log(chalk.blue('📊 状态:'), chalk.gray(statusText));
    console.log();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '请选择操作:',
        choices: [
          { name: '📝 创建字帖', value: 'create' },
          { name: '📋 管理字帖', value: 'manage' },
          { name: '🔨 编译字帖', value: 'compile' },
          { name: '🚀 批量编译', value: 'compileAll' },
          new inquirer.Separator(),
          { name: '🤖 AI配置', value: 'aiConfig' },
          { name: '🚪 退出', value: 'exit' }
        ]
      }
    ]);

    return action;
  }

  async handleAction(action) {
    switch (action) {
    case 'create':
      await this.system.createCopybook();
      break;
    case 'manage':
      await this.showManageMenu();
      break;
    case 'compile':
      await this.showCompileMenu();
      break;
    case 'compileAll':
      await this.system.compileAll();
      break;
    case 'aiConfig':
      await this.showAIConfigMenu();
      break;
    }
  }

  async showManageMenu() {
    const copybooks = await this.system.getAllCopybooks();
    
    if (copybooks.length === 0) {
      console.log(chalk.yellow('⚠️  暂无字帖，请先创建字帖'));
      return;
    }

    const choices = copybooks.map(cb => ({
      name: `${cb.name} ${chalk.gray(`(${cb.wordCount}字)`)} ${cb.jsonExists ? chalk.green('✓') : chalk.yellow('○')}`,
      value: cb.name
    }));

    choices.push(new inquirer.Separator());
    choices.push({ name: '🔙 返回主菜单', value: 'back' });

    const { selectedCopybook } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCopybook',
        message: '选择要管理的字帖:',
        choices
      }
    ]);

    if (selectedCopybook === 'back') return;

    await this.showCopybookActions(selectedCopybook);
  }

  async showCopybookActions(name) {
    const copybooks = await this.system.getAllCopybooks();
    const copybook = copybooks.find(cb => cb.name === name);

    console.log(chalk.cyan(`\n📖 字帖: ${name}`));
    console.log(chalk.gray(`标题: ${copybook.config.title}`));
    console.log(chalk.gray(`字数: ${copybook.wordCount}`));
    console.log(chalk.gray(`字体: ${copybook.config.fonts.map(f => this.system.getFontDisplayName(f)).join(', ')}`));
    console.log();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '选择操作:',
        choices: [
          { name: '✏️  编辑汉字', value: 'editWords' },
          { name: '⚙️  编辑配置', value: 'editConfig' },
          { name: '🔄 刷新数据', value: 'refreshData' },
          { name: '🔨 编译此字帖', value: 'compile' },
          { name: '📊 查看详情', value: 'details' },
          new inquirer.Separator(),
          { name: '🗑️  删除字帖', value: 'delete' },
          { name: '🔙 返回', value: 'back' }
        ]
      }
    ]);

    switch (action) {
    case 'editWords':
      await this.system.editWords(name);
      break;
    case 'editConfig':
      await this.editCopybookConfig(name);
      break;
    case 'refreshData':
      await this.refreshCopybookData(name);
      break;
    case 'compile':
      await this.system.compileCopybook(name);
      break;
    case 'details':
      await this.showCopybookDetails(copybook);
      break;
    case 'delete':
      await this.system.deleteCopybook(name);
      break;
    case 'back':
      return;
    }
  }

  async editCopybookConfig(name) {
    const copybooks = await this.system.getAllCopybooks();
    const copybook = copybooks.find(cb => cb.name === name);
    const config = copybook.config;

    console.log(chalk.cyan(`\n⚙️  编辑字帖配置: ${name}`));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: '显示标题:',
        default: config.title
      },
      {
        type: 'input',
        name: 'description',
        message: '描述:',
        default: config.description
      },
      {
        type: 'checkbox',
        name: 'fonts',
        message: '选择字体:',
        choices: [
          { name: '楷书', value: 'kaishu', checked: config.fonts.includes('kaishu') },
          { name: '行书', value: 'xingshu', checked: config.fonts.includes('xingshu') },
          { name: '隶书', value: 'lishu', checked: config.fonts.includes('lishu') }
        ],
        validate: (choices) => choices.length > 0 || '至少选择一种字体'
      },
      {
        type: 'input',
        name: 'theme',
        message: '主题颜色:',
        default: config.colors.theme
      },
      {
        type: 'input',
        name: 'border',
        message: '边框颜色:',
        default: config.colors.border
      },
      {
        type: 'input',
        name: 'motto',
        message: '座右铭:',
        default: config.content.motto
      },
      {
        type: 'input',
        name: 'outputFormat',
        message: '输出文件名格式:',
        default: config.output.format,
        suffix: ' (可用变量: $字帖名, $字体, $字数字, $生成日期)'
      },
      {
        type: 'number',
        name: 'traceCount',
        message: '摹写次数:',
        default: config.layout?.traceCount || 1,
        validate: (input) => {
          if (!Number.isInteger(input) || input < 1 || input > 10) {
            return '摹写次数必须是1-10之间的整数';
          }
          return true;
        },
        suffix: ' (每个汉字的摹写练习次数，推荐1-3次)'
      }
    ]);

    // 更新配置
    const updatedConfig = {
      ...config,
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
        ...config.layout,
        traceCount: answers.traceCount
      },
      updatedAt: new Date().toISOString()
    };

    const configPath = copybook.configPath;
    const fs = require('fs-extra');
    await fs.writeJson(configPath, updatedConfig, { spaces: 2 });

    console.log(chalk.green('✅ 配置已保存'));
  }

  async showCopybookDetails(copybook) {
    console.log(chalk.cyan(`\n📊 字帖详情: ${copybook.name}`));
    console.log(chalk.blue('标题:'), copybook.config.title);
    console.log(chalk.blue('描述:'), copybook.config.description || '无');
    console.log(chalk.blue('字数:'), copybook.wordCount);
    console.log(chalk.blue('字体:'), copybook.config.fonts.map(f => this.system.getFontDisplayName(f)).join(', '));
    console.log(chalk.blue('主题色:'), copybook.config.colors.theme);
    console.log(chalk.blue('边框色:'), copybook.config.colors.border);
    console.log(chalk.blue('座右铭:'), copybook.config.content.motto);
    console.log(chalk.blue('输出格式:'), copybook.config.output.format);
    console.log(chalk.blue('摹写次数:'), copybook.config.layout?.traceCount || 1, '次');
    console.log(chalk.blue('创建时间:'), new Date(copybook.config.createdAt).toLocaleString());
    console.log(chalk.blue('更新时间:'), new Date(copybook.config.updatedAt).toLocaleString());
    
    console.log(chalk.blue('\n文件状态:'));
    console.log(`  ${copybook.name}.txt: ${copybook.txtExists ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`  ${copybook.name}.json: ${copybook.jsonExists ? chalk.green('✓') : chalk.red('✗')}`);
    console.log(`  ${copybook.name}.config.json: ${chalk.green('✓')}`);
  }

  async showCompileMenu() {
    const copybooks = await this.system.getAllCopybooks();
    const validCopybooks = copybooks.filter(cb => cb.jsonExists || cb.txtExists);
    
    if (validCopybooks.length === 0) {
      console.log(chalk.yellow('⚠️  没有可编译的字帖'));
      return;
    }

    const choices = validCopybooks.map(cb => ({
      name: `${cb.name} ${chalk.gray(`(${cb.config.fonts.map(f => this.system.getFontDisplayName(f)).join(', ')})`)}`,
      value: cb.name
    }));

    choices.push(new inquirer.Separator());
    choices.push({ name: '🔙 返回主菜单', value: 'back' });

    const { selectedCopybook } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedCopybook',
        message: '选择要编译的字帖:',
        choices
      }
    ]);

    if (selectedCopybook === 'back') return;

    const copybook = copybooks.find(cb => cb.name === selectedCopybook);
    
    if (copybook.config.fonts.length > 1) {
      const { compileMode } = await inquirer.prompt([
        {
          type: 'list',
          name: 'compileMode',
          message: '编译模式:',
          choices: [
            { name: '🎨 全部字体', value: 'all' },
            { name: '🖋️  选择字体', value: 'select' }
          ]
        }
      ]);

      if (compileMode === 'select') {
        const { selectedFonts } = await inquirer.prompt([
          {
            type: 'checkbox',
            name: 'selectedFonts',
            message: '选择要编译的字体:',
            choices: copybook.config.fonts.map(font => ({
              name: this.system.getFontDisplayName(font),
              value: font,
              checked: true
            })),
            validate: (choices) => choices.length > 0 || '至少选择一种字体'
          }
        ]);

        await this.system.compileCopybook(selectedCopybook, selectedFonts);
      } else {
        await this.system.compileCopybook(selectedCopybook);
      }
    } else {
      await this.system.compileCopybook(selectedCopybook);
    }
  }

  async showAIConfigMenu() {
    const AIService = require('./ai-service');
    const aiService = new AIService();
    const config = aiService.config;
    const summary = aiService.getConfigSummary();

    console.log(chalk.cyan('\n🤖 AI配置管理'));
    console.log(chalk.blue('当前状态:'));
    console.log(`  启用状态: ${summary.enabled ? chalk.green('✓ 已启用') : chalk.yellow('○ 未启用')}`);
    console.log(`  服务商: ${summary.provider}`);
    console.log(`  模型: ${summary.model}`);
    console.log(`  API密钥: ${summary.hasApiKey ? chalk.green('已配置') : chalk.red('未配置')}`);
    console.log(`  服务地址: ${summary.baseURL}`);
    console.log();

    const { action } = await inquirer.prompt([
      {
        type: 'list',
        name: 'action',
        message: '选择操作:',
        choices: [
          { name: '⚙️  基本配置', value: 'basicConfig' },
          { name: '📝 编辑提示词', value: 'editPrompt' },
          { name: '🧪 测试连接', value: 'testConnection' },
          { name: '📊 查看完整配置', value: 'viewConfig' },
          new inquirer.Separator(),
          { name: '🔙 返回主菜单', value: 'back' }
        ]
      }
    ]);

    switch (action) {
    case 'basicConfig':
      await this.configureAIBasic(aiService);
      break;
    case 'editPrompt':
      await this.editAIPrompt(aiService);
      break;
    case 'testConnection':
      await this.testAIConnection(aiService);
      break;
    case 'viewConfig':
      await this.viewAIConfig(config);
      break;
    case 'back':
      return;
    }
  }

  async configureAIBasic(aiService) {
    const config = aiService.config;

    console.log(chalk.cyan('\n⚙️  AI基本配置'));
    console.log(chalk.gray('配置OpenAI兼容的API服务'));

    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'enabled',
        message: '启用AI拼音生成?',
        default: config.enabled
      },
      {
        type: 'list',
        name: 'provider',
        message: '选择服务商:',
        choices: [
          { name: 'OpenAI', value: 'openai' },
          { name: 'Azure OpenAI', value: 'azure' },
          { name: '其他兼容服务', value: 'other' }
        ],
        default: config.provider,
        when: (answers) => answers.enabled
      },
      {
        type: 'input',
        name: 'apiKey',
        message: 'API密钥:',
        default: config.apiKey,
        when: (answers) => answers.enabled,
        validate: (input) => input.trim() !== '' || '请输入API密钥'
      },
      {
        type: 'input',
        name: 'baseURL',
        message: 'API基础URL:',
        default: config.baseURL,
        when: (answers) => answers.enabled
      },
      {
        type: 'input',
        name: 'model',
        message: '模型名称:',
        default: config.model,
        when: (answers) => answers.enabled
      },
      {
        type: 'number',
        name: 'timeout',
        message: '请求超时时间(毫秒):',
        default: config.timeout,
        when: (answers) => answers.enabled
      }
    ]);

    const updatedConfig = {
      ...config,
      enabled: answers.enabled,
      provider: answers.provider || config.provider,
      apiKey: answers.apiKey || config.apiKey,
      baseURL: answers.baseURL || config.baseURL,
      model: answers.model || config.model,
      timeout: answers.timeout || config.timeout
    };

    if (aiService.saveConfig(updatedConfig)) {
      console.log(chalk.green('✅ AI配置已保存'));
    } else {
      console.log(chalk.red('❌ 保存配置失败'));
    }
  }

  async editAIPrompt(aiService) {
    const config = aiService.config;

    console.log(chalk.cyan('\n📝 编辑AI提示词'));
    console.log(chalk.gray('自定义AI生成拼音的提示词模板'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'system',
        message: '系统提示词:',
        default: config.prompt.system
      },
      {
        type: 'editor',
        name: 'template',
        message: '用户提示词模板:',
        default: config.prompt.template
      }
    ]);

    const updatedConfig = {
      ...config,
      prompt: {
        system: answers.system,
        template: answers.template
      }
    };

    if (aiService.saveConfig(updatedConfig)) {
      console.log(chalk.green('✅ 提示词已保存'));
    } else {
      console.log(chalk.red('❌ 保存提示词失败'));
    }
  }

  async testAIConnection(aiService) {
    console.log(chalk.cyan('\n🧪 测试AI连接'));
    
    if (!aiService.isConfigured()) {
      console.log(chalk.yellow('⚠️  AI服务未配置，请先完成基本配置'));
      return;
    }

    console.log(chalk.blue('正在测试连接...'));
    
    try {
      const result = await aiService.testConnection();
      if (result.success) {
        console.log(chalk.green('✅ 连接测试成功'));
      } else {
        console.log(chalk.red('❌ 连接测试失败:'), result.message);
      }
    } catch (error) {
      console.log(chalk.red('❌ 测试异常:'), error.message);
    }
  }

  async viewAIConfig(config) {
    console.log(chalk.cyan('\n📊 完整AI配置'));
    console.log(chalk.blue('基本设置:'));
    console.log(`  启用: ${config.enabled}`);
    console.log(`  服务商: ${config.provider}`);
    console.log(`  模型: ${config.model}`);
    console.log(`  API密钥: ${config.apiKey ? '***已配置***' : '未配置'}`);
    console.log(`  基础URL: ${config.baseURL}`);
    console.log(`  超时时间: ${config.timeout}ms`);
    console.log(`  重试次数: ${config.maxRetries}`);
    
    console.log(chalk.blue('\n提示词设置:'));
    console.log(`  系统提示词: ${config.prompt.system}`);
    console.log(`  模板长度: ${config.prompt.template.length} 字符`);
    
    console.log(chalk.blue('\n备用方案:'));
    console.log(`  启用备用: ${config.fallback.enabled}`);
    console.log(`  备用消息: ${config.fallback.message}`);
  }

  async refreshCopybookData(name) {
    console.log(chalk.cyan(`\n🔄 刷新字帖数据: ${name}`));
    
    const copybooks = await this.system.getAllCopybooks();
    const copybook = copybooks.find(cb => cb.name === name);
    
    if (!copybook) {
      console.log(chalk.red('❌ 字帖不存在'));
      return;
    }

    // 检查模板类型
    const templateType = copybook.config.templateType || 'py';
    if (templateType === 'dl_hh') {
      console.log(chalk.blue('📝 对临字帖直接使用txt文件，无需生成JSON数据'));
      console.log(chalk.green('✅ 对临字帖已就绪，可直接编译'));
      return;
    }

    // 检查txt文件是否存在
    if (!copybook.txtExists) {
      console.log(chalk.yellow('⚠️  txt文件不存在，无法刷新数据'));
      return;
    }

    try {
      // 显示当前状态
      const fs = require('fs-extra');
      const txtContent = await fs.readFile(copybook.txtPath, 'utf8');
      const AIService = require('./ai-service');
      const aiService = new AIService();
      
      // 清理并提取汉字
      const characters = aiService.extractChineseCharacters(txtContent);
      
      console.log(chalk.blue('当前txt内容预览:'));
      const preview = txtContent.substring(0, 100) + (txtContent.length > 100 ? '...' : '');
      console.log(chalk.gray(`  "${preview}"`));
      
      if (characters.length === 0) {
        console.log(chalk.yellow('⚠️  txt文件中未找到汉字，无法生成数据'));
        return;
      }
      
      console.log(chalk.blue(`提取到的汉字: ${characters.length} 个`));
      console.log(chalk.gray(`  ${characters.slice(0, 15).join('、')}${characters.length > 15 ? '...' : ''}`));
      
      // 询问是否继续
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: '确认要根据txt文件重新生成json数据吗？',
          default: true
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow('已取消刷新操作'));
        return;
      }

      // 显示旧数据（如果存在）
      if (copybook.jsonExists) {
        const oldData = await fs.readJson(copybook.jsonPath);
        console.log(chalk.blue(`\n原有数据: ${oldData.length} 个汉字`));
        if (oldData.length > 0) {
          const oldPreview = oldData.slice(0, 5).map(item => `${item.word}(${item.pinyin})`).join('、');
          const oldSuffix = oldData.length > 5 ? '...' : '';
          console.log(chalk.gray(`  ${oldPreview}${oldSuffix}`));
        }
      }

      // 执行刷新
      console.log(chalk.blue('\n🔄 正在刷新数据...'));
      const result = await this.system.generateJsonFromTxt(name);
      
      // 根据结果显示不同的消息
      if (result.success) {
        if (result.wordCount > 0) {
          console.log(chalk.green(`✅ ${result.message}`));
          
          // 显示新数据预览
          const newData = await fs.readJson(copybook.jsonPath);
          console.log(chalk.blue('\n新数据预览:'));
          newData.slice(0, 10).forEach((item, index) => {
            const pinyinDisplay = item.pinyin.startsWith('pinyin_') 
              ? chalk.yellow(item.pinyin) 
              : chalk.green(item.pinyin);
            console.log(chalk.gray(`  ${index + 1}. ${item.word} -> ${pinyinDisplay}`));
          });
          if (newData.length > 10) {
            console.log(chalk.gray(`  ... 还有 ${newData.length - 10} 个汉字`));
          }
          
          // 如果有占位符拼音，给出提示
          const placeholderCount = newData.filter(item => item.pinyin.startsWith('pinyin_')).length;
          if (placeholderCount > 0) {
            console.log(chalk.yellow(`\n💡 提示: ${placeholderCount} 个汉字使用了占位符拼音，您可以:`));
            console.log(chalk.gray('   1. 检查AI配置是否正确'));
            console.log(chalk.gray('   2. 手动编辑json文件补充拼音'));
            console.log(chalk.gray('   3. 重新配置AI服务后再次刷新'));
          }
        } else {
          console.log(chalk.yellow(`⚠️  ${result.message}`));
        }
      } else {
        console.log(chalk.red(`❌ ${result.message}`));
        console.log(chalk.gray('\n💡 可能的解决方案:'));
        console.log(chalk.gray('   1. 检查txt文件是否包含汉字'));
        console.log(chalk.gray('   2. 检查AI配置是否正确'));
        console.log(chalk.gray('   3. 检查网络连接是否正常'));
      }

    } catch (error) {
      console.log(chalk.red('❌ 刷新数据时发生异常:'), error.message);
      console.log(chalk.gray('\n💡 建议:'));
      console.log(chalk.gray('   1. 检查文件权限'));
      console.log(chalk.gray('   2. 确保txt文件格式正确'));
      console.log(chalk.gray('   3. 重启程序后重试'));
    }
  }

  async pressAnyKey() {
    console.log();
    await inquirer.prompt([
      {
        type: 'input',
        name: 'continue',
        message: chalk.gray('按 Enter 继续...'),
        prefix: ''
      }
    ]);
    console.clear();
  }
}

// 命令行接口
async function main() {
  const cli = new CopybookCLI();
  await cli.start();
}

if (require.main === module) {
  main().catch(error => {
    console.error(chalk.red('❌ 程序异常:'), error.message);
    process.exit(1);
  });
}

module.exports = CopybookCLI; 