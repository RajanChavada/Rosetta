---
name: agentic-memory
description: Expert-level workflow for maintaining project-wide architectural context and agentic memory.
domains:
  - devex
  - ai-workflows
---

# Agentic Memory Skill

## Intent
Maintain a high-fidelity "brain" for the project. Ensure that every decision, pattern, and pitfall is captured in the `.ai/` directory to prevent context drift and repetitive explanation.

## Pre-Checks
- Verify existence of `.ai/memory/PROJECT_MEMORY.md` and `AUTO_MEMORY.md`.
- Check `.ai/task.md` for the current active objective.
- Scan `.ai/logs/daily/` for recent session outcomes.

## Workflow
- **Task Alignment**: At the start of every session, read `.ai/task.md` and `.ai/master-skill.md`.
- **Decision Tracking**: When an architectural decision is made, record it in `PROJECT_MEMORY.md`.
- **Heuristic Capture**: When a pattern or custom logic is identified, update `AUTO_MEMORY.md`.
- **Daily logging**: maintain chronological logs in `.ai/logs/daily/`.
- **Sync**: Use `rosetta sync` to propagate memory blocks to IDE-specific files.

## Guardrails
- Never store project state or logs inside rule files; use the `.ai/` structure exclusively.
- Do not let `AUTO_MEMORY.md` exceed 500 lines; prune and generalize old entries.
- Always ask for confirmation before overwriting existing project decisions.

## Output
- Updated `.ai/memory/` documents.
- Detailed task logs.
- Synced `.cursorrules`, `AGENT.md`, etc.
