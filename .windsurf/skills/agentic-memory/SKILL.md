---
name: agentic-memory
description: Long-lived project memory, architectural rules, and tribal knowledge preservation system for AI agents
domains:
  - devex
  - ai-workflows
  - knowledge-management
triggers:
  - Session start
  - Architectural decisions
  - Complex debugging
  - Multi-step work
---

# Agentic Memory Skill

## Overview

This skill provides a sophisticated memory management system that preserves tribal knowledge, maintains a clear memory hierarchy, and ensures important context never disappears. It implements **THE MEMORY CONTRACT** - explicit rules that all agents must follow.

---

## THE MEMORY CONTRACT - AGENT BEHAVIOR RULES

### Rule 1: Tribal Knowledge Preservation (CRITICAL)

**NEVER let important learnings disappear.**

When you encounter tribal knowledge (implicit rules, undocumented patterns, workarounds, "why we do X this way"):

1. **PROMPT THE USER** with clear reasoning:
   ```
   This seems like tribal knowledge: [description].
   Archive to .ai/archive/tribal-knowledge.md?
   ```

2. **AWAIT APPROVAL** before archiving

3. **Archive is APPEND-ONLY** - never modify existing entries

**Tribal knowledge indicators:**
- "We always do it this way" (no documented reason)
- Undocumented workarounds for known issues
- Implicit architectural decisions
- Team conventions not in code or docs
- "Don't touch X without Y" warnings
- Historical context from old issues/PRs

### Rule 2: Memory Hierarchy (STRICT ORDER)

The memory system has 5 levels. Always read and update in this order:

1. **PROJECT_MEMORY.md** - Architectural decisions, domain rules, "Why"
   - Location: `.ai/memory/PROJECT_MEMORY.md`
   - Content: Long-lived architectural truths
   - Updates: Propose to user before modifying

2. **AUTO_MEMORY.md** - Heuristics, patterns, gotchas, shortcuts
   - Location: `.ai/memory/AUTO_MEMORY.md`
   - Content: Agent-maintained learnings and patterns
   - Updates: Append freely, promote to PROJECT_MEMORY.md when appropriate

3. **logs/daily/YYYY-MM-DD.md** - Session activity, what was attempted
   - Location: `.ai/logs/daily/YYYY-MM-DD.md`
   - Content: Daily session logs with outcomes
   - Updates: Auto-log for significant work

4. **archive/tribal-knowledge.md** - Append-only tribal wisdom
   - Location: `.ai/archive/tribal-knowledge.md`
   - Content: Undocumented patterns and historical context
   - Updates: User approval required, append-only

5. **task.md** - Current active objective
   - Location: `.ai/task.md`
   - Content: Current session's objective
   - Updates: Update when objective changes

### Rule 3: Auto-Logging Triggers

**ALWAYS log to today's daily log when performing:**

1. **Multi-step problem solving** (>3 logical steps)
2. **Root cause discovery investigations**
3. **Feature implementations** (new code paths)
4. **Complex debugging** (CI/CD logs, stack traces)
5. **Configuration changes** (.env, configs, constants)
6. **Large schema changes** (DB, API contracts)
7. **PRD creations or product decisions**
8. **Performance optimizations**
9. **Library/dependency changes**
10. **Technical debt reduction work**

**Auto-Log Decision Tree:**
```
Is this a multi-step task? (>3 steps)
|-- Yes --> Log to daily: "Task: [name], Steps: [summary]"
|-- No --> Is this a root cause finding?
|   |-- Yes --> Log to daily: "Root cause: [issue], Cause: [finding]"
|   -- No --> Is this tribal knowledge?
       |-- Yes --> PROMPT USER for archival
       -- No --> Continue work
```

### Rule 4: User Intent Respect

**Suggest, NEVER assume.**

Before taking permanent action:

1. **Promote archival with clear reasoning:**
   ```
   Pattern detected: [X].
   Reason: [why it matters]
   Promote to AUTO_MEMORY.md?
   ```

2. **AWAIT explicit approval before:**
   - Moving items to archive
   - Promoting daily log entries to AUTO_MEMORY.md
   - Promoting AUTO_MEMORY.md to PROJECT_MEMORY.md
   - Modifying PROJECT_MEMORY.md

3. **If unsure, ASK:**
   ```
   Should this be preserved long-term?
   This seems like [architectural decision/pattern/gotcha].
   ```

### Rule 5: Session Workflow

**Follow this workflow for every session:**

1. **ONBOARDING** (First 5 minutes):
   - Read this skill
   - Understand the rules
   - Check existing memory files
   - Acknowledge readiness

2. **ACTIVE MONITORING** (During work):
   - Watch for tribal knowledge signals
   - Track auto-log triggers
   - Note patterns for archive promotion
   - Log significant work to daily

3. **DAILY LOG** (Every 5-10 tool calls):
   - Summarize progress to today's log
   - Note outcomes and learnings
   - Track artifacts (files modified, PRs created)

4. **SESSION END** (Before closing):
   - Promote valuable findings
   - Suggest archival of tribal knowledge
   - Update task.md if needed
   - Summarize session outcomes

