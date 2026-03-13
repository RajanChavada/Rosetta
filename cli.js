#!/usr/bin/env node

/**
 * Rosetta CLI
 * A single source of truth for AI agent rules and skills.
 */

import { program } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TARGETS = [
  { label: 'VSCode / Claude Code', path: 'CLAUDE.md', template: 'anthropic-claude.md' },
  { label: 'Cursor', path: '.cursorrules', template: 'cursorrules.md' },
  { label: 'Antigravity', path: '.agent/skills/project-skill.md', template: 'antigravity-skill.md' },
  { label: 'GitHub Copilot', path: '.github/copilot-instructions.md', template: 'copilot-instructions.md' },
  { label: 'Windsurf', path: '.windsurf/rules/rosetta-rules.md', template: 'windsurf-rules.md' },
  { label: 'GSD / generic', path: 'skills/gsd-skill.md', template: 'gsd-skill.md' }
];

const PROJECT_MEMORY_TEMPLATE = `# Project Memory

This file stores **long-lived knowledge** about the project: decisions, conventions, domain facts, and architectural context that should remain true across tasks and over time.

## What belongs here

- Key architectural decisions and why they were made.
- Important domain concepts and invariants (e.g., "a workspace always has at least one owner").
- Naming conventions, folder structure conventions, and patterns that should be reused.
- Changelogs for major shifts in architecture or tech stack.

## What does NOT belong here

- Step-by-step task logs or debugging notes (use \`.ai/logs/daily/YYYY-MM-DD.md\`).
- Speculative ideas that haven't been agreed on yet (put them in issues or task.md first).
- Very low-level details that will quickly go out of date (prefer code comments).

## How the agent should update this file

- Propose updates only when a decision is truly project-wide or long term.
- When updating, include:
  - **Date**
  - **Context** (why this came up)
  - **Decision** (what is now true)
  - **Implications** (where it matters)

Example entry:

- **2026-03-13 – API Versioning**
  - Context: Added v2 endpoints for the payments API.
  - Decision: All new public APIs must be versioned under \`/v2/\` with explicit deprecation strategy for \`/v1/\`.
  - Implications: Update API docs, client SDKs, and test coverage to reflect versioning.
`;

const AUTO_MEMORY_TEMPLATE = `# Auto Memory

This file is for **agent-maintained notes and heuristics** that are useful across sessions but not "hard" project decisions.

## What belongs here

- Reusable troubleshooting steps ("When tests fail with X, check Y first").
- Observed patterns in the codebase ("Most services use helper Z for logging").
- Short reminders about gotchas ("Do not modify table A directly; use migration scripts").

## What does NOT belong here

- Long narratives or full task logs (those go in \`.ai/logs/daily/YYYY-MM-DD.md\`).
- Major architectural or product decisions (those belong in \`PROJECT_MEMORY.md\`).
- Sensitive data like access tokens or raw secrets.

## How the agent should update this file

- Append **short, bulleted notes**, not essays.
- Prefer patterns over one-off events.
- If a note starts to feel like a project-wide rule, propose moving it to \`PROJECT_MEMORY.md\`.

Example entries:

- When updating DB schema, always run \`npm test db\` before committing.
- Frontend components usually live under \`src/ui/\` and follow the \`Feature/Component\` pattern.
- Integration tests use a seeded Postgres test database defined in \`docker-compose.test.yml\`.
`;

const DAILY_LOG_TEMPLATE = `# {{DATE}}

Daily log for this date. Each entry should capture **what was attempted, what changed, and what was learned**.

## How to use this file

- Start your day by appending a new section with your name/agent label.
- For each task, record:
  - The goal
  - Key steps or commands
  - Outcomes (success/failure)
  - Any follow-ups or questions

## Entries

### [Your Name or Agent Label]

**Task:** Short description of what you're doing  
**Context:** Link to issue/ticket if relevant

**Actions:**
- Step 1 …
- Step 2 …

**Outcome:**
- What worked / what failed
- Links to PRs, commits, or files touched

**Learnings / Notes:**
- Anything worth moving later to \`AUTO_MEMORY.md\` or \`PROJECT_MEMORY.md\`.
`;

