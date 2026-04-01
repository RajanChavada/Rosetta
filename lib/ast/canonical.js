/**
 * Canonical AST for Rosetta Configuration
 *
 * The Canonical AST represents the universal, IDE-agnostic configuration
 * that can be compiled to any IDE-specific format.
 */

import { validateYAML, checkRequiredFields } from '../validation/schema-validator.js';
import { diffObjects, mergeObjects, deepClone } from './utils.js';

/**
 * Project type enumeration
 */
export const ProjectType = {
  WEB_APP: 'web_app',
  API_SERVICE: 'api_service',
  CLI_TOOL: 'cli_tool',
  DATA_ML: 'data_ml',
  LIBRARY_SDK: 'library_sdk',
  INTERNAL_TOOLING: 'internal_tooling'
};

/**
 * Risk level enumeration
 */
export const RiskLevel = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

/**
 * Agent style enumeration
 */
export const AgentStyle = {
  PAIR_PROGRAMMER: 'pair_programmer',
  AUTONOMOUS: 'autonomous',
  CONSERVATIVE: 'conservative'
};

/**
 * Agent scope enumeration
 */
export const AgentScope = {
  CURRENT_FILE: 'current_file',
  MODULE: 'module',
  REPO: 'repo'
};

/**
 * Note category enumeration
 */
export const NoteCategory = {
  DOMAIN_RULE: 'domain_rule',
  GOTCHA: 'gotcha',
  OPTIMIZATION: 'optimization',
  DEBUGGING: 'debugging'
};

/**
 * Default values for canonical configuration
 */
const DEFAULTS = {
  schemaVersion: '1.0.0',
  project: {
    riskLevel: RiskLevel.MEDIUM
  },
  stack: {
    frontend: [],
    backend: [],
    datastores: [],
    testing: []
  },
  conventions: [],
  commands: {
    dev: [],
    test: [],
    build: []
  },
  agents: [],
  workflows: [],
  notes: [],
  ideOverrides: {},
  metadata: {}
};

/**
 * Canonical AST Class
 *
 * Represents the universal, IDE-agnostic configuration that can be
 * compiled to any IDE-specific format.
 */
export class CanonicalAST {
  /**
   * Create a new Canonical AST
   * @param {Object} config - Configuration object
   */
  constructor(config = {}) {
    this._data = this._applyDefaults(config);
  }

  /**
   * Apply default values to configuration
   * @private
   */
  _applyDefaults(config) {
    return {
      schema_version: config.schema_version || DEFAULTS.schemaVersion,
      project: {
        name: config.project?.name || '',
        description: config.project?.description || '',
        type: config.project?.type || ProjectType.WEB_APP,
        risk_level: config.project?.riskLevel || config.project?.risk_level || DEFAULTS.project.riskLevel
      },
      stack: {
        language: config.stack?.language || '',
        frontend: config.stack?.frontend || [],
        backend: config.stack?.backend || [],
        datastores: config.stack?.datastores || [],
        testing: config.stack?.testing || []
      },
      conventions: config.conventions || [],
      commands: {
        dev: config.commands?.dev || [],
        test: config.commands?.test || [],
        build: config.commands?.build || []
      },
      agents: config.agents || [],
      workflows: config.workflows || [],
      notes: config.notes || [],
      ide_overrides: config.ideOverrides || config.ide_overrides || {},
      metadata: config.metadata || {}
    };
  }

  /**
   * Validate the AST against the schema
   * @returns {Object} Validation result with valid flag and errors
   */
  validate() {
    const quickCheck = checkRequiredFields(this._data);

    if (!quickCheck.valid) {
      return {
        valid: false,
        errors: [{
          path: '(root)',
          property: 'root',
          message: `Missing required fields: ${quickCheck.missing.join(', ')}`
        }]
      };
    }

    return validateYAML(this._data);
  }

  /**
   * Check if the AST is valid
   * @returns {boolean} True if valid
   */
  isValid() {
    return this.validate().valid;
  }

  /**
   * Get the raw data object
   * @returns {Object} The raw configuration data (deep clone)
   */
  toObject() {
    return deepClone(this._data);
  }

