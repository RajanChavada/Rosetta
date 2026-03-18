import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { analyzeDependencies } from './analyzers/dependency-analyzer.js';
import { analyzeCodePatterns } from './analyzers/code-pattern-analyzer.js';
import { analyzeStructure } from './analyzers/structure-analyzer.js';
import { analyzeConventions } from './analyzers/convention-analyzer.js';
import { analyzeCloud } from './analyzers/cloud-analyzer.js';
import { analyzeMobile } from './analyzers/mobile-analyzer.js';

/**
 * Detects the current state of the repository.
 */
export async function detectRepoState() {
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
 * Detects configured IDEs and their skills folder locations.
 * Returns array of detected IDEs with their configuration details.
 */
export async function detectIdes(projectPath = process.cwd()) {
  const ides = [];

  // Claude Code
  if (await fs.pathExists(path.join(projectPath, '.claude'))) {
    ides.push({
      name: 'Claude Code',
      configDir: '.claude',
      skillsDir: '.claude/skills',
      instructionsFile: '.claude/CLAUDE.md'
    });
  }

  // Cursor
  if (await fs.pathExists(path.join(projectPath, '.cursorrules'))) {
    ides.push({
      name: 'Cursor',
      configFile: '.cursorrules',
      skillsDir: '.cursor/rules',
      instructionsFile: '.cursorrules'
    });
  }

  // GitHub Copilot
  if (await fs.pathExists(path.join(projectPath, '.github/copilot-instructions.md'))) {
    ides.push({
      name: 'GitHub Copilot',
      configDir: '.github',
      instructionsFile: '.github/copilot-instructions.md',
      skillsDir: '.github/skills'
    });
  }

  // Windsurf
  if (await fs.pathExists(path.join(projectPath, '.windsurf'))) {
    ides.push({
      name: 'Windsurf',
      configDir: '.windsurf',
      instructionsFile: '.windsurf/rules.md',
      skillsDir: '.windsurf/skills'
    });
  }

  // Codex CLI
  if (await fs.pathExists(path.join(projectPath, '.agent'))) {
    ides.push({
      name: 'Codex CLI',
      configDir: '.agent',
      instructionsFile: '.agent/instructions.md',
      skillsDir: '.agent/skills'
    });
  }

  // Generic skills directory
  if (await fs.pathExists(path.join(projectPath, 'skills'))) {
    ides.push({
      name: 'Generic',
      configDir: 'skills',
      skillsDir: 'skills'
    });
  }

  return ides;
}

/**
 * Auto-detect project type from file structure.
 * Returns project type and inferred tech stack information.
 */
export async function detectProjectType() {
  const hasPackageJson = await fs.pathExists('package.json');
  const hasGoMod = await fs.pathExists('go.mod');
  const hasRequirements = await fs.pathExists('requirements.txt');
  const hasPyproject = await fs.pathExists('pyproject.toml');
  const hasCargo = await fs.pathExists('Cargo.toml');
  const hasGemfile = await fs.pathExists('Gemfile');

  if (hasPackageJson) return detectNodeProjectType();
  if (hasGoMod) return { type: 'Go service', stack: { language: 'Go', backend: ['Go'] } };
  if (hasRequirements || hasPyproject) return detectPythonProjectType(hasRequirements, hasPyproject);
  if (hasCargo) return { type: 'Rust service', stack: { language: 'Rust', backend: ['Rust'] } };
  if (hasGemfile) return { type: 'Ruby service', stack: { language: 'Ruby', backend: ['Rails'] } };

  return { type: 'Unknown', stack: { language: 'Unknown', frontend: [], backend: [], datastores: [] } };
}

/**
 * Detect Node.js project type and stack from package.json.
 */
async function detectNodeProjectType() {
  try {
    const pkg = await fs.readJson('package.json');
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const stack = { language: 'TypeScript/JavaScript', frontend: [], backend: [], datastores: [] };

    // Detect frontend frameworks
    if (deps.next) stack.frontend.push('Next.js');
    if (deps.react && !deps.next) stack.frontend.push('React');
    if (deps.vue || deps.nuxt) stack.frontend.push('Vue');
    if (deps.svelte) stack.frontend.push('Svelte');
    if (deps['@angular/core']) stack.frontend.push('Angular');
    if (deps['@astrojs/core'] || deps.astro) stack.frontend.push('Astro');

    // Detect backend frameworks
    if (deps.express) stack.backend.push('Express');
    if (deps['@nestjs/core']) stack.backend.push('NestJS');
    if (deps.fastify) stack.backend.push('Fastify');
    if (deps.koa) stack.backend.push('Koa');
    if (deps.hapi) stack.backend.push('Hapi');
    if (deps.sails) stack.backend.push('Sails');
    if (deps.remix || deps['@remix-run/react']) stack.backend.push('Remix');

    // Detect datastores
    if (deps.prisma || deps['@prisma/client']) stack.datastores.push('Postgres (Prisma)');
    if (deps.sequelize) stack.datastores.push('SQL (Sequelize)');
    if (deps.mongoose) stack.datastores.push('MongoDB');
    if (deps.typeorm) stack.datastores.push('SQL (TypeORM)');
    if (deps.mikro-orm) stack.datastores.push('SQL (MikroORM)');
    if (deps.redis || deps['ioredis']) stack.datastores.push('Redis');
    if (deps.pg) stack.datastores.push('Postgres');

    // Detect project type
    let projectType = 'Web app';
    if (stack.frontend.length === 0 && stack.backend.length > 0) {
      projectType = 'API / backend service';
    } else if (pkg.scripts?.test && !deps.next && !deps.express) {
      projectType = 'Library / SDK';
    } else if (deps.commander || deps.yargs || deps.cac || deps.meow) {
      projectType = 'CLI tool';
    }

    return { type: projectType, stack };
  } catch (err) {
    return { type: 'Web app', stack: { language: 'TypeScript/JavaScript', frontend: [], backend: [], datastores: [] } };
  }
}

/**
 * Detect Python project type and stack from requirements.txt or pyproject.toml.
 */
async function detectPythonProjectType(hasRequirements, hasPyproject) {
  const stack = { language: 'Python', frontend: [], backend: [], datastores: [] };

  if (hasRequirements) {
    try {
      const content = await fs.readFile('requirements.txt', 'utf8');
      const lines = content.toLowerCase().split('\n').map(l => l.trim());

      if (lines.some(l => l.includes('django'))) stack.backend.push('Django');
      if (lines.some(l => l.includes('fastapi'))) stack.backend.push('FastAPI');
      if (lines.some(l => l.includes('flask'))) stack.backend.push('Flask');
      if (lines.some(l => l.includes('sqlalchemy'))) stack.datastores.push('SQL (SQLAlchemy)');
      if (lines.some(l => l.includes('pymongo') || l.includes('motor'))) stack.datastores.push('MongoDB');
      if (lines.some(l => l.includes('redis'))) stack.datastores.push('Redis');
    } catch (err) {
      // Use defaults if file can't be read
    }
  }

  if (hasPyproject) {
    try {
      const pyproject = await fs.readJson('pyproject.toml');
      const deps = pyproject.dependencies || {};
      const allDeps = Object.keys(deps).join(' ').toLowerCase();

      if (allDeps.includes('django')) stack.backend.push('Django');
      if (allDeps.includes('fastapi')) stack.backend.push('FastAPI');
      if (allDeps.includes('flask')) stack.backend.push('Flask');
    } catch (err) {
      // Use defaults if file can't be read
    }
  }

  return { type: 'Web app', stack };
}

/**
 * Infer stack from package.json dependencies.
 * Returns an object with frontend, backend, and datastores arrays.
 */
export async function inferStackFromDependencies() {
  const hasPackageJson = await fs.pathExists('package.json');
  if (!hasPackageJson) {
    return { frontend: [], backend: [], datastores: [] };
  }

  const { stack } = await detectProjectType();
  return {
    frontend: stack.frontend || [],
    backend: stack.backend || [],
    datastores: stack.datastores || []
  };
}

/**
 * Infers which starter skills to suggest based on project context using loaded skills.
 */
export function inferStarterSkills(context = {}, availableSkills = []) {
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
 * Gathers rich project context from the user.
 * Supports auto-detection with option to override detected values.
 */
export async function gatherContext(overrides = {}) {
  const detected = await detectProjectType();
  const stack = await inferStackFromDependencies();

  const defaultValues = {
    projectName: path.basename(process.cwd()),
    description: 'A new project.',
    projectType: detected.type || 'Web app',
    frontend: stack.frontend.length ? stack.frontend : ['React'],
    backend: stack.backend.length ? stack.backend : ['Node/Express'],
    datastores: stack.datastores || [],
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

  // Show auto-detected values with option to edit
  if (detected.type !== 'Unknown' || (stack.frontend.length || stack.backend.length)) {
    console.log('\n' + chalk.cyan('Auto-detected project information:'));
    console.log(chalk.gray(`  Type: ${detected.type}`));
    if (stack.frontend.length) console.log(chalk.gray(`  Frontend: ${stack.frontend.join(', ')}`));
    if (stack.backend.length) console.log(chalk.gray(`  Backend: ${stack.backend.join(', ')}`));
    if (stack.datastores.length) console.log(chalk.gray(`  Datastores: ${stack.datastores.join(', ')}`));
  }

  const { useDetected } = await inquirer.prompt([{
    type: 'confirm',
    name: 'useDetected',
    message: 'Use auto-detected values?',
    default: true
  }]);

  const effectiveDefaults = useDetected ? defaultValues : {
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

  // Merge overrides with defaults
  const contextDefaults = { ...effectiveDefaults, ...overrides };

  // Tier 1: core project info
  const base = await inquirer.prompt([
    {
      type: 'input',
      name: 'projectName',
      message: 'Project name (for docs and skills):',
      default: contextDefaults.projectName
    },
    {
      type: 'input',
      name: 'description',
      message: 'One-sentence description:',
      default: contextDefaults.description
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
      default: contextDefaults.projectType
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
        choices: ['React', 'Next.js', 'Vue', 'Svelte', 'Native mobile', 'HTMX'],
        default: contextDefaults.frontend
      }
    ]);
    answers.frontend = fe.frontend;
  } else {
    answers.frontend = contextDefaults.frontend;
  }

  if (answers.projectType !== 'Library / SDK') {
    const be = await inquirer.prompt([
      {
        type: 'checkbox',
        name: 'backend',
        message: 'Backend stack (if any):',
        choices: ['Node/Express', 'NestJS', 'FastAPI', 'Django', 'Rails', 'Spring', 'Go', 'Rust', 'Other'],
        default: contextDefaults.backend
      },
      {
        type: 'checkbox',
        name: 'datastores',
        message: 'Primary data stores (if any):',
        choices: ['Postgres', 'MySQL', 'MongoDB', 'Redis', 'Kafka', 'S3/Blob', 'Vector DB'],
        default: contextDefaults.datastores
      }
    ]);
    answers.backend = be.backend;
    answers.datastores = be.datastores;
  } else {
    answers.backend = contextDefaults.backend;
    answers.datastores = contextDefaults.datastores;
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
      default: contextDefaults.domainTags
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
      default: contextDefaults.riskLevel
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
      default: contextDefaults.teamSize
    },
    {
      type: 'list',
      name: 'gitWorkflow',
      message: 'Git workflow:',
      choices: ['Trunk-based', 'GitFlow', 'Feature branches only', 'Ad-hoc'],
      default: contextDefaults.gitWorkflow
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
      default: contextDefaults.testingSetup
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
      default: contextDefaults.agentStyle
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
      default: contextDefaults.editPermissions
    }
  ]);
  Object.assign(answers, agent);

  // Tier 6: "extra contexts" / modes
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
      default: contextDefaults.extras
    }
  ]);
  answers.extras = extras.extras;

  return answers;
}

