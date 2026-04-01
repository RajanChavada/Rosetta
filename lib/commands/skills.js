import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { loadManifest, getAllSkills } from '../skills-manifest.js';
import { TreeLogger } from '../utils.js';
import { getAllManifestPaths } from '../ide-selection.js';

/**
 * Formats a date string to relative time (e.g., "2 days ago")
 */
function formatRelativeTime(dateString) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffMonth / 12);

  if (diffYear > 0) return `${diffYear}y ago`;
  if (diffMonth > 0) return `${diffMonth}mo ago`;
  if (diffDay > 0) return `${diffDay}d ago`;
  if (diffHour > 0) return `${diffHour}h ago`;
  if (diffMin > 0) return `${diffMin}m ago`;
  return 'just now';
}

/**
 * Shortens a Git commit hash to 8 characters
 */
function shortenCommit(commit) {
  if (!commit) return '-';
  return commit.substring(0, 8);
}

/**
 * Extracts a shortened source identifier from a URL or path
 */
function shortenSource(source) {
  if (!source) return '-';

  // Handle GitHub URLs
  const githubMatch = source.match(/github\.com\/([^\/]+\/[^\/]+)/);
  if (githubMatch) {
    return `github:${githubMatch[1]}`;
  }

  // Handle generic URLs - extract hostname + path
  try {
    const url = new URL(source);
    const pathParts = url.pathname.split('/').filter(Boolean);
    const repo = pathParts.slice(0, 2).join('/');
    return `${url.hostname}${repo ? '/' + repo : ''}`;
  } catch {
    // Not a URL, treat as file path
    const parts = source.split(/[/\\]/);
    const lastPart = parts[parts.length - 1];
    // If it looks like a git URL with .git
    return lastPart.endsWith('.git') ? lastPart.slice(0, -4) : lastPart;
  }
}

/**
 * Command: skills
 * List all installed skills from the manifest.
 */
