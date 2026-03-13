
## ROSETTA – Agentic IDE Skill Sync CLI

### 1. Project Overview
Name: rosetta
Type: Node.js CLI (published on npm)

#### Goal:
rosetta manages a single source of truth for AI coding “rules” / skills and syncs or scaffolds platform‑specific files for multiple IDEs and agents (Claude Code, Cursor, Antigravity, GitHub Copilot, GSD, etc.) from that one master spec.

#### Key properties:

It does not call any LLMs or agents itself.

It only reads/writes files in the repo and uses symlinks or simple copies/merges.

Users keep using their own IDE agents (Claude Code, Copilot, Cursor, Antigravity) with their own keys and accounts; rosetta just aligns the rule/skill files they read.

It supports both:

New projects (scaffold everything from scratch), and

Existing projects (migrate/sync current agent files and add new IDEs).

### 2. Supported IDEs and File Conventions
We standardize on one master spec file and several target formats.

### 2.1 Master Source
Master file: .ai/master-skill.md

#### Purpose: Human‑friendly specification of the project’s agentic rules, skills, and guidelines.

#### Long term, the user edits only the master; all other generated files are synced from this.

### 2.2 IDE Targets (initial set)
These can be extended later, but v1 should support:

VSCode / Claude Code

File: CLAUDE.md at repo root (most common pattern).

Cursor

File: .cursorrules at repo root.

Antigravity

Directory: .agent/skills/

Example file: .agent/skills/project-skill.md.

GitHub Copilot

File: .github/copilot-instructions.md.

GSD / generic skills

Directory: skills/

Example: skills/gsd-skill.md.

#### Initial implementation can just mirror the master spec into these files (symlink or copy). Future versions can add format‑aware conversions.

### 3. Design Constraints
1. No LLM calls.

- rosetta is a pure filesystem/CLI utility.

- No API keys, no HTTP calls, no external services.

2. No “agent orchestration”.

- It does not “call” Copilot, Claude, Cursor, Antigravity.

- Those tools simply pick up the files rosetta maintains in the repo.

3. Safe by default.

- Never overwrite a non‑generated file without:

  - A backup (e.g., file.bak), or

  - The user confirming via interactive prompt (or --force flag).

4. Git‑friendly.

- Simple text files, easy to diff.

- All generated/synced changes are visible as normal git diffs.

5. Agent‑friendly codebase.

- Clear structure, clear MD spec (ROSETTA.md), easy for tools like Antigravity or Claude Code to extend in the future.

### 4. CLI UX and High‑Level Flows
CLI entry command:

```bash
npx rosetta
# or
rosetta
```

#### Main modes (decision tree):

1. Scaffold new agentic coding setup (for new/empty repo).
2. Sync existing multi‑IDE setup (for repos that already have a master spec and/or generated files).
3. Migrate existing agent files and add new IDEs (for repos that already have CLAUDE.md, .cursorrules, etc., but no master spec yet or missing some IDEs).

### 5. Core CLI Skeleton
The CLI should be implemented in cli.js with:

- commander for command definition / options.

- inquirer for interactive prompts.

- fs-extra and path for filesystem operations.

- chalk for colored output (optional but nice).

#### 5.1 detectRepoState helper
Use this as the basis (you can refine, but keep the logic):

```js
#!/usr/bin/env node
const { program } = require('commander');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');

async function detectRepoState() {
  const entries = fs.readdirSync('.', { withFileTypes: true });
  const folders = entries.filter(d => d.isDirectory()).map(d => d.name);
  const files   = entries.filter(d => d.isFile()).map(d => d.name);

  const ideFolders = folders.filter(f =>
    ['vscode', 'cursor', 'antigravity', 'skills', '.github', '.agent', '.claude'].includes(f)
  );

  const hasMaster = await fs.pathExists('.ai/master-skill.md');

  const hasAgentFiles =
    files.includes('CLAUDE.md') ||
    files.includes('.cursorrules') ||
    await fs.pathExists('.agent') ||
    await fs.pathExists('.github/copilot-instructions.md') ||
    await fs.pathExists('skills');

  return {
    isNewRepo: ideFolders.length === 0 && !hasMaster && !hasAgentFiles,
    hasExistingSetup: hasMaster || ideFolders.length > 0 || hasAgentFiles,
    detectedIdes: ideFolders
  };
}

async function main() {
  const state = await detectRepoState();

  const { action } = await inquirer.prompt([{
    type: 'list',
    name: 'action',
    message: 'What would you like to do?',
    choices: state.isNewRepo
      ? ['Scaffold new agentic coding setup']
      : [
          'Sync existing multi-IDE setup',
          'Migrate existing agent files and add new IDEs',
          'Scaffold new agentic coding setup'
        ]
  }]);

  if (action === 'Scaffold new agentic coding setup') {
    await scaffoldNew();
  } else if (action.startsWith('Sync')) {
    await syncExisting();
  } else if (action.startsWith('Migrate')) {
    await migrateExisting();
  }
}

main();
```

You must implement: scaffoldNew(), syncExisting(), migrateExisting().

### 6. Flow 1 – Scaffold New Agentic Coding Setup
#### 6.1 UX
Called when repo is basically empty / new:

```bash
rosetta
? What would you like to do?
❯ Scaffold new agentic coding setup
  Sync existing multi-IDE setup
  Migrate existing agent files and add new IDEs

? Select IDEs to scaffold:
 VSCode / Claude Code
 Cursor
 Antigravity
 GitHub Copilot
 GSD / generic
After completion, print something like:

text
Created .ai/master-skill.md
Linked to:
- CLAUDE.md
- .cursorrules
- .github/copilot-instructions.md

Edit .ai/master-skill.md to define your rules. Your IDE agents will pick up the synced files.
```

#### 6.2 Implementation details
Inside scaffoldNew():

Create master spec if missing.

```js
async function ensureMaster() {
  await fs.ensureDir('.ai');
  const masterPath = '.ai/master-skill.md';
  if (!await fs.pathExists(masterPath)) {
    await fs.writeFile(
      masterPath,
      '# Project Agent Rules\n\nDescribe your project, rules, and skills here.\n'
    );
  }
  return masterPath;
}
Ask which IDEs to scaffold.

```js
async function scaffoldNew() {
  const { ides } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'ides',
    message: 'Select IDEs to scaffold:',
    choices: [
      'VSCode / Claude Code',
      'Cursor',
      'Antigravity',
      'GitHub Copilot',
      'GSD / generic'
    ]
  }]);

  const masterPath = await ensureMaster();
  for (const ide of ides) {
    const { targetPath } = ideTargets(ide);
    await writeTarget(masterPath, targetPath, { interactive: true });
  }

  console.log(' New agentic structure created!');
}
IDE → targetPath mapping.

