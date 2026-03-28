#!/usr/bin/env node

/**
 * Rosetta CLI
 * A single source of truth for AI agent rules and skills.
 */

import { program } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { showBanner } from './lib/utils.js';
import { performSync } from './lib/ide-adapters.js';
import { watchMode, validateRepo, reportHealth, syncMemory } from './lib/validation.js';
import { scaffoldNew, rescaffold } from './lib/cli-helpers.js';
import { migrateExisting, migrateFromSource } from './lib/migration.js';
import { loadSkillsFromSources, createSkill, createSkillFromFile } from './lib/skills.js';
import { useProfile } from './lib/config.js';
import { detectRepoState, inferStarterSkills } from './lib/context.js';
import { addIde } from './lib/commands/add-ide.js';
import { translate } from './lib/commands/translate.js';
import { translateAll } from './lib/commands/translate-all.js';
import { ideate } from './lib/commands/ideate.js';
import { catalog } from './lib/commands/catalog.js';
import { skills } from './lib/commands/skills.js';
import { install } from './lib/commands/install.js';
import { uninstall } from './lib/commands/uninstall.js';
import { docs } from './lib/commands/docs.js';
import { syncYAMLCommand, validateConfigCommand } from './lib/commands/sync-yaml.js';
import { init } from './lib/commands/init.js';
import { doc } from './lib/commands/doc.js';

/**
 * Determine work area based on current directory.
 */
async function getWorkArea() {
  const fs = await import('fs-extra');
  const path = await import('path');

  // Check for indicators in directory name or structure
  const dirName = path.basename(process.cwd());

  if (dirName.includes('lib') || dirName.includes('src')) {
    return 'internal';
  } else if (dirName.includes('test') || dirName.includes('spec')) {
    return 'testing';
  } else if (dirName.includes('doc')) {
    return 'documentation';
  }

  return 'general';
}

/**
 * Main entry point.
 */
