<div align="center">

# ROSETTA
**Single Source of Truth for AI Agent Rules and Engineering Memory.**

[![Version](https://img.shields.io/badge/version-0.1.0-blue.svg?style=for-the-badge)]()
[![Status](https://img.shields.io/badge/status-stable-green.svg?style=for-the-badge)]()
[![License](https://img.shields.io/badge/license-MIT-magenta.svg?style=for-the-badge)]()

</div>

---

Rosetta is a CLI tool designed to help engineering teams maintain a consistent "Global Brain" for their AI agents (**GitHub Copilot**, **Cursor**, **Windsurf**, **Claude Code**) across an entire repository.

Instead of duplicating instructions in every IDE-specific hidden file, you define your project's soul in `.ai/master-skill.md`. Rosetta then generates independent IDE wrappers that reference your project spec *without* using symlinks, ensuring maximum compatibility.

---

## ⚡ Quickstart (Today)

### 1. Initialize Rosetta
Run the following command in your project root:
```bash
node cli.js scaffold
```

**Example Output:**
```ansi
[1;35m● Scaffolding atlas-pay...[0m
[90m┣━ [0mContext gathered [32m✓[0m
[90m┣━ [0m.ai/ brain created [32m✓[0m
[90m┣━ [0m2 IDEs configured [32m✓[0m
[90m┣━ [0m4 starter skills added [32m✓[0m
[90m┗━ [0mMemory initialized [32m✓[0m

[1;32mNew agentic structure created with preset: agentic-starter[0m
```

---

## 🛠️ CLI Command Reference

### 🏗️ Setup & Core Flow

#### `rosetta scaffold`
Set up the `.ai/` directory, initializes the master spec from a preset, and configures chosen IDEs.
```bash
node cli.js scaffold
```

#### `rosetta sync`
Verify IDE wrappers or regenerate them from templates.
```bash
node cli.js sync --regenerate-wrappers
```
**Output:**
```ansi
[34mRegenerating IDE wrappers from templates...[0m
[32mCreated/Updated CLAUDE.md from template anthropic-claude.md[0m
[32mCreated/Updated .cursorrules from template cursorrules.md[0m

[32mMaster spec: .ai/master-skill.md is the source of truth.[0m
```

#### `rosetta watch`
Monitor `.ai/master-skill.md` and log status when changes are detected.
```bash
node cli.js watch
```
**Output:**
```ansi
[36mWatching .ai/master-skill.md for changes...[0m
[34m[13:42:01] Change detected in master spec.[0m
[90mIDE wrappers already reference .ai/master-skill.md; no file changes needed.[0m
```

---

### 🧪 Skill Management

#### `rosetta new-skill <name>`
Create a new skill folder with `SKILL.md` and tests boilerplate.
```bash
node cli.js new-skill api-auth
```
**Output:**
```ansi
[32mCreated skill directory at skills/api-auth[0m
[90m- skills/api-auth/SKILL.md[0m
[90m- skills/api-auth/tests/prompts.md[0m
```

---

### 🚀 Migration & Adoption

#### `rosetta migrate`
Interactive wizard to migrate existing agent files (`CLAUDE.md`, `.cursorrules`) into the `.ai/` architecture.
```bash
node cli.js migrate
```

#### `rosetta migrate-from-cursor`
Specifically convert `.cursorrules` into `.ai/master-skill.md`.
```bash
node cli.js migrate-from-cursor
```

#### `rosetta migrate-from-claude`
Specifically convert `CLAUDE.md` into the `.ai/` structure.
```bash
node cli.js migrate-from-claude
```

---

### 🩺 Health & Validation

#### `rosetta health` (alias: `audit`)
Report the "Rosetta Score" and repository health compliance.
```bash
node cli.js health
```
**Output:**
```ansi
[1;35m● Validating Rosetta structure...[0m
[90m┣━ [0m.ai/master-skill.md [32m✓[0m
[90m┣━ [0m.ai/AGENT.md [32m✓[0m
[90m┣━ [0m.ai/task.md [32m✓[0m
[90m┣━ [0m.ai/memory/PROJECT_MEMORY.md [32m✓[0m
[90m┣━ [0m.ai/memory/AUTO_MEMORY.md [32m✓[0m
[90m┗━ [0m.ai/logs/daily/ [32m✓[0m

[32mRosetta Score: 100/100[0m
[1;32mYour repo is 100% Rosetta-ready! 🚀[0m
```

#### `rosetta validate`
Perform a check of the `.ai/` structure for completeness.
```bash
node cli.js validate
```

---

### 🧠 Memory & Profiles

#### `rosetta sync-memory`
Rotate old logs and summarize progress into `AUTO_MEMORY.md`.
```bash
node cli.js sync-memory
```
**Output:**
```ansi
[34mSyncing memory...[0m
[90mFound 12 daily logs.[0m
[34mRotating 5 old logs to archive...[0m
[34mSummarizing logs to AUTO_MEMORY.md...[0m
[32m✓ Memory synced and summarized.[0m
```

#### `rosetta use-profile <name>`
Switch to a specific Rosetta profile to bundle context and preferences.
```bash
node cli.js use-profile heavy-ml
```
**Output:**
```ansi
[1;32m✓ Switched to profile: heavy-ml[0m
[90mNext time you run "scaffold", Rosetta will prefer heavy-ml defaults.[0m
```

---

### 🏪 Registry & Market

#### `rosetta search <type>`
Search for presets or skills in the registry.
```bash
node cli.js search skills --domain financial
```

#### `rosetta install-preset <name>`
Install a preset from the registry into `.ai/master-skill.md`.
```bash
node cli.js install-preset agentic-starter
```

#### `rosetta install-skill <name>`
Install a skill from the registry into the `skills/` directory.
```bash
node cli.js install-skill node-express-postgres
```

---

## 📂 Architecture & Design

Deep dives into the system design can be found in the `Features/` directory:

- [Plugin System Overview](file:///Users/jimmychavada/Documents/Rosetta/Features/1.md)
- [Discovery & Resolution Rules](file:///Users/jimmychavada/Documents/Rosetta/Features/2.md)
- [Roadmap & Priorities](file:///Users/jimmychavada/Documents/Rosetta/Features/9.md)

---

## ⚖️ License

MIT © [Rajan Chavada](https://github.com/RajanChavada)
