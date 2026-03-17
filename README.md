<div align="center">

```text
 ██████╗  ██████╗ ███████╗███████╗████████╗████████╗ █████╗
 ██╔══██╗██╔═══██╗██╔════╝██╔════╝╚══██╔══╝╚══██╔══╝██╔══██╗
 ██████╔╝██║   ██║███████╗█████╗     ██║      ██║   ███████║
 ██╔══██╗██║   ██║╚════██║██╔══╝     ██║      ██║   ██╔══██║
 ██║  ██║╚██████╔╝███████║███████╗    ██║      ██║   ██║  ██║
 ╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚══════╝    ╚═╝      ╚═╝   ╚═╝  ╚═╝
```

**Single source of truth for AI agent rules and engineering memory.**

<p align="center">
  <a href="https://github.com/RajanChavada/Rosetta/actions"><img src="https://img.shields.io/badge/version-0.3.3-blue.svg" alt="Version"></a>
  <a href="https://github.com/RajanChavada/Rosetta/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/RajanChavada/Rosetta"><img src="https://img.shields.io/badge/status-stable-green.svg" alt="Status"></a>
</p>

> **Single Source of Truth for AI Agents 🤖⚙️**

</div>

Rosetta is a CLI tool designed to help engineering teams maintain a consistent **Global Brain** for their AI agents (GitHub Copilot, Cursor, Windsurf, Claude Code, Codex CLI, Kilo Code, Continue.dev) across an entire repository.

Instead of duplicating instructions in every IDE-specific hidden file, you define your project's soul in `.ai/master-skill.md`. Rosetta then generates independent IDE wrappers that reference your project spec without using symlinks, ensuring maximum compatibility.

> **Status: v0.3.3** - Renamed to rosettablueprint and enhanced with catalog system, skill ideation, and translation commands.

## Installation

```bash
# Using npx (no installation required)
npx rosettablueprint scaffold

# Or install globally
npm install -g rosettablueprint
rosetta scaffold
```

---

## Quick Start

### 1. Initialize Rosetta
Run the following command in your project root to set up architecture:

```bash
npx rosettablueprint scaffold
```

**Scaffold Output:**
```text
* Scaffolding atlas-pay...
┣━ Context gathered OK
┣━ .ai/ brain created OK
┣━ 2 IDEs configured OK
┣━ 4 starter skills added OK
┗━ Memory initialized OK

New agentic structure created with preset: agentic-starter
```

### 2. Verify Your Brain
Once scaffolded, your project will have a structured context layer:

```text
.ai/
├── master-skill.md       <-- The Source of Truth
├── AGENT.md              <-- Agent-specific identity
├── task.md               <-- Current task tracking
├── memory/
│   ├── PROJECT_MEMORY.md <-- Long-lived architecture notes
│   └── AUTO_MEMORY.md    <-- Learned heuristics
└── logs/
    └── daily/            <-- Chronological logbook
```

---

## Supported IDEs

Rosetta supports 9 IDEs out of the box:

| IDE | Config File |
|-----|-------------|
| VSCode / Claude Code | `CLAUDE.md` |
| Cursor | `.cursorrules` |
| GitHub Copilot | `.github/copilot-instructions.md` |
| Windsurf | `.windsurf/rules/rosetta-rules.md` |
| Antigravity | `.agent/skills/project-skill.md` |
| GSD/generic | `skills/gsd-skill.md` |
| Codex CLI | `.codex/rules.md` |
| Kilo Code | `.kilo/rules.md` |
| Continue.dev | `.continue/config.md` |

---

## Why Rosetta?

Engineering memory usually answers "why was this built?" Rosetta answers "how should the agent help me built it right now?"

| Problem | Rosetta's Answer |
|---------|----------------|
| Fragmented IDE rules | One master spec synced to all wrappers |
| Agent "forgets" conventions | 3-layer memory (Project, Auto, Logs) |
| Root directory pollution | Centralized state in `.ai/` folder |
| Brittle symlinks | Independent markdown wrappers |
| Manual context gathering | Auto-detection of project type & stack |

---

## Core Commands

### Setup & Core Flow

**Scaffold** — Set up the `.ai/` directory and configure IDEs
```bash
rosetta scaffold
```


**Scaffold with Auto-Ideate** — Scaffold and automatically generate skill ideation template
```bash
rosetta scaffold --auto-ideate
```

The `--auto-ideate` flag automatically generates `.ai/skill-ideation-template.md` after scaffolding completes. This template contains project context and instructions for your IDE agent to help design custom skills tailored to your project.

**Sync** — Verify IDE wrappers or regenerate them from templates
```bash
rosetta sync --regenerate-wrappers
```

**Watch** — Monitor `.ai/master-skill.md` for changes
```bash
rosetta watch
```

### IDE Management

**Add IDE** — Add a new IDE to an existing Rosetta setup
```bash
rosetta add-ide codex
# or
rosetta add-ide kilo
# or
rosetta add-ide
# (interactive prompt)
```

