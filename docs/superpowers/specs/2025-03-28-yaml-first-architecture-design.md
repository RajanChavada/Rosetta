# YAML-First Architecture Design

**Date**: 2025-03-28
**Status**: Implemented
**Version**: 1.0.0

## Overview

Rosetta CLI has been transformed into a **YAML-first architecture** where `rosetta.yaml` serves as the canonical source of truth for AI agent configurations. Instead of maintaining separate IDE-specific files (CLAUDE.md, .cursorrules, etc.), users define their configuration once in a neutral YAML format, and Rosetta compiles it to all supported IDE formats automatically—similar to how Babel or Webpack compiles JavaScript.

## Problem Statement

Previously, Rosetta used `.ai/master-skill.md` as the single source of truth, with IDE-specific config files referencing this master spec. This required:
- Maintaining a master-skill.md file with a custom format
- IDE wrappers were mostly static templates referencing the master
- Limited validation and schema enforcement
- Difficult to migrate or translate between IDE formats
- Manual consistency checks across multiple files

## Solution

Introduce a canonical AST representation with:
1. **Standardized Schema**: JSON Schema for complete configuration definition
2. **YAML as Source**: Human-friendly, version-controllable `rosetta.yaml`
3. **Compilation Pipeline**: Generators that transform AST to IDE-specific formats
4. **Migration Tools**: Convert existing master-skill.md to YAML

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        rosetta.yaml                         │
│                   (Canonical Source of Truth)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   YAML Parser        │
              │ (js-yaml + ajv)      │
              └──────────┬───────────┘
                         │
                         ▼
              ┌──────────────────────┐
              │   Canonical AST      │
              │  - project           │
              │  - stack             │
              │  - conventions       │
              │  - commands          │
              │  - agents            │
              │  - notes             │
              └──────────┬───────────┘
                         │
         ┌───────────────┼───────────────┐
         │               │               │
         ▼               ▼               ▼
  ┌─────────────┐ ┌──────────┐ ┌──────────────┐
  │ IDE         │ │ Commands │ │ Validation   │
  │ Generators  │ │          │ │              │
  └──────┬──────┘ └────┬─────┘ └──────┬───────┘
         │              │               │
         ▼              ▼               ▼
  ┌─────────────┐ ┌──────────┐ ┌──────────────┐
  │ CLAUDE.md   │ │ sync-yaml│ │ Error Report │
  │ .cursorrules│ │ validate │ │              │
  │ .windsurf/  │ │ migrate  │ │              │
  │ codex.md    │ │          │ │              │
  └─────────────┘ └──────────┘ └──────────────┘
```

## Core Components

### 1. Canonical AST (`lib/ast/canonical.js`)

Central data structure representing all configuration:

```javascript
{
  schema_version: "1.0.0",
  project: {
    name: string,
    description: string,
    type: "web_app" | "api_service" | "cli_tool" | ...,
    risk_level: "low" | "medium" | "high"
  },
  stack: {
    language: string,
    frontend: string[],
    backend: string[],
    datastores: string[],
    testing: string[]
  },
  conventions: [{ name, rules: [{ description, pattern?, enforced }], examples? }],
  commands: { dev: [{ name, command, description? }], test: [], build: [] },
  agents: [{ name, role, style, scope, system_prompt? }],
  notes: [{ title, category, content, priority? }],
  ide_overrides: { claude?: {}, cursor?: {}, windsurf?: {} },
  metadata?: { created_at, updated_at, version, source? }
}
```

**Methods**:
- `validate()` - Schema validation via ajv
- `merge(other, strategy)` - Merge with another AST
- `diff(other)` - Compute differences
- `get/set(path)` - Access nested values
- `toObject()` - Serialize to plain object

### 2. Schema Validation (`lib/validation/schema-validator.js`)

Uses `ajv` with JSON Schema:

```javascript
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const validator = new Ajv({ allErrors: true });
addFormats(validator);

const result = validateYAML(yamlObject);
// { valid: true } or { valid: false, errors: [...] }
```

**Schema**: `schemas/rosetta-schema.json` (200+ lines, comprehensive)

### 3. YAML Parser (`lib/parsers/yaml-parser.js`)

Handles serialization and parsing:

```javascript
// Parse
const ast = await parseYAMLFile('rosetta.yaml');

// Serialize
const yaml = serializeToYAML(ast, { includeMetadata: true });

// Write with backup
await writeYAMLFile('rosetta.yaml', ast, { dryRun: false, backup: true });
```

Features:
- Automatic backup on writes
- Dry-run support
- Schema validation integrated
- Find rosetta.yaml in parent directories

### 4. Base Generator (`lib/generators/base-generator.js`)

Abstract base class for all IDE generators:

```javascript
abstract class BaseGenerator {
  generate(ast) => string;  // Implemented by subclasses
  getTargetPath() => string; // Target file path

