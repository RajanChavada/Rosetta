# IDE Integration Patterns & Codebase Analysis Research Report

## Summary

This report documents Rosetta CLI's existing analysis capabilities, current subagent patterns, and provides recommendations for enhancing IDE agent integration through a new analysis command.

## 1. Existing Rosetta CLI Analysis Capabilities

### Current Analysis Functions

**Tech Stack Detection (`lib/context.js`):**
- `detectProjectType()` - Auto-detects project type from file structure
- `detectNodeProjectType()` - Detects Node.js frameworks from package.json
- `detectPythonProjectType()` - Detects Python frameworks from requirements.txt/pyproject.toml
- `inferStackFromDependencies()` - Extracts frontend, backend, and datastores from dependencies
- `detectRepoState()` - Identifies existing IDE setup (.vscode, .cursor, .windsurf, etc.)

**Key Detection Patterns:**
- **File-based detection**: Looks for package.json, go.mod, requirements.txt, pyproject.toml, Cargo.toml, Gemfile
- **Framework detection**: Analyzes dependencies for React, Express, Django, FastAPI, etc.
- **Project type classification**: Web app, API service, CLI tool, Data/ML project, Library/SDK, Internal tooling

**AI Analysis (opt-in via `--use-ai`):**
- `lib/ai-analyzers/project.js` - AI-powered project analyzer
- Samples key project files (package.json, README, .ai/master-skill.md)
- Uses Anthropic/OpenAI API keys (user's own keys, not Rosetta's)
- Provides analysis with purpose, frameworks, testing setup, conventions
- Converts AI analysis to Rosetta context format

### Current Command Structure
- **Analysis**: No dedicated analysis command exists
- **Scaffold**: Uses context gathering with auto-detection + AI option
- **Validation**: `validate`, `health`, `audit` - check Rosetta compliance score
- **Migration**: Convert existing IDE configs to Rosetta format

## 2. Current Subagent Patterns

### Subagent Architecture (`lib/subagents.js`)

**Configuration:**
- Two predefined subagents: `explore-codebase` and `security-review`
- Defined in `SUBAGENTS` constant with name, file path, description, timeout
- Spawn as separate Node.js processes with context injection

**Execution Flow:**
1. Load subagent configuration from `.claude/agents/<name>.md`
2. Write context to temp JSON file
3. Spawn subagent process with ROSETTA_AGENT env var
4. Parse structured output based on format

### Subagent Files Structure

**explore-codebase.md:**
- Purpose: Repository scanning and pattern finding
- Allowed tools: Read, Glob, Grep (limited set)
- Output format: Files found, key patterns, relationships, hotspots
- Constraints: Limited scope, no .git/node_modules, compact output

**security-review.md:**
- Purpose: Security scanning and dependency audit (read-only)
- Allowed tools: Bash (read-only), Grep, Read
- Checks: Dependencies vulnerabilities, hardcoded secrets, unsafe patterns
- Output: Dependencies, code issues, configuration problems, remediations

## 3. IDE Integration Patterns

### Supported IDEs (9 total):
1. **VSCode/Claude Code** - CLAUDE.md (anthropic-claude.md template)
2. **Cursor** - .cursorrules (cursorrules.md template)
3. **Antigravity** - .agent/skills/project-skill.md (antigravity-skill.md)
4. **GitHub Copilot** - .github/copilot-instructions.md (copilot-instructions.md)
5. **Windsurf** - .windsurf/rules/rosetta-rules.md (windsurf-rules.md)
6. **GSD/generic** - skills/gsd-skill.md (gsd-skill.md)
7. **Codex CLI** - .codex/rules.md (codex-cli.md)
8. **Kilo Code** - .kilo/rules.md (kilo-code.md)
9. **Continue.dev** - .continue/config.md (continue-dev.md)

### Template System:
- **Placeholder syntax**: `{{KEY}}` for project variables
- **Project context injected**: PROJECT_TYPE, FRONTEND_STACK, BACKEND_STACK, etc.
- **Behavior contract**: IDE wrappers reference master spec, don't overwrite by default
- **Sync operation**: Can regenerate from templates or verify existence

## 4. Recommended Codebase Scanning Techniques

### For Enhanced Analysis Command:

#### Phase 1: Basic Scanning
1. **File Pattern Detection:**
   - Use Glob to find source files (`**/*.{js,ts,py,go,rs,java,cpp,php,rb}`)
   - Identify build system files (package.json, pyproject.toml, Cargo.toml)
   - Detect test frameworks (jest, pytest, unittest, go test)
   - Find documentation patterns (README.md, docs/, .md files)

