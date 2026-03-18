import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';
import { escapeJsonForScript, openBrowser, escapeHtml } from './utils.js';
import { loadManifest } from '../skills-manifest.js';
import { loadCatalog } from '../catalog.js';
import { detectIdes } from '../context.js';
import { TARGETS } from '../constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Load installed skills from .rosetta/skills/manifest.json
 * Returns array of skill objects with status='installed'
 *
 * @returns {Promise<Array>} - Array of transformed skill objects
 */
export async function loadInstalledSkills() {
  try {
    const manifest = await loadManifest();
    return manifest.installed.map(skill => ({
      ...skill,
      status: 'installed',
      id: skill.name.toLowerCase(),
      description: skill.description || '',
      domains: skill.domains || [],
      tags: skill.tags || [],
      provides: skill.provides || [],
      requires: skill.requires || [],
      ideCompatibility: skill.ideCompatibility || ['all'],
      repoUrl: skill.repoUrl || '',
      source: 'manifest'
    }));
  } catch (err) {
    // If manifest doesn't exist or is invalid, return empty array
    return [];
  }
}

/**
 * Parses a skill file (SKILL.md or *.skill.md) to extract frontmatter metadata
 * Supports JSON frontmatter between --- delimiters
 *
 * @param {string} filePath - Path to the skill file
 * @returns {Promise<Object>} - Parsed metadata object with standardized fields
 */
export async function parseSkillFile(filePath) {
  try {
    const content = await fs.readFile(filePath, 'utf8');

    // Find frontmatter between --- delimiters (first occurrence only)
    const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---/);
    const rawYaml = frontmatterMatch ? frontmatterMatch[1].trim() : null;

    if (!frontmatterMatch) {
      // No frontmatter found - derive name from directory
      const dirName = path.basename(path.dirname(filePath));
      return {
        name: dirName,
        description: 'User-created skill',
        rawYaml: null
      };
    }

    const frontmatterStr = frontmatterMatch[1].trim();

    try {
      const metadata = JSON.parse(frontmatterStr);

      return {
        name: metadata.name || path.basename(path.dirname(filePath)),
        description: metadata.description || '',
        domains: Array.isArray(metadata.domains) ? metadata.domains : [],
        tags: Array.isArray(metadata.tags) ? metadata.tags : [],
        provides: Array.isArray(metadata.provides) ? metadata.provides : [],
        requires: Array.isArray(metadata.requires) ? metadata.requires : [],
        repoUrl: metadata.repoUrl || '',
        rawYaml // Store raw YAML/JSON for display
      };
    } catch (parseErr) {
      // Malformed JSON - return fallback with raw content if possible
      const dirName = path.basename(path.dirname(filePath));
      return {
        name: dirName,
        description: 'User-created skill (malformed metadata)',
        rawYaml: frontmatterStr
      };
    }
  } catch (err) {
    // File read error - return fallback
    const dirName = path.basename(path.dirname(filePath));
    return {
      name: dirName,
      description: 'User-created skill',
      rawYaml: null
    };
  }
}

/**
 * Recursively scans a directory to find skill files (SKILL.md, skill.md, or *.skill.md)
 * Collects all skill files at any depth within the given root directory
 *
 * @param {string} rootDir - Root directory to scan recursively
 * @param {Array} allSkills - Accumulator array for found skills
 * @param {Function} parseSkillFile - Parsing function
 * @param {Function} deriveIdeCompatibility - IDE compatibility function
 * @param {number} depth - Current recursion depth (0 for top-level)
 * @returns {Promise<void>}
 */
