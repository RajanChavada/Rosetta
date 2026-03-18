import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import os from 'os';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';
import { SKILLS_SOURCES } from './constants.js';
import { renderTemplate } from './templates.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Loads skills from multiple sources, optionally including a custom directory or git repo.
 */
export async function loadSkillsFromSources(options = {}) {
  const { skillsDir, skillsRepo } = options;
  const sources = [...SKILLS_SOURCES];

  if (skillsDir) {
    sources.push(path.resolve(process.cwd(), skillsDir));
  }

  if (skillsRepo) {
    const tempRepoPath = path.join(os.tmpdir(), `rosetta-skills-${Date.now()}`);
    console.log(chalk.blue(`Cloning skills from ${skillsRepo}...`));
    try {
      execSync(`git clone ${skillsRepo} ${tempRepoPath}`, { stdio: 'ignore' });
      sources.push(tempRepoPath);
    } catch (err) {
      console.log(chalk.red(`Error cloning skills repo: ${err.message}`));
    }
  }

  const allSkills = [];
  for (const src of sources) {
    if (await fs.pathExists(src)) {
      const files = await fs.readdir(src);
      const skillFiles = files.filter(f => f.endsWith('.skill.md'));
      for (const f of skillFiles) {
        const fullPath = path.join(src, f);
        let description = null;
        try {
          const content = await fs.readFile(fullPath, 'utf8');
          const match = content.match(/description:\s*(.*)/i);
          if (match) description = match[1].trim();
        } catch (err) {
          // Ignore read errors
        }
        allSkills.push({
          name: f.replace('.skill.md', ''),
          fileName: f,
          fullPath,
          source: src,
          description
        });
      }
    }
  }

  // Deduplicate by name, keeping the last one (allows overrides)
  const deduped = [];
  const seen = new Set();
  for (let i = allSkills.length - 1; i >= 0; i--) {
    if (!seen.has(allSkills[i].name)) {
      deduped.unshift(allSkills[i]);
      seen.add(allSkills[i].name);
    }
  }

  return deduped;
}

/**
 * Flow: Create a new skill directory with SKILL.md and tests/prompts.md boilerplates.
 */
export async function createSkill(skillName, options = {}) {
  const { interactive = false } = options;
  const skillDir = path.join('skills', skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const testFile = path.join(skillDir, 'tests', 'prompts.md');

  if (await fs.pathExists(skillDir) && interactive) {
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: `${chalk.yellow(skillDir)} already exists. Overwrite boilerplates?`,
      default: false
    }]);
    if (!proceed) return;
  }

  await fs.ensureDir(skillDir);
  await fs.ensureDir(path.join(skillDir, 'tests'));

  const skillTpl = path.join(__dirname, '..', 'templates', 'skill-boilerplate.md');
  const testTpl = path.join(__dirname, '..', 'templates', 'skill-tests-boilerplate.md');

  let skillContent = await fs.readFile(skillTpl, 'utf8');
  let testContent = await fs.readFile(testTpl, 'utf8');

  skillContent = skillContent.replace(/{{name}}/g, skillName);
  testContent = testContent.replace(/{{name}}/g, skillName);

  await fs.writeFile(skillFile, skillContent);
  await fs.writeFile(testFile, testContent);

  console.log(chalk.green(`Created skill directory at ${skillDir}`));
  console.log(chalk.gray(`- ${skillFile}`));
  console.log(chalk.gray(`- ${testFile}`));
}

/**
 * Creates a skill from a specific template file path.
 * Supports multiple target directories.
 */
export async function createSkillFromFile(skillName, templatePath, context = {}, targetDirs = ['skills']) {
  const raw = await fs.readFile(templatePath, 'utf8');
  const rendered = renderTemplate(raw, context);

  for (const baseDir of targetDirs) {
    const skillDir = path.join(baseDir, skillName);
    const skillFile = path.join(skillDir, 'SKILL.md');

    await fs.ensureDir(skillDir);
    await fs.writeFile(skillFile, rendered);
    console.log(chalk.green(`Created skill ${chalk.bold(skillName)} in ${skillDir}`));
  }
}
