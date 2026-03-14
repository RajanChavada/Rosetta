import path from 'path';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Rosetta target IDEs with their configuration files and templates.
 */
export const TARGETS = [
  { label: 'VSCode / Claude Code', path: 'CLAUDE.md', template: 'anthropic-claude.md' },
  { label: 'Cursor', path: '.cursorrules', template: 'cursorrules.md' },
  { label: 'Antigravity', path: '.agent/skills/project-skill.md', template: 'antigravity-skill.md' },
  { label: 'GitHub Copilot', path: '.github/copilot-instructions.md', template: 'copilot-instructions.md' },
  { label: 'Windsurf', path: '.windsurf/rules/rosetta-rules.md', template: 'windsurf-rules.md' },
  { label: 'GSD / generic', path: 'skills/gsd-skill.md', template: 'gsd-skill.md' },
  { label: 'Codex CLI', path: '.codex/rules.md', template: 'codex-cli.md' },
  { label: 'Kilo Code', path: '.kilo/rules.md', template: 'kilo-code.md' },
  { label: 'Continue.dev', path: '.continue/config.md', template: 'continue-dev.md' }
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
