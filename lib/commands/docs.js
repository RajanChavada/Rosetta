import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { gatherData } from '../visualizers/index.js';
import { readTemplate, openBrowser, escapeJsonForScript } from '../visualizers/utils.js';
import { renderHtml } from '../visualizers/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Command: docs
 * Generate HTML documentation for installed skills with interactive visualization.
 *
 * Usage: rosetta docs [options]
 */
export async function docs(options = {}) {
  const {
    output,
    ide,
    open: openBrowserFlag,
    quiet = false,
    dryRun = false,
    json = false
  } = options;

  try {
    // Resolve default output path if not provided
    const defaultOutputPath = path.join(process.cwd(), '.rosetta', 'docs', 'skills.html');
    const outputPath = output || defaultOutputPath;

    // If dry-run with JSON, just gather and output data
    if (dryRun && json) {
      const data = await gatherData();
      console.log(JSON.stringify({
        success: true,
        skills: data.skills,
        stats: data.stats,
        currentIde: data.currentIde
      }, null, 2));
      return;
    }

    // If dry-run without JSON, show preview (per existing behavior)
    if (dryRun) {
      const data = await gatherData();
      console.log(chalk.cyan('\n[DRY RUN] Visualization generated successfully'));
      console.log(chalk.gray(`Would write to: ${outputPath}`));
      console.log(chalk.gray(`Total skills: ${data.skills.length}`));
      const byStatus = data.stats.byStatus || {};
      const installedCount = (byStatus.installed || 0) + (byStatus['user-created'] || 0);
      const catalogCount = byStatus.catalog || 0;
      console.log(chalk.gray(`Installed: ${installedCount}`));
      console.log(chalk.gray(`Catalog: ${catalogCount}`));
      const ideFilter = ide || data.currentIde;
      console.log(chalk.gray(`IDE filter: ${ideFilter === 'all' ? 'none (showing all)' : ideFilter}`));
      return;
    }

    // Gather data
    const data = await gatherData();

    // Determine effective IDE filter
    const effectiveIdeFilter = ide || data.currentIde || 'all';

    // Load template and styles
    const templatePath = path.join(__dirname, '..', 'visualizers', 'template.html');
    const stylesPath = path.join(__dirname, '..', 'visualizers', 'styles.css');
    const template = await readTemplate(templatePath);
    const styles = await readTemplate(stylesPath);

    // Render HTML
    const html = renderHtml(data, template, styles, effectiveIdeFilter);

    // If JSON output requested (without dry-run), output data instead of HTML
    if (json) {
      console.log(JSON.stringify({
        success: true,
        outputPath,
        currentIde: effectiveIdeFilter,
        skillsCount: data.skills.length,
        installedCount: data.stats.byStatus.installed + (data.stats.byStatus['user-created'] || 0),
        catalogCount: data.stats.byStatus.catalog || 0,
        skills: data.skills
      }, null, 2));
      return;
    }

    // Ensure output directory exists and write HTML file
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html, 'utf-8');

    // Print success message if not quiet
    if (!quiet) {
      console.log(chalk.green(`✓ Documentation generated: ${outputPath}`));
      const byStatus = data.stats.byStatus || {};
      const installedCount = (byStatus.installed || 0) + (byStatus['user-created'] || 0);
      const catalogCount = byStatus.catalog || 0;
      console.log(chalk.gray(`  Total skills: ${data.skills.length} (${installedCount} installed, ${catalogCount} available)`));
    }

    // Open browser if requested
    if (openBrowserFlag) {
      openBrowser(outputPath);
    }

    return {
      success: true,
      outputPath,
      skillsCount: data.skills.length
    };

  } catch (err) {
    if (json || dryRun) {
      console.error(JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack
      }, null, 2));
      process.exit(1);
    }

    console.error(chalk.red(`Error: ${err.message}`));
    if (err.stack) {
      console.error(chalk.gray(err.stack));
    }
    process.exit(1);
  }
}