async function scanDirectoryRecursive(rootDir, allSkills, parseSkillFile, deriveIdeCompatibility, depth = 0) {
  try {
    const entries = await fs.readdir(rootDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(rootDir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into subdirectory
        await scanDirectoryRecursive(fullPath, allSkills, parseSkillFile, deriveIdeCompatibility, depth + 1);
      } else if (entry.isFile()) {
        // Check if file is a skill file
        const fileName = entry.name;
        const isSkillFile = fileName === 'SKILL.md' ||
                           fileName === 'skill.md' ||
                           fileName.endsWith('.skill.md');

        if (isSkillFile) {
          // Determine skill ID based on location:
          // - If file is directly in the top-level skillsDir (depth 0 and fileDir === rootDir):
          //   * For SKILL.md/skill.md -> 'skill'
          //   * For *.skill.md -> filename without extension
          // - Otherwise (nested in any subdirectory): use the immediate parent directory name
          const fileDir = path.dirname(fullPath);
          const isTopLevelRootFile = depth === 0 && fileDir === rootDir;
          let skillId;

          if (isTopLevelRootFile) {
            if (fileName === 'SKILL.md' || fileName === 'skill.md') {
              skillId = 'skill';
            } else {
              skillId = fileName.replace(/\.skill\.md$/, '').toLowerCase();
            }
          } else {
            // File is in a subdirectory - use containing directory name
            skillId = path.basename(fileDir).toLowerCase();
          }

          try {
            const metadata = await parseSkillFile(fullPath);
            allSkills.push({
              ...metadata,
              status: 'user-created',
              id: skillId,
              source: 'user',
              path: fileDir,
              ideCompatibility: deriveIdeCompatibility(metadata.tags || [])
            });
          } catch (parseErr) {
            // Skip this file if parsing fails
            continue;
          }
        }
      }
    }
  } catch (err) {
    // Permission error or other issue - skip this directory
    // No logging to avoid noise for non-existent directories
  }
}

/**
 * Loads user-created skills from specified skills directories
 * Scans recursively for SKILL.md or *.skill.md files and parses their frontmatter
 * Automatically excludes templates/skills path to avoid including built-in templates
 *
 * @param {Array<string>} skillsDirs - Directories to scan (default: all IDE-specific skills dirs + common)
 * @returns {Promise<Array>} - Array of transformed user skill objects
 */
export async function loadUserSkills(skillsDirs = null) {
  // Build default list from TARGETS plus common directories
  if (skillsDirs === null) {
    const targetSkillsDirs = TARGETS.map(t => t.skillsDir).filter(dir => dir && !dir.includes('templates/skills'));
    skillsDirs = [...new Set([
      'skills',
      'company-skills',
      '.ai/skills', // Additional common location for AI agent skills
      ...targetSkillsDirs
    ])];
  }

  const allSkills = [];

  for (const dir of skillsDirs) {
    // Skip templates/skills path to avoid including Rosetta's built-in templates
    if (dir.includes('templates/skills') || dir === 'templates/skills') {
      continue;
    }

    try {
      // Check if directory exists
      const exists = await fs.pathExists(dir);
      if (!exists) {
        continue;
      }

      // Recursively scan the directory for skill files
      await scanDirectoryRecursive(dir, allSkills, parseSkillFile, deriveIdeCompatibility);
    } catch (dirErr) {
      // Permission error or other issue - skip this directory
      continue;
    }
  }

  return allSkills;
}

/**
 * Loads "Master Skill" style files (AGENTS.md, .cursorrules, etc.)
 * These files usually represent the overall agent logic for a workspace.
 *
 * @returns {Promise<Array>} - Array of skill objects from master files
 */
export async function loadMasterSkills() {
  const masterFiles = [
    'AGENTS.md',
    '.cursorrules',
    'CLAUDE.md',
    '.ai/master-skill.md',
    'openclaw/AGENTS.md',
    '.rosettablueprint/AGENTS.md'
  ];

  const masterSkills = [];

  for (const fileName of masterFiles) {
    try {
      const fullPath = path.resolve(process.cwd(), fileName);
      const exists = await fs.pathExists(fullPath);

      if (exists) {
        const metadata = await parseSkillFile(fullPath);
        // Specialized logic for master files
        masterSkills.push({
          ...metadata,
          status: 'installed',
          id: `master-${path.basename(fileName).replace(/^\./, '').replace(/\.md$/, '').toLowerCase()}`,
          displayName: `Master: ${fileName}`,
          source: 'master-file',
          ideCompatibility: deriveIdeCompatibility(metadata.tags || [])
        });
      }
    } catch (err) {
      continue;
    }
  }

  return masterSkills;
}

