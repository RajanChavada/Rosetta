export type NavLink = { label: string; href: string };
export type NavGroup = { title: string; links: NavLink[] };

export const SIDEBAR_NAV: NavGroup[] = [
  {
    title: 'Get Started',
    links: [
      { label: 'Introduction', href: '/docs/getting-started' },
      { label: 'Installation', href: '/docs/getting-started/installation' },
      { label: 'Quick start', href: '/docs/getting-started/quick-start' },
    ],
  },
  {
    title: 'Concepts',
    links: [
      { label: 'Master spec', href: '/docs/concepts/master-spec' },
      { label: 'Memory system', href: '/docs/concepts/memory-system' },
      { label: 'Skills', href: '/docs/concepts/skills' },
      { label: 'IDE wrappers', href: '/docs/concepts/ide-wrappers' },
    ],
  },
  {
    title: 'Commands',
    links: [
      { label: 'All commands', href: '/docs/commands' },
      { label: 'Setup', href: '/docs/commands/setup' },
      { label: 'Sync', href: '/docs/commands/sync' },
      { label: 'Skills', href: '/docs/commands/skills' },
      { label: 'Ideation', href: '/docs/commands/ideate' },
      { label: 'Agents & personas', href: '/docs/commands/agents' },
      { label: 'Migration', href: '/docs/commands/migration' },
      { label: 'Translation', href: '/docs/commands/translation' },
      { label: 'Documentation', href: '/docs/commands/docs-cmd' },
      { label: 'Health', href: '/docs/commands/health' },
    ],
  },
  {
    title: 'Reference',
    links: [
      { label: 'Skill catalog', href: '/docs/skill-catalog' },
      { label: 'IDE support', href: '/docs/ides' },
      { label: 'rosetta.yaml', href: '/docs/yaml' },
    ],
  },
];