  // Helper methods:
  buildHeader(ast)
  buildProjectOverview(ast)
  buildConventions(ast)
  buildCommands(ast)
  buildNotes(ast)
  buildAgents(ast)
  applyOverrides(ast, content)
}
```

### 5. IDE Generators

Each IDE extends BaseGenerator:

- `ClaudeGenerator` → CLAUDE.md
- `CursorGenerator` → .cursorrules
- `WindsurfGenerator` → .windsurf/rules/rosetta-rules.md

**Generator Logic**:
1. Call `validateAST(ast)` to ensure validity
2. Build sections (header, persona, overview, conventions, commands, notes, agents)
3. Apply IDE-specific overrides from `ide_overrides`
4. Return full markdown content

### 6. Commands

#### `sync-yaml`

Synchronizes `rosetta.yaml` to IDE configurations:

```bash
rosetta sync-yaml                    # Sync to all supported IDEs
rosetta sync-yaml --ides claude      # Specific IDEs only
rosetta sync-yaml --from custom.yaml # Custom YAML path
rosetta sync-yaml --dry-run --verbose
```

**Implementation**:
1. Find/parse `rosetta.yaml` (or `--from` file)
2. Get target IDEs based on `--ides` or all with generators
3. For each target: instantiate generator, generate content, write file
4. Provide feedback via TreeLogger
5. Handle errors per-IDE and continue

#### `validate-config`

Validates a `rosetta.yaml` file:

```bash
rosetta validate-config              # Auto-discover
rosetta validate-config --file path  # Specific file
```

Output:
```
✓ rosetta.yaml is valid
  Project: my-project
  Type: web_app
  Language: TypeScript
  Conventions: 3
  Agents: 2
  Notes: 4
```

#### `migrate-to-yaml`

Converts existing `.ai/master-skill.md` to `rosetta.yaml`:

```bash
rosetta migrate-to-yaml --dry-run   # Preview
rosetta migrate-to-yaml --verbose   # Detailed output
```

**Migration Strategy** (Best-Effort):
- Extract project name from first heading
- Parse project type from "Type:" line
- Parse stack from "Stack Focus:" line
- Parse risk level from "Risk Level:"
- Create canonical AST with extracted values and defaults
- Write `rosetta.yaml` with backup of original

If no `master-skill.md` exists, creates minimal YAML interactively.

### 7. Constants Update (`lib/constants.js`)

Added:
- `YAML_CONSTANTS`: DEFAULT_YAML_PATH, SCHEMA_PATH, YAML_TEMPLATES_DIR
- `GENERATORS`: Mapping of generator keys to classes
- Extended `TARGETS` with `generator` field for each supported IDE

## Schema Design

The JSON Schema (`schemas/rosetta-schema.json`) is the contract:

- **Required**: `schema_version`, `project`, `stack`
- **Enums**: `project.type` (6 values), `project.risk_level` (3), `agents[].style`, `agents[].scope`, `notes[].category`
- **Validation**:
  - `schema_version` must match `^\d+\.\d+\.\d+$`
  - Strings have min/max lengths
  - Arrays contain strings
  - `notes[].priority` 1-10
- **Optional**: All top-level fields except required ones
- **Metadata**: Managed by Rosetta (not user-edited)

## Data Flow

### Sync Operation

1. **Discovery**: Locate `rosetta.yaml` (current dir or parent)
2. **Parse**: Read and validate against schema
3. **Transform**: For each target IDE:
   - Instantiate generator (ClaudeGenerator, etc.)
   - `generator.generate(ast)` → markdown content
   - Apply IDE overrides from `ide_overrides`
4. **Write**: Use `fs.writeFile` (or dry-run preview)
5. **Report**: Success/failure counts, next steps

### Migration Operation

1. **Read**: `.ai/master-skill.md` (if exists)
2. **Parse**: Using heuristics (regex patterns) to extract fields:
   - Title → project.name
   - Type line → project.type (mapped to enum)
   - Stack Focus → stack.* (split by comma)
   - Risk Level → risk_level
3. **Build AST**: With extracted values + defaults for missing
4. **Validate**: Schema validation (warnings only)
5. **Write**: `rosetta.yaml` with metadata, backup originals

## IDE Overrides

Users can customize per-IDE output in `rosetta.yaml`:

```yaml
ide_overrides:
  claude:
    persona: "Senior Full-Stack Engineer"
    additional_context: "Monorepo structure"
  cursor:
    reasoning_modes: ["Memory Safety", "API Changes"]
  windsurf:
    collaboration_mode: "asynchronous"