/**
 * Derives IDE compatibility from skill tags
 * Scans tags for known IDE keywords and returns array of matching IDE identifiers
 *
 * @param {Array<string>} tags - Array of tag strings
 * @returns {Array<string>} - Array of unique IDE identifiers, defaults to ['all']
 */
function deriveIdeCompatibility(tags) {
  if (!tags || tags.length === 0) {
    return ['all'];
  }

  const ideMapping = {
    // Distinct IDE identifiers (match template tabs)
    'vscode': 'vscode',
    'cursor': 'cursor',
    'codex': 'codex',
    'kilo-code': 'kilo-code',
    'continue': 'continue',
    'windsurf': 'windsurf',
    'openclaw': 'openclaw',
    // JetBrains umbrella
    'jetbrains': 'jetbrains',
    'intellij': 'jetbrains',
    'pycharm': 'jetbrains',
    // Claude Code
    'claude-code': 'claude-code',
    'anthropic': 'claude-code'
  };

  const ides = new Set();

  for (const tag of tags) {
    const normalizedTag = tag.toLowerCase();
    if (ideMapping[normalizedTag]) {
      ides.add(ideMapping[normalizedTag]);
    }
  }

  return ides.size > 0 ? [...ides] : ['all'];
}

/**
 * Loads catalog skills and transforms them to unified schema
 * Uses deriveIdeCompatibility() to compute ideCompatibility from tags
 *
 * @param {Object} catalog - Optional catalog object, loads from default if not provided
 * @returns {Promise<Array>} - Array of transformed catalog skill objects
 */
export async function loadCatalogSkills(catalog) {
  try {
    // Load catalog if not provided
    const catalogData = catalog || await loadCatalog();

    return catalogData.skills.map((skill, index) => {
      // Use transformCatalogSkill for consistent schema
      const transformed = transformCatalogSkill(skill, index);
      // Override ideCompatibility with derived from tags
      transformed.ideCompatibility = deriveIdeCompatibility(skill.tags || []);
      return transformed;
    });
  } catch (err) {
    // If catalog fails to load, return empty array
    return [];
  }
}

/**
 * Transforms a catalog skill into display format
 */
function transformCatalogSkill(skill, index) {
  return {
    id: skill.name.toLowerCase(),
    name: skill.name,
    displayName: skill.displayName, // undefined if not provided
    description: skill.description || '',
    status: 'catalog',
    ideCompatibility: ['claude-code', 'vscode', 'jetbrains', 'cursor', 'codex', 'kilo-code', 'continue', 'windsurf', 'openclaw'],
    domains: skill.domains || [],
    tags: skill.tags || [],
    repoUrl: skill.repoUrl, // undefined if not provided
    provides: skill.provides || [],
    requires: skill.requires || [],
    author: skill.author, // undefined if not provided
    stars: skill.stars || 0,
    lastUpdated: skill.lastUpdated, // undefined if not provided
    expanded: false,
    source: 'catalog'
  };
}

/**
 * Transforms an installed skill from manifest into display format
 */
function transformInstalledSkill(skill, index) {
  return {
    id: skill.instanceId || `installed-${index}`,
    name: skill.name,
    displayName: skill.name,
    description: `Installed at ${skill.path}`,
    status: skill.tag === 'user-created' ? 'user-created' : 'installed',
    ideCompatibility: ['claude-code', 'vscode', 'jetbrains', 'cursor', 'codex', 'kilo-code', 'continue', 'windsurf', 'openclaw'],
    domains: [],
    tags: skill.tag ? [skill.tag] : [],
    repoUrl: skill.source || null,
    provides: [],
    requires: [],
    scope: skill.scope,
    path: skill.path,
    installedAt: skill.installedAt,
    expanded: false
  };
}

/**
 * Detects the current IDE for filtering purposes (normalized ID)
 * Used internally by generateVisualization
 */
