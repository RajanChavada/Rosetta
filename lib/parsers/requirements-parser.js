/**
 * Python Requirements Parser
 *
 * Parses requirements.txt files to extract Python dependencies
 */

import fs from 'fs-extra';
import path from 'path';

/**
 * Parse requirements.txt file and return dependencies object
 * @param {string} cwd - Current working directory
 * @returns {Promise<Object>} Dependencies object with package names as keys
 */
export async function parseRequirements(cwd) {
  const requirementsPath = path.join(cwd, 'requirements.txt');
  const deps = {};

  // Check if file exists
  const exists = await fs.pathExists(requirementsPath);
  if (!exists) {
    return deps;
  }

  // Read file content
  const content = await fs.readFile(requirementsPath, 'utf8');

  // Parse each line
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#') || trimmed.startsWith('-')) {
      continue;
    }

    // Parse package name (strip version specs and extras)
    const packageMatch = trimmed.match(/^([a-zA-Z0-9_-]+)/);
    if (packageMatch) {
      const packageName = packageMatch[1].toLowerCase();
      deps[packageName] = true;
    }
  }

  return deps;
}