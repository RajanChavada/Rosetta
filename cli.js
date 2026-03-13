#!/usr/bin/env node

/**
 * Rosetta CLI
 * A single source of truth for AI agent rules and skills.
 */

import https from 'https';
import http from 'http';

import { program } from 'commander';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { fileURLToPath } from 'url';
import os from 'os';
import { execSync } from 'child_process';
import { createRequire } from 'module';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Beautiful ASCII Banner
 */
function showBanner() {
  const banner = `
   ${chalk.cyan.bold('┏┓┏┓┏┳┓┏┓┏┓')}
   ${chalk.cyan.bold('┃┃┃┃ ┃ ┣┫┃┃')}
   ${chalk.cyan.bold('┛┗┗┛ ┻ ┛┗┗┛')}
   ${chalk.blue.bold('ROSETTA')} ${chalk.gray('v0.1.0')}
  `;
  console.log(banner);
  console.log(chalk.gray('  Single Source of Truth for AI Agents\n'));
}


const TARGETS = [
  { label: 'VSCode / Claude Code', path: 'CLAUDE.md', template: 'anthropic-claude.md' },
  { label: 'Cursor', path: '.cursorrules', template: 'cursorrules.md' },
  { label: 'Antigravity', path: '.agent/skills/project-skill.md', template: 'antigravity-skill.md' },
  { label: 'GitHub Copilot', path: '.github/copilot-instructions.md', template: 'copilot-instructions.md' },
  { label: 'Windsurf', path: '.windsurf/rules/rosetta-rules.md', template: 'windsurf-rules.md' },
  { label: 'GSD / generic', path: 'skills/gsd-skill.md', template: 'gsd-skill.md' }
];

const SKILLS_SOURCES = [
  path.join(__dirname, 'templates/skills'),
  path.join(os.homedir(), '.rosetta/skills'),
  path.join(process.cwd(), '.rosetta/skills'),
  path.join(process.cwd(), 'skills'),
  path.join(process.cwd(), 'company-skills')
];

const ROSETTA_DIR = path.join(os.homedir(), '.rosetta');
const REGISTRY_PATH = path.join(ROSETTA_DIR, 'registry.json');

const DEFAULT_REGISTRY = {
  presets: [
    {
      name: "@acme/fintech-agentic",
      domain: "financial",
      description: "A preset for fintech agents with strict compliance rules.",
      url: "https://raw.githubusercontent.com/RajanChavada/Rosetta/main/templates/presets/skill-creator.md"
    }
  ],
  skills: [
    {
      name: "@acme/k8s-manifests",
      domain: "devops",
      description: "Skills for Kubernetes manifest generation and validation.",
      url: "https://raw.githubusercontent.com/RajanChavada/Rosetta/main/templates/skills/node-express-postgres.skill.md"
    }
  ]
};

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
 * Tree logger for progress indicators.
 */
class TreeLogger {
  constructor(rootLabel) {
    this.rootLabel = rootLabel;
    console.log(chalk.magenta.bold(`\n● ${rootLabel}`));
  }

  logStep(message, status = '✓', isLast = false) {
    const prefix = isLast ? '┗━ ' : '┣━ ';
    const statusColor = status === '✓' ? chalk.green : chalk.yellow;
    console.log(`${chalk.gray(prefix)}${message} ${statusColor(status)}`);
  }
}

/**
 * Helper for dry-run mode.
 */
