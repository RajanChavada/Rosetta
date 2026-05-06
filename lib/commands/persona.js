import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { mergeDefinition } from '../utils/merge.js';
import { requireInit } from '../utils/require-init.js';
import { listDefinitions, resolveDefinitionPath } from '../utils/package-paths.js';

/**
 * Handle rosetta persona command
 * @param {string} type - Persona type
 * @param {Object} cmdObj - Commander.js command object
 */
export async function persona(type, cmdObj) {
  const { ide } = cmdObj;

  const yamlPath = await requireInit('rosetta persona');
  const projectRoot = path.dirname(yamlPath);

  if (!type) {
    if (!cmdObj.quiet) {
      console.log(chalk.gray('Tip: Try --help for more info on specific persona options\n'));
    }
    const available = await listDefinitions('personas', projectRoot);
    if (available.length === 0) {
      throw new Error('No persona definitions found.');
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedPersona',
        message: 'Select a persona to inject:',
        choices: available
      }
    ]);
    type = answers.selectedPersona;
  }

  const personaPath = await resolveDefinitionPath('personas', type, projectRoot);
  if (!personaPath) {
    const available = await listDefinitions('personas', projectRoot);
    throw new Error(`Persona "${type}" not found. Available personas: ${available.join(', ') || 'none'}`);
  }

  const definition = await fs.readJSON(personaPath);
  await mergeDefinition('persona', definition, yamlPath, {
    ide,
    dryRun: cmdObj.dryRun
  });
}
