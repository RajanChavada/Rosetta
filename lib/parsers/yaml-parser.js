/**
 * YAML Parser for rosetta.yaml
 *
 * Handles parsing and serialization of rosetta.yaml files
 * with schema validation integration
 */

import fs from 'fs-extra';
import yaml from 'js-yaml';
import { CanonicalAST } from '../ast/canonical.js';
import { validateYAML, checkRequiredFields } from '../validation/schema-validator.js';
import { createMetadata, updateMetadata } from '../ast/metadata.js';

/**
 * Parse a rosetta.yaml file
 * @param {string} filePath - Path to the rosetta.yaml file
 * @returns {Promise<CanonicalAST>} The parsed Canonical AST
 * @throws {Error} If file doesn't exist, parsing fails, or validation fails
 */
export async function parseYAMLFile(filePath) {
  // Check if file exists
  const exists = await fs.pathExists(filePath);
  if (!exists) {
    throw new Error(`rosetta.yaml not found at: ${filePath}`);
  }

  // Read file
  const content = await fs.readFile(filePath, 'utf8');

  // Parse content
  return parseYAMLContent(content);
}

/**
 * Parse YAML content string
 * @param {string} yamlContent - YAML content as string
 * @returns {CanonicalAST} The parsed Canonical AST
 * @throws {Error} If parsing fails or validation fails
 */
export function parseYAMLContent(yamlContent) {
  let yamlObject;

  try {
    yamlObject = yaml.load(yamlContent);
  } catch (error) {
    throw new Error(`YAML parsing failed: ${error.message}`);
  }

  if (!yamlObject || typeof yamlObject !== 'object') {
    throw new Error('YAML content is not a valid object');
  }

  // Quick validation check
  const quickCheck = checkRequiredFields(yamlObject);
  if (!quickCheck.valid) {
    throw new Error(`Missing required fields: ${quickCheck.missing.join(', ')}`);
  }

  // Create AST
  const ast = new CanonicalAST(yamlObject);

  // Full validation
  const validation = ast.validate();
  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => `  - ${e.path}: ${e.message}`).join('\n');
    throw new Error(`Schema validation failed:\n${errorMessages}`);
  }

  return ast;
}

/**
 * Serialize a Canonical AST to YAML
 * @param {CanonicalAST} ast - The Canonical AST to serialize
 * @param {Object} options - Serialization options
 * @returns {string} YAML string
 */
export function serializeToYAML(ast, options = {}) {
  const { includeMetadata = true, pretty = true } = options;

  // Get the data object
  let data = ast.toObject();

  // Update metadata timestamp if requested
  if (includeMetadata) {
    const now = new Date().toISOString();
    if (!data.metadata) {
      data.metadata = {
        created_at: now,
        updated_at: now
      };
    } else {
      if (!data.metadata.created_at) {
        data.metadata.created_at = now;
      }
      data.metadata.updated_at = now;
    }
  } else if (data.metadata) {
    // Remove metadata if not requested
    delete data.metadata;
  }

  // Serialize to YAML
  const dumpOptions = {
    indent: 2,
    lineWidth: -1, // No line wrapping
    noRefs: true,  // Don't use anchors/aliases
    sortKeys: false, // Preserve key order
    pretty
  };

  return yaml.dump(data, dumpOptions);
}

/**
 * Write a Canonical AST to a YAML file
 * @param {string} filePath - Path to write the file
 * @param {CanonicalAST} ast - The Canonical AST to write
 * @param {Object} options - Write options
 * @returns {Promise<void>}
 */
export async function writeYAMLFile(filePath, ast, options = {}) {
  const { dryRun = false, backup = true } = options;

  // Create backup if file exists and backup requested
  if (backup && await fs.pathExists(filePath)) {
    const backupPath = `${filePath}.bak`;
    await fs.copy(filePath, backupPath, { overwrite: true });
  }

  // Serialize to YAML
  const yamlContent = serializeToYAML(ast, options);
  console.log('Debug: YAML content length:', yamlContent.length);

  // Write or preview
  if (dryRun) {
    console.log(`[Dry Run] Would write to: ${filePath}`);
    console.log('---');
    console.log(yamlContent);
    console.log('---');
  } else {
    await fs.writeFile(filePath, yamlContent, 'utf8');
  }
}

