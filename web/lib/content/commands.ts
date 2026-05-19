export type CommandOption = {
  flag: string;
  description: string;
  default?: string;
};

export type CommandExample = {
  label: string;
  command: string;
};

export type CommandGroup =
  | 'setup'
  | 'sync'
  | 'skills'
  | 'ideate'
  | 'agents'
  | 'migration'
  | 'translation'
  | 'docs'
  | 'health';

export type CommandSpec = {
  id: string;
  name: string;
  group: CommandGroup;
  summary: string;
  examples: CommandExample[];
  options: CommandOption[];
};

export const COMMAND_GROUPS: Record<
  CommandGroup,
  { title: string; description: string; route: string }
> = {
  setup: {
    title: 'Setup',
    description: 'Scaffold projects and bootstrap the .ai/ brain.',
    route: '/docs/commands/setup',
  },
  sync: {
    title: 'Sync',
    description: 'Keep IDE wrappers and YAML in lockstep with the master spec.',
    route: '/docs/commands/sync',
  },
  skills: {
    title: 'Skills',
    description: 'Install, create, and manage skills across IDEs.',
    route: '/docs/commands/skills',
  },
  ideate: {
    title: 'Ideation',
    description: 'Generate framing prompts for interactive skill design.',
    route: '/docs/commands/ideate',
  },
  agents: {
    title: 'Agents & Personas',
    description: 'Sub-agents, personas, and multi-step workflows.',
    route: '/docs/commands/agents',
  },
  migration: {
    title: 'Migration',
    description: 'Move legacy configs into the Rosetta model.',
    route: '/docs/commands/migration',
  },
  translation: {
    title: 'Translation',
    description: 'Convert between IDE config formats.',
    route: '/docs/commands/translation',
  },
  docs: {
    title: 'Documentation',
    description: 'Generate CLAUDE.md and skill documentation.',
    route: '/docs/commands/docs-cmd',
  },
  health: {
    title: 'Health & Validation',
    description: 'Audit, validate, score, and rotate memory.',
    route: '/docs/commands/health',
  },
};

