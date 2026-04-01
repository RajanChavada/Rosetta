import chalk from 'chalk';
import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { mergeDefinition } from '../utils/merge.js';
import { findRosettaYAML } from '../parsers/yaml-parser.js';

/**
 * Handle rosetta agent command
 * @param {string} name - Agent name
 * @param {Object} cmdObj - Commander.js command object
 */
export async function agent(name, cmdObj) {
  const { ide } = cmdObj;

  // Find rosetta.yaml
  const yamlPath = await findRosettaYAML();
  if (!yamlPath) {
    throw new Error('No rosetta.yaml found in current or parent directories');
  }

  // If name is not provided, prompt for selection
  if (!name) {
    if (!cmdObj.quiet) {
      console.log(chalk.gray('Tip: Try --help for more info on specific agent options\n'));
    }
    const availableAgents = await getAvailableAgents(path.dirname(yamlPath));
    if (!availableAgents || availableAgents === 'none') {
      throw new Error('No agent definitions found in lib/definitions/agents/');
    }

    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'selectedAgent',
        message: 'Select an agent to add:',
        choices: availableAgents.split(', ').map(a => a.trim())
      }
    ]);
    name = answers.selectedAgent;
  }

  // Find agent definition
  const agentPath = path.join(process.cwd(), 'lib', 'definitions', 'agents', `${name}.json`);

  if (!await fs.pathExists(agentPath)) {
    // Try relative to project root
    const rootDir = path.dirname(yamlPath);
    const altPath = path.join(rootDir, 'lib', 'definitions', 'agents', `${name}.json`);

    if (!await fs.pathExists(altPath)) {
      const agentsList = await getAvailableAgents(rootDir);
      console.log(chalk.yellow('\nTip: Try --help for more info on agent command'));
      throw new Error(`Agent "${name}" not found. Available agents: ${agentsList}`);
    } else {
      // Use the alternate path
      const definition = await fs.readJSON(altPath);
      await mergeDefinition('agent', definition, yamlPath, {
        ide,
        dryRun: cmdObj.dryRun
      });
      return;
    }
  }

  // Load agent definition
  const definition = await fs.readJSON(agentPath);

  // Merge into rosetta.yaml
  await mergeDefinition('agent', definition, yamlPath, {
    ide,
    dryRun: cmdObj.dryRun
  });
}

/**
 * Get available agents
 * @private
 */
async function getAvailableAgents(projectRoot) {
  const agentsDir = path.join(projectRoot, 'lib', 'definitions', 'agents');

  if (!await fs.pathExists(agentsDir)) {
    return '';
  }

  const files = await fs.readdir(agentsDir);
  const agents = files
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));

  return agents.length > 0 ? agents.join(', ') : 'none';
}