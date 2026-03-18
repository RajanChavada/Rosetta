# HTML Documentation Visualization - Design Specification

**Date**: 2026-03-17
**Feature**: HTML Documentation Visualization for Rosetta CLI
**Version**: v0.4.0
**Status**: Approved for Implementation

---

## 1. Overview

### Purpose
Provide a simple, FastAPI-style documentation interface for installed skills that opens in the browser, making it easy for developers to discover and understand available skills and their capabilities.

### User Experience
```bash
$ rosetta docs
Generating skill documentation...
✓ Found 8 installed skills (Claude Code)
✓ Documentation generated: .rosetta/docs/skills.html
Opening in browser...
```

---

## 2. Command Specification

### Command
```
rosetta docs [options]
```

**Note**: Command name is `docs`. The implementation file is `lib/commands/docs.js` (not visualize.js).

### Options
```
--output, -o <path>    Output file path (default: .rosetta/docs/skills.html)
--no-open              Don't auto-open browser (default: opens)
--quiet, -q            Suppress console output
--skills-dir <path>    Override skills directory (default: auto-detect)
--catalog <path>       Override catalog path (default: ./catalog.json)
--dry-run              Show what would be generated without writing
```

---

## 3. Architecture

### File Structure
```
lib/
├── commands/
│   └── docs.js            # Command handler, option parsing
└── visualizers/
    ├── index.js           # Main: gatherData(), renderHtml()
    ├── skill-card.js      # renderSkillCard(skill, expanded)
    ├── utils.js           # Shared: escapeHtml(), openBrowser()
    ├── template.html      # Base HTML with {{PLACEHOLDERS}}
    └── styles.css         # Embedded CSS (FastAPI-inspired)
```

### Data Flow
```
1. Load data sources (in visualizers/index.js):
   - Installed: use loadManifest('.rosetta/skills/manifest.json') - reads global or project manifest
   - User-created: readSkillsFromSources(SKILLS_SOURCES) + scanForSkillMds()
   - Catalog: use loadCatalog() from lib/catalog.js

2. gatherData():
   - Merge, dedupe (installed > user > catalog precedence)
   - For each skill: derive ideCompatibility from tags (if missing)
   - Detect IDE using `detectIdes()` from `lib/context.js`. Returns array of IDE objects `[{ name, configDir, skillsDir }]`. Use `ides[0]?.name` for "Current IDE" display (e.g., "Claude Code"). If array empty, show "auto-detected".
   - Compute sidebar stats (counts by status, domain, IDE)

3. Render HTML:
   - Read template.html (using fs.readFile)
   - Inject CSS: embed styles.css content
   - Inject skills JSON: escaped into <script> tag
   - Generate skill grid HTML via skill-card.js
   - Generate sidebar stats/IDE tabs
   - Write final HTML string to output file

4. docs.js command:
   - Parse CLI options (output, no-open, quiet, dry-run, etc.)
   - Call gatherData() and renderHtml()
   - Write file (fs.ensureDir for output dir)
   - Open browser if not --no-open
   - Dry-run: console.log(JSON.stringify(data, null, 2))
```

---

## 4. Data Model

### Skill Object (Unified)
```javascript
{
  id: 'node-express-postgres',           // unique identifier
  name: 'node-express-postgres',
  displayName: 'Node.js Express PostgreSQL',
  description: 'Full-stack Node.js skill...',
  repoUrl: 'https://github.com/...',
  domains: ['backend', 'api'],
  tags: ['node', 'express', 'postgres'],
  provides: ['api-development'],
  requires: ['nodejs', 'postgres'],
  status: 'installed' | 'user-created' | 'catalog',
  ideCompatibility: ['vscode', 'cursor'], // parsed from skill metadata
  installedAt: '2026-03-15T...',          // if installed
  source: 'manifest' | 'catalog' | 'user',
  expanded: false                          // UI state
}
```

### Data Sources

