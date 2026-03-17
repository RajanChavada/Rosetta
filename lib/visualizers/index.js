import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { fileURLToPath } from 'url';
import { getTemplateString } from './template.js';
import { escapeJsonForScript, openBrowser, escapeHtml } from './utils.js';
import { loadManifest } from '../skills-manifest.js';
import { loadCatalog } from '../catalog.js';

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
 * Detects the current IDE using detectIdes from context.js
 */
async function detectCurrentIde() {
  try {
    const { detectIdes } = await import('../context.js');
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
 * Generates IDE tabs HTML
 */
function generateIdeTabsHtml(currentIde) {
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
 * Generates sidebar statistics HTML
 */
function generateSidebarStatsHtml(skills) {
  const installed = skills.filter(s => s.status === 'installed' || s.status === 'user-created').length;
  const catalog = skills.filter(s => s.status === 'catalog').length;
  const total = skills.length;
  const domains = [...new Set(skills.flatMap(s => s.domains))].length;

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
      <span class="stat-value">${domains}</span>
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
 * Main visualization function
 */
export async function generateVisualization(options = {}) {
  const {
    outputPath = path.join(process.cwd(), '.rosetta', 'docs', 'skills.html'),
    ideFilter = 'all',
    open = false,
    dryRun = false,
    json = false,
    quiet = false
  } = options;

  try {
    // Load data
    const manifest = await loadManifest();
    const catalog = await loadCatalog();

    // Detect current IDE if not using explicit filter
    const currentIde = await detectCurrentIde();
    const effectiveIdeFilter = ideFilter !== 'all' ? ideFilter : currentIde;

    // Transform skills
    const installedSkills = manifest.installed.map((skill, index) =>
      transformInstalledSkill(skill, index)
    );

    const catalogSkills = catalog.skills.map((skill, index) =>
      transformCatalogSkill(skill, index)
    );

    // Remove catalog skills that are already installed
    const installedNames = new Set(installedSkills.map(s => s.name.toLowerCase()));
    const uniqueCatalogSkills = catalogSkills.filter(s => !installedNames.has(s.name.toLowerCase()));

    const allSkills = [...installedSkills, ...uniqueCatalogSkills];

    // Prepare data for template
    const skillsData = prepareSkillsData(allSkills, effectiveIdeFilter);

    // Get template and styles
    const template = await getTemplateString();
    const styles = await fs.readFile(path.join(__dirname, 'styles.css'), 'utf8');

    // Apply replacements
    let html = template
      .split('{{TITLE}}').join('Rosetta Skills Documentation')
      .split('{{STYLES}}').join(escapeHtml(styles))
      .split('{{SIDEBAR_STATS}}').join(generateSidebarStatsHtml(allSkills))
      .split('{{IDE_TABS}}').join(generateIdeTabsHtml(effectiveIdeFilter))
      .split('{{CURRENT_IDE}}').join(escapeHtml(effectiveIdeFilter === 'all' ? 'Auto-detected' : effectiveIdeFilter))
      .split('{{SEARCH_BAR}}').join(generateSearchBarHtml())
      .split('{{SKILL_GRID}}').join(generateSkillGridHtml())
      .split('{{SKILLS_JSON}}').join(escapeJsonForScript(JSON.stringify(skillsData)));

    // Output
    if (json) {
      console.log(JSON.stringify({
        success: true,
        outputPath,
        currentIde: effectiveIdeFilter,
        skillsCount: allSkills.length,
        installedCount: installedSkills.length,
        catalogCount: uniqueCatalogSkills.length,
        skills: skillsData.skills
      }, null, 2));
      return;
    }

    if (dryRun) {
      console.log(chalk.cyan('\n[DRY RUN] Visualization generated successfully'));
      console.log(chalk.gray(`Would write to: ${outputPath}`));
      console.log(chalk.gray(`Total skills: ${allSkills.length}`));
      console.log(chalk.gray(`Installed: ${installedSkills.length}`));
      console.log(chalk.gray(`Catalog: ${uniqueCatalogSkills.length}`));
      console.log(chalk.gray(`IDE filter: ${effectiveIdeFilter === 'all' ? 'none (showing all)' : effectiveIdeFilter}`));
      return;
    }

    // Write file
    await fs.ensureDir(path.dirname(outputPath));
    await fs.writeFile(outputPath, html, 'utf8');

    if (!quiet) {
      console.log(chalk.green(`✓ Documentation generated: ${outputPath}`));
      console.log(chalk.gray(`  Total skills: ${allSkills.length} (${installedSkills.length} installed, ${uniqueCatalogSkills.length} available)`));
    }

    // Open browser if requested
    if (open) {
      openBrowser(outputPath);
    }

    return {
      success: true,
      outputPath,
      skillsCount: allSkills.length
    };

  } catch (err) {
    if (json || dryRun) {
      console.error(JSON.stringify({
        success: false,
        error: err.message,
        stack: err.stack
      }, null, 2));
      process.exit(1);
    }

    console.error(chalk.red(`Error generating documentation: ${err.message}`));
    if (err.stack) {
      console.error(chalk.gray(err.stack));
    }
    process.exit(1);
  }
}
