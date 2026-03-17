# Recruiter Agent – Heartbeat Specification

## Purpose

The heartbeat is a lightweight, periodic process that ensures the recruiter-scraper agent is:

- Responsive.
- Not stuck on long-running operations.
- Producing data consistently and safely.

## Frequency

- Default: every 10 minutes.
- Implemented as a cron job, systemd timer, or OpenClaw scheduled task.

## Checks

On each heartbeat:

1. **Process Health**
   - Confirm that the recruiter agent’s main process or tmux session is alive.
   - If not:
     - Mark `status = "stopped"` in a state file.
     - Optionally restart if allowed by config.

2. **Recent Activity**
   - Inspect `LOG.md` and `ERRORS.log` for the last 24 hours.
   - Count:
     - Number of jobs (instructions) processed.
     - Number of new recruiters added.
     - Number of errors.

   - If no activity for a long time (e.g., 24 hours):
     - Mark `status = "idle"`.

3. **Data Sanity**
   - Check that `recruiters.csv`:
     - Exists.
     - Has a header row.
     - Has no obviously corrupted lines (e.g., wrong number of columns).

4. **Sheets Sync (Optional)**
   - If Sheets integration is enabled:
     - Check the last sync status from a small state file (e.g., `sheets-sync-status.json`).
     - If repeated failures > N times:
       - Mark sheet sync as `degraded`.
       - Log a summary in `LOG.md`.

## Status File

Write a simple JSON file at:

- `~/factory/recruiter-agent/status.json`

Example:

```json
{
  "timestamp": "2026-03-16T23:59:00Z",
  "status": "healthy",
  "recent_jobs": 3,
  "last_job": {
    "query": "Toronto Shopify recruiters",
    "new_contacts": 18,
    "errors": 1
  },
  "csv_rows": 124,
  "sheets_sync": "ok"
}
Safety
The heartbeat process must not:

Modify any recruiter data.

Trigger new scraping or email generation.

Change configuration files.

It is purely observational and summarizing.