1. **Installed Skills** (`.rosetta/skills/manifest.json`)
   - Use existing `loadManifest()` from `lib/skills-manifest.js`
   - Parse `manifest.installed[]`
   - Map fields: `name`, `source` (from `source` field), `installedAt`
   - Set status: 'installed'
   - IDE compatibility: read from skill's `SKILL.md` frontmatter if available

2. **Catalog Skills** (`catalog.json`)
   - Use existing `loadCatalog()` and `filterByDomain()` from `lib/catalog.js`
   - Parse `catalog.skills[]`
   - Derive `ideCompatibility` from `tags`:
     - If tag includes 'vscode', 'cursor', 'windsurf' → add 'vscode'
     - If tag includes 'jetbrains', 'intellij', 'pycharm' → add 'jetbrains'
     - If tag includes 'claude-code' → add 'claude-code'
     - Default: `['all']` if no IDE-specific tags
   - Status: 'catalog'

3. **User-Created Skills**
   - Scan directories from `SKILLS_SOURCES` (from `lib/skills.js`) but **filter out** `templates/skills` path (built-in Rosetta templates) to avoid catalog duplicates.
   - Note: `loadSkillsFromSources()` in `lib/skills.js` expects `*.skill.md` files. For user-created skills that use `SKILL.md` format, either extend `loadSkillsFromSources()` to recognize both patterns or implement a dedicated scanner that checks for `SKILL.md`/`skill.md` in addition to `*.skill.md`.
   - Parse frontmatter: support YAML (`---` delimited) or JSON frontmatter. Extract: `name`, `description`, `domains`, `tags`, `provides`, `requires`, `repoUrl`.
   - If frontmatter missing, use directory name as skill name, generic description.
   - Set status: 'user-created'.
   - IDE compatibility: derive from tags (same logic as catalog).

### Deduplication Strategy
- Merge all sources into map keyed by `name` (case-insensitive normalization)
- Precedence (higher wins):
  1. Installed (if name matches)
  2. User-created (if name matches)
  3. Catalog (fallback)
- This ensures installed version overrides catalog entry (user may have modified version)

---

## 5. HTML Template Structure

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Rosetta Skills Documentation</title>
  <style>
    /* styles.css embedded here */
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
            <span class="stat-label">User-Created</span>
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
          <p class="tab-hint">Current IDE: <strong id="current-ide">auto-detected</strong></p>
        </div>

        <div class="domain-stats">
          <h3>Domains</h3>
          <div id="domain-list"></div>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="content">
        <div class="search-bar">
          <input type="text" id="search-input" placeholder="🔍 Search skills by name, description, or tags...">
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
    // Data injected as JSON
    const skillsData = {{SKILLS_JSON}};

    // JS for search, filtering, card expand/collapse
  </script>
</body>
</html>
```

---

## 6. Styling (FastAPI-Inspired)

### Design Principles
- Clean, minimal aesthetic
- Inter/system-ui font stack
- Blue primary color: `#339AF0` (Rosetta brand)
- Subtle shadows, border radius 4px
- Responsive grid layout

### CSS Sections
1. **Reset & Base**: `box-sizing`, font, colors
2. **Layout**: `.container`, `.layout` (sidebar + main)
3. **Sidebar**: `.sidebar`, `.stats-section`, `.ide-tabs`, `.domain-stats`
4. **Search Bar**: Full-width input with rounded corners
5. **Skill Grid**: `display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1rem;`
6. **Skill Card**: White background, padding, border, hover effect
   - `.skill-card`: base styles
   - `.skill-card.expanded`: full height, shows all sections
   - `.badge`: small colored pills for status, domains
7. **Responsive**: Mobile sidebar becomes top bar, single-column grid
8. **Accessibility**: Focus states, ARIA labels

---

## 7. Interactivity (Vanilla JavaScript)

