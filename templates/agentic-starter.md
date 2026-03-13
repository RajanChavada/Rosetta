# {{PROJECT_NAME}} Master Spec

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

## Agent Guidelines
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Extra Contexts**: {{EXTRA_CONTEXTS}}

## Memory Model
This repo uses a three-layer memory model located in the `.ai/` directory:
1. **Project memory** (`.ai/memory/PROJECT_MEMORY.md`): Long-lived decisions, architecture, and domain notes.
2. **Auto-memory** (`.ai/memory/AUTO_MEMORY.md`): Agent-maintained notes on patterns, gotchas, and reusable heuristics.
3. **Task logs** (`.ai/logs/daily/YYYY-MM-DD.md`): Chronological task logs of experiments and results.
4. **Active Task** (`.ai/task.md`): The current objective and context.

## Architecture Rules
- Use patterns consistent with {{FRONTEND_STACK}} and {{BACKEND_STACK}}.
- Respect the risk level: {{RISK_LEVEL}}.
- Adhere to domain constraints: {{DOMAIN_TAGS}}.

## Engineering Standards
- All new code must be reviewed against these rules.
- Documentation should be updated in sync with code changes.

---
*Created via Rosetta CLI. Edit this file to update rules across all IDEs.*