**Translate** — Convert a config file between IDE formats
```bash
rosetta translate .cursorrules --to claude --output CLAUDE.md
```

**Translate All** — Bulk migrate all IDE configs to a target format
```bash
rosetta translate-all --to claude --dry-run  # Preview first
rosetta translate-all --to claude            # Execute
```

### Documentation

**Docs** — Generate HTML documentation for installed skills with interactive visualization
```bash
rosetta docs                    # Generate docs (default: .rosetta/docs/skills.html)
rosetta docs --open             # Generate and open in browser
rosetta docs --ide vscode       # Filter by specific IDE
rosetta docs --dry-run          # Preview without writing files
rosetta docs --json             # Output data as JSON
```

For more details, see [docs/VISUALIZATION.md](docs/VISUALIZATION.md).

### Skill Management

**New Skill** — Create a new stateless skill folder
```bash
rosetta new-skill api-auth
```

### Skill Commands

| Command | Description |
|---------|-------------|
| `rosetta catalog` | Browse the skill catalog to discover available skills |
| `rosetta search <query>` | Search skills by name, description, or tags (coming soon) |
| `rosetta install <git-url>` | Install a skill from a git repository |
| `rosetta skills` | List all installed skills |
| `rosetta skill uninstall <name>` | Uninstall an installed skill (planned) |

### Migration & Adoption

| Command | Description |
|---------|-------------|
| `migrate` | Interactive wizard for existing repos |
| `migrate --source <path>` | Migrate from a custom folder (e.g. `agentic-corder/`) |
| `migrate-from-cursor` | Convert `.cursorrules` to `.ai/` |
| `migrate-from-claude` | Convert `CLAUDE.md` to `.ai/` |

---

## Key Features

| Feature | Description |
|---------|-------------|
| **3-Layer Memory** | Project decisions, heuristics, and daily logs |
| **Multi-Source Skills** | Local, global (`~/.rosetta`), or git-sourced skills |
| **Auto-Detection** | Automatically detects project type and tech stack |
| **Format Translation** | Convert configs between any supported IDE format |
| **Config Driven** | Use `.rosetta.json` for non-interactive scaffolding |
| **Post-Scaffold Hooks** | Run scripts automatically after setup |

---

## Auto-Detection

Rosetta automatically detects your project type and tech stack:

**Supported Languages:**
- Node.js / TypeScript
- Python (Django, FastAPI, Flask)
- Go
- Rust
- Ruby

**Auto-Detected Information:**
- Project type (Web app, API, CLI, Library, etc.)
- Frontend framework (React, Next.js, Vue, etc.)
- Backend framework (Express, NestJS, Django, etc.)
- Database/ORM (Prisma, SQLAlchemy, TypeORM, etc.)

---


## Skills System

Rosetta implements a dual skills system to serve different purposes:

### Claude Code Skills (`.claude/skills/`)

Used **internally** for developing Rosetta CLI itself. These provide focused context loading for specific domains:

| Skill | Purpose |
|-------|---------|
| `frontend-context` | Frontend docs, styles, patterns |
| `backend-context` | Backend, API, domain logic |
| `testing-context` | Test strategy, fixtures, CI/CD |

Load via slash commands in Claude Code: `/frontend-context`, `/backend-context`, `/testing-context`

### Rosetta CLI Skills (`templates/skills/`)

Templates that Rosetta scaffolds into other projects:

| Skill | Stack | Domain |
|-------|-------|--------|
| `node-express-postgres` | Node.js, Express, PostgreSQL | Backend APIs |
| `frontend-react-next` | React, Next.js | Frontend apps |
| `testing-full-pyramid` | Testing frameworks | Quality assurance |
| `data-ml-project` | Data Science, ML | Analytics & ML |

### Skill Commands

```bash
# Generate skill ideation template (scaffold-only, no AI calls)
rosetta ideate

# List available skills
rosetta skills

# Create a new skill
rosetta new-skill api-auth

# Create from template
rosetta new-skill payment --template node-express-postgres
```

**See [docs/SKILLS.md](docs/SKILLS.md)** for complete documentation on the skills system.

---

## Skill Catalog

Rosetta provides a central **catalog** of curated skills that you can browse and install. The catalog is maintained in `catalog.json` and includes skills for various domains and tech stacks.

Use `rosetta catalog` to view all available skills. You can filter by domain using `--domain` and output raw JSON with `--json`.

```
rosetta catalog
rosetta catalog --domain backend
rosetta catalog --json
```

Full-text search across the catalog will be available in a future release with `rosetta search <query>`.

For more details, see [docs/CATALOG.md](docs/CATALOG.md).

## Smart Installation

Install skills directly from any Git repository with `rosetta install`. Rosetta validates the skill, records provenance, and tracks it in your manifest.

