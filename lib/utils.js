import chalk from 'chalk';

/**
 * Beautiful ASCII Banner
 */
export function showBanner() {
  const width = process.stdout.columns || 80;
  const line = '━'.repeat(Math.max(0, Math.min(width, 60)));

  const banner = [
    ' ██████╗  ██████╗ ███████╗███████╗████████╗████████╗ █████╗ ',
    ' ██╔══██╗██╔═══██╗██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██╔══██╗',
    ' ██████╔╝██║   ██║███████╗█████╗     ██║      ██║   ███████║',
    ' ██╔══██╗██║   ██║╚════██║██╔══╝     ██║      ██║   ██╔══██║',
    ' ██║  ██║╚██████╔╝███████║███████╗    ██║      ██║   ██║  ██║',
    ' ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝    ╚═╝      ╚═╝   ╚═╝  ╚═╝'
  ].map(l => l.padStart(l.length + Math.max(0, Math.floor((width - 61) / 2)))).join('\n');

  const versionPill = chalk.bgBlue.white.bold(' 🏷️ v0.3.0 ');
  const statusPill = chalk.bgGreen.black.bold(' ✨ STABLE ');
  const modePill = chalk.bgMagenta.white.bold(' ⚡ CLI ');

  const pills = `${versionPill} ${statusPill} ${modePill}`;
  const pillPadding = ' '.repeat(Math.max(0, Math.floor((width - 34) / 2))); // 34 is approx width of 3 pills

  console.log('\n' + banner);
  console.log(`${pillPadding}${pills}\n`);
  console.log(chalk.gray(`${' '.repeat(Math.max(0, Math.floor((width - 40) / 2)))}Single Source of Truth for AI Agents\n`));
  console.log(chalk.gray(`${' '.repeat(Math.max(0, Math.floor((width - Math.min(width, 60)) / 2)))}${line}\n`));
}

/**
 * Tree logger for progress indicators.
 */
export class TreeLogger {
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
 * Returns true if in dry-run mode, otherwise false.
 */
export async function dryRunWrite(filePath, action, options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would ${action}: ${filePath}`));
    return true;
  }
  return false;
}
