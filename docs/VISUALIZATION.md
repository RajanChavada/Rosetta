# HTML Documentation Visualization

**Status**: Implemented in v0.4.0
**Command**: `rosetta docs`
**Feature Branch**: `feature/html-docs-v0.4.0`

---

## Overview

The HTML Documentation Visualization feature generates a beautiful, interactive web page that displays all your installed and available skills. Inspired by FastAPI's documentation style, it provides:

- **Card-based layout** with responsive grid
- **IDE-specific filtering** - filter skills by IDE compatibility (Claude Code, Cursor, VS Code, etc.)
- **Search functionality** - search by name, description, or tags
- **Statistics sidebar** - overview of your skill library
- **Browser opening** - automatically open in default browser
- **Clean, modern design** - works on desktop and mobile

## Quick Start

```bash
# Generate and open in browser
rosetta docs --open

# Generate to custom location
rosetta docs --output ./docs/my-skills.html

# Preview without writing
rosetta docs --dry-run

# Get JSON data for debugging
rosetta docs --json
```

## Command Reference

### `rosetta docs`

Generate HTML documentation for installed skills.

**Options:**

| Option | Description |
|--------|-------------|
| `-o, --output <path>` | Output file path (default: `.rosetta/docs/skills.html`) |
| `--ide <name>` | Filter by specific IDE: `claude-code`, `vscode`, `jetbrains`, `cursor`, `codex`, `kilo-code`, `continue`, `windsurf`, `openclaw` |
| `--open` | Open in browser after generation |
| `--quiet` | Suppress console output |
| `--dry-run` | Preview without writing files |
| `--json` | Output data as JSON instead of HTML |
| `-h, --help` | Show help |

### IDE Filter Values

The `--ide` option accepts these identifiers:

- `all` - Show all skills (default if auto-detection fails)
- `claude-code` - Claude Code
- `vscode` - Visual Studio Code
- `jetbrains` - JetBrains IDEs (IntelliJ, PyCharm, etc.)
- `cursor` - Cursor editor
- `codex` - Codex CLI
- `kilo-code` - Kilo Code
- `continue` - Continue.dev
- `windsurf` - Windsurf
- `openclaw` - OpenClaw

## How It Works

### Data Sources

The visualization combines data from:

1. **Installed Skills** (`~/.rosetta/skills/manifest.json` or `.rosetta/skills/manifest.json`)
   - Skills you've installed via `rosetta install`
   - Includes custom/user-created skills

2. **Skill Catalog** (`catalog.json`)
   - Available skills from the official Rosetta catalog
   - Catalog skills not already installed are included

3. **IDE Detection**
   - Auto-detects current IDE from `.claude/`, `.cursorrules`, etc.
   - Sets initial active filter based on detected IDE

### Output File

By default, documentation is written to:
```
.project-root/
└── .rosetta/
    └── docs/
        └── skills.html
```

The HTML file is completely self-contained with embedded CSS and JavaScript. You can:
- Open it directly in any browser
- Share it with team members
- Host it on internal documentation site
- View offline

## Features

### 1. Card-Based Layout

Each skill is displayed as a card showing:

- **Name** and status badge (Installed, Custom, Available)
- **Description** (truncated in compact view)
- **IDE compatibility** badges
- **Repository link** (for catalog skills)

Click a card to expand and see full details:
- Provides/Requires lists
- Tags
- Author, stars, last updated
- Full description

### 2. IDE Filtering

The sidebar shows IDE tabs. Click any IDE to show only skills compatible with that IDE.

- **Auto-detection**: If run inside a project with an IDE configured, that IDE is auto-selected
- **All IDEs**: Show everything
- Individual IDE filters: narrow view

### 3. Search

The search bar filters skills in real-time by:
- Skill name
- Description text
- Tags

Results update instantly as you type.

### 4. Statistics

Sidebar displays:
- Total skills count
- Installed vs Available
- Number of domains covered

### 5. Responsive Design

- Desktop: sidebar + main content side-by-side
- Mobile: sidebar stacks above content
- Grid adapts to screen width

## Use Cases

### Team Documentation

Generate once and share the HTML file with your team. Everyone can see what skills are available and how to use them.

### Offline Reference

No internet required once generated. Perfect for travel or restricted environments.

### Skill Discovery

Explore the catalog to discover new skills that might be useful for your project.

### IDE-Specific Filtering

Find skills that work with your preferred IDE quickly.

## Customization

The HTML template is located at:
```
lib/visualizers/template.html
```

Styles are at:
```
lib/visualizers/styles.css
```

You can customize:
- Colors and typography
- Layout and grid sizing
- Card design
- Javascript interactivity (in the embedded script)

After modifying, rebuild your docs to see changes.

## Integration with Other Commands

### `rosetta scaffold`

Use `--auto-ideate` to generate an ideation template after scaffolding. Not directly related but part of the developer experience.

### `rosetta catalog` and `rosetta install`

Install skills from the catalog, then run `rosetta docs` to see them in the documentation.

### `rosetta skills`

 Lists installed skills in terminal; `rosetta docs` provides a visual, browsable version with catalog integration.

## Troubleshooting

### No skills showing?

- Ensure you have skills installed (`~/.rosetta/skills/manifest.json`)
- Check that `catalog.json` exists in the project root
- Verify file permissions on `.rosetta/docs/`

### Browser doesn't open?

- Use `--open` flag to attempt browser open
- Some systems may block automatic opening; open the HTML file manually
- Ensure you have a default browser configured

### Filter not working?

The filter uses IDE compatibility derived from skill tags. Ensure your skills have appropriate tags in their metadata.

## Development

### Running Tests

```bash
# All visualizer tests
npm test -- test/visualizers

# Docs command tests
npm test -- test/commands/docs.integration.test.js
```

### Architecture

**Key Modules:**

- `lib/visualizers/index.js` - Main visualization logic
- `lib/visualizers/template.html` - HTML template with JavaScript
- `lib/visualizers/styles.css` - CSS styles
- `lib/commands/docs.js` - CLI command handler
- `lib/visualizers/utils.js` - Helper functions (XSS protection, browser open)

**Data Flow:**

1. `docsCommand(options)` receives CLI options
2. Calls `generateVisualization(vizOptions)`
3. Loads manifest and catalog
4. Transforms skills into unified schema
5. Detects current IDE (if filtering)
6. Loads HTML template and CSS
7. Renders placeholders with data and JSON
8. Writes file
9. Optionally opens browser

## Future Enhancements

Potential improvements for future releases:

- [ ] Server-side rendering for initial page load
- [ ] Export to PDF
- [ ] Skill dependency graph visualization
- [ ] Integration with skill graph and ancestry
- [ ] Dark mode toggle
- [ ] Multi-language support
- [ ] Search by provides/requires
- [ ] Sort by stars, date, name
- [ ] Bulk install from documentation

---

**Related Documentation:**

- [CATALOG.md](./CATALOG.md) - Skill catalog system
- [IDEATION.md](./IDEATION.md) - Skill ideation workflow
- [API.md](./API.md) - Full command reference