```js
function ideTargets(ideLabel) {
  switch (ideLabel) {
    case 'VSCode / Claude Code':
      return { targetPath: 'CLAUDE.md' };
    case 'Cursor':
      return { targetPath: '.cursorrules' };
    case 'Antigravity':
      return { targetPath: '.agent/skills/project-skill.md' };
    case 'GitHub Copilot':
      return { targetPath: '.github/copilot-instructions.md' };
    case 'GSD / generic':
      return { targetPath: 'skills/gsd-skill.md' };
    default:
      throw new Error(`Unknown IDE label: ${ideLabel}`);
  }
}
Symlink or copy helper.

```js
async function writeTarget(masterPath, targetPath, options = {}) {
  const { interactive = false } = options;
  await fs.ensureDir(path.dirname(targetPath));

  const exists = await fs.pathExists(targetPath);
  if (exists && interactive) {
    const { overwrite } = await inquirer.prompt([{
      type: 'confirm',
      name: 'overwrite',
      message: `${targetPath} already exists. Backup and overwrite with master?`,
      default: false
    }]);
    if (!overwrite) return;
    await fs.copy(targetPath, targetPath + '.bak', { overwrite: true });
  }

  if (process.platform !== 'win32') {
    // Prefer symlinks on Unix-like systems
    try {
      if (exists) await fs.remove(targetPath);
      const relative = path.relative(path.dirname(targetPath), masterPath);
      await fs.symlink(relative, targetPath);
    } catch {
      await fs.copy(masterPath, targetPath, { overwrite: true });
    }
  } else {
    // On Windows, use copy for simplicity
    await fs.copy(masterPath, targetPath, { overwrite: true });
  }
}
```

### 7. Flow 2 – Sync Existing Multi‑IDE Setup
Used when there is already a .ai/master-skill.md and/or previously created target files.

#### 7.1 UX
```bash
rosetta
? What would you like to do?
❯ Sync existing multi-IDE setup
  Migrate existing agent files and add new IDEs
  Scaffold new agentic coding setup

? Which IDEs do you want to sync from the master spec?
 VSCode / Claude Code
 Cursor
 Antigravity
 GitHub Copilot
 GSD / generic

? Overwrite existing files if they differ from master?
❯ Yes, backup then overwrite
  No, skip existing files
```

#### 7.2 Implementation details
Inside syncExisting():

Ensure .ai/master-skill.md exists; if not, direct the user to the migration flow instead.

Prompt for IDEs to sync (same choices as in scaffoldNew).

Write each target with writeTarget(masterPath, targetPath, { interactive: true }).

Pseudo‑implementation:

```js
async function syncExisting() {
  const masterPath = '.ai/master-skill.md';
  if (!await fs.pathExists(masterPath)) {
    console.log('No .ai/master-skill.md found. Use "Migrate existing agent files" first.');
    return;
  }

  const { ides } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'ides',
    message: 'Which IDEs do you want to sync from the master spec?',
    choices: [
      'VSCode / Claude Code',
      'Cursor',
      'Antigravity',
      'GitHub Copilot',
      'GSD / generic'
    ]
  }]);

  for (const ide of ides) {
    const { targetPath } = ideTargets(ide);
    await writeTarget(masterPath, targetPath, { interactive: true });
  }

  console.log(' Synced selected IDEs from master spec.');
}
```

### 8. Flow 3 – Migrate Existing Agent Files and Add New IDEs
Used when the repo already has agent files like CLAUDE.md or .cursorrules but may not have .ai/master-skill.md yet, or they want to add more IDEs.

#### 8.1 UX
```bash
rosetta
? What would you like to do?
❯ Migrate existing agent files and add new IDEs
  Sync existing multi-IDE setup
  Scaffold new agentic coding setup

We found these existing agent files:
- CLAUDE.md
- .cursorrules
- .github/copilot-instructions.md

? Create .ai/master-skill.md from which source?
❯ CLAUDE.md
  .cursorrules
  .github/copilot-instructions.md
  Merge all (concatenate in order)
After master creation:

```bash
? After creating master-skill.md, which IDEs do you want to generate/update?
 VSCode / Claude Code
 Cursor
 Antigravity
 GitHub Copilot
 GSD / generic
8.2 Implementation details
Inside migrateExisting():
```
Detect existing agent files.

```js
async function findExistingAgentFiles() {
  const result = [];
  if (await fs.pathExists('CLAUDE.md')) result.push('CLAUDE.md');
  if (await fs.pathExists('.cursorrules')) result.push('.cursorrules');
  if (await fs.pathExists('.github/copilot-instructions.md')) result.push('.github/copilot-instructions.md');
  if (await fs.pathExists('skills')) result.push('skills/'); // could handle per-file later
  if (await fs.pathExists('.agent/skills')) result.push('.agent/skills/');
  return result;
}
Create master if missing.

js
async function migrateExisting() {
  const masterPath = '.ai/master-skill.md';
  const existing = await findExistingAgentFiles();

  if (existing.length === 0) {
    console.log('No existing agent files found. Try "Scaffold new agentic coding setup" instead.');
    return;
  }

  if (!await fs.pathExists(masterPath)) {
    const { sourceChoice } = await inquirer.prompt([{
      type: 'list',
      name: 'sourceChoice',
      message: 'Create .ai/master-skill.md from which source?',
      choices: [
        ...existing,
        'Merge all (concatenate)'
      ]
    }]);

    await fs.ensureDir('.ai');

    if (sourceChoice === 'Merge all (concatenate)') {
      let merged = '';
      for (const f of existing.filter(x => !x.endsWith('/'))) {
        const content = await fs.readFile(f, 'utf8');
        merged += `\n\n<!-- Source: ${f} -->\n\n` + content;
      }
      await fs.writeFile(masterPath, merged.trimStart());
    } else {
      const content = await fs.readFile(sourceChoice, 'utf8');
      const header = `<!-- Generated by rosetta from ${sourceChoice} -->\n\n`;
      await fs.writeFile(masterPath, header + content);
    }
  }

  // After master is ensured, reuse syncExisting logic
  const { ides } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'ides',
    message: 'After creating master-skill.md, which IDEs do you want to generate/update?',
    choices: [
      'VSCode / Claude Code',
      'Cursor',
      'Antigravity',
      'GitHub Copilot',
      'GSD / generic'
    ]
  }]);

  for (const ide of ides) {
    const { targetPath } = ideTargets(ide);
    await writeTarget(masterPath, targetPath, { interactive: true });
  }

  console.log(' Migrated existing files and updated selected IDEs.');
}
```

### 9. Package Structure and Publishing
#### 9.1 Files
- cli.js – main CLI entrypoint.

- package.json – with bin setup.

- README.md – can be derived from this spec.

- .gitignore – standard Node ignores.

Optional: src/ TypeScript sources compiled to dist/.

#### 9.2 package.json skeleton
```json
{
  "name": "rosetta",
  "version": "0.1.0",
  "description": "CLI to scaffold and sync AI agent rule/skill files across IDEs from a single master spec.",
  "bin": {
    "rosetta": "./cli.js"
  },
  "main": "cli.js",
  "type": "module",
  "scripts": {
    "dev": "node ./cli.js",
    "test": "echo \"TODO: add tests\" && exit 0"
  },
  "keywords": [
    "ai",
    "agentic",
    "cli",
    "rules",
    "skills",
    "cursor",
    "claude",
    "antigravity",
    "copilot",
    "ide"
  ],
  "author": "YOUR NAME",
  "license": "MIT",
  "dependencies": {
    "commander": "^12.0.0",
    "inquirer": "^10.0.0",
    "fs-extra": "^11.0.0",
    "chalk": "^5.0.0"
  }
}
```

#### 9.3 Usage
After publishing:

```bash
# one-off
npx rosetta

# or global
npm install -g rosetta
rosetta
```

