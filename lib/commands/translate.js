import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { IDETranslator } from '../translators/base.js';
import { appendFileSync } from 'fs';

/**
 * Format mapping from common names to internal format names.
 */
const FORMAT_MAP = {
  'cursor': 'cursor',
  'cursorrules': 'cursor',
  'claude': 'claude',
  'claude-code': 'claude',
  'anthropic': 'claude',
  'copilot': 'copilot',
  'github-copilot': 'copilot',
  'windsurf': 'windsurf',
  'antigravity': 'antigravity',
  'gsd': 'gsd',
  'codex': 'codex',
  'kilo': 'kilo',
  'continue': 'continue',
  'continue-dev': 'continue'
};

/**
 * Detect format from file path or content.
 */
function detectFormat(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const basename = path.basename(filePath).toLowerCase();

  // Check file name patterns (including dotfiles)
  if (basename === 'cursorrules' || basename === '.cursorrules') return 'cursor';
  if (basename === 'claude.md' || basename === '.claude.md') return 'claude';
  if (basename.includes('copilot')) return 'copilot';
  if (basename.includes('windsurf')) return 'windsurf';
  if (basename.includes('codex')) return 'codex';
  if (basename.includes('kilo')) return 'kilo';
  if (basename.includes('continue')) return 'continue';

  // Check content hints
  // This would need actual file reading for more accuracy
  return 'generic';
}

/**
 * Normalize format name.
 */
function normalizeFormat(formatName) {
  if (!formatName) return null;
  const normalized = formatName.toLowerCase().trim();
  return FORMAT_MAP[normalized] || null;
}

/**
 * Command: translate --from <src> --to <dst> <file>
 * Translate a single configuration file between IDE formats.
 */
export async function translate(file, options = {}) {
  const { from, to, output } = options;

  // Check if input file exists
  if (!(await fs.pathExists(file))) {
    console.error(chalk.red(`Input file not found: ${file}`));
    return;
  }

  // Read input content
  const input = await fs.readFile(file, 'utf8');

  // Detect or normalize source format
  let sourceFormat = from ? normalizeFormat(from) : detectFormat(file);
  if (!sourceFormat) {
    console.error(chalk.red('Unable to determine source format. Please specify --from'));
    return;
  }

  // Normalize target format
  const targetFormat = normalizeFormat(to);
  if (!targetFormat) {
    console.error(chalk.red(`Unknown target format: ${to}`));
    console.log(chalk.gray('Supported formats: cursor, claude, copilot, windsurf, codex, kilo, continue'));
    return;
  }

  console.log(chalk.blue(`Translating ${file} from ${sourceFormat} to ${targetFormat}...`));

  try {
    const result = await IDETranslator.translate(input, sourceFormat, targetFormat);

    // Determine output path
    let outputPath = output;
    if (!outputPath) {
      const ext = path.extname(file);
      const basename = path.basename(file, ext);
      outputPath = `${basename}-${targetFormat}${ext}`;
    }

    // Handle dry-run
    if (options.dryRun) {
      console.log(chalk.yellow('[Dry-run] Would write output to:'));
      console.log(chalk.gray(outputPath));
      console.log(chalk.gray('\n--- Output preview (first 500 chars) ---'));
      console.log(result.substring(0, 500));
      if (result.length > 500) {
        console.log(chalk.gray('... (truncated)'));
      }
    } else {
      // Write output
      appendFileSync('/tmp/rosetta_translate_debug.log', `About to writeFile: ${outputPath}\n`);
      await fs.writeFile(outputPath, result);
      console.log(chalk.green(`✓ Translated to: ${outputPath}`));
    }
  } catch (err) {
    appendFileSync('/tmp/rosetta_translate_debug.log', `ERROR: ${err.message}\n${err.stack}\n`);
    console.error(chalk.red(`Translation failed: ${err.message}`));
  }
}
