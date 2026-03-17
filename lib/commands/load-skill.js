import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseSkillFile } from '../visualizers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Command: skill <name>
 * Load a specific skill for focused context.
 * Displays skill details and makes it available for the current session.
 */
export async function loadSkill(name, options = {}) {

  try {
    // Search in project skills directory
    const projectSkillsDir = path.join(process.cwd(), 'skills');
    const globalSkillsDir = path.join(process.env.HOME || process.env.USERPROFILE, '.rosetta', 'skills');

    let skillFile = null;
    let skillDir = null;

    // Check project skills first
    if (await fs.pathExists(projectSkillsDir)) {
      const entries = await fs.readdir(projectSkillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const candidate1 = path.join(projectSkillsDir, entry.name, 'SKILL.md');
          const candidate2 = path.join(projectSkillsDir, entry.name, `${name}.skill.md`);
          if (await fs.pathExists(candidate1)) {
            const metadata = await parseSkillFile(candidate1);
            if (metadata.name.toLowerCase() === name.toLowerCase()) {
              skillFile = candidate1;
              skillDir = path.join(projectSkillsDir, entry.name);
              break;
            }
          }
          if (await fs.pathExists(candidate2)) {
            const metadata = await parseSkillFile(candidate2);
            if (metadata.name.toLowerCase() === name.toLowerCase() ||
                entry.name.toLowerCase() === name.toLowerCase()) {
              skillFile = candidate2;
              skillDir = path.join(projectSkillsDir, entry.name);
              break;
            }
          }
        }
      }
    }

    // Check global skills if not found
    if (!skillFile && await fs.pathExists(globalSkillsDir)) {
      const entries = await fs.readdir(globalSkillsDir, { withFileTypes: true });
      for (const entry of entries) {
        if (entry.isDirectory()) {
          const candidate1 = path.join(globalSkillsDir, entry.name, 'SKILL.md');
          const candidate2 = path.join(globalSkillsDir, entry.name, `${name}.skill.md`);
          if (await fs.pathExists(candidate1)) {
            const metadata = await parseSkillFile(candidate1);
            if (metadata.name.toLowerCase() === name.toLowerCase()) {
              skillFile = candidate1;
              skillDir = path.join(globalSkillsDir, entry.name);
              break;
            }
          }
          if (await fs.pathExists(candidate2)) {
            const metadata = await parseSkillFile(candidate2);
            if (metadata.name.toLowerCase() === name.toLowerCase() ||
                entry.name.toLowerCase() === name.toLowerCase()) {
              skillFile = candidate2;
              skillDir = path.join(globalSkillsDir, entry.name);
              break;
            }
          }
        }
      }
    }

    if (!skillFile) {
      console.error(chalk.red(`Error: Skill "${name}" not found.`));
      console.error(chalk.yellow('Search in: skills/ (project) and ~/.rosetta/skills (global)'));
      process.exit(1);
    }

    // Load skill metadata
    const metadata = await parseSkillFile(skillFile);

    // Display skill information
    console.log('');
    console.log(chalk.cyan.bold(`📦 Loaded Skill: ${metadata.name}`));
    console.log('');
    console.log(chalk.white(`Description: ${metadata.description || 'No description'}`));
    console.log('');

    if (metadata.domains && metadata.domains.length > 0) {
      console.log(chalk.gray(`Domains: ${metadata.domains.join(', ')}`));
    }

    if (metadata.tags && metadata.tags.length > 0) {
      console.log(chalk.gray(`Tags: ${metadata.tags.join(', ')}`));
    }

    if (metadata.provides && metadata.provides.length > 0) {
      console.log(chalk.green('\nProvides:'));
      metadata.provides.forEach(p => console.log(chalk.green(`  • ${p}`)));
    }

    if (metadata.requires && metadata.requires.length > 0) {
      console.log(chalk.yellow('\nRequires:'));
      metadata.requires.forEach(r => console.log(chalk.yellow(`  • ${r}`)));
    }

    if (metadata.repoUrl) {
      console.log(chalk.cyan(`\nRepository: ${metadata.repoUrl}`));
    }

    console.log('');
    console.log(chalk.gray(`Location: ${skillDir}`));
    console.log(chalk.gray('Skill loaded for current session. Use its patterns and instructions.'));
    console.log('');

    // In a full implementation, this would load the skill into the session context
    // For now, just display the information

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    if (err.stack) {
      console.error(chalk.gray(err.stack));
    }
    process.exit(1);
  }
}
