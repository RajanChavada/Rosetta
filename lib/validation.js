import fs from 'fs-extra';
import path from 'path';
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
 * Sync memory logic: rotate logs after 90 days, summarize patterns.
 * Enhanced with archive management and 90-day retention.
 */
export async function syncMemory(options = {}) {
  const { force = false, daysThreshold = 90, silent = false } = options;

  if (!silent) console.log(chalk.blue('Syncing memory...'));

  const logDir = '.ai/logs/daily';
  const autoMemPath = '.ai/memory/AUTO_MEMORY.md';

  if (!(await fs.pathExists(logDir))) {
    if (!silent) console.log(chalk.yellow('No log directory found at .ai/logs/daily.'));
    return { rotated: 0, summarized: false };
  }

  const logs = await fs.readdir(logDir);
  if (!silent) console.log(chalk.gray(`Found ${logs.length} daily logs.`));

  // Enhanced: 90-day retention instead of 7-day
  const rotated = await rotateLogsToArchive(daysThreshold, { force, silent });

  // Summarize to AUTO_MEMORY.md
  if (!silent) console.log(chalk.blue('Summarizing logs to AUTO_MEMORY.md...'));

  const patterns = await detectPatternsHeuristic(logDir);

  if (await fs.pathExists(autoMemPath)) {
    const timestamp = new Date().toISOString().split('T')[0];
    const summary = `\n- **${timestamp} Sync**: Processed ${logs.length} logs.`;

    if (patterns.errors.length > 0) {
      summary += `\n- **${timestamp} Patterns**: Found ${patterns.errors.length} repeated errors, ${patterns.files.length} frequently modified files.`;
    }

    await fs.appendFile(autoMemPath, summary);
  }

  if (!silent) console.log(chalk.green('Memory synced and summarized.'));

  return { rotated, summarized: true, patterns };
}

/**
 * Rotate logs older than threshold days to archive.
 * Creates monthly consolidated archive files.
 *
 * @param {number} daysThreshold - Days before rotation (default: 90)
 * @param {object} options - Configuration options
 * @returns {number} Number of logs rotated
 */
export async function rotateLogsToArchive(daysThreshold = 90, options = {}) {
  const { force = false, silent = false } = options;
  const logDir = '.ai/logs/daily';
  const archiveBaseDir = '.ai/archive/logs';

  if (!(await fs.pathExists(logDir))) {
    if (!silent) console.log(chalk.yellow('No log directory found.'));
    return 0;
  }

  const logs = await fs.readdir(logDir);
  const now = new Date();
  const thresholdMs = daysThreshold * 24 * 60 * 60 * 1000;
  const toRotate = [];
  const byMonth = {};

  // Group logs by month and check age
  for (const logFile of logs) {
    const match = logFile.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
    if (!match) continue;

    const logDate = new Date(match[1]);
    const ageMs = now - logDate;

    if (ageMs > thresholdMs) {
      toRotate.push(logFile);

      const year = logDate.getFullYear();
      const month = logDate.toLocaleString('default', { month: 'long' });
      const monthKey = `${year}/${month}`;

      if (!byMonth[monthKey]) {
        byMonth[monthKey] = [];
      }
      byMonth[monthKey].push(logFile);
    }
  }

  if (toRotate.length === 0) {
    if (!silent) console.log(chalk.gray(`No logs older than ${daysThreshold} days to rotate.`));
    return 0;
  }

  if (!silent) {
    console.log(chalk.blue(`Rotating ${toRotate.length} logs older than ${daysThreshold} days...`));
  }

  // Create archive directories and consolidate by month
  for (const [monthKey, monthLogs] of Object.entries(byMonth)) {
    const [year, monthName] = monthKey.split('/');
    const archiveDir = path.join(archiveBaseDir, year);
    const archiveFile = path.join(archiveDir, `${monthName}.md`);

    await fs.ensureDir(archiveDir);

    // Read all logs for this month
    let consolidatedContent = `# ${year} ${monthName} Log Archive\n\n`;
    consolidatedContent += `**Period:** ${monthName} ${year}\n`;
    consolidatedContent += `**Rotated:** ${now.toISOString()}\n`;
    consolidatedContent += `**Total daily logs:** ${monthLogs.length}\n\n`;
    consolidatedContent += `---\n\n## Daily Logs\n\n`;

    for (const logFile of monthLogs.sort()) {
      const logPath = path.join(logDir, logFile);
      const content = await fs.readFile(logPath, 'utf-8');
      consolidatedContent += `\n### ${logFile.replace('.md', '')}\n\n${content}\n\n---\n`;
    }

    // Append to archive file (create or update)
    if (await fs.pathExists(archiveFile)) {
      await fs.appendFile(archiveFile, consolidatedContent);
    } else {
      await fs.writeFile(archiveFile, consolidatedContent);
    }

    // Delete rotated logs
    for (const logFile of monthLogs) {
      await fs.remove(path.join(logDir, logFile));
    }
  }

  if (!silent) {
    console.log(chalk.green(`Rotated ${toRotate.length} logs to archive.`));
  }

  return toRotate.length;
}

