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
| `--use-ai` | Use AI analysis to detect project type and stack |
| `--provider <name>` | AI provider: `anthropic` or `openai` (default: anthropic) |
| `--api-key <key>` | API key for AI analysis |

**Example:**
```bash
# Standard scaffold
rosetta scaffold

# With AI analysis
rosetta scaffold --use-ai --provider anthropic

# With custom skills
rosetta scaffold --skills-dir ./company-skills
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

### `rosetta skills`

List all available skills.

**Usage:**
```bash
rosetta skills [options]
```

**Options:**
| Option | Description |
|---------|-------------|
| `--category <name>` | Filter by category (frontend, backend, testing) |

**Example:**
```bash
# List all skills
rosetta skills

# List frontend skills only
rosetta skills --category frontend
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

### v0.2.0 (Current)
- Added Codex CLI, Kilo Code, Continue.dev support
- New commands: add-ide, translate, translate-all
- Auto-detection of project type and tech stack
- Optional AI analysis with user's API tokens
- Modular architecture under lib/

### v0.1.x
- Initial release
- 6 IDEs supported
- Basic scaffolding and sync
