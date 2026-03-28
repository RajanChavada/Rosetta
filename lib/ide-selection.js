import inquirer from 'inquirer';
import chalk from 'chalk';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import { detectIdes } from './context.js';
import { TARGETS } from './constants.js';

/**
 * Prompts user to select their primary IDE.
 * Auto-detects configured IDEs as defaults and allows manual override.
 *
 * @param {Object} options - Selection options
 * @param {string[]} options.preferredIdes - Preferred IDE labels (auto-detected)
 * @param {boolean} options.allowMultiIde - Allow multi-IDE selection
 * @param {boolean} options.silent - Skip prompt and return first detected IDE
 * @returns {Promise<string|null>} - Selected IDE label or null for multi-IDE
 */
export async function selectPrimaryIde(options = {}) {
  const {
    preferredIdes = [],
    allowMultiIde = true,
    silent = false
  } = options;

  // Detect configured IDEs in the project
  const detectedIdes = await detectIdes();
  const detectedLabels = detectedIdes.map(ide => ide.name);

  // Use preferred IDEs if provided, otherwise use detected
  const defaultIdes = preferredIdes.length > 0 ? preferredIdes : detectedLabels;

  // Silent mode: return first detected IDE or null
  if (silent) {
    return defaultIdees.length > 0 ? defaultIdees[0] : null;
  }

  // Build choices for the prompt
  const choices = [];

  // Detected IDEs section
  if (detectedLabels.length > 0) {
    choices.push(new inquirer.Separator('--- Detected IDEs ---'));
    detectedLabels.forEach((label, index) => {
      const isDefault = index === 0;
      choices.push({
        name: `${label}${isDefault ? ' (detected)' : ''}`,
        value: label
      });
    });
  }

  // All available IDEs section
  const availableLabels = TARGETS.map(t => t.label);
  const undetectedLabels = availableLabels.filter(
    label => !detectedLabels.includes(label)
  );

  if (undetectedLabels.length > 0) {
    choices.push(new inquirer.Separator('--- All Available IDEs ---'));
    undetectedLabels.forEach(label => {
      choices.push({
        name: label,
        value: label
      });
    });
  }

  // Multi-IDE option
  if (allowMultiIde) {
    choices.push(new inquirer.Separator());
    choices.push({
      name: 'Multi-IDE support (installs to .rosetta/skills)',
      value: null
    });
  }

  const { ide } = await inquirer.prompt([{
    type: 'list',
    name: 'ide',
    message: 'Select your primary IDE for skill installation:',
    choices,
    default: detectedLabels[0] || null
  }]);

  return ide;
}

/**
 * Gets the skills directory path for a specific IDE.
 *
 * @param {string} ideLabel - The IDE label (e.g., "Claude Code", "Cursor")
 * @param {boolean} isGlobal - Whether to use global path (~/.ide/skills) or project local (./ide/skills)
 * @returns {string} - Absolute path to the IDE's skills directory
 */
export function getIdeSkillsDir(ideLabel, isGlobal = false) {
  const target = TARGETS.find(t => t.label === ideLabel);

  if (!target) {
    throw new Error(`Unknown IDE: "${ideLabel}". Valid options: ${TARGETS.map(t => t.label).join(', ')}`);
  }

  if (!target.skillsDir) {
    throw new Error(`IDE "${ideLabel}" does not have a skills directory configured`);
  }

  const basePath = isGlobal ? os.homedir() : process.cwd();
  return path.join(basePath, target.skillsDir);
}

/**
 * Determines if multi-IDE support is needed based on user configuration.
 * Prompts user if they want to install to multiple IDEs.
 *
 * @param {Object} options - Options
 * @param {string} options.primaryIde - The selected primary IDE
 * @param {boolean} options.silent - Skip prompt
 * @returns {Promise<string[]>} - Array of IDE labels or ['multi-ide']
 */
export async function determineIdeScope(options = {}) {
  const { primaryIde, silent = false } = options;

  if (silent) {
    return primaryIde ? [primaryIde] : ['multi-ide'];
  }

  // If primary IDE is already null (multi-ide), return as-is
  if (!primaryIde) {
    return ['multi-ide'];
  }

  const { multiIde } = await inquirer.prompt([{
    type: 'confirm',
    name: 'multiIde',
    message: 'Install to multiple IDEs?',
    default: false
  }]);

  if (multiIde) {
    // Prompt to select additional IDEs
    const additionalIdes = await selectAdditionalIdes(primaryIde);
    return [primaryIde, ...additionalIdes];
  }

  return [primaryIde];
}