async function _detectCurrentIdeForFilter() {
  try {
    const ides = await detectIdes();

    if (ides.length > 0) {
      const nameToId = {
        'Claude Code': 'claude-code',
        'Cursor': 'cursor',
        'Codex CLI': 'codex',
        'GitHub Copilot': 'copilot',
        'Windsurf': 'windsurf',
        'OpenClaw': 'openclaw',
        'Antigravity': 'antigravity',
        'Generic': 'generic'
      };
      return nameToId[ides[0].name] || 'all';
    }
  } catch (err) {
    // Ignore detection errors
  }
  return 'all';
}

/**
 * Detects the current IDE (raw name) for display purposes
 * Returns the detected IDE name or 'auto-detected' if none found
 */
export async function detectCurrentIde() {
  try {
    const ides = await detectIdes();
    if (ides.length > 0) {
      return ides[0].name;
    }
  } catch (err) {
    // Ignore detection errors
  }
  return 'auto-detected';
}

/**
 * Merges skills from installed, catalog, and user sources with deduplication
 * Precedence: installed (3) > user-created (2) > catalog (1)
 * Deduping is case-insensitive on skill name
 *
 * @param {Array} installed - Installed skills
 * @param {Array} catalog - Catalog skills
 * @param {Array} user - User-created skills
 * @returns {Array} - Merged skill array
 */
export function mergeSkills(installed, catalog, user) {
  const skillMap = new Map();

  const addSkills = (skills, precedence) => {
    if (!Array.isArray(skills)) return;
    for (const skill of skills) {
      if (!skill || typeof skill !== 'object') continue;
      const key = (skill.name || '').toLowerCase();
      if (!key) continue;
      const existing = skillMap.get(key);
      if (!existing || precedence > existing._precedence) {
        skillMap.set(key, { ...skill, _precedence: precedence });
      }
    }
  };

  // Add in increasing precedence order so higher overwrites
  addSkills(catalog, 1);
  addSkills(user, 2);
  addSkills(installed, 3);

  const merged = [];
  for (const skill of skillMap.values()) {
    const { _precedence, ...cleanSkill } = skill;
    merged.push(cleanSkill);
  }

  return merged;
}

/**
 * Computes statistics for a skill set
 *
 * @param {Array} skills - Array of skill objects
 * @returns {Object} - Stats object with total, byStatus, byDomain, byIde
 */
export function computeStats(skills) {
  const total = skills.length;

  const byStatus = {};
  const byDomain = {};
  const byIde = {};

  for (const skill of skills) {
    // byStatus
    const status = skill.status || 'unknown';
    byStatus[status] = (byStatus[status] || 0) + 1;

    // byDomain
    if (Array.isArray(skill.domains)) {
      for (const domain of skill.domains) {
        if (domain) {
          byDomain[domain] = (byDomain[domain] || 0) + 1;
        }
      }
    }

    // byIde
    if (Array.isArray(skill.ideCompatibility)) {
      for (const ide of skill.ideCompatibility) {
        if (ide) {
          byIde[ide] = (byIde[ide] || 0) + 1;
        }
      }
    }
  }

  return { total, byStatus, byDomain, byIde };
}

/**
 * Gathers and processes all skill data for visualization
 * Accepts optional dependency functions for testing (defaults to real implementations)
 *
 * @param {Object} deps - Optional dependencies
 * @param {Function} deps.loadInstalledSkills - Loads installed skills
 * @param {Function} deps.loadCatalogSkills - Loads catalog skills
 * @param {Function} deps.loadUserSkills - Loads user-created skills
 * @param {Function} deps.loadMasterSkills - Loads master skills files
 * @param {Function} deps.detectCurrentIde - Detects current IDE
 * @returns {Promise<Object>} - { skills, stats, currentIde }
 */
export async function gatherData(deps = {}) {
  // Use dependency injection if provided, otherwise fall back to module defaults
  const _loadInstalledSkills = deps.loadInstalledSkills ?? loadInstalledSkills;
  const _loadCatalogSkills = deps.loadCatalogSkills ?? loadCatalogSkills;
  const _loadUserSkills = deps.loadUserSkills ?? loadUserSkills;
  const _loadMasterSkills = deps.loadMasterSkills ?? loadMasterSkills;
  const _detectCurrentIde = deps.detectCurrentIde ?? detectCurrentIde;

  const installed = await _loadInstalledSkills();
  const catalog = await _loadCatalogSkills();
  const user = await _loadUserSkills();
  const masters = await _loadMasterSkills();

  const merged = mergeSkills(installed, catalog, [...user, ...masters]);
  const stats = computeStats(merged);
  const currentIde = await _detectCurrentIde();

  return {
    skills: merged,
    stats,
    currentIde
  };
}

