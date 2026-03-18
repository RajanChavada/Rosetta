import chalk from 'chalk';
import inquirer from 'inquirer';
import { TARGETS } from '../constants.js';
import { ideTargets } from '../ide-adapters.js';
import { ensureFromTemplate } from '../templates.js';
import { loadConfig } from '../config.js';

/**
 * Command: add-ide <name>
 * Add a new IDE to an existing Rosetta setup.
 */
export async function addIde(ideName, options = {}) {
  const config = await loadConfig();
  const masterPath = '.ai/master-skill.md';

  // Check if master skill exists
  const fs = (await import('fs-extra')).default;
  if (!(await fs.pathExists(masterPath))) {
    console.log(chalk.red('No .ai/master-skill.md found. Run "rosetta scaffold" first.'));
    return;
  }

  // If IDE name provided, try to find it directly
  let selectedIde;
  if (ideName) {
    const ideLabelMatch = ideName.toLowerCase();
    selectedIde = TARGETS.find(t =>
      t.label.toLowerCase().includes(ideLabelMatch) ||
      t.template.toLowerCase().includes(ideLabelMatch) ||
      t.path.toLowerCase().includes(ideLabelMatch)
    );

    if (!selectedIde) {
      console.log(chalk.red(`IDE "${ideName}" not found. Available IDEs:`));
      TARGETS.forEach(t => console.log(`  - ${t.label} (${t.path})`));
      return;
    }
  } else {
    // List available IDEs that aren't yet configured
    const configuredIdes = [];
    for (const t of TARGETS) {
      if (await fs.pathExists(t.path)) {
        configuredIdes.push(t.label);
      }
    }

    const availableIdes = TARGETS.filter(t => !configuredIdes.includes(t.label));

    if (availableIdes.length === 0) {
      console.log(chalk.green('All supported IDEs are already configured!'));
      console.log(chalk.gray('Run "rosetta sync --regenerate-wrappers" to update them.'));
      return;
    }

    const { ideChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'ideChoice',
      message: 'Select IDE to add:',
      choices: availableIdes.map(t => ({
        name: `${t.label} -> ${t.path}`,
        value: t.label
      }))
    }]);

    selectedIde = TARGETS.find(t => t.label === ideChoice);
  }

  // Confirm before creating
  const { confirm } = await inquirer.prompt([{
    type: 'confirm',
    name: 'confirm',
    message: `Create ${selectedIde.path} from template ${selectedIde.template}?`,
    default: true
  }]);

  if (!confirm) {
    console.log(chalk.yellow('Operation cancelled.'));
    return;
  }

  // Generate the wrapper
  const { targetPath, templateName } = ideTargets(selectedIde.label);
  await ensureFromTemplate(templateName, targetPath, {}, {
    interactive: true,
    backup: true,
    dryRun: options.dryRun
  });

  console.log(chalk.green(`\nAdded ${selectedIde.label} to your Rosetta setup.`));
  console.log(chalk.gray(`Configuration file: ${targetPath}`));
  console.log(chalk.gray('Run "rosetta sync" to verify all IDE wrappers.'));
}