/**
 * Create a minimal rosetta.yaml file
 * @param {string} filePath - Path to create the file
 * @param {Object} config - Configuration for the minimal file
 * @returns {Promise<CanonicalAST>} The created AST
 */
export async function createMinimalYAML(filePath, config = {}) {
  const {
    projectName = 'my-project',
    projectType = 'web_app',
    language = 'TypeScript',
    description = `${projectName} project`
  } = config;

  const ast = CanonicalAST.createMinimal(projectName, projectType, language);
  ast.set('project.description', description);

  await writeYAMLFile(filePath, ast, { backup: false });

  return ast;
}

/**
 * Validate a rosetta.yaml file without parsing
 * @param {string} filePath - Path to the file
 * @returns {Promise<Object>} Validation result
 */
export async function validateYAMLFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');
    const yamlObject = yaml.load(content);

    return validateYAML(yamlObject);
  } catch (error) {
    return {
      valid: false,
      errors: [{
        path: '(file)',
        property: 'file',
        keyword: 'file',
        message: error.message
      }]
    };
  }
}

/**
 * Check if a directory contains a rosetta.yaml file
 * @param {string} dirPath - Directory path
 * @returns {Promise<boolean>} True if rosetta.yaml exists
 */
export async function hasRosettaYAML(dirPath) {
  const yamlPath = dirPath.endsWith('rosetta.yaml') ? dirPath : `${dirPath.replace(/\/$/, '')}/rosetta.yaml`;
  return fs.pathExists(yamlPath);
}

/**
 * Find rosetta.yaml in current or parent directories
 * @param {string} startDir - Directory to start searching from
 * @param {number} maxDepth - Maximum directories to search up
 * @returns {Promise<string|null>} Path to rosetta.yaml or null
 */
export async function findRosettaYAML(startDir = process.cwd(), maxDepth = 5) {
  // Resolve startDir to its real path to avoid symlink inconsistencies
  let currentDir;
  try {
    currentDir = await fs.realpath(startDir);
  } catch {
    // If realpath fails (e.g., dir doesn't exist), use startDir as is
    currentDir = startDir;
  }

  for (let i = 0; i < maxDepth; i++) {
    const yamlPath = `${currentDir}/rosetta.yaml`;

    if (await fs.pathExists(yamlPath)) {
      return yamlPath;
    }

    // Move to parent directory
    const parentDir = `${currentDir}/..`;

    // Resolve to absolute path and check if we've reached root
    const resolvedParent = await fs.realpath(parentDir);
    const resolvedCurrent = await fs.realpath(currentDir);

    if (resolvedParent === resolvedCurrent) {
      break; // Reached filesystem root
    }

    currentDir = resolvedParent;
  }

  return null;
}

/**
 * Merge multiple YAML files
 * @param {Array<string>} filePaths - Array of file paths to merge
 * @param {string} strategy - Merge strategy
 * @returns {Promise<CanonicalAST>} Merged AST
 */
export async function mergeYAMLFiles(filePaths, strategy = 'canonical') {
  if (filePaths.length === 0) {
    throw new Error('No files provided for merging');
  }

  // Parse first file as base
  let merged = await parseYAMLFile(filePaths[0]);

  // Merge remaining files
  for (let i = 1; i < filePaths.length; i++) {
    const nextAST = await parseYAMLFile(filePaths[i]);
    merged = merged.merge(nextAST, strategy);
  }

  return merged;
}

export default {
  parseYAMLFile,
  parseYAMLContent,
  serializeToYAML,
  writeYAMLFile,
  createMinimalYAML,
  validateYAMLFile,
  hasRosettaYAML,
  findRosettaYAML,
  mergeYAMLFiles
};
