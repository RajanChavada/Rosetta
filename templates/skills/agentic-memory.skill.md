---
name: agentic-memory
description: Expert-level workflow for maintaining project-wide architectural context and high-fidelity agentic memory.
domains:
  - devex
  - ai-workflows
---

# Agentic Memory Skill

## Expert Intent
Maintain a high-fidelity "external brain" for the project. Every architectural decision, non-obvious pattern, and hard-won lesson must be distilled into the `.ai/` directory. This ensures that subsequent AI agents (and human developers) can resume work with 100% context and zero repetition.

## Pre-Checks & Context Intake
- **Spec Audit**: Verify the master spec exists at `.ai/master-skill.md`.
- **Memory Scan**: Check for `PROJECT_MEMORY.md` (architecture) and `AUTO_MEMORY.md` (heuristics).
- **Session Check**: Locate the active log for today in `.ai/logs/daily/`.
- **Task Verification**: Confirm the objective in `.ai/task.md` matches the user's latest request.

## Expert Workflow (SOF)
1. **Bootstrap**: At the very start of a session, ingest the entire `.ai/` context.
2. **Decision Log**: The moment an architectural choice is made (e.g., "Use HSL for colors"), record the "Why" in `PROJECT_MEMORY.md`.
3. **Heuristic Capture**: If you discover a shortcut, a bug pattern, or a specific preference, append it to `AUTO_MEMORY.md`.
4. **Logbook Maintenance**: Every 5-10 tool calls, summarize progress in today's daily log.
5. **Sync Enforcement**: Remind the user (or trigger) a `rosetta sync` whenever the master spec is modified.

## Strict Guardrails
- **IDENTITY CRITICAL**: Never store long-term project rules in IDE-specific files (e.g., `.cursorrules`). They MUST live in the master spec.
- **VERBOSITY CONTROL**: Do not let `AUTO_MEMORY.md` become a dumping ground. Prune outdated heuristics and generalize them.
- **PRIVACY**: Never store secrets, API keys, or PII in the memory documents.

## Expected Output
- High-fidelity updates to `.ai/memory/` documents.
- Granular, chronological session logs.
- A prioritized `task.md` that reflects the true project status.