```

Generators replace placeholder sections based on these overrides.

## Error Handling

- **Schema Validation**: Detailed error messages with path, expected, actual
- **File Operations**: Backups before writes, dry-run safety
- **Per-IDE Errors**: Sync continues even if one IDE fails; reports all errors
- **Missing YAML**: Clear error with suggestion: "rosetta init" or "migrate-to-yaml"

## Testing

Validation approach:
- Unit tests for AST methods (validate, merge, diff)
- Unit tests for YAML parser (parse, serialize, validate)
- Integration tests for sync-yaml command (dry-run, actual write)
- Test fixtures: minimal, web-app, invalid schemas

## Migration Path

**Phase 1** (Current): YAML→IDE sync only (one-way)
**Phase 2**: IDE→YAML translation (Markdown parser)
**Phase 3**: Round-trip preservation, diff/merge commands

## Dependencies Added

```json
{
  "dependencies": {
    "ajv": "^8.12.0",
    "ajv-formats": "^2.0.0"
  }
}
```

## Files Created

**Core Infrastructure:**
- `schemas/rosetta-schema.json` (1 file)
- `lib/ast/canonical.js` + `utils.js` + `metadata.js` (3 files)
- `lib/parsers/yaml-parser.js` (1 file)
- `lib/generators/base-generator.js`, `claude-generator.js`, `cursor-generator.js`, `windsurf-generator.js` (4 files)
- `lib/commands/sync-yaml.js` (1 file, also includes validate-config & migrate-to-yaml)
- `lib/validation/schema-validator.js` (1 file)
- `templates/yaml/minimal.yaml`, `web-app.yaml` (2 files)
- `docs/YAML-FIRST.md` (1 file)

**Modified:**
- `lib/constants.js` - Added YAML constants, generator fields
- `cli.js` - Registered new commands

**Total**: ~15 new files, 2 modified files

## Design Decisions

### 1. Why YAML over TOML/JSON?
- YAML is more readable for humans
- Supports comments (JSON does not)
- Already used in Rosetta (`js-yaml` dependency exists)
- Familiar to DevOps/configuration users

### 2. Why not modify existing sync?
The existing `sync` command verifies `.ai/master-skill.md` and regenerates IDE wrappers. To maintain backward compatibility, we created a new `sync-yaml` command. In future, these may be unified.

### 3. Why not auto-detect language from package.json?
That's planned for Phase 3 (`rosetta doctor`). Phase 1 focuses on YAML as source.

### 4. Why not include all 9 IDEs immediately?
We phased implementation:
- Phase 1: Claude, Cursor, Windsurf (3 most popular)
- Phase 2: Add remaining IDEs (Codex CLI, Copilot, Kilo Code, Continue.dev, Antigravity, GSD)

### 5. Why use `fs/promises` instead of `fs-extra` for write?
`fs-extra`'s `write` function uses fs.write (file descriptor) not writeFile. Using `fs.promises.writeFile` is clearer and avoids confusion.

## Success Criteria (Phase 1)

- [x] `rosetta.yaml` schema finalized and documented
- [x] Can sync `rosetta.yaml` to at least 3 IDE formats
- [x] Migration tool converts `.ai/master-skill.md` without data loss (best-effort)
- [x] Schema validation catches common errors
- [x] Commands work correctly (validated via manual testing)

## Validation Results

Manual testing performed on 2025-03-28:

```
$ rosetta validate-config --file rosetta.yaml
✓ rosetta.yaml is valid
  Project: my-web-app
  Type: web_app
  Language: TypeScript
  Conventions: 3
  Agents: 2
  Notes: 4

$ rosetta sync-yaml --dry-run --verbose
  ✓ CLAUDE.md would be updated
  ✓ .cursorrules would be created
  ✓ .windsurf/rules/rosetta-rules.md would be created

$ rosetta sync-yaml --verbose
  ✓ Wrote CLAUDE.md
  ✓ Wrote .cursorrules
  ✓ Wrote .windsurf/rules/rosetta-rules.md
```

All commands executed successfully without errors.

## Next Steps

### Phase 2 (Translation Layer)
- Implement MarkdownParser for parsing IDE formats back to AST
- Enhance `rosetta translate` to support YAML source/target
- Implement `rosetta diff` command
- Implement `rosetta merge` command with strategies
- Test round-trip conversion (preserve 95%+ data)

### Phase 3 (Enhanced Tooling)
- `rosetta validate` - comprehensive validation
- `rosetta schema` - show/explain schema
- `rosetta doctor` - health check with auto-detection from package.json
- `rosetta watch` mode for continuous syncing
- More IDE generators

### Phase 4 (Advanced)
- Auto-generation from project files (`rosetta doc`)
- Enhanced ideate modes (`--mode prd|arch|debug|review`)
- Context compaction integration

## Risks & Mitigations

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Breaking changes to existing `sync` | Low | Medium | New command is additive, not breaking |
| Migration data loss | Medium | High | Backup files, best-effort + manual review |
| Schema evolution pain | Medium | Medium | Versioned schema, migration tools |
| Incomplete IDE generators | Low | Low | Phase rollout, graceful skip |
| Performance on large projects | Low | Low | Lazy loading, caching future |

## Conclusion

The YAML-first architecture successfully establishes a canonical source-of-truth for Rosetta configurations. Phase 1 implementation is complete with core infrastructure operational and tested. The design provides a solid foundation for future phases (translation, enhanced tooling) while maintaining backward compatibility with the existing master-skill.md system.
