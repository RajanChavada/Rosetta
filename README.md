# Rosetta: Zero-Config AI Agent Memory

**One command → Rules injected → Start chatting.**

Rosetta is a CLI tool that builds a **Global Brain** for your project. It automatically detects your stack, initializes a 3-layer memory system, and translates your conventions into native rules for any IDE (Claude Code, Cursor, Windsurf, Copilot, and more).

> **The Rosetta Story:** You shouldn't have to learn how `.cursorrules` or `CLAUDE.md` work. Run `rosetta scaffold` and your AI agent instantly becomes a senior engineer on your specific codebase.

<a href="https://github.com/RajanChavada/RajanChavada/Rosetta/actions"><img src="https://img.shields.io/badge/version-0.5.0-blue.svg" alt="Version"></a>
<a href="https://github.com/RajanChavada/Rosetta/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
<a href="https://github.com/RajanChavada/Rosetta"><img src="https://img.shields.io/badge/status-stable-green.svg" alt="Status"></a>

---

## 60-Second Quick Start

Get your project AI-ready in one step:

```bash
npx rosettablueprint scaffold --auto-ideate
```

**What happens next:**
1. **Detection:** Rosetta identifies your frameworks, languages, and test setup.
2. **Brain Creation:** A structured `.ai/` directory is created (Memory, Logs, Master Spec).
3. **IDE Sync:** Native rules are written to your editor (e.g., `.cursor/rules/` or `CLAUDE.md`).
4. **Ideation:** A framed prompt is **copied to your clipboard**.
5. **Chat:** Paste into your AI chat, answer 3 questions, and get custom skills implemented.

---

## Supported IDEs

Rosetta supports 10 IDEs out of the box with **Automated Translation**:

| IDE | Config File | Skill Path | Invocation |
|-----|-------------|------------|------------|
| VSCode / Claude Code | `CLAUDE.md` | `.claude/skills/{name}/SKILL.md` | `/skill-name` |
| Cursor | `.cursor/rules/*.mdc` | `.cursor/rules/{name}.mdc` | `@skill-name` |
| GitHub Copilot | `.github/copilot-instructions.md` | `.github/skills/{name}.md` | — |
| Replit | `replit.md` | — | — |
| Windsurf | `.windsurf/rules/rosetta-rules.md` | `.windsurf/rules/{name}.md` | `@skill-name` |
| Antigravity | `.agent/skills/project-skill.md` | `.agent/skills/{name}/SKILL.md` | — |
| GSD/generic | `skills/gsd-skill.md` | `skills/` | — |
| Codex CLI | `.codex/rules.md` | `.agents/skills/{name}/SKILL.md` | auto-detected |
| Kilo Code | `.kilo/rules.md` | `.kilo/rules/{name}.md` | — |
| Continue.dev | `.continue/config.md` | `.continue/rules/{name}.md` | — |

> **Note:** `.cursorrules` is still supported as a legacy fallback but `.cursor/rules/*.mdc` is the modern convention.

---

## Why Rosetta?

Engineering memory usually answers "why was this built?" Rosetta answers "how should the agent help me build it right now?"

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


The `scaffold` command detects your project stack (Next.js, React Vite, FastAPI, etc.) and generates appropriate IDE configuration files (`CLAUDE.md`, `.cursor/rules/*.mdc`, etc.).

**Options:**
- `--yes` - Skip all interactive prompts, use defaults (for CI/CD automation)
- `--ide <name>` - Specify IDE(s) to generate (for example: `claude`, `vscode`, `cursor`, `windsurf`, `copilot`, `antigravity`, `replit`)
- `--stack <stack>` - Override detected stack (for example: `next.js`, `react-vite`, `node-api`)
- `--dry-run` - Preview what would be generated without writing files

**Examples:**
```bash
rosetta init                    # Interactive: detect stack, select IDEs, confirm
rosetta init --yes              # Non-interactive: use detected stack, defaults
rosetta init --ide claude --ide windsurf  # Generate for specific IDEs
rosetta init --stack node-api --ide vscode --ide copilot
rosetta init --dry-run          # Preview without writing
```
**Scaffold with Auto-Ideate** (Recommended)
```bash
rosetta scaffold --auto-ideate
```

The `--auto-ideate` flag analyzes your project and automatically **copies a framing prompt to your clipboard**. Paste this into your AI agent to start a guided workshop that implements custom skills for your codebase.

## Core Commands

### Setup & Core Flow

**Scaffold** — Full zero-config setup (Brain + Memory + IDE Configs)
```bash
rosetta scaffold
```
The `scaffold` command detects your stack, initializes the `.ai/` directory, creates your 3-layer memory system, and generates native IDE rules (CLAUDE.md, .cursor/rules/, etc.).
*Note: `rosetta init` is an alias for `scaffold`.*

