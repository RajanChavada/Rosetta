# Rosetta CLI Agent Configuration

## Project Overview

**Name:** @rosetta/cli
**Type:** CLI Tool for AI Agent Configuration
**Tech Stack:** Node.js (ESM), Commander.js, fs-extra, inquirer, chalk
**State Management:** File-based (.ai/, ~/.rosetta/)

## Work Scope Rules

**CLAUDE-CREATE** - Work ON Claude itself:
- Improving the Claude agent's behavior
- Creating or modifying `.claude/skills/` files (Claude Code skills)
- Enhancing Claude Code context loading
- This is meta-work: improving the tool using the tool

**ROSETTA** - Work ON the Rosetta CLI project:
- Developing the Rosetta CLI tool itself
- Working with `templates/skills/` (Rosetta CLI skill templates)
- Implementing features in lib/ modules
- This is project work: building the CLI tool

## Architecture & Constraints

- **Modular Design:** Core logic in `lib/` modules, thin entry point in `cli.js`
- **No Dependencies:** Everything runs locally, no cloud services required
- **ESM Only:** All modules use ES6 imports (`import`/`export`)
- **Placeholder System:** Simple `{{KEY}}` syntax in templates
- **Behavior Contract:** IDE wrappers are independent files (no symlinks), sync doesn't overwrite by default

## Coding Standards

- **Async Functions:** All command handlers and file operations use `async/await`
- **Error Handling:** Use try/catch with chalk-red error messages
- **Dry-Run First:** All file operations check `options.dryRun` before writing
- **No Emojis:** Strictly no emojis or special symbols (like ✓, ●, 🧠) in templates or CLI output.
- **Consistent Logging:** Use `TreeLogger` for multi-step operations
- **Path Handling:** Use `path.join()` for cross-platform paths

- **File Operations:** Prefer `fs-extra` over native `fs` for better error handling
- **Constants:** Define in `lib/constants.js`, import rather than inline

## Current Plan

Rosetta CLI is stable and feature-complete for v0.3.2.

**Recent Work:**
- Modular architecture refactoring (cli.js: 1694 lines → 305 lines)
- Added 3 new IDEs: Codex CLI, Kilo Code, Continue.dev
- Implemented auto-detection for Node.js, Python, Go, Rust, Ruby
- Created translation commands: add-ide, translate, translate-all
- Added AI analysis (opt-in) with Anthropic/OpenAI support
- Comprehensive documentation: MIGRATION.md, ARCHITECTURE.md, API.md

**Next Priorities:**
- Skills-based context loading system
- Session management with PLAN.md and TODO.md
- Subagent delegation for exploration and security review
- Proactive context compaction at 60–70% capacity

## Context Management Rules

### Skills System

**Two Types of Skills:**

**1. Claude Code Skills** (`.claude/skills/`) - For working ON the Rosetta project:
- Used by Claude Code to load focused context when developing Rosetta CLI
- Loaded via `/frontend-context`, `/backend-context`, `/testing-context` commands
- Location: `.claude/skills/*.md` (e.g., frontend-context.md, backend-context.md)
- Managed by: `lib/claude-code-skills.js`

**2. Rosetta CLI Skill Templates** (`templates/skills/`) - For creating skills FOR projects:
- Templates that Rosetta generates for other projects
- Copied to target project's `.claude/skills/` via scaffold commands
- Location: `templates/skills/*.skill.md` (e.g., node-express-postgres.skill.md)
- Managed by: `lib/skills.js` and scaffold commands

**When to use skills:**
- Loading context for specific domains (frontend, backend, testing)
- Large context situations where granular control is needed
- When exploring unfamiliar parts of the codebase

**Available Claude Code Skills (for Rosetta development):**
- `/frontend-context` - Frontend-related docs, styles, patterns
- `/backend-context` - Backend, API, domain logic
- `/testing-context` - Test strategy, fixtures, CI/CD

**Skill activation:** Use Claude Code skill files when you need focused context on a specific area. Do not load all skills by default.

### State Files

**PLAN.md** - Machine-readable session state:
- `## Goals` - Current high-level objectives
- `## Active Tasks` - Currently in-progress work
- `## Decisions` - Architectural decisions made
- `## Session Handoff` - Context for next session

**TODO.md** - Actionable items only:
- Checkbox format: `- [ ] Item description`
- Organized by priority or area
- No explanatory text, just actionable tasks

### Session Workflow

