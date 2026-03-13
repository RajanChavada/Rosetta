


Yes, that is a fantastic addition. Since `PROJECT_MEMORY.md` is the first place the agent looks, injecting the "Memory Usage Protocol" directly into its boilerplate guarantees the agent will understand the 3-layer system from the moment the project is scaffolded.

Here is the expanded boilerplate content and exactly how to integrate it into the markdown instructions for your agent. 

### 1. The Expanded Boilerplate for `PROJECT_MEMORY.md`

We will have the CLI generate `PROJECT_MEMORY.md` with this rich context:

```markdown
# Project Memory

This file serves as the long-lived, high-level source of truth for the project. 

## When to Update This File
- **Architecture & Stack:** When introducing a new core technology, database, or major library.
- **Domain Rules:** When a core business rule or domain concept is established.
- **Conventions:** When finalizing naming conventions, folder structures, or global coding standards.
- **Data Models:** When establishing major database schemas or API contracts.

*Note: Do not put ephemeral task notes, bugs, or scratchpad thoughts here. Keep this file clean, organized, and structurally sound.*

---

## The 3-Layer Memory Protocol

As an AI agent, you must distribute your knowledge across the `.ai/` directory appropriately:

1. **PROJECT_MEMORY.md (This File - High Level)**
   - **Read:** At the start of major tasks to understand constraints.
   - **Write:** Only when structural, permanent decisions are made. Reformat/organize as needed.

2. **AUTO_MEMORY.md (Learned Heuristics & Gotchas)**
   - **Read:** Before debugging or writing standard boilerplate.
   - **Write:** Append short notes when you learn a hard lesson, encounter a strange framework quirk, or receive a behavioral correction from the user. Keep it bulleted.

3. **Daily Logs (`.ai/logs/daily/YYYY-MM-DD.md` - Chronological)**
   - **Read:** To see what was done yesterday or earlier in the session.
   - **Write:** Append continuously. Log your current task, commands run, failed experiments, and task completions. Never delete historical logs.
```

### 2. How to add this to the Agent Prompt (`refactor-rosetta-memory.md`)

I have updated **Step 1** of the instruction document to explicitly include this expanded text. Here is the final, complete markdown file you can hand to your agent:

***

```markdown
# Task: Refactor Rosetta CLI Memory & Logs Architecture

## Objective
Update the `rosetta` CLI tool to centralize all agent-state files (memory, logs, and task tracking) into the `.ai/` directory. This prevents root-directory pollution, aligns with industry standards for AI IDEs, and ensures proper Git tracking.

## Architectural Goal
We are moving away from dumping `memory/`, `logs/`, `AGENT.md`, and `task.md` into the project root. 

**Target Architecture:**
```text
.ai/                             <-- The "Global Brain" (Agent state & rules)
  ├── master-skill.md            <-- Rosetta's Single Source of Truth (Committed)
  ├── AGENT.md                   <-- MOVED from root (Committed)
  ├── task.md                    <-- MOVED from root (Ignored)
  ├── memory/                    <-- MOVED from root
  │   ├── PROJECT_MEMORY.md      <-- (Committed)
  │   └── AUTO_MEMORY.md         <-- (Committed)
  └── logs/                      <-- MOVED from root
      └── daily/
          └── YYYY-MM-DD.md      <-- (Ignored)

skills/                          <-- REMAINS AT ROOT (Stateless capabilities)
  └── node-express-postgres/
      └── SKILL.md               

