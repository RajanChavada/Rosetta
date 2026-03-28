import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { TARGETS } from './constants.js';

// Valid scopes for skills
const VALID_SCOPES = ['project', 'global'];

// Valid IDEs for skills
const VALID_IDES = ['multi-ide', ...TARGETS.map(t => t.label)];

// Fields that can be updated via updateSkillMetadata
const UPDATABLE_FIELDS = [
  'commit',
  'tag',
  'ancestry',
  'customizations',
  'upstream'
];

/**
 * Validates a manifest object against the schema.
 * @param {Object} manifest - The manifest to validate
 * @returns {Object} - { valid: boolean, errors: string[] }
 */
export function validateManifest(manifest) {
  const errors = [];

  if (manifest === null || manifest === undefined) {
    throw new Error('Manifest cannot be null or undefined');
  }

  // Check version
  if (manifest.version === undefined) {
    errors.push('Missing required field: version');
  } else if (manifest.version !== '1.0') {
    errors.push('Invalid version: must be "1.0"');
  }

  // Check installed array exists
  if (!Array.isArray(manifest.installed)) {
    errors.push('Missing required field: installed (must be an array)');
    return { valid: false, errors };
  }

  // Validate each skill
  manifest.installed.forEach((skill, index) => {
    const prefix = `Skill at index ${index} (${skill.name || 'unknown'})`;

    // Required fields checks
    const requiredFields = ['name', 'instanceId', 'source', 'commit', 'installedAt', 'scope', 'path', 'ide'];
    requiredFields.forEach(field => {
      if (!skill[field]) {
        errors.push(`${prefix}: Missing required field: ${field}`);
      }
    });

    // Type checks
    if (skill.name && typeof skill.name !== 'string') {
      errors.push(`${prefix}: name must be a string`);
    }

    if (skill.instanceId && typeof skill.instanceId !== 'string') {
      errors.push(`${prefix}: instanceId must be a string`);
    }

    if (skill.source && typeof skill.source !== 'string') {
      errors.push(`${prefix}: source must be a string`);
    }

    if (skill.commit && typeof skill.commit !== 'string') {
      errors.push(`${prefix}: commit must be a string`);
    }

    if (skill.installedAt && typeof skill.installedAt !== 'string') {
      errors.push(`${prefix}: installedAt must be a string (ISO date)`);
    } else if (skill.installedAt) {
      // Validate ISO date format
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
      if (!dateRegex.test(skill.installedAt)) {
        errors.push(`${prefix}: installedAt must be a valid ISO date string`);
      }
    }

    if (skill.scope && !VALID_SCOPES.includes(skill.scope)) {
      errors.push(`${prefix}: scope must be one of [${VALID_SCOPES.join(', ')}]`);
    }

    if (skill.ide && typeof skill.ide !== 'string') {
      errors.push(`${prefix}: ide must be a string`);
    }

    if (skill.ide && !VALID_IDES.includes(skill.ide)) {
      errors.push(`${prefix}: ide must be one of [${VALID_IDES.join(', ')}]`);
    }

    if (skill.path && typeof skill.path !== 'string') {
      errors.push(`${prefix}: path must be a string`);
    }

    if (skill.tag && typeof skill.tag !== 'string') {
      errors.push(`${prefix}: tag must be a string`);
    }

    // Validate ancestry structure
    if (skill.ancestry) {
      if (!skill.ancestry.forkedFrom || typeof skill.ancestry.forkedFrom !== 'string') {
        errors.push(`${prefix}: ancestry.forkedFrom must be a string`);
      }
      if (!skill.ancestry.forkedCommit || typeof skill.ancestry.forkedCommit !== 'string') {
        errors.push(`${prefix}: ancestry.forkedCommit must be a string`);
      }
      if (!skill.ancestry.forkReason || typeof skill.ancestry.forkReason !== 'string') {
        errors.push(`${prefix}: ancestry.forkReason must be a string`);
      }
      if (!skill.ancestry.parentInstanceId || typeof skill.ancestry.parentInstanceId !== 'string') {
        errors.push(`${prefix}: ancestry.parentInstanceId must be a string`);
      }
    }

    // Validate customizations array
    if (skill.customizations && !Array.isArray(skill.customizations)) {
      errors.push(`${prefix}: customizations must be an array`);
    }

    // Validate upstream structure
    if (skill.upstream) {
      if (skill.upstream.lastChecked) {
        if (typeof skill.upstream.lastChecked !== 'string') {
          errors.push(`${prefix}: upstream.lastChecked must be a string (ISO date)`);
        } else {
          // Validate ISO date format
          const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{3})?Z$/;
          if (!dateRegex.test(skill.upstream.lastChecked)) {
            errors.push(`${prefix}: upstream.lastChecked must be a valid ISO date string`);
          }
        }
      }
      if (skill.upstream.commitsBehind !== undefined && typeof skill.upstream.commitsBehind !== 'number') {
        errors.push(`${prefix}: upstream.commitsBehind must be a number`);
      }
      if (skill.upstream.remoteUrl && typeof skill.upstream.remoteUrl !== 'string') {
        errors.push(`${prefix}: upstream.remoteUrl must be a string`);
      }
    }
  });

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Generates a unique instance ID.
 * @returns {string} - A unique identifier
 */
