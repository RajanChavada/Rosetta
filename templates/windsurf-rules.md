# Windsurf Rules for {{PROJECT_NAME}}

> Managed by Rosetta. Primary spec: .ai/master-skill.md.

## Project Snapshot
- **Name**: {{PROJECT_NAME}}
- **Type**: {{PROJECT_TYPE}}
- **Stack**: {{FRONTEND_STACK}} (Frontend), {{BACKEND_STACK}} (Backend), {{DATASTORES}} (Data)
- **Domain**: {{DOMAIN_TAGS}}
- **Risk Profile**: {{RISK_LEVEL}}

## Team & Workflow
- **Team Size**: {{TEAM_SIZE}}
- **Git Workflow**: {{GIT_WORKFLOW}}
- **Testing**: {{TESTING_SETUP}}

## Agent behavior
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Extra Contexts**: {{EXTRA_CONTEXTS}}

## Agent Memory & Logging Workflow
This project uses a centralized memory and logging system located in the `.ai/` directory. You MUST follow these conventions:

1. **Context Gathering:** Before starting a task, read `.ai/memory/PROJECT_MEMORY.md` to understand architectural constraints.
2. **Learning:** If you discover a project-specific quirk, bug pattern, or undocumented preference, append a brief note to `.ai/memory/AUTO_MEMORY.md`.
3. **Task Logging:** Document your progress, tools used, and commands run in `.ai/logs/daily/YYYY-MM-DD.md`. Create the file if today's log doesn't exist.
4. **Current Task:** Track your immediate active task in `.ai/task.md`.

## Professional Conduct
- Refer to .ai/master-skill.md for core technical rules.
- Follow directives in AGENT.md for role and stack awareness.
- Be mindful of {{DOMAIN_TAGS}} and {{RISK_LEVEL}} during development.
- Respect {{GIT_WORKFLOW}} and {{TESTING_SETUP}} requirements.
- Check the `skills/` directory for reusable project-specific logic and tools.
