#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class FontInstaller {
  constructor() {
    this.fontsDir = path.join(__dirname, '../fonts');
    this.configDir = path.join(__dirname, '../src/config');
    this.fontsConfigPath = path.join(this.configDir, 'fonts.json');
  }

  async listInstalledFonts() {
    try {
      const files = await fs.readdir(this.fontsDir);
      const fontFiles = files.filter(file => 
        file.endsWith('.ttf') || 
        file.endsWith('.otf') || 
        file.endsWith('.woff') || 
        file.endsWith('.woff2')
      );
      
      console.log(chalk.cyan('📁 已安装的字体文件:'));
      if (fontFiles.length === 0) {
        console.log(chalk.yellow('  (无字体文件)'));
      } else {
        fontFiles.forEach(file => {
          const filePath = path.join(this.fontsDir, file);
          const stats = fs.statSync(filePath);
          const size = (stats.size / 1024 / 1024).toFixed(2);
          console.log(chalk.blue(`  ${file}`), chalk.gray(`(${size}MB)`));
        });
      }
      
      return fontFiles;
    } catch (error) {
      console.error(chalk.red('❌ 无法读取字体目录:'), error.message);
      return [];
    }
  }

  async validateFontConfig() {
    try {
      const config = await fs.readJson(this.fontsConfigPath);
      const errors = [];
      const warnings = [];
      
      for (const [setKey, fontSet] of Object.entries(config.fontSets)) {
        console.log(chalk.blue(`\n🔍 验证字体集: ${fontSet.name} (${setKey})`));
        
        if (fontSet.fontFiles) {
          for (const [type, fontPath] of Object.entries(fontSet.fontFiles)) {
            const fullPath = path.join(__dirname, '..', fontPath);
            if (await fs.pathExists(fullPath)) {
              console.log(chalk.green(`  ✅ ${type}: ${fontPath}`));
            } else {
              console.log(chalk.red(`  ❌ ${type}: ${fontPath} (文件不存在)`));
              errors.push(`${setKey}.${type}: ${fontPath}`);
            }
          }
        }
        
        // 检查系统字体
        if (fontSet.fonts) {
          for (const [type, fontName] of Object.entries(fontSet.fonts)) {
            console.log(chalk.gray(`  📝 ${type}: ${fontName} (系统字体)`));
          }
        }
      }
      
      if (errors.length > 0) {
        console.log(chalk.red('\n❌ 发现缺失的字体文件:'));
        errors.forEach(error => console.log(chalk.red(`  - ${error}`)));
      } else {
        console.log(chalk.green('\n✅ 所有字体文件验证通过'));
      }
      
      return { errors, warnings };
    } catch (error) {
      console.error(chalk.red('❌ 无法验证字体配置:'), error.message);
      return { errors: [error.message], warnings: [] };
    }
  }

  async addFontSet(setKey, setName, description, fonts, fontFiles) {
    try {
      const config = await fs.readJson(this.fontsConfigPath);
      
      config.fontSets[setKey] = {
        name: setName,
        description: description,
        fonts: fonts,
        fontFiles: fontFiles || {}
      };
      
      await fs.writeJson(this.fontsConfigPath, config, { spaces: 2 });
      console.log(chalk.green(`✅ 字体集 "${setName}" 已添加`));
    } catch (error) {
      console.error(chalk.red('❌ 添加字体集失败:'), error.message);
    }
  }

  async removeFontSet(setKey) {
    try {
      const config = await fs.readJson(this.fontsConfigPath);
      
      if (!config.fontSets[setKey]) {
        console.error(chalk.red(`❌ 字体集 "${setKey}" 不存在`));
        return;
      }
      
      const fontSetName = config.fontSets[setKey].name;
      delete config.fontSets[setKey];
      
      // 如果删除的是默认字体集，设置新的默认值
      if (config.defaultFontSet === setKey) {
        const remainingKeys = Object.keys(config.fontSets);
        if (remainingKeys.length > 0) {
          config.defaultFontSet = remainingKeys[0];
          console.log(chalk.yellow(`⚠️  默认字体集已更改为: ${config.fontSets[remainingKeys[0]].name}`));
        }
      }
      
      await fs.writeJson(this.fontsConfigPath, config, { spaces: 2 });
      console.log(chalk.green(`✅ 字体集 "${fontSetName}" 已删除`));
    } catch (error) {
      console.error(chalk.red('❌ 删除字体集失败:'), error.message);
    }
  }

  async installFont(fontPath, targetName) {
    try {
      if (!await fs.pathExists(fontPath)) {
        console.error(chalk.red(`❌ 字体文件不存在: ${fontPath}`));
        return;
      }
      
      const fileName = targetName || path.basename(fontPath);
      const targetPath = path.join(this.fontsDir, fileName);
      
      await fs.ensureDir(this.fontsDir);
      await fs.copy(fontPath, targetPath);
      
      const stats = await fs.stat(targetPath);
      const size = (stats.size / 1024 / 1024).toFixed(2);
      
      console.log(chalk.green(`✅ 字体已安装: ${fileName} (${size}MB)`));
    } catch (error) {
      console.error(chalk.red('❌ 安装字体失败:'), error.message);
    }
  }

  async generateFontPreview() {
    const previewText = '春夏秋冬 ABCD 1234';
    const config = await fs.readJson(this.fontsConfigPath);
    
    console.log(chalk.cyan('🎨 字体预览:'));
    console.log(chalk.gray(`预览文本: ${previewText}\n`));
    
    for (const [setKey, fontSet] of Object.entries(config.fontSets)) {
      console.log(chalk.blue(`${fontSet.name} (${setKey}):`));
      console.log(chalk.gray(`  描述: ${fontSet.description}`));
      console.log(chalk.gray(`  主字体: ${fontSet.fonts.theme}`));
      console.log(chalk.gray(`  标题字体: ${fontSet.fonts.title}`));
      console.log(chalk.gray(`  拼音字体: ${fontSet.fonts.pinyin}`));
      console.log();
    }
  }
}

