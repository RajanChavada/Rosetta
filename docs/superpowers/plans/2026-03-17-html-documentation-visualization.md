# HTML Documentation Visualization Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement `rosetta docs` command that generates FastAPI-style standalone HTML documentation for skills.

**Architecture:** Template-based HTML generation with embedded CSS/JS. Data gathered from manifest.json, catalog.json, and user skill directories. Progressive disclosure UI with search and IDE filtering.

**Tech Stack:** Node.js ESM, fs-extra, chalk, commander. No external dependencies beyond existing Rosetta packages (add js-yaml for frontmatter parsing).

---

## File Structure

```
lib/
├── commands/
│   └── docs.js                 # Command handler (NEW)
├── visualizers/
│   ├── index.js               # Main gatherData() and renderHtml() (NEW)
│   ├── skill-card.js          # renderSkillCard() (NEW)
│   ├── utils.js               # escapeHtml, openBrowser, readTemplate (NEW)
│   ├── template.html          # HTML template (NEW)
│   └── styles.css             # Embedded CSS (NEW)
└── context.js                 # Modified: ensure detectIdes() returns simple array option

test/
├── fixtures/visualizer/
│   ├── manifest-installed.json
│   ├── manifest-empty.json
│   ├── catalog-small.json
│   ├── catalog-large.json
│   └── user-skills/
│       ├── my-backend-skill/
│       │   └── SKILL.md
│       └── my-frontend-skill/
│           └── skill.md
├── visualizers/
│   ├── index.unit.test.js
│   ├── skill-card.unit.test.js
│   └── integration.test.js
└── commands/
    └── docs.integration.test.js

docs/
├── VISUALIZATION.md           # User documentation (NEW)
└── superpowers/specs/         # Already created
```

---

## Chunk 1: Foundation - Utilities and Template

### Task 1-1: Create Visualizer Utilities

**Files:**
- Create: `lib/visualizers/utils.js`
- Test: `test/visualizers/utils.unit.test.js`

**Dependencies:** None

- [ ] **Step 1: Write failing tests for utils.js**

```javascript
import { escapeHtml, openBrowser, readTemplate } from '../lib/visualizers/utils.js';

describe('visualizers/utils', () => {
  describe('escapeHtml', () => {
    it('escapes HTML special characters', () => {
      expect(escapeHtml('<script>alert("xss")</script>')).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
      expect(escapeHtml('a & b')).toBe('a &amp; b');
      expect(escapeHtml('"quotes"')).toBe('&quot;quotes&quot;');
    });

    it('handles null/undefined gracefully', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
    });
  });

  describe('readTemplate', () => {
    it('reads template file and returns string', async () => {
      // We'll mock fs-read later in integration; unit test just verifies function exists
      expect(typeof readTemplate).toBe('function');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/visualizers/utils.unit.test.js`
Expected: FAIL - "Cannot find module '../lib/visualizers/utils.js'"

- [ ] **Step 3: Implement escapeHtml() function**

Create `lib/visualizers/utils.js`:

```javascript
/**
 * Escape HTML special characters to prevent XSS
 */
export function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Escape JSON for safe embedding in <script> tag
 */
export function escapeJsonForScript(jsonString) {
  return jsonString
    .replace(/</g, '\\u003c')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029');
}

/**
 * Read HTML template file from disk
 */
export async function readTemplate(templatePath) {
  const fs = await import('fs-extra');
  return await fs.readFile(templatePath, 'utf-8');
}

/**
 * Open file in default browser (cross-platform)
 */
export async function openBrowser(filePath) {
  const fs = await import('fs-extra');
  const path = await import('path');
  const { execSync } = await import('child_process');

  const absolutePath = path.resolve(filePath);
  const url = `file://${absolutePath}`;

  try {
    switch (process.platform) {
      case 'darwin':
        execSync(`open "${url}"`);
        break;
      case 'win32':
        execSync(`start "${url}"`);
        break;
      default:
        execSync(`xdg-open "${url}"`);
    }
  } catch (err) {
    console.error('Failed to open browser:', err.message);
  }
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/visualizers/utils.unit.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/visualizers/utils.js test/visualizers/utils.unit.test.js
git commit -m "feat(visualizers): add escapeHtml, openBrowser, readTemplate utilities"
```

---

### Task 1-2: Create HTML Template and CSS

**Files:**
- Create: `lib/visualizers/template.html`
- Create: `lib/visualizers/styles.css`
- Test: `test/visualizers/template.test.js` (snapshot)

- [ ] **Step 1: Write test verifying template structure**

```javascript
import { readTemplate } from '../lib/visualizers/utils.js';

describe('template.html', () => {
  it('contains required placeholders', async () => {
    const template = await readTemplate('lib/visualizers/template.html');
    expect(template).toContain('{{TITLE}}');
    expect(template).toContain('{{STYLES}}');
    expect(template).toContain('{{SIDEBAR_STATS}}');
    expect(template).toContain('{{IDE_TABS}}');
    expect(template).toContain('{{SEARCH_BAR}}');
    expect(template).toContain('{{SKILL_GRID}}');
    expect(template).toContain('{{CURRENT_IDE}}');
    expect(template).toContain('<script>');
    expect(template).toContain('const skillsData = {{SKILLS_JSON}};');
  });
});
```

- [ ] **Step 2: Run test to fail**

Run: `npm test -- test/visualizers/template.test.js`
Expected: FAIL - file not found

- [ ] **Step 3: Create template.html structure**

Create `lib/visualizers/template.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>
{{STYLES}}
  </style>
</head>
<body>
  <div class="container">
    <header class="header">
      <h1>Rosetta Skills</h1>
      <p class="subtitle">Explore your AI agent skill library</p>
    </header>

    <div class="layout">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="stats-section">
          <h3>Statistics</h3>
          <div class="stat-item">
            <span class="stat-label">Total Skills</span>
            <span class="stat-value" id="total-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Installed</span>
            <span class="stat-value" id="installed-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Custom</span>
            <span class="stat-value" id="user-created-count">0</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Available</span>
            <span class="stat-value" id="catalog-count">0</span>
          </div>
        </div>

        <div class="ide-filters">
          <h3>IDE Compatibility</h3>
          <div class="ide-tabs">
            <button class="ide-tab active" data-ide="all">All</button>
            <button class="ide-tab" data-ide="vscode">VS Code</button>
            <button class="ide-tab" data-ide="jetbrains">JetBrains</button>
            <button class="ide-tab" data-ide="claude-code">Claude Code</button>
          </div>
          <p class="tab-hint">Current IDE: <strong id="current-ide">{{CURRENT_IDE}}</strong></p>
        </div>

        <div class="domain-stats" id="domain-list">
          <h3>Domains</h3>
          <!-- Dynamically populated -->
        </div>
      </aside>

      <!-- Main Content -->
      <main class="content">
        <div class="search-bar">
          <input type="text" id="search-input" placeholder="Search skills by name, description, or tags...">
          <span class="search-count" id="search-count"></span>
        </div>

        <div class="skill-grid" id="skill-grid">
          <!-- Skill cards injected here -->
        </div>

        <div class="empty-state" id="empty-state" style="display: none;">
          <p>No skills match your search.</p>
        </div>
      </main>
    </div>
  </div>

  <script>
    const skillsData = {{SKILLS_JSON}};
{{SCRIPT_CONTENT}}
  </script>