**Options:**
- `--yes` - Skip all prompts, use defaults
- `--auto-ideate` - Generate ideation template and copy to clipboard (Recommended)
- `--ide <name>` - Specify IDE(s) to generate (e.g. `claude`, `cursor`, `windsurf`)
- `--stack <stack>` - Override detected stack (e.g. `next.js`, `react-vite`, `node-api`)

**Sync** — Verify IDE wrappers or regenerate them from templates
```bash
rosetta sync --regenerate-wrappers
```
Regenerates IDE configuration files from `.ai/master-skill.md`. Use this if your wrappers get out of sync or if you manually edit the master spec.

**Watch** — Monitor `.ai/master-skill.md` and auto-regenerate all IDE wrappers on change
```bash
rosetta watch
```
On each save, Rosetta regenerates IDE configuration files with a 300ms debounce. On startup, it reports the status of each IDE wrapper file.

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

### Agent & Persona Systems

**Agent** — Scaffold and add a sub-agent definition interactively

```bash
rosetta agent architect
rosetta agent reviewer --ide cursor
rosetta agent  # Interactive selection
```

**Persona** — Inject preset conventions into project and agents

```bash
rosetta persona standard
rosetta persona senior
rosetta persona frontend
```

**Workflow** — Define multi-step agentic task chains

```bash
rosetta workflow refactor-auth
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
| `rosetta search <query>` | Search skills by name, description, or tags |
| `rosetta install <git-url>` | Install a skill from a git repository |
| `rosetta skills` | List all installed skills |
| `rosetta uninstall <name>` | Uninstall an installed skill |

### Catalog and Installation

**Catalog** — Browse available skills in the catalog
```bash
rosetta catalog
# Filter by category
rosetta catalog --category development
# Filter by tag
rosetta catalog --tag testing
```

**Search** — Find skills in the catalog
```bash
rosetta search "react"      # Search by name
rosetta search "api"        # Search in description
rosetta search "testing"    # Search by tag
```

**Install** — Install a skill from a git repository
```bash
rosetta install https://github.com/example/react-skill.git
rosetta install ./local-skill-repo  # Install from local path
rosetta install https://github.com/example/skill.git --dry-run  # Preview installation
```

**Skills** — List installed skills
```bash
rosetta skills                    # List all skills
rosetta skills --global          # List global skills only
rosetta skills --project         # List project skills only
rosetta skills --category frontend  # Filter by category
```

**Uninstall** — Remove an installed skill
```bash
rosetta uninstall react-skill
rosetta uninstall react-skill --purge    # Also delete all skill files (including translated IDE copies)
rosetta uninstall api-server --confirm    # Skip confirmation
```

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
| **Skill Catalog** | Browse, search, and install pre-built skills from the catalog |
| **Multi-Source Skills** | Local, global (`~/.rosetta`), or git-sourced skills |
| **Auto-Detection** | Automatically detects project type and tech stack |
| **Format Translation** | Convert configs between any supported IDE format |
| **YAML-First Config** | Strongly typed, schema-validated `.rosetta` configuration |
| **Agent / Persona** | Scaffolding tools for interactive sub-agents and conventions |
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
- Frontend framework (React, Next.js, Vue, React Vite)
- Backend framework (Express, NestJS, Django, FastAPI, Flask, Node API)
- Database/ORM (Prisma, SQLAlchemy, TypeORM, etc.)
- **Cloud Infrastructure**: Docker, Kubernetes, Terraform, Serverless, Cloud SDKs (AWS, GCP, Azure)
- **Mobile Development**: iOS (Swift), Android, Flutter, React Native
- **DevOps & CI/CD**: GitHub Actions, GitLab CI, CircleCI, Jenkins, Make

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

Templates that Rosetta scaffolds into other projects. When installed or created on a multi-IDE project, skills are automatically **translated** into each IDE's native format:

| Skill | Stack | Domain |
|-------|-------|--------|
| `node-express-postgres` | Node.js, Express, PostgreSQL | Backend APIs |
| `frontend-react-next` | React, Next.js | Frontend apps |
| `testing-full-pyramid` | Testing frameworks | Quality assurance |
| `data-ml-project` | Data Science, ML | Analytics & ML |

### Invocation Translation

When you run `rosetta new-skill` or `rosetta install`, Rosetta translates each skill into the native format for every detected IDE:

| IDE | File Extension | Frontmatter | Invocation |
|-----|---------------|-------------|------------|
| Claude Code | `.md` (SKILL.md in directory) | `name`, `description` | `/skill-name` |
| Cursor | `.mdc` | `description`, `globs`, `alwaysApply` | `@skill-name` |
| Windsurf | `.md` | `trigger`, `description` | `@skill-name` |
| Codex CLI | `.md` (SKILL.md in directory) | `name`, `description` | auto-detected |

This eliminates the need to manually maintain separate skill files per IDE.

---

## Skill Catalog

Rosetta provides a central **catalog** of curated skills that you can browse and install. The catalog is maintained in `catalog.json` and includes skills for various domains and tech stacks.

Use `rosetta catalog` to view all available skills. You can filter by domain using `--domain` and output raw JSON with `--json`.

```
rosetta catalog
rosetta catalog --domain backend
rosetta catalog --json
```

Search across the catalog by name, description, or tags with `rosetta search <query>`.

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
- **Automatically translates** skills into each detected IDE's native format (frontmatter, path, file extension)
- Copies the skill to `.rosetta/skills/<name>` in your project (or `~/.rosetta/skills/` for global)
- Preserves the `.git` directory and adds an `upstream` remote pointing to the source repository
- Records installation details in `.rosetta/skills/manifest.json`, including source URL, commit hash, install date, and all translated paths
- Supports `--force` to overwrite an existing installation
- Supports `--ide <name>` to install for a single specific IDE
- Supports `--dry-run` to preview changes

**Multi-IDE output example:**
```
✓ Installed skill: api-auth
  Claude Code  → .claude/skills/api-auth/SKILL.md    (invoke: /api-auth)
  Cursor       → .cursor/rules/api-auth.mdc           (invoke: @api-auth)
  Windsurf     → .windsurf/rules/api-auth.md          (invoke: @api-auth)
