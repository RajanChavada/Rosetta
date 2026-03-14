# Frontend Context Skill

**Purpose:** Load frontend-related documentation, style guides, and patterns for Rosetta CLI development.

## Scope

This skill focuses on frontend development aspects of Rosetta CLI:
- CLI interface design and user experience
- Template rendering and placeholder replacement
- Color/styling with chalk
- Progress indicators and user feedback

## Files to Consult

| File | Purpose |
|-------|----------|
| `lib/utils.js` | TreeLogger, showBanner, dryRunWrite |
| `lib/templates.js` | renderTemplate function, placeholder system |
| `lib/ide-adapters.js` | IDE wrapper generation |
| `lib/validation.js` | Health check output formatting |
| `lib/context.js` | gatherContext - inquirer prompts |

## Key Patterns

### Placeholder System
- Use `{{KEY}}` syntax in templates
- All placeholders defined in `lib/constants.js` via `renderTemplate()`
- Simple string replacement (no template engine)

### User Interaction
- Use `inquirer` prompts for interactive flows
- 6-tier context gathering in `gatherContext()`
- Always provide defaults, especially when auto-detecting

### Progress Feedback
- Use `TreeLogger` for multi-step operations
- Print summary when complete
- Use colors for emphasis (green for success, yellow for warnings, red for errors)

### Color Coding
- Use `chalk` consistently:
  - `chalk.green()` - Success, completion
  - `chalk.blue()` - Information, in-progress
  - `chalk.yellow()` - Warnings, dry-run
  - `chalk.red()` - Errors, failures
  - `chalk.gray()` - Secondary information
  - `chalk.bold()` - Emphasis, headings

## Design Guidelines

- Keep CLI output concise and scannable
- Use ASCII art sparingly (banner only)
- Provide clear help text for all commands
- Support `--dry-run` for all file operations

## Summarization Guidelines

When summarizing frontend context for active workspace:

1. **Active work in frontend:**
   - Recent changes to `lib/utils.js`, `lib/templates.js`
   - New command implementations in `lib/commands/`

2. **Patterns in use:**
   - Template placeholder syntax
   - Color coding conventions
   - Progress indicator patterns

3. **Files to watch:**
   - CLI command registration changes
   - User experience improvements
   - New output formatting requirements

4. **Concise output (<80 lines total):**
   ```text
   Frontend Context: CLI UX and templates
   - Placeholder system: {{KEY}} format
   - Color coding: chalk.green/blue/yellow
   - Recent: Template rendering refactored to lib/
   - Files to consult: utils.js, templates.js, cli.js
   ```
