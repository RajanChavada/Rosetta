# YAML-First Architecture

## Overview

Rosetta now uses a **YAML-first architecture** where `rosetta.yaml` is the single source of truth for your AI agent configuration. Instead of maintaining separate files for different IDEs (CLAUDE.md, .cursorrules, etc.), you define your configuration once in a neutral YAML format and Rosetta compiles it to all supported IDEs automatically.

**Think of it like Babel or Webpack for AI configurations:** Write once, generate everywhere.

## Benefits

- **Single Source of Truth**: Maintain one `rosetta.yaml` instead of 9+ IDE-specific files
- **Consistency**: All IDE configurations stay perfectly in sync
- **Version Control**: Track changes to your agent configuration with clear diffs
- **Validation**: Schema-based validation catches errors early
- **Migration**: Built-in tools to migrate existing IDE configurations to YAML

## Quick Start

### 1. Create a rosetta.yaml

```bash
# Create a minimal config
rosetta init --type web-app --name "My Project" --language "TypeScript"

# Or create from a template
cp templates/yaml/web-app.yaml rosetta.yaml
# Then edit the file with your project details
```

### 2. Generate IDE Configurations

```bash
# Sync to all supported IDEs
rosetta sync-yaml

# Sync to specific IDEs only
rosetta sync-yaml --ides claude,cursor

# Dry run to preview changes
rosetta sync-yaml --dry-run --verbose
```

### 3. Validate Your Configuration

```bash
rosetta validate
```

### 4. Migrate Existing Configuration (Optional)

If you already have `.ai/master-skill.md`:

```bash
rosetta migrate-to-yaml
```

This will create `rosetta.yaml` from your existing configuration, preserving as much information as possible.

## Canonical Schema

The `rosetta.yaml` file follows this structure:

```yaml
schema_version: "1.0.0"

project:
  name: string                    # Required - Your project name
  description: string             # Required - One-sentence description
  type: enum                      # Required - web_app, api_service, cli_tool, data_ml, library_sdk, internal_tooling
  risk_level: enum                # Optional - low, medium, high (default: medium)

stack:
  language: string                # Required - Primary programming language
  frontend: list[string]          # Optional - Frontend frameworks
  backend: list[string]           # Optional - Backend frameworks
  datastores: list[string]        # Optional - Databases and storage
  testing: list[string]           # Optional - Test frameworks

conventions:                      # Optional - Coding standards and conventions
  - name: string
    rules:
      - description: string
        pattern?: string          # Optional regex pattern for validation
        enforced: boolean
    examples?: list[string]

commands:                         # Optional - Common project commands
  dev: [{ name, command, description? }]
  test: [{ name, command, description? }]
  build: [{ name, command, description? }]

agents:                           # Optional - Agent/persona configurations
  - name: string
    role: string                  # e.g., "Senior Architect", "Code Reviewer"
    style: enum                  # pair_programmer, autonomous, conservative
    scope: enum                  # current_file, module, repo
    system_prompt?: string

notes:                            # Optional - Project-specific knowledge
  - title: string
    category: enum                # domain_rule, gotcha, optimization, debugging
    content: string
    priority?: integer            # 1-10 (default: 5)

ide_overrides:                    # Optional - IDE-specific customizations
  claude: { persona?, additional_context? }
  cursor: { reasoning_modes?: list[string] }
  windsurf: { collaboration_mode?: string }
  # ... other IDEs as they are added

metadata:                         # Managed by Rosetta - do not edit manually
  created_at: date-time
  updated_at: date-time
  version: string
  source?: string                 # If migrated from another format
```

## Commands

### `rosetta sync-yaml`

Synchronizes `rosetta.yaml` to IDE configuration files.

```bash
rosetta sync-yaml                    # Sync to all supported IDEs
rosetta sync-yaml --ides claude      # Sync to Claude Code only
rosetta sync-yaml --from custom.yaml # Use a different YAML file
rosetta sync-yaml --dry-run          # Preview without writing
rosetta sync-yaml --verbose          # Detailed output
```

**Supported IDEs** (as of Phase 1):
- Claude Code → `CLAUDE.md`
- Cursor → `.cursorrules`
- Windsurf → `.windsurfrules`

More IDEs will be added in future phases.

### `rosetta validate`

Validates a `rosetta.yaml` file against the schema.

```bash
rosetta validate                    # Auto-discover rosetta.yaml
rosetta validate --file custom.yaml # Validate a specific file
```

Output:
```
✓ rosetta.yaml is valid
  Project: My Project
  Type: web_app
  Language: TypeScript
  Conventions: 3
  Agents: 2
  Notes: 4
```

### `rosetta migrate-to-yaml`

