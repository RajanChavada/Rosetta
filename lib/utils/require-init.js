/**
 * Shared utility for commands that require `rosetta init` to have been run.
 * Provides a graceful, user-friendly error message instead of a raw stack trace.
 */

import chalk from 'chalk';
import { findRosettaYAML } from '../parsers/yaml-parser.js';

/**
 * Check that rosetta.yaml exists, or exit with a friendly message.
 * @param {string} commandName - The command the user ran (for the error message)
 * @returns {Promise<string>} Resolved path to rosetta.yaml
 */
export async function requireInit(commandName = 'this command') {
  const yamlPath = await findRosettaYAML();

  if (!yamlPath) {
    console.log('');
    console.log(chalk.red.bold('  ✗ Rosetta is not initialized in this project.'));
    console.log('');
    console.log(chalk.white(`  The ${chalk.cyan(commandName)} command requires a ${chalk.yellow('rosetta.yaml')} configuration file.`));
    console.log(chalk.white('  This file is created when you run:'));
    console.log('');
    console.log(chalk.green('    $ rosetta init'));
    console.log('');
    console.log(chalk.gray('  This will walk you through setting up Rosetta for your project.'));
    console.log(chalk.gray('  Once initialized, you can run this command again.'));
    console.log('');
    process.exit(1);
  }

  return yamlPath;
}
