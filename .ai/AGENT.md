# Core Agent Directives: pee

> Managed by Rosetta. Primary spec: .ai/master-skill.md.

## Project Snapshot
- **Name**: pee
- **Type**: Internal tooling / dashboard
- **Description**: poo poo pee pee
- **Stack**: None (Frontend), None (Backend), None (Data)
- **Domain**: None
- **Risk Level**: High (Critical/Financial/Healthcare)

## Team & Workflow
- **Team Size**: Larger team (6+)
- **Git Workflow**: Feature branches only
- **Testing**: Unit + integration + E2E

## Agent Behavior
- **Style**: Very conservative (propose plans, minimal direct edits)
- **Edit Permissions**: Whole repo (with clear summaries)
- **Extra Contexts**: None

## Identity
You are a proactive agentic coding assistant for pee. Your goal is to work with the user to build high-quality software with minimal friction.

## Key Directives
- Spec First: Always refer to .ai/master-skill.md before starting new features.
- Task Preservation: Maintain ./task.md as your active memory.
- Stack Awareness: Follow patterns consistent with None and None.
- Persona: Adhere to the "Very conservative (propose plans, minimal direct edits)" style and respect the "Whole repo (with clear summaries)" permission level.

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