/**
 * Generates IDE tabs HTML
 */
export function renderIdeTabs(currentIde) {
  const ides = [
    { id: 'all', label: 'All IDEs' },
    { id: 'claude-code', label: 'Claude Code' },
    { id: 'vscode', label: 'VS Code' },
    { id: 'jetbrains', label: 'JetBrains' },
    { id: 'cursor', label: 'Cursor' },
    { id: 'codex', label: 'Codex CLI' },
    { id: 'kilo-code', label: 'Kilo Code' },
    { id: 'continue', label: 'Continue' },
    { id: 'windsurf', label: 'Windsurf' },
    { id: 'openclaw', label: 'OpenClaw' }
  ];

  return ides.map(ide => {
    const activeClass = ide.id === currentIde ? 'active' : '';
    const dataIde = ide.id === 'all' ? 'all' : ide.id;
    return `<button class="ide-tab ${activeClass}" data-ide="${dataIde}">${escapeHtml(ide.label)}</button>`;
  }).join('');
}

/**
 * Generates sidebar statistics HTML from stats object
 */
export function renderSidebarStats(stats) {
  const { total, byStatus, byDomain } = stats;
  const installed = (byStatus.installed || 0) + (byStatus['user-created'] || 0);
  const catalog = byStatus.catalog || 0;
  const domainCount = byDomain ? Object.keys(byDomain).length : 0;

  return `
    <div class="stat-item">
      <span class="stat-label">Total Skills</span>
      <span class="stat-value">${total}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Installed</span>
      <span class="stat-value">${installed}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Available</span>
      <span class="stat-value">${catalog}</span>
    </div>
    <div class="stat-item">
      <span class="stat-label">Domains</span>
      <span class="stat-value">${domainCount}</span>
    </div>
  `;
}

/**
 * Generates search bar HTML fragment
 */
function generateSearchBarHtml() {
  return `
    <input type="text" id="search-input" placeholder="Search skills by name, description, or tags..." />
    <span class="search-count" id="search-count">Loading...</span>
  `;
}

/**
 * Generates skill grid HTML (placeholder, JS renders)
 */
function generateSkillGridHtml() {
  return '<!-- Skills will be rendered by JavaScript -->';
}

/**
 * Prepares skills data for client-side rendering
 */
function prepareSkillsData(skills, ideFilter) {
  let filteredSkills = skills;
  if (ideFilter && ideFilter !== 'all') {
    filteredSkills = skills.filter(skill =>
      skill.ideCompatibility && skill.ideCompatibility.includes(ideFilter)
    );
  }
  return {
    count: filteredSkills.length,
    skills: filteredSkills
  };
}

/**
 * Generates client-side JavaScript for interactivity
 * This script provides search, filtering, and card expansion functionality
 *
 * @returns {string} JavaScript code as a string
 */
