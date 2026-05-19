export type IdeSpec = {
  id: string;
  name: string;
  configPath: string;
  skillsDir: string;
  invoke?: string;
};

export const IDES: IdeSpec[] = [
  {
    id: 'claude',
    name: 'Claude Code',
    configPath: 'CLAUDE.md',
    skillsDir: '.claude/skills',
    invoke: '/skill-name',
  },
  {
    id: 'cursor',
    name: 'Cursor',
    configPath: '.cursor/rules/*.mdc',
    skillsDir: '.cursor/rules',
    invoke: '@skill-name',
  },
  {
    id: 'windsurf',
    name: 'Windsurf',
    configPath: '.windsurf/rules/rosetta-rules.md',
    skillsDir: '.windsurf/rules',
    invoke: '@skill-name',
  },
  {
    id: 'copilot',
    name: 'GitHub Copilot',
    configPath: '.github/copilot-instructions.md',
    skillsDir: '.github/skills',
  },
  {
    id: 'codex',
    name: 'Codex CLI',
    configPath: '.codex/rules.md',
    skillsDir: '.agents/skills',
  },
  {
    id: 'kilo',
    name: 'Kilo Code',
    configPath: '.kilo/rules.md',
    skillsDir: '.kilo/rules',
  },
  {
    id: 'continue',
    name: 'Continue.dev',
    configPath: '.continue/config.md',
    skillsDir: '.continue/rules',
  },
  {
    id: 'antigrav',
    name: 'Antigravity',
    configPath: '.agent/skills/project-skill.md',
    skillsDir: '.agent/skills',
  },
  {
    id: 'replit',
    name: 'Replit',
    configPath: 'replit.md',
    skillsDir: '—',
  },
  {
    id: 'gsd',
    name: 'GSD / Generic',
    configPath: 'skills/gsd-skill.md',
    skillsDir: 'skills',
  },
];
