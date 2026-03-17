import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadManifest, saveManifest, removeInstalledSkill } from '../skills-manifest.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Command: skill uninstall
 * Uninstall a skill from the manifest and optionally delete files.
 */
export async function uninstall(name, options = {}) {
  const {
    scope = 'project', // 'global' or 'project'
    purge = false,     // Delete files after uninstall
    dryRun = false
  } = options;

  try {
    // Determine manifest path based on scope
    const manifestPath = scope === 'global'
      ? path.join(process.env.HOME || process.env.USERPROFILE, '.rosetta', 'skills', 'manifest.json')
      : path.join(process.cwd(), '.rosetta', 'skills', 'manifest.json');

    // Check if manifest exists
    const exists = await fs.pathExists(manifestPath);
    if (!exists) {
      console.error(chalk.red(`Error: No skills manifest found at ${manifestPath}`));
      process.exit(1);
    }

    // Load manifest
    const manifest = await loadManifest(manifestPath);

    // Find the skill by name (case-insensitive)
    const skillIndex = manifest.installed.findIndex(
      s => s.name.toLowerCase() === name.toLowerCase()
    );

    if (skillIndex === -1) {
      console.error(chalk.red(`Error: Skill "${name}" is not installed.`));
      process.exit(1);
    }

    const skill = manifest.installed[skillIndex];
    const skillPath = skill.path;

    // Show what will be removed
    if (dryRun) {
      console.log(chalk.cyan('\n[DRY RUN] Would uninstall:'));
      console.log(chalk.white(`  Name: ${skill.name}`));
      console.log(chalk.white(`  Path: ${skillPath}`));
      if (purge) {
        console.log(chalk.yellow('  Files: would be deleted'));
      } else {
        console.log(chalk.gray('  Files: would be kept (use --purge to delete)'));
      }
      console.log('');
      return;
    }

    // Confirm if interactive (if not dry-run and stdin is interactive)
    if (process.stdin.isTTY) {
      const inquirer = await import('inquirer');
      const { confirm } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'confirm',
          message: `Uninstall "${skill.name}"?`,
          default: false
        }
      ]);
      if (!confirm) {
        console.log(chalk.yellow('Uninstall cancelled.'));
        return;
      }
    }

    // Remove from manifest
    manifest.installed.splice(skillIndex, 1);

    // Save updated manifest
    await fs.writeJSON(manifestPath, manifest, { spaces: 2 });

    console.log(chalk.green(`✓ Uninstalled: ${skill.name}`));

    // Optionally delete skill files
    if (purge && skillPath) {
      try {
        await fs.remove(skillPath);
        console.log(chalk.green(`✓ Deleted files: ${skillPath}`));
      } catch (err) {
        console.log(chalk.yellow(`⚠ Could not delete files: ${err.message}`));
      }
    } else if (skillPath) {
      console.log(chalk.gray(`  Files kept at: ${skillPath}`));
    }

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    if (err.stack) {
      console.error(chalk.gray(err.stack));
    }
    process.exit(1);
  }
}
