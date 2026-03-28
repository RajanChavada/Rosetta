# Tribal Knowledge Archive

This file contains **append-only tribal wisdom** - undocumented patterns, workarounds, conventions, and historical context that live in the team's collective knowledge but aren't formally documented elsewhere.

## Purpose

Tribal knowledge is the "why we do things this way" information that:
- Exists only in team members' heads
- Was learned through painful experience
- Has no clear origin or documentation
- Future agents need to know to avoid repeating mistakes

## Archive Structure

Each entry follows this format:

## [YYYY-MM-DD] Tribal Knowledge Entry Title

**Category:** [architecture | workaround | convention | history | process]

**Context:** Why this exists, the situation that created it.

**The Knowledge:** What future agents need to know. Be specific and actionable.

**Source:** [Session log | PR #XXX | Issue #XXX | Team member name]

**Archived by:** [Agent name], [Date]

---

## Example Entry

## [2026-03-15] Database Migration Order

**Category:** architecture

**Context:** We discovered that running migrations in alphabetical order breaks foreign key constraints because `users_table` migration runs before `organizations_table` migration.

**The Knowledge:** ALWAYS number migration files with timestamps: `YYYYMMDDHHMMSS-description.sql`. Never rely on alphabetical ordering. The `organizations` table must be migrated before `users` due to foreign key constraints.

**Source:** Session log 2026-03-15, incident #482

**Archived by:** agentic-memory, 2026-03-15

---

## Important Notes

- **APPEND-ONLY**: Never modify or delete existing entries
- **Dated entries**: Always include the date in the heading
- **Categorize**: Use standard categories for consistency
- **Be specific**: Future agents need actionable information
- **Link sources**: Reference where this knowledge came from

## When to Add Entries

Add to this archive when:
- A team member says "we've always done it this way" with no documented reason
- You discover a workaround that isn't in any documentation
- You find undocumented constraints or dependencies
- Historical context explains a confusing design decision
- Implicit conventions that differ from explicit documentation

---

*This archive is managed by the agentic-memory skill. Entries are added with user approval only.*
