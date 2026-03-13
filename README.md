<p align="center">
  <img src="https://raw.githubusercontent.com/RajanChavada/Rosetta/main/assets/rosetta-logo.svg" alt="rosetta" width="200">
</p>

<p align="center">
  <strong>Single source of truth for AI agent rules and engineering memory.</strong>
</p>

<p align="center">
  <a href="https://github.com/RajanChavada/Rosetta/actions"><img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version"></a>
  <a href="https://github.com/RajanChavada/Rosetta/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/RajanChavada/Rosetta"><img src="https://img.shields.io/badge/status-stable-green.svg" alt="Status"></a>
</p>

Rosetta is a CLI tool designed to help engineering teams maintain a consistent **Global Brain** for their AI agents (GitHub Copilot, Cursor, Windsurf, Claude Code) across an entire repository.

Instead of duplicating instructions in every IDE-specific hidden file, you define your project's soul in `.ai/master-skill.md`. Rosetta then generates independent IDE wrappers that reference your project spec without using symlinks, ensuring maximum compatibility.

> **Status: v0.1 Beta** - Core semantics are stable. Commands marked with `(planned)` are on the roadmap.

```bash
# Using node (recommended)
node cli.js scaffold
```

---

## Quick Start

### 1. Initialize Rosetta
Run the following command in your project root to set up the architecture:

```ansi
[1;35m● Scaffolding atlas-pay...[0m
[90m┣━ [0mContext gathered [32m✓[0m
[90m┣━ [0m.ai/ brain created [32m✓[0m
[90m┣━ [0m2 IDEs configured [32m✓[0m
[90m┣━ [0m4 starter skills added [32m✓[0m
[90m┗━ [0mMemory initialized [32m✓[0m

[1;32mNew agentic structure created with preset: agentic-starter[0m
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

## Why Rosetta?

Engineering memory usually answers "why was this built?" Rosetta answers "how should the agent help me built it right now?"

| Problem | Rosetta's Answer |
|---------|----------------|
| Fragmented IDE rules | One master spec synced to all wrappers |
| Agent "forgets" conventions | 3-layer memory (Project, Auto, Logs) |
| Root directory pollution | Centralized state in the `.ai/` folder |
| Brittle symlinks | Independent markdown wrappers |

---

## Core Commands

### Setup & Core Flow

**Scaffold** — Set up the `.ai/` directory and configure IDEs
```bash
node cli.js scaffold
```

**Sync** — Verify IDE wrappers or regenerate them from templates
```ansi
[34mRegenerating IDE wrappers from templates...[0m
[32mCreated/Updated CLAUDE.md from template anthropic-claude.md[0m
[32mCreated/Updated .cursorrules from template cursorrules.md[0m

[32mMaster spec: .ai/master-skill.md is the source of truth.[0m
```

**Watch** — Monitor `.ai/master-skill.md` for changes
```ansi
[36mWatching .ai/master-skill.md for changes...[0m
[34m[13:42:01] Change detected in master spec.[0m
[90mIDE wrappers already reference .ai/master-skill.md; no file changes needed.[0m
```

### Skill Management

**New Skill** — Create a new stateless skill folder
```ansi
[32mCreated skill directory at skills/api-auth[0m
[90m- skills/api-auth/SKILL.md[0m
[90m- skills/api-auth/tests/prompts.md[0m
```

### Migration & Adoption

| Command | Description |
|---------|-------------|
| `migrate` | Interactive wizard for existing repos |
| `migrate-from-cursor` | Convert `.cursorrules` to `.ai/` |
| `migrate-from-claude` | Convert `CLAUDE.md` to `.ai/` |

---

## Key Features

| Feature | Description |
|---------|-------------|
| **3-Layer Memory** | Project decisions, heuristics, and daily logs |
| **Multi-Source Skills** | Local, global (`~/.rosetta`), or git-sourced skills |
| **Config Driven** | Use `.rosetta.json` for non-interactive scaffolding |
| **Post-Scaffold Hooks** | Run scripts automatically after setup |

---

## Health & Validation

Check if the repository is "Rosetta-compliant" and compute a health score.

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

---

## Architecture & Roadmap

Deep dives into the system design are available in the `Features/` directory:

- [Plugin System Overview](file:///Users/jimmychavada/Documents/Rosetta/Features/1.md)
- [Discovery & Resolution Rules](file:///Users/jimmychavada/Documents/Rosetta/Features/2.md)
- [Roadmap & Priorities](file:///Users/jimmychavada/Documents/Rosetta/Features/9.md)

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md).

**Security issues**: Email security@rosetta.ai.

---

## License

MIT © [Rajan Chavada](https://github.com/RajanChavada)
