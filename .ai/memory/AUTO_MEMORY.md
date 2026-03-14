# Auto Memory

This file is for **agent-maintained notes and heuristics** that are useful across sessions but not "hard" project decisions.

## What belongs here

- Reusable troubleshooting steps ("When tests fail with X, check Y first").
- Observed patterns in the codebase ("Most services use helper Z for logging").
- Short reminders about gotchas ("Do not modify table A directly; use migration scripts").

## What does NOT belong here

- Long narratives or full task logs (those go in `.ai/logs/daily/YYYY-MM-DD.md`).
- Major architectural or product decisions (those belong in `PROJECT_MEMORY.md`).
- Sensitive data like access tokens or raw secrets.

## How the agent should update this file

- Append **short, bulleted notes**, not essays.
- Prefer patterns over one-off events.
- If a note starts to feel like a project-wide rule, propose moving it to `PROJECT_MEMORY.md`.

Example entries:

- When updating DB schema, always run `npm test db` before committing.
- Frontend components usually live under `src/ui/` and follow the `Feature/Component` pattern.
- Integration tests use a seeded Postgres test database defined in `docker-compose.test.yml`.

- **2026-03-13 Sync**: Progress tracked across 1 logs.
