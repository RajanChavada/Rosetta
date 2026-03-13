# GSD Skill for {{PROJECT_NAME}}

> Managed by Rosetta. Primary spec: .ai/master-skill.md.

## Project Snapshot
- **Type**: {{PROJECT_TYPE}}
- **Stack**: {{FRONTEND_STACK}} / {{BACKEND_STACK}} / {{DATASTORES}}
- **Domain**: {{DOMAIN_TAGS}}
- **Risk Level**: {{RISK_LEVEL}}

## Team & Workflow
- **Team Size**: {{TEAM_SIZE}}
- **Testing**: {{TESTING_SETUP}}

## Agent Guidelines
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Extra Contexts**: {{EXTRA_CONTEXTS}}

## Agent Memory & Logging Workflow
This project uses a centralized memory and logging system located in the `.ai/` directory. You MUST follow these conventions:

1. **Context Gathering:** Before starting a task, read `.ai/memory/PROJECT_MEMORY.md` to understand architectural constraints.
2. **Learning:** If you discover a project-specific quirk, bug pattern, or undocumented preference, append a brief note to `.ai/memory/AUTO_MEMORY.md`.
3. **Task Logging:** Document your progress, tools used, and commands run in `.ai/logs/daily/YYYY-MM-DD.md`. Create the file if today's log doesn't exist.
4. **Current Task:** Track your immediate active task in `.ai/task.md`.

## Instructions for Agent
When using Get Shit Done (GSD) in this repository:
1. Ensure all generated artifacts (PROJECT.md, etc.) align with .ai/master-skill.md and .ai/AGENT.md.
2. Follow the 3-level memory layout in .ai/ for task tracking and context.
3. If a new skill is needed, use `rosetta new-skill <name>`.
