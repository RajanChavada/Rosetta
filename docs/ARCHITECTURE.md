# Rosetta Architecture

This document describes the architecture and design decisions of Rosetta.

## Overview

Rosetta is a modular CLI tool that provides a single source of truth for AI agent configuration across multiple IDEs.

### Core Principles

1. **Single Source of Truth** - `.ai/master-skill.md` contains all project rules
2. **Independent Wrappers** - Each IDE gets its own wrapper (no symlinks)
3. **Local Filesystem** - No cloud dependency, everything runs locally
4. **Modular Design** - Clean separation of concerns for maintainability
5. **Extensibility** - Easy to add new IDEs, commands, and features

## Directory Structure

```
rosetta/
├── cli.js                    # Thin CLI entry point (~300 lines)
├── lib/                      # Core modules
│   ├── constants.js           # Configuration constants
│   ├── utils.js              # Utility functions
│   ├── config.js             # Config & profile management
│   ├── templates.js          # Template rendering
│   ├── ide-adapters.js       # IDE sync logic
│   ├── context.js            # Context gathering & auto-detection
│   ├── skills.js             # Skill management
│   ├── migration.js          # Migration tools
│   ├── validation.js         # Health & validation
│   ├── registry.js           # Registry management
│   ├── cli-helpers.js       # CLI flow helpers
│   ├── commands/             # Command implementations
│   │   ├── add-ide.js       # Add IDE command
│   │   ├── translate.js      # Format translation
│   │   └── translate-all.js  # Bulk translation
│   ├── translators/           # Format translators
│   │   └── base.js         # Translation engine
│   └── ai-analyzers/         # AI-powered analysis
│       ├── project.js       # Project analysis
│       └── context.js      # Context enhancement
├── templates/                # IDE and skill templates
│   ├── anthropic-claude.md
│   ├── cursorrules.md
│   ├── copilot-instructions.md
│   ├── windsurf-rules.md
│   ├── antigravity-skill.md
│   ├── gsd-skill.md
│   ├── codex-cli.md
│   ├── kilo-code.md
│   ├── continue-dev.md
│   ├── AGENT.md
│   ├── task.md
│   └── skills/
└── docs/                     # Documentation
    ├── MIGRATION.md
    ├── ARCHITECTURE.md
    └── API.md
```

## Core Modules

### constants.js

Defines all configuration constants:

- `TARGETS` - Array of supported IDEs with their config paths and templates
- `SKILLS_SOURCES` - Directories to search for skills
- `ROSETTA_DIR`, `REGISTRY_PATH` - Configuration paths
- `DEFAULT_REGISTRY` - Default registry content
- Memory and logging templates

**Design Decision:** Constants are centralized to make adding new IDEs trivial - just add to `TARGETS`.

### utils.js

Utility functions:

- `showBanner()` - ASCII art banner
- `TreeLogger` - Progress indicator with tree visual
- `dryRunWrite()` - Dry-run mode helper

**Design Decision:** Dry-run is built into all file operations to allow safe preview.

### config.js

Configuration management:

- `loadConfig()` - Load from `.rosetta.json` and active profile
- `useProfile()` - Switch active profile
- Registry management functions

**Design Decision:** Profiles allow users to bundle preferences for different contexts (fintech, startup, etc.).

### templates.js

Template operations:

- `renderTemplate()` - Replace placeholders with context values
- `ensureFromTemplate()` - Create file from template with backup
- `ensureMasterFromPreset()` - Generate master skill from preset
- `writeTarget()` - Write with symlink support

**Design Decision:** Templates use `{{PLACEHOLDER}}` syntax for easy replacement. No symlinks for IDE wrappers per behavior contract.

### ide-adapters.js

IDE management:

- `ideTargets()` - Map IDE label to config path and template
- `performSync()` - Sync or regenerate IDE wrappers

**Design Decision:** Behavior contract - sync doesn't overwrite existing wrappers unless explicitly requested.

### context.js

Context gathering and auto-detection:

- `detectRepoState()` - Detect existing setup
- `detectProjectType()` - Auto-detect project type from config files
- `inferStackFromDependencies()` - Extract tech stack from dependencies
- `gatherContext()` - Interactive context gathering with auto-detection defaults
- `inferStarterSkills()` - Suggest skills based on context

**Design Decision:** Auto-detection provides smart defaults but allows user override.

### skills.js

Skill management:

- `loadSkillsFromSources()` - Load skills from multiple sources
- `createSkill()` - Create new skill with boilerplates
- `createSkillFromFile()` - Create skill from template

**Design Decision:** Skills can come from local dirs, global `~/.rosetta/skills`, or git repos.

### migration.js

Migration tools:

- `migrateExisting()` - Interactive migration wizard
- `findExistingAgentFiles()` - Find existing IDE configs
- `migrateFromSource()` - Migrate from specific source

