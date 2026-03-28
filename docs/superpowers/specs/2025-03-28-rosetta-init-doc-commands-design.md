# Rosetta Init & Doc Commands Design

> **Status:** Approved
> **Created:** 2025-03-28
> **Author:** Claude Code

## Goal

Build the scaffolding layer for rosetta CLI - two new commands:
- `rosetta init` - interactive wizard that generates agentic config files
- `rosetta doc` - non-interactive stack inference that outputs a CLAUDE.md draft

Both commands are fully offline and make no LLM calls.

## Architecture

```
CLI Entry (cli.js)
       │
       ▼
Stack Detection Layer (lib/detectors/)
       │
       ▼
Template Compilation (lib/templates/stack-compiler.js)
       │
       ▼
Output Generation (CLAUDE.md, .cursorrules, etc.)
```

**Key Design Decisions:**
- Stack templates with IDE variants - single template per stack with `{{#IDE <name>}}` blocks
- Shared sections outside IDE blocks appear in all outputs
- Variable injection via handlebars: `{{PROJECT_NAME}}`, `{{FRAMEWORK}}`, etc.
- Audit validation with score ≥ 75 required for init

## File Structure

```
lib/
├── detectors/
│   ├── stack-detector.js          # Main orchestrator
│   ├── node-detector.js           # package.json analysis
│   ├── python-detector.js         # requirements.txt/pyproject.toml
│   ├── rust-detector.js           # Cargo.toml analysis
│   └── swift-detector.js          # Podfile/Xcode analysis
├── templates/
│   ├── stack-compiler.js          # IDE section extraction
│   └── variable-injector.js       # Handlebars injection
├── validators/
│   └── audit-validator.js         # Score ≥ 75 validation
├── commands/
│   ├── init.js                    # Interactive init wizard
│   └── doc.js                     # Non-interactive doc generator
└── utils/
    ├── inquirer-helpers.js        # @inquirer/prompts utilities
    └── file-backup.js             # Backup functionality

templates/stacks/
├── next.js.md                     # Next.js stack template
├── react-vite.md                  # React + Vite stack template
├── node-api.md                    # Node API stack template
├── swift-ios.md                   # Swift iOS stack template
└── python-fastapi.md              # Python FastAPI stack template
```

## Data Flow: rosetta init

1. **Detect current directory** - Check for package.json, Podfile, requirements.txt, Cargo.toml
2. **Interactive wizard** - Confirm stack, select IDEs (pre-select detected), enter project details
3. **Check existing files** - Prompt for each: overwrite, skip, or backup?
4. **Load stack template** - Read from templates/stacks/<stack>.md
5. **Generate outputs** - Extract IDE sections, inject variables, write files
6. **Audit validation** - Run rosetta audit, check score ≥ 75, prompt if failed
7. **Success message** - Show what was generated

## Data Flow: rosetta doc

1. **Read project files** - package.json, tsconfig.json, .eslintrc, prettier config
2. **Infer configuration** - Framework, test runner, linter, formatter, build tool
3. **Generate CLAUDE.md draft** - Inferred values filled in, unknowns as `<!-- TODO -->`
4. **Output to stdout** - User can redirect or copy-paste

## Template Format

Templates use `{{#IDE <name>}}...{{/IDE}}` blocks for IDE-specific content:

```markdown
# {{PROJECT_NAME}}

## Project Overview
{{PROJECT_DESCRIPTION}}

{{#IDE claude}}
## Claude Code Configuration
### Standard Operating Procedures
1. **Sync State**: Run `rosetta sync` before starting work
{{/IDE}}

{{#IDE cursor}}
## Cursor AI Configuration
### Project Context
You are working on a **Next.js** application.
{{/IDE}}

## Testing
**Test Runner:** {{TEST_RUNNER}}
```

## Stack Detection Results Structure

```javascript
{
  detected: true,
  stack: 'next.js',
  confidence: 'high',  // 'high', 'medium', 'low'
  language: 'typescript',
  framework: 'next.js',
  testRunner: 'jest',
  linter: 'eslint',
  formatter: 'prettier',
  buildTool: 'turbopack',
  evidence: {
    files: ['package.json', 'tsconfig.json'],
    dependencies: ['next@14.2.0'],
    devDependencies: ['jest'],
    scripts: { dev: 'next dev', build: 'next build', test: 'jest' }
  }
}
```

## Supported Stacks

1. **next.js** - Next.js with App Router, TypeScript, Jest
2. **react-vite** - React with Vite, TypeScript, Vitest
3. **node-api** - Express/Fastify/NestJS API, TypeScript, Jest
4. **swift-ios** - iOS app with SwiftUI/UIKit, XCTest
5. **python-fastapi** - FastAPI with pytest, black, ruff

## Audit Integration

After generating files, run `rosetta audit` on each:
- Check score ≥ 75
- Show warnings for failed files
- Prompt user: continue anyway or retry?
- Exit with error if user cancels

## CLI Options

**rosetta init:**
- `--dry-run` - Show what would be generated without writing
- `--yes` - Skip prompts, use defaults (requires detected stack)
- `--ide <ide>` - Specify IDE to generate (can use multiple times)

**rosetta doc:**
- `--output <path>` - Write to file instead of stdout
- `--json` - Output inferred config as JSON
- `--include-inferred` - Show all inferred values in comments
