# Skill Ideation Guide

How to discover and create high-leverage Rosetta skills for your project.

## Overview

The `rosetta ideate` command generates a skill ideation template that you use in your IDE to create custom skills tailored to your specific project and workflows.

### Key Principles

- **CLI scaffolds only** - The Rosetta CLI only creates template files and structures. No AI calls are made from the CLI.
- **IDE-based ideation** - You paste the template into your IDE's AI agent for interactive skill design.
- **Your API keys** - All AI operations use your own LLM provider keys (Claude, OpenAI, etc.) configured in your IDE.
- **Manual approval** - You review and approve each skill before implementation.

## Quick Start

```bash
# Generate ideation template
rosetta ideate

# Open the generated .ai/skill-ideation-template.md file
# Copy its content and paste into your IDE agent

# Answer the agent's clarifying questions
# Review proposed skills
# Approve and implement
```

## The Workflow

### Step 1: Scafo`auto` ‑ideate `[output .ai/skill-ideation-template.md`

The `ideate` command performs deep project analysis and generates a markdown template containing:

- **Project context** - Languages, frameworks, testing setup, architecture pattern
- **Structured prompt** - Instructions for your IDE AI agent
- **Output format specification** - Exact format for skill proposals

No AI calls are made. The command is pure scaffolding.

### Step 2: Use in Your IDE

Open your IDE (VS Code with Claude Code, Cursor, etc.) and paste the template content into your AI agent's chat.

The template instructs the agent to:

1. Ask 3–5 clarifying questions about your pain points and desired automations
2. Review the project context provided
3. Propose 1–5 skills, each with:
   - `name` - Unique identifier
   - `domains` - Categories like "backend", "testing", "frontend"
   - Description (2–3 sentences)
   - When to invoke it
   - Draft `SKILL.md` frontmatter and instructions

### Step 3: Review and Refine

The AI agent produces proposals in the specified format. You can:

- Ask for clarifications or adjustments
- Request different skill ideas
- Refine the `SKILL.md` content

### Step 4: Implement Approved Skills

For each approved skill:

```bash
# Create skill file from template
rosetta new-skill <skill-name> --from-suggestion
```

Or manually create `.claude/skills/<skill-name>.md` with the drafted content.

## Template Structure

The generated `.ai/skill-ideation-template.md` looks like:

```markdown
# Rosetta Skill Ideation Session

You are an expert AI assistant integrated into my IDE...

## Context about this project

- Languages: TypeScript, Node.js
- Frameworks detected: Express, React, Jest
- Tests present: Jest, Supertest
- Notable directories: src, test, lib, docs
- Repo size: 250 files, ~50,000 lines of code
- Architecture: Monolith with API + frontend

## Your task

1. Ask me 3–5 clarifying questions...
2. Based on my answers and the repo structure...
3. Keep each skill...

## Output format

When you're ready with proposals, respond with:

```md
# Proposed Skills

## 1. <skill-name>
- Domains: [...]
- When to use: ...
...
```yaml
---  # SKILL.md
name: ...
description: ...
domains:
  - ...
...
---
<instructions>
```

## Rosetta's philosophy

- CLI only scaffolds files...
- Runtime agent behavior happens in the IDE...
- Skills should be IDE-agnostic...
```

## Output Format Specification

When the AI agent proposes skills, they MUST follow this exact format:

```md
# Proposed Skills

## 1. api-auth
- Domains: ["backend", "security"]
- When to use: When implementing or modifying authentication flows
- Why it matters: Centralizes auth logic, ensures consistency, reduces security vulnerabilities

