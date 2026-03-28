# {{DATE}}

Daily log for {{DATE}}. Each entry should capture **what was attempted, what changed, and what was learned**.

## Log Entry Format

When adding entries, use this format:

### [HH:MM] Task/Activity Name

**Context:** Why this work was initiated

**Actions:**
- Step 1
- Step 2
- Step 3

**Outcome:** Success/failure and results

**Learnings:** Anything worth promoting to AUTO_MEMORY.md or PROJECT_MEMORY.md

**Artifacts:** Files modified, links to PRs/issues

---

## Entries

### [Your Name or Agent Label]

**Task:** Short description of what you're doing

**Context:** Link to issue/ticket if relevant

**Actions:**
- Step 1
- Step 2

**Outcome:**
- What worked / what failed

**Learnings / Notes:**
- Anything worth moving later to `AUTO_MEMORY.md` or `PROJECT_MEMORY.md`

**Artifacts:**
- Files modified
- PRs or commits

---

## Auto-Log Triggers

The agentic-memory skill automatically logs when:
- Multi-step problem solving (>3 logical steps)
- Root cause discovery investigations
- Feature implementations (new code paths)
- Complex debugging (CI/CD logs, stack traces)
- Configuration changes (.env, configs, constants)
- Large schema changes (DB, API contracts)
- PRD creations or product decisions
- Performance optimizations
- Library/dependency changes
- Technical debt reduction work

---

## End-of-Day Review

At the end of each session:
1. Review today's log entries
2. Identify patterns (repeated issues, new heuristics)
3. Suggest promotions:
   - Patterns to AUTO_MEMORY.md
   - Architectural decisions to PROJECT_MEMORY.md
   - Tribal knowledge to archive

---

## Session Summary

<!-- At the end of the day, summarize key outcomes -->

**Key accomplishments:**
- Accomplishment 1
- Accomplishment 2

**Issues encountered:**
- Issue 1
- Issue 2

**Decisions made:**
- Decision 1

**Next steps:**
- Step 1
- Step 2

---

*This log is managed by the agentic-memory skill. Entries are automatically created for significant work.*