export const COMMANDS: CommandSpec[] = [
  // ---------- Setup ----------
  {
    id: 'scaffold',
    name: 'scaffold',
    group: 'setup',
    summary:
      'Full zero-config setup. Detects your stack, creates the .ai/ brain, memory layout, IDE configs, and starter skills.',
    examples: [
      { label: 'Recommended', command: 'rosetta scaffold --auto-ideate' },
      { label: 'Interactive', command: 'rosetta scaffold' },
      { label: 'Non-interactive', command: 'rosetta scaffold --yes' },
      { label: 'Specific IDEs', command: 'rosetta scaffold --ide claude --ide cursor' },
      { label: 'Override stack', command: 'rosetta scaffold --stack next.js --ide vscode' },
      { label: 'Dry run', command: 'rosetta scaffold --dry-run' },
    ],
    options: [
      { flag: '--yes', description: 'Accept all defaults, no prompts.' },
      { flag: '--ide <ides>', description: 'Comma-separated or repeated; which IDE wrappers to generate.' },
      { flag: '--stack <stack>', description: 'Override stack detection.' },
      { flag: '--auto-ideate', description: 'Generate skill-ideation template and copy framing prompt to clipboard.' },
      { flag: '--ideate-output <path>', description: 'Custom path for the ideation template.' },
      { flag: '--no-clipboard', description: 'Skip clipboard copy.' },
      { flag: '--skills-dir <path>', description: 'Custom skills directory.' },
      { flag: '--skills-repo <url>', description: 'Pre-fill a skills repo to install from.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'init',
    name: 'init',
    group: 'setup',
    summary:
      'Alias for `rosetta scaffold`. Accepts the same flags. Kept for muscle-memory with other CLIs.',
    examples: [
      { label: 'Same as scaffold', command: 'rosetta init --auto-ideate' },
    ],
    options: [],
  },
  {
    id: 'rescaffold',
    name: 'rescaffold',
    group: 'setup',
    summary:
      'Selectively re-scaffold parts of the setup. Useful when memory files or IDE wrappers drift.',
    examples: [
      { label: 'Memory files only', command: 'rosetta rescaffold memory' },
      { label: 'IDE wrappers only', command: 'rosetta rescaffold ides' },
      { label: 'Everything', command: 'rosetta rescaffold all' },
      { label: 'Dry run', command: 'rosetta rescaffold all --dry-run' },
    ],
    options: [
      { flag: '<type>', description: 'One of: memory, ides, all.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'init-ide',
    name: 'init-ide',
    group: 'setup',
    summary:
      'Legacy: generate only IDE config files without touching .ai/. Prefer `scaffold` unless you specifically only need IDE wrappers.',
    examples: [
      { label: 'Generate Claude + Cursor configs', command: 'rosetta init-ide --ide claude --ide cursor' },
      { label: 'Non-interactive', command: 'rosetta init-ide --yes' },
    ],
    options: [
      { flag: '--yes', description: 'Accept all defaults.' },
      { flag: '--ide <ides>', description: 'Which IDE configs to generate.' },
      { flag: '--stack <stack>', description: 'Override stack detection.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },

  // ---------- Sync ----------
  {
    id: 'sync',
    name: 'sync',
    group: 'sync',
    summary:
      'Verify IDE wrappers match the master spec, or regenerate them from .ai/master-skill.md.',
    examples: [
      { label: 'Verify only', command: 'rosetta sync' },
      { label: 'Regenerate wrappers', command: 'rosetta sync --regenerate-wrappers' },
      { label: 'Also update installed skills', command: 'rosetta sync --update-skills' },
      { label: 'Dry run', command: 'rosetta sync --dry-run' },
    ],
    options: [
      { flag: '--regenerate-wrappers', description: 'Re-render every IDE wrapper from the master spec.' },
      { flag: '--update-skills', description: 'Re-translate installed skills into each IDE format.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'watch',
    name: 'watch',
    group: 'sync',
    summary:
      'Watch .ai/master-skill.md and regenerate IDE wrappers on save (300ms debounce).',
    examples: [{ label: 'Start watching', command: 'rosetta watch' }],
    options: [],
  },
  {
    id: 'sync-yaml',
    name: 'sync-yaml',
    group: 'sync',
    summary:
      'YAML-first sync. Reads rosetta.yaml and compiles it into every selected IDE configuration.',
    examples: [
      { label: 'Sync to all IDEs', command: 'rosetta sync-yaml' },
      { label: 'Only Claude + Cursor', command: 'rosetta sync-yaml --ides claude,cursor' },
      { label: 'Custom yaml path', command: 'rosetta sync-yaml --from custom.yaml' },
      { label: 'Dry run + verbose', command: 'rosetta sync-yaml --dry-run --verbose' },
    ],
    options: [
      { flag: '--from <path>', description: 'Path to the YAML file.', default: 'rosetta.yaml' },
      { flag: '--ides <list>', description: 'Comma-separated IDE ids to sync.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
      { flag: '--verbose', description: 'Print every action.' },
    ],
  },
  {
    id: 'validate-config',
    name: 'validate-config',
    group: 'sync',
    summary: 'Validate rosetta.yaml against the schema. Use before sync-yaml to catch typos.',
    examples: [
      { label: 'Default file', command: 'rosetta validate-config' },
      { label: 'Custom file', command: 'rosetta validate-config --file custom.yaml' },
    ],
    options: [
      { flag: '--file <path>', description: 'Path to YAML file to validate.', default: 'rosetta.yaml' },
    ],
  },

  // ---------- Skills ----------
  {
    id: 'new-skill',
    name: 'new-skill',
    group: 'skills',
    summary: 'Scaffold a new skill folder with SKILL.md and tests/prompts.md boilerplates.',
    examples: [
      { label: 'Blank skill', command: 'rosetta new-skill api-auth' },
      { label: 'From template', command: 'rosetta new-skill api-auth --template node-express-postgres' },
    ],
    options: [
      { flag: '<name>', description: 'Skill name.' },
      { flag: '--template <name>', description: 'Use a built-in template.' },
      { flag: '--skills-dir <path>', description: 'Where to write the new skill.' },
      { flag: '--skills-repo <url>', description: 'Source skills repo.' },
      { flag: '--from-suggestion <id>', description: 'Hydrate from an ideation suggestion.' },
    ],
  },
  {
    id: 'catalog',
    name: 'catalog',
    group: 'skills',
    summary: 'List every skill in the catalog with metadata (domains, tags, descriptions).',
    examples: [
      { label: 'Full catalog', command: 'rosetta catalog' },
      { label: 'Filter by domain', command: 'rosetta catalog --domain backend' },
      { label: 'JSON output', command: 'rosetta catalog --json --limit 5' },
    ],
    options: [
      { flag: '--json', description: 'Output as JSON.' },
      { flag: '--domain <filter>', description: 'Filter by domain.' },
      { flag: '--limit <n>', description: 'Limit results.' },
    ],
  },
  {
    id: 'search',
    name: 'search',
    group: 'skills',
    summary: 'Search the catalog by name, description, or tags.',
    examples: [
      { label: 'Free text', command: 'rosetta search "react"' },
      { label: 'With limit', command: 'rosetta search "api" --limit 10' },
      { label: 'JSON output', command: 'rosetta search "test" --json' },
    ],
    options: [
      { flag: '[query]', description: 'Search query string.' },
      { flag: '--json', description: 'Output as JSON.' },
      { flag: '--domain <filter>', description: 'Filter by domain.' },
      { flag: '--limit <n>', description: 'Limit results.' },
    ],
  },
  {
    id: 'install',
    name: 'install',
    group: 'skills',
    summary:
      'Install a skill from a Git URL or local path. Auto-translates into every configured IDE.',
    examples: [
      { label: 'From GitHub', command: 'rosetta install https://github.com/rosetta-ai/node-express-postgres' },
      { label: 'From local path', command: 'rosetta install ./local-skill-repo' },
      { label: 'Multi-IDE explicit', command: 'rosetta install https://github.com/org/skill --multi-ide' },
      { label: 'Specific IDE only', command: 'rosetta install https://github.com/org/skill --ide cursor' },
      { label: 'Global install', command: 'rosetta install https://github.com/org/skill --global' },
      { label: 'Dry run', command: 'rosetta install https://github.com/org/skill --dry-run' },
    ],
    options: [
      { flag: '[url]', description: 'Git URL or local path (interactive if omitted).' },
      { flag: '--multi-ide', description: 'Translate into every detected IDE.' },
      { flag: '--ide <ide>', description: 'Restrict install to a single IDE.' },
      { flag: '--global', description: 'Install globally to ~/.rosetta/skills.' },
      { flag: '--project', description: 'Install into the current project (default).' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'skills',
    name: 'skills',
    group: 'skills',
    summary: 'List installed skills with source, scope, install date, and commit hash.',
    examples: [
      { label: 'Pretty list', command: 'rosetta skills' },
      { label: 'JSON', command: 'rosetta skills --format json' },
      { label: 'Global skills only', command: 'rosetta skills --scope global' },
      { label: 'Per-IDE manifest', command: 'rosetta skills --ide claude' },
    ],
    options: [
      { flag: '--format <format>', description: 'Output format.', default: 'pretty' },
      { flag: '--scope <scope>', description: 'project | global | all.', default: 'all' },
      { flag: '--ide <ide>', description: 'Show only one IDE\'s manifest.' },
    ],
  },
  {
    id: 'uninstall',
    name: 'uninstall',
    group: 'skills',
    summary: 'Uninstall a skill and update each IDE manifest.',
    examples: [
      { label: 'Remove from project', command: 'rosetta uninstall react-skill' },
      { label: 'Remove globally', command: 'rosetta uninstall api-server --global' },
      { label: 'Purge all traces', command: 'rosetta uninstall api-server --purge' },
    ],
    options: [
      { flag: '<name>', description: 'Skill name.' },
      { flag: '--global', description: 'Uninstall from global scope.' },
      { flag: '--purge', description: 'Remove every translated path, not just the manifest entry.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },

  // ---------- Ideate ----------
  {
    id: 'ideate',
    name: 'ideate',
    group: 'ideate',
    summary:
      'Analyze the project and generate a framing prompt that gets pasted into your IDE for interactive skill design.',
    examples: [
      { label: 'Default', command: 'rosetta ideate' },
      { label: 'Analyze a folder', command: 'rosetta ideate --area ./src' },
      { label: 'Save to file', command: 'rosetta ideate --output ./my-template.md' },
      { label: 'Non-interactive', command: 'rosetta ideate --non-interactive' },
      { label: 'JSON output', command: 'rosetta ideate --json' },
      { label: 'Skip clipboard', command: 'rosetta ideate --no-clipboard' },
    ],
    options: [
      { flag: '-a, --area <path>', description: 'Restrict analysis to a folder.' },
      { flag: '--output <path>', description: 'Where to write the template.' },
      { flag: '--json', description: 'Output as JSON.' },
      { flag: '--interactive', description: 'Force interactive prompt.' },
      { flag: '--non-interactive', description: 'Force non-interactive.' },
      { flag: '--no-clipboard', description: 'Skip clipboard copy.' },
      { flag: '--max-skills <n>', description: 'Cap suggested skill count.', default: '5' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },

  // ---------- Agents & Personas ----------
  {
    id: 'agent',
    name: 'agent',
    group: 'agents',
    summary:
      'Scaffold a specialized sub-agent (architect, debugger, reviewer). Interactive selection if no name given.',
    examples: [
      { label: 'Architect', command: 'rosetta agent architect' },
      { label: 'Reviewer for Cursor only', command: 'rosetta agent reviewer --ide cursor' },
      { label: 'Interactive', command: 'rosetta agent' },
    ],
    options: [
      { flag: '[name]', description: 'Sub-agent name.' },
      { flag: '-i, --ide <ide>', description: 'Target IDE.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'persona',
    name: 'persona',
    group: 'agents',
    summary: 'Inject preset conventions that shape agent behavior (standard, senior, frontend, backend).',
    examples: [
      { label: 'Senior engineer persona', command: 'rosetta persona senior' },
      { label: 'Frontend-focused for Cursor', command: 'rosetta persona frontend --ide cursor' },
    ],
    options: [
      { flag: '<type>', description: 'standard | senior | frontend | backend.' },
      { flag: '-i, --ide <ide>', description: 'Target IDE.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'workflow',
    name: 'workflow',
    group: 'agents',
    summary: 'Define a multi-step agentic task chain merged into rosetta.yaml and synced across IDEs.',
    examples: [{ label: 'Custom workflow', command: 'rosetta workflow refactor-auth' }],
    options: [
      { flag: '<name>', description: 'Workflow name.' },
      { flag: '-i, --ide <ide>', description: 'Target IDE.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },

  // ---------- Migration ----------
  {
    id: 'migrate',
    name: 'migrate',
    group: 'migration',
    summary: 'Interactive wizard. Finds .cursorrules, CLAUDE.md, and similar files and merges them into the Rosetta layout.',
    examples: [
      { label: 'Default', command: 'rosetta migrate' },
      { label: 'From a folder', command: 'rosetta migrate --source agentic-corder/' },
    ],
    options: [{ flag: '--source <path>', description: 'Folder to scan for legacy configs.' }],
  },
  {
    id: 'migrate-from-cursor',
    name: 'migrate-from-cursor',
    group: 'migration',
    summary: 'Convert an existing .cursorrules into .ai/master-skill.md.',
    examples: [{ label: 'Default', command: 'rosetta migrate-from-cursor' }],
    options: [],
  },
  {
    id: 'migrate-from-claude',
    name: 'migrate-from-claude',
    group: 'migration',
    summary: 'Convert an existing CLAUDE.md into the .ai/ structure.',
    examples: [{ label: 'Default', command: 'rosetta migrate-from-claude' }],
    options: [],
  },
  {
    id: 'migrate-to-yaml',
    name: 'migrate-to-yaml',
    group: 'migration',
    summary: 'Move .ai/master-skill.md into a rosetta.yaml source of truth for YAML-first workflows.',
    examples: [
      { label: 'Default', command: 'rosetta migrate-to-yaml' },
      { label: 'Dry run + verbose', command: 'rosetta migrate-to-yaml --dry-run --verbose' },
    ],
    options: [
      { flag: '--dry-run', description: 'Preview without writing.' },
      { flag: '--verbose', description: 'Print every action.' },
    ],
  },

  // ---------- Translation ----------
  {
    id: 'translate',
    name: 'translate',
    group: 'translation',
    summary: 'Convert a single configuration file between IDE formats.',
    examples: [
      { label: 'Cursor → Claude', command: 'rosetta translate .cursorrules --to claude --output CLAUDE.md' },
      { label: 'With explicit source', command: 'rosetta translate input.md --from cursor --to windsurf' },
      { label: 'Dry run', command: 'rosetta translate .cursorrules --to claude --dry-run' },
    ],
    options: [
      { flag: '<file>', description: 'Source file.' },
      { flag: '--from <format>', description: 'Source format (auto-detected if omitted).' },
      { flag: '--to <format>', description: 'Target format.' },
      { flag: '-o, --output <path>', description: 'Output file path.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },
  {
    id: 'translate-all',
    name: 'translate-all',
    group: 'translation',
    summary: 'Bulk migrate every existing IDE config to a target format.',
    examples: [
      { label: 'Migrate everything to Cursor', command: 'rosetta translate-all --to cursor --dry-run' },
      { label: 'Confirm changes', command: 'rosetta translate-all --to windsurf --confirm' },
    ],
    options: [
      { flag: '--to <format>', description: 'Target IDE format.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
      { flag: '--confirm', description: 'Skip confirmation prompt.' },
    ],
  },
  {
    id: 'add-ide',
    name: 'add-ide',
    group: 'translation',
    summary: 'Add a new IDE to an existing Rosetta setup. Regenerates the wrapper from the master spec.',
    examples: [
      { label: 'Add Codex', command: 'rosetta add-ide codex' },
      { label: 'Interactive', command: 'rosetta add-ide' },
    ],
    options: [
      { flag: '[name]', description: 'IDE id (interactive if omitted).' },
      { flag: '--dry-run', description: 'Preview without writing.' },
    ],
  },

  // ---------- Documentation ----------
  {
    id: 'doc',
    name: 'doc',
    group: 'docs',
    summary: 'Generate a CLAUDE.md documentation draft from project inference.',
    examples: [
      { label: 'Default', command: 'rosetta doc' },
      { label: 'Custom output', command: 'rosetta doc -o CLAUDE.md' },
      { label: 'JSON + inferred details', command: 'rosetta doc --json --include-inferred --verbose' },
    ],
    options: [
      { flag: '-o, --output <file>', description: 'Output path.' },
      { flag: '--json', description: 'JSON output.' },
      { flag: '--include-inferred', description: 'Include inferred entries.' },
      { flag: '--verbose', description: 'Print every action.' },
    ],
  },
  {
    id: 'docs',
    name: 'docs',
    group: 'docs',
    summary: 'Generate an interactive HTML visualization of every installed skill.',
    examples: [
      { label: 'Generate', command: 'rosetta docs' },
      { label: 'Open in browser', command: 'rosetta docs --open' },
      { label: 'For Cursor only', command: 'rosetta docs --ide cursor' },
      { label: 'Dry run', command: 'rosetta docs --dry-run' },
    ],
    options: [
      { flag: '-o, --output <path>', description: 'Output directory.' },
      { flag: '--ide <name>', description: 'Restrict to one IDE.' },
      { flag: '--open', description: 'Open in default browser after generation.' },
      { flag: '--quiet', description: 'Suppress output.' },
      { flag: '--dry-run', description: 'Preview without writing.' },
      { flag: '--verbose', description: 'Print every action.' },
      { flag: '--json', description: 'JSON output.' },
    ],
  },

  // ---------- Health & Validation ----------
  {
    id: 'validate',
    name: 'validate',
    group: 'health',
    summary: 'Check the .ai/ structure for completeness. Fast sanity check.',
    examples: [{ label: 'Default', command: 'rosetta validate' }],
    options: [],
  },
  {
    id: 'health',
    name: 'health',
    group: 'health',
    summary: 'Report a Rosetta Score and full repository health status.',
    examples: [{ label: 'Default', command: 'rosetta health' }],
    options: [],
  },
  {
    id: 'audit',
    name: 'audit',
    group: 'health',
    summary: 'Audit templates for quality and completeness.',
    examples: [
      { label: 'Default', command: 'rosetta audit' },
      { label: 'A specific template', command: 'rosetta audit --template react-vite' },
      { label: 'JSON for one IDE', command: 'rosetta audit --ide claude --json' },
    ],
    options: [
      { flag: '-t, --template <template>', description: 'Restrict to one template.' },
      { flag: '-i, --ide <ide>', description: 'Restrict to one IDE.' },
      { flag: '-s, --stack <stack>', description: 'Restrict to one stack.' },
      { flag: '--json', description: 'JSON output.' },
    ],
  },
  {
    id: 'sync-memory',
    name: 'sync-memory',
    group: 'health',
    summary: 'Rotate old daily logs and summarize progress into AUTO_MEMORY.md.',
    examples: [{ label: 'Default', command: 'rosetta sync-memory' }],
    options: [],
  },
  {
    id: 'use-profile',
    name: 'use-profile',
    group: 'health',
    summary: 'Switch to a Rosetta profile that bundles context, presets, and preferences.',
    examples: [{ label: 'Switch profile', command: 'rosetta use-profile senior-backend' }],
    options: [{ flag: '<name>', description: 'Profile name.' }],
  },
];

export function commandsByGroup(group: CommandGroup): CommandSpec[] {
  return COMMANDS.filter((c) => c.group === group);
}

export function commandById(id: string): CommandSpec | undefined {
  return COMMANDS.find((c) => c.id === id);
}