// 命令行接口
async function main() {
  const installer = new FontInstaller();
  const args = process.argv.slice(2);
  const command = args[0];

  try {
    switch (command) {
    case 'list':
      await installer.listInstalledFonts();
      break;
        
    case 'validate':
      await installer.validateFontConfig();
      break;
        
    case 'preview':
      await installer.generateFontPreview();
      break;
        
    case 'install':
      const fontPath = args[1];
      const targetName = args[2];
      if (!fontPath) {
        console.error(chalk.red('❌ 请指定字体文件路径'));
        process.exit(1);
      }
      await installer.installFont(fontPath, targetName);
      break;
        
    case 'add-set':
      // 示例：node font-installer.js add-set songti 宋体 "宋体字体" '{"theme":"SimSun","title":"SimSun","pinyin":"Arial"}'
      const setKey = args[1];
      const setName = args[2];
      const description = args[3];
      const fonts = JSON.parse(args[4] || '{}');
      const fontFiles = JSON.parse(args[5] || '{}');
        
      if (!setKey || !setName) {
        console.error(chalk.red('❌ 请指定字体集键名和名称'));
        process.exit(1);
      }
        
      await installer.addFontSet(setKey, setName, description, fonts, fontFiles);
      break;
        
    case 'remove-set':
      const removeKey = args[1];
      if (!removeKey) {
        console.error(chalk.red('❌ 请指定要删除的字体集键名'));
        process.exit(1);
      }
      await installer.removeFontSet(removeKey);
      break;
        
    default:
      console.log(chalk.cyan('字体管理器使用方法:'));
      console.log('  node scripts/font-installer.js list           # 列出已安装字体');
      console.log('  node scripts/font-installer.js validate       # 验证字体配置');
      console.log('  node scripts/font-installer.js preview        # 字体预览');
      console.log('  node scripts/font-installer.js install <path> # 安装字体文件');
      console.log('  node scripts/font-installer.js add-set <key> <name> <desc> <fonts> # 添加字体集');
      console.log('  node scripts/font-installer.js remove-set <key> # 删除字体集');
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

module.exports = FontInstaller; 