import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Catalog module for managing skill catalog data.
 * Provides loading, searching, filtering, and validation of catalog.json.
 */

/**
 * Default catalog file path (Rosetta's built-in catalog)
 */
const DEFAULT_CATALOG_PATH = path.join(__dirname, '..', 'catalog.json');

/**
 * Catalog schema definition for validation
 */
const CATALOG_SCHEMA = {
  version: 'string',
  skills: 'array'
};

/**
 * Skill schema definition for validation
 */
const SKILL_SCHEMA = {
  name: 'string',
  displayName: 'string',
  description: 'string',
  repoUrl: 'string',
  domains: 'array',
  tags: 'array',
  intentKeywords: 'array',
  author: 'string',
  stars: 'number',
  lastUpdated: 'string',
  provides: 'array',
  requires: 'array',
  enhances: 'array',
  icon: 'string',
  color: 'string'
};

/**
 * Validates that a value matches expected type
 * @param {*} value - Value to validate
 * @param {string} type - Expected type ('string', 'number', 'array', 'boolean')
 * @returns {boolean} True if valid
 */
function validateType(value, type) {
  if (value === null || value === undefined) {
    return false;
  }

  switch (type) {
    case 'string':
      return typeof value === 'string';
    case 'number':
      return typeof value === 'number' && !isNaN(value);
    case 'array':
      return Array.isArray(value);
    case 'boolean':
      return typeof value === 'boolean';
    default:
      return false;
  }
}

/**
 * Validates a skill object against the skill schema
 * @param {Object} skill - Skill object to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
function validateSkill(skill) {
  const errors = [];

  for (const [field, expectedType] of Object.entries(SKILL_SCHEMA)) {
    if (!skill.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    if (!validateType(skill[field], expectedType)) {
      errors.push(`Field '${field}' must be of type ${expectedType}, got ${typeof skill[field]}`);
    }
  }

  // Additional validations
  if (skill.name && typeof skill.name === 'string' && skill.name.trim().length === 0) {
    errors.push('Field "name" cannot be empty');
  }

  if (skill.displayName && typeof skill.displayName === 'string' && skill.displayName.trim().length === 0) {
    errors.push('Field "displayName" cannot be empty');
  }

  if (skill.description && typeof skill.description === 'string' && skill.description.trim().length === 0) {
    errors.push('Field "description" cannot be empty');
  }

  if (skill.repoUrl && typeof skill.repoUrl === 'string') {
    const urlPattern = /^https?:\/\/.+/;
    if (!urlPattern.test(skill.repoUrl)) {
      errors.push('Field "repoUrl" must be a valid HTTP/HTTPS URL');
    }
  }

  if (skill.stars && typeof skill.stars === 'number' && skill.stars < 0) {
    errors.push('Field "stars" must be a non-negative number');
  }

  if (skill.color && typeof skill.color === 'string') {
    const hexPattern = /^#[0-9A-Fa-f]{6}$/;
    if (!hexPattern.test(skill.color)) {
      errors.push('Field "color" must be a valid hex color (e.g., #FFFFFF)');
    }
  }

  if (skill.lastUpdated && typeof skill.lastUpdated === 'string') {
    const date = new Date(skill.lastUpdated);
    if (isNaN(date.getTime())) {
      errors.push('Field "lastUpdated" must be a valid ISO 8601 date string');
    }
  }

  // Validate arrays have correct content types
  if (skill.domains && Array.isArray(skill.domains)) {
    if (skill.domains.length === 0) {
      errors.push('Field "domains" must contain at least one domain');
    }
    skill.domains.forEach((domain, index) => {
      if (typeof domain !== 'string') {
        errors.push(`Field "domains[${index}]" must be a string`);
      }
    });
  }

  if (skill.tags && Array.isArray(skill.tags)) {
    skill.tags.forEach((tag, index) => {
      if (typeof tag !== 'string') {
        errors.push(`Field "tags[${index}]" must be a string`);
      }
    });
  }

  if (skill.intentKeywords && Array.isArray(skill.intentKeywords)) {
    if (skill.intentKeywords.length === 0) {
      errors.push('Field "intentKeywords" must contain at least one keyword');
    }
    skill.intentKeywords.forEach((keyword, index) => {
      if (typeof keyword !== 'string') {
        errors.push(`Field "intentKeywords[${index}]" must be a string`);
      }
    });
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates the catalog object against the catalog schema
 * @param {Object} catalog - Catalog object to validate
 * @returns {Object} Validation result { valid: boolean, errors: string[] }
 */