```yaml
---  # SKILL.md
name: api-auth
description: Streamlines authentication and authorization workflows
domains:
  - backend
  - security
triggers:
  - when creating new auth middleware
  - when modifying user permissions
actions:
  - verify token validation logic
  - check role-based access control
  - validate password reset flows
---
Implement OAuth2/JWT best practices. Include middleware templates, token handling, and role checks. Avoid hardcoded secrets. Prompt user for auth provider if ambiguous.
```
```

### `SKILL.md` Frontmatter Fields

| Field | Description |
|-------|-------------|
| `name` | Skill identifier (kebab-case) |
| `description` | 1–2 sentence summary |
| `domains` | Categories: `backend`, `frontend`, `testing`, `infrastructure`, `data`, `security`, etc. |
| `triggers` | When this skill should be invoked |
| `actions` | Specific tasks the skill should perform |

### Instructions Section

After the YAML frontmatter, include detailed instructions for the agent:

- Step-by-step workflow
- Code patterns to use/avoid
- File locations and conventions
- Validation steps
- Testing considerations

**Keep it under 120 lines total.**

## Command Reference

```bash
# Generate template in default location
rosetta ideate

# Specify custom project path
rosetta ideate path/to/project

# Preview without writing files
rosetta ideate --dry-run

# Save to custom path
rosetta ideate --output custom-template.md

# Get JSON output for tooling
rosetta ideate --json
```

### Options

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `[project-path]` | positional | `process.cwd()` | Directory to analyze |
| `--output, -o` | string | `.ai/skill-ideation-template.md` | Output file path |
| `--dry-run` | boolean | `false` | Show analysis without writing |
| `--json` | boolean | `false` | Output analysis as JSON |
| `--verbose` | boolean | `false` | Show detailed analysis logs |

## Integration Points

### With `rosetta scaffold`

When you run `rosetta scaffold --auto-ideate`, Rosetta automatically runs `ideate` after scaffolding to help you customize skills for your project.

```bash
# Scaffold and generate ideation template in one command
rosetta scaffold --auto-ideate

# Specify custom output path for the template
rosetta scaffold --auto-ideate --ideate-output .ai/my-ideation.md

# Preview what would be generated (dry-run mode)
rosetta scaffold --auto-ideate --dry-run
```

This is especially useful for the "skill-creator" preset, which provides a workflow for building skills directly from ideation.

### With `rosetta new-skill`

After receiving skill proposals from your IDE agent:

```bash
# Create skill file from proposal
rosetta new-skill <skill-name> --from-suggestion

