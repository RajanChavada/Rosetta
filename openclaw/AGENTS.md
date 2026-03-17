# Agents Definition – Recruiter Workspace

## Agent: recruiter-scraper

### Purpose

A single, specialized agent whose only job is:

- Discovering recruiter profiles based on operator queries.
- Extracting contact information (emails where allowed).
- Generating personalized subject lines and short openers.
- Writing structured rows to CSV and Google Sheets.

### Channels

- Telegram direct messages:
  - Routed when messages contain a specific keyword (e.g., `#recruiter`).
- Future channels (optional):
  - HTTP webhook (for batch jobs).
  - CLI commands from the OpenClaw host.

### Files

- `SOUL.md` – Core identity and constraints.
- `IDENTITY.md` – Style and behavior details.
- `USER.md` – Operator preferences.
- `TOOLS.md` – Allowed tools and policies.
- `HEARTBEAT.md` – Periodic checks of the agent’s health.

Other agents (MVP factory, etc.) live in separate workspaces and do not share these files.