**Design Decision:** Migration can merge multiple sources or pick one.

### validation.js

Health and validation:

- `validateRepo()` - Check .ai/ structure completeness
- `reportHealth()` - Display Rosetta Score
- `syncMemory()` - Rotate and summarize logs
- `watchMode()` - Watch master skill for changes

**Design Decision:** Health score helps teams measure Rosetta adoption.

### registry.js

Registry management:

- `RegistryManager` class with static methods
- `search()`, `find()`, `installPreset()`, `installSkill()`

**Design Decision:** Registry enables community sharing of presets and skills.

### cli-helpers.js

CLI flow helpers:

- `runPostScaffoldHooks()` - Execute post-scaffold scripts
- `rescaffold()` - Selective re-scaffolding
- `scaffoldNew()` - Main scaffolding flow

**Design Decision:** Hooks allow custom automation after scaffolding.

## Commands

### add-ide

Adds a new IDE to existing setup:
```bash
rosetta add-ide codex
```

Features:
- Lists available IDEs not yet configured
- Generates wrapper from template
- Creates target directory if needed

### translate

Converts config between formats:
```bash
rosetta translate .cursorrules --to claude
```

Features:
- Auto-detects source format from filename
- Supports all 9 IDE formats
- Dry-run mode for preview

### translate-all

Bulk conversion:
```bash
rosetta translate-all --to claude
```

Features:
- Finds all existing IDE configs
- Shows summary before execution
- Requires confirmation (unless --confirm)

## Translation System

### Architecture

```
Input File
    ↓
Parser (format-specific)
    ↓
Intermediate Representation
    ↓
Transformer (cross-format mapping)
    ↓
Generator (format-specific)
    ↓
Output File
```

### Supported Formats

- cursor - `.cursorrules`
- claude - `CLAUDE.md`
- copilot - `.github/copilot-instructions.md`
- windsurf - `.windsurf/rules/`
- codex - `.codex/rules.md`
- kilo - `.kilo/rules.md`
- continue - `.continue/config.md`
- generic - Catch-all for other formats

### Extending Translators

To add support for a new format:

1. Add parser to `IDETranslator.parse<Format>()`
2. Add generator to `IDETranslator.generate<Format>()`
3. Update `FORMAT_MAP` and supported formats list
4. Create template in `templates/`

## AI Analysis

### Architecture

AI analysis is **optional** and uses **user's API tokens only**.

```
Project Files
    ↓
Sampler (selects key files)
    ↓
Project Sample (formatted for AI)
    ↓
AI Client (Anthropic/OpenAI)
    ↓
Analysis (JSON response)
    ↓
Context Enhancement
```

### Components

- `AIClient` - Abstraction for OpenAI and Anthropic APIs
- `ProjectAnalyzer` - Samples files and analyzes project
- `ContextEnhancer` - Enhances context with AI insights
- `ContextValidator` - Validates and reports on context

### Security

- No Rosetta-owned API keys
- Tokens read from environment or `~/.rosetta/config.json`
- Tokens never logged or transmitted except to AI provider

## Auto-Detection

### Supported Languages

- Node.js/TypeScript - package.json analysis
- Python - requirements.txt or pyproject.toml
- Go - go.mod
- Rust - Cargo.toml
- Ruby - Gemfile

### Detected Information

- Project type (Web app, API, CLI, Library, etc.)
- Frontend frameworks (React, Next.js, Vue, etc.)
- Backend frameworks (Express, NestJS, Django, etc.)
- Database/ORM (Prisma, SQLAlchemy, TypeORM, etc.)

## Design Patterns Used

1. **Singleton-ish** - RegistryManager uses static methods
2. **Builder** - Context building with multiple tiers
3. **Strategy** - Different parsers/generators for translation
4. **Template Method** - Scaffold flow with hooks
5. **Factory** - IDE targets lookup

## Extensibility

### Adding a New IDE

1. Create template: `templates/<ide-name>.md`
2. Add to `TARGETS` in `constants.js`
3. Add detection in `findExistingAgentFiles()`
4. Add translator support if needed

### Adding a New Command

1. Create file: `lib/commands/<command-name>.js`
2. Export async function `export async function commandName()`
3. Register in `cli.js` with `program.command()`

### Adding a New AI Provider

1. Add client method to `AIClient`
2. Update provider mapping
3. Add to help text

## Performance Considerations

- File operations use `fs-extra` for better error handling
- Git clone uses temporary directory with timestamp
- Large files are sampled (first N characters)
- Dry-run mode allows preview without side effects

## Future Enhancements

- [ ] Skill hot-reloading
- [ ] Watch mode with automatic wrapper updates
- [ ] Remote skill registry with search
- [ ] GUI configuration tool
- [ ] VS Code extension integration