/**
 * Detects the current state of the repository.
 */
async function detectRepoState() {
  const entries = await fs.readdir('.', { withFileTypes: true });
  const folders = entries.filter(d => d.isDirectory()).map(d => d.name);
  const files = entries.filter(d => d.isFile()).map(d => d.name);

  const ideFolders = folders.filter(f =>
    ['vscode', 'cursor', 'antigravity', 'skills', '.github', '.agent', '.claude', '.windsurf'].includes(f)
  );

  const hasMaster = await fs.pathExists('.ai/master-skill.md');

  const hasAgentFiles =
    files.includes('CLAUDE.md') ||
    files.includes('.cursorrules') ||
    await fs.pathExists('.agent') ||
    await fs.pathExists('.github/copilot-instructions.md') ||
    await fs.pathExists('.windsurf') ||
    await fs.pathExists('skills');

  return {
    isNewRepo: ideFolders.length === 0 && !hasMaster && !hasAgentFiles,
    hasExistingSetup: hasMaster || ideFolders.length > 0 || hasAgentFiles,
    detectedIdes: ideFolders
  };
}

/**
 * Mapping between IDE labels and their target configuration files and templates.
 */
function ideTargets(ideLabel) {
  const target = TARGETS.find(t => t.label === ideLabel);
  if (target) return { targetPath: target.path, templateName: target.template };
  throw new Error(`Unknown IDE label: ${ideLabel}`);
}

/**
 * Renders a template by replacing placeholders with context values.
 */
function renderTemplate(raw, context = {}) {
  const listOrNone = (arr) =>
    arr && arr.length ? arr.join(', ') : 'None';

  return raw
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
 * Gathers rich project context from the user.
 */
async function gatherContext() {
  // Tier 1: core project info
  const base = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (for docs and skills):',
      default: path.basename(process.cwd())
    },
    {
      type: 'input',
      name: 'description',
      message: 'One-sentence description:',
      default: 'A new project.'
    },
    {
      type: 'list',
      name: 'projectType',
      message: 'What kind of project is this?',
      choices: [
        'Web app',
        'API / backend service',
        'CLI tool',
        'Data / ML project',
        'Library / SDK',
        'Internal tooling / dashboard',
        'Other'
      ]
    }
  ]);

  const answers = { ...base };

  // Tier 2: stack (conditional)
  if (['Web app', 'Internal tooling / dashboard', 'Other'].includes(answers.projectType)) {
    const fe = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'frontend',
        message: 'Frontend stack (if any):',
        choices: ['React', 'Next.js', 'Vue', 'Svelte', 'Native mobile', 'HTMX', 'None'],
        default: ['React']
      }
    ]);
    answers.frontend = fe.frontend;
  } else {
    answers.frontend = [];
  }

  if (answers.projectType !== 'Library / SDK') {
    const be = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'backend',
        message: 'Backend stack (if any):',
        choices: ['Node/Express', 'NestJS', 'FastAPI', 'Django', 'Rails', 'Spring', 'Go', 'Rust', 'Other', 'None'],
        default: ['Node/Express']
      },
      {
        type: 'checkbox',
        name: 'datastores',
        message: 'Primary data stores (if any):',
        choices: ['Postgres', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'S3/Blob', 'Vector DB', 'None']
      }
    ]);
    answers.backend = be.backend;
    answers.datastores = be.datastores;
  } else {
    answers.backend = [];
    answers.datastores = [];
  }

  // Tier 3: domain & risk
  const domain = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'domainTags',
      message: 'Domain tags (select any that apply):',
      choices: [
        'Financial',
        'Healthcare',
        'E-commerce',
        'Developer tools',
        'Education',
        'Internal tooling',
        'Open-source library',
        'Consumer app',
        'Other'
      ]
    },
    {
      type: 'list',
      name: 'riskLevel',
      message: 'Risk level:',
      choices: [
        'Low (Internal/Sandbox)',
        'Medium (Standard production)',
        'High (Critical/Financial/Healthcare)'
      ],
      default: 'Medium (Standard production)'
    }
  ]);
  answers.domainTags = domain.domainTags;
  answers.riskLevel = domain.riskLevel;

  // Tier 4: workflow & team
  const workflow = await inquirer.prompt([
    {
      type: 'list',
      name: 'teamSize',
      message: 'Team size:',
      choices: ['Solo', 'Small team (2–5)', 'Larger team (6+)'],
      default: 'Solo'
    },
    {
      type: 'list',
      name: 'gitWorkflow',
      message: 'Git workflow:',
      choices: ['Trunk-based', 'GitFlow', 'Feature branches only', 'Ad-hoc'],
      default: 'Feature branches only'
    },
    {
      type: 'list',
      name: 'testingSetup',
      message: 'Testing setup:',
      choices: [
        'None yet',
        'Unit tests only',
        'Unit + integration',
        'Unit + integration + E2E'
      ],
      default: 'Unit tests only'
    }
  ]);
  Object.assign(answers, workflow);

  // Tier 5: agent usage style
  const agent = await inquirer.prompt([
    {
      type: 'list',
      name: 'agentStyle',
      message: 'How should the agent behave?',
      choices: [
        'Pair programmer (small, iterative suggestions)',
        'More autonomous (larger changes, then summarize)',
        'Very conservative (propose plans, minimal direct edits)'
      ],
      default: 'Pair programmer (small, iterative suggestions)'
    },
    {
      type: 'list',
      name: 'editPermissions',
      message: 'How much is the agent allowed to modify?',
      choices: [
        'Only current file',
        'Multiple files in same module',
        'Whole repo (with clear summaries)'
      ],
      default: 'Multiple files in same module'
    }
  ]);
  Object.assign(answers, agent);

  // Tier 6: “extra contexts” / modes
  const extras = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'extras',
      message: 'Additional contexts:',
      choices: [
        'Figma design',
        'Data-heavy / analytics',
        'LLM / RAG',
        'Infrastructure / DevOps heavy',
        'Presentation-focused',
        'Performance-critical',
        'Accessibility-focused'
      ]
    }
  ]);
  answers.extras = extras.extras;

  return {
    projectName: answers.projectName,
    description: answers.description,
    projectType: answers.projectType,
    frontend: answers.frontend,
    backend: answers.backend,
    datastores: answers.datastores,
    domainTags: answers.domainTags,
    riskLevel: answers.riskLevel,
    teamSize: answers.teamSize,
    gitWorkflow: answers.gitWorkflow,
    testingSetup: answers.testingSetup,
    agentStyle: answers.agentStyle,
    editPermissions: answers.editPermissions,
    extras: answers.extras
  };
}

