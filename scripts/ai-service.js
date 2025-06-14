const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const chalk = require('chalk');

class AIService {
  constructor() {
    this.configPath = path.join(__dirname, '../src/config/ai-config.json');
    this.config = this.loadConfig();
  }

  loadConfig() {
    try {
      if (fs.existsSync(this.configPath)) {
        return JSON.parse(fs.readFileSync(this.configPath, 'utf8'));
      }
    } catch (error) {
      console.error('❌ 加载AI配置失败:', error.message);
    }
    return this.getDefaultConfig();
  }

  getDefaultConfig() {
    return {
      enabled: false,
      provider: 'openai',
      apiKey: '',
      baseURL: 'https://api.openai.com/v1',
      model: 'gpt-3.5-turbo',
      timeout: 300000, // 5分钟超时
      maxRetries: 3,
      prompt: {
        system: '你是一个专业的汉语拼音标注助手。请为给定的汉字提供准确的拼音标注。',
        template: '请为以下汉字提供拼音标注，返回JSON格式，包含每个汉字及其对应的拼音（不带声调符号，用数字表示声调）：\n\n汉字列表：{characters}\n\n要求：\n1. 返回标准JSON格式\n2. 拼音使用数字声调（如：ni3 hao3）\n3. 多音字请选择最常用的读音\n4. 格式：[{"character": "你", "pinyin": "ni3"}, {"character": "好", "pinyin": "hao3"}]'
      },
      fallback: {
        enabled: true,
        message: 'AI服务不可用时，将使用空拼音占位符，用户可后续手动编辑'
      }
    };
  }

  saveConfig(config) {
    try {
      fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf8');
      this.config = config;
      return true;
    } catch (error) {
      console.error('❌ 保存AI配置失败:', error.message);
      return false;
    }
  }

  isConfigured() {
    return this.config.enabled && this.config.apiKey && this.config.apiKey.trim() !== '';
  }

  extractChineseCharacters(text) {
    // 提取所有汉字，去重并保持顺序，同时清理文本
    const chineseRegex = /[\u4e00-\u9fff]/g;
    const matches = text.match(chineseRegex) || [];
    const uniqueChars = [...new Set(matches)]; // 去重
    
    // 输出清理信息
    if (matches.length !== uniqueChars.length) {
      console.log(chalk.gray(`📝 文本清理: 原始${matches.length}个汉字，去重后${uniqueChars.length}个`));
    }
    
    return uniqueChars;
  }

  // 显示进度条
  showProgress(current, total, message = '') {
    const percentage = Math.round((current / total) * 100);
    const barLength = 30;
    const filledLength = Math.round((barLength * current) / total);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    process.stdout.write(`\r${chalk.blue('🤖')} ${message} [${bar}] ${percentage}% (${current}/${total})`);
    
    if (current === total) {
      process.stdout.write('\n');
    }
  }

  async generatePinyin(characters, showProgress = true) {
    if (!this.isConfigured()) {
      console.log(chalk.yellow('⚠️  AI服务未配置，使用占位符'));
      return this.generateFallbackPinyin(characters);
    }

    try {
      if (showProgress) {
        console.log(chalk.blue(`🤖 开始为 ${characters.length} 个汉字生成拼音...`));
        this.showProgress(0, characters.length, '准备中');
      }

      // 分批处理大量汉字，避免单次请求过大
      const batchSize = 50; // 每批最多50个汉字
      const batches = [];
      
      for (let i = 0; i < characters.length; i += batchSize) {
        batches.push(characters.slice(i, i + batchSize));
      }

      const allResults = [];
      
      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        
        if (showProgress) {
          this.showProgress(i * batchSize, characters.length, `处理第${i + 1}/${batches.length}批`);
        }

        try {
          const result = await this.callAI(batch);
          const parsedResult = this.parsePinyinResponse(result, batch);
          allResults.push(...parsedResult);
        } catch (error) {
          console.log(chalk.yellow(`\n⚠️  第${i + 1}批处理失败，使用备用方案: ${error.message}`));
          const fallbackResult = this.generateFallbackPinyin(batch);
          allResults.push(...fallbackResult);
        }

        // 批次间短暂延迟，避免API限流
        if (i < batches.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }

      if (showProgress) {
        this.showProgress(characters.length, characters.length, '完成');
        console.log(chalk.green('✅ 拼音生成完成'));
      }

      return allResults;
    } catch (error) {
      console.error(chalk.red('❌ AI生成拼音失败:'), error.message);
      if (this.config.fallback.enabled) {
        console.log(chalk.yellow('🔄 使用备用方案...'));
        return this.generateFallbackPinyin(characters);
      }
      throw error;
    }
  }