### 10. Additional Commands

#### 10.1 rosetta sync
Non-interactive sync from `.ai/master-skill.md` to all supported IDE files.

```bash
rosetta sync
```
**Behavior:**
- Reads `.ai/master-skill.md`.
- Regenerates `CLAUDE.md`, `.cursorrules`, `.agent/skills/project-skill.md`, `.github/copilot-instructions.md`, and `skills/gsd-skill.md` if they are present or expected.
- Backs up existing files before overwriting.

#### 10.2 rosetta watch
Watches `.ai/master-skill.md` and automatically runs the sync logic when it changes.

```bash
rosetta watch
```
**Behavior:**
- Uses `chokidar` to monitor the master spec.
- Triggers `rosetta sync` on every save (debounced).


## 11. Starter Skill Presets

Rosetta supports opinionated starter content modeled on Anthropic’s skills patterns. This allows users to scaffold projects with rich, pre-defined workflows.

### 11.1 Concept
Starter presets inject richer content into `.ai/master-skill.md` during the initial scaffold. This goes beyond generic rules, providing specialized instructions for different project types.

### 11.2 Available Presets
- **Minimal**: A blank structure for custom rule sets.
- **Agentic Starter**: A generic development project boilerplate with rules for focused agentic coding.
- **Skill-Creator**: A rich skill template inspired by Anthropic’s skill-creator, ideal for building and iteratively improving other skills.

### 11.3 UX in `scaffoldNew()`
During `rosetta scaffold`, the user is prompted to choose a preset:
Extend Rosetta so it doesn’t just create generic master-skill.md/AGENT.md, but can also inject richer, opinionated starter content modeled on Anthropic’s skills patterns (overview, intent, when to use, steps, etc.).

Add a “preset” concept on top of your templates/ directory (you already have it in the screenshot):

Current:

.ai/master-skill.md

.agent/skills/project-skill.md

.github/copilot-instructions.md

skills/gsd-skill.md

templates/AGENT.md

templates/agentic-starter.md

templates/anthropic-claude.md

templates/antigravity-skill.md

templates/copilot-instructions.md

templates/cursorrules.md

templates/minimal.md

Extend with:

templates/presets/skill-creator.md – a rich skill template inspired by Anthropic’s skill-creator (intent, steps, eval hints, etc.).

Later: templates/presets/code-reviewer.md, data-analysis.md, etc.

Rosetta then lets the user choose which preset to seed into .ai/master-skill.md or .agent/skills/... on a new scaffold.

2. UX change in scaffoldNew()
Instead of only “which IDEs?”, also ask “which preset?”:

```js
async function scaffoldNew() {
  const { preset } = await inquirer.prompt([{
    type: 'list',
    name: 'preset',
    message: 'Choose a starter template for your master skill:',
    choices: [
      { name: 'Minimal (blank structure)', value: 'minimal' },
      { name: 'Agentic starter (generic dev project)', value: 'agentic-starter' },
      { name: 'Skill-creator style starter (help building skills)', value: 'skill-creator' }
    ]
  }]);

  const masterPath = await ensureMasterFromPreset(preset);

  const { ides } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'ides',
    message: 'Select IDEs to scaffold:',
    choices: ['VSCode / Claude Code', 'Cursor', 'Antigravity', 'GitHub Copilot', 'GSD / generic']
  }]);

  // Generate AGENT.md + IDE files
  await ensureAgentFromTemplate('AGENT.md', 'AGENT.md');
  for (const ide of ides) {
    const { targetPath, templateName } = ideTargets(ide);
    await ensureFromTemplate(templateName, targetPath);
  }

  console.log(' New agentic structure created with preset:', preset);
}
```
Where:

ensureMasterFromPreset(preset) reads the right template from templates/ and writes .ai/master-skill.md.

ideTargets(ide) now also returns which template to use ('anthropic-claude', 'cursorrules', 'antigravity-skill', 'copilot-instructions', 'gsd-skill', etc.).

## 3. Example skill-creator‑style preset (compressed and original)
You cannot paste Anthropic’s SKILL.md verbatim, but you can encode the workflow and structure in your own words, inspired by their docs.

Example templates/presets/skill-creator.md:

```text
---
name: skill-creator
description: Create new skills, modify and improve existing skills, and measure skill performance. Use when users want to create a skill from scratch, edit, or optimize an existing skill, run evals to test a skill, benchmark skill performance with variance analysis, or optimize a skill's description for better triggering accuracy.
---

# Skill Creator

A skill for creating new skills and iteratively improving them.

At a high level, the process of creating a skill goes like this:

- Decide what you want the skill to do and roughly how it should do it
- Write a draft of the skill
- Create a few test prompts and run claude-with-access-to-the-skill on them
- Help the user evaluate the results both qualitatively and quantitatively
  - While the runs happen in the background, draft some quantitative evals if there aren't any (if there are some, you can either use as is or modify if you feel something needs to change about them). Then explain them to the user (or if they already existed, explain the ones that already exist)
  - Use the `eval-viewer/generate_review.py` script to show the user the results for them to look at, and also let them look at the quantitative metrics
- Rewrite the skill based on feedback from the user's evaluation of the results (and also if there are any glaring flaws that become apparent from the quantitative benchmarks)
- Repeat until you're satisfied
- Expand the test set and try again at larger scale

Your job when using this skill is to figure out where the user is in this process and then jump in and help them progress through these stages. So for instance, maybe they're like "I want to make a skill for X". You can help narrow down what they mean, write a draft, write the test cases, figure out how they want to evaluate, run all the prompts, and repeat.

On the other hand, maybe they already have a draft of the skill. In this case you can go straight to the eval/iterate part of the loop.

Of course, you should always be flexible and if the user is like "I don't need to run a bunch of evaluations, just vibe with me", you can do that instead.

Then after the skill is done (but again, the order is flexible), you can also run the skill description improver, which we have a whole separate script for, to optimize the triggering of the skill.

Cool? Cool.

## Communicating with the user

The skill creator is liable to be used by people across a wide range of familiarity with coding jargon. If you haven't heard (and how could you, it's only very recently that it started), there's a trend now where the power of Claude is inspiring plumbers to open up their terminals, parents and grandparents to google "how to install npm". On the other hand, the bulk of users are probably fairly computer-literate.

So please pay attention to context cues to understand how to phrase your communication! In the default case, just to give you some idea:

- "evaluation" and "benchmark" are borderline, but OK
- for "JSON" and "assertion" you want to see serious cues from the user that they know what those things are before using them without explaining them

It's OK to briefly explain terms if you're in doubt, and feel free to clarify terms with a short definition if you're unsure if the user will get it.

---

## Creating a skill

### Capture Intent

Start by understanding the user's intent. The current conversation might already contain a workflow the user wants to capture (e.g., they say "turn this into a skill"). If so, extract answers from the conversation history first — the tools used, the sequence of steps, corrections the user made, input/output formats observed. The user may need to fill the gaps, and should confirm before proceeding to the next step.

1. What should this skill enable Claude to do?
2. When should this skill trigger? (what user phrases/contexts)
3. What's the expected output format?
4. Should we set up test cases to verify the skill works? Skills with objectively verifiable outputs (file transforms, data extraction, code generation, fixed workflow steps) benefit from test cases. Skills with subjective outputs (writing style, art) often don't need them. Suggest the appropriate default based on the skill type, but let the user decide.

### Interview and Research

Proactively ask questions about edge cases, input/output formats, example files, success criteria, and dependencies. Wait to write test prompts until you've got this part ironed out.

Check available MCPs - if useful for research (searching docs, finding similar skills, looking up best practices), research in parallel via subagents if available, otherwise inline. Come prepared with context to reduce burden on the user.

### Write the SKILL.md

Based on the user interview, fill in these components:

- **name**: Skill identifier
- **description**: When to trigger, what it does. This is the primary triggering mechanism - include both what the skill does AND specific contexts for when to use it. All "when to use" info goes here, not in the body. Note: currently Claude has a tendency to "undertrigger" skills -- to not use them when they'd be useful. To combat this, please make the skill descriptions a little bit "pushy". So for instance, instead of "How to build a simple fast dashboard to display internal Anthropic data.", you might write "How to build a simple fast dashboard to display internal Anthropic data. Make sure to use this skill whenever the user mentions dashboards, data visualization, internal metrics, or wants to display any kind of company data, even if they don't explicitly ask for a 'dashboard.'"
- **compatibility**: Required tools, dependencies (optional, rarely needed)
- **the rest of the skill :)**

### Skill Writing Guide

#### Anatomy of a Skill

```
skill-name/
├── SKILL.md (required)
│   ├── YAML frontmatter (name, description required)
│   └── Markdown instructions
└── Bundled Resources (optional)
    ├── scripts/    - Executable code for deterministic/repetitive tasks
    ├── references/ - Docs loaded into context as needed
    └── assets/     - Files used in output (templates, icons, fonts)