/**
 * Writes content to a target path, handling backups and symlinks.
 * Used for mirroring (master -> docs) but NOT for IDE wrappers (Behavior Contract).
 */
async function writeTarget(sourcePath, targetPath, options = {}) {
  const { interactive = false, backup = true } = options;
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

/**
 * Reads a template and writes it to a target path.
 * Used for scaffolding independent wrappers.
 */
async function ensureFromTemplate(templateName, targetPath, context, options = {}) {
  const { interactive = false, backup = true } = options;
  const templatePath = path.join(__dirname, 'templates', templateName);

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

  const raw = await fs.readFile(templatePath, 'utf8');
  const rendered = renderTemplate(raw, context);
  await fs.writeFile(targetPath, rendered);
  if (interactive) console.log(chalk.green(`Created/Updated ${targetPath} from template ${templateName}`));
}

/**
 * Seeds the master skill from a preset.
 */
async function ensureMasterFromPreset(preset, context, options = {}) {
  const { interactive = false, backup = true } = options;
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

  const templatePath = path.join(__dirname, 'templates', templateName);

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
 * Performs a sync. According to the Behavior Contract:
 * - Does not overwrite IDE wrappers by default.
 * - If regenerateWrappers is set, updates them from templates.
 */
async function performSync(options = {}) {
  const { interactive = false, regenerateWrappers = false, selectedIdes = null } = options;
  const masterPath = '.ai/master-skill.md';

  if (!(await fs.pathExists(masterPath))) {
    console.log(chalk.red('No .ai/master-skill.md found. Run "rosetta" to scaffold first.'));
    return;
  }

  const idesToSync = selectedIdes || TARGETS.map(t => t.label);

  if (regenerateWrappers) {
    console.log(chalk.blue('Regenerating IDE wrappers from templates...'));
    for (const ideLabel of idesToSync) {
      const { targetPath, templateName } = ideTargets(ideLabel);
      await ensureFromTemplate(templateName, targetPath, {}, { interactive, backup: true });
    }
  } else {
    console.log(chalk.blue('Verifying IDE wrappers...'));
    for (const ideLabel of idesToSync) {
      const { targetPath } = ideTargets(ideLabel);
      if (await fs.pathExists(targetPath)) {
        console.log(chalk.gray(`- ${targetPath} exists and references master spec.`));
      } else if (interactive) {
        const { create } = await inquirer.prompt([{
          type: 'confirm',
          name: 'create',
          message: `${chalk.yellow(targetPath)} is missing. Create from template?`,
          default: true
        }]);
        if (create) {
          const { templateName } = ideTargets(ideLabel);
          await ensureFromTemplate(templateName, targetPath, {}, { interactive: false });
        }
      }
    }
    console.log(chalk.green(`\nMaster spec: ${masterPath} is the source of truth.`));
    console.log(chalk.gray('IDE wrappers already reference this spec; content not modified.'));
  }
}

/**
 * Flow: Scaffold new setup.
 */
async function scaffoldNew() {
  const { preset } = await inquirer.prompt([{
    type: 'list',
    name: 'preset',
    message: 'Choose a starter template for your master skill:',
    choices: [
      { name: 'Minimal (blank structure)', value: 'minimal' },
      { name: 'Agentic starter (generic dev project)', value: 'agentic-starter' },
      { name: 'Skill-creator style starter (help building skills)', value: 'skill-creator' }
    ]
  }]);

  const { useExtraContext } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useExtraContext',
    message: 'Would you like to provide extra project context (stack, domain, goals)?',
    default: true
  }]);

  let context = {};
  if (useExtraContext) {
    context = await gatherContext();
  }

  await ensureMasterFromPreset(preset, context, { interactive: true });

  const { ides } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'ides',
    message: 'Select IDEs to scaffold:',
    choices: TARGETS.map(t => t.label),
    default: ['VSCode / Claude Code', 'Cursor']
  }]);

  // Create core files
  await ensureFromTemplate('AGENT.md', '.ai/AGENT.md', context, { interactive: true });
  await ensureFromTemplate('task.md', '.ai/task.md', context, { interactive: true });

  // Create IDE adapters from templates (Behavior Contract: do not symlink master)
  for (const ide of ides) {
    const { targetPath, templateName } = ideTargets(ide);
    await ensureFromTemplate(templateName, targetPath, context, { interactive: true });
  }

  // --- Starter Skills logic ---
  const starterSkills = inferStarterSkills(context);
  if (starterSkills.length) {
    const { addSkills } = await inquirer.prompt([{
      type: 'confirm',
      name: 'addSkills',
      message: `Detected useful starter skills (${starterSkills.length}). Create them under skills/?`,
      default: true
    }]);

    if (addSkills) {
      for (const skillTpl of starterSkills) {
        const name = skillTpl.replace('.skill.md', '');
        await createSkillFromTemplate(name, skillTpl, context);
      }
    }
  }

  // --- Memory Layout scaffolding ---
  console.log(chalk.blue('\nScaffolding memory and logs layout under .ai/...'));
  await fs.ensureDir('.ai/memory');
  await fs.ensureDir(path.join('.ai/memory', 'entities'));
  await fs.ensureDir(path.join('.ai/logs', 'daily'));

  const projectMemPath = path.join('.ai/memory', 'PROJECT_MEMORY.md');
  if (!(await fs.pathExists(projectMemPath))) {
    await fs.writeFile(projectMemPath, PROJECT_MEMORY_TEMPLATE);
  }

  const autoMemPath = path.join('.ai/memory', 'AUTO_MEMORY.md');
  if (!(await fs.pathExists(autoMemPath))) {
    await fs.writeFile(autoMemPath, AUTO_MEMORY_TEMPLATE);
  }

  const today = new Date().toISOString().slice(0, 10);
  const logPath = path.join('.ai/logs', 'daily', `${today}.md`);
  if (!(await fs.pathExists(logPath))) {
    const logContent = DAILY_LOG_TEMPLATE.replace(/{{DATE}}/g, today);
    await fs.writeFile(logPath, logContent);
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
    console.log(chalk.blue('Updating .gitignore...'));
    let content = await fs.readFile(gitignorePath, 'utf8');
    const toAdd = gitignoreEntries.filter(entry => entry !== '' && !content.includes(entry));
    if (toAdd.length) {
      await fs.appendFile(gitignorePath, '\n' + gitignoreEntries.join('\n') + '\n');
    }
  } else {
    console.log(chalk.blue('Creating .gitignore...'));
    await fs.writeFile(gitignorePath, gitignoreEntries.join('\n') + '\n');
  }

  console.log(chalk.bold.green(`\nNew agentic structure created with preset: ${preset}`));
  console.log(chalk.cyan('Rosetta is a local filesystem utility. Your IDE wrappers reference .ai/master-skill.md.'));
}