async function main() {
  // Suppress banner for ideate --json output
  const isIdeateJson = process.argv.includes('ideate') && process.argv.includes('--json');
  if (!isIdeateJson) {
    showBanner();
  }

  program
    .version('0.4.0')
    .description('AI agent configuration and skill management');

  // --- Core Commands ---

  // --- Legacy Sync (master-skill.md) ---

  program
    .command('sync')
    .description('Verify IDE wrappers or regenerate them from templates')
    .option('-r, --regenerate-wrappers', 'Regenerate IDE wrapper files from templates')
    .option('--dry-run', 'Show what would be changed without writing files')
    .option('--update-skills', 'Sync newly generated skills to IDE wrappers')
    .action(async (cmdObj) => {
      await performSync({
        interactive: false,
        regenerateWrappers: cmdObj.regenerateWrappers,
        dryRun: cmdObj.dryRun
      });
    });

  // --- YAML-First Commands ---

  program
    .command('sync-yaml')
    .description('Sync rosetta.yaml to IDE configurations (YAML-first architecture)')
    .option('--from <path>', 'Custom path to rosetta.yaml file')
    .option('--ides <ide1,ide2>', 'Comma-separated list of IDEs to sync (default: all supported)')
    .option('--dry-run', 'Show what would be changed without writing files')
    .option('--verbose', 'Detailed output')
    .addHelpText('after', `
Supported IDEs: claude, cursor, windsurf
(More IDEs will be added in future phases)

Examples:
  rosetta sync-yaml                       # Sync to all supported IDEs
  rosetta sync-yaml --ides claude,cursor  # Sync to specific IDEs
  rosetta sync-yaml --from custom.yaml    # Use a different YAML file
  rosetta sync-yaml --dry-run --verbose   # Preview changes with details
`)
    .action(async (options) => {
      const ides = options.ides ? options.ides.split(',').map(i => i.trim()) : null;
      await syncYAMLCommand({
        ides,
        from: options.from,
        dryRun: options.dryRun,
        verbose: options.verbose
      });
    });

  program
    .command('validate-config')
    .description('Validate rosetta.yaml schema and contents')
    .option('--file <path>', 'Custom path to rosetta.yaml file (default: auto-discover)')
    .action(async (options) => {
      await validateConfigCommand({
        file: options.file
      });
    });

  program
    .command('watch')
    .description('Watch .ai/master-skill.md and log status on change')
    .action(async () => {
      await watchMode();
    });

  program
    .command('scaffold')
    .description('Scaffold new agentic coding setup')
    .option('--skills-dir <path>', 'Path to local skills directory')
    .option('--skills-repo <url>', 'URL to git repo with skills')
    .option('--dry-run', 'Show what would be created without writing files')
    .option('--auto-ideate', 'Automatically run skill ideation after scaffolding')
    .option('--ideate-output <path>', 'Custom output path for ideation template (requires --auto-ideate)')
    .addHelpText('after', `
Examples:
  rosetta scaffold                    Interactive mode with prompts
  rosetta scaffold --auto-ideate       Scaffold + generate ideation template
  rosetta scaffold --dry-run            Preview what would be created
  rosetta scaffold --skills-dir ./skills Use local skills directory

The --auto-ideate flag automatically generates .ai/skill-ideation-template.md
after scaffolding completes. This template contains project context and
instructions for your IDE agent to help design custom skills.
`)
    .action(async (options) => {
      await scaffoldNew(options);
    });

  program
    .command('rescaffold <type>')
    .description('Selectively re-scaffold parts of Rosetta setup')
    .addHelpText('after', `
Types:
  memory     Only re-scaffold .ai/memory/* files if missing
  ides       Only re-scaffold IDE wrappers from templates
  all        Re-scaffold everything (except master-skill.md)
`)
    .option('--dry-run', 'Show what would be changed without writing files')
    .action(async (type, options) => {
      await rescaffold(type, options);
    });

  program
    .command('init')
    .description('Initialize new project with Rosetta configuration')
    .option('-y, --yes', 'Skip all prompts and use defaults')
    .option('--ide <ides...>', 'Specific IDEs to generate configs for (e.g., --ide claude cursor)')
    .option('--dry-run', 'Show what would be generated without writing files')
    .action(async (options) => {
      await init(options);
    });

  program
    .command('doc')
    .description('Generate CLAUDE.md documentation draft from project inference')
    .option('-o, --output <file>', 'Output file path (default: stdout)')
    .option('--json', 'Output inferred configuration as JSON')
    .option('--include-inferred', 'Show inferred configuration in output')
    .addHelpText('after', `
Examples:
  rosetta doc                      # Generate CLAUDE.md to stdout
  rosetta doc -o CLAUDE.md         # Write to CLAUDE.md file
  rosetta doc --json               # Output JSON configuration
  rosetta doc --include-inferred    # Show inferred config in output
`)
    .action(async (options) => {
      await doc({
        output: options.output,
        json: options.json,
        includeInferred: options.includeInferred
      });
    });

  // --- Migration Commands ---

  program
    .command('migrate')
    .description('Interactive migration wizard for existing repos')
    .option('--source <path>', 'Custom folder or file to migrate from (e.g. agentic-corder/)')
    .action(async (options) => {
      await migrateExisting(options);
    });

  program
    .command('migrate-from-cursor')
    .description('Convert .cursorrules into .ai/master-skill.md')
    .action(async () => {
      await migrateFromSource('.cursorrules');
    });

  program
    .command('migrate-from-claude')
    .description('Convert CLAUDE.md into .ai/ structure')
    .action(async () => {
      await migrateFromSource('CLAUDE.md');
    });

  // --- YAML-First Migration ---

  program
    .command('migrate-to-yaml')
    .description('Migrate .ai/master-skill.md to rosetta.yaml (YAML-first architecture)')
    .option('--dry-run', 'Preview migration without creating files')
    .option('--verbose', 'Detailed output')
    .action(async (options) => {
      const { migrateToYAMLCommand } = await import('./lib/commands/migrate-to-yaml.js');
      await migrateToYAMLCommand({
        dryRun: options.dryRun,
        verbose: options.verbose
      });
    });

  // --- New Commands ---

  program
    .command('add-ide [name]')
    .description('Add a new IDE to an existing Rosetta setup')
    .option('--dry-run', 'Show what would be created without writing files')
    .action(async (name, options) => {
      await addIde(name, options);
    });

  program
    .command('translate <file>')
    .description('Translate a configuration file between IDE formats')
    .option('--from <format>', 'Source format (e.g., cursor, claude, copilot)')
    .option('--to <format>', 'Target format (required)')
    .option('-o, --output <path>', 'Output file path')
    .option('--dry-run', 'Show what would be written without creating files')
    .action(async (file, options) => {
      await translate(file, options);
    });

  program
    .command('translate-all')
    .description('Bulk migrate all existing IDE configs to a target format')
    .option('--to <format>', 'Target format (required)')
    .option('--dry-run', 'Show what would be done without creating files')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (options) => {
      await translateAll(options);
    });

  program
    .command('install <git-url>')
    .description('Install a skill from a git repository')
    .option('-g, --global', 'Install globally to ~/.rosetta/skills instead of project local')
    .option('--force', 'Overwrite existing installation')
    .option('--dry-run', 'Show what would be done without making changes')
    .option('--ide <name>', 'Install directly to specific IDE skills directory (e.g., "Claude Code", "Cursor")')
    .option('--multi-ide', 'Install to .rosetta/skills for multi-IDE support')
    .action(async (gitUrl, options) => {
      await install(gitUrl, {
        global: options.global,
        force: options.force,
        dryRun: options.dryRun,
        ide: options.ide,
        multiIde: options.multiIde
      });
    });

  // --- Ideation Commands ---

  program
    .command('ideate')
    .description('Generate skill ideation template for use in IDE')
    .option('-a, --area <path>', 'Directory path to analyze (relative or absolute)')
    .option('--output <path>', 'Save suggestions to file instead of displaying')
    .option('--json', 'Output suggestions in JSON format')
    .option('--interactive', 'Interactive mode with selection prompts (default)')
    .option('--non-interactive', 'Skip all prompts, output all suggestions')
    .option('--dry-run', 'Show analysis results without generating skills')
    .option('--max-skills <number>', 'Maximum number of suggestions to generate (default: 5)')
    .action(async (cmdObj) => {
      await ideate(cmdObj);
    });

  // --- Documentation Commands ---

  program
    .command('docs')
    .description('Generate HTML documentation for installed skills with interactive visualization')
    .option('-o, --output <path>', 'Output file path (default: .rosetta/docs/skills.html)')
    .option('--ide <name>', 'Filter by specific IDE (auto-detected if omitted)')
    .option('--open', 'Open in browser after generation')
    .option('--quiet', 'Suppress output')
    .option('--dry-run', 'Preview generation without writing files')
    .option('--json', 'Output data as JSON instead of HTML')
    .action(async (options) => {
      await docs(options);
    });

  // --- Validation & Health ---

  program
    .command('validate')
    .description('Check .ai/ structure for completeness')
    .action(async () => {
      const score = await validateRepo();
      console.log(`\nRosetta Score: ${score}/100`);
      if (score === 100) {
        console.log(chalk.green('Your repo is 100% Rosetta-ready!'));
      } else if (score > 80) {
        console.log(chalk.blue('Your repo is mostly healthy, but has minor gaps.'));
      } else {
        console.log(chalk.yellow('Your repo needs some attention to be fully Rosetta-compliant.'));
        console.log(chalk.gray('Run "rosetta scaffold" or "rosetta rescaffold all" to fix.'));
      }
    });

  program
    .command('health')
    .description('Report "Rosetta Score" and repository health')
    .action(async () => {
      await reportHealth();
    });

  program
    .command('audit')
    .description('Alias for health')
    .action(async () => {
      await reportHealth();
    });

  program
    .command('sync-memory')
    .description('Rotate old logs and summarize progress to AUTO_MEMORY.md')
    .action(async () => {
      await syncMemory();
    });

  // --- Skill Commands ---

  program
    .command('new-skill <name>')
    .description('Create a new skill folder with SKILL.md and tests/prompts.md boilerplates')
    .option('--template <name>', 'Clone an existing skill template')
    .option('--skills-dir <path>', 'Path to local skills directory')
    .option('--skills-repo <url>', 'URL to git repo with skills')
    .option('--from-suggestion <id>', 'Create skill from a specific ideation suggestion')
    .action(async (name, options) => {
      if (options.template) {
        const skills = await loadSkillsFromSources(options);
        const tpl = skills.find(s => s.name === options.template);
        if (tpl) {
          await createSkillFromFile(name, tpl.fullPath);
        } else {
          console.log(chalk.red(`Template ${options.template} not found. Available:`));
          skills.forEach(s => console.log(`- ${s.name}`));
        }
      } else {
        await createSkill(name, { interactive: true });
      }
    });

  program
    .command('skills')
    .description('List all installed skills')
    .option('--format <type>', 'Output format: table or json', 'table')
    .option('--scope <scope>', 'Filter by scope: global, project, or all', 'all')
    .option('--ide <ide>', 'Filter by IDE (e.g., "Claude Code", "Cursor", or "multi-ide")', 'all')
    .action(async (options) => {
      await skills({
        format: options.format,
        scope: options.scope,
        ide: options.ide
      });
    });

  // --- Skill Management Commands ---

  program
    .command('skill uninstall')
    .description('Uninstall an installed skill')
    .argument('<name>', 'Skill name')
    .option('--global', 'Uninstall from global skills directory')
    .option('--purge', 'Delete skill files after uninstall')
    .option('--dry-run', 'Preview uninstall without removing')
    .action(async (name, options) => {
      await uninstall({
        name,
        scope: options.global ? 'global' : 'project',
        purge: options.purge || false,
        dryRun: options.dryRun || false
      });
    });

  // --- Profile Commands ---

  program
    .command('use-profile <name>')
    .description('Switch to a specific Rosetta profile (bundles context, presets, and preferences)')
    .action(async (name) => {
      await useProfile(name);
    });

  // --- Registry / Market Commands ---

  program
    .command('catalog')
    .description('List all skills in the catalog')
    .option('--json', 'Output raw JSON instead of table')
    .option('--domain <filter>', 'Show only skills in specific domain(s), comma-separated')
    .option('--limit <n>', 'Limit number of results', parseInt)
    .action(async (options) => {
      await catalog(options);
    });

  program.parse(process.argv);
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
