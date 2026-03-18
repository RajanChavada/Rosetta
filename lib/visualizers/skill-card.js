import { escapeHtml } from './utils.js';

/**
 * Generates HTML for a status badge based on skill status
 *
 * @param {string} status - The skill status (installed, catalog, user-created, etc.)
 * @returns {string} - HTML for the status badge
 */
function getStatusBadge(status) {
  const normalized = status || 'unknown';
  const badgeClass = `status-badge status-${normalized}`;
  const label = normalized.charAt(0).toUpperCase() + normalized.slice(1);
  return `<span class="${badgeClass}">${escapeHtml(label)}</span>`;
}

/**
 * Generates HTML for IDE compatibility badges
 *
 * @param {Array<string>} ides - Array of IDE identifiers
 * @returns {string} - HTML for IDE badges
 */
function renderIdeBadges(ides) {
  if (!Array.isArray(ides) || ides.length === 0) {
    return '<span class="ide-badge">All IDEs</span>';
  }

  return ides.map(ide => {
    const label = ide.charAt(0).toUpperCase() + ide.slice(1).replace(/-/g, ' ');
    return `<span class="ide-badge">${escapeHtml(label)}</span>`;
  }).join('');
}

/**
 * Generates HTML for domain/tag badges
 *
 * @param {Array<string>} domains - Array of domain or tag strings
 * @returns {string} - HTML for domain badges
 */
function renderDomainTags(domains) {
  if (!Array.isArray(domains) || domains.length === 0) {
    return '<span class="domain-tag">None</span>';
  }

  return domains.map(domain => {
    return `<span class="domain-tag">${escapeHtml(domain)}</span>`;
  }).join('');
}

/**
 * Truncates description to a specified length with ellipsis
 *
 * @param {string} description - The full description
 * @param {number} maxLength - Maximum length before truncation
 * @returns {string} - Truncated or full description
 */
function truncateDescription(description, maxLength = 150) {
  if (!description) return '';
  if (description.length <= maxLength) return description;
  return description.slice(0, maxLength) + '...';
}

/**
 * Renders a skill card as HTML
 *
 * Card has two modes:
 * - Minimal (expanded=false): header, truncated description, IDE badges, domain tags
 * - Expanded (expanded=true): full description, provides/requires sections, tags cloud, repo link, toggle button
 *
 * @param {Object} skill - The skill object to render
 * @param {boolean} expanded - Whether to show expanded view
 * @returns {string} - HTML string for the skill card
 *
 * @example
 *   renderSkillCard({ id: 'node-api', name: 'Node API', ... }, false)
 *   // Returns: <div class="skill-card" data-id="node-api" ...>...</div>
 */
export function renderSkillCard(skill, expanded = false) {
  if (!skill || typeof skill !== 'object') {
    return '';
  }

  const {
    id = '',
    name = '',
    displayName,
    description = '',
    status = 'unknown',
    ideCompatibility = [],
    domains = [],
    tags = [],
    provides = [],
    requires = [],
    repoUrl = ''
  } = skill;

  const safeId = escapeHtml(id);
  const safeName = escapeHtml(displayName || name);
  const safeDescription = escapeHtml(description);
  const safeStatus = escapeHtml(status);
  const safeRepoUrl = escapeHtml(repoUrl);

  // Determine first IDE for data-ide attribute
  const firstIde = Array.isArray(ideCompatibility) && ideCompatibility.length > 0
    ? ideCompatibility[0]
    : 'all';
  const safeFirstIde = escapeHtml(firstIde);

  // Start card container
  let html = `<div class="skill-card" data-id="${safeId}" data-status="${safeStatus}" data-ide="${safeFirstIde}">`;

  // Header: name + status badge
  html += `<div class="card-header">
    <h3 class="skill-name">${safeName}</h3>
    ${getStatusBadge(status)}
  </div>`;

  // Description (truncated for minimal, full for expanded)
  const displayDescription = expanded ? safeDescription : truncateDescription(safeDescription);
  html += `<div class="description">${displayDescription}</div>`;

  // Metadata section (shown in minimal, hidden in expanded via CSS)
  html += `<div class="metadata">
    <div class="meta-section">
      <span class="meta-label">IDE:</span>
      ${renderIdeBadges(ideCompatibility)}
    </div>
    <div class="meta-section">
      <span class="meta-label">Domains:</span>
      ${renderDomainTags(domains)}
    </div>
  </div>`;

  // Expanded sections (only shown when expanded=true)
  if (expanded) {
    // Provides section
    if (Array.isArray(provides) && provides.length > 0) {
      html += `<div class="provides-section">
        <h4>Provides</h4>
        <ul>`;
      provides.forEach(provide => {
        html += `<li>${escapeHtml(provide)}</li>`;
      });
      html += `</ul>
      </div>`;
    }

    // Requires section
    if (Array.isArray(requires) && requires.length > 0) {
      html += `<div class="requires-section">
        <h4>Requires</h4>
        <ul>`;
      requires.forEach(require => {
        html += `<li>${escapeHtml(require)}</li>`;
      });
      html += `</ul>
      </div>`;
    }

    // Tags cloud
    if (Array.isArray(tags) && tags.length > 0) {
      html += `<div class="tags-section">
        <h4>Tags</h4>
        <div class="tags">`;
      tags.forEach(tag => {
        html += `<span class="tag">${escapeHtml(tag)}</span>`;
      });
      html += `</div>
      </div>`;
    }

    // Repository link
    if (repoUrl) {
      html += `<div class="repo-section">
        <a href="${safeRepoUrl}" target="_blank" rel="noopener noreferrer" class="repo-link">
          View Repository
        </a>
      </div>`;
    }

    // Toggle button
    html += `<button class="toggle-btn" onclick="toggleCard('${safeId}')">Show less</button>`;
  }

  html += `</div>`;

  return html;
}