/**
 * Flow: Create a new skill directory with SKILL.md and tests/prompts.md boilerplates.
 */
async function createSkill(skillName, options = {}) {
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

  const skillTpl = path.join(__dirname, 'templates', 'skill-boilerplate.md');
  const testTpl = path.join(__dirname, 'templates', 'skill-tests-boilerplate.md');

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
 * Creates a skill from a specific template.
 */
async function createSkillFromTemplate(skillName, templateName, context = {}) {
  const skillDir = path.join('skills', skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');
  const templatePath = path.join(__dirname, 'templates', 'skills', templateName);

  await fs.ensureDir(skillDir);
  const raw = await fs.readFile(templatePath, 'utf8');
  const rendered = renderTemplate(raw, context);
  await fs.writeFile(skillFile, rendered);

  console.log(chalk.green(`Created skill ${chalk.bold(skillName)} from template ${templateName}`));
}

/**
 * Infers which starter skills to suggest based on project context.
 */
function inferStarterSkills(context) {
  const skills = [];

  if (context.backend.includes('Node/Express') &&
    context.datastores.includes('Postgres')) {
    skills.push('node-express-postgres.skill.md');
  }

  if (context.testingSetup === 'Unit + integration + E2E') {
    skills.push('testing-full-pyramid.skill.md');
  }

  if (context.projectType === 'Data / ML project') {
    skills.push('data-ml-project.skill.md');
  }

  if (context.frontend.includes('React') || context.frontend.includes('Next.js')) {
    skills.push('frontend-react-next.skill.md');
  }

  return skills;
}

/**
 * Flow: Migrate existing setup.
 */
async function migrateExisting() {
  const masterPath = '.ai/master-skill.md';
  const existing = await findExistingAgentFiles();

  if (existing.length === 0) {
    console.log(chalk.red('No existing agent files found. Try "Scaffold new agentic coding setup" instead.'));
    return;
  }

  if (!(await fs.pathExists(masterPath))) {
    const { sourceChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'sourceChoice',
      message: 'Create .ai/master-skill.md from which source?',
      choices: [
        ...existing.filter(f => !f.endsWith('/')),
        'Merge all (concatenate)'
      ]
    }]);

    await fs.ensureDir('.ai');

    if (sourceChoice === 'Merge all (concatenate)') {
      let merged = '';
      for (const f of existing.filter(x => !x.endsWith('/'))) {
        const content = await fs.readFile(f, 'utf8');
        merged += `\n\n<!-- Source: ${f} -->\n\n` + content;
      }
      await fs.writeFile(masterPath, merged.trimStart());
      console.log(chalk.blue(`Merged files into ${masterPath}`));
    } else {
      const content = await fs.readFile(sourceChoice, 'utf8');
      const header = `<!-- Generated by rosetta from ${sourceChoice} -->\n\n`;
      await fs.writeFile(masterPath, header + content);
      console.log(chalk.blue(`Created ${masterPath} from ${sourceChoice}`));
    }
  }

  const { regenerate } = await inquirer.prompt([{
    type: 'confirm',
    name: 'regenerate',
    message: 'Would you like to (re)generate IDE wrappers from Rosetta templates?',
    default: false
  }]);

  if (regenerate) {
    const { ides } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'ides',
      message: 'Select IDEs to (re)generate wrappers for:',
      choices: TARGETS.map(t => t.label)
    }]);

    await performSync({ interactive: true, regenerateWrappers: true, selectedIdes: ides });
  }

  console.log(chalk.bold.green('Migration complete.'));
}