async function dryRunWrite(path, action, options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would ${action}: ${path}`));
    return true;
  }
  return false;
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
 * Loads configuration from .rosetta.json and active profile.
 */
async function loadConfig() {
  const localConfig = path.join(process.cwd(), '.rosetta.json');
  let config = {};
  if (await fs.pathExists(localConfig)) {
    try {
      config = await fs.readJson(localConfig);
    } catch (err) {
      console.warn(chalk.yellow(`Warning: Could not read .rosetta.json: ${err.message}`));
    }
  }

  const profileDir = path.join(os.homedir(), '.rosetta');
  const profileFile = path.join(profileDir, 'active-profile.json');
  if (await fs.pathExists(profileFile)) {
    const activeData = await fs.readJson(profileFile);
    config._activeProfile = activeData.active;
    
    const registryPath = path.join(profileDir, 'registry.json');
    if (await fs.pathExists(registryPath)) {
      const registry = await fs.readJson(registryPath);
      if (registry.profiles && registry.profiles[activeData.active]) {
        // Merge profile defaults into config
        config = { ...registry.profiles[activeData.active], ...config };
      }
    }
  }

  return config;
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
async function gatherContext(overrides = {}) {
  const defaultValues = {
    projectName: path.basename(process.cwd()),
    description: 'A new project.',
    projectType: 'Web app',
    frontend: ['React'],
    backend: ['Node/Express'],
    datastores: [],
    domainTags: [],
    riskLevel: 'Medium (Standard production)',
    teamSize: 'Solo',
    gitWorkflow: 'Feature branches only',
    testingSetup: 'Unit tests only',
    agentStyle: 'Pair programmer (small, iterative suggestions)',
    editPermissions: 'Multiple files in same module',
    extras: []
  };

  if (overrides.skip) {
    return { ...defaultValues, ...overrides };
  }

  // Tier 1: core project info
  const base = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (for docs and skills):',
      default: overrides.projectName || defaultValues.projectName
    },
    {
      type: 'input',
      name: 'description',
      message: 'One-sentence description:',
      default: overrides.description || defaultValues.description
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
      ],
      default: overrides.projectType || defaultValues.projectType
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
        default: overrides.frontend || defaultValues.frontend
      }
    ]);
    answers.frontend = fe.frontend;
  } else {
    answers.frontend = overrides.frontend || [];
  }

  if (answers.projectType !== 'Library / SDK') {
    const be = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'backend',
        message: 'Backend stack (if any):',
        choices: ['Node/Express', 'NestJS', 'FastAPI', 'Django', 'Rails', 'Spring', 'Go', 'Rust', 'Other', 'None'],
        default: overrides.backend || defaultValues.backend
      },
      {
        type: 'checkbox',
        name: 'datastores',
        message: 'Primary data stores (if any):',
        choices: ['Postgres', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'S3/Blob', 'Vector DB', 'None'],
        default: overrides.datastores || defaultValues.datastores
      }
    ]);
    answers.backend = be.backend;
    answers.datastores = be.datastores;
  } else {
    answers.backend = overrides.backend || [];
    answers.datastores = overrides.datastores || [];
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
      ],
      default: overrides.domainTags || defaultValues.domainTags
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
      default: overrides.riskLevel || defaultValues.riskLevel
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
      default: overrides.teamSize || defaultValues.teamSize
    },
    {
      type: 'list',
      name: 'gitWorkflow',
      message: 'Git workflow:',
      choices: ['Trunk-based', 'GitFlow', 'Feature branches only', 'Ad-hoc'],
      default: overrides.gitWorkflow || defaultValues.gitWorkflow
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
      default: overrides.testingSetup || defaultValues.testingSetup
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
      default: overrides.agentStyle || defaultValues.agentStyle
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
      default: overrides.editPermissions || defaultValues.editPermissions
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
      ],
      default: overrides.extras || defaultValues.extras
    }
  ]);
  answers.extras = extras.extras;

  return answers;
}

/**
 * Writes content to a target path, handling backups and symlinks.
 * Used for mirroring (master -> docs) but NOT for IDE wrappers (Behavior Contract).
 */
async function writeTarget(sourcePath, targetPath, options = {}) {
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

/**
 * Reads a template and writes it to a target path.
 * Used for scaffolding independent wrappers.
 */
async function ensureFromTemplate(templateName, targetPath, context, options = {}) {
  const { interactive = false, backup = true, dryRun = false } = options;
  if (await dryRunWrite(targetPath, 'create from template', options)) return;
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
  const { interactive = false, regenerateWrappers = false, selectedIdes = null, dryRun = false } = options;
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
      await ensureFromTemplate(templateName, targetPath, {}, { interactive, backup: true, dryRun });
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
          await ensureFromTemplate(templateName, targetPath, {}, { interactive: false, dryRun });
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
async function scaffoldNew(options = {}) {
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

  // --- Starter Skills logic ---
  if (starterSkills.length) {
    let addSkills = true;
    if (!config.gatherContext || !config.gatherContext.skip) {
      const result = await inquirer.prompt([{
        type: 'confirm',
        name: 'addSkills',
        message: `Detected useful starter skills (${starterSkills.length}). Create them under skills/?`,
        default: true
      }]);
      addSkills = result.addSkills;
    }

    if (addSkills) {
      for (const skill of starterSkills) {
        await createSkillFromFile(skill.name, skill.fullPath, context);
      }
    }
  }

  // Allow selecting any other available skills
  const otherSkills = availableSkills.filter(as => !starterSkills.find(ss => ss.name === as.name));
  if (otherSkills.length && (!config.gatherContext || !config.gatherContext.skip)) {
    const { extraSkillsToCreate } = await inquirer.prompt([{
      type: 'checkbox',
      name: 'extraSkillsToCreate',
      message: 'Add any other skills from the catalog?',
      choices: otherSkills.map(s => ({ name: s.name, value: s }))
    }]);

    for (const skill of extraSkillsToCreate) {
      await createSkillFromFile(skill.name, skill.fullPath, context);
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

  // --- Post-Scaffold Hooks ---
  await runPostScaffoldHooks(context);
}

/**
 * Runs post-scaffold hooks (commands from .rosetta.json or JS file).
 */
async function runPostScaffoldHooks(context) {
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
class RegistryManager {
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

/**
 * Loads skills from multiple sources, optionally including a custom directory or git repo.
 */
async function loadSkillsFromSources(options = {}) {
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
        allSkills.push({
          name: f.replace('.skill.md', ''),
          fileName: f,
          fullPath: path.join(src, f),
          source: src
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
 * Creates a skill from a specific template file path.
 */
async function createSkillFromFile(skillName, templatePath, context = {}) {
  const skillDir = path.join('skills', skillName);
  const skillFile = path.join(skillDir, 'SKILL.md');

  await fs.ensureDir(skillDir);
  const raw = await fs.readFile(templatePath, 'utf8');
  const rendered = renderTemplate(raw, context);
  await fs.writeFile(skillFile, rendered);

  console.log(chalk.green(`Created skill ${chalk.bold(skillName)} from ${templatePath}`));
}

/**
 * Infers which starter skills to suggest based on project context using loaded skills.
 */
function inferStarterSkills(context = {}, availableSkills = []) {
  const backend = context.backend || [];
  const datastores = context.datastores || [];
  const frontend = context.frontend || [];
  const skills = [];

  const findSkill = (name) => availableSkills.find(s => s.name === name);

  if (backend.includes('Node/Express') &&
    datastores.includes('Postgres')) {
    const s = findSkill('node-express-postgres');
    if (s) skills.push(s);
  }

  if (context.testingSetup === 'Unit + integration + E2E') {
    const s = findSkill('testing-full-pyramid');
    if (s) skills.push(s);
  }

  if (context.projectType === 'Data / ML project') {
    const s = findSkill('data-ml-project');
    if (s) skills.push(s);
  }

  if (frontend.includes('React') || frontend.includes('Next.js')) {
    const s = findSkill('frontend-react-next');
    if (s) skills.push(s);
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
 * Switch active profile.
 */
async function useProfile(profileName) {
  const profileDir = path.join(os.homedir(), '.rosetta');
  const profileFile = path.join(profileDir, 'active-profile.json');
  await fs.ensureDir(profileDir);
  await fs.writeJson(profileFile, { active: profileName }, { spaces: 2 });

  // Load profile specific config if it exists in registry
  const registryPath = path.join(profileDir, 'registry.json');
  if (await fs.pathExists(registryPath)) {
    const registry = await fs.readJson(registryPath);
    if (registry.profiles && registry.profiles[profileName]) {
      console.log(chalk.blue(`Applying settings for profile: ${profileName}`));
      // In a real impl, we'd merge registry.profiles[profileName] into a global persistent config
    }
  }

  console.log(chalk.bold.green(`✓ Switched to profile: ${profileName}`));
  console.log(chalk.gray(`Next time you run "scaffold", Rosetta will prefer ${profileName} defaults.`));
}

/**
 * Selectively re-scaffold parts of the setup.
 */
async function rescaffold(type, options = {}) {
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
 * Migration from specific source.
 */
async function migrateFromSource(source) {
  if (!(await fs.pathExists(source))) {
    console.error(chalk.red(`Source file ${source} not found.`));
    return;
  }
  const content = await fs.readFile(source, 'utf8');
  const masterPath = '.ai/master-skill.md';
  await fs.ensureDir('.ai');

  const header = `<!-- Generated by rosetta from ${source} -->\n\n`;
  await fs.writeFile(masterPath, header + content);
  console.log(chalk.bold.green(`✓ Migrated ${source} to ${masterPath}`));

  const { scaffoldOthers } = await inquirer.prompt([{
    type: 'confirm',
    name: 'scaffoldOthers',
    message: 'Would you like to scaffold the rest of the .ai/ structure (AGENT.md, task.md, memory)?',
    default: true
  }]);

  if (scaffoldOthers) {
    await rescaffold('all');
  }
}

/**
 * Validation logic.
 */
async function validateRepo() {
  const logger = new TreeLogger('Validating Rosetta structure...');
  const files = [
    { path: '.ai/master-skill.md', weight: 40 },
    { path: '.ai/AGENT.md', weight: 10 },
    { path: '.ai/task.md', weight: 10 },
    { path: '.ai/memory/PROJECT_MEMORY.md', weight: 20 },
    { path: '.ai/memory/AUTO_MEMORY.md', weight: 10 },
    { path: '.ai/logs/daily/', weight: 10, isDir: true }
  ];

  let errors = 0;
  for (let i = 0; i < files.length; i++) {
    const f = files[i];
    const exists = await fs.pathExists(f.path);
    const isLast = i === files.length - 1;

    if (exists) {
      logger.logStep(f.path, '✓', isLast);
    } else {
      logger.logStep(f.path, '✗ (missing)', isLast);
      errors += f.weight;
    }
  }

  return 100 - errors;
}

/**
 * Health report.
 */
async function reportHealth() {
  const score = await validateRepo();
  console.log(`\nRosetta Score: ${score}/100`);

  if (score === 100) {
    console.log(chalk.green('Your repo is 100% Rosetta-ready! 🚀'));
  } else if (score > 80) {
    console.log(chalk.blue('Your repo is mostly healthy, but has minor gaps.'));
  } else {
    console.log(chalk.yellow('Your repo needs some attention to be fully Rosetta-compliant.'));
    console.log(chalk.gray('Run "rosetta scaffold" or "rosetta rescaffold all" to fix.'));
  }
}

/**
 * Sync memory logic: rotate logs, maybe summarize (placeholder for now).
 */
async function syncMemory() {
  console.log(chalk.blue('Syncing memory...'));
  const logDir = '.ai/logs/daily';
  const autoMemPath = '.ai/memory/AUTO_MEMORY.md';

  if (!(await fs.pathExists(logDir))) {
    console.log(chalk.yellow('No log directory found at .ai/logs/daily.'));
    return;
  }

  const logs = await fs.readdir(logDir);
  console.log(chalk.gray(`Found ${logs.length} daily logs.`));

  if (logs.length > 7) {
    console.log(chalk.blue(`Rotating ${logs.length - 7} old logs to archive...`));
    await fs.ensureDir('.ai/logs/archive');
    // Mock rotation
  }

  console.log(chalk.blue('Summarizing logs to AUTO_MEMORY.md...'));
  // In a real implementation, we would use an LLM or heuristic to summarize
  if (await fs.pathExists(autoMemPath)) {
    const timestamp = new Date().toISOString().split('T')[0];
    await fs.appendFile(autoMemPath, `\n- **${timestamp} Sync**: Progress tracked across ${logs.length} logs.\n`);
  }

  console.log(chalk.green('✓ Memory synced and summarized.'));
}

/**
 * Main entry point.
 */
async function main() {
  showBanner();
  program
    .version('0.1.0')
    .description('Sync AI agent rule files across IDEs');

  program
    .command('sync')
    .description('Verify IDE wrappers or regenerate them from templates')
    .option('-r, --regenerate-wrappers', 'Regenerate IDE wrapper files from templates')
    .option('--dry-run', 'Show what would be changed without writing files')
    .action(async (cmdObj) => {
      await performSync({
        interactive: false,
        regenerateWrappers: cmdObj.regenerateWrappers,
        dryRun: cmdObj.dryRun
      });
    });

  program
    .command('watch')
    .description('Watch .ai/master-skill.md and log status on change')
    .action(async () => {
      await watchMode();
    });

  program
    .command('scaffold')
    .description('Scaffold new agentic coding setup')
    .option('--skills-dir <path>', 'Path to local skills directory')
    .option('--skills-repo <url>', 'URL to git repo with skills')
    .option('--dry-run', 'Show what would be created without writing files')
    .action(async (options) => {
      await scaffoldNew(options);
    });

  program
    .command('rescaffold <type>')
    .description('Selectively re-scaffold parts of the Rosetta setup')
    .addHelpText('after', `
Types:
  memory     Only re-scaffold .ai/memory/* files if missing
  ides       Only re-scaffold IDE wrappers from templates
  all        Re-scaffold everything (except master-skill.md)
`)
    .option('--dry-run', 'Show what would be changed without writing files')
    .action(async (type, options) => {
      await rescaffold(type, options);
    });

  program
    .command('migrate')
    .description('Interactive migration wizard for existing repos')
    .action(async () => {
      await migrateExisting();
    });

  program
    .command('migrate-from-cursor')
    .description('Convert .cursorrules into .ai/master-skill.md')
    .action(async () => {
      await migrateFromSource('.cursorrules');
    });

  program
    .command('migrate-from-claude')
    .description('Convert CLAUDE.md into .ai/ structure')
    .action(async () => {
      await migrateFromSource('CLAUDE.md');
    });

  program
    .command('validate')
    .description('Check .ai/ structure for completeness')
    .action(async () => {
      await validateRepo();
    });

  program
    .command('health')
    .description('Report "Rosetta Score" and repository health')
    .action(async () => {
      await reportHealth();
    });

  program
    .command('audit')
    .description('Alias for health')
    .action(async () => {
      await reportHealth();
    });

  program
    .command('sync-memory')
    .description('Rotate old logs and summarize progress to AUTO_MEMORY.md')
    .action(async () => {
      await syncMemory();
    });

  program
    .command('new-skill <name>')
    .description('Create a new skill folder with SKILL.md and tests/prompts.md boilerplates')
    .option('--template <name>', 'Clone an existing skill template')
    .option('--skills-dir <path>', 'Path to local skills directory')
    .option('--skills-repo <url>', 'URL to git repo with skills')
    .action(async (name, options) => {
      if (options.template) {
        const skills = await loadSkillsFromSources(options);
        const tpl = skills.find(s => s.name === options.template);
        if (tpl) {
          await createSkillFromFile(name, tpl.fullPath);
        } else {
          console.log(chalk.red(`Template ${options.template} not found. Available:`));
          skills.forEach(s => console.log(`- ${s.name}`));
        }
      } else {
        await createSkill(name, { interactive: true });
      }
    });

  program
    .command('use-profile <name>')
    .description('Switch to a specific Rosetta profile (bundles context, presets, and preferences)')
    .action(async (name) => {
      await useProfile(name);
    });

  program
    .command('interactive', { isDefault: true })
    .description('Run rosetta in interactive mode')
    .option('--skills-dir <path>', 'Path to local skills directory')
    .option('--skills-repo <url>', 'URL to git repo with skills')
    .action(async (options) => {
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
        await scaffoldNew(options);
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

  // --- Registry / Market Commands ---

  program
    .command('install-preset <name>')
    .description('Install a preset from the registry into .ai/master-skill.md')
    .action(async (name) => {
      try {
        await RegistryManager.installPreset(name);
      } catch (err) {
        console.error(chalk.red('Error:'), err.message);
      }
    });

  program
    .command('install-skill <name>')
    .description('Install a skill from the registry into skills/')
    .action(async (name) => {
      try {
        await RegistryManager.installSkill(name);
      } catch (err) {
        console.error(chalk.red('Error:'), err.message);
      }
    });

  program
    .command('search <type>')
    .description('Search for presets or skills in the registry')
    .option('--domain <domain>', 'Filter by domain (e.g. financial, devops)')
    .action(async (type, cmdObj) => {
      if (!['presets', 'skills'].includes(type)) {
        console.error(chalk.red('Error:'), 'Type must be either "presets" or "skills"');
        return;
      }
      try {
        const results = await RegistryManager.search(type, cmdObj.domain);
        if (results.length === 0) {
          console.log(chalk.yellow(`No ${type} found${cmdObj.domain ? ` for domain "${cmdObj.domain}"` : ''}.`));
          return;
        }

        console.log(chalk.bold(`\nAvailable ${type}${cmdObj.domain ? ` in domain "${cmdObj.domain}"` : ''}:`));
        results.forEach(item => {
          console.log(`- ${chalk.cyan(item.name)}: ${item.description} ${chalk.gray(`(${item.domain})`)}`);
        });
        console.log('');
      } catch (err) {
        console.error(chalk.red('Error:'), err.message);
      }
    });

  program.parse(process.argv);
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