---

## ONBOARDING PHASE (READ FIRST)

When you load this skill:

### Step 1: Read the Memory Files (In Order)

```
.ai/memory/PROJECT_MEMORY.md     # Read first - architectural truth
.ai/memory/AUTO_MEMORY.md         # Read second - learned patterns
.ai/archive/tribal-knowledge.md   # Read third - if exists
.ai/task.md                       # Read fourth - current objective
```

### Step 2: Initialize Today's Log

Check `.ai/logs/daily/YYYY-MM-DD.md` where YYYY-MM-DD is today's date.

If it doesn't exist, create it with the standard header:

```markdown
# {{DATE}}

Daily log for {{DATE}}. Each entry should capture **what was attempted, what changed, and what was learned**.

## Entries

### [Agent Name]

**Session Start:** [Time]

**Objective:** [From task.md or user request]

**Context:** [Why this work is happening]

---
```

### Step 3: Set Monitoring Mode

- **Watch for tribal knowledge signals:**
  - Implicit rules without documentation
  - Workarounds for known issues
  - Historical context explaining design decisions
  - Team conventions not in code

- **Track auto-log triggers:**
  - Multi-step problem solving
  - Root cause discoveries
  - Feature implementations
  - Configuration changes
  - Schema changes

- **Note patterns for promotion:**
  - Repeated debugging steps -> AUTO_MEMORY.md
  - Similar architectural choices -> PROJECT_MEMORY.md
  - Undocumented constraints -> Archive

### Step 4: Acknowledge Readiness

Once onboarded, respond with:

```
Onboarded to agentic-memory.
- Memory hierarchy understood
- Watching for tribal knowledge and auto-log triggers
- Today's log ready: .ai/logs/daily/YYYY-MM-DD.md
```

---

## ACTIVE MONITORING (DURING WORK SESSIONS)

### Watch For Tribal Knowledge Indicators

**Signals to look for:**
- "We always do it this way" (no documented reason)
- Undocumented workarounds for known issues
- Implicit architectural decisions
- Team conventions not in code or docs
- "Don't touch X without Y" warnings
- Historical context from old issues/PRs
- Code comments explaining "why" without corresponding docs

**Action when detected:**
1. Note the tribal knowledge
2. Prompt user with clear reasoning
3. Await approval
4. Archive to `.ai/archive/tribal-knowledge.md`

### Pattern Detection

After significant work, scan for:

**Repeated debugging steps:**
- Same error appears >3 times
- Same fix works for multiple issues
- Common workaround pattern

**Action:** Suggest promotion to AUTO_MEMORY.md

**Similar architectural choices:**
- Multiple files follow same pattern
- Design decision affects multiple components
- System-wide constraint discovered

**Action:** Suggest update to PROJECT_MEMORY.md

**Undocumented constraints:**
- Requirement not in specs
- Limitation discovered through testing
- Dependency between components

**Action:** Suggest archival to tribal-knowledge.md

### Auto-Log Decision Tree (Visual)

```
                    Start Work
                        |
           Is this multi-step? (>3 steps)
                    /           \
                  Yes            No
                  |              |
        Log to daily:      Root cause finding?
        "Task: [name]"        /        \
                             Yes        No
                              |         |
                    Log to daily:   Tribal knowledge?
                    "Root cause:"      /        \
                                      Yes        No
                                       |         |
                                 PROMPT USER   Continue
                                       |
                                Archive with approval
```

---

## DAILY LOG MANAGEMENT

### Log Entry Format

When logging to today's daily file, use:

```markdown
### [HH:MM] Task/Activity Name

**Context:** Why this work was initiated

**Actions:**
- Step 1
- Step 2
- Step 3

**Outcome:** Success/failure and results

**Learnings:** Anything worth promoting

**Artifacts:** Files modified, links to PRs/issues
```

### End-of-Day Promotion

At the end of the day or session:

1. **Review today's log entries**
2. **Identify patterns:**
   - Repeated issues -> AUTO_MEMORY.md
   - New heuristics -> AUTO_MEMORY.md
   - Architectural decisions -> PROJECT_MEMORY.md
   - Tribal knowledge -> Archive

3. **Suggest promotions to user:**
   ```
   Pattern detected: [X].
   Occurred [N] times today.
   Promote to AUTO_MEMORY.md?
   ```

4. **Update promotion status:**
   - Mark promoted items in daily log
   - Note what was promoted and where

### Session Summary Template

At session end, add to daily log:

```markdown
## Session Summary

**Session End:** [Time]

**Key accomplishments:**
- Accomplishment 1
- Accomplishment 2

**Issues encountered:**
- Issue 1
- Issue 2

**Decisions made:**
- Decision 1

**Promotions suggested:**
- [ ] Pattern: [description] -> AUTO_MEMORY.md
- [ ] Decision: [description] -> PROJECT_MEMORY.md
- [ ] Tribal knowledge: [description] -> Archive

**Next steps:**
- Step 1
- Step 2
```

---

## ARCHIVE MANAGEMENT

### Archive Structure

