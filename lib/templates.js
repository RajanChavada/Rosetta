import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { fileURLToPath } from 'url';
import { dryRunWrite } from './utils.js';

import { UNIVERSAL_MEMORY_WORKFLOW } from './constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Renders a template by replacing placeholders with context values.
 */
export function renderTemplate(raw, context = {}) {
  const listOrNone = (arr) =>
    arr && arr.length ? arr.join(', ') : 'None';

  return raw
    .replace(/{{UNIVERSAL_MEMORY}}/g, UNIVERSAL_MEMORY_WORKFLOW)
    .replace(/{{PROJECT_NAME}}/g, context.projectName || 'My Project')
    .replace(/{{PROJECT_DESCRIPTION}}/g, context.description || 'No description provided.')
    .replace(/{{PROJECT_TYPE}}/g, context.projectType || 'Not specified')
    .replace(/{{FRONTEND_STACK}}/g, listOrNone(context.frontend))
    .replace(/{{BACKEND_STACK}}/g, listOrNone(context.backend))
    .replace(/{{DATASTORES}}/g, listOrNone(context.datastores))
    .replace(/{{DOMAIN_TAGS}}/g, listOrNone(context.domainTags))
    .replace(/{{RISK_LEVEL}}/g, context.riskLevel || 'Medium')
    .replace(/{{TEAM_SIZE}}/g, context.teamSize || 'Solo')
    .replace(/{{GIT_WORKFLOW}}/g, context.gitWorkflow || 'Feature branches only')
    .replace(/{{TESTING_SETUP}}/g, context.testingSetup || 'Unit tests only')
    .replace(/{{AGENT_STYLE}}/g, context.agentStyle || 'Pair programmer (small, iterative suggestions)')
    .replace(/{{EDIT_PERMISSIONS}}/g, context.editPermissions || 'Multiple files in same module')
    .replace(/{{EXTRA_CONTEXTS}}/g, listOrNone(context.extras));
}

/**
 * Reads and renders a named template from the templates directory.
 */
export async function renderNamedTemplate(templateName, context = {}) {
  const templatePath = path.join(__dirname, '..', 'templates', templateName);
  const raw = await fs.readFile(templatePath, 'utf8');
  return renderTemplate(raw, context);
}

/**
 * Reads a template and writes it to a target path.
 * Used for scaffolding independent wrappers.
 */
export async function ensureFromTemplate(templateName, targetPath, context, options = {}) {
  const { interactive = false, backup = true, dryRun = false } = options;
  if (await dryRunWrite(targetPath, 'create from template', options)) return;

  await fs.ensureDir(path.dirname(targetPath));

  const exists = await fs.pathExists(targetPath);
  if (exists && interactive) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `${chalk.yellow(targetPath)} already exists. Backup and overwrite?`,
      default: false
    }]);
    if (!overwrite) return;
  }

  if (exists && backup) {
    await fs.copy(targetPath, targetPath + '.bak', { overwrite: true });
    if (interactive) console.log(chalk.gray(`Backed up to ${targetPath}.bak`));
  }

  const rendered = await renderNamedTemplate(templateName, context);
  await fs.writeFile(targetPath, rendered);
  if (interactive) console.log(chalk.green(`Created/Updated ${targetPath} from template ${templateName}`));
}

/**
 * Seeds the master skill from a preset.
 */
export async function ensureMasterFromPreset(preset, context, options = {}) {
  const { interactive = false, backup = true, dryRun = false } = options;
  if (await dryRunWrite('.ai/master-skill.md', 'seed master from preset', options)) return '.ai/master-skill.md';
  await fs.ensureDir('.ai');
  const masterPath = '.ai/master-skill.md';

  const exists = await fs.pathExists(masterPath);
  if (exists && interactive) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `${chalk.yellow(masterPath)} already exists. Backup and overwrite?`,
      default: false
    }]);
    if (!overwrite) return;
  }

  if (exists && backup) {
    await fs.copy(masterPath, masterPath + '.bak', { overwrite: true });
    if (interactive) console.log(chalk.gray(`Backed up to ${masterPath}.bak`));
  }

  let templateName = preset === 'minimal' ? 'minimal.md' :
    preset === 'agentic-starter' ? 'agentic-starter.md' :
      `presets/${preset}.md`;

  const templatePath = path.join(__dirname, '..', 'templates', templateName);

  try {
    const raw = await fs.readFile(templatePath, 'utf8');
    const rendered = renderTemplate(raw, context);
    await fs.writeFile(masterPath, rendered);
    console.log(chalk.blue(`Seeded ${masterPath} from preset: ${preset}`));
  } catch (err) {
    console.log(chalk.yellow(`Warning: Preset template ${templateName} not found. Creating minimal default.`));
    await fs.writeFile(masterPath, '# Project Agent Rules\n\nDescribe your project rules here.\n');
  }

  return masterPath;
}

/**
 * Writes content to a target path, handling backups and symlinks.
 * Used for mirroring (master -> docs) but NOT for IDE wrappers (Behavior Contract).
 */
export async function writeTarget(sourcePath, targetPath, options = {}) {
  const { interactive = false, backup = true, dryRun = false } = options;
  if (await dryRunWrite(targetPath, 'copy/link', options)) return;
  await fs.ensureDir(path.dirname(targetPath));

  const exists = await fs.pathExists(targetPath);
  if (exists && interactive) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `${chalk.yellow(targetPath)} already exists. Backup and overwrite?`,
      default: false
    }]);
    if (!overwrite) return;
  }

  if (exists && backup) {
    await fs.copy(targetPath, targetPath + '.bak', { overwrite: true });
    if (interactive) console.log(chalk.gray(`Backed up to ${targetPath}.bak`));
  }

  // Prefer symlinks on Unix-like systems
  if (process.platform !== 'win32') {
    try {
      if (exists) await fs.remove(targetPath);
      const relative = path.relative(path.dirname(targetPath), sourcePath);
      await fs.symlink(relative, targetPath);
      if (interactive) console.log(chalk.green(`Linked ${targetPath} -> ${sourcePath}`));
      return;
    } catch (err) {
      // Fall through to copy
    }
  }

  await fs.copy(sourcePath, targetPath, { overwrite: true });
  if (interactive) console.log(chalk.green(`Copied ${sourcePath} -> ${targetPath}`));
}
