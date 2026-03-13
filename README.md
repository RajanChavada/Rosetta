# Rosetta CLI

Rosetta is a single source of truth for AI coding "rules" and skills. It syncs or scaffolds platform-specific files for multiple IDEs and agents (Claude Code, Cursor, Antigravity, GitHub Copilot, GSD, etc.) from one master spec.

## Goal

- Manage a single source of truth in .ai/master-skill.md.
- Align rules across multiple IDEs and agents.
- Simple filesystem utility with no external dependencies or LLM calls.

## Installation

```bash
# Clone the repo and install dependencies
npm install

# Or use via npx (when published)
npx rosetta
```

## Usage

Run the tool in your repository:

```bash
node cli.js
# or if installed globally/linked
rosetta
```

### Commands

- **Interactive Mode**: `node cli.js` (or simply `rosetta`)
- **Sync**: `rosetta sync [-r]` - Verify IDE wrappers (or regenerate from templates with `-r`).
- **Watch**: `rosetta watch` - Watch master spec and log changes.
- **New Skill**: `rosetta new-skill <name>` - Scaffold a new skill folder with boilerplate.

### Main Flows

1. **Scaffold New Setup**: For new or empty repositories. It creates .ai/master-skill.md and links it to selected IDE targets. Now includes Starter Templates (Minimal, Anthropic, Agentic Booster).
2. **Sync Existing Setup**: For repositories that already have a master spec. It updates the target files from the master spec.
3. **Migrate Existing Files**: For repositories that have existing agent files (like CLAUDE.md or .cursorrules) but no master spec yet. It helps create the master spec from existing sources and then syncs to other IDEs.

## Starter Templates

When scaffolding, Rosetta now offers several baseline templates:
- **Minimal**: A blank slate for your own rules.
- **Anthropic / Claude Code Best Practices**: Follows the recommended structure for CLAUDE.md (Overview, Tech Stack, Architecture, Rules, Commands).
- **Agentic Starter**: A set of rules optimized for agentic workflows (Research first, Plan before action, Incremental progress).

## Supported IDEs & Targets

- **VSCode / Claude Code**: CLAUDE.md
- **Cursor**: .cursorrules
- **Antigravity**: .agent/skills/project-skill.md
- **GitHub Copilot**: .github/copilot-instructions.md
- **GSD / Generic**: skills/gsd-skill.md

## Design Principles

- **Single Source of Truth**: Edit .ai/master-skill.md and sync everywhere.
- **Symlink Support**: Uses symlinks on Unix-like systems so changes to the master spec are immediately reflected.
- **Safe Overwrites**: Always prompts or backups before overwriting existing files.
- **Git Friendly**: Human-readable diffs for all changes.

## License

MIT
