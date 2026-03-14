# Project Memory

This file stores **long-lived knowledge** about the project: decisions, conventions, domain facts, and architectural context that should remain true across tasks and over time.

## What belongs here

- Key architectural decisions and why they were made.
- Important domain concepts and invariants (e.g., "a workspace always has at least one owner").
- Naming conventions, folder structure conventions, and patterns that should be reused.
- Changelogs for major shifts in architecture or tech stack.

## What does NOT belong here

- Step-by-step task logs or debugging notes (use `.ai/logs/daily/YYYY-MM-DD.md`).
- Speculative ideas that haven't been agreed on yet (put them in issues or task.md first).
- Very low-level details that will quickly go out of date (prefer code comments).

## How the agent should update this file

- Propose updates only when a decision is truly project-wide or long term.
- When updating, include:
  - **Date**
  - **Context** (why this came up)
  - **Decision** (what is now true)
  - **Implications** (where it matters)

Example entry:

- **2026-03-13 – API Versioning**
  - Context: Added v2 endpoints for the payments API.
  - Decision: All new public APIs must be versioned under `/v2/` with explicit deprecation strategy for `/v1/`.
  - Implications: Update API docs, client SDKs, and test coverage to reflect versioning.
