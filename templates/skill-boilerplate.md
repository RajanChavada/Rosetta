---
name: {{name}}
description: One-sentence punchy value prop for the {{name}} skill (e.g., "Automate type-safe API migrations").
domains:
  - devex
---

# {{name}} Skill

## Detailed Intent
[Provide a 2-3 paragraph explanation of the cognitive load this skill eliminates. Explain the specific problem it solves in the context of the {{PROJECT_TYPE}} architecture.]

## Pre-Checks & Context Intake
- [First, scan these directories: ...]
- [Identify these signals: (e.g., TODOs, specific decorator patterns, or outdated libs)]
- [Cross-reference with `.ai/memory/PROJECT_MEMORY.md` for existing decisions.]
- [What to ignore: (e.g., node_modules, build artifacts, or specific config files)]

## Expert Workflow (SOF)
[Step-by-step imperative instructions for the agent.]
1. **Analyze**: Use divergent thinking to explore the existing implementation.
2. **Draft**: Propose a plan that respects the **{{RISK_LEVEL}}** constraints.
3. **Execute**: Implement the code using patterns consistent with {{BACKEND_STACK}}/{{FRONTEND_STACK}}.
4. **Verify**: run tests ({{TESTING_SETUP}}) and update the daily log.

## Strict Guardrails
- **DO NOT**: [List specific forbidden actions or patterns.]
- **STOP & ASK**: [Explicit conditions under which you must pause for user confirmation.]
- **SAFETY**: [Security or data integrity rules specific to the **{{DOMAIN_TAGS}}**.]

## Expected Output
[Exact artifacts: filenames, report formats, or specific code blocks expected at the end of the workflow.]