### State Management
```javascript
let currentIdeFilter = 'all';
let searchQuery = '';
let skills = []; // loaded from skillsData

function filterSkills() {
  return skills.filter(skill => {
    const ideMatch = currentIdeFilter === 'all' ||
                     skill.ideCompatibility.includes(currentIdeFilter);
    const searchMatch = searchQuery === '' ||
                        skill.name.toLowerCase().includes(searchQuery) ||
                        skill.description.toLowerCase().includes(searchQuery) ||
                        skill.tags.some(tag => tag.includes(searchQuery));
    return ideMatch && searchMatch;
  });
}
```

### Event Listeners
1. **Search input**: `input` event → update `searchQuery`, re-render grid
2. **IDE tabs**: `click` → set `currentIdeFilter`, update active button, re-render
3. **Card click**: toggle `expanded` class on card
4. **ESC key**: collapse all cards

### Update Cycle
```javascript
function renderGrid() {
  const filtered = filterSkills();
  const grid = document.getElementById('skill-grid');
  grid.innerHTML = filtered.map(skill => renderSkillCard(skill)).join('');
  updateCounts(filtered.length);
}

function renderSkillCard(skill) {
  const expandedClass = skill.expanded ? 'expanded' : '';
  const statusBadge = getStatusBadge(skill.status);
  const ideBadges = skill.ideCompatibility.map(ide => `<span class="ide-badge">${ide}</span>`).join('');

  if (!skill.expanded) {
    return `
      <div class="skill-card ${expandedClass}" data-id="${skill.id}">
        <div class="card-header">
          <h3>${skill.name}</h3>
          ${statusBadge}
        </div>
        <p class="description">${escapeHtml(truncate(skill.description, 120))}</p>
        <div class="metadata">
          ${ideBadges}
        </div>
      </div>
    `;
  }

  // Expanded view
  return `
    <div class="skill-card ${expandedClass}" data-id="${skill.id}">
      <div class="card-header">
        <h3>${skill.displayName || skill.name}</h3>
        ${statusBadge}
      </div>
      <div class="card-body">
        <p class="description">${escapeHtml(skill.description)}</p>

        <section class="provides">
          <h4>Provides</h4>
          <ul>${skill.provides.map(p => `<li>${escapeHtml(p)}</li>`).join('')}</ul>
        </section>

        <section class="requires">
          <h4>Requires</h4>
          <ul>${skill.requires.map(r => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
        </section>

        <div class="tags">
          ${skill.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')}
        </div>

        <a href="${skill.repoUrl}" target="_blank" class="repo-link">
          View Repository →
        </a>

        <button class="collapse-btn">Show less</button>
      </div>
    </div>
  `;
}
```

---

## 8. Error Handling

### Visualizers Layer
- If manifest file not found: return empty `installed` array, log warning (unless --quiet)
- If catalog file not found: return empty `catalog` array, log warning
- If user skills directory doesn't exist: skip, no error
- If output directory doesn't exist: create it (in docs.js)

### Command Layer (docs.js)
- Wrap in try/catch, display `chalk.red` errors
- Exit with code 1 on fatal errors (permissions, invalid path)
- `--dry-run`: output JSON data structure instead of HTML

### HTML Fallbacks
- If no skills at all: show friendly "No skills yet" message with link to `rosetta catalog`
- If search yields no results: "No skills match your search" with clear button

---

## 9. Testing Strategy

### Unit Tests
- `gatherData()`:
  - Loads manifest correctly
  - Scans user skills directories
  - Merges catalog without duplicates
  - Detects IDE from `.ai/master-skill.md`
  - Handles missing files gracefully

- `renderSkillCard()`:
  - Minimal view renders correct HTML structure
  - Expanded view includes provides/requires/tags
  - Status badges render properly
  - HTML escaping works (XSS prevention)

### Integration Tests
- Full HTML generation:
  - Given fixture data → output contains expected skills
  - Sidebar stats match input counts
  - IDE tabs rendered correctly
  - Search box present

### Snapshot Tests
- Store expected HTML for:
  - Small set (2-3 skills)
  - Empty state
  - Various filter states
  - Compare generated HTML against snapshot (allow timestamp variance)

---

## 10. Performance Considerations

- **Data size**: Catalog can have 15-20 skills, manifest similar size, total ~40-50 cards max
- **Rendering**: Client-side JS handles filtering/expansion (instant for 50 items)
- **Bundle size**: Single HTML file ~50-100KB (embedded CSS + JS + data)
- **No network requests**: Everything self-contained

---

## 11. Implementation Phases

### Phase 1: Core Structure
1. Create `lib/visualizers/` directory
2. Implement `visualizers/index.js` with data gathering
3. Create `template.html` with base structure
4. Write `skill-card.js` minimal render function

### Phase 2: Styling
5. Design and embed CSS (FastAPI style)
6. Add responsive layout
7. Style skill cards, sidebar, search bar

### Phase 3: Interactivity
8. Inject JS data and event listeners
9. Implement search filtering
10. Implement IDE tab switching
11. Implement card expand/collapse

### Phase 4: Command Integration
12. Create `lib/commands/docs.js`
13. Wire into `cli.js`
14. Add option parsing (--output, --no-open, --quiet, etc.)
15. Implement dry-run mode

### Phase 5: Testing & Polish
16. Write unit tests for data gathering
17. Write integration tests for full HTML generation
18. Create snapshot tests
19. Manual browser testing on multiple sizes
20. Update docs and README

---

## 12. Resolved Decisions

### IDE Detection
**Use existing `detectIdes()` from `lib/context.js`**. This checks for IDE config files (`.vscode/`, `.idea/`, etc.) and parses `.ai/master-skill.md` for IDE mentions. Returns array like `['vscode']`. Display primary IDE in sidebar "Current IDE: VS Code". If none detected, show "auto-detected".

### User Skills Scanning
**Follow `SKILLS_SOURCES` priority**:
1. Check directories from `SKILLS_SOURCES` (default: `skills/`, `company-skills/`)
2. Additionally, scan top-level directories (depth 1) for `SKILL.md` or `skill.md` files
3. Use `fs.readdir()` with `{ withFileTypes: true }` for performance
4. Limit scan to 2 levels deep to avoid performance issues

### Status Badge Colors
- Installed: `#51CF66` (Green) - "Installed"
- User-created: `#339AF0` (Blue) - "Custom"
- Catalog: `#868E96` (Gray) - "Available"

### Card Expansion
**Click entire card** to toggle expanded state. This is simpler and more mobile-friendly. Add a collapse button "Show less" within expanded view for explicit close action.

### Template Rendering Integration
Create `lib/visualizers/utils.js` with:
- `readTemplate()`: reads `template.html` and returns string
- `renderHtmlTemplate(template, data)`: replaces `{{SKILLS_JSON}}`, `{{SIDEBAR_STATS}}`, `{{SEARCH}}` placeholders
- `escapeHtml(str)`: XSS protection for all HTML output
- `escapeJson(str)`: escapes `</script>` and line breaks for JSON-in-script

### XSS Prevention
- Define `escapeHtml()`:
```javascript
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
```
- JSON injection:
```javascript
const jsonString = JSON.stringify(data)
  .replace(/</g, '\\u003c') // escape < to avoid </script> break
  .replace(/\u2028/g, '\\u2028') // escape line separator
  .replace(/\u2029/g, '\\u2029'); // escape paragraph separator
```

### Command Name
Final command is `docs`. Implementation file: `lib/commands/docs.js`. Add to `cli.js` as `program.command('docs')`.

### Browser Opening
Use `child_process.execSync()` with platform detection:
```javascript
function openBrowser(filePath) {
  const absolutePath = path.resolve(filePath);
  const url = `file://${absolutePath}`;

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
}
```
No external dependencies - uses built-in `child_process`.

### Deduplication Precedence (from Data Model)
When merging sources, use map with case-insensitive keys:
1. Installed skills (highest priority)
2. User-created skills
3. Catalog skills (lowest)

If same name exists in multiple sources, installed wins, then user-created, then catalog.

### Open/Closed Questions (Out of Scope)
- Live reload server: v0.5.0
- Custom templates: future
- Multi-language: future

## 13. Success Criteria

- [ ] `rosetta docs` appears in `rosetta --help` output
- [ ] Generates `.rosetta/docs/skills.html` with embedded CSS/JS (standalone)
- [ ] HTML opens in browser automatically by default (cross-platform)
- [ ] Card grid displays all skills (installed + user + catalog) with correct metadata
- [ ] Search filters cards in real-time (name, description, tags)
- [ ] IDE tabs filter skills by compatibility (vscode, jetbrains, claude-code)
- [ ] Cards expand/collapse smoothly (entire card click + show less button)
- [ ] Responsive layout works on mobile (320px+) and desktop
- [ ] Command options: `--output`, `--no-open`, `--quiet`, `--dry-run` work correctly
- [ ] `--dry-run` outputs JSON data structure to stdout without writing file
- [ ] All unit tests pass (>80% coverage)
- [ ] All integration tests pass with snapshot matching
- [ ] XSS prevention: HTML escaping works, JSON script injection safe
- [ ] Error handling: missing files handled gracefully with console warnings

### Integration Verification
- [ ] Command registered in `cli.js` and accessible
- [ ] Uses existing `loadManifest()`, `loadCatalog()`, `detectIdes()` modules
- [ ] Output directory created automatically if missing
- [ ] Version bumped to `0.4.0` in `cli.js`

---

## 14. Testing Structure

### Test Directories
```
test/
├── fixtures/
│   └── visualizer/
│       ├── minimal-manifest.json
│       ├── full-manifest.json
│       ├── catalog-small.json
│       ├── catalog-large.json
│       └── user-skills/
│           ├── skill-1/
│           │   └── SKILL.md
│           └── skill-2/
│               └── SKILL.md
├── visualizers/
│   ├── index.unit.test.js
│   ├── skill-card.unit.test.js
│   └── integration.test.js
└── commands/
    └── docs.integration.test.js
```

### Mocking Strategy
- Mock `fs` module for file reads (use Jest `jest.mock('fs-extra')`)
- Mock `child_process.execSync` for browser opening tests
- Provide fixture data for deterministic tests

---

## 15. Performance Considerations

- **Debounce search input**: 150ms debounce to reduce re-renders on fast typing
- **Efficient filtering**: cache filtered results, only re-render when `filteredSkills` changes
- **Event delegation**: attach single click listener to grid for card toggles (not one per card)
- **Lazy rendering**: not needed for 50 items, but could add if count > 100

---

## 16. Out of Scope for v0.4.0

- Live reload server mode (`--server`)
- Custom template support (`--template`)
- Skill installation from HTML UI
- Authentication or protected skills
- Multi-language support
- Analytics or usage tracking
- Export to PDF/other formats
- Skill comparison/merge UI
- Advanced filtering (by provides/requires)
- Sorting options

---

## 17. Version Note

This feature will be shipped in **Rosetta CLI v0.4.0**. Before release:
- Bump version in `cli.js` from `0.3.1` to `0.4.0`
- Update `package.json` version if applicable
- Update `README.md` with docs command examples
- Create `docs/VISUALIZATION.md` user guide

---
- [ ] All tests pass (>80% coverage)
- [ ] Documentation updated

---

## Appendix: Design Rationale

### Why Standalone HTML?
- Zero runtime dependencies
- Easy to share (email, Slack, docs)
- Can be opened directly from filesystem
- No server to manage

### Why FastAPI Style?
- Familiar to developers (FastAPI docs are beloved)
- Clean, reference-oriented layout
- Sidebar navigation + header + main content pattern
- Professional appearance

### Why Vanilla JS?
- No build step, no npm dependencies
- Lightweight (~10-20 lines for interactivity)
- Works in any modern browser
- Easier to maintain for simple interactions

### Why Progressive Disclosure?
- Keeps initial view clean and scannable
- Provides depth when needed
- Matches modern documentation patterns
- Reduces cognitive load