/**
 * Finds existing agent-specific configuration files.
 */
async function findExistingAgentFiles() {
  const result = [];
  if (await fs.pathExists('CLAUDE.md')) result.push('CLAUDE.md');
  if (await fs.pathExists('.cursorrules')) result.push('.cursorrules');
  if (await fs.pathExists('.github/copilot-instructions.md')) result.push('.github/copilot-instructions.md');
  if (await fs.pathExists('.windsurf/rules')) result.push('.windsurf/rules/');
  if (await fs.pathExists('skills')) result.push('skills/');
  if (await fs.pathExists('.agent/skills')) result.push('.agent/skills/');
  return result;
}

/**
 * Watch mode logic.
 * Behavior Contract: On change, logs status but does not overwrite wrappers.
 */
async function watchMode() {
  const masterPath = '.ai/master-skill.md';
  if (!(await fs.pathExists(masterPath))) {
    console.log(chalk.red('No .ai/master-skill.md found. Run "rosetta" to scaffold first.'));
    return;
  }

  console.log(chalk.cyan(`Watching ${masterPath} for changes...`));

  const watcher = chokidar.watch(masterPath, {
    persistent: true,
    ignoreInitial: true
  });

  watcher.on('change', () => {
    console.log(chalk.blue(`\n[${new Date().toLocaleTimeString()}] Change detected in master spec.`));
    console.log(chalk.gray('IDE wrappers already reference .ai/master-skill.md; no file changes needed.'));
  });
}

