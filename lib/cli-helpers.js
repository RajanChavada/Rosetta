import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import {
  PROJECT_MEMORY_TEMPLATE,
  AUTO_MEMORY_TEMPLATE,
  DAILY_LOG_TEMPLATE
} from './constants.js';
import { TreeLogger, dryRunWrite } from './utils.js';
import { loadConfig } from './config.js';
import { gatherContext, inferStarterSkills, analyzeProjectForIdeation } from './context.js';
import { loadSkillsFromSources, createSkillFromFile } from './skills.js';
import { ensureMasterFromPreset, ensureFromTemplate, renderTemplate } from './templates.js';
import { TARGETS } from './constants.js';
import { ideTargets } from './ide-adapters.js';
import { writeIdeationTemplate } from './generators/index.js';

/**
 * Runs post-scaffold hooks (commands from .rosetta.json or JS file).
 */
export async function runPostScaffoldHooks(context) {
  const configFile = '.rosetta.json';
  const jsHookFile = path.join(process.cwd(), 'hooks/post-scaffold.js');

  // JSON hooks
  if (await fs.pathExists(configFile)) {
    console.log(chalk.blue(`\nExecuting post-scaffold hooks from ${configFile}...`));
    try {
      const config = await fs.readJson(configFile);
      if (Array.isArray(config.postScaffoldHooks)) {
        for (const hook of config.postScaffoldHooks) {
          console.log(chalk.gray(`Running: ${hook}`));
          try {
            execSync(hook, { stdio: 'inherit', cwd: process.cwd() });
          } catch (err) {
            console.error(chalk.red(`Hook failed: ${hook}`));
            console.error(err.message);
          }
        }
      }
    } catch (err) {
      console.error(chalk.red(`Error reading ${configFile}:`), err.message);
    }
  }

  // JS Hook
  if (await fs.pathExists(jsHookFile)) {
    console.log(chalk.blue(`\nExecuting JS hook from ${jsHookFile}...`));
    try {
      let hookFn;
      try {
        // Try dynamic import (works for ESM)
        const module = await import(`file://${jsHookFile}?cache=${Date.now()}`);
        hookFn = module.default || module;
      } catch (e) {
        // Fallback to require for CommonJS
        const { createRequire } = await import('module');
        const require = createRequire(import.meta.url);
        hookFn = require(jsHookFile);
      }

      if (typeof hookFn === 'function') {
        await hookFn(context);
        console.log(chalk.green('JS hook executed successfully.'));
      } else {
        console.warn(chalk.yellow(`JS hook at ${jsHookFile} does not export a function. Skipping.`));
      }
    } catch (err) {
      console.error(chalk.red(`Error executing JS hook ${jsHookFile}:`), err.message);
    }
  }
}

/**
 * Selectively re-scaffold parts of the setup.
 */
export async function rescaffold(type, options = {}) {
  const context = {}; // Mock context for rescaffold
  const { dryRun = false } = options;

  if (type === 'memory' || type === 'all') {
    console.log(chalk.blue('\nRe-scaffolding memory and logs layout...'));
    if (!dryRun) {
      await fs.ensureDir('.ai/memory');
      await fs.ensureDir(path.join('.ai/memory', 'entities'));
      await fs.ensureDir(path.join('.ai/logs', 'daily'));

      const projectMemPath = path.join('.ai/memory', 'PROJECT_MEMORY.md');
      if (!(await fs.pathExists(projectMemPath))) {
        await fs.writeFile(projectMemPath, PROJECT_MEMORY_TEMPLATE);
        console.log(chalk.green(`Created ${projectMemPath}`));
      }

      const autoMemPath = path.join('.ai/memory', 'AUTO_MEMORY.md');
      if (!(await fs.pathExists(autoMemPath))) {
        await fs.writeFile(autoMemPath, AUTO_MEMORY_TEMPLATE);
        console.log(chalk.green(`Created ${autoMemPath}`));
      }
    } else {
      console.log(chalk.yellow('[Dry-run] Would ensure .ai/memory/ and logs/ exist.'));
    }
  }

  if (type === 'ides' || type === 'all') {
    console.log(chalk.blue('\nRe-scaffolding IDE wrappers...'));
    const { ides } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'ides',
      message: 'Select IDEs to re-scaffold:',
      choices: TARGETS.map(t => t.label),
      default: ['VSCode / Claude Code', 'Cursor']
    }]);

    for (const ide of ides) {
      const { targetPath, templateName } = ideTargets(ide);
      await ensureFromTemplate(templateName, targetPath, context, { dryRun, interactive: true });
    }
  }

  console.log(chalk.bold.green('\nRescaffold complete.'));
}

/**
 * Flow: Scaffold new setup.
 */
