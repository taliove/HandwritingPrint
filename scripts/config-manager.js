#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class ConfigManager {
  constructor() {
    this.configDir = path.join(__dirname, '../src/config');
    this.defaultsPath = path.join(this.configDir, 'defaults.json');
    this.settingsPath = path.join(this.configDir, 'settings.json');
    this.fontsPath = path.join(this.configDir, 'fonts.json');
    this.fontsDir = path.join(__dirname, '../fonts');
  }

  async loadDefaults() {
    try {
      return await fs.readJson(this.defaultsPath);
    } catch (error) {
      console.error(chalk.red('❌ 无法加载默认配置:'), error.message);
      throw error;
    }
  }

  async loadSettings() {
    try {
      if (await fs.pathExists(this.settingsPath)) {
        return await fs.readJson(this.settingsPath);
      }
      return {};
    } catch (error) {
      console.warn(chalk.yellow('⚠️  无法加载用户配置，使用默认配置'));
      return {};
    }
  }

  async loadFonts() {
    try {
      return await fs.readJson(this.fontsPath);
    } catch (error) {
      console.error(chalk.red('❌ 无法加载字体配置:'), error.message);
      throw error;
    }
  }

  deepMerge(target, source) {
    const result = { ...target };
    
    for (const key in source) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        result[key] = this.deepMerge(result[key] || {}, source[key]);
      } else {
        result[key] = source[key];
      }
    }
    
    return result;
  }

  async getMergedConfig() {
    const defaults = await this.loadDefaults();
    const settings = await this.loadSettings();
    const fonts = await this.loadFonts();
    
    // 合并配置
    const config = this.deepMerge(defaults, settings);
    
    // 应用字体配置
    const fontSet = fonts.fontSets[config.fontSet] || fonts.fontSets[fonts.defaultFontSet];
    if (fontSet) {
      config.fonts = fontSet.fonts;
      config.fontFiles = fontSet.fontFiles;
      config.fontSetInfo = {
        name: fontSet.name,
        description: fontSet.description
      };
    }
    
    return config;
  }

  async validateFontFiles(config) {
    const errors = [];
    const warnings = [];
    
    if (config.fontFiles) {
      for (const [type, fontPath] of Object.entries(config.fontFiles)) {
        const fullPath = path.join(__dirname, '..', fontPath);
        if (!await fs.pathExists(fullPath)) {
          errors.push(`字体文件不存在: ${fontPath} (${type})`);
        }
      }
    }
    
    return { errors, warnings };
  }

  async listAvailableFonts() {
    const fonts = await this.loadFonts();
    return Object.entries(fonts.fontSets).map(([key, fontSet]) => ({
      key,
      name: fontSet.name,
      description: fontSet.description,
      fonts: fontSet.fonts
    }));
  }

  async setFontSet(fontSetKey) {
    const fonts = await this.loadFonts();
    
    if (!fonts.fontSets[fontSetKey]) {
      throw new Error(`字体集不存在: ${fontSetKey}`);
    }
    
    const settings = await this.loadSettings();
    settings.fontSet = fontSetKey;
    
    await fs.writeJson(this.settingsPath, settings, { spaces: 2 });
    console.log(chalk.green(`✅ 字体集已设置为: ${fonts.fontSets[fontSetKey].name}`));
  }

  async generateTypstConfig(config) {
    const fontConfig = config.fonts || {};
    const colorConfig = config.colors || {};
    const sizeConfig = config.sizes || {};
    
    return `// 自动生成的配置文件 - 请勿手动编辑
#let themeColor = rgb("${colorConfig.theme || '#b2f2bb'}")
#let borderColor = rgb("${colorConfig.border || '#40c057'}")
#let textColor = rgb("${colorConfig.text || '#000000'}")
#let grayTextColor = rgb("${colorConfig.grayText || '#808080'}")

#let pyHeight = ${sizeConfig.pinyinHeight || '1cm'}
#let themeFont = "${fontConfig.theme || 'LvMuJiJXP'}"
#let titleFont = "${fontConfig.title || 'STKaiti'}"
#let pinyinFont = "${fontConfig.pinyin || 'ToneOZ-Pinyin-Kai-Traditional'}"
#let pinyinSize = ${sizeConfig.pinyinSize || '0.6cm'}
#let titleSize = ${sizeConfig.titleSize || '16pt'}
#let wordSize = ${sizeConfig.wordSize || '30pt'}
#let signSize = ${sizeConfig.signSize || '10pt'}

#let boxSize = ${config.layout?.boxSize || '1.5cm'}
#let columnCount = ${config.layout?.columnCount || 12}
#let wordTotal = ${config.layout?.wordTotal || 48}
#let wordCount = ${config.layout?.wordCount || 8}

#let defaultSign = "${config.content?.sign || '业精于勤而荒于嬉，行成于思而毁于随'}"
#let includeScore = ${config.content?.includeScore || true}
#let enableRotation = ${config.advanced?.enableRotation || true}
`;
  }

  async updateTypstConfig() {
    const config = await this.getMergedConfig();
    const typstConfig = await this.generateTypstConfig(config);
    
    const configPath = path.join(__dirname, '../src/templates/config.typ');
    await fs.writeFile(configPath, typstConfig);
    
    console.log(chalk.green('✅ Typst配置文件已更新'));
    return config;
  }

  async showCurrentConfig() {
    const config = await this.getMergedConfig();
    
    console.log(chalk.cyan('📋 当前配置:'));
    console.log(chalk.blue('字体集:'), config.fontSetInfo?.name || '未知');
    console.log(chalk.blue('布局:'), `${config.layout.columnCount}列 x ${config.layout.wordCount}字/组`);
    console.log(chalk.blue('颜色:'), `主题色: ${config.colors.theme}, 边框色: ${config.colors.border}`);
    console.log(chalk.blue('输出:'), config.output.directory);
    
    return config;
  }
}

// 命令行接口
async function main() {
  const manager = new ConfigManager();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
    case 'show':
      await manager.showCurrentConfig();
      break;
        
    case 'fonts':
      const fonts = await manager.listAvailableFonts();
      console.log(chalk.cyan('📝 可用字体集:'));
      fonts.forEach(font => {
        console.log(chalk.blue(`  ${font.key}:`), font.name);
        console.log(chalk.gray(`    ${font.description}`));
      });
      break;
        
    case 'set-font':
      const fontKey = args[1];
      if (!fontKey) {
        console.error(chalk.red('❌ 请指定字体集名称'));
        process.exit(1);
      }
      await manager.setFontSet(fontKey);
      break;
        
    case 'update':
      await manager.updateTypstConfig();
      break;
        
    case 'validate':
      const config = await manager.getMergedConfig();
      const validation = await manager.validateFontFiles(config);
        
      if (validation.errors.length > 0) {
        console.log(chalk.red('❌ 配置验证失败:'));
        validation.errors.forEach(error => {
          console.log(chalk.red(`  - ${error}`));
        });
      } else {
        console.log(chalk.green('✅ 配置验证通过'));
      }
      break;
        
    default:
      console.log(chalk.cyan('配置管理器使用方法:'));
      console.log('  node scripts/config-manager.js show        # 显示当前配置');
      console.log('  node scripts/config-manager.js fonts       # 列出可用字体');
      console.log('  node scripts/config-manager.js set-font <key> # 设置字体集');
      console.log('  node scripts/config-manager.js update      # 更新Typst配置');
      console.log('  node scripts/config-manager.js validate    # 验证配置');
      break;
    }
  } catch (error) {
    console.error(chalk.red('❌ 操作失败:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = ConfigManager; 