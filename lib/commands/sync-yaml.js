/**
 * Sync V2 Command
 *
 * Syncs rosetta.yaml to all IDE configuration files
 * This is the new YAML-first architecture implementation
 */

import chalk from 'chalk';
import path from 'path';
import { ensureDir, pathExists } from 'fs-extra';
import { writeFile } from 'fs/promises';
import { TARGETS } from '../constants.js';
import { ClaudeGenerator, CursorGenerator, WindsurfGenerator } from '../generators/index.js';
import { parseYAMLFile } from '../parsers/yaml-parser.js';
import { requireInit } from '../utils/require-init.js';
import { TreeLogger } from '../utils.js';

const GENERATORS = {
  'claude': ClaudeGenerator,
  'cursor': CursorGenerator,
  'windsurf': WindsurfGenerator,
  // Future: 'codex': CodexGenerator,
  // Future: 'copilot': CopilotGenerator,
  // Future: 'kilo': KiloGenerator,
  // Future: 'continue': ContinueGenerator
};

/**
 * Get default YAML path (search from current directory)
 * @returns {Promise<string>} Path to rosetta.yaml
 */
async function getDefaultYAMLPath() {
  return requireInit('rosetta sync-yaml');
}

/**
 * Get target IDEs based on selection
 * @param {Array<string>|null} selectedIdes - Selected IDE labels or null for all
 * @returns {Array<Object>} Target configurations
 */
function getTargets(selectedIdes = null) {
  if (selectedIdes) {
    // Match by generator key (claude, cursor, etc.) provided via --ides
    return TARGETS.filter(t => t.generator && selectedIdes.includes(t.generator));
  }
  // Return all targets that have a generator defined
  return TARGETS.filter(t => t.generator && GENERATORS[t.generator]);
}

/**
 * Main sync function
 * @param {Object} options - Sync options
 */
export async function syncYAMLCommand(options = {}) {
  const { ides = null, from = null, dryRun = false, verbose = false } = options;

  const logger = dryRun ? null : new TreeLogger('Sync YAML');

  try {
    // 1. Find and parse rosetta.yaml
    const yamlPath = from || await getDefaultYAMLPath();

    if (logger) {
      logger.logStep(`Found rosetta.yaml at: ${yamlPath}`);
      logger.logStep('Parsing rosetta.yaml...');
    }

    const ast = await parseYAMLFile(yamlPath);

    if (logger) {
      logger.logStep(`Parsed successfully: ${ast.getProjectName()} (${ast.getProjectType()})`);
    }

    // 2. Get target IDEs
    const targets = getTargets(ides);
    if (targets.length === 0) {
      throw new Error('No supported IDE targets found. Supported IDEs: ' + Object.keys(GENERATORS).join(', '));
    }

    if (logger) {
      logger.logStep(`Target IDEs: ${targets.map(t => t.label).join(', ')}`);
      console.log('');
    }

    // 3. Generate IDE configurations
    for (const target of targets) {
      if (logger) {
        console.log(chalk.blue(`Generating ${target.label} → ${target.path}`));
      }

      const GeneratorClass = GENERATORS[target.generator];
      if (!GeneratorClass) {
        console.log(chalk.yellow(`  ⚠ No generator available for ${target.label} (${target.generator}), skipping...`));
        continue;
      }

      try {
        const generator = new GeneratorClass();
        const content = generator.generate(ast);

        // Write file
        const targetDir = path.dirname(target.path);
        await ensureDir(targetDir);

        if (await pathExists(target.path)) {
          if (!dryRun) {
            await writeFile(target.path, content, 'utf8');
          }
          if (verbose) {
            console.log(chalk.gray('  Updated existing file'));
          }
        } else {
          if (!dryRun) {
            await writeFile(target.path, content, 'utf8');
          }
          if (verbose) {
            console.log(chalk.gray('  Created new file'));
          }
        }

        if (dryRun) {
          console.log(chalk.yellow(`  [Dry Run] Would write to: ${target.path}`));
        } else {
          console.log(chalk.green(`  ✓ Wrote ${target.path}`));
        }
      } catch (error) {
        console.log(chalk.red(`  ✗ Failed to generate ${target.label}: ${error.message}`));
      }
    }

    // 4. Summary
    console.log('');
    if (dryRun) {
      console.log(chalk.yellow('Dry run complete. No files were modified.'));
    } else {
      console.log(chalk.green('✓ rosetta.yaml sync complete!'));
    }

    console.log('');
    console.log(`Source: ${yamlPath}`);
    console.log(`Targets: ${targets.length} IDE configuration(s)`);
    console.log('');
    console.log('Next steps:');
    console.log('  - rosetta translate <file> --to yaml   # Convert existing configs');
    console.log('  - rosetta validate-config            # Validate your rosetta.yaml');

  } catch (error) {
    console.log(chalk.red(`Sync failed: ${error.message}`));
    if (verbose) {
      console.error(error);
    }
    // Throw error to allow callers (including tests) to handle
    throw new Error(`Sync failed: ${error.message}`);
  }
}

/**
 * Validate command
 * Validates a rosetta.yaml file
 */
export async function validateConfigCommand(options = {}) {
  const { file = null } = options;

  try {
    const yamlPath = file || await getDefaultYAMLPath();
    console.log(chalk.blue(`Validating: ${yamlPath}`));

    const { parseYAMLContent, validateYAMLFile } = await import('../parsers/yaml-parser.js');

    // Try parsing and validation together
    try {
      const ast = await parseYAMLFile(yamlPath);
      console.log(chalk.green('✓ rosetta.yaml is valid'));
      console.log(`  Project: ${ast.getProjectName()}`);
      console.log(`  Type: ${ast.getProjectType()}`);
      console.log(`  Language: ${ast.getLanguage()}`);
      console.log(`  Conventions: ${ast.getConventions().length}`);
      console.log(`  Agents: ${ast.getAgents().length}`);
      console.log(`  Notes: ${ast.getNotes().length}`);
      process.exit(0);
    } catch (error) {
      const validation = await validateYAMLFile(yamlPath);
      if (!validation.valid) {
        console.log(chalk.red('Validation failed:'));
        for (const err of validation.errors) {
          console.log(chalk.red(`  - ${err.path}: ${err.message}`));
        }
      } else {
        console.log(chalk.red(`Parse error: ${error.message}`));
      }
      process.exit(1);
    }
  } catch (error) {
    console.log(chalk.red(`Error: ${error.message}`));
    process.exit(1);
  }
}

export default {
  syncYAMLCommand,
  validateConfigCommand
};
