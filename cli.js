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
import { RegistryManager } from './lib/registry.js';
import { addIde } from './lib/commands/add-ide.js';
import { translate } from './lib/commands/translate.js';
import { translateAll } from './lib/commands/translate-all.js';
import { ideate } from './lib/commands/ideate.js';
import { loadPlan, displayPlan, editPlan, loadTodo, displayTodo, editTodo, compactSession } from './lib/session-management.js';
import { loadSkill, loadSkillsByCategory, loadAllSkills, displaySkillSummary, getContextEnhancement } from './lib/claude-code-skills.js';
import { executeSubagent, parseSubagentOutput, SUBAGENTS } from './lib/subagents.js';

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
  showBanner();
  program
    .version('0.2.0')
    .description('Sync AI agent rule files across IDEs');

  // --- Core Commands ---

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
    .option('--use-ai', 'Use AI analysis to detect project type and stack (requires API key)')
    .option('--provider <name>', 'AI provider: anthropic or openai (default: anthropic)')
    .option('--api-key <key>', 'API key for AI analysis')
    .option('--auto-ideate', 'Automatically run skill ideation after scaffolding')
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

  // --- Ideation Commands ---

  program
    .command('ideate [options]')
    .description('Analyze codebase and generate personalized skill suggestions')
    .option('-a, --area <path>', 'Directory path to analyze (relative or absolute)')
    .option('--deep', 'Perform deep analysis (scans more files, slower)')
    .option('--provider <name>', 'AI provider for suggestions: anthropic, openai, or local (default: local)')
    .option('--api-key <key>', 'API key for cloud AI provider (skipped if in config)')
    .option('--output <path>', 'Save suggestions to file instead of displaying')
    .option('--json', 'Output suggestions in JSON format')
    .option('--interactive', 'Interactive mode with selection prompts (default)')
    .option('--non-interactive', 'Skip all prompts, output all suggestions')
    .option('--dry-run', 'Show analysis results without generating skills')
    .option('--max-skills <number>', 'Maximum number of suggestions to generate (default: 5)')
    .action(async (cmdObj) => {
      await ideate(cmdObj);
    });

  // --- Validation & Health ---

  program
    .command('validate')
    .description('Check .ai/ structure for completeness')
    .action(async () => {
      const score = await validateRepo();
      console.log(`\nRosetta Score: ${score}/100`);
      if (score === 100) {
        console.log(chalk.green('Your repo is 100% Rosetta-ready! 🚀'));
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
    .description('List all available skills')
    .option('--category <name>', 'Filter by category (frontend, backend, testing)')
    .action(async (options) => {
      let skills;
      if (options.category) {
        const content = await loadSkill(`${options.category}-context`);
        skills = content ? [{ name: options.category, content }] : [];
      } else {
        skills = await loadAllSkills();
      }

      if (Object.keys(skills).length > 0) {
        console.log(chalk.blue.bold('\n📚 Available Skills\n'));
        for (const [name, content] of Object.entries(skills)) {
          console.log(chalk.cyan(`  ${name}`));
          // Extract first line as description
          const firstLine = content.split('\n')[0];
          if (firstLine) {
            const desc = firstLine.replace(/^[#\*]\s+/, '').trim();
            if (desc) {
              console.log(chalk.gray(`    ${desc}`));
            }
          }
        }
      } else {
        console.log(chalk.yellow('No skills available.'));
      }
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
    .command('install-preset <name>')
    .description('Install a preset from the registry into .ai/master-skill.md')
    .action(async (name) => {
      try {
        await RegistryManager.installPreset(name);
      } catch (err) {
        console.error(chalk.red('Error:'), err.message);
      }
    });

  program
    .command('install-skill <name>')
    .description('Install a skill from the registry into skills/')
    .action(async (name) => {
      try {
        await RegistryManager.installSkill(name);
      } catch (err) {
        console.error(chalk.red('Error:'), err.message);
      }
    });

  program
    .command('search <type>')
    .description('Search for presets or skills in the registry')
    .option('--domain <domain>', 'Filter by domain (e.g. financial, devops)')
    .action(async (type, cmdObj) => {
      if (!['presets', 'skills'].includes(type)) {
        console.error(chalk.red('Error:'), 'Type must be either "presets" or "skills"');
        return;
      }
      try {
        const results = await RegistryManager.search(type, cmdObj.domain);
        if (results.length === 0) {
          console.log(chalk.yellow(`No ${type} found${cmdObj.domain ? ` for domain "${cmdObj.domain}"` : ''}.`));
          return;
        }

        console.log(chalk.bold(`\nAvailable ${type}${cmdObj.domain ? ` in domain "${cmdObj.domain}"` : ''}:`));
        results.forEach(item => {
          console.log(`- ${chalk.cyan(item.name)}: ${item.description} ${chalk.gray(`(${item.domain})`)}`);
        });
        console.log('');
      } catch (err) {
        console.error(chalk.red('Error:'), err.message);
      }
    });

  // --- Session Management Commands ---

  program
    .command('plan')
    .description('Manage development plan and session state')
    .action(async () => {
      const plan = await loadPlan();
      if (plan) {
        displayPlan(plan);
      }
    });

  program
    .command('edit-plan')
    .description('Edit current development plan')
    .action(async () => {
      await editPlan();
    });

  program
    .command('todo')
    .description('Manage TODO list')
    .action(async () => {
      const todos = await loadTodo();
      if (todos.length > 0) {
        displayTodo(todos);
      }
    });

  program
    .command('edit-todo')
    .description('Edit TODO list')
    .action(async () => {
      await editTodo();
    });

  program
    .command('status')
    .description('Show current session state (plan and TODO)')
    .action(async () => {
      const plan = await loadPlan();
      const todos = await loadTodo();

      console.log(chalk.blue.bold('\n📋 Session State\n'));

      if (plan) {
        console.log(chalk.cyan('\nPlan:'));
        console.log(chalk.gray(`  Goals: ${plan.goals.filter(g => g.checked).length}/${plan.goals.length}`));
        console.log(chalk.gray(`  Active Tasks: ${plan.activeTasks.filter(t => t.checked).length}/${plan.activeTasks.length}`));
        console.log(chalk.gray(`  Decisions: ${plan.decisions.length}`));
      }

      if (todos.length > 0) {
        const completed = todos.filter(t => t.checked).length;
        const total = todos.length;
        console.log(chalk.cyan('\nTODO:'));
        console.log(chalk.gray(`  Progress: ${completed}/${total} completed`));
      } else {
        console.log(chalk.gray('\nTODO: No items'));
      }
    });

  program
    .command('skill <name>')
    .description('Load a skill for focused context')
    .action(async (name) => {
      const content = await loadSkill(name);
      if (content) {
        console.log(chalk.blue.bold(`\n📚 Skill: ${name}\n`));
        console.log(content);
      }
    });

  program
    .command('compact')
    .description('Compact session into PLAN.md (run when context at 60-70%)')
    .action(async () => {
      const workArea = await getWorkArea();
      await compactSession(workArea);
    });

  // --- Subagent Commands ---

  program
    .command('agent <name> [args...]')
    .description('Execute a subagent for exploration or analysis')
    .option('--area <name>', 'Work area to focus (default: all)')
    .action(async (name, options) => {
      const context = {
        baseDir: process.cwd(),
        workArea: options.area || 'all'
      };

      console.log(chalk.blue(`🤖 Running ${name} subagent...`));

      const result = await executeSubagent(name, context.args, context);

      if (result && result.success) {
        const parsed = parseSubagentOutput(result.output, name);

        console.log(chalk.blue.bold('\n📊 Results\n'));

        if (parsed.files && parsed.files.length > 0) {
          console.log(chalk.cyan('Files Found:'));
          for (const file of parsed.files) {
            console.log(chalk.gray(`  ${file.path}: ${file.purpose}`));
          }
        }

        if (parsed.patterns && parsed.patterns.length > 0) {
          console.log(chalk.cyan('\nKey Patterns:'));
          for (const pattern of parsed.patterns) {
            console.log(chalk.gray(`  - ${pattern}`));
          }
        }

        if (parsed.findings && parsed.findings.length > 0) {
          console.log(chalk.cyan('\nFindings:'));
          for (const finding of parsed.findings) {
            const type = finding.type === 'vulnerability' ? chalk.red('🔴') : chalk.yellow('⚠️');
            console.log(`  ${type} ${finding.package || finding.file}`);
            if (finding.vulnerability) {
              console.log(chalk.gray(`    ${finding.vulnerability}`));
            } else if (finding.issue) {
              console.log(chalk.gray(`    ${finding.issue}`));
            }
          }
        }
      }
    });

  program
    .command('agents')
    .description('List available subagents')
    .action(async () => {
      console.log(chalk.blue.bold('\n🤖 Available Subagents\n'));
      for (const [key, agent] of Object.entries(SUBAGENTS)) {
        const status = chalk.gray('(configured)');
        console.log(`  ${chalk.cyan(agent.name)}: ${agent.description} ${status}`);
      }
    });

  program.parse(process.argv);
}

main().catch(err => {
  console.error(chalk.red('Error:'), err.message);
  process.exit(1);
});
