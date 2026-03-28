/**
 * Schema Validator for rosetta.yaml
 * Validates rosetta.yaml files against the JSON Schema
 */

import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load the schema
const schemaPath = path.join(__dirname, '../../schemas/rosetta-schema.json');
let schema;

try {
  schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
} catch (error) {
  throw new Error(`Failed to load schema from ${schemaPath}: ${error.message}`);
}

// Initialize AJV with all errors for detailed reporting
const ajv = new Ajv({
  allErrors: true,
  verbose: true,
  strict: false
});

addFormats(ajv);

/**
 * Validate a YAML object against the rosetta schema
 * @param {Object} yamlObject - The parsed YAML object to validate
 * @returns {Object} Validation result with valid flag and errors array
 */
export function validateYAML(yamlObject) {
  const validate = ajv.compile(schema);
  const valid = validate(yamlObject);

  if (!valid) {
    return {
      valid: false,
      errors: validate.errors.map(err => ({
        path: err.instancePath || '(root)',
        property: err.instancePath?.split('/').pop() || 'root',
        message: err.message,
        expected: formatExpectedValue(err),
        actual: formatActualValue(err),
        keyword: err.keyword
      }))
    };
  }

  return { valid: true };
}

/**
 * Format the expected value for error messages
 */
function formatExpectedValue(error) {
  if (error.keyword === 'type') {
    return error.params.type;
  }
  if (error.keyword === 'enum') {
    return error.params.allowedValues.join(', ');
  }
  if (error.keyword === 'pattern') {
    return error.params.pattern;
  }
  if (error.keyword === 'minLength') {
    return `at least ${error.params.limit} characters`;
  }
  if (error.keyword === 'maxLength') {
    return `at most ${error.params.limit} characters`;
  }
  if (error.keyword === 'minimum') {
    return error.params.limit;
  }
  if (error.keyword === 'maximum') {
    return error.params.limit;
  }
  return error.params?.allowedValues || error.params?.type || 'valid value';
}

/**
 * Format the actual value for error messages
 */
function formatActualValue(error) {
  if (error.data === undefined || error.data === null) {
    return error.keyword === 'required' ? 'missing' : String(error.data);
  }
  if (typeof error.data === 'object') {
    return JSON.stringify(error.data);
  }
  return String(error.data);
}

/**
 * Validate a rosetta.yaml file directly
 * @param {string} filePath - Path to the rosetta.yaml file
 * @returns {Promise<Object>} Validation result
 */
export async function validateYAMLFile(filePath) {
  try {
    const yaml = await fs.readFile(filePath, 'utf8');

    // Import yaml parser
    const { parse } = await import('js-yaml');
    const yamlObject = parse(yaml);

    return validateYAML(yamlObject);
  } catch (error) {
    if (error.name === 'YAMLException') {
      return {
        valid: false,
        errors: [{
          path: '(parse)',
          property: 'parse',
          message: `YAML parsing error: ${error.message}`,
          keyword: 'parse'
        }]
      };
    }

    return {
      valid: false,
      errors: [{
        path: '(file)',
        property: 'file',
        message: error.message,
        keyword: 'file'
      }]
    };
  }
}

/**
 * Format validation errors as a readable string
 * @param {Array} errors - Array of error objects from validateYAML
 * @returns {string} Formatted error message
 */
export function formatValidationErrors(errors) {
  if (!errors || errors.length === 0) {
    return 'No errors';
  }

  const lines = errors.map((err, idx) => {
    const location = err.path === '(root)' ? 'root' : err.path;
    return `  ${idx + 1}. [${err.keyword}] ${location}\n     ${err.message}`;
  });

  return `Validation errors:\n${lines.join('\n')}`;
}

/**
 * Check if a YAML object has required top-level fields
 * Quick check before full schema validation
 * @param {Object} yamlObject - The parsed YAML object
 * @returns {Object} Result with valid flag and missing fields
 */
export function checkRequiredFields(yamlObject) {
  const required = ['schema_version', 'project', 'stack'];
  const missing = [];

  for (const field of required) {
    if (!yamlObject || !yamlObject[field]) {
      missing.push(field);
    }
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

// Export the schema for use in generators
export { schema };
