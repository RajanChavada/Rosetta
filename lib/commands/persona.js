import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import { mergeDefinition } from '../utils/merge.js';
import { requireInit } from '../utils/require-init.js';

/**
 * Handle rosetta persona command
 * @param {string} type - Persona type
 * @param {Object} cmdObj - Commander.js command object
 */
export async function persona(type, cmdObj) {
  const { ide } = cmdObj;

  // Find rosetta.yaml (exits gracefully if not found)
  const yamlPath = await requireInit('rosetta persona');

  // Find persona definition
  const personaPath = path.join(process.cwd(), 'lib', 'definitions', 'personas', `${type}.json`);

  if (!await fs.pathExists(personaPath)) {
    // Try relative to project root
    const altPath = path.join(path.dirname(yamlPath), 'lib', 'definitions', 'personas', `${type}.json`);
    if (await fs.pathExists(altPath)) {
      throw new Error(`Persona "${type}" not found in lib/definitions/personas/. Available personas: ${await getAvailablePersonas(path.dirname(yamlPath))}`);
    } else {
      throw new Error(`Persona "${type}" not found. Available personas: ${await getAvailablePersonas(path.dirname(yamlPath))}`);
    }
  }

  // Load persona definition
  const definition = await fs.readJSON(personaPath);

  // Merge into rosetta.yaml
  await mergeDefinition('persona', definition, yamlPath, {
    ide,
    dryRun: cmdObj.dryRun
  });
}

/**
 * Get available personas
 * @private
 */
async function getAvailablePersonas(projectRoot) {
  const personasDir = path.join(projectRoot, 'lib', 'definitions', 'personas');

  if (!await fs.pathExists(personasDir)) {
    return '';
  }

  const files = await fs.readdir(personasDir);
  const personas = files
    .filter(file => file.endsWith('.json'))
    .map(file => path.basename(file, '.json'));

  return personas.length > 0 ? personas.join(', ') : 'none';
}