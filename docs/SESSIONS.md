# Session Management

This document describes the session management system in Rosetta, including PLAN.md and TODO.md workflow for tracking development state across sessions.

## Overview

Rosetta uses two state files to manage long-running development sessions:

- **PLAN.md** - Machine-readable session state for tracking goals, active tasks, decisions, and session handoffs
- **TODO.md** - Actionable items list organized by priority or area

These files enable seamless handoffs between development sessions, help maintain focus on current objectives, and support context compaction when working in large codebases.

## State Files

### PLAN.md

The PLAN.md file contains structured session state with the following sections:

```markdown
# Rosetta Development Plan

## Goals
- [ ] Complete feature X
- [ ] Refactor module Y

## Active Tasks
- [ ] Implement core logic
- [ ] Write unit tests

## Decisions
- **2026-03-14 - Use ES6 modules throughout**
- **2026-03-14 - Adopt dry-run pattern for file operations**

## Session Handoff
2026-03-14 Session Compaction
Work Area: lib/context.js
Skills Loaded: backend-context
Context at ~65% - Compacted and preserved.
```

**Purpose:**
- Track high-level project goals
- Show currently in-progress work
- Document architectural decisions with dates
- Store session handoff information for next session

### TODO.md

The TODO.md file contains actionable items only:

```markdown
# Rosetta TODO

## Core
- [ ] Implement renderTemplate function
- [ ] Add error handling for sync

## Documentation
- [ ] Write API documentation
- [ ] Update README

## Testing
- [ ] Add unit tests for config.js
```

**Purpose:**
- Track specific actionable items
- Organize by priority or area
- Checkbox format for easy completion tracking
- No explanatory text, just actions

## Session Workflow

### Start of Session

When starting a new development session:

1. Read the three key state files:
   - `CLAUDE.md` - Project configuration and conventions
   - `PLAN.md` - Current goals, active tasks, and decisions
   - `TODO.md` - Actionable items list

2. Summarize the current state in under 10 bullet points:
   - What's the project context?
   - What are the current goals?
   - What work was in progress?
   - Any recent decisions affecting the work?

3. Review Active Tasks from PLAN.md to understand what needs attention

4. Load relevant skills based on the work area (e.g., `/backend-context` for API work)

### During Session

**Managing Active Work:**

- Update PLAN.md when:
  - Starting new tasks (add to Active Tasks)
  - Completing tasks (check off in Active Tasks)
  - Making architectural decisions (add to Decisions with date)

- Update TODO.md when:
  - Breaking work into smaller items
  - Completing specific action items
  - Adding new items discovered during work

**Context Compaction:**

When context usage reaches 60-70% of capacity:

1. Summarize the current session into PLAN.md (## Session Handoff section)
2. Note what work area you're working in
3. List skills that are loaded
4. Run `/compact` to preserve the plan and active files

### End of Session

When ending a development session:

1. Update PLAN.md:
   - Check off completed Active Tasks
   - Add any new decisions made
   - Update Session Handoff with summary

2. Update TODO.md:
   - Add any remaining items for next session
   - Check off completed items

3. Run `/compact` if context is at ~60-70% capacity

## Commands Reference

### `rosetta plan`

Display the current PLAN.md contents.

```bash
rosetta plan
```

Shows:
- Goals with completion status
- Active Tasks with completion status
- Recent Decisions with dates
- Session Handoff information

### `rosetta edit-plan`

Interactive editor for PLAN.md.

```bash
rosetta edit-plan
```

Allows:
- Toggle goal completion status
- Toggle active task completion status
- Add new goals or tasks
- Update session handoff information

### `rosetta todo`

Display the current TODO.md contents.

```bash
rosetta todo
```

Shows:
- All TODO items organized by category
- Completion status for each item

### `rosetta edit-todo`

Interactive editor for TODO.md.

```bash
rosetta edit-todo
```

Allows:
- Toggle item completion status
- Manage items across categories

### `rosetta status`

Display overall project status including both PLAN.md and TODO.md.

```bash
rosetta status
```

Shows:
- Current goals summary
- Active tasks in progress
- TODO items count by category
- Recent decisions

### `rosetta compact`

Compact session context to PLAN.md for long-running sessions.

```bash
rosetta compact
```

Actions:
- Updates Session Handoff in PLAN.md
- Preserves current plan and active files
- Clears accumulated context to free capacity

## Best Practices

### When to Use Each File

| Situation | Use |
|-----------|-----|
| High-level project objectives | PLAN.md (Goals) |
| Currently in-progress work | PLAN.md (Active Tasks) |
| Architectural decisions | PLAN.md (Decisions) |
| Small actionable items | TODO.md |
| Session handoff summary | PLAN.md (Session Handoff) |

### When to Compact

Run `/compact` when:
- Context estimate exceeds 60-70% capacity
- After long chains of file modifications
- Before leaving for an extended period
- When switching to a significantly different work area

The compaction always preserves:
- Current PLAN.md content
- Active work area reference
- Loaded skills information

### Session Handoff Template

```markdown
## Session Handoff

2026-03-14 Session Compaction

Work Area: lib/context.js
Context: Adding auto-detection for Python projects

Skills Loaded:
- backend-context

In Progress:
- Implemented detectProjectType() function
- Need to add inferStackFromDependencies()

Next Steps:
1. Complete inferStackFromDependencies()
2. Add unit tests for context.js
3. Update CLI.md with auto-detection docs
```

## Integration with Skills

Session management integrates with the skills system:

- Skills are loaded based on the work area at session start
- Skills remain active during the session
- Session Handoff notes which skills were loaded
- Next session loads the same skills for continuity

Example workflow:

1. Start session, read PLAN.md
2. See work area is "lib/context.js" (backend work)
3. Load `/backend-context` skill
4. Work on backend features
5. End session: update PLAN.md with Session Handoff noting `/backend-context` was loaded

## File Locations

| File | Location | Purpose |
|------|----------|---------|
| PLAN.md | Project root | Session state and goals |
| TODO.md | Project root | Actionable items list |
| CLAUDE.md | Project root | Project configuration |

## Related Documentation

- [CLAUDE.md](../CLAUDE.md) - Project configuration and session management rules
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture and design decisions
- [AGENTS.md](AGENTS.md) - Subagent delegation for exploration and security review