export function validateCatalog(catalog) {
  const errors = [];

  // Validate top-level fields
  for (const [field, expectedType] of Object.entries(CATALOG_SCHEMA)) {
    if (!catalog.hasOwnProperty(field)) {
      errors.push(`Missing required field: ${field}`);
      continue;
    }

    if (!validateType(catalog[field], expectedType)) {
      errors.push(`Field '${field}' must be of type ${expectedType}, got ${typeof catalog[field]}`);
    }
  }

  // Validate version format
  if (catalog.version && typeof catalog.version === 'string') {
    const versionPattern = /^\d+\.\d+\.\d+$/;
    if (!versionPattern.test(catalog.version)) {
      errors.push('Field "version" must be in semantic version format (e.g., 1.0.0)');
    }
  }

  // Validate skills array
  if (catalog.skills && Array.isArray(catalog.skills)) {
    if (catalog.skills.length === 0) {
      errors.push('Field "skills" must contain at least one skill');
    }

    catalog.skills.forEach((skill, index) => {
      if (typeof skill !== 'object' || skill === null) {
        errors.push(`Skill at index ${index} must be an object`);
        return;
      }

      const skillValidation = validateSkill(skill);
      if (!skillValidation.valid) {
        skillValidation.errors.forEach(err => {
          errors.push(`Skill[${index}]: ${err}`);
        });
      }
    });

    // Check for duplicate skill names
    const skillNames = catalog.skills.map(s => s.name);
    const duplicates = skillNames.filter((name, index) => skillNames.indexOf(name) !== index);
    if (duplicates.length > 0) {
      errors.push(`Duplicate skill names found: ${[...new Set(duplicates)].join(', ')}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Loads the catalog from the specified or default path
 * @param {string} catalogPath - Optional path to catalog.json file
 * @returns {Promise<Object>} Catalog object with skills array
 * @throws {Error} If file doesn't exist or is invalid
 */
export async function loadCatalog(catalogPath = DEFAULT_CATALOG_PATH) {
  try {
    const exists = await fs.pathExists(catalogPath);
    if (!exists) {
      return { version: '1.0.0', skills: [] };
    }

    const content = await fs.readJson(catalogPath);

    // Validate catalog structure
    const validation = validateCatalog(content);
    if (!validation.valid) {
      const errorMessages = validation.errors.map(err => `  - ${err}`).join('\n');
      throw new Error(`Catalog validation failed:\n${errorMessages}`);
    }

    return content;
  } catch (error) {
    if (error.message.includes('Catalog validation failed')) {
      throw error;
    }
    // For any other error (including file not found), return empty catalog
    return { version: '1.0.0', skills: [] };
  }
}

/**
 * Searches the catalog for skills matching the query
 * Searches across name, displayName, description, tags, and intentKeywords
 * @param {Object|string} query - Search query object or string
 * @param {Object} options - Search options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @param {boolean} options.caseSensitive - Whether search is case sensitive (default: false)
 * @param {number} options.limit - Maximum number of results to return (default: no limit)
 * @returns {Promise<Array>} Array of matching skills
 */
export async function searchCatalog(query, options = {}) {
  const {
    catalogPath = DEFAULT_CATALOG_PATH,
    caseSensitive = false,
    limit = Infinity
  } = options;

  const catalog = await loadCatalog(catalogPath);
  let skills = [...catalog.skills];

  // Handle string query
  if (typeof query === 'string') {
    const searchTerm = caseSensitive ? query : query.toLowerCase();

    skills = skills.filter(skill => {
      const name = caseSensitive ? skill.name : skill.name.toLowerCase();
      const displayName = caseSensitive ? skill.displayName : skill.displayName.toLowerCase();
      const description = caseSensitive ? skill.description : skill.description.toLowerCase();
      const tags = skill.tags.map(t => caseSensitive ? t : t.toLowerCase()).join(' ');
      const keywords = skill.intentKeywords.map(k => caseSensitive ? k : k.toLowerCase()).join(' ');

      return (
        name.includes(searchTerm) ||
        displayName.includes(searchTerm) ||
        description.includes(searchTerm) ||
        tags.includes(searchTerm) ||
        keywords.includes(searchTerm)
      );
    });
  }
  // Handle object query with filters
  else if (typeof query === 'object' && query !== null) {
    if (query.name) {
      const term = caseSensitive ? query.name : query.name.toLowerCase();
      skills = skills.filter(s => {
        const name = caseSensitive ? s.name : s.name.toLowerCase();
        return name.includes(term);
      });
    }

    if (query.displayName) {
      const term = caseSensitive ? query.displayName : query.displayName.toLowerCase();
      skills = skills.filter(s => {
        const displayName = caseSensitive ? s.displayName : s.displayName.toLowerCase();
        return displayName.includes(term);
      });
    }

    if (query.description) {
      const term = caseSensitive ? query.description : query.description.toLowerCase();
      skills = skills.filter(s => {
        const description = caseSensitive ? s.description : s.description.toLowerCase();
        return description.includes(term);
      });
    }

    if (query.tag) {
      const term = caseSensitive ? query.tag : query.tag.toLowerCase();
      skills = skills.filter(s =>
        s.tags.some(t => {
          const tag = caseSensitive ? t : t.toLowerCase();
          return tag.includes(term);
        })
      );
    }

    if (query.keyword) {
      const term = caseSensitive ? query.keyword : query.keyword.toLowerCase();
      skills = skills.filter(s =>
        s.intentKeywords.some(k => {
          const keyword = caseSensitive ? k : k.toLowerCase();
          return keyword.includes(term);
        })
      );
    }

    if (query.author) {
      const term = caseSensitive ? query.author : query.author.toLowerCase();
      skills = skills.filter(s => {
        const author = caseSensitive ? s.author : s.author.toLowerCase();
        return author.includes(term);
      });
    }

    if (query.minStars !== undefined) {
      skills = skills.filter(s => s.stars >= query.minStars);
    }

    if (query.maxStars !== undefined) {
      skills = skills.filter(s => s.stars <= query.maxStars);
    }

    if (query.updatedAfter) {
      const afterDate = new Date(query.updatedAfter);
      skills = skills.filter(s => new Date(s.lastUpdated) > afterDate);
    }

    if (query.updatedBefore) {
      const beforeDate = new Date(query.updatedBefore);
      skills = skills.filter(s => new Date(s.lastUpdated) < beforeDate);
    }
  }

  // Apply limit
  if (limit < skills.length) {
    skills = skills.slice(0, limit);
  }

  return skills;
}

/**
 * Filters catalog skills by domain(s)
 * @param {string|Array<string>} domains - Single domain or array of domains
 * @param {Object} options - Filter options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @param {boolean} options.matchAll - If true, skill must match ALL domains (default: false)
 * @returns {Promise<Array>} Array of skills matching the domain filter
 */
export async function filterByDomain(domains, options = {}) {
  const {
    catalogPath = DEFAULT_CATALOG_PATH,
    matchAll = false
  } = options;

  const catalog = await loadCatalog(catalogPath);
  const domainList = Array.isArray(domains) ? domains : [domains];
  const normalizedDomains = domainList.map(d => d.toLowerCase());

  return catalog.skills.filter(skill => {
    const skillDomains = skill.domains.map(d => d.toLowerCase());

    if (matchAll) {
      // Skill must have ALL specified domains
      return normalizedDomains.every(d => skillDomains.includes(d));
    } else {
      // Skill must have AT LEAST ONE of the specified domains
      return normalizedDomains.some(d => skillDomains.includes(d));
    }
  });
}

/**
 * Gets a skill by its repository URL
 * @param {string} url - Repository URL to search for
 * @param {Object} options - Search options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @returns {Promise<Object|undefined>} Skill object if found, undefined otherwise
 */
export async function getSkillByUrl(url, options = {}) {
  const { catalogPath = DEFAULT_CATALOG_PATH } = options;

  const catalog = await loadCatalog(catalogPath);

  return catalog.skills.find(skill => {
    // Exact match first
    if (skill.repoUrl === url) {
      return true;
    }

    // Case-insensitive match
    if (skill.repoUrl.toLowerCase() === url.toLowerCase()) {
      return true;
    }

    // Check if it's a prefix match (for different branches/refs)
    const skillUrlLower = skill.repoUrl.toLowerCase();
    const searchUrlLower = url.toLowerCase();

    // Remove trailing slashes for comparison
    const normalizedSkillUrl = skillUrlLower.replace(/\/$/, '');
    const normalizedSearchUrl = searchUrlLower.replace(/\/$/, '');

    // Check if one is a substring of the other (for URL variations)
    return (
      normalizedSkillUrl.includes(normalizedSearchUrl) ||
      normalizedSearchUrl.includes(normalizedSkillUrl)
    );
  });
}

/**
 * Gets a skill by its name
 * @param {string} name - Skill name to search for
 * @param {Object} options - Search options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @returns {Promise<Object|undefined>} Skill object if found, undefined otherwise
 */
export async function getSkillByName(name, options = {}) {
  const { catalogPath = DEFAULT_CATALOG_PATH } = options;

  const catalog = await loadCatalog(catalogPath);

  return catalog.skills.find(skill => skill.name === name);
}

/**
 * Gets all unique domains from the catalog
 * @param {Object} options - Options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @returns {Promise<Array<string>>} Array of unique domain names
 */
export async function getDomains(options = {}) {
  const { catalogPath = DEFAULT_CATALOG_PATH } = options;

  const catalog = await loadCatalog(catalogPath);
  const allDomains = catalog.skills.flatMap(skill => skill.domains);

  return [...new Set(allDomains)].sort();
}

/**
 * Gets all unique tags from the catalog
 * @param {Object} options - Options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @returns {Promise<Array<string>>} Array of unique tag names
 */
export async function getTags(options = {}) {
  const { catalogPath = DEFAULT_CATALOG_PATH } = options;

  const catalog = await loadCatalog(catalogPath);
  const allTags = catalog.skills.flatMap(skill => skill.tags);

  return [...new Set(allTags)].sort();
}

/**
 * Gets skills sorted by star count
 * @param {Object} options - Options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @param {string} options.order - 'asc' or 'desc' (default: 'desc')
 * @param {number} options.limit - Maximum number of skills to return (default: no limit)
 * @returns {Promise<Array>} Array of skills sorted by stars
 */
export async function getSkillsByStars(options = {}) {
  const {
    catalogPath = DEFAULT_CATALOG_PATH,
    order = 'desc',
    limit = Infinity
  } = options;

  const catalog = await loadCatalog(catalogPath);
  const sortedSkills = [...catalog.skills].sort((a, b) => {
    return order === 'desc' ? b.stars - a.stars : a.stars - b.stars;
  });

  return limit < sortedSkills.length ? sortedSkills.slice(0, limit) : sortedSkills;
}

/**
 * Gets skills that provide a specific capability
 * @param {string} capability - Capability to search for
 * @param {Object} options - Options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @returns {Promise<Array>} Array of skills that provide the capability
 */
export async function getSkillsByCapability(capability, options = {}) {
  const { catalogPath = DEFAULT_CATALOG_PATH } = options;

  const catalog = await loadCatalog(catalogPath);

  return catalog.skills.filter(skill =>
    skill.provides.some(p => p.toLowerCase().includes(capability.toLowerCase()))
  );
}

/**
 * Gets skills that require a specific dependency
 * @param {string} dependency - Dependency to search for
 * @param {Object} options - Options
 * @param {string} options.catalogPath - Path to catalog file (optional)
 * @returns {Promise<Array>} Array of skills that require the dependency
 */
export async function getSkillsByDependency(dependency, options = {}) {
  const { catalogPath = DEFAULT_CATALOG_PATH } = options;

  const catalog = await loadCatalog(catalogPath);

  return catalog.skills.filter(skill =>
    skill.requires.some(r => r.toLowerCase().includes(dependency.toLowerCase()))
  );
}

/**
 * Validates a catalog file without loading it
 * @param {string} catalogPath - Path to catalog file
 * @returns {Promise<Object>} Validation result { valid: boolean, errors: string[] }
 */
export async function validateCatalogFile(catalogPath = DEFAULT_CATALOG_PATH) {
  try {
    const exists = await fs.pathExists(catalogPath);
    if (!exists) {
      return {
        valid: false,
        errors: [`Catalog file not found at: ${catalogPath}`]
      };
    }

    const content = await fs.readJson(catalogPath);
    return validateCatalog(content);
  } catch (error) {
    return {
      valid: false,
      errors: [`Failed to read catalog file: ${error.message}`]
    };
  }
}
