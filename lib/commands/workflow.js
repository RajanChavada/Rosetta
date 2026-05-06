import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { mergeDefinition } from '../utils/merge.js';
import { requireInit } from '../utils/require-init.js';
import { listDefinitions, resolveDefinitionPath } from '../utils/package-paths.js';

/**
 * Handle rosetta workflow command
 * @param {string} name - Workflow name
 * @param {Object} cmdObj - Commander.js command object
 */
export async function workflow(name, cmdObj) {
  const { ide } = cmdObj;

  const yamlPath = await requireInit('rosetta workflow');
  const projectRoot = path.dirname(yamlPath);

  if (!name) {
    if (!cmdObj.quiet) {
      console.log(chalk.gray('Tip: Try --help for more info on specific workflow options\n'));
    }
    const available = await listDefinitions('workflows', projectRoot);
    if (available.length === 0) {
      throw new Error('No workflow definitions found.');
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedWorkflow',
        message: 'Select a workflow to add:',
        choices: available
      }
    ]);
    name = answers.selectedWorkflow;
  }

  const workflowPath = await resolveDefinitionPath('workflows', name, projectRoot);
  if (!workflowPath) {
    const available = await listDefinitions('workflows', projectRoot);
    throw new Error(`Workflow "${name}" not found. Available workflows: ${available.join(', ') || 'none'}`);
  }

  const definition = await fs.readJSON(workflowPath);
  await mergeDefinition('workflow', definition, yamlPath, {
    ide,
    dryRun: cmdObj.dryRun
  });
}