Converts an existing `.ai/master-skill.md` to `rosetta.yaml`.

```bash
rosetta migrate-to-yaml --dry-run    # Preview conversion
rosetta migrate-to-yaml --verbose    # Show detailed progress
```

**Note**: Migration is a best-effort conversion. Some manual review and adjustment of the generated `rosetta.yaml` may be needed.

### `rosetta init` (Planned)

Interactive wizard to create a new `rosetta.yaml` with guided prompts.

## IDE Overrides

You can customize the generated IDE files using `ide_overrides` in `rosetta.yaml`:

```yaml
ide_overrides:
  claude:
    persona: "Senior Full-Stack Engineer"
    additional_context: "This project uses a monorepo structure."
  cursor:
    reasoning_modes:
      - "Memory Safety"
      - "API Contract Changes"
  windsurf:
    collaboration_mode: "asynchronous"
```

## Common Workflows

### Starting a New Project

```bash
# 1. Initialize rosetta.yaml
rosetta init --type web-app --name "My App" --language "TypeScript"

# 2. Edit rosetta.yaml to add your conventions, commands, etc.
vim rosetta.yaml

# 3. Generate IDE configs
rosetta sync-yaml

# 4. (Optional) Delete old master-skill.md if it exists
rm -rf .ai/master-skill.md
```

### Converting an Existing Project

```bash
# 1. Backup your current config
cp .ai/master-skill.md .ai/master-skill.md.backup

# 2. Run migration
rosetta migrate-to-yaml

# 3. Review and edit rosetta.yaml
vim rosetta.yaml

# 4. Test sync in dry-run mode
rosetta sync-yaml --dry-run

# 5. Apply the sync
rosetta sync-yaml

# 6. Verify IDE files are correct, then remove old master-skill.md
#    (Keep backup until you're fully migrated)
```

### Maintaining the Single Source of Truth

```bash
# Edit rosetta.yaml to make changes
vim rosetta.yaml

# Re-sync to all IDEs
rosetta sync-yaml

# Validate before committing
rosetta validate
```

**Important**: After syncing, DO NOT manually edit the generated IDE files (CLAUDE.md, .cursorrules, etc.). Those are derived from `rosetta.yaml`. Make your changes in the YAML file and re-sync.

## Schema Evolution

The `schema_version` field in `rosetta.yaml` tracks the schema format. Rosetta will maintain backward compatibility where possible, and provide migration paths for major version changes.

## Troubleshooting

### "No rosetta.yaml found"

Make sure you're in a directory with a `rosetta.yaml` file, or use `--from` to specify a custom path:

```bash
rosetta sync-yaml --from /path/to/rosetta.yaml
```

### Validation Errors

If `rosetta validate` reports errors, check:
- Required fields are present (schema_version, project, stack)
- project.type is one of the enum values
- stack.language is a string
- All array fields are actually arrays

### IDE Files Not Updating

Generated IDE files will be overwritten on each sync. If you've made manual changes to those files, they will be lost. Keep customizations in `rosetta.yaml` using `ide_overrides`.

## Migration from Legacy `.ai/master-skill.md`

The migration tool extracts configuration from your existing master-skill.md through pattern matching. Here's what gets migrated:

| Master Skill Field | YAML Field | Migration Strategy |
|-------------------|------------|-------------------|
| Project name (title) | `project.name` | Extracted from first heading |
| Project type | `project.type` | Pattern matching on Type line |
| Stack (FRONTEND_STACK, etc.) | `stack.*` | Extracted from Stack Focus line |
| Risk level (RISK_LEVEL) | `project.risk_level` | Pattern matching |
| Domain tags (DOMAIN_TAGS) | `notes` | Converted to domain_rule notes |
| Agent style (AGENT_STYLE) | `agents[0].style` | Mapped to enum values |
| Edit permissions (EDIT_PERMISSIONS) | `agents[0].scope` | Mapped to scope enum |

**Not migrated** (you'll need to add manually):
- Detailed conventions (unless they're in the template)
- Command configurations
- Agent system prompts
- All other fields will get default values

We recommend treating the migrated `rosetta.yaml` as a starting point and enhancing it with your complete configuration.

## Future Enhancements (Roadmap)

- **Phase 2**: Bidirectional translation (YAML ↔ Markdown), diff & merge commands
- **Phase 3**: Watch mode, `rosetta doctor`, auto-detection from package.json
- **Phase 4**: Expanded IDE support (Codex CLI, GitHub Copilot, Kilo Code, Continue.dev)

## Need Help?

- Run `rosetta --help` for command-line help
- Check the [PLAN.md](PLAN.md) for current implementation status
- Report issues at https://github.com/RajanChavada/Rosetta/issues
