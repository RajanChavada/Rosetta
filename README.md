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
  <a href="https://github.com/RajanChavada/Rosetta/actions"><img src="https://img.shields.io/badge/version-0.1.0-blue.svg" alt="Version"></a>
  <a href="https://github.com/RajanChavada/Rosetta/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="License"></a>
  <a href="https://github.com/RajanChavada/Rosetta"><img src="https://img.shields.io/badge/status-stable-green.svg" alt="Status"></a>
</p>

</div>

Rosetta is a CLI tool designed to help engineering teams maintain a consistent **Global Brain** for their AI agents (GitHub Copilot, Cursor, Windsurf, Claude Code) across an entire repository.

Instead of duplicating instructions in every IDE-specific hidden file, you define your project's soul in `.ai/master-skill.md`. Rosetta then generates independent IDE wrappers that reference your project spec without using symlinks, ensuring maximum compatibility.

> **Status: v0.1 Beta** - Core semantics are stable. Commands marked with `(planned)` are on the roadmap.

```bash
# Using npx (no installation required)
npx rosetta-ai-blueprint scaffold

# Or install globally
npm install -g rosetta-ai-blueprint
rosetta scaffold
```

---

## Quick Start

### 1. Initialize Rosetta
Run the following command in your project root to set up the architecture:

```bash
npx rosetta-ai-blueprint scaffold
```

**Scaffold Output:**
```text
● Scaffolding atlas-pay...
┣━ Context gathered ✓
┣━ .ai/ brain created ✓
┣━ 2 IDEs configured ✓
┣━ 4 starter skills added ✓
┗━ Memory initialized ✓

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
rosetta scaffold
```

**Sync** — Verify IDE wrappers or regenerate them from templates
```bash
rosetta sync --regenerate-wrappers
```

**Watch** — Monitor `.ai/master-skill.md` for changes
```bash
rosetta watch
```

### Skill Management

**New Skill** — Create a new stateless skill folder
```bash
rosetta new-skill api-auth
```

### Migration & Adoption (v1)

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

```bash
rosetta health
```

**Health Check Output:**
```text
● Validating Rosetta structure...
┣━ .ai/master-skill.md ✓
┣━ .ai/AGENT.md ✓
┣━ .ai/task.md ✓
┣━ .ai/memory/PROJECT_MEMORY.md ✓
┣━ .ai/memory/AUTO_MEMORY.md ✓
┗━ .ai/logs/daily/ ✓

Rosetta Score: 100/100
Your repo is 100% Rosetta-ready!
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