```

#### Progressive Disclosure

Skills use a three-level loading system:
1. **Metadata** (name + description) - Always in context (~100 words)
2. **SKILL.md body** - In context whenever skill triggers (<500 lines ideal)
3. **Bundled resources** - As needed (unlimited, scripts can execute without loading)

These word counts are approximate and you can feel free to go longer if needed.

**Key patterns:**
- Keep SKILL.md under 500 lines; if you're approaching this limit, add an additional layer of hierarchy along with clear pointers about where the model using the skill should go next to follow up.
- Reference files clearly from SKILL.md with guidance on when to read them
- For large reference files (>300 lines), include a table of contents

**Domain organization**: When a skill supports multiple domains/frameworks, organize by variant:
```
cloud-deploy/
├── SKILL.md (workflow + selection)
└── references/
    ├── aws.md
    ├── gcp.md
    └── azure.md
```
Claude reads only the relevant reference file.

#### Principle of Lack of Surprise

This goes without saying, but skills must not contain malware, exploit code, or any content that could compromise system security. A skill's contents should not surprise the user in their intent if described. Don't go along with requests to create misleading skills or skills designed to facilitate unauthorized access, data exfiltration, or other malicious activities. Things like a "roleplay as an XYZ" are OK though.

#### Writing Patterns

Prefer using the imperative form in instructions.

**Defining output formats** - You can do it like this:
```markdown
## Report structure
ALWAYS use this exact template:
# [Title]
## Executive summary
## Key findings
## Recommendations
```

**Examples pattern** - It's useful to include examples. You can format them like this (but if "Input" and "Output" are in the examples you might want to deviate a little):
```markdown
## Commit message format
**Example 1:**
Input: Added user authentication with JWT tokens
Output: feat(auth): implement JWT-based authentication
```

### Writing Style

Try to explain to the model why things are important in lieu of heavy-handed musty MUSTs. Use theory of mind and try to make the skill general and not super-narrow to specific examples. Start by writing a draft and then look at it with fresh eyes and improve it.

### Test Cases

After writing the skill draft, come up with 2-3 realistic test prompts — the kind of thing a real user would actually say. Share them with the user: [you don't have to use this exact language] "Here are a few test cases I'd like to try. Do these look right, or do you want to add more?" Then run them.

Save test cases to `evals/evals.json`. Don't write assertions yet — just the prompts. You'll draft assertions in the next step while the runs are in progress.

```json
{
  "skill_name": "example-skill",
  "evals": [
    {
      "id": 1,
      "prompt": "User's task prompt",
      "expected_output": "Description of expected result",
      "files": []
    }
  ]
}
```

See `references/schemas.md` for the full schema (including the `assertions` field, which you'll add later).

## Running and evaluating test cases

This section is one continuous sequence — don't stop partway through. Do NOT use `/skill-test` or any other testing skill.

Put results in `<skill-name>-workspace/` as a sibling to the skill directory. Within the workspace, organize results by iteration (`iteration-1/`, `iteration-2/`, etc.) and within that, each test case gets a directory (`eval-0/`, `eval-1/`, etc.). Don't create all of this upfront — just create directories as you go.

### Step 1: Spawn all runs (with-skill AND baseline) in the same turn

For each test case, spawn two subagents in the same turn — one with the skill, one without. This is important: don't spawn the with-skill runs first and then come back for baselines later. Launch everything at once so it all finishes around the same time.

**With-skill run:**

```
Execute this task:
- Skill path: <path-to-skill>
- Task: <eval prompt>
- Input files: <eval files if any, or "none">
- Save outputs to: <workspace>/iteration-<N>/eval-<ID>/with_skill/outputs/
- Outputs to save: <what the user cares about — e.g., "the .docx file", "the final CSV">
```

**Baseline run** (same prompt, but the baseline depends on context):
- **Creating a new skill**: no skill at all. Same prompt, no skill path, save to `without_skill/outputs/`.
- **Improving an existing skill**: the old version. Before editing, snapshot the skill (`cp -r <skill-path> <workspace>/skill-snapshot/`), then point the baseline subagent at the snapshot. Save to `old_skill/outputs/`.

Write an `eval_metadata.json` for each test case (assertions can be empty for now). Give each eval a descriptive name based on what it's testing — not just "eval-0". Use this name for the directory too. If this iteration uses new or modified eval prompts, create these files for each new eval directory — don't assume they carry over from previous iterations.

```json
{
  "eval_id": 0,
  "eval_name": "descriptive-name-here",
  "prompt": "The user's task prompt",
  "assertions": []
}
```

### Step 2: While runs are in progress, draft assertions

Don't just wait for the runs to finish — you can use this time productively. Draft quantitative assertions for each test case and explain them to the user. If assertions already exist in `evals/evals.json`, review them and explain what they check.

Good assertions are objectively verifiable and have descriptive names — they should read clearly in the benchmark viewer so someone glancing at the results immediately understands what each one checks. Subjective skills (writing style, design quality) are better evaluated qualitatively — don't force assertions onto things that need human judgment.

Update the `eval_metadata.json` files and `evals/evals.json` with the assertions once drafted. Also explain to the user what they'll see in the viewer — both the qualitative outputs and the quantitative benchmark.

### Step 3: As runs complete, capture timing data

When each subagent task completes, you receive a notification containing `total_tokens` and `duration_ms`. Save this data immediately to `timing.json` in the run directory:

```json
{
  "total_tokens": 84852,
  "duration_ms": 23332,
  "total_duration_seconds": 23.3
}
```

This is the only opportunity to capture this data — it comes through the task notification and isn't persisted elsewhere. Process each notification as it arrives rather than trying to batch them.

### Step 4: Grade, aggregate, and launch the viewer

Once all runs are done:

1. **Grade each run** — spawn a grader subagent (or grade inline) that reads `agents/grader.md` and evaluates each assertion against the outputs. Save results to `grading.json` in each run directory. The grading.json expectations array must use the fields `text`, `passed`, and `evidence` (not `name`/`met`/`details` or other variants) — the viewer depends on these exact field names. For assertions that can be checked programmatically, write and run a script rather than eyeballing it — scripts are faster, more reliable, and can be reused across iterations.

2. **Aggregate into benchmark** — run the aggregation script from the skill-creator directory:
   ```bash
   python -m scripts.aggregate_benchmark <workspace>/iteration-N --skill-name <name>
   ```
   This produces `benchmark.json` and `benchmark.md` with pass_rate, time, and tokens for each configuration, with mean ± stddev and the delta. If generating benchmark.json manually, see `references/schemas.md` for the exact schema the viewer expects.
Put each with_skill version before its baseline counterpart.

3. **Do an analyst pass** — read the benchmark data and surface patterns the aggregate stats might hide. See `agents/analyzer.md` (the "Analyzing Benchmark Results" section) for what to look for — things like assertions that always pass regardless of skill (non-discriminating), high-variance evals (possibly flaky), and time/token tradeoffs.

4. **Launch the viewer** with both qualitative outputs and quantitative data:
   ```bash
   nohup python <skill-creator-path>/eval-viewer/generate_review.py \
     <workspace>/iteration-N \
     --skill-name "my-skill" \
     --benchmark <workspace>/iteration-N/benchmark.json \
     > /dev/null 2>&1 &
   VIEWER_PID=$!
   ```
   For iteration 2+, also pass `--previous-workspace <workspace>/iteration-<N-1>`.

   **Cowork / headless environments:** If `webbrowser.open()` is not available or the environment has no display, use `--static <output_path>` to write a standalone HTML file instead of starting a server. Feedback will be downloaded as a `feedback.json` file when the user clicks "Submit All Reviews". After download, copy `feedback.json` into the workspace directory for the next iteration to pick up.

Note: please use generate_review.py to create the viewer; there's no need to write custom HTML.

5. **Tell the user** something like: "I've opened the results in your browser. There are two tabs — 'Outputs' lets you click through each test case and leave feedback, 'Benchmark' shows the quantitative comparison. When you're done, come back here and let me know."

### What the user sees in the viewer

The "Outputs" tab shows one test case at a time:
- **Prompt**: the task that was given
- **Output**: the files the skill produced, rendered inline where possible
- **Previous Output** (iteration 2+): collapsed section showing last iteration's output
- **Formal Grades** (if grading was run): collapsed section showing assertion pass/fail
- **Feedback**: a textbox that auto-saves as they type
- **Previous Feedback** (iteration 2+): their comments from last time, shown below the textbox

The "Benchmark" tab shows the stats summary: pass rates, timing, and token usage for each configuration, with per-eval breakdowns and analyst observations.

Navigation is via prev/next buttons or arrow keys. When done, they click "Submit All Reviews" which saves all feedback to `feedback.json`.

### Step 5: Read the feedback

When the user tells you they're done, read `feedback.json`:

```json
{
  "reviews": [
    {"run_id": "eval-0-with_skill", "feedback": "the chart is missing axis labels", "timestamp": "..."},
    {"run_id": "eval-1-with_skill", "feedback": "", "timestamp": "..."},
    {"run_id": "eval-2-with_skill", "feedback": "perfect, love this", "timestamp": "..."}
  ],
  "status": "complete"
}
```

Empty feedback means the user thought it was fine. Focus your improvements on the test cases where the user had specific complaints.

Kill the viewer server when you're done with it:

```bash
kill $VIEWER_PID 2>/dev/null
```

---

## Improving the skill

This is the heart of the loop. You've run the test cases, the user has reviewed the results, and now you need to make the skill better based on their feedback.

### How to think about improvements

1. **Generalize from the feedback.** The big picture thing that's happening here is that we're trying to create skills that can be used a million times (maybe literally, maybe even more who knows) across many different prompts. Here you and the user are iterating on only a few examples over and over again because it helps move faster. The user knows these examples in and out and it's quick for them to assess new outputs. But if the skill you and the user are codeveloping works only for those examples, it's useless. Rather than put in fiddly overfitty changes, or oppressively constrictive MUSTs, if there's some stubborn issue, you might try branching out and using different metaphors, or recommending different patterns of working. It's relatively cheap to try and maybe you'll land on something great.

2. **Keep the prompt lean.** Remove things that aren't pulling their weight. Make sure to read the transcripts, not just the final outputs — if it looks like the skill is making the model waste a bunch of time doing things that are unproductive, you can try getting rid of the parts of the skill that are making it do that and seeing what happens.

3. **Explain the why.** Try hard to explain the **why** behind everything you're asking the model to do. Today's LLMs are *smart*. They have good theory of mind and when given a good harness can go beyond rote instructions and really make things happen. Even if the feedback from the user is terse or frustrated, try to actually understand the task and why the user is writing what they wrote, and what they actually wrote, and then transmit this understanding into the instructions. If you find yourself writing ALWAYS or NEVER in all caps, or using super rigid structures, that's a yellow flag — if possible, reframe and explain the reasoning so that the model understands why the thing you're asking for is important. That's a more humane, powerful, and effective approach.

4. **Look for repeated work across test cases.** Read the transcripts from the test runs and notice if the subagents all independently wrote similar helper scripts or took the same multi-step approach to something. If all 3 test cases resulted in the subagent writing a `create_docx.py` or a `build_chart.py`, that's a strong signal the skill should bundle that script. Write it once, put it in `scripts/`, and tell the skill to use it. This saves every future invocation from reinventing the wheel.

This task is pretty important (we are trying to create billions a year in economic value here!) and your thinking time is not the blocker; take your time and really mull things over. I'd suggest writing a draft revision and then looking at it anew and making improvements. Really do your best to get into the head of the user and understand what they want and need.

### The iteration loop

After improving the skill:

1. Apply your improvements to the skill
2. Rerun all test cases into a new `iteration-<N+1>/` directory, including baseline runs. If you're creating a new skill, the baseline is always `without_skill` (no skill) — that stays the same across iterations. If you're improving an existing skill, use your judgment on what makes sense as the baseline: the original version the user came in with, or the previous iteration.
3. Launch the reviewer with `--previous-workspace` pointing at the previous iteration
4. Wait for the user to review and tell you they're done
5. Read the new feedback, improve again, repeat

Keep going until:
- The user says they're happy
- The feedback is all empty (everything looks good)
- You're not making meaningful progress

---

## Advanced: Blind comparison

For situations where you want a more rigorous comparison between two versions of a skill (e.g., the user asks "is the new version actually better?"), there's a blind comparison system. Read `agents/comparator.md` and `agents/analyzer.md` for the details. The basic idea is: give two outputs to an independent agent without telling it which is which, and let it judge quality. Then analyze why the winner won.

This is optional, requires subagents, and most users won't need it. The human review loop is usually sufficient.

---

## Description Optimization

The description field in SKILL.md frontmatter is the primary mechanism that determines whether Claude invokes a skill. After creating or improving a skill, offer to optimize the description for better triggering accuracy.

### Step 1: Generate trigger eval queries

Create 20 eval queries — a mix of should-trigger and should-not-trigger. Save as JSON:

```json
[
  {"query": "the user prompt", "should_trigger": true},
  {"query": "another prompt", "should_trigger": false}
]
```

The queries must be realistic and something a Claude Code or Claude.ai user would actually type. Not abstract requests, but requests that are concrete and specific and have a good amount of detail. For instance, file paths, personal context about the user's job or situation, column names and values, company names, URLs. A little bit of backstory. Some might be in lowercase or contain abbreviations or typos or casual speech. Use a mix of different lengths, and focus on edge cases rather than making them clear-cut (the user will get a chance to sign off on them).

Bad: `"Format this data"`, `"Extract text from PDF"`, `"Create a chart"`

Good: `"ok so my boss just sent me this xlsx file (its in my downloads, called something like 'Q4 sales final FINAL v2.xlsx') and she wants me to add a column that shows the profit margin as a percentage. The revenue is in column C and costs are in column D i think"`

For the **should-trigger** queries (8-10), think about coverage. You want different phrasings of the same intent — some formal, some casual. Include cases where the user doesn't explicitly name the skill or file type but clearly needs it. Throw in some uncommon use cases and cases where this skill competes with another but should win.

For the **should-not-trigger** queries (8-10), the most valuable ones are the near-misses — queries that share keywords or concepts with the skill but actually need something different. Think adjacent domains, ambiguous phrasing where a naive keyword match would trigger but shouldn't, and cases where the query touches on something the skill does but in a context where another tool is more appropriate.

The key thing to avoid: don't make should-not-trigger queries obviously irrelevant. "Write a fibonacci function" as a negative test for a PDF skill is too easy — it doesn't test anything. The negative cases should be genuinely tricky.

### Step 2: Review with user

Present the eval set to the user for review using the HTML template:

1. Read the template from `assets/eval_review.html`
2. Replace the placeholders:
   - `__EVAL_DATA_PLACEHOLDER__` → the JSON array of eval items (no quotes around it — it's a JS variable assignment)
   - `__SKILL_NAME_PLACEHOLDER__` → the skill's name
   - `__SKILL_DESCRIPTION_PLACEHOLDER__` → the skill's current description
3. Write to a temp file (e.g., `/tmp/eval_review_<skill-name>.html`) and open it: `open /tmp/eval_review_<skill-name>.html`
4. The user can edit queries, toggle should-trigger, add/remove entries, then click "Export Eval Set"
5. The file downloads to `~/Downloads/eval_set.json` — check the Downloads folder for the most recent version in case there are multiple (e.g., `eval_set (1).json`)

This step matters — bad eval queries lead to bad descriptions.

### Step 3: Run the optimization loop

Tell the user: "This will take some time — I'll run the optimization loop in the background and check on it periodically."

Save the eval set to the workspace, then run in the background:

```bash
python -m scripts.run_loop \
  --eval-set <path-to-trigger-eval.json> \
  --skill-path <path-to-skill> \
  --model <model-id-powering-this-session> \
  --max-iterations 5 \
  --verbose