/**
 * Rule-based pattern detection from logs.
 * No AI/LLM calls - pure string heuristics.
 *
 * @param {string} logDir - Path to daily logs directory
 * @returns {object} Detected patterns
 */
export async function detectPatternsHeuristic(logDir) {
  if (!(await fs.pathExists(logDir))) {
    return { errors: [], files: [], tasks: [] };
  }

  const logs = await fs.readdir(logDir);
  const errorCount = {};
  const fileCount = {};
  const taskPatterns = {
    debug: 0,
    fix: 0,
    implement: 0,
    refactor: 0,
    test: 0
  };

  for (const logFile of logs) {
    const logPath = path.join(logDir, logFile);
    const content = await fs.readFile(logPath, 'utf-8');

    // Detect repeated errors
    const errorMatches = content.matchAll(/error:?\s*([^\n]+)/gi);
    for (const match of errorMatches) {
      const error = match[1].trim().toLowerCase();
      if (error.length > 5) { // Ignore very short matches
        errorCount[error] = (errorCount[error] || 0) + 1;
      }
    }

    // Detect repeated files
    const fileMatches = content.matchAll(/([a-zA-Z0-9_-]+\.[a-z]{2,4})/g);
    for (const match of fileMatches) {
      const file = match[1];
      if (file.includes('.') && !file.includes('.md')) { // Source files
        fileCount[file] = (fileCount[file] || 0) + 1;
      }
    }

    // Detect task patterns
    for (const [task, count] of Object.entries(taskPatterns)) {
      const regex = new RegExp(`\\b${task}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        taskPatterns[task] += matches.length;
      }
    }
  }

  // Filter to significant patterns
  const repeatedErrors = Object.entries(errorCount)
    .filter(([_, count]) => count > 3)
    .map(([error, count]) => ({ error, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const repeatedFiles = Object.entries(fileCount)
    .filter(([_, count]) => count > 5)
    .map(([file, count]) => ({ file, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  const frequentTasks = Object.entries(taskPatterns)
    .filter(([_, count]) => count > 0)
    .map(([task, count]) => ({ task, count }))
    .sort((a, b) => b.count - a.count);

  return {
    errors: repeatedErrors,
    files: repeatedFiles,
    tasks: frequentTasks
  };
}

/**
 * Append entry to archive (tribal-knowledge or retired-patterns).
 * Requires user approval conceptually - agent should prompt first.
 *
 * @param {object} entry - Archive entry object
 * @param {string} category - 'tribal-knowledge' or 'retired-patterns'
 * @param {object} options - Configuration options
 */
export async function appendToArchive(entry, category = 'tribal-knowledge', options = {}) {
  const { dryRun = false } = options;

  if (!entry.title || !entry.context || !entry.knowledge) {
    throw new Error('Archive entry must include title, context, and knowledge');
  }

  const archiveDir = '.ai/archive';
  await fs.ensureDir(archiveDir);

  const archiveFile = path.join(archiveDir, `${category}.md`);
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];

  const archiveEntry = `\n## [${dateStr}] ${entry.title}\n\n`;
  const entryContent = `**Category:** ${entry.category || 'general'}\n\n`;
  const contextContent = `**Context:** ${entry.context}\n\n`;
  const knowledgeContent = `**The Knowledge:** ${entry.knowledge}\n\n`;
  const sourceContent = `**Source:** ${entry.source || 'Agent session'}\n\n`;
  const archivedByContent = `**Archived by:** ${entry.agent || 'agentic-memory'}, ${dateStr}\n\n`;
  const separator = `---\n`;

  const fullEntry = archiveEntry + entryContent + contextContent + knowledgeContent +
                    sourceContent + archivedByContent + separator;

  if (dryRun) {
    console.log(chalk.gray('Dry run - would append to archive:'));
    console.log(fullEntry);
    return { archived: false, entry: fullEntry };
  }

  // Ensure archive file exists
  if (!(await fs.pathExists(archiveFile))) {
    const header = category === 'tribal-knowledge'
      ? `# Tribal Knowledge Archive\n\nThis file contains append-only tribal wisdom.\n\n`
      : `# Retired Patterns Archive\n\nThis file contains deprecated patterns.\n\n`;
    await fs.writeFile(archiveFile, header);
  }

  await fs.appendFile(archiveFile, fullEntry);

  return { archived: true, path: archiveFile };
}

/**
 * Read contents of an archive file.
 *
 * @param {string} category - 'tribal-knowledge' or 'retired-patterns'
 * @returns {string|null} Archive contents or null if not found
 */
export async function readArchiveContents(category = 'tribal-knowledge') {
  const archiveFile = path.join('.ai/archive', `${category}.md`);

  if (!(await fs.pathExists(archiveFile))) {
    return null;
  }

  return await fs.readFile(archiveFile, 'utf-8');
}

/**
 * Get archive status and rotation info.
 *
 * @returns {object} Archive status information
 */
export async function getArchiveStatus() {
  const logDir = '.ai/logs/daily';
  const archiveDir = '.ai/archive/logs';
  const tribalFile = '.ai/archive/tribal-knowledge.md';
  const retiredFile = '.ai/archive/retired-patterns.md';

  const status = {
    dailyLogs: 0,
    archivedLogs: 0,
    tribalEntries: 0,
    retiredEntries: 0,
    oldestLog: null,
    newestLog: null
  };

  if (await fs.pathExists(logDir)) {
    const logs = await fs.readdir(logDir);
    status.dailyLogs = logs.length;

    const dates = logs
      .map(f => f.match(/^(\d{4}-\d{2}-\d{2})\.md$/)?.[1])
      .filter(Boolean)
      .sort();

    if (dates.length > 0) {
      status.oldestLog = dates[0];
      status.newestLog = dates[dates.length - 1];
    }
  }

  if (await fs.pathExists(archiveDir)) {
    const years = await fs.readdir(archiveDir);
    for (const year of years) {
      const yearPath = path.join(archiveDir, year);
      const stat = await fs.stat(yearPath);
      if (stat.isDirectory()) {
        const months = await fs.readdir(yearPath);
        status.archivedLogs += months.length;
      }
    }
  }

  if (await fs.pathExists(tribalFile)) {
    const content = await fs.readFile(tribalFile, 'utf-8');
    status.tribalEntries = (content.match(/^## \[/gm) || []).length;
  }

  if (await fs.pathExists(retiredFile)) {
    const content = await fs.readFile(retiredFile, 'utf-8');
    status.retiredEntries = (content.match(/^## \[/gm) || []).length;
  }

  return status;
}

/**
 * Read memory hierarchy in order.
 * Returns contents of PROJECT_MEMORY.md, AUTO_MEMORY.md, tribal-knowledge.md, task.md
 *
 * @returns {object} Memory hierarchy contents
 */
export async function readMemoryHierarchy() {
  const hierarchy = {
    projectMemory: null,
    autoMemory: null,
    tribalKnowledge: null,
    task: null
  };

  if (await fs.pathExists('.ai/memory/PROJECT_MEMORY.md')) {
    hierarchy.projectMemory = await fs.readFile('.ai/memory/PROJECT_MEMORY.md', 'utf-8');
  }

  if (await fs.pathExists('.ai/memory/AUTO_MEMORY.md')) {
    hierarchy.autoMemory = await fs.readFile('.ai/memory/AUTO_MEMORY.md', 'utf-8');
  }

  if (await fs.pathExists('.ai/archive/tribal-knowledge.md')) {
    hierarchy.tribalKnowledge = await fs.readFile('.ai/archive/tribal-knowledge.md', 'utf-8');
  }

  if (await fs.pathExists('.ai/task.md')) {
    hierarchy.task = await fs.readFile('.ai/task.md', 'utf-8');
  }

  return hierarchy;
}

/**
 * Validate memory structure integrity.
 * Returns health score and issues found.
 *
 * @returns {object} Validation results
 */
export async function validateMemoryIntegrity() {
  const issues = [];

  // Check required directories
  const requiredDirs = [
    '.ai/memory',
    '.ai/logs/daily',
    '.ai/archive'
  ];

  for (const dir of requiredDirs) {
    if (!(await fs.pathExists(dir))) {
      issues.push({ type: 'missing_dir', path: dir });
    }
  }

  // Check required files
  const requiredFiles = [
    '.ai/memory/PROJECT_MEMORY.md',
    '.ai/memory/AUTO_MEMORY.md',
    '.ai/task.md'
  ];

  for (const file of requiredFiles) {
    if (!(await fs.pathExists(file))) {
      issues.push({ type: 'missing_file', path: file });
    }
  }

  // Check for stale logs (older than 90 days in daily/)
  if (await fs.pathExists('.ai/logs/daily')) {
    const logs = await fs.readdir('.ai/logs/daily');
    const now = new Date();
    const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;

    for (const logFile of logs) {
      const match = logFile.match(/^(\d{4}-\d{2}-\d{2})\.md$/);
      if (match) {
        const logDate = new Date(match[1]);
        const ageMs = now - logDate;
        if (ageMs > ninetyDaysMs) {
          issues.push({
            type: 'stale_log',
            path: `.ai/logs/daily/${logFile}`,
            age: Math.floor(ageMs / (24 * 60 * 60 * 1000))
          });
        }
      }
    }
  }

  const score = Math.max(0, 100 - (issues.length * 10));

  return {
    score,
    issues,
    healthy: issues.length === 0
  };
}

/**
 * Detect repeated errors from logs.
 * Rule-based: same error text >3 times.
 *
 * @param {string} logDir - Path to daily logs directory
 * @returns {Array} Array of {error, count} objects
 */
export function detectRepeatedErrors(logs) {
  // This is now handled by detectPatternsHeuristic
  return logs.errors || [];
}

/**
 * Detect repeated file modifications from logs.
 * Rule-based: same file >5 times.
 *
 * @param {string} logDir - Path to daily logs directory
 * @returns {Array} Array of {file, count} objects
 */
export function detectRepeatedFiles(logs) {
  // This is now handled by detectPatternsHeuristic
  return logs.files || [];
}

/**
 * Detect similar tasks from logs.
 * Rule-based: keyword matching.
 *
 * @param {string} logDir - Path to daily logs directory
 * @returns {Array} Array of {task, count} objects
 */
export function detectSimilarTasks(logs) {
  // This is now handled by detectPatternsHeuristic
  return logs.tasks || [];
}

/**
 * Suggest promotions based on today's log.
 * Returns suggestions for AUTO_MEMORY, PROJECT_MEMORY, and archive.
 *
 * @param {string} logContent - Content of today's log
 * @returns {object} Promotion suggestions
 */
export function suggestPromotions(logContent) {
  const suggestions = {
    toAutoMemory: [],
    toProjectMemory: [],
    toArchive: []
  };

  // Suggest AUTO_MEMORY promotions
  if (logContent.includes('debug') && logContent.includes('fix')) {
    suggestions.toAutoMemory.push({
      pattern: 'Debugging workflow',
      reason: 'Repeated debugging and fixing pattern detected'
    });
  }

  if (logContent.includes('test')) {
    suggestions.toAutoMemory.push({
      pattern: 'Testing approach',
      reason: 'Testing activities documented'
    });
  }

  // Suggest PROJECT_MEMORY promotions
  if (logContent.includes('architectural') || logContent.includes('design decision')) {
    suggestions.toProjectMemory.push({
      decision: 'Architectural decision',
      reason: 'Architectural discussion or decision detected'
    });
  }

  // Suggest archive promotions
  if (logContent.includes('workaround') || logContent.includes('undocumented')) {
    suggestions.toArchive.push({
      knowledge: 'Undocumented pattern',
      reason: 'Workaround or undocumented pattern detected'
    });
  }

  return suggestions;
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
