# Rosetta Skills System

Rosetta implements a dual skills system to serve two different purposes:

1. **Claude Code Skills** (`.claude/skills/`) - For working ON the Rosetta project
2. **Rosetta CLI Skills** (`templates/skills/`) - For creating skills FOR projects

This distinction is important because each skill type serves a different workflow and user group.

---

## Overview

| Skill Type | Location | Purpose | Target Users |
|------------|----------|---------|--------------|
| **Claude Code Skills** | `.claude/skills/` | Load focused context when developing Rosetta CLI | Claude Code users working on Rosetta |
| **Rosetta CLI Skills** | `templates/skills/` | Templates for scaffolding skills into other projects | Project teams using Rosetta CLI |

---

## Claude Code Skills (`.claude/skills/`)

### Purpose

Claude Code skills are used **internally** by the Rosetta development team. They provide focused context loading for developing the Rosetta CLI tool itself.

### Location

```
.claude/skills/
├── frontend-context.md
├── backend-context.md
└── testing-context.md
```

### Available Skills

| Skill | Purpose | Usage |
|-------|---------|-------|
| `frontend-context` | Frontend-related docs, styles, patterns | `/frontend-context` command in Claude Code |
| `backend-context` | Backend, API, domain logic | `/backend-context` command in Claude Code |
| `testing-context` | Test strategy, fixtures, CI/CD | `/testing-context` command in Claude Code |

### When to Use

- Loading context for specific domains (frontend, backend, testing)
- Large context situations where granular control is needed
- When exploring unfamiliar parts of the Rosetta codebase
- During development of the Rosetta CLI tool itself

### Skill Activation

Claude Code skills are loaded via slash commands:
```
/frontend-context
/backend-context
/testing-context
```

These skills load only the relevant documentation and code context for the specified domain.

---

## Rosetta CLI Skills (`templates/skills/`)

### Purpose

Rosetta CLI skills are **templates** that Rosetta generates and scaffolds into other projects. They represent domain-specific best practices, coding standards, and workflows that teams want to apply across their codebase.

### Location

```
templates/skills/
├── node-express-postgres.skill.md
├── frontend-react-next.skill.md
├── testing-full-pyramid.skill.md
└── data-ml-project.skill.md
```

### Available Skill Templates

| Skill | Stack | Domain | When to Use |
|-------|-------|--------|-------------|
| `node-express-postgres` | Node.js, Express, PostgreSQL | Backend APIs | Building RESTful APIs with Node stack |
| `frontend-react-next` | React, Next.js | Frontend | Building modern web applications |
| `testing-full-pyramid` | Testing | Quality Assurance | Establishing comprehensive test strategy |
| `data-ml-project` | Data Science, ML | Analytics | Building data pipelines and ML models |

### Skill Creation

Rosetta CLI provides commands to create new skills:

**Create a new skill from boilerplate:**
```bash
rosetta new-skill <name>
```

**Create a skill from an existing template:**
```bash
rosetta new-skill <name> --template <existing-skill>
```

**Using custom skills during scaffold:**
```bash
rosetta scaffold --skills-dir ./company-skills
# or
rosetta scaffold --skills-repo https://github.com/company/skills
```

### Skill Structure

A Rosetta CLI skill follows this structure:

```markdown
---
name: skill-name
description: When to trigger this skill and what it does
---

# Skill Title

## Purpose
Brief description of what this skill accomplishes.

## When to Use
Clear conditions for when this skill should be loaded.

## Instructions
Detailed guidance for the AI agent.
```

Skills are copied to the target project's `.claude/skills/` directory during scaffolding.

---

## Commands Reference

### `rosetta skill <name>`

Load a specific skill and display its content.

**Usage:**
```bash
rosetta skill frontend-context
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Skill name to load |

---

### `rosetta skills`

List all available skills.

**Usage:**
```bash
rosetta skills
```

**Options:**
| Option | Description |
|---------|-------------|
| `--category <name>` | Filter by category (frontend, backend, testing) |

**Example:**
```bash
# List all skills
rosetta skills

# List frontend skills only
rosetta skills --category frontend
```

---

### `rosetta new-skill <name>`

Create a new skill folder with SKILL.md and tests/prompts.md boilerplates.

**Usage:**
```bash
rosetta new-skill <name> [options]
```

**Arguments:**
| Argument | Description |
|----------|-------------|
| `<name>` | Skill name |

**Options:**
| Option | Description |
|---------|-------------|
| `--template <name>` | Clone an existing skill template |
| `--skills-dir <path>` | Path to local skills directory |
| `--skills-repo <url>` | URL to git repo with skills |

**Example:**
```bash
# Create boilerplate
rosetta new-skill api-auth

# From template
rosetta new-skill payment --template stripe-integration

# From custom source
rosetta new-skill k8s-deploy --skills-dir ./ops-skills
```

---

## Best Practices

### When to Use Claude Code Skills

**Use Claude Code skills (`/frontend-context`, `/backend-context`, `/testing-context`) when:**

- Working on the Rosetta CLI project itself
- You need focused context on a specific domain
- The context window is approaching capacity (~60-70%)
- Exploring unfamiliar parts of the Rosetta codebase
- You're developing features related to a specific area

**Do NOT use Claude Code skills when:**
- Working on a project that uses Rosetta (not Rosetta itself)
- You need general project overview (use CLAUDE.md instead)
- The context window is small

### When to Use Rosetta CLI Skills

**Use Rosetta CLI skills (templates/skills/) when:**

- Scaffolding a new project with `rosetta scaffold`
- Establishing domain-specific standards for a team
- Creating reusable workflows for common tasks
- Codifying best practices for specific technology stacks

**Do NOT use Rosetta CLI skills when:**
- Developing Rosetta CLI itself (use Claude Code skills instead)
- You need simple one-off instructions (add to CLAUDE.md)

### Context Management

**For small context (<50% capacity):**
- Load CLAUDE.md for general project context
- Add specific files as needed

**For large context (>60% capacity):**
- Use domain-specific Claude Code skills (`/frontend-context`, etc.)
- Run `/compact` to preserve plan and active files
- Focus on the specific area you're working on

### Skill Creation Guidelines

**For Claude Code Skills:**
- Keep skills focused on a single domain
- Include relevant file paths and code patterns
- Reference documentation and architectural decisions
- Update when project structure changes

**For Rosetta CLI Skills:**
- Design for broad applicability across projects
- Include clear "When to Use" instructions
- Use templates for consistent structure
- Test with multiple project types before releasing

---

## Integration Points

### Scaffold Workflow

```
rosetta scaffold
  ├─ Detects project type and stack
  ├─ Loads relevant skills from templates/skills/
  ├─ Creates .ai/ structure
  └─ Copies selected skills to .claude/skills/
```

### Development Workflow

```
Working on Rosetta:
  ├─ Load CLAUDE.md (general context)
  ├─ Use /frontend-context (domain-specific)
  ├─ Read PLAN.md (current objectives)
  └─ Update TODO.md (action items)
```

### Session Management

```
At context 60-70%:
  ├─ Run /compact to summarize session
  ├─ Update PLAN.md with session handoff
  └─ Load domain skill for focused work
```

---

## See Also

- [API.md](API.md) - Complete command reference
- [CLAUDE.md](../CLAUDE.md) - Rosetta project instructions
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture
- [docs/Session-Management.md](Session-Management.md) - Working with PLAN.md and TODO.md
