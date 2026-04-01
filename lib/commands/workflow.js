import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { mergeDefinition } from '../utils/merge.js';
import { findRosettaYAML } from '../parsers/yaml-parser.js';

/**
 * Handle rosetta workflow command
 * @param {string} name - Workflow name
 * @param {Object} cmdObj - Commander.js command object
 */
export async function workflow(name, cmdObj) {
  const { ide } = cmdObj;

  // Find rosetta.yaml
  const yamlPath = await findRosettaYAML();
  if (!yamlPath) {
    throw new Error('No rosetta.yaml found in current or parent directories');
  }

  // Find workflow definition
  const workflowPath = path.join(process.cwd(), 'lib', 'definitions', 'workflows', `${name}.json`);

  if (!await fs.pathExists(workflowPath)) {
    // Try relative to project root
    const altPath = path.join(path.dirname(yamlPath), 'lib', 'definitions', 'workflows', `${name}.json`);
    if (await fs.pathExists(altPath)) {
      throw new Error(`Workflow "${name}" not found in lib/definitions/workflows/. Available workflows: ${await getAvailableWorkflows(path.dirname(yamlPath))}`);
    } else {
      throw new Error(`Workflow "${name}" not found. Available workflows: ${await getAvailableWorkflows(path.dirname(yamlPath))}`);
    }
  }

  // Load workflow definition
  const definition = await fs.readJSON(workflowPath);

  // Merge into rosetta.yaml
  await mergeDefinition('workflow', definition, yamlPath, {
    ide,
    dryRun: cmdObj.dryRun
  });
}

/**
 * Get available workflows
 * @private
 */
async function getAvailableWorkflows(projectRoot) {
  const workflowsDir = path.join(projectRoot, 'lib', 'definitions', 'workflows');

  if (!await fs.pathExists(workflowsDir)) {
    return '';
  }

  const files = await fs.readdir(workflowsDir);
  const workflows = files
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));

  return workflows.length > 0 ? workflows.join(', ') : 'none';
}