```

## Skill Management

Manage your installed skills with the following commands:

- **List skills:** `rosetta skills` shows all installed skills with details (name, source, scope, install date, commit).
  ```
  rosetta skills
  rosetta skills --format json   # Machine-readable output
  rosetta skills --scope global  # Filter by scope
  ```

- **Uninstall a skill:** Use `rosetta uninstall <name>` to remove an installed skill and update the manifest.

For more information on skill management, see [docs/SKILLS.md](docs/SKILLS.md).

---

## Ideation

Generate a skill ideation template and copy it to your clipboard, ready to paste into your AI agent:

```bash
rosetta ideate [project-path]
```

This command analyzes your project, generates `.ai/skill-ideation-template.md`, wraps it in a framing prompt, and copies it to your clipboard. Paste it directly into Claude Code, Cursor, or any AI agent to start a guided skill design workshop.

**Key features:**

- **Clipboard auto-copy** — framing prompt + template copied automatically
- **Project analysis** — detects languages, frameworks, tests, architecture
- **IDE detection** — auto-detects configured IDEs and skills folder locations
- **Framing prompt** — AI agent receives proper context and asks 3-5 clarifying questions
- **IDE-agnostic** — works with any AI agent in your editor

**Example workflow:**

```bash
# Generate template and copy to clipboard
rosetta ideate

# Paste into your AI agent (Cmd+V / Ctrl+V)
# Answer the clarifying questions
# Approve and implement the skills
```

**Options:**

- `--output <path>` — Save template to custom location (default: `.ai/skill-ideation-template.md`)
- `--no-clipboard` — Skip clipboard copy (for CI/scripting)
- `--dry-run` — Preview analysis without writing files
- `--json` — Output analysis results in JSON format
- `--area <path>` — Analyze a specific directory (default: current)

**Detected IDEs:**
The command automatically detects IDE configurations:
- **Claude Code** — `.claude/` directory
- **Cursor** — `.cursor/` directory or `.cursorrules` file
- **GitHub Copilot** — `.github/copilot-instructions.md`
- **Windsurf** — `.windsurf/` directory
- **Codex CLI** — `.agents/` or `.codex/` directory

**Team Context:**
When no IDEs are detected, the command prompts for:
- Team domain or industry
- Team conventions to follow
- Existing skills to consider

**Detailed guide:** See [docs/IDEATION.md](docs/IDEATION.md)

---

## Health & Validation

Check if repository is "Rosetta-compliant" and compute a health score, or use `audit` to verify quality.

```bash
rosetta health
rosetta audit --template react-vite
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
├── constants.js           # Configuration constants & SKILL_WRAPPERS registry
├── utils.js              # Utility functions
├── config.js             # Config & profile management
├── templates.js          # Template rendering
├── ide-adapters.js       # IDE sync logic
├── context.js            # Context gathering, auto-detection & IDE detection
├── skills.js             # Skill management (with multi-IDE translation)
├── skill-translator.js   # Skill invocation translation engine
├── skills-manifest.js    # Manifest tracking (incl. translatedPaths)
├── migration.js          # Migration tools
├── validation.js         # Health, validation & watch mode
├── cli-helpers.js       # CLI flow helpers
├── analyzers/           # Specialized project analyzers (Cloud, Mobile, DevOps, etc.)
├── visualizers/         # Documentation visualization logic & templates
├── commands/
│   ├── add-ide.js       # Add IDE command
│   ├── install.js       # Skill installation (with multi-IDE translation)
│   ├── uninstall.js     # Skill uninstallation (with translatedPaths cleanup)
│   ├── translate.js      # Format translation
│   ├── translate-all.js  # Bulk translation
│   ├── ideate.js        # Skill ideation command (with clipboard)
│   └── docs.js           # Documentation generation command
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