```bash
# Install a skill to the current project
rosetta install https://github.com/org/api-auth

# Install a skill globally (available in all projects)
rosetta install https://github.com/community/ppt-gen --global
```

**Installation features:**
- Validates the repository contains a `SKILL.md` file with required frontmatter (`name`, `description`)
- Checks skill name validity (lowercase alphanumeric and hyphens)
- Copies the skill to `.rosetta/skills/<name>` in your project (or `~/.rosetta/skills/` for global)
- Preserves the `.git` directory and adds an `upstream` remote pointing to the source repository
- Records installation details in `.rosetta/skills/manifest.json`, including source URL, commit hash, and install date
- Supports `--force` to overwrite an existing installation
- Supports `--dry-run` to preview changes

This provenance tracking enables safe updates and auditability.

## Skill Management

Manage your installed skills with the following commands:

- **List skills:** `rosetta skills` shows all installed skills with details (name, source, scope, install date, commit).
  ```
  rosetta skills
  rosetta skills --format json   # Machine-readable output
  rosetta skills --scope global  # Filter by scope
  ```

- **Uninstall a skill:** (coming soon) Use `rosetta skill uninstall <name>` to remove an installed skill and update the manifest.

For more information on skill management, see [docs/SKILLS.md](docs/SKILLS.md).

---

## Ideation

Generate a skill ideation template to use in your IDE agent:

```bash
rosetta ideate [project-path]
```

This command analyzes your project and creates `.ai/skill-ideation-template.md` with context about your codebase. You then paste this template into your IDE's AI agent (Claude Code, Cursor, etc.) and answer 3–5 clarifying questions to receive personalized skill proposals.

**Key features:**

- **No AI calls** from the CLI - pure scaffolding
- **Project analysis** - detects languages, frameworks, tests, architecture
- **IDE detection** - auto-detects configured IDEs and skills folder locations
- **Team context** - prompts for team conventions and domain knowledge
- **IDE-agnostic** - works with any AI agent in your editor
- **Interactive** - AI agent asks questions and drafts skills live
- **Controlled** - you review and approve each skill before implementation

**Example workflow:**

```bash
# Generate template in current project
rosetta ideate

# Open the generated file and paste into your IDE agent
# Answer the questions to get skill proposals
# Approve and implement the skills you want
```

**Options:**

- `--output <path>` - Save template to custom location (default: `.ai/skill-ideation-template.md`)
- `--dry-run` - Preview analysis without writing files
- `--json` - Output analysis results in JSON format
- `--area <path>` - Analyze a specific directory (default: current)

**Detected IDEs:**
The command automatically detects IDE configurations:
- **Claude Code** - `.claude/skills/` folder
- **Cursor** - `.cursorrules` file
- **GitHub Copilot** - `.github/copilot-instructions.md`
- **Windsurf** - `.windsurf/` directory
- **Codex CLI** - `.agent/` directory

**Team Context:**
When no IDEs are detected, the command prompts for:
- Team domain or industry
- Team conventions to follow
- Existing skills to consider

**Detailed guide:** See [docs/IDEATION.md](docs/IDEATION.md)

---

## Health & Validation

Check if repository is "Rosetta-compliant" and compute a health score.

```bash
rosetta health
```

**Health Check Output:**
```text
Validating Rosetta structure...
┣━ .ai/master-skill.md OK
┣━ .ai/AGENT.md OK
┣━ .ai/task.md OK
┣━ .ai/memory/PROJECT_MEMORY.md OK
┣━ .ai/memory/AUTO_MEMORY.md OK
┗━ .ai/logs/daily/ OK

Rosetta Score: 100/100
Your repo is 100% Rosetta-ready!
```

---

## Profiles

Use profiles to bundle context, presets, and preferences:

```bash
# Create or switch to a profile
rosetta use-profile fintech

# Define in ~/.rosetta/registry.json:
{
  "profiles": {
    "fintech": {
      "riskLevel": "High (Critical/Financial/Healthcare)",
      "testingSetup": "Unit + integration + E2E",
      "agentStyle": "More autonomous"
    }
  }
}
```

---


## Architecture

Rosetta is now modular with a clean architecture:

```
lib/
├── constants.js           # Configuration constants
├── utils.js              # Utility functions
├── config.js             # Config & profile management
├── templates.js          # Template rendering
├── ide-adapters.js       # IDE sync logic
├── context.js            # Context gathering & auto-detection
├── skills.js             # Skill management
├── migration.js          # Migration tools
├── validation.js         # Health & validation
├── cli-helpers.js       # CLI flow helpers
├── commands/
│   ├── add-ide.js       # Add IDE command
│   ├── translate.js      # Format translation
│   ├── translate-all.js  # Bulk translation
│   └── ideate.js        # Skill ideation command
├── translators/
│   └── base.js         # Translation engine
```

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

**Security issues**: Email security@rosetta.ai.

---

## License

MIT © [Rajan Chavada](https://github.com/RajanChavada)