```

Use the model ID from your system prompt (the one powering the current session) so the triggering test matches what the user actually experiences.

While it runs, periodically tail the output to give the user updates on which iteration it's on and what the scores look like.

This handles the full optimization loop automatically. It splits the eval set into 60% train and 40% held-out test, evaluates the current description (running each query 3 times to get a reliable trigger rate), then calls Claude to propose improvements based on what failed. It re-evaluates each new description on both train and test, iterating up to 5 times. When it's done, it opens an HTML report in the browser showing the results per iteration and returns JSON with `best_description` — selected by test score rather than train score to avoid overfitting.

### How skill triggering works

Understanding the triggering mechanism helps design better eval queries. Skills appear in Claude's `available_skills` list with their name + description, and Claude decides whether to consult a skill based on that description. The important thing to know is that Claude only consults skills for tasks it can't easily handle on its own — simple, one-step queries like "read this PDF" may not trigger a skill even if the description matches perfectly, because Claude can handle them directly with basic tools. Complex, multi-step, or specialized queries reliably trigger skills when the description matches.

This means your eval queries should be substantive enough that Claude would actually benefit from consulting a skill. Simple queries like "read file X" are poor test cases — they won't trigger skills regardless of description quality.

### Step 4: Apply the result

Take `best_description` from the JSON output and update the skill's SKILL.md frontmatter. Show the user before/after and report the scores.

---

### Package and Present (only if `present_files` tool is available)

Check whether you have access to the `present_files` tool. If you don't, skip this step. If you do, package the skill and present the .skill file to the user:

```bash
python -m scripts.package_skill <path/to/skill-folder>
```

After packaging, direct the user to the resulting `.skill` file path so they can install it.

---

## Claude.ai-specific instructions

In Claude.ai, the core workflow is the same (draft → test → review → improve → repeat), but because Claude.ai doesn't have subagents, some mechanics change. Here's what to adapt:

**Running test cases**: No subagents means no parallel execution. For each test case, read the skill's SKILL.md, then follow its instructions to accomplish the test prompt yourself. Do them one at a time. This is less rigorous than independent subagents (you wrote the skill and you're also running it, so you have full context), but it's a useful sanity check — and the human review step compensates. Skip the baseline runs — just use the skill to complete the task as requested.

**Reviewing results**: If you can't open a browser (e.g., Claude.ai's VM has no display, or you're on a remote server), skip the browser reviewer entirely. Instead, present results directly in the conversation. For each test case, show the prompt and the output. If the output is a file the user needs to see (like a .docx or .xlsx), save it to the filesystem and tell them where it is so they can download and inspect it. Ask for feedback inline: "How does this look? Anything you'd change?"

**Benchmarking**: Skip the quantitative benchmarking — it relies on baseline comparisons which aren't meaningful without subagents. Focus on qualitative feedback from the user.

**The iteration loop**: Same as before — improve the skill, rerun the test cases, ask for feedback — just without the browser reviewer in the middle. You can still organize results into iteration directories on the filesystem if you have one.

**Description optimization**: This section requires the `claude` CLI tool (specifically `claude -p`) which is only available in Claude Code. Skip it if you're on Claude.ai.

**Blind comparison**: Requires subagents. Skip it.

**Packaging**: The `package_skill.py` script works anywhere with Python and a filesystem. On Claude.ai, you can run it and the user can download the resulting `.skill` file.

**Updating an existing skill**: The user might be asking you to update an existing skill, not create a new one. In this case:
- **Preserve the original name.** Note the skill's directory name and `name` frontmatter field -- use them unchanged. E.g., if the installed skill is `research-helper`, output `research-helper.skill` (not `research-helper-v2`).
- **Copy to a writeable location before editing.** The installed skill path may be read-only. Copy to `/tmp/skill-name/`, edit there, and package from the copy.
- **If packaging manually, stage in `/tmp/` first**, then copy to the output directory -- direct writes may fail due to permissions.

---

## Cowork-Specific Instructions

If you're in Cowork, the main things to know are:

- You have subagents, so the main workflow (spawn test cases in parallel, run baselines, grade, etc.) all works. (However, if you run into severe problems with timeouts, it's OK to run the test prompts in series rather than parallel.)
- You don't have a browser or display, so when generating the eval viewer, use `--static <output_path>` to write a standalone HTML file instead of starting a server. Then proffer a link that the user can click to open the HTML in their browser.
- For whatever reason, the Cowork setup seems to disincline Claude from generating the eval viewer after running the tests, so just to reiterate: whether you're in Cowork or in Claude Code, after running tests, you should always generate the eval viewer for the human to look at examples before revising the skill yourself and trying to make corrections, using `generate_review.py` (not writing your own boutique html code). Sorry in advance but I'm gonna go all caps here: GENERATE THE EVAL VIEWER *BEFORE* evaluating inputs yourself. You want to get them in front of the human ASAP!
- Feedback works differently: since there's no running server, the viewer's "Submit All Reviews" button will download `feedback.json` as a file. You can then read it from there (you may have to request access first).
- Packaging works — `package_skill.py` just needs Python and a filesystem.
- Description optimization (`run_loop.py` / `run_eval.py`) should work in Cowork just fine since it uses `claude -p` via subprocess, not a browser, but please save it until you've fully finished making the skill and the user agrees it's in good shape.
- **Updating an existing skill**: The user might be asking you to update an existing skill, not create a new one. Follow the update guidance in the claude.ai section above.

---

## Reference files

The agents/ directory contains instructions for specialized subagents. Read them when you need to spawn the relevant subagent.

- `agents/grader.md` — How to evaluate assertions against outputs
- `agents/comparator.md` — How to do blind A/B comparison between two outputs
- `agents/analyzer.md` — How to analyze why one version beat another

The references/ directory has additional documentation:
- `references/schemas.md` — JSON structures for evals.json, grading.json, etc.

---

Repeating one more time the core loop here for emphasis:

- Figure out what the skill is about
- Draft or edit the skill
- Run claude-with-access-to-the-skill on test prompts
- With the user, evaluate the outputs:
  - Create benchmark.json and run `eval-viewer/generate_review.py` to help the user review them
  - Run quantitative evals
- Repeat until you and the user are satisfied
- Package the final skill and return it to the user.

Please add steps to your TodoList, if you have such a thing, to make sure you don't forget. If you're in Cowork, please specifically put "Create evals JSON and run `eval-viewer/generate_review.py` so human can review test cases" in your TodoList to make sure it happens.

Good luck!
```
## 4. How Rosetta uses this to scaffold the rest
Once .ai/master-skill.md is seeded from skill-creator.md, the other templates can lightly reference that:

