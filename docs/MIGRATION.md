# Migration Guide: Rosetta v0.2.0

This guide helps you upgrade from earlier versions of Rosetta to v0.2.0.

## What's New in v0.2.0

### New IDE Support
- **Codex CLI** - `.codex/rules.md`
- **Kilo Code** - `.kilo/rules.md`
- **Continue.dev** - `.continue/config.md`

### New Commands
- `rosetta add-ide [name]` - Add a new IDE to existing setup
- `rosetta translate <file> --to <format>` - Convert between IDE formats
- `rosetta translate-all --to <format>` - Bulk migrate all configs

### Auto-Detection
- Automatic project type detection (Node.js, Python, Go, Rust, Ruby)
- Tech stack inference from dependencies
- Smarter default context values

### AI Analysis (Optional)
- `--use-ai` flag for scaffold
- Support for Anthropic and OpenAI APIs
- Uses your own API tokens only

### Modular Architecture
- Code refactored into clean modules under `lib/`
- Easier to extend and maintain
- Better separation of concerns

## Breaking Changes

There are **no breaking changes** for existing Rosetta projects.

All existing commands continue to work as before:
- `rosetta scaffold`
- `rosetta sync`
- `rosetta migrate`
- `rosetta health`

Your existing `.ai/` structure remains unchanged.

## Migration Steps

### 1. Update Rosetta

```bash
npm update @rosetta/cli
# or
npm install -g @rosetta/cli@latest
```

### 2. Verify Your Setup

Run a health check to ensure everything is working:

```bash
rosetta health
```

You should see a 100/100 score if your setup was previously healthy.

### 3. Try New Features

#### Add a New IDE

If you want to add support for a new IDE:

```bash
rosetta add-ide codex
# or interactive
rosetta add-ide
```

#### Translate Between Formats

Convert an existing config to a different IDE format:

```bash
# Convert Cursor rules to Claude format
rosetta translate .cursorrules --to claude --output CLAUDE.md

# Preview bulk conversion
rosetta translate-all --to codex --dry-run
```

#### Use AI Analysis

Enable AI-powered context detection:

```bash
# Set your API key
export ANTHROPIC_API_KEY=your-key
# or
export OPENAI_API_KEY=your-key

# Run scaffold with AI
rosetta scaffold --use-ai --provider anthropic
```

### 4. Update Your Config (Optional)

If you use `.rosetta.json`, you can now leverage new auto-detection:

```json
{
  "autoContext": {
    "enabled": true
  },
  "skills": {
    "alwaysInclude": ["node-express-postgres"]
  },
  "defaultIdes": ["VSCode / Claude Code", "Cursor"],
  "defaultPreset": "agentic-starter"
}
```

## Module Reference

The new modular structure under `lib/`:

| Module | Purpose |
|--------|---------|
| `constants.js` | Configuration constants and templates |
| `utils.js` | Utility functions (TreeLogger, dryRunWrite) |
| `config.js` | Config loading and profile management |
| `templates.js` | Template rendering and file operations |
| `ide-adapters.js` | IDE sync logic |
| `context.js` | Context gathering and auto-detection |
| `skills.js` | Skill management |
| `migration.js` | Migration tools |
| `validation.js` | Health and validation |
| `registry.js` | Registry management |
| `cli-helpers.js` | CLI flow helpers |
| `commands/add-ide.js` | Add IDE command |
| `commands/translate.js` | Format translation |
| `commands/translate-all.js` | Bulk translation |
| `translators/base.js` | Translation engine |
| `ai-client.js` | AI client abstraction |
| `ai-analyzers/project.js` | AI project analysis |
| `ai-analyzers/context.js` | AI context enhancement |

## Troubleshooting

### Auto-Detection Not Working

If auto-detection doesn't find your project type:

1. Ensure you have a valid config file (package.json, go.mod, etc.)
2. Check file permissions
3. Use manual context gathering: `rosetta scaffold` without auto-detection

### AI Analysis Failing

If AI analysis fails:

1. Verify your API key is set correctly
2. Check your network connection
3. Try without AI: `rosetta scaffold` (without `--use-ai`)

### Translation Issues

If format translation produces unexpected results:

1. Use `--dry-run` to preview first
2. Verify the source file is valid
3. Manually review and edit the output

## Support

For issues or questions:
- GitHub Issues: https://github.com/RajanChavada/Rosetta/issues
- Email: support@rosetta.ai