export async function scaffoldNew(options = {}) {
  const config = await loadConfig();
  const availableSkills = await loadSkillsFromSources(options);

  const { preset } = await inquirer.prompt([{
    type: 'list',
    name: 'preset',
    message: 'Choose a starter template for your master skill:',
    choices: [
      { name: 'Minimal (blank structure)', value: 'minimal' },
      { name: 'Agentic starter (generic dev project)', value: 'agentic-starter' },
      { name: 'Skill-creator style starter (help building skills)', value: 'skill-creator' }
    ],
    default: config.defaultPreset || 'agentic-starter'
  }]);

  const { useExtraContext } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useExtraContext',
    message: 'Provide extra project context (stack, domain, goals) so Rosetta can tailor scaffolding and suggest starter skills?',
    default: config.autoContext?.enabled !== undefined ? config.autoContext.enabled : true
  }]);

  let context = config.context || {};
  let starterSkills = [];
  if (useExtraContext) {
    // Merge config context as defaults for gatherContext
    context = await gatherContext(context);
    starterSkills = inferStarterSkills(context, availableSkills);
  }

  if (config.skills?.alwaysInclude) {
    for (const skillName of config.skills.alwaysInclude) {
      const existing = availableSkills.find(s => s.name === skillName);
      if (existing) {
        if (!starterSkills.find(ss => ss.name === skillName)) {
          starterSkills.push(existing);
        }
      } else {
        console.log(chalk.yellow(`Warning: Skill "${skillName}" from alwaysIncludeSkills not found in sources.`));
      }
    }
  }

  await ensureMasterFromPreset(preset, context, { interactive: true });

  let ides = config.defaultIdes;
  if (!ides) {
    const result = await inquirer.prompt([{
      type: 'checkbox',
      name: 'ides',
      message: 'Select IDEs to scaffold:',
      choices: TARGETS.map(t => t.label),
      default: ['VSCode / Claude Code', 'Cursor']
    }]);
    ides = result.ides;
  }

  // Create core files
  await ensureFromTemplate('AGENT.md', '.ai/AGENT.md', context, { interactive: true });
  await ensureFromTemplate('task.md', '.ai/task.md', context, { interactive: true });

  // Create IDE adapters from templates (Behavior Contract: do not symlink master)
  for (const ide of ides) {
    const { targetPath, templateName } = ideTargets(ide);
    await ensureFromTemplate(templateName, targetPath, context, { interactive: true });
  }

  // Resolve skills directories for selected IDEs
  const ideSkillsDirs = ides.map(ide => {
    const target = TARGETS.find(t => t.label === ide);
    return target && target.skillsDir ? target.skillsDir : null;
  }).filter(Boolean);
  const targetSkillsDirs = [...new Set(['skills', ...ideSkillsDirs])];

  // --- Starter Skills logic ---
  if (starterSkills.length) {
    let addSkills = true;
    if (!config.gatherContext || !config.gatherContext.skip) {
      const result = await inquirer.prompt([{
        type: 'confirm',
        name: 'addSkills',
        message: `Detected useful starter skills (${starterSkills.length}). Create them in your skills folders?`,
        default: true
      }]);
      addSkills = result.addSkills;
    }

    if (addSkills) {
      for (const skill of starterSkills) {
        await createSkillFromFile(skill.name, skill.fullPath, context, targetSkillsDirs);
      }
    }
  }

  // Allow selecting any other available skills
  const otherSkills = availableSkills.filter(as => !starterSkills.find(ss => ss.name === as.name));
  if (otherSkills.length && (!config.gatherContext || !config.gatherContext.skip)) {
    const { extraSkillsToCreate } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'extraSkillsToCreate',
      message: 'Add any other skills from catalog?',
      choices: otherSkills.map(s => ({
        name: `${chalk.bold(s.name)}${s.description ? chalk.gray(`: ${s.description}`) : ''}`,
        value: s
      }))
    }]);

    for (const skill of extraSkillsToCreate) {
      await createSkillFromFile(skill.name, skill.fullPath, context, targetSkillsDirs);
    }
  }

  // --- Memory Layout scaffolding ---
  if (options.dryRun) {
    console.log(chalk.yellow('\n[Dry-run] Would scaffold memory and logs layout under .ai/...'));
  } else {
    console.log(chalk.blue.bold('\n🧠 Scaffolding memory and logs layout...'));
    await fs.ensureDir('.ai/memory');
    await fs.ensureDir(path.join('.ai/memory', 'entities'));
    await fs.ensureDir(path.join('.ai/logs', 'daily'));
  }

  const projectMemPath = path.join('.ai/memory', 'PROJECT_MEMORY.md');
  if (!(await fs.pathExists(projectMemPath))) {
    if (!options.dryRun) await fs.writeFile(projectMemPath, PROJECT_MEMORY_TEMPLATE);
    else console.log(chalk.yellow(`[Dry-run] Would create ${projectMemPath}`));
  }

  const autoMemPath = path.join('.ai/memory', 'AUTO_MEMORY.md');
  if (!(await fs.pathExists(autoMemPath))) {
    if (!options.dryRun) await fs.writeFile(autoMemPath, AUTO_MEMORY_TEMPLATE);
    else console.log(chalk.yellow(`[Dry-run] Would create ${autoMemPath}`));
  }

  const today = new Date().toISOString().slice(0, 10);
  const logPath = path.join('.ai/logs', 'daily', `${today}.md`);
  if (!(await fs.pathExists(logPath))) {
    if (!options.dryRun) {
      const logContent = DAILY_LOG_TEMPLATE.replace(/{{DATE}}/g, today);
      await fs.writeFile(logPath, logContent);
    } else {
      console.log(chalk.yellow(`[Dry-run] Would create ${logPath}`));
    }
  }

  // --- Gitignore handling ---
  const gitignorePath = '.gitignore';
  const gitignoreEntries = [
    '',
    '# Rosetta Agent State',
    '.ai/logs/',
    '.ai/task.md'
  ];

  if (await fs.pathExists(gitignorePath)) {
    if (!options.dryRun) {
      console.log(chalk.blue('Updating .gitignore...'));
      let content = await fs.readFile(gitignorePath, 'utf8');
      const toAdd = gitignoreEntries.filter(entry => entry !== '' && !content.includes(entry));
      if (toAdd.length) {
        await fs.appendFile(gitignorePath, '\n' + gitignoreEntries.join('\n') + '\n');
        console.log(chalk.green('✓ Added Rosetta paths to .gitignore'));
      }
    } else {
      console.log(chalk.yellow(`[Dry-run] Would update ${gitignorePath}`));
    }
  } else {
    if (!options.dryRun) {
      console.log(chalk.blue('Creating .gitignore...'));
      await fs.writeFile(gitignorePath, gitignoreEntries.join('\n') + '\n');
      console.log(chalk.green('✓ Created .gitignore with Rosetta paths'));
    } else {
      console.log(chalk.yellow(`[Dry-run] Would create ${gitignorePath}`));
    }
  }

  if (options.dryRun) {
    console.log(chalk.bold.yellow('\n[Dry-run] Scaffold layout summary:'));
    console.log(chalk.yellow('├── Context gathered ✓'));
    console.log(chalk.yellow('├── .ai/ brain created ✓'));
    console.log(chalk.yellow(`├── ${ides.length} IDEs configured ✓`));
    console.log(chalk.yellow(`├── ${starterSkills.length} starter skills added ✓`));
    console.log(chalk.yellow('└── Memory initialized ✓'));
  } else {
    const logger = new TreeLogger(`Scaffolding ${context.projectName || 'project'}...`);
    logger.logStep('Context gathered');
    logger.logStep('.ai/ brain created');
    logger.logStep(`${ides.length} IDEs configured`);
    logger.logStep(`${starterSkills.length} starter skills added`);
    logger.logStep('Memory initialized', '✓', true);

    console.log(chalk.bold.green(`\nNew agentic structure created with preset: ${preset}`));
  }
  console.log(chalk.cyan('Rosetta is a local filesystem utility. Your IDE wrappers reference .ai/master-skill.md.'));

  // --- Auto-Ideate ---
  if (options.autoIdeate) {
    console.log(chalk.bold.blue('\n🎨 Generating skill ideation template...'));
    const ideateLogger = new TreeLogger('Generating ideation template...');
    try {
      const analysisResults = await analyzeProjectForIdeation(process.cwd());
      const output = options.ideateOutput || '.ai/skill-ideation-template.md';

      if (!options.dryRun) {
        await writeIdeationTemplate(analysisResults, output);
        ideateLogger.logStep('Template created', '✓', true);
        console.log(chalk.bold.green(`\n✅ Ideation template generated successfully!`));
        console.log(chalk.cyan(`Template saved to: ${output}`));
        console.log(chalk.yellow('\nNext steps:'));
        console.log(chalk.white('1. Open the template file in your IDE'));
        console.log(chalk.white('2. Paste the content into your AI agent'));
        console.log(chalk.white('3. Answer the clarifying questions to generate skill suggestions\n'));
      } else {
        ideateLogger.logStep('Template would be created', '✓', true);
        console.log(chalk.yellow(`[Dry-run] Would create ideation template at: ${output}`));
      }
    } catch (err) {
      ideateLogger.logStep('Failed', '✗', true);
      console.error(chalk.red(`Error generating ideation template: ${err.message}`));
      console.log(chalk.yellow('Run `rosetta ideate` manually to generate the template.\n'));
    }
  }

  // --- Post-Scaffold Hooks ---
  await runPostScaffoldHooks(context);
}

// Re-export renderTemplate for use in other modules
export { renderTemplate };