anthropic-claude.md template:

```text
# Claude Code Rules for This Repo (Skill-Creator Mode)

> Managed by Rosetta. Primary spec: `.ai/master-skill.md`.

## Intent

Use this project as a **skill factory**:
- Help the user design, draft, test, and refine skills.
- Keep individual skills small, focused, and well-documented.

## Actions for Claude

- When the user describes a new workflow, help them:
  - Clarify intent and triggers.
  - Draft a new `skills/<name>/SKILL.md`.
  - Propose test prompts and expected outcomes.
- When the user wants to improve an existing skill:
  - Review the current SKILL.md.
  - Run through test prompts and suggest changes.
```
antigravity-skill.md can similarly say “follow the skill‑creator workflow in .ai/master-skill.md when creating new skills”.

copilot-instructions.md can list “skills catalog lives in skills/ etc.”

Now when someone runs:

```bash
npx rosetta
# choose: Scaffold new -> preset = "Skill-creator style starter"
```
They get:

.ai/master-skill.md with a skill‑creator workflow.

AGENT.md with an onboarding doc.

Per‑IDE files that already tell Claude / Cursor / Antigravity / Copilot to behave as a skill‑creator assistant.

5. Syncing changes in your repo with these presets
Because the starter templates live in your templates/ folder:

You can iterate them in your own Rosetta repo (update wording, add sections).

