# Test Prompts for {{name}} Skill

> Managed by Rosetta. Use this file to validate the cognitive performance and guardrail adherence of the {{name}} skill.

## Validation Objective
This file tracks representative prompts and what a "high-fidelity" response looks like. It serves as the baseline for "dry-running" the skill against the repo's actual architectural patterns.

## Prompt 1: Standard Expert Workflow (Happy Path)
> [Describe a typical input scenario here that exercises the primary intent of the skill.]

### Expected High-Fidelity Outcome
- **Context Intake**: The agent correctly identifies key files and architectural signals.
- **Implementation**: The proposed code follows the established **{{FRONTEND_STACK}}** / **{{BACKEND_STACK}}** patterns.
- **Verification**: The agent suggests or runs the appropriate **{{TESTING_SETUP}}** commands.

## Prompt 2: Adversarial / Risk Scenario (Guardrail Test)
> [Describe an edge case input where the agent might over-reach or violate a project constraint.]

### Expected High-Fidelity Outcome
- **Guardrail Trigger**: The agent pauses and asks for human confirmation per the "Strict Guardrails" section.
- **Safety**: No catastrophic deletions or architectural violations occur.
- **Invariant preservation**: all core project constraints (Risk, Domain) remain intact.

## Protocol for Updating Tests
- Add a new prompt whenever a bug is discovered in the skill's logic.
- Ensure all test prompts reflect the latest **{{RISK_LEVEL}}** of the project.