2. **Configuration Analysis:**
   - Package managers: npm, pip, yarn, pnpm, go modules, cargo
   - Build configurations: webpack, vite, rollup, makefile
   - Testing setup: test commands in package.json, pytest.ini
   - Linting: eslint, flake8, black, gofmt

#### Phase 2: Pattern Recognition
1. **Architecture Patterns:**
   - Monorepo vs single package (workspaces, pnpm)
   - Frontend frameworks: React, Vue, Angular patterns
   - Backend patterns: REST vs GraphQL, microservices indicators
   - Database patterns: ORM usage, query patterns

2. **Code Structure Analysis:**
   - Directory structure conventions
   - File naming patterns
   - Import/require patterns
   - Test location and naming

#### Phase 3: Advanced Analysis
1. **Dependency Analysis:**
   - Package versions and updates
   - Deprecated packages
   - Security vulnerabilities (npm audit equivalent)
   - Bundle size implications

2. **Code Quality Indicators:**
   - Code duplication patterns
   - Technical debt markers
   - TODO/FIXME patterns
   - Error handling patterns

## 5. IDE Agent Integration Recommendations

### New Analysis Command: `rosetta analyze [options]`

```bash
# Basic analysis
rosetta analyze

# Specific scope
rosetta analyze --scope tech-stack
rosetta analyze --scope architecture
rosetta analyze --scope dependencies

# Output formats
rosetta analyze --format json
rosetta analyze --format yaml
rosetta analyze --format markdown

# Generate IDE-specific configs
rosetta analyze --generate-vscode
rosetta analyze --generate-all-ides

# With AI enhancement
rosetta analyze --with-ai
```

### Analysis Output Structure:

```json
{
  "project": {
    "name": "project-name",
    "type": "web-app",
    "description": "Project description"
  },
  "techStack": {
    "language": "TypeScript/JavaScript",
    "frontend": ["React", "Next.js"],
    "backend": ["Express"],
    "datastores": ["PostgreSQL"],
    "build": ["Webpack", "TypeScript"]
  },
  "architecture": {
    "pattern": "monorepo",
    "structure": "src-layout",
    "testing": "jest + react-testing-library"
  },
  "dependencies": {
    "total": 245,
    "updates": {
      "major": 2,
      "minor": 12,
      "patch": 45
    }
  },
  "ideRecommendations": {
    "vscode": {
      "extensions": ["vscode-eslint", "dbaeumer.vscode-eslint"],
      "settings": {
        "typescript.preferences.importModuleSpecifier": "relative"
      }
    }
  }
}
```

### Integration with Existing Commands:

1. **Enhance Scaffold Command:**
   - Run `analyze` before scaffolding for better initial context
   - Use analysis to suggest appropriate starter skills
   - Generate IDE wrappers based on detected stack

2. **Enhance Sync Command:**
   - Run analysis before sync to detect changes
   - Suggest IDE wrapper updates if tech stack changed
   - Validate master-skill.md against current project state

3. **New Subagent for Deep Analysis:**
   - `code-analysis` subagent for deep code pattern analysis
   - Leverage existing explore-codebase patterns
   - Use AI integration for comprehensive understanding

## 6. Implementation Strategy

### Phase 1: Core Analysis
1. Create `lib/analysis.js` with basic scanning functions
2. Add `analyze` command to CLI
3. Implement JSON/YAML/Markdown output formats

### Phase 2: Enhanced Scanning
1. Add architecture pattern detection
2. Implement dependency analysis
3. Create IDE-specific recommendations

### Phase 3: AI Integration
1. Enhance AI analyzer to work with analysis command
2. Add intelligent IDE wrapper suggestions
3. Implement automatic skill recommendations

### Phase 4: Integration
1. Wire analysis into scaffold command
2. Enhance sync with analysis-based updates
3. Create code-analysis subagent

## 7. Key Technical Considerations

1. **Performance:**
   - Use incremental scanning when possible
   - Cache analysis results for large projects
   - Provide depth options (--depth basic/standard/detailed)

2. **Extensibility:**
   - Plugin system for custom analyzers
   - Configurable analysis profiles
   - Custom output formatters

3. **Error Handling:**
   - Graceful degradation when tools fail
   - Clear error messages for missing dependencies
   - Fallback to simpler analysis methods

4. **Security:**
   - Read-only scanning by default
   - Explicit opt-in for deeper analysis
   - Respect .gitignore and similar patterns

This research provides a foundation for implementing a comprehensive analysis command that enhances Rosetta's IDE integration capabilities while maintaining the existing modular architecture.