function generateInstanceId() {
  return Math.random().toString(36).substring(2, 11) +
         Math.random().toString(36).substring(2, 11);
}

/**
 * Loads the manifest from disk.
 * @param {string} manifestPath - Path to manifest file (default: '.rosetta/skills/manifest.json')
 * @returns {Promise<Object>} - The validated manifest
 */
export async function loadManifest(manifestPath = '.rosetta/skills/manifest.json') {
  try {
    const exists = await fs.pathExists(manifestPath);

    if (!exists) {
      // Return default manifest if file doesn't exist
      return {
        version: '1.0',
        installed: []
      };
    }

    const manifest = await fs.readJson(manifestPath);
    const validation = validateManifest(manifest);

    if (!validation.valid) {
      const errorMsg = `Invalid manifest schema: ${validation.errors.join('; ')}`;
      throw new Error(errorMsg);
    }

    return manifest;
  } catch (err) {
    if (err.code === 'ENOENT') {
      // File doesn't exist, return default
      return {
        version: '1.0',
        installed: []
      };
    }
    throw err;
  }
}

/**
 * Saves the manifest to disk.
 * @param {Object} manifest - The manifest to save
 * @param {string} manifestPath - Path to save (default: '.rosetta/skills/manifest.json')
 * @returns {Promise<void>}
 */
export async function saveManifest(manifest, manifestPath = '.rosetta/skills/manifest.json') {
  const validation = validateManifest(manifest);

  if (!validation.valid) {
    throw new Error(`Cannot save invalid manifest: ${validation.errors.join('; ')}`);
  }

  // Ensure directory exists
  await fs.ensureDir(path.dirname(manifestPath));
  await fs.writeJson(manifestPath, manifest, { spaces: 2 });
}

/**
 * Adds a new skill to the manifest.
 * @param {Object} skillData - Skill data (name, source, commit, scope, path required)
 * @param {Object} manifest - Current manifest
 * @returns {Promise<Object>} - Updated manifest
 */
