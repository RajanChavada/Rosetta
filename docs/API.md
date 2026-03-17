# Rosetta CLI API Reference

Complete command reference for Rosetta v0.3.0.

## Installation

```bash
# NPM
npm install -g @rosetta/cli

# NPX (no install)
npx @rosetta/cli <command>

# Local dev
node ./cli.js <command>
```

## Global Options

| Option | Description |
|---------|-------------|
| `-V, --version` | Output version number |
| `-h, --help` | Display help for command |

---

## Core Commands

### `rosetta scaffold`

Initialize Rosetta in a new project.

**Usage:**
```bash
rosetta scaffold [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--skills-dir <path>` | Path to local skills directory |
| `--skills-repo <url>` | URL to git repo with skills |
| `--dry-run` | Show what would be created without writing files |
| `--auto-ideate` | Automatically run skill ideation after scaffolding |
| `--ideate-output <path>` | Custom output path for ideation template (requires `--auto-ideate`) |
| `--use-ai` | Use AI analysis to detect project type and stack (deprecated) |
| `--provider <name>` | AI provider: `anthropic` or `openai` (default: anthropic, deprecated) |
| `--api-key <key>` | API key for AI analysis (deprecated) |

**Example:**
```bash
# Standard scaffold
rosetta scaffold

# With auto-ideation (generate skill template)
rosetta scaffold --auto-ideate

# With custom output for ideation template
rosetta scaffold --auto-ideate --ideate-output ./my-skill-template.md

# With custom skills
rosetta scaffold --skills-dir ./company-skills

# Dry-run preview
rosetta scaffold --dry-run
```

---

### `rosetta sync`

Verify or regenerate IDE wrappers.

**Usage:**
```bash
rosetta sync [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `-r, --regenerate-wrappers` | Regenerate IDE wrapper files from templates |
| `--dry-run` | Show what would be changed without writing files |

**Example:**
```bash
# Verify only
rosetta sync

# Regenerate all wrappers
rosetta sync --regenerate-wrappers

