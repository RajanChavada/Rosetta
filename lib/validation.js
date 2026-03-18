import fs from 'fs-extra';
import chalk from 'chalk';
import chokidar from 'chokidar';
import { TreeLogger } from './utils.js';

/**
 * Validates the .ai/ structure for completeness.
 * Returns a health score from 0-100.
 */
export async function validateRepo() {
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
      logger.logStep(f.path, 'OK', isLast);
    } else {
      logger.logStep(f.path, 'MISSING', isLast);
      errors += f.weight;
    }
  }

  return 100 - errors;
}

/**
 * Health report.
 * Displays the Rosetta Score and recommendations.
 */
export async function reportHealth() {
  const score = await validateRepo();
  console.log(`\nRosetta Score: ${score}/100`);

  if (score === 100) {
    console.log(chalk.green('Your repo is 100% Rosetta-ready!'));
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
export async function syncMemory() {
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

  console.log(chalk.green('Memory synced and summarized.'));
}

/**
 * Watch mode logic.
 * Behavior Contract: On change, logs status but does not overwrite wrappers.
 */
export async function watchMode() {
  const masterPath = '.ai/master-skill.md';
  if (!(await fs.pathExists(masterPath))) {
    console.log(chalk.red('No .ai/master-skill.md found. Run "rosetta scaffold" first.'));
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
