import chalk from 'chalk';

/**
 * AI Client abstraction supporting OpenAI and Anthropic.
 * Uses user's API tokens, NOT Rosetta's own tokens.
 */
export class AIClient {
  constructor(provider, apiKey) {
    this.provider = provider;
    this.apiKey = apiKey;
    this.baseUrl = this.getBaseUrl(provider);
  }

  /**
   * Get base URL for the provider.
   */
  getBaseUrl(provider) {
    const urls = {
      openai: 'https://api.openai.com/v1',
      anthropic: 'https://api.anthropic.com/v1'
    };
    return urls[provider.toLowerCase()];
  }

  /**
   * Load API key from environment or prompt user.
   */
  static async loadApiKey(provider) {
    const envVar = provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY';
    const apiKey = process.env[envVar];

    if (apiKey) {
      return apiKey;
    }

    // Try loading from config file
    const fs = (await import('fs-extra')).default;
    const os = (await import('os')).default;
    const path = (await import('path')).default;
    const configPath = path.join(os.homedir(), '.rosetta', 'config.json');

    if (await fs.pathExists(configPath)) {
      const config = await fs.readJson(configPath);
      const key = provider === 'anthropic' ? config.anthropicApiKey : config.openaiApiKey;
      if (key) {
        return key;
      }
    }

    // If no key found, return null (caller should handle prompting)
    return null;
  }

  /**
   * Save API key to config.
   */
  static async saveApiKey(provider, apiKey) {
    const fs = (await import('fs-extra')).default;
    const os = (await import('os')).default;
    const path = (await import('path')).default;
    const configPath = path.join(os.homedir(), '.rosetta', 'config.json');

    await fs.ensureDir(path.dirname(configPath));

    let config = {};
    if (await fs.pathExists(configPath)) {
      config = await fs.readJson(configPath);
    }

    if (provider === 'anthropic') {
      config.anthropicApiKey = apiKey;
    } else {
      config.openaiApiKey = apiKey;
    }

    await fs.writeJson(configPath, config, { spaces: 2 });
  }

  /**
   * Make a chat completion request.
   */
  async chat(messages, options = {}) {
    const { model = 'default', maxTokens = 4096, temperature = 0.7 } = options;

    // Set default models
    const actualModel = model === 'default'
      ? (this.provider === 'anthropic' ? 'claude-sonnet-4-20250514' : 'gpt-4-turbo-preview')
      : model;

    if (this.provider === 'anthropic') {
      return this.anthropicChat(messages, { model: actualModel, maxTokens, temperature });
    } else {
      return this.openaiChat(messages, { model: actualModel, maxTokens, temperature });
    }
  }

  /**
   * Anthropic chat completion.
   */
  async anthropicChat(messages, options) {
    const https = (await import('https')).default;

    const payload = {
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: messages
    };

    return new Promise((resolve, reject) => {
      const req = https.request('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01'
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json.content[0]?.text || '');
            } else {
              reject(new Error(`API Error: ${json.error?.message || res.statusCode}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * OpenAI chat completion.
   */
  async openaiChat(messages, options) {
    const https = (await import('https')).default;

    const payload = {
      model: options.model,
      max_tokens: options.maxTokens,
      temperature: options.temperature,
      messages: messages
    };

    return new Promise((resolve, reject) => {
      const req = https.request('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            const json = JSON.parse(data);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(json.choices[0]?.message?.content || '');
            } else {
              reject(new Error(`API Error: ${json.error?.message || res.statusCode}`));
            }
          } catch (err) {
            reject(err);
          }
        });
      });

      req.on('error', reject);
      req.write(JSON.stringify(payload));
      req.end();
    });
  }

  /**
   * Analyze project with AI.
   */
  async analyzeProject(projectSample) {
    const prompt = `Analyze this project structure and tell me:
1. What is the primary purpose?
2. What frameworks are used?
3. Testing approach?
4. Unique conventions?

Project sample:
${projectSample}

Respond in JSON format with keys: purpose, frameworks, testing, conventions.`;

    try {
      const response = await this.chat([
        { role: 'user', content: prompt }
      ], { temperature: 0.3 });

      // Try to parse JSON from response
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }

      // Fallback: return structured object from text
      return {
        purpose: 'Unable to parse',
        frameworks: [],
        testing: 'Unknown',
        conventions: response.substring(0, 500)
      };
    } catch (err) {
      console.log(chalk.yellow(`AI analysis failed: ${err.message}`));
      return null;
    }
  }
}
