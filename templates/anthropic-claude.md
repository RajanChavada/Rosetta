# Claude Code Rules: {{PROJECT_NAME}} (Anthropic Style)

> Managed by Rosetta. Primary spec: .ai/master-skill.md.

## Project Snapshot
- **Type**: {{PROJECT_TYPE}}
- **Stack**: {{FRONTEND_STACK}} (Frontend), {{BACKEND_STACK}} (Backend), {{DATASTORES}} (Data)
- **Domain**: {{DOMAIN_TAGS}}
- **Risk Level**: {{RISK_LEVEL}}

## Team & Workflow
- **Team Size**: {{TEAM_SIZE}}
- **Git Workflow**: {{GIT_WORKFLOW}}
- **Testing**: {{TESTING_SETUP}}

## Agent behavior
- **Style**: {{AGENT_STYLE}}
- **Edit Permissions**: {{EDIT_PERMISSIONS}}
- **Extra Contexts**: {{EXTRA_CONTEXTS}}

{{UNIVERSAL_MEMORY}}

## Skills & Catalog
- Reusable skills and automated workflows are cataloged in the `skills/` directory.
- Always check `skills/` for relevant tools before implementing complex logic.

## Technical Context
- Load and follow core rules from .ai/master-skill.md.
- Follow directives in AGENT.md for identity and behavior.
- Testing & Workflow: Respect {{GIT_WORKFLOW}} and {{TESTING_SETUP}} requirements.
- Risk/Domain: Adhere to {{RISK_LEVEL}} and {{DOMAIN_TAGS}} constraints.

## Commands
- Build: npm run build
- Test: npm test
- Sync: rosetta sync (to update all IDE files from master)