When users upgrade Rosetta (npm), they get the new templates for future scaffolds.

If they want to re‑apply the starter to an existing repo, they can run:

```bash
rosetta sync
```
which you implement to regenerate IDE files pointing at the existing master spec, without touching their actual content unless they opt in.

## 9. Rosetta Behavior Contract

When implementing or refactoring rosetta, follow these rules:

### Three kinds of files
1. **Master spec**: `.ai/master-skill.md`
   - Single source of truth for project rules/skills.
   - Seeded from presets (minimal, agentic-starter, skill-creator).
2. **Core context files**:
   - `AGENT.md` - High-level agent identity and behavior.
   - `task.md` - Current task tracker the agent maintains.
3. **IDE wrappers**:
   - `CLAUDE.md`, `.cursorrules`, `.agent/skills/project-skill.md`, `.github/copilot-instructions.md`, `skills/gsd-skill.md`.
   - IDE wrapper files are adapters, not copies of `.ai/master-skill.md`. They contain their own boilerplate and reference the master spec in their text, but they must not be overwritten with the full master content.

### ScaffoldNew Flow
- Seed `.ai/master-skill.md` from preset.
- Create or update `AGENT.md` from template.
- Create or update `task.md` from template.
- Create each selected IDE wrapper from its template using `ensureFromTemplate`.
- Do not call `performSync` in this flow; wrappers should keep their independent template content.

### Sync Command
- Validates that `.ai/master-skill.md` exists.
- Does not overwrite IDE wrappers by default.
- If `--regenerate-wrappers` is set, re-run `ensureFromTemplate` for each wrapper with backup/overwrite prompts.
- Does not symlink or copy master into those files.

### Watch Command
- Watches `.ai/master-skill.md` for changes.
- On change, logs "master spec changed; wrappers already reference it."
- Does not overwrite wrappers.

### MigrateExisting Flow
- Construct `.ai/master-skill.md` from existing sources.
- After master is created, offer to regenerate wrappers from templates or leave them as-is.

### `new-skill` Command
- Scaffold a new skill folder under `skills/<name>/`.
- Creates `SKILL.md` and `tests/prompts.md` using the "skill-creator" style templates.
- Does not modify `.ai/master-skill.md` or any IDE wrappers.

### writeTarget vs ensureFromTemplate
- `writeTarget`: Used for mirroring a file into another path (symlink/copy). Should not be used for IDE wrappers.
- `ensureFromTemplate`: Reads from `templates/<templateName>` and writes to targetPath. Used for scaffolding and regeneration.


## IMPORTANT
“Rosetta does not create or manage individual skills. It only scaffolds and syncs the project‑level agentic structure (master rules, agent context, IDE adapters, skill folders). Actual skill content (SKILL.md files, evals, workflows) is authored by the developer using tools like Claude Skill Creator.”

-- 1. Context → starter SKILL templates
You don’t need to hit the web at runtime; just ship curated templates in templates/skills/ and choose them based on the answers.

a) Template library (in Rosetta repo)
Under templates/skills/:

node-express-postgres.skill.md

A SKILL that encodes best practices for building CRUD APIs, migrations, and error handling in a Node/Express/Postgres backend (inspired by public tutorials, but written in your words).

testing-full-pyramid.skill.md

A SKILL that covers unit + integration + E2E testing workflow, when to write which test, how to structure suites, etc.
​

data-ml-project.skill.md

frontend-react-next.skill.md

etc.

Each SKILL file is a generic, reusable skeleton, but not project‑specific.

