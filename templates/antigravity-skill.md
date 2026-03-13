# Antigravity Skill: {{PROJECT_NAME}} Context

> Managed by Rosetta. Primary spec: .ai/master-skill.md.

## Project Snapshot
- **Type**: {{PROJECT_TYPE}}
- **Stack**: {{FRONTEND_STACK}} (Frontend), {{BACKEND_STACK}} (Backend), {{DATASTORES}} (Data)
- **Domain**: {{DOMAIN_TAGS}}
- **Risk Level**: {{RISK_LEVEL}}

## Team & Workflow
- **Team Size**: {{TEAM_SIZE}}
- **Testing**: {{TESTING_SETUP}}

## Agent Guidelines
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Extra Contexts**: {{EXTRA_CONTEXTS}}

## Skills catalog
- Per-feature skills and prompts are stored in the `skills/` directory.
- Use the skill catalog to find established patterns for {{PROJECT_TYPE}} development.

## Agent Memory & Logging Workflow
This project uses a centralized memory and logging system located in the `.ai/` directory. You MUST follow these conventions:

1. **Context Gathering:** Before starting a task, read `.ai/memory/PROJECT_MEMORY.md` to understand architectural constraints.
2. **Learning:** If you discover a project-specific quirk, bug pattern, or undocumented preference, append a brief note to `.ai/memory/AUTO_MEMORY.md`.
3. **Task Logging:** Document your progress, tools used, and commands run in `.ai/logs/daily/YYYY-MM-DD.md`. Create the file if today's log doesn't exist.
4. **Current Task:** Track your immediate active task in `.ai/task.md`.

## Directives
- Adhere to the master spec in .ai/master-skill.md.
- Follow behavior guidelines in .ai/AGENT.md.