export function renderScript() {
  return `
    (function() {
      let currentIdeFilter = 'all';
      let searchQuery = '';
      let skills = typeof skillsData !== 'undefined' ? skillsData.skills : [];

      // Toggle card expansion
      function toggleCard(id) {
        const skill = skills.find(s => s.id === id);
        if (skill) {
          skill.expanded = !skill.expanded;
          renderGrid();
        }
      }

      // Filter skills based on IDE and search query
      function filterSkills() {
        return skills.filter(skill => {
          const ideMatch = currentIdeFilter === 'all' ||
                           (skill.ideCompatibility && skill.ideCompatibility.includes(currentIdeFilter));
          const searchMatch = searchQuery === '' ||
                              (skill.name && skill.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (skill.description && skill.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
                              (skill.tags && skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase())));
          return ideMatch && searchMatch;
        });
      }

      // Render the skill grid
      function renderGrid() {
        const filtered = filterSkills();
        const grid = document.getElementById('skill-grid');
        if (grid) {
          grid.innerHTML = filtered.map(skill => renderSkillCard(skill)).join('');
        }
        updateCounts(filtered.length);
        updateEmptyState(filtered.length);
      }

      // Render a single skill card
      function renderSkillCard(skill) {
        const expandedClass = skill.expanded ? 'expanded' : '';
        const statusBadge = getStatusBadge(skill.status);
        const ideBadges = (skill.ideCompatibility || []).map(ide => \`<span class="ide-badge">\${escapeHtml(ide)}</span>\`).join('');

        if (!skill.expanded) {
          return \`
            <div class="skill-card \${expandedClass}" data-id="\${skill.id}">
              <div class="card-header">
                <h3>\${escapeHtml(skill.displayName || skill.name)}</h3>
                \${statusBadge}
              </div>
              <p class="description">\${escapeHtml(truncate(skill.description || '', 120))}</p>
              <div class="metadata">
                \${ideBadges}
              </div>
            </div>
          \`;
        }

        // Expanded view
        return \`
          <div class="skill-card \${expandedClass}" data-id="\${skill.id}">
            <div class="card-header">
              <h3>\${escapeHtml(skill.displayName || skill.name)}</h3>
              \${statusBadge}
            </div>
            <div class="card-body">
              <p class="description">\${escapeHtml(skill.description || '')}</p>

              <section class="provides">
                <h4>Provides</h4>
                <ul>\${(skill.provides || []).map(p => \`<li>\${escapeHtml(p)}</li>\`).join('')}</ul>
              </section>

              <section class="requires">
                <h4>Requires</h4>
                <ul>\${(skill.requires || []).map(r => \`<li>\${escapeHtml(r)}</li>\`).join('')}</ul>
              </section>

              <div class="tags">
                \${(skill.tags || []).map(tag => \`<span class="tag">\${escapeHtml(tag)}</span>\`).join('')}
              </div>

              \${skill.repoUrl ? \`<a href="\${escapeHtml(skill.repoUrl)}" target="_blank" class="repo-link">View Repository →</a>\` : ''}

              \${skill.rawYaml ? \`
                <section class="raw-yaml">
                  <h4>Source Metadata</h4>
                  <pre><code>\${escapeHtml(skill.rawYaml)}</code></pre>
                </section>
              \` : ''}

              <button class="collapse-btn" onclick="toggleCard('\${skill.id}')">Show less</button>
            </div>
          </div>
        \`;
      }

      // Generate status badge HTML
      function getStatusBadge(status) {
        const labels = {
          'installed': 'Installed',
          'user-created': 'Custom',
          'catalog': 'Available'
        };
        const label = labels[status] || status;
        return \`<span class="badge badge-\${status}">\${escapeHtml(label)}</span>\`;
      }

      // Update the search count display
      function updateCounts(visibleCount) {
        const countEl = document.getElementById('search-count');
        if (countEl) {
          countEl.textContent = \`\${visibleCount} skill\${visibleCount !== 1 ? 's' : ''}\`;
        }
      }

      // Show/hide empty state
      function updateEmptyState(hasResults) {
        const emptyState = document.getElementById('empty-state');
        if (emptyState) {
          emptyState.style.display = hasResults ? 'none' : 'block';
        }
      }

      // HTML escape utility
      function escapeHtml(str) {
        if (str == null) return '';
        return String(str)
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;')
          .replace(/'/g, '&#039;');
      }

      // Truncate utility
      function truncate(str, len) {
        if (!str) return '';
        return str.length > len ? str.substring(0, len) + '...' : str;
      }

      // Render domain statistics
      function renderDomainStats() {
        const domainCounts = {};
        skills.forEach(skill => {
          (skill.domains || []).forEach(domain => {
            domainCounts[domain] = (domainCounts[domain] || 0) + 1;
          });
        });
        const domainList = document.getElementById('domain-list');
        if (domainList) {
          domainList.innerHTML = Object.entries(domainCounts)
            .sort((a, b) => b[1] - a[1])
            .map(([domain, count]) => \`<span class="domain-tag">\${escapeHtml(domain)} (\${count})</span>\`).join('');
        }
      }

      // Update IDE tabs active state
      function renderIdeTabs() {
        const tabs = document.querySelectorAll('.ide-tab');
        tabs.forEach(tab => {
          tab.classList.toggle('active', tab.dataset.ide === currentIdeFilter);
        });
        const currentIdeEl = document.getElementById('current-ide');
        if (currentIdeEl) {
          currentIdeEl.textContent = getCurrentIdeLabel();
        }
      }

      // Get human-readable IDE label
      function getCurrentIdeLabel() {
        if (currentIdeFilter === 'all') return 'auto-detected';
        const labels = {
          'vscode': 'VS Code',
          'jetbrains': 'JetBrains',
          'claude-code': 'Claude Code',
          'cursor': 'Cursor',
          'codex': 'Codex CLI',
          'kilo-code': 'Kilo Code',
          'continue': 'Continue',
          'windsurf': 'Windsurf',
          'openclaw': 'OpenClaw'
        };
        return labels[currentIdeFilter] || currentIdeFilter;
      }

      // Initialize on DOM load
      document.addEventListener('DOMContentLoaded', () => {
        renderGrid();
        renderDomainStats();
        renderIdeTabs();

        // Search input handler
        const searchInput = document.getElementById('search-input');
        if (searchInput) {
          searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderGrid();
          });
        }

        // IDE tab click handlers
        const ideTabs = document.querySelectorAll('.ide-tab');
        ideTabs.forEach(tab => {
          tab.addEventListener('click', () => {
            currentIdeFilter = tab.dataset.ide;
            renderIdeTabs();
            renderGrid();
          });
        });

        // Card click delegation
        const grid = document.getElementById('skill-grid');
        if (grid) {
          grid.addEventListener('click', (e) => {
            const card = e.target.closest('.skill-card');
            if (card) {
              const id = card.dataset.id;
              toggleCard(id);
            }
          });
        }

        // Escape key to collapse all
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Escape') {
            skills.forEach(s => s.expanded = false);
            renderGrid();
          }
        });
      });
    })();
  `;
}

