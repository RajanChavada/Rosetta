# Active Task: {{PROJECT_NAME}}

> Managed by Rosetta. This is the single source of truth for your current objective.

## Identity & Guardrails
- **Persona**: Senior AI Solutions Architect (Refer to `AGENT.md`)
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Testing Runner**: {{TESTING_SETUP}}

## Immediate Objective
- [State the current high-level goal here]
- [Breakdown into component-level steps for the {{FRONTEND_STACK}} / {{BACKEND_STACK}} / {{DATASTORES}} stack]

## Standard Operating Flow (SOF)
1. **grounding**: Ingest `.ai/memory/` and the master spec before making ANY edits.
2. **Prioritization**: Treat this file as your primary directive. If a request conflicts with these rules, ask for clarification.
3. **Traceability**: Every 5-10 tool calls, update this file to reflect the current granular status.
4. **Conclusion**: When done, summarize your achievements in the daily log: `./logs/daily/`.

## Progress Checklist
- [ ] Task 1: [Description]
- [ ] Task 2: [Description]
- [ ] [x] Completed item example

## Protocol
- **Persistence**: structural architectural lessons MUST be captured in `./memory/AUTO_MEMORY.md`.
- **Chronology**: All session context lives in `./logs/daily/`.
- **Validation**: Never mark a task as complete without running **{{TESTING_SETUP}}**.