Example node-express-postgres.skill.md sketch:

```text
---
name: node-express-postgres-api
des`cription: Help build and maintain Node/Express APIs backed by Postgres with safe CRUD patterns.
---

# Node/Express/Postgres API Skill

## Intent
Use this skill to design, implement, and refactor HTTP APIs backed by Postgres in this repository.

## When to Use
- Creating or modifying Express route handlers.
- Designing new tables or migrations.
- Implementing transactional flows involving multiple tables.

## Workflow
1. Clarify the endpoint(s): method, path, status codes, and data contracts.
2. Inspect existing Express routes, middlewares, and DB access utilities.
3. Design SQL schema changes or queries with attention to indexes, constraints, and safety.
4. Implement route handlers that:
   - Validate input
   - Use parameterized queries / query builder
   - Handle errors and edge cases explicitly
5. Add or update tests (unit + integration) for new behavior.
6. Document the endpoint and any new tables.

## Output
- Updated routes/controller files
- SQL or migration files
- Updated tests and minimal docs
```
b) Mapping from context to starter skills
After gatherContext() completes, add a simple mapping function:

```js
function inferStarterSkills(context) {
  const skills = [];

  if (context.backend.includes('Node/Express') &&
      context.datastores.includes('Postgres')) {
    skills.push('node-express-postgres.skill.md');
  }

  if (context.testingSetup === 'Unit + integration + E2E') {
    skills.push('testing-full-pyramid.skill.md');
  }

  if (context.projectType === 'Data / ML project') {
    skills.push('data-ml-project.skill.md');
  }

  // ...more heuristics later

  return skills;
}
```
In scaffoldNew() right after context gathering:

```js
const starterSkills = inferStarterSkills(context);
if (starterSkills.length) {
  const { addSkills } = await inquirer.prompt([{
    type: 'confirm',
    name: 'addSkills',
    message: `Detected useful starter skills (${starterSkills.length}). Create them under skills/?`,
    default: true
  }]);

  if (addSkills) {
    for (const skillTpl of starterSkills) {
      const name = skillTpl.replace('.skill.md', '');
      await createSkillFromTemplate(name, skillTpl);
    }
  }
}
```
Where createSkillFromTemplate is like createSkill but uses a specific template path under templates/skills/.

This keeps Rosetta out of “magic skill generation” and firmly in “drop in curated, stack‑aware SKILL boilerplates when they make sense.”

## 2. 3‑level agentic memory scaffolding
You can bake your memory model into every repo, regardless of stack, by creating a memory/ and logs/ layout plus a short “memory rules” section in master.

a) Directory layout to scaffold
Always create on scaffold:

```text
memory/
├─ PROJECT_MEMORY.md     # long-lived project facts & decisions
├─ AUTO_MEMORY.md        # agent-writable, structured notes (optional)
└─ entities/             # optional per-entity notes
logs/
└─ daily/
   └─ 2026-03-12.md      # agent & user task logs (rotating)
```
And add a section to .ai/master-skill.md like:

```text
## Memory Model

This repo uses a three-layer memory model:

1. **Project memory** (`memory/PROJECT_MEMORY.md`)  
   - Long-lived decisions, architecture notes, domain concepts, and conventions.
   - Maintained mostly by humans; agents may propose edits but ask before large changes.

2. **Auto-memory** (`memory/AUTO_MEMORY.md` and `memory/entities/`)  
   - Agent-maintained notes about recurring patterns, gotchas, or entity-specific facts.
   - Should remain concise and structured (bullet points, short sections).

3. **Task logs** (`logs/daily/YYYY-MM-DD.md`)  
   - Per-day log of tasks, experiments, and outcomes.
   - Agents append entries as they work; humans can skim to understand recent activity.
b) Rosetta scaffolding for memory
```
In scaffoldNew() after core files:

```js
// Memory root
await fs.ensureDir('memory');
await fs.ensureDir(path.join('memory', 'entities'));
await fs.ensureDir(path.join('logs', 'daily'));

// Seed PROJECT_MEMORY.md if missing
const projectMemPath = path.join('memory', 'PROJECT_MEMORY.md');
if (!(await fs.pathExists(projectMemPath))) {
  await fs.writeFile(projectMemPath, `# Project Memory\n\n- Use this file for long-lived decisions and facts.\n`);
}

// Seed AUTO_MEMORY.md
const autoMemPath = path.join('memory', 'AUTO_MEMORY.md');
if (!(await fs.pathExists(autoMemPath))) {
  await fs.writeFile(autoMemPath, `# Auto Memory\n\n- Agents can append concise notes here about recurring patterns, pitfalls, and learned heuristics.\n`);
}

// Seed today's log file (optional)
const today = new Date().toISOString().slice(0, 10);
const logPath = path.join('logs', 'daily', `${today}.md`);
if (!(await fs.pathExists(logPath))) {
  await fs.writeFile(logPath, `# ${today}\n\n## Tasks\n- [ ] Describe the current task in task.md\n`);
}
```
Then make sure your AGENT.md and IDE wrappers reference this memory model:

In AGENT.md:

```text
## Memory

Use the three memory layers consistently:

- `memory/PROJECT_MEMORY.md` for long-lived facts and decisions.
- `memory/AUTO_MEMORY.md` for short, reusable notes learned while working.
- `logs/daily/YYYY-MM-DD.md` for chronological task logs.
```
You should:
- Append to AUTO_MEMORY.md when you learn something that will help future work.
- Add entries to today's log file when you start/finish a task or hit a notable failure.
- Propose updates to PROJECT_MEMORY.md when architecture or domain decisions change.
In CLAUDE.md / .cursorrules:

```text
## Memory Usage

- Before large changes, skim `memory/PROJECT_MEMORY.md` for relevant context.
- As you work, append short notes to:
  - `memory/AUTO_MEMORY.md` for reusable patterns/lessons.
  - `logs/daily/YYYY-MM-DD.md` for what you tried and what happened.
  ```
This encodes your 3‑level memory architecture directly into the scaffolding, so any agent that reads the wrapper files understands how to use it.


## 12. Post-Scaffold Hooks

Rosetta supports running custom logic immediately after the scaffolding process is complete. This is useful for automating repetitive setup tasks like installing dependencies, running migrations, or creating additional project files.

### 12.1 Shell Command Hooks (JSON)

You can define a list of shell commands in a `.rosetta.json` file in the project root. Rosetta will execute these commands in sequence after scaffolding.

```json
// .rosetta.json
{
  "postScaffoldHooks": [
    "npm install",
    "yarn db:migrate",
    "docker-compose up -d"
  ]
}
```

### 12.2 JavaScript Hooks

For more complex logic, you can create a JavaScript hook file at `hooks/post-scaffold.js`. Rosetta will execute the exported function, passing the project `context` (containing `projectName`, `projectType`, etc.).

```javascript
// hooks/post-scaffold.js
export default async function(context) {
  if (context.projectType === 'Data / ML project') {
    // Example: Generate a requirements.txt for ML projects
    const fs = await import('fs-extra');
    await fs.writeFile('requirements.txt', 'transformers\npytorch\nscikit-learn');
    console.log('Post-scaffold: Created requirements.txt for ML project.');
  }
};
```

Rosetta supports both ESM (`export default`) and CommonJS (`module.exports`) for these hooks.