/**
 * Renders the complete HTML page using template and styles
 * This is a modular composition function that assembles the final HTML
 *
 * @param {Object} data - Gathered data from gatherData(): { skills, stats, currentIde }
 * @param {string} template - HTML template string with placeholders
 * @param {string} styles - CSS styles string
 * @param {string} ideFilter - IDE filter ('all' or specific IDE ID)
 * @returns {string} - Complete HTML document
 */
export function renderHtml(data, template, styles, ideFilter = 'all') {
  const { skills, stats } = data;

  // We inject ALL skills into the HTML, client-side JS handles filtering
  const skillsData = {
    count: skills.length,
    skills: skills
  };

  // Generate HTML components
  const title = 'Rosetta Skills Documentation';
  const sidebarStats = renderSidebarStats(stats);
  const ideTabs = renderIdeTabs(ideFilter);
  const currentIdeDisplay = ideFilter === 'all' ? 'Auto-detected' : ideFilter;
  const searchBar = generateSearchBarHtml();
  const skillGrid = generateSkillGridHtml();
  const skillsJson = escapeJsonForScript(JSON.stringify(skillsData));
  const scriptContent = renderScript();

  // Assemble final HTML by replacing placeholders
  // Note: We do NOT escape styles as they are CSS, not HTML
  return template
    .replace(/{{TITLE}}/g, title)
    .replace(/{{STYLES}}/g, styles)
    .replace(/{{SIDEBAR_STATS}}/g, sidebarStats)
    .replace(/{{IDE_TABS}}/g, ideTabs)
    .replace(/{{CURRENT_IDE}}/g, escapeHtml(currentIdeDisplay))
    .replace(/{{SEARCH_BAR}}/g, searchBar)
    .replace(/{{SKILL_GRID}}/g, skillGrid)
    .replace(/{{SKILLS_JSON}}/g, skillsJson)
    .replace(/{{SCRIPT_CONTENT}}/g, scriptContent);
}