export async function skills(options = {}) {
  const {
    format = 'table', // 'table' or 'json'
    scope = 'all',    // 'global', 'project', 'all'
    ide = 'all',      // 'all', 'multi-ide', or specific IDE label
    dryRun = false    // Accept for compatibility but has no effect
  } = options;

  // Use silent logger when JSON output is requested
  const logger = format === 'json' ? {
    logStep: () => {},
    logStep: () => {}
  } : new TreeLogger('Loading installed skills');

  try {
    logger.logStep('Loading manifests...');

    // Collect skills from all available manifests
    let allSkills = [];

    // Determine which scopes to check based on scope filter
    const checkGlobal = scope === 'all' || scope === 'global';
    const checkProject = scope === 'all' || scope === 'project';

    // Load global manifests if needed
    if (checkGlobal) {
      const globalManifestPaths = await getAllManifestPaths(true);
      for (const manifestPath of globalManifestPaths) {
        try {
          const manifest = await loadManifest(manifestPath);
          const skills = getAllSkills(manifest);
          allSkills.push(...skills);
        } catch (err) {
          // Skip invalid manifests
          if (format !== 'json') {
            console.log(chalk.gray(`Skipping invalid manifest: ${manifestPath}`));
          }
        }
      }
    }

    // Load project manifests if needed
    if (checkProject) {
      const projectManifestPaths = await getAllManifestPaths(false);
      for (const manifestPath of projectManifestPaths) {
        try {
          const manifest = await loadManifest(manifestPath);
          const skills = getAllSkills(manifest);
          allSkills.push(...skills);
        } catch (err) {
          // Skip invalid manifests
          if (format !== 'json') {
            console.log(chalk.gray(`Skipping invalid manifest: ${manifestPath}`));
          }
        }
      }
    }

    // If no skills found and no IDE-specific manifests exist, try legacy path
    if (allSkills.length === 0) {
      const legacyManifestPath = '.rosetta/skills/manifest.json';
      if (await fs.pathExists(legacyManifestPath)) {
        const manifest = await loadManifest(legacyManifestPath);
        allSkills = getAllSkills(manifest);
      }
    }

    if (allSkills.length === 0) {
      if (format !== 'json') {
        console.log(chalk.blue.bold('📦 Installed Skills: 0\n'));
        console.log(chalk.yellow('No skills are currently installed.'));
        console.log(chalk.gray('Use `rosetta install` to add skills from the catalog.\n'));
      } else {
        process.stdout.write(JSON.stringify({ count: 0, skills: [] }, null, 2) + '\n');
      }
      return;
    }

    // Get all skills and apply filters
    let skills = allSkills;

    // Apply scope filter
    if (scope !== 'all') {
      skills = skills.filter(s => s.scope === scope);
    }

    // Apply IDE filter
    if (ide !== 'all') {
      skills = skills.filter(s => s.ide === ide || (ide === 'multi-ide' && s.ide === 'multi-ide'));
    }

    // Sort by installedAt descending (newest first)
    skills.sort((a, b) => {
      const dateA = new Date(a.installedAt || 0);
      const dateB = new Date(b.installedAt || 0);
      return dateB - dateA;
    });

    // Output results
    if (format === 'json') {
      console.log(JSON.stringify({
        count: skills.length,
        scope: scope === 'all' ? undefined : scope,
        skills: skills
      }, null, 2));
      return;
    }

    // Table format
    console.log('');
    console.log(chalk.blue.bold(`📦 Installed Skills: ${skills.length}\n`));

    if (skills.length === 0) {
      console.log(chalk.yellow('No skills installed'));
      console.log(chalk.gray('Use `rosetta install` to add skills from the catalog.\n'));
      return;
    }

    // Calculate column widths
    const nameWidth = Math.max(25, ...skills.map(s => s.name.length));
    const sourceWidth = Math.max(20, ...skills.map(s => Math.min(shortenSource(s.source).length, 30)));
    const tagWidth = 12;
    const scopeWidth = 10;
    const ideWidth = 18;
    const timeWidth = 12;
    const commitWidth = 10;

    // Print table header
    const totalWidth = nameWidth + sourceWidth + tagWidth + scopeWidth + ideWidth + timeWidth + commitWidth + 8;
    const header = `┝${'─'.repeat(nameWidth + 2)}┬${'─'.repeat(sourceWidth + 2)}┬${'─'.repeat(tagWidth + 2)}┬${'─'.repeat(scopeWidth + 2)}┬${'─'.repeat(ideWidth + 2)}┬${'─'.repeat(timeWidth + 2)}┬${'─'.repeat(commitWidth + 2)}┑`;
    console.log(chalk.gray(header));
    console.log(chalk.gray(`│ ${chalk.bold('Name').padEnd(nameWidth)} │ ${chalk.bold('Source').padEnd(sourceWidth)} │ ${chalk.bold('Tag').padEnd(tagWidth)} │ ${chalk.bold('Scope').padEnd(scopeWidth)} │ ${chalk.bold('IDE').padEnd(ideWidth)} │ ${chalk.bold('Installed').padEnd(timeWidth)} │ ${chalk.bold('Commit').padEnd(commitWidth)} │`));
    console.log(chalk.gray(`├${'─'.repeat(nameWidth + 2)}┼${'─'.repeat(sourceWidth + 2)}┼${'─'.repeat(tagWidth + 2)}┼${'─'.repeat(scopeWidth + 2)}┼${'─'.repeat(ideWidth + 2)}┼${'─'.repeat(timeWidth + 2)}┼${'─'.repeat(commitWidth + 2)}┤`));

    // Print skills
    skills.forEach((skill, index) => {
      const nameCell = chalk.cyan(skill.name.padEnd(nameWidth));
      const sourceCell = chalk.white(shortenSource(skill.source).padEnd(sourceWidth));
      const tagValue = skill.tag || skill.commit ? (skill.tag || 'latest') : '-';
      const tagCell = chalk.yellow(tagValue.padEnd(tagWidth));
      const scopeCell = chalk.green(skill.scope.padEnd(scopeWidth));
      const ideValue = skill.ide || 'multi-ide';
      const ideCell = chalk.magenta(ideValue.padEnd(ideWidth));
      const timeCell = chalk.gray(formatRelativeTime(skill.installedAt).padEnd(timeWidth));
      const commitCell = chalk.dim(shortenCommit(skill.commit).padEnd(commitWidth));

      const line = `│ ${nameCell} │ ${sourceCell} │ ${tagCell} │ ${scopeCell} │ ${ideCell} │ ${timeCell} │ ${commitCell} │`;

      // Last row gets different border
      if (index === skills.length - 1) {
        const footer = `└${'─'.repeat(nameWidth + 2)}┴${'─'.repeat(sourceWidth + 2)}┴${'─'.repeat(tagWidth + 2)}┴${'─'.repeat(scopeWidth + 2)}┴${'─'.repeat(ideWidth + 2)}┴${'─'.repeat(timeWidth + 2)}┴${'─'.repeat(commitWidth + 2)}┘`;
        console.log(line);
        console.log(chalk.gray(footer));
      } else {
        console.log(line);
        console.log(chalk.gray(`├${'─'.repeat(nameWidth + 2)}┼${'─'.repeat(sourceWidth + 2)}┼${'─'.repeat(tagWidth + 2)}┼${'─'.repeat(scopeWidth + 2)}┼${'─'.repeat(ideWidth + 2)}┼${'─'.repeat(timeWidth + 2)}┼${'─'.repeat(commitWidth + 2)}┤`));
      }
    });

    console.log('');

    // Show filter info if applied
    if (format === 'table') {
      const filters = [];
      if (scope !== 'all') filters.push(`scope: ${scope}`);
      if (ide !== 'all') filters.push(`IDE: ${ide}`);
      if (filters.length > 0) {
        console.log(chalk.gray(`Filtered by: ${filters.join(', ')}`));
        console.log('');
      }
    }

  } catch (err) {
    console.error(chalk.red(`Unexpected error: ${err.message}`));
    console.error(err.stack);
    process.exit(1);
  }
}
