import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Rosetta target IDEs with their configuration files and templates.
 */
export const TARGETS = [
  { label: 'VSCode / Claude Code', path: 'CLAUDE.md', template: 'anthropic-claude.md', skillsDir: '.claude/skills', generator: 'claude' },
  { label: 'Cursor', path: '.cursorrules', template: 'cursorrules.md', skillsDir: '.cursor/rules', generator: 'cursor' },
  { label: 'Antigravity', path: '.agent/skills/project-skill.md', template: 'antigravity-skill.md', skillsDir: '.agent/skills' },
  { label: 'GitHub Copilot', path: '.github/copilot-instructions.md', template: 'copilot-instructions.md', skillsDir: '.github/skills' },
  { label: 'Windsurf', path: '.windsurf/rules/rosetta-rules.md', template: 'windsurf-rules.md', skillsDir: '.windsurf/skills', generator: 'windsurf' },
  { label: 'GSD / generic', path: 'skills/gsd-skill.md', template: 'gsd-skill.md', skillsDir: 'skills' },
  { label: 'Codex CLI', path: '.codex/rules.md', template: 'codex-cli.md', skillsDir: '.agent/skills' },
  { label: 'Kilo Code', path: '.kilo/rules.md', template: 'kilo-code.md', skillsDir: '.kilo/rules' },
  { label: 'Continue.dev', path: '.continue/config.md', template: 'continue-dev.md', skillsDir: '.continue/rules' }
];

/**
 * Directory paths for loading skills from multiple sources.
 */
export const SKILLS_SOURCES = [
  path.join(__dirname, '../templates/skills'),
  path.join(os.homedir(), '.rosetta/skills'),
  path.join(process.cwd(), '.rosetta/skills'),
  path.join(process.cwd(), 'skills'),
  path.join(process.cwd(), 'company-skills')
];

/**
 * Rosetta configuration directory and registry paths.
 */
export const ROSETTA_DIR = path.join(os.homedir(), '.rosetta');
export const REGISTRY_PATH = path.join(ROSETTA_DIR, 'registry.json');

/**
 * Default registry content with sample presets and skills.
 */
export const DEFAULT_REGISTRY = {
  presets: [
    {
      name: "@acme/fintech-agentic",
      domain: "financial",
      description: "A preset for fintech agents with strict compliance rules.",
      url: "https://raw.githubusercontent.com/RajanChavada/Rosetta/main/templates/presets/skill-creator.md"
    }
  ],
  skills: [
    {
      name: "@acme/k8s-manifests",
      domain: "devops",
      description: "Skills for Kubernetes manifest generation and validation.",
      url: "https://raw.githubusercontent.com/RajanChavada/Rosetta/main/templates/skills/node-express-postgres.skill.md"
    }
  ]
};

/**
 * Memory and logging templates.
 */
export const PROJECT_MEMORY_TEMPLATE = `# Project Memory

This file stores **long-lived knowledge** about the project: decisions, conventions, domain facts, and architectural context that should remain true across tasks and over time.

## What belongs here

- Key architectural decisions and why they were made.
- Important domain concepts and invariants (e.g., "a workspace always has at least one owner").
- Naming conventions, folder structure conventions, and patterns that should be reused.
- Changelogs for major shifts in architecture or tech stack.

## What does NOT belong here

- Step-by-step task logs or debugging notes (use \`.ai/logs/daily/YYYY-MM-DD.md\`).
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
  - Decision: All new public APIs must be versioned under \`/v2/\` with explicit deprecation strategy for \`/v1/\`.
  - Implications: Update API docs, client SDKs, and test coverage to reflect versioning.
`;

export const AUTO_MEMORY_TEMPLATE = `# Auto Memory

This file is for **agent-maintained notes and heuristics** that are useful across sessions but not "hard" project decisions.

## What belongs here

- Reusable troubleshooting steps ("When tests fail with X, check Y first").
- Observed patterns in the codebase ("Most services use helper Z for logging").
- Short reminders about gotchas ("Do not modify table A directly; use migration scripts").

## What does NOT belong here

- Long narratives or full task logs (those go in \`.ai/logs/daily/YYYY-MM-DD.md\`).
- Major architectural or product decisions (those belong in \`PROJECT_MEMORY.md\`).
- Sensitive data like access tokens or raw secrets.

## How the agent should update this file

- Append **short, bulleted notes**, not essays.
- Prefer patterns over one-off events.
- If a note starts to feel like a project-wide rule, propose moving it to \`PROJECT_MEMORY.md\`.

Example entries:

- When updating DB schema, always run \`npm test db\` before committing.
- Frontend components usually live under \`src/ui/\` and follow the \`Feature/Component\` pattern.
- Integration tests use a seeded Postgres test database defined in \`docker-compose.test.yml\`.
`;

export const DAILY_LOG_TEMPLATE = `# {{DATE}}

Daily log for this date. Each entry should capture **what was attempted, what changed, and what was learned**.

## How to use this file

- Start your day by appending a new section with your name/agent label.
- For each task, record:
  - The goal
  - Key steps or commands
  - Outcomes (success/failure)
  - Any follow-ups or questions

## Entries

### [Your Name or Agent Label]

**Task:** Short description of what you're doing
**Context:** Link to issue/ticket if relevant

**Actions:**
- Step 1 …
- Step 2 …

**Outcome:**
- What worked / what failed
- Links to PRs, commits, or files touched

**Learnings / Notes:**
- Anything worth moving later to \`AUTO_MEMORY.md\` or \`PROJECT_MEMORY.md\`.
`;

