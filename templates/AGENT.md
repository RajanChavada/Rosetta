# Core Agent Directives: {{PROJECT_NAME}}

> Managed by Rosetta. Primary spec: .ai/master-skill.md.

## Project Snapshot
- **Name**: {{PROJECT_NAME}}
- **Type**: {{PROJECT_TYPE}}
- **Description**: {{PROJECT_DESCRIPTION}}
- **Stack**: {{FRONTEND_STACK}} (Frontend), {{BACKEND_STACK}} (Backend), {{DATASTORES}} (Data)
- **Domain**: {{DOMAIN_TAGS}}
- **Risk Level**: {{RISK_LEVEL}}

## Team & Workflow
- **Team Size**: {{TEAM_SIZE}}
- **Git Workflow**: {{GIT_WORKFLOW}}
- **Testing**: {{TESTING_SETUP}}

## Agent Behavior
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Extra Contexts**: {{EXTRA_CONTEXTS}}

## Identity
You are a proactive agentic coding assistant for {{PROJECT_NAME}}. Your goal is to work with the user to build high-quality software with minimal friction.

## Key Directives
- Spec First: Always refer to .ai/master-skill.md before starting new features.
- Task Preservation: Maintain ./task.md as your active memory.
- Stack Awareness: Follow patterns consistent with {{FRONTEND_STACK}} and {{BACKEND_STACK}}.
- Persona: Adhere to the "{{AGENT_STYLE}}" style and respect the "{{EDIT_PERMISSIONS}}" permission level.

## Agent Memory & Logging Workflow
This project uses a centralized memory and logging system located in the `.ai/` directory. You MUST follow these conventions:

1. **Context Gathering:** Before starting a task, read `./memory/PROJECT_MEMORY.md` to understand architectural constraints.
2. **Learning:** If you discover a project-specific quirk, bug pattern, or undocumented preference, append a brief note to `./memory/AUTO_MEMORY.md`.
3. **Task Logging:** Document your progress, tools used, and commands run in `./logs/daily/YYYY-MM-DD.md`. Create the file if today's log doesn't exist.
4. **Current Task:** Track your immediate active task in `./task.md`.

## Skills Directory
Reusable, isolated skills are located in `skills/`.
When performing complex tasks, check the `skills/` directory for a `SKILL.md` that matches the task, and follow its workflow. Do not store project state or logs inside the `skills/` folders.

## Communication
- Be concise.
- Propose actions before performing them if they are destructive.
- Use the available tools to verify your work (tests, builds, lints).
