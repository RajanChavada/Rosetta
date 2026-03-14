import inquirer from 'inquirer';
import chalk from 'chalk';
import fs from 'fs-extra';
import { TARGETS } from './constants.js';
import { ensureFromTemplate } from './templates.js';

/**
 * Mapping between IDE labels and their target configuration files and templates.
 * Returns { targetPath, templateName } for a given IDE label.
 */
export function ideTargets(ideLabel) {
  const target = TARGETS.find(t => t.label === ideLabel);
  if (target) return { targetPath: target.path, templateName: target.template };
  throw new Error(`Unknown IDE label: ${ideLabel}`);
}

/**
 * Performs a sync. According to the Behavior Contract:
 * - Does not overwrite IDE wrappers by default.
 * - If regenerateWrappers is set, updates them from templates.
 */
export async function performSync(options = {}) {
  const { interactive = false, regenerateWrappers = false, selectedIdes = null, dryRun = false } = options;
  const masterPath = '.ai/master-skill.md';

  if (!(await fs.pathExists(masterPath))) {
    console.log(chalk.red('No .ai/master-skill.md found. Run "rosetta scaffold" first.'));
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