  /**
   * Get a specific value by path
   * @param {string} path - Dot-notation path with optional array indices (e.g., 'project.name', 'conventions[0].rules')
   * @returns {*} The value at the path
   */
  get(path) {
    if (!path) return undefined;
    const parts = path.split('.');
    let value = this._data;

    for (const part of parts) {
      if (!value || typeof value !== 'object') {
        return undefined;
      }

      // Parse bracket notation for array access (e.g., "arr[0]")
      const match = part.match(/^([^\[]+)(?:\[(\d+)\])?$/);
      if (!match) {
        return undefined;
      }

      const key = match[1];
      const index = match[2] !== undefined ? match[2] : null;

      // Access the key
      if (!(key in value)) {
        return undefined;
      }
      value = value[key];

      // If index provided, access array element
      if (index !== null) {
        if (!Array.isArray(value)) {
          return undefined;
        }
        const idx = parseInt(index, 10);
        if (idx < 0 || idx >= value.length) {
          return undefined;
        }
        value = value[idx];
      }
    }

    return value;
  }

  /**
   * Set a specific value by path
   * @param {string} path - Dot-notation path
   * @param {*} value - Value to set
   */
  set(path, value) {
    const parts = path.split('.');
    let obj = this._data;

    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in obj)) {
        obj[part] = {};
      }
      obj = obj[part];
    }

    obj[parts[parts.length - 1]] = value;
  }

  /**
   * Merge another AST into this one
   * @param {CanonicalAST} other - Another AST to merge
   * @param {string} strategy - Merge strategy: 'canonical', 'preserve', 'timestamp'
   * @returns {CanonicalAST} A new merged AST
   */
  merge(other, strategy = 'canonical') {
    const otherData = other.toObject();

    if (strategy === 'preserve') {
      // Keep existing values, only add new ones
      return new CanonicalAST(mergeObjects(this._data, otherData, 'preserve'));
    }

    if (strategy === 'timestamp') {
      // Use most recently modified
      return new CanonicalAST(mergeObjects(this._data, otherData, 'timestamp'));
    }

    // Default: canonical (prefer this AST)
    return new CanonicalAST(mergeObjects(this._data, otherData, 'canonical'));
  }

  /**
   * Diff this AST against another
   * @param {CanonicalAST} other - Another AST to compare
   * @returns {Object} Diff result
   */
  diff(other) {
    return diffObjects(this._data, other.toObject());
  }

  /**
   * Get the project name
   * @returns {string}
   */
  getProjectName() {
    return this._data.project?.name || '';
  }

  /**
   * Get the project type
   * @returns {string}
   */
  getProjectType() {
    return this._data.project?.type || ProjectType.WEB_APP;
  }

  /**
   * Get the primary language
   * @returns {string}
   */
  getLanguage() {
    return this._data.stack?.language || '';
  }

  /**
   * Get the risk level
   * @returns {string}
   */
  getRiskLevel() {
    return this._data.project?.risk_level || RiskLevel.MEDIUM;
  }

  /**
   * Get all conventions
   * @returns {Array}
   */
  getConventions() {
    return this._data.conventions || [];
  }

  /**
   * Get all agents
   * @returns {Array}
   */
  getAgents() {
    return this._data.agents || [];
  }

  /**
   * Get all workflows
   * @returns {Array}
   */
  getWorkflows() {
    return this._data.workflows || [];
  }

  /**
   * Get all notes
   * @returns {Array}
   */
  getNotes() {
    return this._data.notes || [];
  }

  /**
   * Get notes by category
   * @param {string} category - Note category
   * @returns {Array}
   */
  getNotesByCategory(category) {
    return (this._data.notes || []).filter(n => n.category === category);
  }

  /**
   * Get all commands object (dev, test, build)
   * @returns {Object} Commands object
   */
  getCommands() {
    return this._data.commands || { dev: [], test: [], build: [] };
  }

  /**
   * Get IDE overrides for a specific IDE
   * @param {string} ide - IDE identifier (claude, cursor, windsurf, etc.)
   * @returns {Object} IDE-specific overrides
   */
  getIDEOverrides(ide) {
    return this._data.ide_overrides?.[ide] || {};
  }

  /**
   * Add a note
   * @param {Object} note - Note object with title, category, content, priority
   */
  addNote(note) {
    if (!this._data.notes) {
      this._data.notes = [];
    }
    this._data.notes.push({
      title: note.title,
      category: note.category,
      content: note.content,
      priority: note.priority || 5
    });
  }

  /**
   * Add a convention
   * @param {Object} convention - Convention object with name and rules
   */
  addConvention(convention) {
    if (!this._data.conventions) {
      this._data.conventions = [];
    }
    this._data.conventions.push({
      name: convention.name,
      rules: convention.rules || [],
      examples: convention.examples || []
    });
  }

  /**
   * Add an agent
   * @param {Object} agent - Agent object with name, role, style, scope
   */
  addAgent(agent) {
    if (!this._data.agents) {
      this._data.agents = [];
    }
    this._data.agents.push({
      name: agent.name,
      role: agent.role,
      style: agent.style,
      scope: agent.scope,
      system_prompt: agent.systemPrompt
    });
  }

  /**
   * Set IDE overrides
   * @param {string} ide - IDE identifier
   * @param {Object} overrides - Override configuration
   */
  setIDEOverrides(ide, overrides) {
    if (!this._data.ide_overrides) {
      this._data.ide_overrides = {};
    }
    this._data.ide_overrides[ide] = overrides;
  }

  /**
   * Update metadata
   * @param {Object} metadata - Metadata to update
   */
  updateMetadata(metadata) {
    if (!this._data.metadata) {
      this._data.metadata = {};
    }
    Object.assign(this._data.metadata, metadata);
    // Always set updated_at to current timestamp
    this._data.metadata.updated_at = new Date().toISOString();
  }

  /**
   * Create a Canonical AST from a parsed YAML object
   * @param {Object} yamlObject - Parsed YAML object
   * @returns {CanonicalAST}
   */
  static fromYAML(yamlObject) {
    return new CanonicalAST(yamlObject);
  }

  /**
   * Create a minimal Canonical AST for a project type
   * @param {string} projectName - Project name
   * @param {string} projectType - Project type
   * @param {string} language - Primary language
   * @returns {CanonicalAST}
   */
  static createMinimal(projectName, projectType = ProjectType.WEB_APP, language = 'TypeScript') {
    return new CanonicalAST({
      project: {
        name: projectName,
        description: `${projectName} project`,
        type: projectType,
        riskLevel: RiskLevel.MEDIUM
      },
      stack: {
        language,
        frontend: [],
        backend: [],
        datastores: [],
        testing: []
      }
    });
  }
}

export default CanonicalAST;