/**
 * Prompts user to select additional IDEs for multi-IDE installation.
 *
 * @param {string} primaryIde - The primary IDE to exclude from selection
 * @returns {Promise<string[]>} - Array of additional IDE labels
 */
async function selectAdditionalIdes(primaryIde) {
  const availableIdes = TARGETS
    .map(t => t.label)
    .filter(label => label !== primaryIde);

  const { additional } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'additional',
    message: 'Select additional IDEs:',
    choices: availableIdes,
    validate: (answer) => {
      return true; // Empty is valid (user selected primary only)
    }
  }]);

  return additional;
}

/**
 * Validates that an IDE label is valid and has a skills directory.
 *
 * @param {string} ideLabel - The IDE label to validate
 * @returns {Object} - { valid: boolean, error: string|null }
 */
export function validateIdeLabel(ideLabel) {
  if (ideLabel === null || ideLabel === 'multi-ide') {
    return { valid: true };
  }

  const target = TARGETS.find(t => t.label === ideLabel);

  if (!target) {
    return {
      valid: false,
      error: `Unknown IDE: "${ideLabel}". Valid options: ${TARGETS.map(t => t.label).join(', ')}`
    };
  }

  if (!target.skillsDir) {
    return {
      valid: false,
      error: `IDE "${ideLabel}" does not have a skills directory configured`
    };
  }

  return { valid: true };
}

/**
 * Ensures the skills directory exists for the given IDE.
 * Creates the directory structure if it doesn't exist.
 *
 * @param {string} ideLabel - The IDE label
 * @param {boolean} isGlobal - Whether to use global path
 * @param {Object} options - Options
 * @param {boolean} options.dryRun - Skip actual directory creation
 * @returns {Promise<string>} - The path to the skills directory
 */
export async function ensureIdeSkillsDir(ideLabel, isGlobal = false, options = {}) {
  const { dryRun = false } = options;

  // Handle multi-IDE case
  if (ideLabel === null || ideLabel === 'multi-ide') {
    const basePath = isGlobal
      ? path.join(os.homedir(), '.rosetta', 'skills')
      : path.join(process.cwd(), '.rosetta', 'skills');

    if (!dryRun) {
      await fs.ensureDir(basePath);
    }

    return basePath;
  }

  const skillsDir = getIdeSkillsDir(ideLabel, isGlobal);

  if (!dryRun) {
    await fs.ensureDir(skillsDir);
  }

  return skillsDir;
}

/**
 * Gets the manifest file path for a given IDE and scope.
 *
 * @param {string|null} ideLabel - The IDE label or null for multi-ide
 * @param {boolean} isGlobal - Whether to use global path
 * @returns {string} - Path to the manifest file
 */
export function getIdeManifestPath(ideLabel, isGlobal = false) {
  // Multi-IDE uses .rosetta/skills/manifest.json
  if (ideLabel === null || ideLabel === 'multi-ide') {
    return isGlobal
      ? path.join(os.homedir(), '.rosetta', 'skills', 'manifest.json')
      : path.join(process.cwd(), '.rosetta', 'skills', 'manifest.json');
  }

  // IDE-specific manifests
  const skillsDir = getIdeSkillsDir(ideLabel, isGlobal);
  return path.join(skillsDir, 'manifest.json');
}

/**
 * Gets all manifest paths across installed IDEs.
 * Useful for aggregating skills from multiple IDEs.
 *
 * @param {boolean} isGlobal - Whether to use global paths
 * @returns {Promise<string[]>} - Array of manifest file paths that exist
 */
export async function getAllManifestPaths(isGlobal = false) {
  const manifestPaths = [];

  // Check multi-IDE manifest
  const multiIdeManifest = getIdeManifestPath(null, isGlobal);
  if (await fs.pathExists(multiIdeManifest)) {
    manifestPaths.push(multiIdeManifest);
  }

  // Check IDE-specific manifests
  for (const target of TARGETS) {
    if (target.skillsDir) {
      const ideManifest = getIdeManifestPath(target.label, isGlobal);
      if (await fs.pathExists(ideManifest)) {
        manifestPaths.push(ideManifest);
      }
    }
  }

  return manifestPaths;
}