# Dry-run preview
rosetta sync --regenerate-wrappers --dry-run
```

---

### `rosetta watch`

Watch `.ai/master-skill.md` for changes.

**Usage:**
```bash
rosetta watch
```

**Behavior:** Logs change events but does not modify files (IDEs reference master directly).

---

### `rosetta rescaffold`

Selectively re-scaffold parts of Rosetta setup.

**Usage:**
```bash
rosetta rescaffold <type> [options]
```

**Types:**
| Type | Description |
|------|-------------|
| `memory` | Re-scaffold `.ai/memory/*` files if missing |
| `ides` | Re-scaffold IDE wrappers from templates |
| `all` | Re-scaffold everything (except master-skill.md) |

**Options:**
| Option | Description |
|---------|-------------|
| `--dry-run` | Show what would be changed without writing files |

**Example:**
```bash
# Re-scaffold memory only
rosetta rescaffold memory

# Re-scaffold all
rosetta rescaffold all --dry-run
```

---

## Skill Ideation

### `rosetta ideate`

Generate a skill ideation template by analyzing your project structure. This command analyzes dependencies, code patterns, directory structure, and conventions to create a structured template that your IDE agent can use to design custom skills tailored to your project.

**Usage:**
```bash
rosetta ideate [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `-a, --area <path>` | Directory to analyze (default: current directory) |
| `-o, --output <path>` | Output file path (default: `.ai/skill-ideation-template.md`) |
| `--dry-run` | Show analysis results without generating template |
| `--json` | Output analysis as JSON instead of markdown template |
| `--verbose` | Show detailed analysis logs |

**Example:**
```bash
# Generate ideation template
rosetta ideate

# Analyze specific directory
rosetta ideate --area ./my-project

# Custom output location
rosetta ideate --output ./ideation.md

# Preview analysis as JSON
rosetta ideate --dry-run --json

# Verbose logging
rosetta ideate --verbose
```

**Output:**
The command creates a markdown template containing:
- Project context (languages, frameworks, dependencies)
- Detected architecture patterns
- IDE-specific instructions
- Team context questions (if interactive)
- Recommendations for skill design

**Workflow:**
1. Run `rosetta ideate` to generate the template
2. Fill in team-specific context in the template
3. Paste the completed template into your IDE agent
4. The agent proposes skill designs based on the context
5. Review and refine the proposed skills

---

## Migration Commands

### `rosetta migrate`

Interactive migration wizard for existing repos.

**Usage:**
```bash
rosetta migrate [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--source <path>` | Custom folder or file to migrate from |

**Example:**
```bash
# Interactive
rosetta migrate

# From custom source
rosetta migrate --source ../agentic-corder/
```

---

### `rosetta migrate-from-cursor`

Convert `.cursorrules` into `.ai/master-skill.md`.

**Usage:**
```bash
rosetta migrate-from-cursor
```

---

### `rosetta migrate-from-claude`

Convert `CLAUDE.md` into `.ai/` structure.

**Usage:**
```bash
rosetta migrate-from-claude
```

---

## New Commands

### `rosetta add-ide`

Add a new IDE to an existing Rosetta setup.

**Usage:**
```bash
rosetta add-ide [name] [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `[name]` | IDE name (codex, kilo, continue, claude, cursor, copilot, windsurf, antigravity, gsd) |

**Options:**
| Option | Description |
|---------|-------------|
| `--dry-run` | Show what would be created without writing files |

**Example:**
```bash
# Add specific IDE
rosetta add-ide codex

# Interactive selection
rosetta add-ide

# Dry-run preview
rosetta add-ide kilo --dry-run
```

---

### `rosetta translate`

Translate a configuration file between IDE formats.

**Usage:**
```bash
rosetta translate <file> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<file>` | Input file to translate |

**Options:**
| Option | Description |
|---------|-------------|
| `--from <format>` | Source format (auto-detected if not specified) |
| `--to <format>` | Target format (required) |
| `-o, --output <path>` | Output file path |
| `--dry-run` | Show what would be written without creating files |

**Supported Formats:**
- `cursor` / `cursorrules`
- `claude` / `claude-code` / `anthropic`
- `copilot` / `github-copilot`
- `windsurf`
- `codex`
- `kilo`
- `continue` / `continue-dev`
- `antigravity`
- `gsd`

**Example:**
```bash
# Convert Cursor to Claude
rosetta translate .cursorrules --to claude

# With custom output
rosetta translate CLAUDE.md --to cursor --output .cursorrules

# Dry-run preview
rosetta translate .github/copilot-instructions.md --to windsurf --dry-run
```

---

### `rosetta translate-all`

Bulk migrate all existing IDE configs to a target format.

**Usage:**
```bash
rosetta translate-all [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--to <format>` | Target format (required) |
| `--dry-run` | Show what would be done without creating files |
| `--confirm` | Skip confirmation prompt |

**Example:**
```bash
# Preview conversion
rosetta translate-all --to claude --dry-run

# Execute with confirmation
rosetta translate-all --to codex

# Execute without confirmation
rosetta translate-all --to continue --confirm
```

---

## Validation Commands

### `rosetta validate`

Check `.ai/` structure for completeness.

**Usage:**
```bash
rosetta validate
```

**Output:**
```
● Validating Rosetta structure...
┣━ .ai/master-skill.md ✓
┣━ .ai/AGENT.md ✓
┣━ .ai/task.md ✓
┣━ .ai/memory/PROJECT_MEMORY.md ✓
┣━ .ai/memory/AUTO_MEMORY.md ✓
┗━ .ai/logs/daily/ ✓

Rosetta Score: 100/100
```

---

### `rosetta health`

Report "Rosetta Score" and repository health.

**Usage:**
```bash
rosetta health
```

**Score Interpretation:**
| Score | Meaning |
|-------|---------|
| 100 | Fully Rosetta-ready |
| 81-99 | Minor gaps |
| 0-80 | Needs attention |

---

### `rosetta audit`

Alias for `rosetta health`.

**Usage:**
```bash
rosetta audit
```

---

### `rosetta sync-memory`

Rotate old logs and summarize progress to AUTO_MEMORY.md.

**Usage:**
```bash
rosetta sync-memory
```

**Behavior:**
- Rotates logs older than 7 days to `.ai/logs/archive/`
- Summarizes logs to `.ai/memory/AUTO_MEMORY.md`

---

## Session Management Commands

### `rosetta plan`

Display the current development plan and session state.

**Usage:**
```bash
rosetta plan
```

**Output:** Shows goals, active tasks, decisions, and session handoff information from PLAN.md.

---

### `rosetta edit-plan`

Edit the current development plan interactively.

**Usage:**
```bash
rosetta edit-plan
```

**Behavior:** Opens PLAN.md in your default editor for editing.

---

### `rosetta todo`

Display the current TODO list.

**Usage:**
```bash
rosetta todo
```

**Output:** Shows actionable items from TODO.md with completion status.

---

### `rosetta edit-todo`

Edit the TODO list interactively.

**Usage:**
```bash
rosetta edit-todo
```

**Behavior:** Opens TODO.md in your default editor for editing.

---

### `rosetta status`

Show current session state (plan and TODO).

**Usage:**
```bash
rosetta status
```

**Output:**
```
📋 Session State

Plan:
  Goals: 2/3
  Active Tasks: 1/4
  Decisions: 5

TODO:
  Progress: 3/8 completed
```

---

### `rosetta compact`

Compact session into PLAN.md (run when context at 60-70%).

**Usage:**
```bash
rosetta compact
```

**Behavior:** Summarizes the current session into PLAN.md's "Session Handoff" section and compacts context to preserve the plan and active files.

---

## Subagent Commands

### `rosetta agent <name> [args...]`

Execute a subagent for exploration or analysis.

**Usage:**
```bash
rosetta agent <name> [args...]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Subagent name |
| `[args...]` | Optional arguments for the subagent |

**Options:**
| Option | Description |
|---------|-------------|
| `--area <name>` | Work area to focus (default: all) |

**Available Subagents:**
| Name | Purpose |
|------|---------|
| `explore-codebase` | Repository scanning and pattern finding |
| `security-review` | Security and dependency analysis |

**Example:**
```bash
# Explore codebase
rosetta agent explore-codebase

# Run security review
rosetta agent security-review

# Focus on specific area
rosetta agent explore-codebase --area lib
```

---

### `rosetta agents`

List available subagents.

**Usage:**
```bash
rosetta agents
```

**Output:**
```
🤖 Available Subagents

  explore-codebase: Repository scanning and pattern finding (configured)
  security-review: Security and dependency analysis (configured)
```

---

## Skill Commands

### `rosetta catalog`

Browse the skill catalog to discover available skills.

**Usage:**
```bash
rosetta catalog [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--domain <domain>` | Filter by domain(s), comma-separated (e.g., `backend,api`) |
| `--limit <n>` | Limit number of results |
| `--json` | Output as JSON |
| `--dry-run` | Preview without writing (no effect for catalog) |

**Example:**
```bash
# List all catalog skills
rosetta catalog

# Filter by domain
rosetta catalog --domain backend

# Filter by multiple domains
rosetta catalog --domain "backend,api"

# Limit results
rosetta catalog --limit 10

# JSON output
rosetta catalog --json
```

---

### `rosetta install <git-url>`

Install a skill from a git repository.

**Usage:**
```bash
rosetta install <git-url> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<git-url>` | Git repository URL (HTTPS or SSH) |

**Options:**
| Option | Description |
|---------|-------------|
| `--name <name>` | Override skill name (default: derived from repo) |
| `--branch <branch>` | Checkout specific branch (default: main) |
| `--dry-run` | Preview installation without writing files |
| `--global` | Install to global ~/.rosetta/skills instead of project |

**Example:**
```bash
# Install from GitHub
rosetta install https://github.com/rosetta-ai/node-express-postgres

# Install with custom name
rosetta install git@github.com:custom/auth-skill.git --name custom-auth

# Dry-run preview
rosetta install https://github.com/example/skill --dry-run
```

**Behavior:**
- Clones the repository to `.rosetta/skills/` (or global location)
- Adds entry to `~/.rosetta/skills-manifest.json`
- Validates skill structure (SKILL.md present)
- Supports any git repository with proper skill format

---

### `rosetta skills`

List installed skills with status and details.

**Usage:**
```bash
rosetta skills [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--format <type>` | Output format: `table` or `json` (default: table) |
| `--scope <scope>` | Filter by scope: `global`, `project`, or `all` (default: all) |

**Example:**
```bash
# List all skills (default)
rosetta skills

# JSON output
rosetta skills --format json

# List global skills only
rosetta skills --scope global

# List project skills only
rosetta skills --scope project
```

**Output:**
```
Installed Skills:
  node-express-postgres (v1.2.0)
    Status: installed
    Path: .rosetta/skills/node-express-postgres
    Domains: backend, api
    IDE compatibility: vscode, cursor, claude-code

  react-component-generator (v0.5.0)
    Status: user-created
    Path: skills/react-component-generator
    Domains: frontend
    IDE compatibility: vscode
```

---

### `rosetta skill uninstall <name>`

Uninstall an installed skill.

**Usage:**
```bash
rosetta skill uninstall <name> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Skill name to uninstall |

**Options:**
| Option | Description |
|---------|-------------|
| `--global` | Uninstall from global skills directory |
| `--purge` | Also delete skill files (default: keep files) |

**Example:**
```bash
# Uninstall from project
rosetta skill uninstall old-skill

# Uninstall globally and delete files
rosetta skill uninstall legacy-skill --global --purge
```

**Behavior:**
- Removes entry from `skills-manifest.json`
- By default, keeps skill files (use `--purge` to delete)
- Cannot uninstall built-in template skills

---

### `rosetta skill <name>`

Load a specific skill for focused context.

**Usage:**
```bash
rosetta skill <name>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Skill name to load |

**Example:**
```bash
rosetta skill frontend-context
rosetta skill backend-context
rosetta skill testing-context
```

---

### `rosetta new-skill`

Create a new skill folder with SKILL.md and tests/prompts.md boilerplates.

**Usage:**
```bash
rosetta new-skill <name> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Skill name |

**Options:**
| Option | Description |
|---------|-------------|
| `--template <name>` | Clone an existing skill template |
| `--skills-dir <path>` | Path to local skills directory |
| `--skills-repo <url>` | URL to git repo with skills |

**Example:**
```bash
# Create boilerplate
rosetta new-skill api-auth

# From template
rosetta new-skill payment --template stripe-integration
```

---

## Documentation Commands

### `rosetta docs`

Generate HTML documentation for installed skills with interactive visualization.

**Usage:**
```bash
rosetta docs [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `-o, --output <path>` | Output file path (default: `.rosetta/docs/skills.html`) |
| `--ide <name>` | Filter by specific IDE (auto-detected if omitted) |
| `--open` | Open in browser after generation |
| `--quiet` | Suppress output |
| `--dry-run` | Preview generation without writing files |
| `--json` | Output data as JSON instead of HTML |

**Example:**
```bash
# Generate HTML docs
rosetta docs

# Generate and open in browser
rosetta docs --open

# Generate with specific IDE filter
rosetta docs --ide vscode

# Custom output path
rosetta docs --output ./my-docs.html

# Preview without writing
rosetta docs --dry-run

# Get data as JSON
rosetta docs --json
```

**Output:**
Creates an interactive HTML file with:
- Responsive card-based layout of all skills
- Search and filter functionality
- IDE compatibility filtering
- Skill details (provides, requires, tags, repository link)
- Statistics sidebar (total, installed, available, domains)
- Click-to-expand cards for more information

**Features:**
- FastAPI-style design with clean typography
- Client-side JavaScript for instant search/filter
- Cross-platform browser support
- Auto-detects current IDE from `.ai/master-skill.md`

---

## Profile Commands

### `rosetta use-profile`

Switch to a specific Rosetta profile.

**Usage:**
```bash
rosetta use-profile <name>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Profile name |

**Example:**
```bash
rosetta use-profile fintech
rosetta use-profile startup
```

---

## Registry Commands

### `rosetta search`

Search for presets or skills in the registry.

**Usage:**
```bash
rosetta search <type> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<type>` | Type to search: `presets` or `skills` |

**Options:**
| Option | Description |
|---------|-------------|
| `--domain <domain>` | Filter by domain (e.g., financial, devops) |

**Example:**
```bash
# Search all presets
rosetta search presets

# Search by domain
rosetta search skills --domain financial
```

---

### `rosetta install-preset`

Install a preset from the registry into `.ai/master-skill.md`.

**Usage:**
```bash
rosetta install-preset <name>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Preset name (e.g., `@acme/fintech-agentic`) |

**Example:**
```bash
rosetta install-preset @acme/fintech-agentic
```

---

### `rosetta install-skill`

Install a skill from the registry into `skills/`.

**Usage:**
```bash
rosetta install-skill <name>
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Skill name (e.g., `@acme/k8s-manifests`) |

**Example:**
```bash
rosetta install-skill @acme/k8s-manifests
```

---

## Interactive Mode

### `rosetta interactive`

Run Rosetta in interactive mode (default command).

**Usage:**
```bash
rosetta interactive [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--skills-dir <path>` | Path to local skills directory |
| `--skills-repo <url>` | URL to git repo with skills |

**Flow:**
1. Detect repository state
2. Present action menu
3. Execute selected action

**Actions:**
- Scaffold new agentic coding setup
- Verify/Sync existing multi-IDE setup
- Migrate existing agent files and add new IDEs
- Start watch mode

---

## Environment Variables

| Variable | Description |
|-----------|-------------|
| `ANTHROPIC_API_KEY` | Anthropic API key for AI analysis |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis |

---

## Configuration Files

### `.rosetta.json`

Project-level configuration.

```json
{
  "autoContext": {
    "enabled": true
  },
  "context": {
    "projectName": "My Project",
    "projectType": "Web app",
    "teamSize": "Small team (2–5)"
  },
  "skills": {
    "alwaysInclude": ["node-express-postgres"]
  },
  "defaultIdes": ["VSCode / Claude Code", "Cursor"],
  "defaultPreset": "agentic-starter",
  "postScaffoldHooks": ["npm install", "npm run format"]
}
```

### `~/.rosetta/registry.json`

Registry with presets and skills.

```json
{
  "presets": [
    {
      "name": "@acme/fintech-agentic",
      "domain": "financial",
      "description": "Fintech preset with compliance rules.",
      "url": "https://..."
    }
  ],
  "skills": [
    {
      "name": "@acme/k8s-manifests",
      "domain": "devops",
      "description": "Kubernetes manifest generation.",
      "url": "https://..."
    }
  ],
  "profiles": {
    "fintech": {
      "riskLevel": "High (Critical/Financial/Healthcare)",
      "testingSetup": "Unit + integration + E2E"
    }
  }
}
```

### `~/.rosetta/active-profile.json`

Active profile selection.

```json
{
  "active": "fintech"
}
```

### `~/.rosetta/config.json`

AI API keys (optional).

```json
{
  "anthropicApiKey": "sk-ant-...",
  "openaiApiKey": "sk-..."
}
```

---

## Exit Codes

| Code | Description |
|------|-------------|
| 0 | Success |
| 1 | Error (invalid command, file not found, etc.) |

---

## Version History

### v0.4.0 (Current)
- HTML documentation visualization (`rosetta docs`)
- FastAPI-style interactive HTML docs
- Client-side search and filter
- IDE context awareness
- Expanded tech stack detection (in progress)
- OpenClaw integration (planned)
- Comprehensive migration system (planned)
- Smart skill suggestions (planned)

### v0.3.0
- Skill catalog system (`rosetta catalog`, `rosetta search`)
- Smart install from git (`rosetta install <git-url>`)
- Skills management (`rosetta skills`, `rosetta skill uninstall`)
- Skills manifest tracking (`~/.rosetta/skills-manifest.json`)
- Git-based installation with auto-validation
- 15+ starter skills in catalog

### v0.2.0
- Added Codex CLI, Kilo Code, Continue.dev support
- New commands: `add-ide`, `translate`, `translate-all`
- Auto-detection of project type and tech stack
- Optional AI analysis with user's API tokens (deprecated)
- Modular architecture under `lib/`

### v0.1.x
- Initial release
- 6 IDEs supported
- Basic scaffolding and sync