# Or manually copy the SKILL.md content to:
# .claude/skills/<skill-name>.md
```

### With `rosetta sync`

Generated skills are automatically included in your Rosetta configuration and synchronized across all IDE wrappers.

## Project Analysis Details

The `analyzeProjectForIdeation()` function gathers:

### Languages
- Detects from `package.json`, `go.mod`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `Gemfile`
- Reports primary language and any auxiliary languages

### Frameworks
- Node.js: React, Next.js, Vue, Svelte, Angular, Express, NestJS, Fastify, Koa, etc.
- Python: Django, FastAPI, Flask
- Go: Gin, Echo, Fiber, Gorm
- Ruby: Rails
- Plus datastores: Postgres, MongoDB, Redis, etc.

### Testing
- Detects testing frameworks from dependencies and test file patterns
- Reports: Jest, Vitest, Mocha, PyTest, Go test, RSpec, etc.

### Directories
- Scans project structure
- Filters out `node_modules`, `.git`, `dist`, `build`
- Shows top-level organization

### Repository Size
- Counts files (excluding vendor dirs)
- Estimates lines of code (LOC)

### Architecture
- Infers architecture pattern from structure and dependencies:
  - Next.js full-stack
  - Monolith with API + frontend
  - Microservices
  - CLI tool
  - Library/SDK
  - Unknown/other

### Cloud Infrastructure
- Detects Docker, Kubernetes, Terraform, Serverless Framework
- Identifies Cloud SDKs (AWS, GCP, Azure) in Node.js, Python, and Go projects
- Reports on providers, orchestration tools, and specific cloud services used

### Mobile Development
- Detects iOS (Swift/ObjC) and Android (Kotlin/Java) native structures
- Identifies cross-platform frameworks: Flutter, React Native, Expo
- Reports on platforms (iOS, Android) and build tools

### DevOps & CI/CD
- Detects CI systems: GitHub Actions, GitLab CI, CircleCI, Jenkins
- Identifies automation tools: Terraform, Make, shell scripts
- Analyzes `package.json` for build and automation scripts

## Design Rationale

### Why Scaffold-Only?

The Rosetta philosophy separates **scaffolding** (CLI) from **runtime behavior** (IDE agent):

- **No API keys in CLI** - Safer, no token management
- **IDE has full context** - The agent sees your open files, git diff, errors
- **Interactive refinement** - Agent can ask questions and adjust based on your answers
- **Better prompting** - Humans + AI beats automated generation
- **User ownership** - You control the final skill content

### Comparison: Old vs. New

| Aspect | Old (AI-powered `ideate`) | New (Scaffold-only) |
|--------|---------------------------|---------------------|
| AI calls from CLI | Yes (Anthropic/OpenAI) | No |
| API key required | Yes (in CLI) | No |
| Skill installation | Automatic | Manual (after review) |
| Interactivity | None (batch generation) | Full Q&A in IDE |
| Flexibility | Limited to prompt | Dynamic clarification |
| Philosophy | CLI does everything | CLI scaffolds, IDE executes |

### Migration Path

If you used the old AI-powered ideate:

1. **Old behavior:** Ran `rosetta ideate` and got pre-generated skills directly in `.claude/skills/`
2. **New behavior:** Run `rosetta ideate` to get a template, then use IDE agent to design skills
3. **Benefit:** Higher quality, customized skills through interactive design

**No breaking changes** - The command interface remains the same. Only the internal behavior changed from `install skills` → `create template`.

## Examples

### Example 1: Typical Web App

```bash
$ rosetta ideate
● Generating skill ideation template...
┣━ Analyzing project structure... ✓
┣━ Generating ideation template... ✓
┗━ Done

✅ Ideation template generated successfully!

Template saved to: .ai/skill-ideation-template.md

Next steps:
1. Open the template file in your IDE
2. Paste the content into your AI agent
3. Answer the clarifying questions to generate skill suggestions
```

Open `.ai/skill-ideation-template.md`, copy content, paste into Claude Code:

```
Human: I'm working on an Express.js API with PostgreSQL and need help with...

AI: Great! Let me ask a few questions:
1. What's your typical workflow when adding a new database model?
2. Do you write API documentation? Which format?
3. Are there any repetitive validation tasks you do?

Based on your answers, I propose:
1. `api-crud-scaffolder` - Generate RESTful endpoints with validation
2. `docs-openapi-sync` - Keep OpenAPI spec in sync with routes
...
```

### Example 2: Dry-Run Preview

```bash
$ rosetta ideate --dry-run
● Generating skill ideation template...
┣━ Analyzing project structure... ✓
┣━ Generating ideation template... ✓
┗━ Done

✅ Ideation template generated successfully!

Dry run: Template would be saved to: .ai/skill-ideation-template.md

Template preview:
---
# Rosetta Skill Ideation Session
...
(full template would be written)
---
```

### Example 3: JSON Output for Automation

```bash
$ rosetta ideate --json
{
  "analysisResults": {
    "languages": ["Go"],
    "frameworks": ["gin", "gorm"],
    "tests": ["testing"],
    "directories": ["cmd", "internal", "pkg", "api"],
    "repoSize": { "files": 85, "loc": 12450 },
    "primaryArchitecture": "Clean architecture with gin/gorm",
    "projectName": "my-api",
    "projectPath": "/path/to/my-api"
  },
  "templatePath": ".ai/skill-ideation-template.md"
}
```

## Troubleshooting

### `ideate` command not found

Ensure Rosetta CLI is installed:

```bash
npm install -g @rosetta/cli
# or
npx @rosetta/cli ideate
```

### Template not generating

Check that the project path exists and is readable. The command needs to scan:
- Configuration files (package.json, go.mod, etc.)
- Source directories
- Test directories

### IDE agent not following instructions

The template is designed for Claude (Anthropic) but works with other LLMs. If results are poor:

1. Ensure you copied the **entire** template content
2. Start a fresh chat in your IDE agent
3. Paste the template as the first message
4. Answer questions clearly and concisely

### Want to customize the template?

The template is generated from internal logic. To customize:
1. Run `rosetta ideate --output my-custom-template.md`
2. Manually edit the file
3. Use that file for your IDE session

To permanently change the template format, modify `lib/generators/ideation-template-generator.js`.

## Advanced Usage

### Custom Output Path

```bash
# Save to different location
rosetta ideate --output docs/ideation/template.md