export const UNIVERSAL_MEMORY_WORKFLOW = `## Agent Memory & Logging Workflow
This project uses a centralized memory and logging system located in the \`.ai/\` directory. You MUST follow these conventions:

1. **Context Gathering:** Before starting a task, read \`.ai/memory/PROJECT_MEMORY.md\` to understand architectural constraints.
2. **Learning:** If you discover a project-specific quirk, bug pattern, or undocumented preference, append a brief note to \`.ai/memory/AUTO_MEMORY.md\`.
3. **Task Logging:** Document your progress, tools used, and commands run in \`.ai/logs/daily/YYYY-MM-DD.md\`. Create the file if today's log doesn't exist.
4. **Current Task:** Track your immediate active task in \`.ai/task.md\`.`;

/**
 * Memory hierarchy levels in strict order.
 * Agents should read and update memory files in this order.
 */
export const MEMORY_HIERARCHY = [
  {
    level: 1,
    name: 'PROJECT_MEMORY.md',
    path: '.ai/memory/PROJECT_MEMORY.md',
    purpose: 'Architectural decisions, domain rules, "Why"',
    updateRule: 'Propose to user before modifying'
  },
  {
    level: 2,
    name: 'AUTO_MEMORY.md',
    path: '.ai/memory/AUTO_MEMORY.md',
    purpose: 'Heuristics, patterns, gotchas, shortcuts',
    updateRule: 'Append freely, promote to PROJECT_MEMORY.md when appropriate'
  },
  {
    level: 3,
    name: 'Daily Logs',
    path: '.ai/logs/daily/YYYY-MM-DD.md',
    purpose: 'Session activity, what was attempted',
    updateRule: 'Auto-log for significant work'
  },
  {
    level: 4,
    name: 'Tribal Knowledge Archive',
    path: '.ai/archive/tribal-knowledge.md',
    purpose: 'Append-only tribal wisdom',
    updateRule: 'User approval required, append-only'
  },
  {
    level: 5,
    name: 'Current Task',
    path: '.ai/task.md',
    purpose: 'Current active objective',
    updateRule: 'Update as needed'
  }
];

/**
 * Archive retention policy in days.
 * Daily logs older than this are rotated to archive.
 */
export const ARCHIVE_RETENTION_DAYS = 90;

/**
 * Tribal knowledge indicators.
 * Signals that suggest undocumented tribal knowledge.
 */
export const TRIBAL_KNOWLEDGE_INDICATORS = [
  'We always do it this way',
  'undocumented',
  'workaround',
  'implicit',
  'convention',
  'dont touch',
  "don't touch",
  'historical',
  'learned the hard way',
  'team convention',
  'undocumented pattern'
];

/**
 * Auto-log triggers.
 * Activities that should always be logged to daily logs.
 */
export const AUTO_LOG_TRIGGERS = [
  'multi-step problem solving',
  'root cause discovery',
  'feature implementation',
  'complex debugging',
  'configuration change',
  'schema change',
  'PRD creation',
  'performance optimization',
  'library change',
  'technical debt reduction'
];

/**
 * Archive entry template for tribal knowledge.
 */
export const ARCHIVE_ENTRY_TEMPLATE = `## [{{DATE}}] {{TITLE}}

**Category:** {{CATEGORY}}

**Context:** {{CONTEXT}}

**The Knowledge:** {{KNOWLEDGE}}

**Source:** {{SOURCE}}

**Archived by:** {{AGENT}}, {{DATE}}

---
`;

/**
 * Memory template file paths.
 */
export const MEMORY_TEMPLATES = {
  PROJECT_MEMORY: path.join(__dirname, '../templates/memory/PROJECT_MEMORY.md'),
  AUTO_MEMORY: path.join(__dirname, '../templates/memory/AUTO_MEMORY.md'),
  DAILY_LOG: path.join(__dirname, '../templates/memory/daily-log.md'),
  TRIBAL_KNOWLEDGE: path.join(__dirname, '../templates/memory/tribal-knowledge-archive.md'),
  RETIRED_PATTERNS: path.join(__dirname, '../templates/memory/retired-patterns.md'),
  LOG_ARCHIVE_MONTH: path.join(__dirname, '../templates/memory/log-archive-month.md')
};

/**
 * YAML-first architecture constants.
 */
export const YAML_CONSTANTS = {
  DEFAULT_YAML_PATH: 'rosetta.yaml',
  SCHEMA_PATH: path.join(__dirname, '../schemas/rosetta-schema.json'),
  YAML_TEMPLATES_DIR: path.join(__dirname, '../templates/yaml'),
  VERSION: '1.0.0'
};

/**
 * IDE generator mapping.
 */
export const GENERATORS = {
  claude: { classRef: null, path: 'CLAUDE.md' },
  cursor: { classRef: null, path: '.cursorrules' },
  windsurf: { classRef: null, path: '.windsurfrules' }
  // Future: codex, copilot, kilo, continue
};
