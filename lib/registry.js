import https from 'https';
import http from 'http';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { ROSETTA_DIR, DEFAULT_REGISTRY, REGISTRY_PATH } from './constants.js';

/**
 * Helper to fetch content from a URL.
 */
function fetchUrl(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode < 200 || res.statusCode >= 300) {
        return reject(new Error(`Failed to fetch ${url}, status: ${res.statusCode}`));
      }
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => resolve(data));
      res.on('error', reject);
    }).on('error', reject);
  });
}

/**
 * Registry Management logic.
 */
export class RegistryManager {
  static async ensureRegistry() {
    await fs.ensureDir(ROSETTA_DIR);
    if (!(await fs.pathExists(REGISTRY_PATH))) {
      await fs.writeJson(REGISTRY_PATH, DEFAULT_REGISTRY, { spaces: 2 });
    }
  }

  static async load() {
    await this.ensureRegistry();
    return await fs.readJson(REGISTRY_PATH);
  }

  static async search(type, domain) {
    const registry = await this.load();
    const items = registry[type] || [];
    return items.filter(item => !domain || item.domain === domain);
  }

  static async find(type, name) {
    const registry = await this.load();
    const items = registry[type] || [];
    return items.find(item => item.name === name);
  }

  static async installPreset(name) {
    const preset = await this.find('presets', name);
    if (!preset) {
      throw new Error(`Preset "${name}" not found in registry.`);
    }

    console.log(chalk.blue(`Installing preset "${name}" from ${preset.url}...`));
    const content = await fetchUrl(preset.url);

    await fs.ensureDir('.ai');
    const masterPath = '.ai/master-skill.md';
    const exists = await fs.pathExists(masterPath);

    if (exists) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `${masterPath} already exists. Overwrite with preset content?`,
        default: false
      }]);
      if (!confirm) return;
    }

    await fs.writeFile(masterPath, content);
    console.log(chalk.green(`Successfully installed preset to ${masterPath}`));
    console.log(chalk.cyan('Run "rosetta sync" to update your IDE wrappers.'));
  }

  static async installSkill(name) {
    const skill = await this.find('skills', name);
    if (!skill) {
      throw new Error(`Skill "${name}" not found in registry.`);
    }

    console.log(chalk.blue(`Installing skill "${name}" from ${skill.url}...`));
    const content = await fetchUrl(skill.url);

    const skillName = name.split('/').pop().replace('.skill.md', '');
    const skillDir = path.join('skills', skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (await fs.pathExists(skillDir)) {
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: `${skillDir} already exists. Overwrite?`,
        default: false
      }]);
      if (!confirm) return;
    }

    await fs.ensureDir(skillDir);
    await fs.writeFile(skillFile, content);
    console.log(chalk.green(`Successfully installed skill to ${skillFile}`));
  }
}