**Start of session:**
1. Read CLAUDE.md, PLAN.md, TODO.md
2. Summarize state in <10 bullet points
3. Review Active Tasks and Goals

**During long work (context ~60–70%):**
1. Summarize current session into PLAN.md (## Session Handoff)
2. Run `/compact` to preserve plan and active files

**After major work:**
1. Update TODO.md with remaining items
2. Update CLAUDE.md if architecture/standards changed

### Subagents

**explore-codebase** - Repository scanning and pattern finding:
- Use when: Exploring unfamiliar areas, finding file locations, understanding patterns
- Output: Concise summary with file paths and hotspots

**security-review** - Security and dependency analysis:
- Use when: Adding dependencies, making security changes, audit phase
- Output: Findings + file paths, no verbose logs

**When to delegate:**
- Large exploration tasks (>3 files or multiple areas)
- Security reviews requiring dependency analysis
- When context approaches capacity threshold

## Development Workflow

**For new features:**
1. Explore codebase (use explore-codebase subagent if needed)
2. Design approach
3. Implement in `lib/` with proper module structure
4. Add tests (when testing framework exists)
5. Update documentation in `docs/`
6. Update PLAN.md and TODO.md

**For bug fixes:**
1. Locate issue in code
2. Create focused fix
3. Test with dry-run if applicable
4. Update documentation if behavior changed

**For refactoring:**
1. Break into logical units
2. Work on one module at a time
3. Maintain backward compatibility
4. Update API documentation

## Key Files Reference

| File | Purpose |
|-------|-----------|
| `cli.js` | Entry point, command registration |
| `lib/constants.js` | Configuration constants, templates |
| `lib/utils.js` | Utilities: TreeLogger, dryRunWrite |
| `lib/config.js` | Profile and registry management |
| `lib/templates.js` | Template rendering and file ops |
| `lib/ide-adapters.js` | IDE sync logic |
| `lib/context.js` | Context gathering, auto-detection |
| `lib/skills.js` | Rosetta CLI skill templates (templates/skills/) |
| `lib/claude-code-skills.js` | Claude Code skills loading (.claude/skills/) |
| `lib/migration.js` | Migration tools |
| `lib/validation.js` | Health checks, memory management |
| `lib/registry.js` | Registry/preset management |
| `lib/cli-helpers.js` | Scaffolding flows, hooks |
| `lib/commands/` | Command implementations |
| `lib/translators/` | Format translation system |
| `lib/ai-*.js` | AI client and analyzers |
| `templates/` | IDE and skill templates |
| `docs/` | User documentation |

## Commands Reference

**Core:** `scaffold`, `sync`, `watch`, `rescaffold`
**Migration:** `migrate`, `migrate-from-cursor`, `migrate-from-claude`
**New:** `add-ide`, `translate`, `translate-all`
**Validation:** `validate`, `health`, `audit`, `sync-memory`
**Skills:** `skill <name>`, `skills`, `new-skill`
**Session:** `plan`, `edit-plan`, `todo`, `edit-todo`, `status`, `compact`
**Agents:** `agent <name>`, `agents`
**Profiles:** `use-profile`
**Registry:** `install-preset`, `install-skill`, `search`

## Testing

**Test approach:** Unit + integration
**Test commands:** `npm test` (placeholder, needs implementation)
**Manual testing:** Run `--dry-run` for file operations before actual execution

## Subagents

**Available subagents:**
- `explore-codebase` - Repository scanning and pattern finding
- `security-review` - Security and dependency analysis (read-only)

**When to delegate:**
- Large exploration tasks (>3 files or multiple areas)
- Finding specific function locations across codebase
- Security reviews requiring dependency analysis
- When context approaches capacity threshold (60–70%)

**Delegation workflow:**
1. Invoke subagent with focused prompt
2. Receive concise summary
3. Update PLAN.md with findings
4. Continue with main work

## Session Handoff Procedure

**End of session checklist:**
- [ ] Summarize current session into PLAN.md (## Session Handoff)
- [ ] Update TODO.md with remaining items
- [ ] Note any new decisions made
- [ ] List files that need attention next session
- [ ] Run `/compact` if context at ~60–70% capacity

**Start of session:**
- [ ] Read CLAUDE.md, PLAN.md, TODO.md
- [ ] Summarize current state in <10 bullet points
- [ ] Review Active Tasks from PLAN.md
- [ ] Load relevant skills based on work area

**Compaction trigger:**
- After long chains of file modifications
- When context estimate exceeds 60–70%
- Before leaving for extended period
- Always preserves current plan and active files