export async function addInstalledSkill(skillData, manifest) {
  // Validate required fields
  const required = ['name', 'source', 'commit', 'scope', 'path', 'ide'];
  for (const field of required) {
    if (!skillData[field]) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  if (!VALID_SCOPES.includes(skillData.scope)) {
    throw new Error(`Invalid scope: ${skillData.scope}. Must be one of [${VALID_SCOPES.join(', ')}]`);
  }

  // Validate IDE if specified (not multi-ide)
  if (skillData.ide && skillData.ide !== 'multi-ide') {
    if (!VALID_IDES.includes(skillData.ide)) {
      throw new Error(`Invalid IDE: ${skillData.ide}. Must be one of [${VALID_IDES.join(', ')}]`);
    }
  }

  // Check for duplicate by name (case-insensitive)
  const existingName = manifest.installed.find(
    s => s.name.toLowerCase() === skillData.name.toLowerCase()
  );
  if (existingName) {
    throw new Error(`Skill ${skillData.name} is already installed`);
  }

  // Check for duplicate instanceId if provided
  if (skillData.instanceId) {
    const existingId = manifest.installed.find(s => s.instanceId === skillData.instanceId);
    if (existingId) {
      throw new Error(`Instance ID ${skillData.instanceId} already exists`);
    }
  }

  // Build skill object
  const newSkill = {
    name: skillData.name,
    source: skillData.source,
    commit: skillData.commit,
    scope: skillData.scope,
    path: skillData.path,
    ide: skillData.ide || 'multi-ide',
    instanceId: skillData.instanceId || generateInstanceId(),
    installedAt: skillData.installedAt || new Date().toISOString()
  };

  // Optional fields
  if (skillData.tag) newSkill.tag = skillData.tag;
  if (skillData.ancestry) newSkill.ancestry = skillData.ancestry;
  if (skillData.customizations) newSkill.customizations = skillData.customizations;
  if (skillData.upstream) newSkill.upstream = skillData.upstream;

  const updatedManifest = {
    ...manifest,
    installed: [...manifest.installed, newSkill]
  };

  // Validate the updated manifest
  const validation = validateManifest(updatedManifest);
  if (!validation.valid) {
    throw new Error(`Failed to add skill: ${validation.errors.join('; ')}`);
  }

  return updatedManifest;
}

/**
 * Removes a skill from the manifest by name.
 * @param {string} skillName - Name of the skill to remove
 * @param {Object} manifest - Current manifest
 * @returns {Promise<Object>} - Updated manifest
 */
export async function removeInstalledSkill(skillName, manifest) {
  const nameLower = skillName.toLowerCase();
  const initialLength = manifest.installed.length;

  const updatedManifest = {
    ...manifest,
    installed: manifest.installed.filter(s => s.name.toLowerCase() !== nameLower)
  };

  if (updatedManifest.installed.length === initialLength) {
    // No skill was removed - log but don't throw
    console.log(chalk.yellow(`Warning: Skill "${skillName}" not found in manifest`));
  }

  // Validate the updated manifest
  const validation = validateManifest(updatedManifest);
  if (!validation.valid) {
    throw new Error(`Failed to remove skill: ${validation.errors.join('; ')}`);
  }

  return updatedManifest;
}

/**
 * Retrieves a skill by name.
 * @param {string} skillName - Name to search for
 * @param {Object} manifest - Current manifest
 * @returns {Object|undefined} - The skill object or undefined
 */
export function getSkillByName(skillName, manifest) {
  const nameLower = skillName.toLowerCase();
  return manifest.installed.find(s => s.name.toLowerCase() === nameLower);
}

/**
 * Retrieves all installed skills.
 * @param {Object} manifest - Current manifest
 * @returns {Array} - Array of skill objects
 */
export function getAllSkills(manifest) {
  return [...manifest.installed];
}

/**
 * Updates metadata for a skill.
 * @param {string} skillName - Name of the skill to update
 * @param {Object} updates - Fields to update
 * @param {Object} manifest - Current manifest
 * @param {Object} options - Options (replaceArrays: boolean)
 * @returns {Promise<Object>} - Updated manifest
 */
export async function updateSkillMetadata(skillName, updates, manifest, options = {}) {
  const { replaceArrays = false } = options;
  const nameLower = skillName.toLowerCase();

  // Find skill index
  const skillIndex = manifest.installed.findIndex(s => s.name.toLowerCase() === nameLower);
  if (skillIndex === -1) {
    // No skill found, return unchanged
    return manifest;
  }

  // Validate update fields
  const invalidFields = Object.keys(updates).filter(k => !UPDATABLE_FIELDS.includes(k) && k !== 'customizations');
  if (invalidFields.length > 0) {
    throw new Error(`Cannot update invalid fields: ${invalidFields.join(', ')}. Valid fields: ${UPDATABLE_FIELDS.join(', ')}`);
  }

  const updatedSkill = { ...manifest.installed[skillIndex] };

  // Apply updates
  for (const [key, value] of Object.entries(updates)) {
    if (key === 'customizations') {
      if (replaceArrays && Array.isArray(updatedSkill.customizations)) {
        updatedSkill.customizations = value;
      } else {
        updatedSkill.customizations = [...(updatedSkill.customizations || []), ...value];
      }
    } else if (key === 'ancestry' || key === 'upstream') {
      updatedSkill[key] = { ...updatedSkill[key], ...value };
    } else {
      updatedSkill[key] = value;
    }
  }

  const updatedInstalled = [...manifest.installed];
  updatedInstalled[skillIndex] = updatedSkill;

  const updatedManifest = {
    ...manifest,
    installed: updatedInstalled
  };

  // Validate the updated manifest
  const validation = validateManifest(updatedManifest);
  if (!validation.valid) {
    throw new Error(`Failed to update skill: ${validation.errors.join('; ')}`);
  }

  return updatedManifest;
}