/**
 * Analyze project for skill ideation template generation.
 * Returns structured project information for template consumption.
 */
export async function analyzeProjectForIdeation(projectPath = process.cwd()) {
  // Step 1: Detect configured IDEs
  const ides = await detectIdes(projectPath);

  // Step 2: Analyze dependencies
  const dependencyAnalysis = await analyzeDependencies(projectPath);

  // Step 2: Analyze code patterns
  const patternAnalysis = await analyzeCodePatterns(projectPath);

  // Step 3: Analyze structure
  const structureAnalysis = await analyzeStructure(projectPath);

  // Step 4: Analyze conventions
  const conventionAnalysis = await analyzeConventions(projectPath);

  // Step 4.1: Analyze cloud infrastructure
  const cloudAnalysis = await analyzeCloud(projectPath);

  // Step 4.2: Analyze mobile development
  const mobileAnalysis = await analyzeMobile(projectPath);

  // Step 5: Collect languages
  const languages = new Set();
  if (dependencyAnalysis.primaryLanguage) {
    languages.add(dependencyAnalysis.primaryLanguage);
  }

  // Add additional detected languages from dependencies
  Object.keys(dependencyAnalysis.allDependencies || {}).forEach(dep => {
    if (dep.includes('python') || dep.includes('py')) languages.add('Python');
    if (dep.includes('go')) languages.add('Go');
    if (dep.includes('rust') || dep.includes('cargo')) languages.add('Rust');
    if (dep.includes('ruby') || dep.includes('gem')) languages.add('Ruby');
    if (dep.includes('java') || dep.includes('jvm')) languages.add('Java');
  });

  // Step 6: Collect frameworks
  const frameworks = [...new Set([
    ...(dependencyAnalysis.allFrameworks || [])
  ])];

  // Step 7: Collect testing frameworks
  const tests = [];
  if (patternAnalysis.testing?.frameworks) {
    tests.push(...patternAnalysis.testing.frameworks);
  }

  // Step 8: Collect notable directories (top-level only, excluding common ignores)
  let directories = [];
  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    directories = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.venv', 'venv'].includes(name))
      .slice(0, 10); // Show up to 10
  } catch (err) {
    // If can't read directory, leave empty
    directories = [];
  }

  // Step 9: Calculate repo size
  let repoSize = { files: 0, loc: 0 };
  if (structureAnalysis.distribution) {
    repoSize.files = structureAnalysis.distribution.totalFiles || 0;
  }
  // LOC not readily available; leave as 0 or could compute via simple scan if needed.
  // For template, we'll show only files if loc is 0.

  // Step 10: Determine primary architecture
  const primaryArchitecture = patternAnalysis.architecture?.pattern || 'unknown';

  // Determine project name: try package.json name first, then directory name
  let projectName = path.basename(projectPath);
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.name) {
        projectName = pkg.name;
      }
    }
  } catch (e) {
    // Ignore and use default
  }

  return {
    languages: Array.from(languages),
    frameworks,
    tests,
    directories,
    repoSize,
    primaryArchitecture,
    projectPath,
    projectName,
    ides,
    // Include detailed analysis for template use
    detailed: {
      dependencies: dependencyAnalysis,
      patterns: patternAnalysis,
      structure: structureAnalysis,
      conventions: conventionAnalysis,
      cloud: cloudAnalysis,
      mobile: mobileAnalysis
    }
  };
}