  async callAI(characters) {
    const charactersText = characters.join('、');
    const prompt = this.config.prompt.template.replace('{characters}', charactersText);

    const requestData = {
      model: this.config.model,
      messages: [
        {
          role: 'system',
          content: this.config.prompt.system
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1,
      max_tokens: 2000
    };

    return new Promise((resolve, reject) => {
      const url = new URL(`${this.config.baseURL}/chat/completions`);
      const isHttps = url.protocol === 'https:';
      const client = isHttps ? https : http;

      const options = {
        hostname: url.hostname,
        port: url.port || (isHttps ? 443 : 80),
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
          'User-Agent': 'CopybookAI/1.0'
        },
        timeout: this.config.timeout
      };

      const req = client.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          try {
            const response = JSON.parse(data);
            if (res.statusCode === 200) {
              resolve(response.choices[0].message.content);
            } else {
              reject(new Error(`API错误 ${res.statusCode}: ${response.error?.message || data}`));
            }
          } catch (error) {
            reject(new Error(`解析响应失败: ${error.message}`));
          }
        });
      });

      req.on('error', (error) => {
        reject(new Error(`网络错误: ${error.message}`));
      });
      
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`请求超时 (${this.config.timeout}ms)`));
      });

      req.write(JSON.stringify(requestData));
      req.end();
    });
  }

  parsePinyinResponse(response, originalCharacters) {
    try {
      // 尝试解析JSON响应
      let pinyinData;
            
      // 如果响应包含代码块，提取JSON部分
      const jsonMatch = response.match(/```json\s*([\s\S]*?)\s*```/) || 
                             response.match(/\[[\s\S]*\]/);
            
      if (jsonMatch) {
        pinyinData = JSON.parse(jsonMatch[1] || jsonMatch[0]);
      } else {
        pinyinData = JSON.parse(response);
      }

      // 创建字符到拼音的映射
      const pinyinMap = {};
      if (Array.isArray(pinyinData)) {
        pinyinData.forEach(item => {
          if (item.character && item.pinyin) {
            pinyinMap[item.character] = item.pinyin;
          }
        });
      }

      // 为所有原始字符生成结果
      return originalCharacters.map(char => ({
        character: char,
        pinyin: pinyinMap[char] || `pinyin_${char}` // 如果没找到，使用占位符
      }));

    } catch (error) {
      console.error(chalk.red('❌ 解析AI响应失败:'), error.message);
      console.log(chalk.gray('原始响应:'), response);
      return this.generateFallbackPinyin(originalCharacters);
    }
  }

  generateFallbackPinyin(characters) {
    return characters.map(char => ({
      character: char,
      pinyin: `pinyin_${char}` // 占位符，用户可后续编辑
    }));
  }

  async testConnection() {
    if (!this.isConfigured()) {
      return { success: false, message: 'AI服务未配置' };
    }

    try {
      console.log(chalk.blue('🔗 正在测试AI连接...'));
      const testResult = await this.callAI(['测', '试']);
      return { success: true, message: 'AI服务连接正常' };
    } catch (error) {
      return { success: false, message: `连接失败: ${error.message}` };
    }
  }

  getConfigSummary() {
    return {
      enabled: this.config.enabled,
      provider: this.config.provider,
      model: this.config.model,
      hasApiKey: !!this.config.apiKey,
      baseURL: this.config.baseURL,
      timeout: this.config.timeout
    };
  }
}

module.exports = AIService; 