```
.ai/
├── archive/
│   ├── tribal-knowledge.md    # Append-only tribal wisdom
│   ├── retired-patterns.md    # Deprecated but worth remembering
│   └── logs/                  # Rotated daily logs >90 days
│       └── 2026/
│           ├── 03-March.md
│           └── 02-February.md
```

### Retention Policy

**Daily logs:**
- Active in `.ai/logs/daily/` for 90 days
- After 90 days: Rotate to `.ai/archive/logs/YYYY/MM-Month.md`
- Monthly consolidation: Summarize month in archive entry

**Tribal knowledge:**
- Permanent, append-only
- Never modify existing entries
- Always date-stamped

**Retired patterns:**
- Keep with deprecation date
- Note replacement approach
- Migration guidance when available

### Archive Entry Format

When adding to tribal-knowledge.md:

```markdown
## [YYYY-MM-DD] Tribal Knowledge Entry Title

**Category:** [architecture | workaround | convention | history | process]

**Context:** Why this exists, the situation that created it.

**The Knowledge:** What future agents need to know. Be specific and actionable.

**Source:** [Session log | PR #XXX | Issue #XXX | Team member]

**Archived by:** [Agent name], [Date]

---
```

### 90-Day Rotation

**Auto-rotation (hybrid approach):**
- Logs older than 90 days auto-rotate during `syncMemory()`
- User notified: "Rotated N logs to archive (older than 90 days)"
- Manual override: `force: true` to skip rotation

**Manual trigger:**
- Direct function call: `rotateLogsToArchive()`
- Consolidates month into single archive file
- Summarizes key activities and themes

**Rotation behavior:**
1. Identify logs older than threshold (default 90 days)
2. Group by month
3. Create monthly archive file
4. Summarize month's activities
5. Notify user of rotation completed

---

## PATTERN DETECTION (RULE-BASED)

**No AI/LLM calls** - Pure string heuristics only.

### Detection Rules

**Repeated Errors:**
```javascript
// Same error message >3 times
const errorCount = {};
for (const entry of logEntries) {
  if (entry.error) {
    errorCount[entry.error] = (errorCount[entry.error] || 0) + 1;
  }
}
// Flag errors with count >3
```

**Repeated Files:**
```javascript
// Same file modified >5 times
const fileCount = {};
for (const entry of logEntries) {
  if (entry.files) {
    for (const file of entry.files) {
      fileCount[file] = (fileCount[file] || 0) + 1;
    }
  }
}
// Flag files with count >5
```

**Similar Tasks:**
```javascript
// Keyword matching for similar task descriptions
const keywords = ['debug', 'fix', 'implement', 'refactor'];
// Group by keyword and detect patterns
```

### Promotion Suggestions

Based on detected patterns, suggest:

```javascript
if (repeatedError) {
  suggest: `Repeated error: "${error}" occurred ${count} times.
  Add troubleshooting pattern to AUTO_MEMORY.md?`;
}

if (repeatedFile) {
  suggest: `File "${file}" modified ${count} times.
  Consider refactoring or documenting pattern in AUTO_MEMORY.md`;
}

if (similarTasks) {
  suggest: `Similar "${keyword}" tasks occurred ${count} times.
  Create standardized workflow in AUTO_MEMORY.md?`;
}
```

---

## MEMORY HIERARCHY REFERENCE

| Level | File | Purpose | Update Rule |
|-------|------|---------|-------------|
| 1 | PROJECT_MEMORY.md | Architectural decisions | Propose first |
| 2 | AUTO_MEMORY.md | Heuristics and patterns | Append freely |
| 3 | logs/daily/*.md | Session activity | Auto-log triggers |
| 4 | archive/tribal-knowledge.md | Tribal wisdom | User approval |
| 5 | task.md | Current objective | Update as needed |

---

## EXPECTED AGENT BEHAVIOR

### When You Start a Session

1. Load this skill
2. Read memory files in order (1-5)
3. Initialize today's log
4. Acknowledge readiness

### During Work

1. Monitor for tribal knowledge signals
2. Auto-log significant work
3. Detect patterns for promotion
4. Prompt user before permanent actions

### At Session End

1. Review today's log entries
2. Suggest promotions
3. Update task.md if needed
4. Summarize session outcomes

### ALWAYS

- **Read memory hierarchy in order**
- **Suggest, never assume**
- **Archive is append-only**
- **Respect user intent**

---

## QUICK REFERENCE

**Tribal knowledge indicators:**
- Undocumented rules
- Implicit conventions
- Historical context
- Workarounds without docs

**Auto-log triggers:**
- Multi-step work (>3 steps)
- Root cause findings
- Feature implementations
- Config/schema changes
- Performance work

**Promotion criteria:**
- Repeated patterns -> AUTO_MEMORY.md
- Architectural decisions -> PROJECT_MEMORY.md
- Tribal knowledge -> Archive

**Retention:**
- Daily logs: 90 days in daily/
- After 90 days: Rotate to archive/logs/
- Tribal knowledge: Permanent

---

*This skill implements the Memory Contract - explicit rules for preserving tribal knowledge and maintaining project memory across AI agent sessions.*