CLAUDE.md                        <-- IDE Wrappers REMAIN at their standard paths
.cursorrules                     
```

## Step-by-Step Instructions

### Step 1: Update `cli.js` Scaffolding Logic
Locate the `scaffoldNew()` function in `cli.js` and update the paths for memory, logs, `AGENT.md`, and `task.md` so they are generated inside the `.ai/` directory.

**Required Changes in `scaffoldNew()`:**
1. Update `ensureFromTemplate` calls to target `.ai/AGENT.md` and `.ai/task.md`.
2. Update directory creation:
   - `fs.ensureDir('.ai/memory')`
   - `fs.ensureDir('.ai/memory/entities')`
   - `fs.ensureDir('.ai/logs/daily')`
3. Expand the boilerplate for `PROJECT_MEMORY.md` to include explicit instructions on the 3-layer memory model. Replace the current basic string with this exact template:
   ```markdown
   # Project Memory

   This file serves as the long-lived, high-level source of truth for the project. 

   ## When to Update This File
   - **Architecture & Stack:** When introducing a new core technology, database, or major library.
   - **Domain Rules:** When a core business rule or domain concept is established.
   - **Conventions:** When finalizing naming conventions, folder structures, or global coding standards.
   - **Data Models:** When establishing major database schemas or API contracts.

   *Note: Do not put ephemeral task notes, bugs, or scratchpad thoughts here. Keep this file clean, organized, and structurally sound.*

   ---

   ## The 3-Layer Memory Protocol

   As an AI agent, you must distribute your knowledge across the `.ai/` directory appropriately:

   1. **PROJECT_MEMORY.md (This File - High Level)**
      - **Read:** At the start of major tasks to understand constraints.
      - **Write:** Only when structural, permanent decisions are made. Reformat/organize as needed.

   2. **AUTO_MEMORY.md (Learned Heuristics & Gotchas)**
      - **Read:** Before debugging or writing standard boilerplate.
      - **Write:** Append short notes when you learn a hard lesson, encounter a strange framework quirk, or receive a behavioral correction from the user. Keep it bulleted.

   3. **Daily Logs (`.ai/logs/daily/YYYY-MM-DD.md` - Chronological)**
      - **Read:** To see what was done yesterday or earlier in the session.
      - **Write:** Append continuously. Log your current task, commands run, failed experiments, and task completions. Never delete historical logs.
   ```
4. Update the file paths for `AUTO_MEMORY.md`, and the daily log to write to `.ai/memory/AUTO_MEMORY.md` and `.ai/logs/daily/${today}.md`.

### Step 2: Handle `.gitignore` Safely
In `scaffoldNew()`, add logic to append specific `.ai/` paths to the project's `.gitignore` file (create it if it doesn't exist).
- **Ignore:** `.ai/logs/` and `.ai/task.md` (These change too often and cause Git noise).
- **Do NOT ignore:** `.ai/memory/`, `.ai/AGENT.md`, and `.ai/master-skill.md` (These define the project state and should be shared across the team).

### Step 3: Standardize the IDE Templates
In the `templates/` folder (e.g., `anthropic-claude.md`, `cursorrules.md`, `antigravity-skill.md`, `copilot-instructions.md`, `windsurf-rules.md`), replace or inject the following standardized block so agents know exactly where their "Global Brain" is:

```markdown
## Agent Memory & Logging Workflow

This project uses a centralized memory and logging system located in the `.ai/` directory. You MUST follow these conventions:

1. **Context Gathering:** Before starting a task, read `.ai/memory/PROJECT_MEMORY.md` to understand architectural constraints.
2. **Learning:** If you discover a project-specific quirk, bug pattern, or undocumented preference, append a brief note to `.ai/memory/AUTO_MEMORY.md`.
3. **Task Logging:** Document your progress, tools used, and commands run in `.ai/logs/daily/YYYY-MM-DD.md`. Create the file if today's log doesn't exist.
4. **Current Task:** Track your immediate active task in `.ai/task.md`.

## Skills Directory
Reusable, isolated skills are located in `skills/`.
When performing complex tasks, check the `skills/` directory for a `SKILL.md` that matches the task, and follow its workflow. Do not store project state or logs inside the `skills/` folders.
```

### Step 4: Fix Internal Template Links
Review `templates/AGENT.md`, `templates/task.md`, and the presets in `templates/presets/`. 
Ensure any internal markdown links to `memory/PROJECT_MEMORY.md` or `logs/daily/` are updated. Since `AGENT.md` and `task.md` will now live inside `.ai/` right next to `memory/` and `logs/`, their relative links should just be `./memory/...` or `./logs/...`.

### Step 5: Maintain Separation of Concerns
Ensure that the code handling the creation of `skills/` (e.g., `createSkillFromTemplate` and `inferStarterSkills`) **is not modified** to include memory or logs. Skills must remain strictly stateless.

## Definition of Done
- Running `rosetta` and choosing "Scaffold" results in a clean project root without loose `memory/` or `logs/` folders.
- State files exist exclusively inside `.ai/`.
- `PROJECT_MEMORY.md` is initialized with the detailed 3-Layer Memory Protocol.
- `.gitignore` is successfully updated to ignore AI logs and tasks.
- Generated IDE wrapper files correctly point to `.ai/` for memory and logging.
```