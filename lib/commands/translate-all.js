import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { IDETranslator } from '../translators/base.js';

/**
 * Known IDE configuration files with their formats.
 */
const IDE_FILES = [
  { path: 'CLAUDE.md', format: 'claude' },
  { path: '.cursorrules', format: 'cursor' },
  { path: '.github/copilot-instructions.md', format: 'copilot' },
  { path: '.windsurf/rules/rosetta-rules.md', format: 'windsurf' },
  { path: '.codex/rules.md', format: 'codex' },
  { path: '.kilo/rules.md', format: 'kilo' },
  { path: '.continue/config.md', format: 'continue' },
  { path: '.agent/skills/project-skill.md', format: 'antigravity' },
  { path: 'skills/gsd-skill.md', format: 'gsd' }
];

/**
 * Format display names.
 */
const FORMAT_NAMES = {
  claude: 'Claude Code (CLAUDE.md)',
  cursor: 'Cursor (.cursorrules)',
  copilot: 'GitHub Copilot (.github/copilot-instructions.md)',
  windsurf: 'Windsurf (.windsurf/rules/)',
  codex: 'Codex CLI (.codex/rules.md)',
  kilo: 'Kilo Code (.kilo/rules.md)',
  continue: 'Continue.dev (.continue/config.md)',
  antigravity: 'Antigravity (.agent/skills/)',
  gsd: 'GSD/generic (skills/)'
};

/**
 * Command: translate-all --to <target>
 * Bulk migrate all existing IDE configs to a target format.
 */
export async function translateAll(options = {}) {
  const { to, dryRun, confirm: confirmed } = options;

  if (!to) {
    console.error(chalk.red('Please specify target format with --to'));
    console.log(chalk.gray('Supported formats: claude, cursor, copilot, windsurf, codex, kilo, continue'));
    return;
  }

  // Find all existing IDE config files
  const existingFiles = [];
  for (const ideFile of IDE_FILES) {
    if (await fs.pathExists(ideFile.path)) {
      existingFiles.push(ideFile);
    }
  }

  if (existingFiles.length === 0) {
    console.log(chalk.yellow('No IDE configuration files found in current directory.'));
    return;
  }

  console.log(chalk.blue(`Found ${existingFiles.length} IDE configuration file(s):\n`));
  existingFiles.forEach(f => {
    console.log(chalk.gray(`  - ${f.path} (${f.format})`));
  });
  console.log('');

  // Show what will be done
  const targetFormat = to.toLowerCase();
  const targetName = FORMAT_NAMES[targetFormat] || targetFormat;
  console.log(chalk.blue(`Target format: ${targetName}\n`));

  // List planned translations
  const translations = existingFiles.filter(f => f.format !== targetFormat);
  if (translations.length === 0) {
    console.log(chalk.green('All files are already in the target format.'));
    return;
  }

  console.log(chalk.blue('Planned translations:\n'));
  const summary = [];
  for (const sourceFile of translations) {
    let outputPath = getOutputPath(sourceFile.path, targetFormat);
    summary.push({ from: sourceFile.path, to: outputPath, format: sourceFile.format });
    console.log(chalk.gray(`  ${sourceFile.path} -> ${outputPath}`));
  }
  console.log('');

  // Confirm unless --confirm flag is provided
  if (!confirmed) {
    const { proceed } = await inquirer.prompt([{
      type: 'confirm',
      name: 'proceed',
      message: `Proceed with ${translations.length} translation(s)?`,
      default: false
    }]);

    if (!proceed) {
      console.log(chalk.yellow('Operation cancelled.'));
      return;
    }
  }

  // Perform translations
  console.log(chalk.blue('Starting translations...\n'));
  let successCount = 0;
  let errorCount = 0;

  for (const item of summary) {
    try {
      const input = await fs.readFile(item.from, 'utf8');
      const result = await IDETranslator.translate(input, item.format, targetFormat);

      if (dryRun) {
        console.log(chalk.yellow(`[Dry-run] Would create: ${item.to}`));
      } else {
        await fs.ensureDir(path.dirname(item.to));
        await fs.writeFile(item.to, result);
        console.log(chalk.green(`Translated: ${item.from} -> ${item.to}`));
      }
      successCount++;
    } catch (err) {
      console.error(chalk.red(`Failed: ${item.from}`));
      console.error(chalk.gray(`  ${err.message}`));
      errorCount++;
    }
  }

  // Summary
  console.log('');
  if (dryRun) {
    console.log(chalk.bold.yellow(`[Dry-run] Summary: ${successCount} translation(s) planned.`));
  } else {
    console.log(chalk.bold.green(`Translation complete: ${successCount} succeeded, ${errorCount} failed.`));
  }

  if (successCount > 0) {
    console.log(chalk.gray('\nRun "rosetta sync" to verify all IDE wrappers are properly configured.'));
  }
}

/**
 * Generate output path for translation.
 */
function getOutputPath(sourcePath, targetFormat) {
  // Special handling for different target formats
  const formatPaths = {
    claude: 'CLAUDE.md',
    cursor: '.cursorrules',
    copilot: '.github/copilot-instructions.md',
    windsurf: '.windsurf/rules/rosetta-rules.md',
    codex: '.codex/rules.md',
    kilo: '.kilo/rules.md',
    continue: '.continue/config.md'
  };

  return formatPaths[targetFormat] || `translated-${targetFormat}.md`;
}