/**
 * Main entry point.
 */
async function main() {
  program
    .version('0.1.0')
    .description('Sync AI agent rule files across IDEs');

  program
    .command('sync')
    .description('Verify IDE wrappers or regenerate them from templates')
    .option('-r, --regenerate-wrappers', 'Regenerate IDE wrapper files from templates')
    .action(async (cmdObj) => {
      await performSync({
        interactive: false,
        regenerateWrappers: cmdObj.regenerateWrappers
      });
    });

  program
    .command('watch')
    .description('Watch .ai/master-skill.md and log status on change')
    .action(async () => {
      await watchMode();
    });

  program
    .command('new-skill <name>')
    .description('Create a new skill folder with SKILL.md and tests/prompts.md boilerplates')
    .action(async (name) => {
      await createSkill(name, { interactive: true });
    });

  program
    .command('interactive', { isDefault: true })
    .description('Run rosetta in interactive mode')
    .action(async () => {
      const state = await detectRepoState();

      const { action } = await inquirer.prompt([{
        type: 'list',
        name: 'action',
        message: 'What would you like to do?',
        choices: state.isNewRepo
          ? ['Scaffold new agentic coding setup']
          : [
            'Verify/Sync existing multi-IDE setup',
            'Migrate existing agent files and add new IDEs',
            'Scaffold new agentic coding setup',
            'Start watch mode'
          ]
      }]);

      if (action === 'Scaffold new agentic coding setup') {
        await scaffoldNew();
      } else if (action === 'Verify/Sync existing multi-IDE setup') {
        const { regenerate } = await inquirer.prompt([{
          type: 'confirm',
          name: 'regenerate',
          message: 'Regenerate IDE wrappers from templates?',
          default: false
        }]);
        await performSync({ interactive: true, regenerateWrappers: regenerate });
      } else if (action === 'Migrate existing agent files and add new IDEs') {
        await migrateExisting();
      } else if (action === 'Start watch mode') {
        await watchMode();
      }
    });

  program.parse(process.argv);
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