# Useful for versioning templates
rosetta ideate --output .ai/ideation-2024-Q1.md
```

### Analysis Without File Creation

```bash
# See what would be generated
rosetta ideate --dry-run --verbose

# Pipe to other tools
rosetta ideate --json | jq '.analysisResults.languages'
```

### Batch Projects

```bash
# Generate templates for multiple projects
for d in projects/*/; do
  (cd "$d" && rosetta ideate)
done
```

### Integration with CI/CD

Add to your project setup:

```bash
#!/bin/bash
# setup-ideation.sh
set -e
rosetta ideate --output .ai/ONBOARDING.md
echo "✅ Ideation template generated. Share with your team to customize Rosetta skills."
```

## Contributing

To improve the `ideate` command:

1. **Modify analysis logic**: `lib/context.js` → `analyzeProjectForIdeation()`
2. **Modify template content**: `lib/generators/ideation-template-generator.js` → `generateSkillIdeationTemplate()`
3. **Add new analyzers**: Extend `lib/analyzers/` and import in `context.js`
4. **Update tests**: `test/context/` and `test/generators/`

Run tests:

```bash
node test-runner.js
# or run specific test
node test-runner.js test/generators/ideation-template-generator.unit.test.js
```

## FAQ

**Q: Does `ideate` make any network calls?**
A: No. It only reads local files and writes a markdown template.

**Q: Can I use my own template instead?**
A: Yes. Create any markdown file with your preferred prompt structure. No need to use `rosetta ideate`.

**Q: How is this different from `rosetta new-skill`?**
A: `new-skill` creates a skill file immediately (from template or boilerplate). `ideate` creates a template for interactive design *in your IDE*.

**Q: Can I automate this in CI?**
A: Yes, use `--dry-run` and `--json` for analysis without file writes.

**Q: Should I commit the generated template?**
A: Yes! `.ai/skill-ideation-template.md` can be committed and shared with team members. It's a living document.

**Q: What if my IDE agent suggests bad skills?**
A: Discard them and ask for alternatives. The AI agent is a collaborator, not an authority. You decide what skills to implement.

**Q: How many skills should I create?**
A: Start with 3–5. Focus on high-frequency workflows. You can always add more later.

**Q: Can I use the same template for multiple IDEs?**
A: Yes. The template is IDE-agnostic. It works with Claude Code, Cursor, Copilot, Windsurf, etc.

## Glossary

- **IDE agent** - The AI assistant integrated in your editor (Claude Code in VS Code, Cursor's agent, etc.)
- **Skill** - A Rosetta `.md` file with frontmatter and instructions that guides agent behavior
- **Scaffolding** - Creating files and directory structures without AI involvement
- **Template** - The markdown file generated by `rosetta ideate` that prompts the IDE agent
- **Project context** - Information about languages, frameworks, architecture that informs skill design

## Further Reading

- [README.md](../README.md) - Project overview and all commands
- [docs/SKILLS.md](SKILLS.md) - Skills system deep dive
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) - Rosetta's architecture principles
- [docs/MIGRATION.md](MIGRATION.md) - Migrating from other agent config systems