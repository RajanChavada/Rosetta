/**
 * Migrate Master Skill to YAML
 *
 * Converts existing .ai/master-skill.md configuration to rosetta.yaml
 * This is a best-effort migration - some manual review may be needed.
 */

import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseYAMLContent, serializeToYAML, writeYAMLFile, createMinimalYAML } from '../parsers/yaml-parser.js';
import { CanonicalAST, ProjectType, RiskLevel } from '../ast/canonical.js';
import { TreeLogger } from '../utils.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Extract placeholder value from content
 * Looks for patterns like "**Type:** value" or "- **Stack:** value"
 */
function extractValue(content, patterns) {
  for (const pattern of patterns) {
    const match = content.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  return null;
}

/**
 * Parse master-skill.md and extract configuration
 * @param {string} content - The master-skill.md content
 * @returns {Object} Extracted configuration
 */
function parseMasterSkill(content) {
  const config = {
    project: {
      name: '',
      description: '',
      type: ProjectType.WEB_APP,
      riskLevel: RiskLevel.MEDIUM
    },
    stack: {
      language: '',
      frontend: [],
      backend: [],
      datastores: [],
      testing: []
    },
    conventions: [],
    commands: { dev: [], test: [], build: [] },
    agents: [],
    notes: [],
    ideOverrides: {}
  };

  // Extract project name from title (first heading)
  const titleMatch = content.match(/# (.+)/);
  if (titleMatch) {
    config.project.name = titleMatch[1]
      .replace(/Master Spec/g, '')
      .replace(/Minimal Expert Rules/g, '')
      .replace(/\(.*\)/g, '') // Remove parenthetical
      .trim();
  }

  // Set description
  config.project.description = `${config.project.name} project`;

  // Extract project type
  const type = extractValue(content, [
    /Type:\s*\*\*(?:{{PROJECT_TYPE}}|(\w+(?:\s+\w+)*))\*\*/i,
    /project type[:\s]*(\w+(?:\s+\w+)*)/i,
    /^type:\s*(.+)$/mi
  ]);

  if (type) {
    // Map common type descriptions to enum values
    const typeMap = {
      'web app': ProjectType.WEB_APP,
      'web': ProjectType.WEB_APP,
      'api': ProjectType.API_SERVICE,
      'api service': ProjectType.API_SERVICE,
      'cli': ProjectType.CLI_TOOL,
      'cli tool': ProjectType.CLI_TOOL,
      'data': ProjectType.DATA_ML,
      'machine learning': ProjectType.DATA_ML,
      'ml': ProjectType.DATA_ML,
      'library': ProjectType.LIBRARY_SDK,
      'sdk': ProjectType.LIBRARY_SDK,
      'internal': ProjectType.INTERNAL_TOOLING,
      'internal tooling': ProjectType.INTERNAL_TOOLING
    };

    const normalized = type.toLowerCase();
    if (typeMap[normalized]) {
      config.project.type = typeMap[normalized];
    }
  }

  // Extract risk level
  const risk = extractValue(content, [
    /Risk Level:\s*\*\*(?:{{RISK_LEVEL}}|(\w+))\*\*/i,
    /risk level[:\s]*(\w+)/i,
    /risk[:\s]*(\w+)/i
  ]);

  if (risk) {
    const riskMap = {
      'low': RiskLevel.LOW,
      'medium': RiskLevel.MEDIUM,
      'high': RiskLevel.HIGH
    };

    const normalized = risk.toLowerCase();
    if (riskMap[normalized]) {
      config.project.riskLevel = riskMap[normalized];
    }
  }

  // Extract stack information
  const stackMatch = extractValue(content, [
    /Stack Focus:\s*\*\*(?:{{FRONTEND_STACK}}[,\s]*{{BACKEND_STACK}}[,\s]*{{DATASTORES}}|(.+))\*\*/i,
    /Technology Stack:\s*\*\*(.+)\*\*/i,
    /stack[:\s]*(.+)/i
  ]);

  if (stackMatch) {
    // Try to split frontend/backend/datastores
    const parts = stackMatch.split(',').map(s => s.trim());

    if (parts.length >= 2) {
      config.stack.frontend = [parts[0]];
      config.stack.backend = [parts[1]];
      if (parts.length >= 3) {
        config.stack.datastores = [parts[2]];
      }
    }
  }

  // Extract primary language (look for common language names)
  const languages = ['TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'Java', 'Ruby', 'PHP', 'C++', 'C#'];
  for (const lang of languages) {
    if (content.includes(lang) || (config.project.name && config.project.name.toLowerCase().includes(lang.toLowerCase()))) {
      config.stack.language = lang;
      break;
    }
  }

  // Default to TypeScript if not detected
  if (!config.stack.language) {
    config.stack.language = 'TypeScript';
  }

  return config;
}

/**
 * Main migration function
 * @param {Object} options - Migration options
 */
export async function migrateToYAMLCommand(options = {}) {
  const { dryRun = false, verbose = false } = options;

  const tree = new TreeLogger('Migration');
  tree.start('Migrating master-skill.md to rosetta.yaml...');

  const masterPath = '.ai/master-skill.md';

  try {
    // Check if master-skill.md exists
    const exists = await fs.pathExists(masterPath);
    if (!exists) {
      tree.warn(`${masterPath} not found. Creating new minimal rosetta.yaml instead.`);
      await createNewYAML(options);
      return;
    }

    // Read existing master-skill.md
    tree.info(`Found existing config at ${masterPath}`);
    const content = await fs.readFile(masterPath, 'utf8');

    if (verbose) {
      tree.info('Parsing existing configuration...');
    }

    // Parse configuration
    const config = parseMasterSkill(content);

    // Create AST
    const ast = new CanonicalAST(config);

    // Validate
    const validation = ast.validate();
    if (!validation.valid) {
      tree.warn('Automatically migrated config has validation issues:');
      for (const err of validation.errors.slice(0, 5)) {
        tree.warn(`  - ${err.path}: ${err.message}`);
      }
      tree.info('You may need to manually edit rosetta.yaml after migration.');
    }

    // Generate YAML with metadata
    const { serializeToYAML } = await import('../parsers/yaml-parser.js');
    const yamlContent = serializeToYAML(ast, { includeMetadata: true });

    // Write rosetta.yaml
    const targetPath = 'rosetta.yaml';

    if (dryRun) {
      tree.info('[Dry Run] Would write:');
      console.log('---');
      console.log(yamlContent);
      console.log('---');
    } else {
      // Backup existing rosetta.yaml if it exists
      if (await fs.pathExists(targetPath)) {
        const backupPath = `${targetPath}.migration-backup-${Date.now()}`;
        await fs.copy(targetPath, backupPath);
        tree.info(`Backed up existing rosetta.yaml to ${backupPath}`);
      }

      // Backup master-skill.md
      const masterBackup = `${masterPath}.migration-backup-${Date.now()}`;
      await fs.copy(masterPath, masterBackup);
      tree.info(`Backed up ${masterPath} to ${masterBackup}`);

      // Write new rosetta.yaml
      await fs.writeFile(targetPath, yamlContent, 'utf8');
      tree.success(`Created ${targetPath} from ${masterPath}`);
    }

    // Summary
    tree.success('\nMigration complete!');
    tree.info('');
    tree.info(`Project: ${ast.getProjectName() || '(not detected)'}`);
    tree.info(`Type: ${ast.getProjectType()}`);
    tree.info(`Language: ${ast.getLanguage() || '(not detected)'}`);
    tree.info('');
    tree.info('Next steps:');
    tree.info('  1. Review rosetta.yaml and add missing details');
    tree.info('  2. Run: rosetta sync-yaml');
    tree.info('  3. Optionally remove .ai/master-skill.md after verifying');

  } catch (error) {
    tree.error(`Migration failed: ${error.message}`);
    if (verbose) {
      console.error(error);
    }
    process.exit(1);
  }
}

/**
 * Create a new minimal rosetta.yaml if no master-skill.md exists
 * @param {Object} options - Options
 */
async function createNewYAML(options) {
  const { dryRun = false } = options;

  const tree = new TreeLogger('Create');
  tree.start('Creating new rosetta.yaml...');

  try {
    // Prompt for project details in interactive mode
    let projectName = 'my-project';
    let projectType = ProjectType.WEB_APP;
    let language = 'TypeScript';

    if (!dryRun && process.stdin.isTTY) {
      const inquirer = await import('inquirer');
      const answers = await inquirer.default.prompt([
        {
          type: 'input',
          name: 'name',
          message: 'Project name:',
          default: path.basename(process.cwd())
        },
        {
          type: 'list',
          name: 'type',
          message: 'Project type:',
          choices: Object.values(ProjectType),
          default: ProjectType.WEB_APP
        },
        {
          type: 'input',
          name: 'language',
          message: 'Primary programming language:',
          default: 'TypeScript'
        }
      ]);

      projectName = answers.name;
      projectType = answers.type;
      language = answers.language;
    }

    // Create minimal YAML
    const ast = CanonicalAST.createMinimal(projectName, projectType, language);

    // Apply metadata indicating this is a new file, not a migration
    ast.updateMetadata({ source: null, version: '1.0.0' });

    // Serialize and write
    const yamlContent = serializeToYAML(ast, { includeMetadata: false });
    const targetPath = 'rosetta.yaml';

    if (dryRun) {
      tree.info('[Dry Run] Would create:');
      console.log('---');
      console.log(yamlContent);
      console.log('---');
    } else {
      await fs.writeFile(targetPath, yamlContent, 'utf8');
      tree.success(`Created ${targetPath} with minimal configuration`);
    }

    tree.info('');
    tree.info('Next steps:');
    tree.info('  1. Edit rosetta.yaml to add project details');
    tree.info('  2. Run: rosetta sync-yaml');
    tree.info('  3. Add conventions, commands, and agents as needed');

  } catch (error) {
    tree.error(`Failed to create rosetta.yaml: ${error.message}`);
    process.exit(1);
  }
}

export default {
  migrateToYAMLCommand,
  parseMasterSkill
};
