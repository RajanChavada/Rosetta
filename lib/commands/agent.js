import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { mergeDefinition } from '../utils/merge.js';
import { requireInit } from '../utils/require-init.js';
import { listDefinitions, resolveDefinitionPath } from '../utils/package-paths.js';

/**
 * Handle rosetta agent command
 * @param {string} name - Agent name
 * @param {Object} cmdObj - Commander.js command object
 */
export async function agent(name, cmdObj) {
  const { ide } = cmdObj;

  const yamlPath = await requireInit('rosetta agent');
  const projectRoot = path.dirname(yamlPath);

  // If name is not provided, prompt for selection
  if (!name) {
    if (!cmdObj.quiet) {
      console.log(chalk.gray('Tip: Try --help for more info on specific agent options\n'));
    }
    const available = await listDefinitions('agents', projectRoot);
    if (available.length === 0) {
      throw new Error('No agent definitions found.');
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAgent',
        message: 'Select an agent to add:',
        choices: available
      }
    ]);
    name = answers.selectedAgent;
  }

  const agentPath = await resolveDefinitionPath('agents', name, projectRoot);
  if (!agentPath) {
    const available = await listDefinitions('agents', projectRoot);
    console.log(chalk.yellow('\nTip: Try --help for more info on agent command'));
    throw new Error(`Agent "${name}" not found. Available agents: ${available.join(', ') || 'none'}`);
  }

  const definition = await fs.readJSON(agentPath);
  await mergeDefinition('agent', definition, yamlPath, {
    ide,
    dryRun: cmdObj.dryRun
  });
}