</body>
</html>
```

- [ ] **Step 4: Create styles.css (FastAPI-inspired)**

Create `lib/visualizers/styles.css`:

```css
/* Reset & Base */
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
  line-height: 1.6;
  color: #333;
  background: #f8f9fa;
}

.container { max-width: 1400px; margin: 0 auto; padding: 0 1rem; }

/* Header */
.header { padding: 2rem 0; border-bottom: 1px solid #e9ecef; margin-bottom: 1.5rem; }
.header h1 { font-size: 2rem; font-weight: 600; color: #212529; margin-bottom: 0.25rem; }
.subtitle { color: #6c757d; font-size: 1rem; }

/* Layout */
.layout { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; margin-bottom: 2rem; }

/* Sidebar */
.sidebar { position: sticky; top: 1rem; height: fit-content; }
.stats-section, .ide-filters, .domain-stats {
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 1rem;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.stats-section h3, .ide-filters h3, .domain-stats h3 {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: #495057;
  margin-bottom: 0.75rem;
  letter-spacing: 0.05em;
}
.stat-item {
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  border-bottom: 1px solid #f1f3f4;
}
.stat-item:last-child { border-bottom: none; }
.stat-label { color: #6c757d; font-size: 0.875rem; }
.stat-value { font-weight: 600; color: #212529; }

/* IDE Tabs */
.ide-tabs { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 0.75rem; }
.ide-tab {
  padding: 0.375rem 0.75rem;
  border: 1px solid #dee2e6;
  background: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  transition: all 0.15s ease;
}
.ide-tab:hover { border-color: #339AF0; color: #339AF0; }
.ide-tab.active {
  background: #339AF0;
  color: white;
  border-color: #339AF0;
}
.tab-hint { font-size: 0.75rem; color: #6c757d; margin-top: 0.5rem; }

/* Domain Stats */
.domain-stats ul { list-style: none; }
.domain-stats li {
  display: flex;
  justify-content: space-between;
  padding: 0.375rem 0;
  font-size: 0.875rem;
}
.domain-stats .domain-tag {
  background: #e9ecef;
  padding: 0.125rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  color: #495057;
}

/* Search Bar */
.search-bar {
  margin-bottom: 1.5rem;
  position: relative;
}
.search-bar input {
  width: 100%;
  max-width: 500px;
  padding: 0.75rem 1rem;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 1rem;
  transition: border-color 0.15s ease;
}
.search-bar input:focus {
  outline: none;
  border-color: #339AF0;
  box-shadow: 0 0 0 3px rgba(51, 154, 240, 0.15);
}
.search-count {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  color: #6c757d;
  font-size: 0.875rem;
}

/* Skill Grid */
.skill-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

/* Skill Card */
.skill-card {
  background: white;
  border: 1px solid #e9ecef;
  border-radius: 4px;
  padding: 1.25rem;
  cursor: pointer;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
  box-shadow: 0 1px 3px rgba(0,0,0,0.05);
}
.skill-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
}
.skill-card.expanded {
  grid-column: span 2;
  border-color: #339AF0;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 0.75rem;
}
.card-header h3 {
  font-size: 1.125rem;
  font-weight: 600;
  color: #212529;
  margin: 0;
}
.badge {
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
  font-weight: 500;
  white-space: nowrap;
}
.badge-installed { background: #d3f9d8; color: #2b8a3e; }
.badge-user { background: #d0ebff; color: #1971c2; }
.badge-catalog { background: #e9ecef; color: #495057; }
.description {
  color: #495057;
  font-size: 0.875rem;
  margin-bottom: 0.75rem;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
.metadata { display: flex; flex-wrap: wrap; gap: 0.5rem; }
.ide-badge, .domain-tag {
  padding: 0.25rem 0.5rem;
  background: #f1f3f4;
  border-radius: 3px;
  font-size: 0.75rem;
  color: #495057;
}

/* Expanded Card */
.skill-card.expanded .description {
  -webkit-line-clamp: unset;
  display: block;
}
.card-body section {
  margin: 1rem 0;
  padding-top: 1rem;
  border-top: 1px solid #e9ecef;
}
.card-body h4 {
  font-size: 0.875rem;
  text-transform: uppercase;
  color: #495057;
  margin-bottom: 0.5rem;
  letter-spacing: 0.05em;
}
.card-body ul { list-style: disc; padding-left: 1.25rem; color: #495057; }
.card-body li { margin-bottom: 0.25rem; font-size: 0.875rem; }
.tags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 1rem 0; }
.tag {
  background: #e7f5ff;
  color: #1971c2;
  padding: 0.25rem 0.5rem;
  border-radius: 3px;
  font-size: 0.75rem;
}
.repo-link {
  display: inline-block;
  margin-top: 0.75rem;
  color: #339AF0;
  text-decoration: none;
  font-weight: 500;
  font-size: 0.875rem;
}
.repo-link:hover { text-decoration: underline; }
.collapse-btn {
  margin-top: 1rem;
  padding: 0.5rem 1rem;
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.875rem;
}
.collapse-btn:hover { background: #e9ecef; }

/* Empty State */
.empty-state {
  text-align: center;
  padding: 3rem;
  color: #6c757d;
}

/* Responsive */
@media (max-width: 768px) {
  .layout { grid-template-columns: 1fr; }
  .sidebar { position: static; margin-bottom: 1.5rem; }
  .ide-tabs { justify-content: center; }
  .skill-card.expanded { grid-column: span 1; }
}
```

- [ ] **Step 5: Run template test - should PASS**

Run: `npm test -- test/visualizers/template.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/visualizers/template.html lib/visualizers/styles.css test/visualizers/template.test.js
git commit -m "feat(visualizers): add HTML template and FastAPI-inspired CSS"
```

---

## Chunk 2: Data Gathering - Merging Skills

### Task 2-1: Implement gatherData() - Load Installed Skills

**Files:**
- Modify: `lib/visualizers/index.js` (create new file)
- Test: `test/visualizers/index.unit.test.js`

**Dependencies:** `lib/skills-manifest.js` (loadManifest)

- [ ] **Step 1: Write failing test for loadInstalledSkills()**

```javascript
import { loadInstalledSkills } from '../lib/visualizers/index.js';

describe('visualizers/index - loadInstalledSkills', () => {
  it('loads installed skills from manifest', async () => {
    // Mock loadManifest to return test data
    const mockManifest = {
      version: '1.0',
      installed: [
        {
          name: 'node-express-postgres',
          source: 'catalog',
          commit: 'abc123',
          installedAt: '2026-03-15T10:30:00.000Z',
          path: '.rosetta/skills/node-express-postgres'
        }
      ]
    };
    // We'll mock loadManifest in jest in next steps
    const skills = await loadInstalledSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills[0]).toHaveProperty('status', 'installed');
  });

  it('handles missing manifest gracefully', async () => {
    const skills = await loadInstalledSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });
});
```

- [ ] **Step 2: Run test to fail**

Run: `npm test -- test/visualizers/index.unit.test.js`
Expected: FAIL - "Cannot find module '../lib/visualizers/index.js'"

- [ ] **Step 3: Create lib/visualizers/index.js with loadInstalledSkills()**

```javascript
import { loadManifest } from '../../lib/skills-manifest.js';

/**
 * Load installed skills from .rosetta/skills/manifest.json
 * Returns array of skill objects with status='installed'
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
```

- [ ] **Step 4: Run test - should pass (with mocking)**

We need to mock loadManifest. Update test:

```javascript
jest.mock('../../lib/skills-manifest.js', () => ({
  loadManifest: jest.fn()
}));

import { loadInstalledSkills } from '../lib/visualizers/index.js';
import { loadManifest } from '../../lib/skills-manifest.js';

describe('visualizers/index - loadInstalledSkills', () => {
  beforeEach(() => {
    loadManifest.mockReset();
  });

  it('loads installed skills from manifest', async () => {
    const mockManifest = {
      version: '1.0',
      installed: [
        {
          name: 'node-express-postgres',
          source: 'catalog',
          commit: 'abc123',
          installedAt: '2026-03-15T10:30:00.000Z',
          path: '.rosetta/skills/node-express-postgres'
        }
      ]
    };
    loadManifest.mockResolvedValue(mockManifest);

    const skills = await loadInstalledSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills[0]).toHaveProperty('status', 'installed');
    expect(skills[0]).toHaveProperty('name', 'node-express-postgres');
  });

  it('handles missing manifest gracefully', async () => {
    loadManifest.mockRejectedValue(new Error('Manifest not found'));

    const skills = await loadInstalledSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });
});
```

- [ ] **Step 5: Run tests - PASS**

Run: `npm test -- test/visualizers/index.unit.test.js`
Expected: PASS

- [ ] **Step 6: Commit**

```bash
git add lib/visualizers/index.js test/visualizers/index.unit.test.js
git commit -m "feat(visualizers): add loadInstalledSkills() function"
```

---

### Task 2-2: Load Catalog Skills

**Files:**
- Modify: `lib/visualizers/index.js`
- Test: `test/visualizers/index.unit.test.js` (add tests)

- [ ] **Step 1: Write failing test for loadCatalogSkills()**

```javascript
import { loadCatalogSkills } from '../lib/visualizers/index.js';

describe('visualizers/index - loadCatalogSkills', () => {
  it('loads catalog skills and derives ideCompatibility', async () => {
    const mockCatalog = {
      version: '1.0.0',
      updated: '2026-03-15',
      skills: [
        {
          name: 'react-redux-firebase',
          displayName: 'React Redux Firebase',
          description: 'React frontend with Redux...',
          repoUrl: 'https://github.com/rosetta-ai/react-redux-firebase',
          domains: ['frontend', 'spa'],
          tags: ['react', 'redux', 'firebase', 'vscode']
        }
      ]
    };
    // Mock loadCatalog
    const skills = await loadCatalogSkills(mockCatalog);
    expect(skills[0]).toHaveProperty('status', 'catalog');
    expect(skills[0].ideCompatibility).toContain('vscode');
  });
});
```

- [ ] **Step 2: Implement loadCatalogSkills()**

Add to `lib/visualizers/index.js`:

```javascript
import { loadCatalog as loadRawCatalog } from '../../lib/catalog.js';

/**
 * Derive IDE compatibility from tags
 */
function deriveIdeCompatibility(tags = []) {
  const ideCompatibility = new Set();

  tags.forEach(tag => {
    const lowerTag = tag.toLowerCase();
    if (['vscode', 'cursor', 'windsurf', 'code', 'visual studio'].some(ide => lowerTag.includes(ide))) {
      ideCompatibility.add('vscode');
    }
    if (['jetbrains', 'intellij', 'pycharm', 'idea', 'webstorm'].some(ide => lowerTag.includes(ide))) {
      ideCompatibility.add('jetbrains');
    }
    if (['claude', 'claude-code', 'anthropic'].some(ide => lowerTag.includes(ide))) {
      ideCompatibility.add('claude-code');
    }
  });

  return ideCompatibility.size > 0 ? Array.from(ideCompatibility) : ['all'];
}

/**
 * Load catalog skills from catalog.json
 * Returns array of skill objects with status='catalog'
 */
export async function loadCatalogSkills(catalog = null) {
  try {
    const rawCatalog = catalog || await loadRawCatalog();
    return rawCatalog.skills.map(skill => ({
      ...skill,
      status: 'catalog',
      id: skill.name.toLowerCase(),
      provides: skill.provides || [],
      requires: skill.requires || [],
      ideCompatibility: deriveIdeCompatibility(skill.tags),
      source: 'catalog'
    }));
  } catch (err) {
    return [];
  }
}
```

- [ ] **Step 3: Run and update test with mock**

```javascript
jest.mock('../../lib/catalog.js', () => ({
  loadCatalog: jest.fn()
}));

import { loadCatalogSkills } from '../lib/visualizers/index.js';
import { loadCatalog } from '../../lib/catalog.js';

describe('visualizers/index - loadCatalogSkills', () => {
  beforeEach(() => {
    loadCatalog.mockReset();
  });

  it('loads catalog skills and derives ideCompatibility', async () => {
    const mockCatalog = {
      version: '1.0.0',
      updated: '2026-03-15',
      skills: [
        {
          name: 'react-redux-firebase',
          displayName: 'React Redux Firebase',
          description: 'React frontend with Redux...',
          domains: ['frontend', 'spa'],
          tags: ['react', 'redux', 'firebase', 'vscode']
        }
      ]
    };
    loadCatalog.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();
    expect(skills[0]).toHaveProperty('status', 'catalog');
    expect(skills[0].ideCompatibility).toContain('vscode');
  });

  it('handles empty catalog', async () => {
    loadCatalog.mockResolvedValue({ skills: [] });
    const skills = await loadCatalogSkills();
    expect(skills).toEqual([]);
  });
});
```

- [ ] **Step 4: Run tests - PASS**

Run: `npm test -- test/visualizers/index.unit.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/visualizers/index.js test/visualizers/index.unit.test.js
git commit -m "feat(visualizers): add loadCatalogSkills() with IDE derivation"
```

---

### Task 2-3: Load User-Created Skills

**Files:**
- Modify: `lib/visualizers/index.js`
- Test: `test/visualizers/index.unit.test.js`

- [ ] **Step 1: Write failing test for loadUserSkills()**

```javascript
import { loadUserSkills } from '../lib/visualizers/index.js';

describe('visualizers/index - loadUserSkills', () => {
  it('scans skills directories and loads SKILL.md files', async () => {
    // Mock fs to return directory structure
    const skills = await loadUserSkills();
    expect(Array.isArray(skills)).toBe(true);
    expect(skills[0]).toHaveProperty('status', 'user-created');
  });
});
```

- [ ] **Step 2: Implement loadUserSkills()**

Add to `lib/visualizers/index.js`:

```javascript
import fs from 'fs-extra';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Parse frontmatter from SKILL.md file
 * Supports YAML (--- delimited) or JSON frontmatter
 */
async function parseSkillFile(filePath) {
  const content = await fs.readFile(filePath, 'utf-8');
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n/);

  if (!frontmatterMatch) {
    // No frontmatter, return minimal skill
    const name = path.basename(path.dirname(filePath));
    return {
      name,
      description: `User-created skill: ${name}`,
      tags: [],
      domains: [],
      provides: [],
      requires: [],
      repoUrl: ''
    };
  }

  const frontmatter = frontmatterMatch[1];
  // Try JSON first, then YAML (for now simple JSON parse; YAML can be added with js-yaml later)
  try {
    const metadata = JSON.parse(frontmatter);
    return {
      name: metadata.name || path.basename(path.dirname(filePath)),
      description: metadata.description || '',
      tags: metadata.tags || [],
      domains: metadata.domains || [],
      provides: metadata.provides || [],
      requires: metadata.requires || [],
      repoUrl: metadata.repoUrl || ''
    };
  } catch {
    // If not JSON, return minimal (YAML support can be added as enhancement)
    return {
      name: path.basename(path.dirname(filePath)),
      description: 'User-created skill (no valid frontmatter)',
      tags: [],
      domains: [],
      provides: [],
      requires: [],
      repoUrl: ''
    };
  }
}

/**
 * Scan directories for skill files
 */
export async function loadUserSkills(skillsDirs = ['skills', 'company-skills']) {
  const skills = [];

  for (const dir of skillsDirs) {
    const dirPath = path.resolve(process.cwd(), dir);
    try {
      const exists = await fs.pathExists(dirPath);
      if (!exists) continue;

      const entries = await fs.readdir(dirPath, { withFileTypes: true });

      for (const entry of entries) {
        if (entry.isDirectory()) {
          const skillPath = path.join(dirPath, entry.name, 'SKILL.md');
          const altSkillPath = path.join(dirPath, entry.name, 'skill.md');

          let skillFile = null;
          if (await fs.pathExists(skillPath)) {
            skillFile = skillPath;
          } else if (await fs.pathExists(altSkillPath)) {
            skillFile = altSkillPath;
          }

          if (skillFile) {
            const skill = await parseSkillFile(skillFile);
            skills.push({
              ...skill,
              status: 'user-created',
              id: entry.name.toLowerCase(),
              source: 'user',
              ideCompatibility: deriveIdeCompatibility(skill.tags)
            });
          }
        } else if (entry.name.endsWith('.skill.md') || entry.name === 'SKILL.md') {
          // Direct file in skills dir
          const skillFile = path.join(dirPath, entry.name);
          const skill = await parseSkillFile(skillFile);
          const skillName = path.basename(entry.name, '.md').replace('.skill', '');
          skills.push({
            ...skill,
            name: skillName,
            status: 'user-created',
            id: skillName.toLowerCase(),
            source: 'user',
            ideCompatibility: deriveIdeCompatibility(skill.tags)
          });
        }
      }
    } catch (err) {
      // Skip directory if error reading
      continue;
    }
  }

  return skills;
}
```

- [ ] **Step 3: Update tests with mocks**

```javascript
jest.mock('fs-extra');
import fs from 'fs-extra';

describe('visualizers/index - loadUserSkills', () => {
  beforeEach(() => {
    fs.readdir.mockReset();
    fs.pathExists.mockReset();
    fs.readFile.mockReset();
  });

  it('loads user skills from skills directory', async () => {
    fs.pathExists.mockResolvedValue(true);
    fs.readdir.mockResolvedValue([
      { isDirectory: () => true, name: 'my-skill' }
    ]);
    fs.readFile.mockResolvedValue(`
---
name: My Custom Skill
description: A custom skill I created
tags: ["custom", "vscode"]
domains: ["backend"]
provides: ["api"]
requires: ["nodejs"]
---
`);

    const skills = await loadUserSkills();
    expect(skills).toHaveLength(1);
    expect(skills[0]).toHaveProperty('status', 'user-created');
    expect(skills[0].name).toBe('My Custom Skill');
    expect(skills[0].ideCompatibility).toContain('vscode');
  });
});
```

- [ ] **Step 4: Run tests - PASS**

Run: `npm test -- test/visualizers/index.unit.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/visualizers/index.js test/visualizers/index.unit.test.js
git commit -m "feat(visualizers): add loadUserSkills() with frontmatter parsing"
```

---

## Chunk 3: Data Aggregation and Deduplication

### Task 3-1: Implement gatherData()

**Files:**
- Modify: `lib/visualizers/index.js`
- Test: `test/visualizers/index.integration.test.js`

- [ ] **Step 1: Write integration test for gatherData()**

```javascript
import { gatherData } from '../lib/visualizers/index.js';

describe('visualizers/index - gatherData', () => {
  it('merges installed, catalog, and user skills with correct precedence', async () => {
    // Mock all three load functions
    const installed = [{
      name: 'node-express',
      status: 'installed',
      ideCompatibility: ['vscode']
    }];
    const catalog = [{
      name: 'node-express',  // Duplicate - should be overridden by installed
      status: 'catalog',
      ideCompatibility: ['jetbrains']
    }, {
      name: 'python-django',
      status: 'catalog',
      ideCompatibility: ['all']
    }];
    const user = [{
      name: 'my-rust-skill',
      status: 'user-created',
      ideCompatibility: ['vscode']
    }];

    // Mock functions
    const data = await gatherData({
      loadInstalled: () => Promise.resolve(installed),
      loadCatalog: () => Promise.resolve(catalog),
      loadUser: () => Promise.resolve(user)
    });

    expect(data.skills).toHaveLength(2); // node-express (from installed) + python-django + my-rust-skill
    expect(data.skills.find(s => s.name === 'node-express').status).toBe('installed');
    expect(data.skills.find(s => s.name === 'python-django').status).toBe('catalog');
  });

  it('computes sidebar stats correctly', async () => {
    const data = await gatherData();
    expect(data.stats).toHaveProperty('total');
    expect(data.stats).toHaveProperty('byStatus');
    expect(data.stats).toHaveProperty('byDomain');
    expect(data.stats).toHaveProperty('currentIde');
  });
});
```

- [ ] **Step 2: Implement gatherData()**

Add to `lib/visualizers/index.js`:

```javascript
/**
 * Detect current IDE from context
 */
export async function detectCurrentIde() {
  const { detectIdes } = await import('../../lib/context.js');
  const ides = await detectIdes();
  return ides.length > 0 ? ides[0].name : 'auto-detected';
}

/**
 * Compute sidebar statistics
 */
function computeStats(skills) {
  const stats = {
    total: skills.length,
    byStatus: {
      installed: 0,
      'user-created': 0,
      catalog: 0
    },
    byDomain: {},
    byIde: {}
  };

  skills.forEach(skill => {
    // Count by status
    stats.byStatus[skill.status] = (stats.byStatus[skill.status] || 0) + 1;

    // Count by domain
    skill.domains.forEach(domain => {
      stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;
    });

    // Count by IDE
    skill.ideCompatibility.forEach(ide => {
      stats.byIde[ide] = (stats.byIde[ide] || 0) + 1;
    });
  });

  return stats;
}

/**
 * Merge skills from all sources with deduplication
 */
function mergeSkills(installed, catalog, user) {
  const skillMap = new Map();

  // Helper to add skill to map (lowercase key)
  const addSkill = (skill) => {
    const key = skill.name.toLowerCase();
    if (!skillMap.has(key) || getPrecedence(skill) > getPrecedence(skillMap.get(key))) {
      skillMap.set(key, skill);
    }
  };

  // Precedence: installed (3) > user-created (2) > catalog (1)
  function getPrecedence(skill) {
    switch (skill.status) {
      case 'installed': return 3;
      case 'user-created': return 2;
      case 'catalog': return 1;
      default: return 0;
    }
  }

  // Add all skills (order matters: lower precedence first)
  catalog.forEach(addSkill);
  user.forEach(addSkill);
  installed.forEach(addSkill);

  return Array.from(skillMap.values());
}

/**
 * Main data gathering function
 */
export async function gatherData() {
  const [installed, catalog, user] = await Promise.all([
    loadInstalledSkills(),
    loadCatalogSkills(),
    loadUserSkills()
  ]);

  const allSkills = mergeSkills(installed, catalog, user);
  const stats = computeStats(allSkills);
  const currentIde = await detectCurrentIde();

  return {
    skills: allSkills,
    stats,
    currentIde
  };
}
```

- [ ] **Step 3: Update integration test with real implementation**

```javascript
import { gatherData, loadInstalledSkills, loadCatalogSkills, loadUserSkills, mergeSkills, computeStats } from '../lib/visualizers/index.js';

// Mock dependencies
jest.mock('../../lib/skills-manifest.js', () => ({ loadManifest: jest.fn() }));
jest.mock('../../lib/catalog.js', () => ({ loadCatalog: jest.fn() }));
jest.mock('../../lib/context.js', () => ({ detectIdes: jest.fn() }));

describe('visualizers/index - gatherData', () => {
  beforeEach(() => {
    loadManifest.mockReset();
    loadCatalog.mockReset();
    detectIdes.mockReset();
  });

  it('merges skills with correct precedence', async () => {
    loadManifest.mockResolvedValue({
      version: '1.0',
      installed: [{ name: 'node-express', status: 'installed' }]
    });
    loadCatalog.mockResolvedValue({
      skills: [
        { name: 'node-express', status: 'catalog' },
        { name: 'python-django', status: 'catalog' }
      ]
    });
    detectIdes.mockResolvedValue([]);

    const data = await gatherData();

    expect(data.skills).toHaveLength(2);
    expect(data.skills.find(s => s.name === 'node-express').status).toBe('installed');
    expect(data.skills.find(s => s.name === 'python-django').status).toBe('catalog');
  });

  it('computes stats correctly', async () => {
    loadManifest.mockResolvedValue({ version: '1.0', installed: [] });
    loadCatalog.mockResolvedValue({
      skills: [
        { name: 'skill1', tags: [], domains: ['backend'] },
        { name: 'skill2', tags: ['vscode'], domains: ['frontend'] }
      ]
    });
    detectIdes.mockResolvedValue([]);

    const data = await gatherData();

    expect(data.stats.total).toBe(2);
    expect(data.stats.byStatus.catalog).toBe(2);
    expect(data.stats.byDomain.backend).toBe(1);
    expect(data.stats.byDomain.frontend).toBe(1);
    expect(data.stats.byIde.vscode).toBe(1);
  });

  it('detects current IDE', async () => {
    loadManifest.mockResolvedValue({ version: '1.0', installed: [] });
    loadCatalog.mockResolvedValue({ skills: [] });
    detectIdes.mockResolvedValue([{ name: 'Claude Code' }]);

    const data = await gatherData();
    expect(data.currentIde).toBe('Claude Code');
  });
});
```

- [ ] **Step 4: Run tests - PASS**

Run: `npm test -- test/visualizers/index.integration.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/visualizers/index.js test/visualizers/index.integration.test.js
git commit -m "feat(visualizers): add gatherData() with skill merging and stats"
```

---

## Chunk 4: Rendering - Skill Cards

### Task 4-1: Implement renderSkillCard()

**Files:**
- Create: `lib/visualizers/skill-card.js`
- Test: `test/visualizers/skill-card.unit.test.js`

- [ ] **Step 1: Write failing tests**

```javascript
import { renderSkillCard } from '../lib/visualizers/skill-card.js';

describe('visualizers/skill-card', () => {
  const mockSkill = {
    name: 'node-express-postgres',
    displayName: 'Node.js Express PostgreSQL',
    description: 'Full-stack Node.js skill with Express and PostgreSQL.',
    status: 'installed',
    ideCompatibility: ['vscode', 'cursor'],
    domains: ['backend', 'api'],
    tags: ['node', 'express', 'postgres'],
    provides: ['api-development', 'database-integration'],
    requires: ['nodejs', 'postgres'],
    repoUrl: 'https://github.com/example/skill'
  };

  it('renders minimal card with correct structure', () => {
    const html = renderSkillCard(mockSkill, false);
    expect(html).toContain('class="skill-card"');
    expect(html).toContain('node-express-postgres');
    expect(html).toContain('badge-installed');
    expect(html).toContain('data-status="installed"');
  });

  it('renders expanded card with provides/requires/tags', () => {
    const html = renderSkillCard(mockSkill, true);
    expect(html).toContain('class="skill-card expanded"');
    expect(html).toContain('Provides');
    expect(html).toContain('api-development');
    expect(html).toContain('Requires');
    expect(html).toContain('nodejs');
    expect(html).toContain('View Repository');
    expect(html).toContain(mockSkill.repoUrl);
  });

  it('escapes HTML to prevent XSS', () => {
    const maliciousSkill = { ...mockSkill, name: '<script>alert(1)</script>' };
    const html = renderSkillCard(maliciousSkill, false);
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
```

- [ ] **Step 2: Run test - FAIL**

Run: `npm test -- test/visualizers/skill-card.unit.test.js`
Expected: FAIL - module not found

- [ ] **Step 3: Implement renderSkillCard()**

Create `lib/visualizers/skill-card.js`:

```javascript
import { escapeHtml } from './utils.js';

/**
 * Get status badge HTML
 */
function getStatusBadge(status) {
  const badges = {
    installed: '<span class="badge badge-installed">Installed</span>',
    'user-created': '<span class="badge badge-user">Custom</span>',
    catalog: '<span class="badge badge-catalog">Available</span>'
  };
  return badges[status] || '';
}

/**
 * Render IDE compatibility badges
 */
function renderIdeBadges(ideCompatibility) {
  if (!ideCompatibility || ideCompatibility.length === 0) {
    return '<span class="ide-badge">Universal</span>';
  }
  return ideCompatibility.map(ide =>
    `<span class="ide-badge">${escapeHtml(ide)}</span>`
  ).join('');
}

/**
 * Render domain tags
 */
function renderDomainTags(domains) {
  return domains.map(domain =>
    `<span class="domain-tag">${escapeHtml(domain)}</span>`
  ).join('');
}

/**
 * Render skill card HTML
 * @param {Object} skill - Skill object
 * @param {boolean} expanded - Whether card is expanded
 * @returns {string} HTML string
 */
export function renderSkillCard(skill, expanded = false) {
  const name = escapeHtml(skill.displayName || skill.name);
  const description = escapeHtml(skill.description);
  const statusBadge = getStatusBadge(skill.status);
  const ideBadges = renderIdeBadges(skill.ideCompatibility);
  const domainTags = renderDomainTags(skill.domains || []);

  if (!expanded) {
    return `
      <div class="skill-card" data-id="${escapeHtml(skill.id)}" data-status="${escapeHtml(skill.status)}" data-ide="${skill.ideCompatibility ? skill.ideCompatibility[0] : 'all'}">
        <div class="card-header">
          <h3>${name}</h3>
          ${statusBadge}
        </div>
        <p class="description">${description}</p>
        <div class="metadata">
          ${ideBadges}
          ${domainTags}
        </div>
      </div>
    `;
  }

  // Expanded view
  const providesList = (skill.provides || []).map(p => `<li>${escapeHtml(p)}</li>`).join('');
  const requiresList = (skill.requires || []).map(r => `<li>${escapeHtml(r)}</li>`).join('');
  const tags = (skill.tags || []).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('');
  const repoLink = skill.repoUrl ? `<a href="${escapeHtml(skill.repoUrl)}" target="_blank" class="repo-link">View Repository →</a>` : '';

  return `
      <div class="skill-card expanded" data-id="${escapeHtml(skill.id)}" data-status="${escapeHtml(skill.status)}" data-ide="${skill.ideCompatibility ? skill.ideCompatibility[0] : 'all'}">
        <div class="card-header">
          <h3>${name}</h3>
          ${statusBadge}
        </div>
        <div class="card-body">
          <p class="description">${description}</p>

          ${skill.provides && skill.provides.length > 0 ? `
          <section class="provides">
            <h4>Provides</h4>
            <ul>${providesList}</ul>
          </section>
          ` : ''}

          ${skill.requires && skill.requires.length > 0 ? `
          <section class="requires">
            <h4>Requires</h4>
            <ul>${requiresList}</ul>
          </section>
          ` : ''}

          ${tags ? `<div class="tags">${tags}</div>` : ''}

          ${repoLink}

          <button class="collapse-btn" onclick="toggleCard('${escapeHtml(skill.id)}')">Show less</button>
        </div>
      </div>
  `;
}
```

- [ ] **Step 4: Run tests - PASS**

```bash
npm test -- test/visualizers/skill-card.unit.test.js
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/visualizers/skill-card.js test/visualizers/skill-card.unit.test.js
git commit -m "feat(visualizers): add renderSkillCard() with expand/collapse"
```

---

## Chunk 5: Interactivity - JavaScript Logic

### Task 5-1: Implement Client-Side Script

**Files:**
- Modify: `lib/visualizers/index.js` (add renderScript() or similar)
- Test: `test/visualizers/index.integration.test.js` (verify script generation)

- [ ] **Step 1: Write test for renderScript()**

```javascript
import { renderScript } from '../lib/visualizers/index.js';

describe('visualizers/index - renderScript', () => {
  it('generates JavaScript with search, filter, and toggle functions', () => {
    const skills = [
      { id: 'skill1', name: 'Skill One', description: 'desc', tags: ['test'], ideCompatibility: ['vscode'] },
      { id: 'skill2', name: 'Skill Two', description: 'desc', tags: ['test'], ideCompatibility: ['jetbrains'] }
    ];
    const script = renderScript(skills);

    expect(script).toContain('const skillsData = [');
    expect(script).toContain('function toggleCard(');
    expect(script).toContain('function filterSkills()');
    expect(script).toContain('function renderGrid()');
    expect(script).toContain('document.getElementById(\'search-input\')');
    expect(script).toContain('addEventListener');
  });
});
```

- [ ] **Step 2: Implement renderScript()**

Add to `lib/visualizers/index.js`:

```javascript
/**
 * Generate the JavaScript code for client-side interactivity
 */
export function renderScript(skills) {
  // Note: skills are injected as JSON via template; this function generates the behavior code
  return `
(function() {
  let currentIdeFilter = 'all';
  let searchQuery = '';

  function toggleCard(cardId) {
    const card = document.querySelector(\`[data-id="\${cardId}"]\`);
    if (card) {
      const isExpanded = card.classList.toggle('expanded');
      if (isExpanded) {
        // Close others
        document.querySelectorAll('.skill-card.expanded').forEach(c => {
          if (c !== card) c.classList.remove('expanded');
        });
      }
    }
  }

  function filterSkills() {
    return skillsData.filter(skill => {
      const ideMatch = currentIdeFilter === 'all' ||
                       skill.ideCompatibility.includes(currentIdeFilter);
      const searchMatch = searchQuery === '' ||
                          skill.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          skill.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      return ideMatch && searchMatch;
    });
  }

  function renderGrid() {
    const filtered = filterSkills();
    const grid = document.getElementById('skill-grid');
    const emptyState = document.getElementById('empty-state');

    if (filtered.length === 0) {
      grid.style.display = 'none';
      emptyState.style.display = 'block';
    } else {
      grid.style.display = 'grid';
      emptyState.style.display = 'none';
      grid.innerHTML = filtered.map(skill => renderSkillCardTemplate(skill, false)).join('');
    }

    // Update search count
    const countSpan = document.getElementById('search-count');
    if (countSpan) {
      countSpan.textContent = \`\${filtered.length} of \${skillsData.length}\`;
    }
  }

  function renderSkillCardTemplate(skill, expanded) {
    // Reuse the same HTML structure as server-side rendering
    return \`<div class="skill-card \${expanded ? 'expanded' : ''}" data-id="\${skill.id}" data-status="\${skill.status}" data-ide="\${skill.ideCompatibility[0] || 'all'}">
      <div class="card-header">
        <h3>\${escapeHtml(skill.displayName || skill.name)}</h3>
        \${getStatusBadge(skill.status)}
      </div>
      \${expanded ? \`
      <div class="card-body">
        <p class="description">\${escapeHtml(skill.description)}</p>
        \${skill.provides && skill.provides.length ? \`
        <section class="provides">
          <h4>Provides</h4>
          <ul>\${skill.provides.map(p => '<li>' + escapeHtml(p) + '</li>').join('')}</ul>
        </section>\` : ''}
        \${skill.requires && skill.requires.length ? \`
        <section class="requires">
          <h4>Requires</h4>
          <ul>\${skill.requires.map(r => '<li>' + escapeHtml(r) + '</li>').join('')}</ul>
        </section>\` : ''}
        <div class="tags">\${skill.tags.map(t => '<span class="tag">' + escapeHtml(t) + '</span>').join('')}</div>
        \${skill.repoUrl ? '<a href="' + escapeHtml(skill.repoUrl) + '" target="_blank" class="repo-link">View Repository →</a>' : ''}
        <button class="collapse-btn" onclick="toggleCard('\${skill.id}')">Show less</button>
      </div>
      \` : `
      <p class="description">\${skill.description.substring(0, 120)}...</p>
      <div class="metadata">
        \${skill.ideCompatibility.map(ide => '<span class="ide-badge">' + escapeHtml(ide) + '</span>').join('')}
        \${skill.domains.map(d => '<span class="domain-tag">' + escapeHtml(d) + '</span>').join('')}
      </div>\`}
    </div>\`;
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function getStatusBadge(status) {
    const badges = {
      installed: '<span class="badge badge-installed">Installed</span>',
      'user-created': '<span class="badge badge-user">Custom</span>',
      catalog: '<span class="badge badge-catalog">Available</span>'
    };
    return badges[status] || '';
  }

  // Event listeners
  document.addEventListener('DOMContentLoaded', function() {
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        searchQuery = e.target.value;
        renderGrid();
      });
    }

    document.querySelectorAll('.ide-tab').forEach(tab => {
      tab.addEventListener('click', function() {
        document.querySelectorAll('.ide-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        currentIdeFilter = this.dataset.ide;
        renderGrid();
      });
    });

    // Event delegation for card clicks
    const grid = document.getElementById('skill-grid');
    if (grid) {
      grid.addEventListener('click', function(e) {
        const card = e.target.closest('.skill-card:not(.expanded)');
        if (card) {
          toggleCard(card.dataset.id);
        }
      });
    }

    // Initial render
    renderGrid();
  });

  // Also render domain stats
  function renderDomainStats() {
    const domainList = document.getElementById('domain-list');
    if (!domainList) return;

    const domains = {};
    skillsData.forEach(skill => {
      skill.domains.forEach(d => {
        domains[d] = (domains[d] || 0) + 1;
      });
    });

    const sorted = Object.entries(domains).sort((a, b) => b[1] - a[1]);
    domainList.innerHTML = '<ul>' + sorted.map(([domain, count]) =>
      '<li><span>' + escapeHtml(domain) + '</span><span class="domain-tag">' + count + '</span></li>'
    ).join('') + '</ul>';
  }

  renderDomainStats();
})();
`;
}
```

- [ ] **Step 3: Update tests to include script verification**

```javascript
import { renderScript } from '../lib/visualizers/index.js';

describe('visualizers/index - renderScript', () => {
  it('includes all required event listeners and functions', () => {
    const skills = [{ id: 's1', name: 'Test', description: 'desc', tags: [], ideCompatibility: ['all'] }];
    const script = renderScript(skills);

    expect(script).toContain('toggleCard');
    expect(script).toContain('filterSkills');
    expect(script).toContain('renderGrid');
    expect(script).toContain("addEventListener('input'");
    expect(script).toContain("addEventListener('click'");
    expect(script).toContain('DOMContentLoaded');
  });
});
```

- [ ] **Step 4: Run tests - PASS**

Run: `npm test -- test/visualizers/index.integration.test.js`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add lib/visualizers/index.js test/visualizers/index.integration.test.js
git commit -m "feat(visualizers): add renderScript() with search/filter/toggle"
```

---

## Chunk 6: Command Handler

### Task 6-1: Implement docs Command

**Files:**
- Create: `lib/commands/docs.js`
- Modify: `cli.js` (register command)
- Test: `test/commands/docs.integration.test.js`

- [ ] **Step 1: Write failing integration test**

```javascript
import { program } from 'commander';
import { docs } from '../../lib/commands/docs.js';

describe('commands/docs', () => {
  beforeEach(() => {
    program.parse = jest.fn();
    program.option = jest.fn().mockReturnThis();
    program.action = jest.fn();
  });

  it('registers command with correct options', () => {
    expect(() => docs(program)).not.toThrow();
    expect(program.command).toHaveBeenCalledWith('docs');
    expect(program.option).toHaveBeenCalledWith('--output, -o <path>', expect.any(String));
    expect(program.option).toHaveBeenCalledWith('--no-open', expect.any(String));
    expect(program.option).toHaveBeenCalledWith('--quiet, -q', expect.any(String));
  });
});
```

- [ ] **Step 2: Implement docs.js**

```javascript
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import TreeLogger from '../utils.js'; // Assuming TreeLogger exported
import { gatherData } from '../visualizers/index.js';
import { readTemplate, openBrowser } from '../visualizers/utils.js';
import { loadCatalog } from '../catalog.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load template and styles
const TEMPLATE_PATH = path.join(__dirname, '..', 'visualizers', 'template.html');
const STYLES_PATH = path.join(__dirname, '..', 'visualizers', 'styles.css');

/**
 * Command: docs
 * Generate HTML documentation for skills
 */
export async function docs(options = {}) {
  const {
    output = '.rosetta/docs/skills.html',
    noOpen = false,
    quiet = false,
    dryRun = false
  } = options;

  const logger = quiet ? {
    log: () => {},
    logStep: () => {}
  } : new TreeLogger('Generating documentation');

  try {
    logger.log('Gathering skill data...');
    const data = await gatherData();

    if (dryRun) {
      console.log(JSON.stringify(data, null, 2));
      return;
    }

    // Load template and styles
    logger.logStep('Loading template and styles...');
    let template = await readTemplate(TEMPLATE_PATH);
    const styles = await readTemplate(STYLES_PATH);

    // Ensure output directory exists
    const outputPath = path.resolve(output);
    const outputDir = path.dirname(outputPath);
    await import('fs-extra').then(fs => fs.ensureDir(outputDir));

    // Render components
    logger.logStep('Generating HTML...');
    const sidebarStats = renderSidebarStats(data.stats);
    const ideTabs = renderIdeTabs(data.currentIde);
    const searchBar = renderSearchBar();
    const skillGrid = data.skills.map(skill =>
      // Use minimal render to avoid duplicating logic; server-side renders minimal cards
      // Full expansion handled client-side
    ).join('');

    // Actually we'll embed skills as JSON and let client render
    const skillsJson = JSON.stringify(data.skills);
    const escapedSkillsJson = escapeJsonForScript(skillsJson);

    // Replace placeholders
    const html = template
      .replace(/{{TITLE}}/g, 'Rosetta Skills Documentation')
      .replace(/{{STYLES}}/g, styles)
      .replace(/{{SIDEBAR_STATS}}/g, sidebarStats)
      .replace(/{{IDE_TABS}}/g, ideTabs)
      .replace(/{{CURRENT_IDE}}/g, escapeHtml(data.currentIde))
      .replace(/{{SEARCH_BAR}}/g, searchBar)
      .replace(/{{SKILL_GRID}}/g, '') // Will be populated by JS
      .replace(/{{SKILLS_JSON}}/g, escapedSkillsJson)
      .replace(/{{SCRIPT_CONTENT}}/g, renderScript(data.skills));

    // Write file
    logger.logStep(`Writing to ${outputPath}...`);
    const fs = await import('fs-extra');
    await fs.writeFile(outputPath, html, 'utf-8');

    logger.log(chalk.green(`✓ Documentation generated: ${outputPath}`));

    // Open browser
    if (!noOpen) {
      logger.logStep('Opening in browser...');
      await openBrowser(outputPath);
    }

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    process.exit(1);
  }
}

/* Helper render functions for static parts */
function renderSidebarStats(stats) {
  return `
    <div class="stat-item"><span class="stat-label">Total Skills</span><span class="stat-value">${stats.total}</span></div>
    <div class="stat-item"><span class="stat-label">Installed</span><span class="stat-value">${stats.byStatus.installed || 0}</span></div>
    <div class="stat-item"><span class="stat-label">Custom</span><span class="stat-value">${stats.byStatus['user-created'] || 0}</span></div>
    <div class="stat-item"><span class="stat-label">Available</span><span class="stat-value">${stats.byStatus.catalog || 0}</span></div>
  `;
}

function renderIdeTabs(currentIde) {
  return ''; // Already in template; just update active state via JS
}

function renderSearchBar() {
  return ''; // Already in template
}
```

- [ ] **Step 3: Register command in cli.js**

Modify `lib/cli.js`:

Add import at top:
```javascript
import { docs } from './commands/docs.js';
```

Add command registration after other commands:
```javascript
program
  .command('docs')
  .description('Generate HTML documentation for skills')
  .option('--output, -o <path>', 'Output file path', '.rosetta/docs/skills.html')
  .option('--no-open', 'Do not open browser automatically')
  .option('--quiet, -q', 'Suppress console output')
  .option('--dry-run', 'Output data as JSON without generating HTML')
  .action(async (cmdObj) => {
    await docs({
      output: cmdObj.output,
      noOpen: cmdObj.noOpen,
      quiet: cmdObj.quiet,
      dryRun: cmdObj.dryRun
    });
  });
```

- [ ] **Step 4: Run tests**

```bash
npm test -- test/commands/docs.integration.test.js
```
Expected: PASS

- [ ] **Step 5: Manual test**

```bash
node cli.js docs --dry-run | head -20
```
Expected: JSON output with skills array

- [ ] **Step 6: Commit**

```bash
git add lib/commands/docs.js cli.js test/commands/docs.integration.test.js
git commit -m "feat: add docs command with full HTML generation"
```

---

## Chunk 7: Final Testing & Documentation

### Task 7-1: Complete Test Suite

- [ ] **Step 1: Write integration test for full HTML generation**

```javascript
import fs from 'fs-extra';
import path from 'path';
import { renderHtml } from '../lib/visualizers/index.js';

describe('visualizers/integration - renderHtml', () => {
  it('generates complete standalone HTML file', async () => {
    const mockData = {
      skills: [
        {
          id: 'test-skill',
          name: 'Test Skill',
          description: 'A test skill',
          status: 'installed',
          ideCompatibility: ['vscode'],
          domains: ['backend'],
          tags: ['test'],
          provides: ['testing'],
          requires: ['nodejs']
        }
      ],
      stats: { total: 1, byStatus: { installed: 1 }, byDomain: { backend: 1 }, byIde: { vscode: 1 } },
      currentIde: 'VS Code'
    };

    const html = await renderHtml(mockData);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Rosetta Skills Documentation</title>');
    expect(html).toContain('Test Skill');
    expect(html).toContain('sidevar'); // stats section
    expect(html).toContain('skill-card');
    expect(html).toContain('const skillsData =');
    expect(html).toContain('toggleCard');
  });
});
```

- [ ] **Step 2: Implement renderHtml() in index.js**

```javascript
import { readTemplate, escapeJsonForScript } from './utils.js';

/**
 * Render complete HTML document
 */
export async function renderHtml(data) {
  const template = await readTemplate(TEMPLATE_PATH);
  const styles = await readTemplate(STYLES_PATH);

  const sidebarStats = renderSidebarStats(data.stats);
  const ideTabs = renderIdeTabs(data.currentIde);
  const skillsJson = JSON.stringify(data.skills);
  const escapedSkillsJson = escapeJsonForScript(skillsJson);
  const scriptContent = renderScript(data.skills);

  return template
    .replace(/{{TITLE}}/g, 'Rosetta Skills Documentation')
    .replace(/{{STYLES}}/g, styles)
    .replace(/{{SIDEBAR_STATS}}/g, sidebarStats)
    .replace(/{{IDE_TABS}}/g, ideTabs)
    .replace(/{{CURRENT_IDE}}/g, escapeHtml(data.currentIde))
    .replace(/{{SEARCH_BAR}}/g, '') // already in template
    .replace(/{{SKILL_GRID}}/g, '') // JS renders this
    .replace(/{{SKILLS_JSON}}/g, escapedSkillsJson)
    .replace(/{{SCRIPT_CONTENT}}/g, scriptContent);
}
```

- [ ] **Step 3: Run all tests**

```bash
npm test
```
Expected: All passing

- [ ] **Step 4: Commit**

```bash
git add lib/visualizers/index.js test/visualizers/index.integration.test.js
git commit -m "test(visualizers): add full HTML rendering integration test"
```

---

### Task 7-2: User Documentation

- [ ] **Step 1: Create docs/VISUALIZATION.md**

```markdown
# HTML Documentation Visualization

The `rosetta docs` command generates a standalone HTML file that provides a beautiful, searchable interface for browsing all your available skills.

## Usage

```bash
# Generate docs and open in browser (default)
rosetta docs

# Specify output path
rosetta docs --output ./my-docs.html

# Generate without opening browser
rosetta docs --no-open

# Preview data as JSON (dry-run)
rosetta docs --dry-run

# Suppress console output
rosetta docs --quiet
```

## Features

- **FastAPI-style Interface**: Clean, professional design inspired by FastAPI's beloved documentation
- **Card Grid Layout**: Installed, user-created, and catalog skills displayed in a responsive grid
- **Search**: Real-time filtering by name, description, and tags
- **IDE Filtering**: Filter skills by IDE compatibility (VS Code, JetBrains, Claude Code)
- **Progressive Disclosure**: Click any card to expand and see full details (provides, requires, tags)
- **Standalone HTML**: Single file with embedded CSS and JavaScript - no server required

## Data Sources

The documentation aggregates skills from three sources:

1. **Installed** - Skills from `.rosetta/skills/manifest.json`
2. **User-Created** - Skills from your `skills/` or `company-skills/` directories
3. **Catalog** - Available skills from `catalog.json`

Skills are deduplicated by name, with installed skills taking precedence over user-created, which override catalog entries.

## Customization

The HTML file is self-contained. To customize appearance, edit:

- `lib/visualizers/styles.css` - CSS styles (FastAPI-inspired)
- `lib/visualizers/template.html` - HTML structure
- `lib/visualizers/skill-card.js` - Card rendering logic

Note: Customizations will be overwritten on upgrade unless you fork.

## Troubleshooting

**No skills appear?**
- Ensure you have skills installed: `rosetta skills`
- Check that `~/.rosetta/skills/manifest.json` exists

**Browser doesn't open?**
- Use `--no-open` and open manually
- Check file path: `.rosetta/docs/skills.html`

**Search not working?**
- Ensure JavaScript is enabled in your browser
- Check browser console for errors

## Advanced

### Understanding the Output

The generated HTML includes:

- **Sidebar**: Statistics and IDE filter tabs
- **Main Area**: Search bar and skill grid
- **Skill Cards**: Minimal view by default, click to expand
- **JSON Data**: Embedded in `<script>` as `skillsData`

### File Locations

- Template: `lib/visualizers/template.html`
- Styles: `lib/visualizers/styles.css`
- JS Logic: Injected via `renderScript()` in `lib/visualizers/index.js`

## Future Enhancements

- [ ] Live reload server mode (`--server`)
- [ ] Custom template support (`--template`)
- [ ] Skill installation from docs UI
- [ ] Advanced filtering (provides/requires)
- [ ] Sorting options

Feedback and feature requests welcome!
```

- [ ] **Step 2: Update README.md**

Add section:
```markdown
## Documentation

Generate interactive HTML documentation for your skills:

```bash
rosetta docs          # Generate and open in browser
rosetta docs -o ./skills.html  # Custom output path
rosetta docs --no-open # Don't auto-open
```

For more details, see [docs/VISUALIZATION.md](docs/VISUALIZATION.md).
```

- [ ] **Step 3: Commit docs**

```bash
git add docs/VISUALIZATION.md README.md
git commit -m "docs: add HTML documentation visualization guide"
```

---

### Task 7-3: Version Bump

- [ ] **Step 1: Update cli.js version to 0.4.0**

```javascript
program
  .version('0.4.0')
  .description('Sync AI agent rule files across IDEs')
```

- [ ] **Step 2: Update package.json if needed**

```json
{
  "version": "0.4.0"
}
```

- [ ] **Step 3: Commit**

```bash
git add cli.js package.json
git commit -m "chore: bump version to 0.4.0 for docs feature release"
```

---

## Final Verification

After all tasks complete:

- [ ] Run full test suite: `npm test` - all tests pass
- [ ] Manual test: `node cli.js docs --dry-run` shows JSON output
- [ ] Manual test: `node cli.js docs --output ./test-output.html` generates file
- [ ] Open generated HTML in browser, verify UI works
- [ ] Search and filter tested
- [ ] IDE tabs working
- [ ] Card expand/collapse working
- [ ] Check `rosetta --help` shows docs command

---

## Implementation Complete

Once all tasks are done and verified, announce completion and use `superpowers:finishing-a-development-branch` to wrap up.
