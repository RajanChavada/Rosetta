# Backend Context Skill

**Purpose:** Load backend, API, and domain logic documentation for Rosetta CLI development.

## Scope

This skill focuses on backend development aspects of Rosetta CLI:
- File system operations with fs-extra
- Configuration loading and profile management
- Registry API interactions
- Migration and validation logic

## Files to Consult

| File | Purpose |
|-------|----------|
| `lib/config.js` | loadConfig, useProfile, registry management |
| `lib/registry.js` | RegistryManager class, HTTP fetching |
| `lib/migration.js` | migrateExisting, findExistingAgentFiles |
| `lib/validation.js` | validateRepo, syncMemory, health checks |
| `lib/context.js` | detectRepoState, auto-detection logic |
| `lib/skills.js` | loadSkillsFromSources, skill creation |
| `lib/cli-helpers.js` | scaffoldNew, rescaffold, post-scaffold hooks |

## Key Patterns

### File Operations
- Always use `fs-extra` over native `fs` for better error handling
- Use `fs.ensureDir()` before writing files
- Check `fs.pathExists()` before reading
- Use backup pattern: copy to `.bak` before overwriting

### Configuration Layers
1. Global: `~/.rosetta/registry.json`, `~/.rosetta/active-profile.json`
2. Profile: Loaded from registry, merged with local config
3. Local: `.rosetta.json` in project root
4. CLI: Command-line options override everything

### Async Patterns
- All file operations are async functions
- Use `await fs.readJson()` and `await fs.writeJson()`
- Handle errors with try/catch and user-friendly messages

### API Interactions
- HTTP requests to fetch remote presets/skills
- HTTPS only for registry (security)
- Cache to local registry file after fetch

## Design Guidelines

- Never use symlinks for IDE wrappers (behavior contract)
- Support `--dry-run` for all destructive operations
- Provide clear error messages with chalk
- Auto-detect defaults but allow user override

## Summarization Guidelines

When summarizing backend context for active workspace:

1. **Active work in backend:**
   - Recent changes to `lib/config.js`, `lib/registry.js`
   - New auto-detection in `lib/context.js`
   - Migration improvements

2. **Patterns in use:**
   - fs-extra async operations
   - Configuration layering (global → profile → local → CLI)
   - HTTP fetching with https

3. **Files to watch:**
   - Configuration loading logic
   - Registry API changes
   - File operation safety patterns

4. **Concise output (<80 lines total):**
   ```text
   Backend Context: File ops and config
   - Async: await fs.readJson(), writeJson()
   - Layers: global ~/.rosetta → local .rosetta → CLI options
   - Recent: Auto-detection added to context.js
   - Files: config.js, registry.js, migration.js, cli-helpers.js
   ```
