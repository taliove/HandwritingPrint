#!/usr/bin/env node

const fs = require('fs-extra');
const path = require('path');
const chalk = require('chalk');

class DataMigrator {
  constructor() {
    this.srcDataDir = path.join(__dirname, '../src/data');
    this.srcConfigDir = path.join(__dirname, '../src/config');
    this.copybooksDir = path.join(__dirname, '../copybooks');
  }

  async migrate() {
    console.log(chalk.cyan('🔄 开始数据迁移...'));
    
    await fs.ensureDir(this.copybooksDir);

    // 迁移现有的JSON数据文件
    await this.migrateDataFiles();
    
    // 迁移datasets配置
    await this.migrateDatasetsConfig();

    console.log(chalk.green('✅ 数据迁移完成！'));
  }

  async migrateDataFiles() {
    console.log(chalk.blue('📁 迁移数据文件...'));
    
    const dataFiles = await fs.readdir(this.srcDataDir);
    const jsonFiles = dataFiles.filter(file => file.endsWith('.json'));

    for (const jsonFile of jsonFiles) {
      const name = path.basename(jsonFile, '.json');
      console.log(chalk.gray(`  处理: ${name}`));

      // 读取原始数据
      const srcPath = path.join(this.srcDataDir, jsonFile);
      const data = await fs.readJson(srcPath);

      // 生成txt文件内容
      const words = data.map(item => item.word).join('\n');
      
      // 创建新格式的文件
      const txtPath = path.join(this.copybooksDir, `${name}.txt`);
      const newJsonPath = path.join(this.copybooksDir, `${name}.json`);
      const configPath = path.join(this.copybooksDir, `${name}.config.json`);

      // 写入txt文件
      await fs.writeFile(txtPath, words);
      
      // 写入json文件
      await fs.writeJson(newJsonPath, data, { spaces: 2 });

      // 创建默认配置
      const config = {
        title: name,
        description: `从 ${jsonFile} 迁移`,
        fonts: ['kaishu', 'xingshu'],
        colors: {
          theme: '#b2f2bb',
          border: '#40c057'
        },
        content: {
          motto: '业精于勤而荒于嬉，行成于思而毁于随'
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

      await fs.writeJson(configPath, config, { spaces: 2 });
      
      console.log(chalk.green(`  ✅ ${name} 迁移完成`));
    }
  }

  async migrateDatasetsConfig() {
    console.log(chalk.blue('⚙️  迁移数据集配置...'));
    
    const datasetsPath = path.join(this.srcConfigDir, 'datasets.json');
    
    if (!await fs.pathExists(datasetsPath)) {
      console.log(chalk.yellow('  ⚠️  datasets.json 不存在，跳过'));
      return;
    }

    const datasetsConfig = await fs.readJson(datasetsPath);
    
    for (const [key, dataset] of Object.entries(datasetsConfig.datasets)) {
      if (!dataset.enabled) continue;
      
      const configPath = path.join(this.copybooksDir, `${key}.config.json`);
      
      if (await fs.pathExists(configPath)) {
        // 更新现有配置
        const config = await fs.readJson(configPath);
        
        // 合并datasets配置
        if (dataset.customConfig) {
          config.colors = { ...config.colors, ...dataset.customConfig.colors };
          config.content = { ...config.content, ...dataset.customConfig.content };
          config.layout = { ...config.layout, ...dataset.customConfig.layout };
        }
        
        if (dataset.fontSets) {
          config.fonts = dataset.fontSets;
        }
        
        config.updatedAt = new Date().toISOString();
        
        await fs.writeJson(configPath, config, { spaces: 2 });
        console.log(chalk.green(`  ✅ ${key} 配置已更新`));
      }
    }
  }

  async cleanup() {
    console.log(chalk.yellow('\n🧹 清理旧文件...'));
    
    const { confirm } = await require('inquirer').prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: '是否删除旧的配置文件？(src/config/datasets.json)',
        default: false
      }
    ]);

    if (confirm) {
      const datasetsPath = path.join(this.srcConfigDir, 'datasets.json');
      if (await fs.pathExists(datasetsPath)) {
        await fs.remove(datasetsPath);
        console.log(chalk.green('✅ datasets.json 已删除'));
      }
    }
  }
}

async function main() {
  const migrator = new DataMigrator();
  
  try {
    await migrator.migrate();
    await migrator.cleanup();
    
    console.log(chalk.cyan('\n🎉 迁移完成！现在可以使用 npm start 启动新系统'));
  } catch (error) {
    console.error(chalk.red('❌ 迁移失败:'), error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = DataMigrator; 