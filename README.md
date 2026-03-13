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
```text
● Scaffolding atlas-pay...
┣━ Context gathered ✓
┣━ .ai/ brain created ✓
┣━ 2 IDEs configured ✓
┣━ 4 starter skills added ✓
┗━ Memory initialized ✓

New agentic structure created with preset: agentic-starter
```

### 2. File Inspection
Once scaffolded, your project will have a structured "Brain":
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

## ✨ Key Features

- **Centralized Spec**: One master markdown file to rule them all.
- **3-Layer Memory Protocol**:
  - `PROJECT_MEMORY.md`: Long-lived architectural decisions.
  - `AUTO_MEMORY.md`: Learned heuristics and agent "gotchas."
  - `Daily Logs`: Chronological record of progress and experiments.
- **Multi-IDE Support**: Automatically generates and updates wrappers for all major AI editors.

---

## 🛠️ CLI Usage Guide

> **Status Note**: Rosetta is under active development. Commands marked with `(planned)` are on the roadmap.

### 🏗️ Scaffolding & Setup
```bash
node cli.js scaffold
```
*Creates the `.ai/` directory, initializes the master spec from a preset, and configures chosen IDEs.*

### 🔄 Syncing IDEs
```bash
node cli.js sync --regenerate-wrappers
```
**Example Output:**
```text
Regenerating IDE wrappers from templates...
✓ Created/Updated CLAUDE.md from template anthropic-claude.md
✓ Created/Updated .cursorrules from template cursorrules.md

Master spec: .ai/master-skill.md is the source of truth.
```

### 🧪 Skill Management
```bash
node cli.js new-skill api-auth
```
**Example Output:**
```text
Created skill directory at skills/api-auth
- skills/api-auth/SKILL.md
- skills/api-auth/tests/prompts.md
```

### 🩺 Health & Validation
```bash
node cli.js health
```
**Example Output:**
```text
● Validating Rosetta structure...
┣━ .ai/master-skill.md ✓
┣━ .ai/AGENT.md ✓
┣━ .ai/task.md ✓
┣━ .ai/memory/PROJECT_MEMORY.md ✓
┣━ .ai/memory/AUTO_MEMORY.md ✓
┗━ .ai/logs/daily/ ✓

Rosetta Score: 100/100
Your repo is 100% Rosetta-ready! 🚀
```

---

## 📁 Architecture & Design

Deep dives into the system design can be found in the `Features/` directory:

- [Plugin System Overview](file:///Users/jimmychavada/Documents/Rosetta/Features/1.md)
- [Discovery & Resolution Rules](file:///Users/jimmychavada/Documents/Rosetta/Features/2.md)
- [Roadmap & Priorities](file:///Users/jimmychavada/Documents/Rosetta/Features/9.md)

---

## ⚖️ License

MIT © [Rajan Chavada](https://github.com/RajanChavada)
