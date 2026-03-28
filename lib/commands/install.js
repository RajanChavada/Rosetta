import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TreeLogger } from '../utils.js';
import { gitClone, gitAddRemote, gitCurrentCommit, isValidHttpsGitUrl } from '../git-ops.js';
import { loadManifest, saveManifest, addInstalledSkill } from '../skills-manifest.js';
import {
  selectPrimaryIde,
  getIdeSkillsDir,
  getIdeManifestPath,
  ensureIdeSkillsDir,
  validateIdeLabel
} from '../ide-selection.js';

const execFileAsync = promisify(execFile);

/**
 * Transforms GitHub URLs to extract the base repository URL.
 * Handles URLs like:
 * - https://github.com/user/repo/tree/branch/path/to/skill
 * - https://github.com/user/repo
 * - https://github.com/user/repo.git
 * @param {string} url - The original URL
 * @returns {Object} - { repoUrl: string, subdirectory: string | null }
 */
function transformGitHubUrl(url) {
  // Handle git URLs (with or without .git)
  if (url.endsWith('.git')) {
    return { repoUrl: url, subdirectory: null };
  }

  // Handle GitHub URLs with /tree/ pattern (web interface URL pointing to subdirectory)
  // Example: https://github.com/owner/repo/tree/branch/path/to/skill
  const treeMatch = url.match(/https:\/\/github\.com\/([^\/]+\/[^\/]+)\/tree\/([^\/]+)\/(.+)/);

  if (treeMatch) {
    const repoPath = treeMatch[1];
    const branch = treeMatch[2];
    const subPath = treeMatch[3];
    const repoUrl = `https://github.com/${repoPath}`;
    const subdirectory = subPath;

    return { repoUrl, subdirectory };
  }

  // Handle regular GitHub URLs (no /tree/)
  if (url.startsWith('https://github.com/')) {
    const parts = url.split('/');
    // Expect at least 5 parts: ['https:', '', 'github.com', 'owner', 'repo', ...]
    if (parts.length >= 5) {
      const repoPath = parts.slice(3, 5).join('/');
      const repoUrl = `https://github.com/${repoPath}`;
      return { repoUrl, subdirectory: null };
    }
  }

  // For non-GitHub URLs, assume it's a full git URL (already suitable for cloning)
  return { repoUrl: url, subdirectory: null };
}

/**
 * Clones repository and extracts specific subdirectory if needed.
 * @param {string} repoUrl - Repository URL
 * @param {string} dest - Destination directory
 * @param {string|null} subdirectory - Subdirectory to extract (optional)
 * @param {Object} options - Clone options
 * @returns {Promise<void>}
 */
async function cloneWithSubdirectory(repoUrl, dest, subdirectory, options = {}) {
  if (options.dryRun) {
    const message = subdirectory
      ? `[Dry-run] Would clone ${repoUrl} and extract ${subdirectory}`
      : `[Dry-run] Would clone ${repoUrl}`;
    console.log(chalk.yellow(message));
    return;
  }

  // If no subdirectory, use regular clone
  if (!subdirectory) {
    await gitClone(repoUrl, dest, options);
    return;
  }

  // Approach: Clone full repo to temp, copy subdirectory contents to dest,
  // then init a new git repo in dest with those files.
  const tempDir = path.join(os.tmpdir(), `rosetta-clone-${Date.now()}-${generateInstanceId()}`);

  try {
    // Clone the full repository to temp
    await gitClone(repoUrl, tempDir, options);

    // Determine the source directory (subdirectory within temp)
    const srcDir = path.join(tempDir, subdirectory);
    const skillFile = path.join(srcDir, 'SKILL.md');

    if (!await fs.pathExists(skillFile)) {
      throw new Error(`SKILL.md not found in subdirectory: ${subdirectory}`);
    }

    // Copy subdirectory contents to destination
    await fs.ensureDir(dest);
    const items = await fs.readdir(srcDir);
    for (const item of items) {
      const src = path.join(srcDir, item);
      const dst = path.join(dest, item);
      await fs.copy(src, dst);
    }

    // Initialize a new git repository in dest
    await execFileAsync('git', ['init'], { cwd: dest });
    await execFileAsync('git', ['add', '.'], { cwd: dest });

    // Commit with message referencing source
    const commitMsg = `Install skill from ${repoUrl}\n\nSubdirectory: ${subdirectory}`;
    await execFileAsync('git', ['commit', '-m', commitMsg], { cwd: dest });

  } finally {
    // Cleanup temp directory
    if (await fs.pathExists(tempDir)) {
      await fs.remove(tempDir);
    }
  }
}

/**
 * Generates a unique instance ID.
 */
function generateInstanceId() {
  return Math.random().toString(36).substring(2, 11) +
         Math.random().toString(36).substring(2, 11);
}

/**
 * Validates skill name: lowercase alphanumeric and hyphens only.
 */
function validateSkillName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    return { valid: false, error: 'Name must be a non-empty string' };
  }

  const regex = /^[a-z0-9-]+$/;
  if (!regex.test(name)) {
    return {
      valid: false,
      error: `Invalid name "${name}". Must contain only lowercase letters, numbers, and hyphens.`
    };
  }

  return { valid: true };
}

/**
 * Parses YAML frontmatter from SKILL.md.
 * Expects format: ---\nname: ...\ndescription: ...\n---
 */
async function parseSkillFrontmatter(skillFilePath) {
  const content = await fs.readFile(skillFilePath, 'utf8');

  const frontmatterRegex = /^---\n([\s\S]*?)\n---/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    throw new Error('SKILL.md missing YAML frontmatter');
  }

  const frontmatterStr = match[1];
  const metadata = {};

  for (const line of frontmatterStr.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex === -1) continue;

    const key = line.substring(0, colonIndex).trim();
    const value = line.substring(colonIndex + 1).trim();

    if (key && value) {
      metadata[key] = value;
    }
  }

  return metadata;
}

/**
 * Determines the skill destination path based on IDE selection.
 * @param {string} skillName - Name of the skill
 * @param {string|null} ideLabel - IDE label or null for multi-ide
 * @param {boolean} isGlobal - Whether this is a global installation
 * @returns {string} - Full path to the skill destination
 */
function getSkillDestPath(skillName, ideLabel, isGlobal = false) {
  // If IDE specified, use IDE-specific skills directory
  if (ideLabel && ideLabel !== 'multi-ide') {
    const validation = validateIdeLabel(ideLabel);
    if (!validation.valid) {
      throw new Error(validation.error);
    }
    const skillsDir = getIdeSkillsDir(ideLabel, isGlobal);
    return path.join(skillsDir, skillName);
  }

  // Fallback to .rosetta/skills for multi-ide or legacy support
  const baseDir = isGlobal
    ? path.join(os.homedir(), '.rosetta', 'skills')
    : path.join(process.cwd(), '.rosetta', 'skills');
  return path.join(baseDir, skillName);
}

/**
 * Gets the base path for IDE skills directory.
 * @param {string|null} ideLabel - IDE label or null for multi-ide
 * @param {boolean} isGlobal - Whether this is a global installation
 * @returns {string} - Base path for skills (relative or absolute)
 */
function getIdeBasePath(ideLabel, isGlobal = false) {
  if (ideLabel && ideLabel !== 'multi-ide') {
    const target = getIdeSkillsDir(ideLabel, isGlobal);
    return isGlobal ? path.join(os.homedir(), ideLabel) : target;
  }
  return '.rosetta/skills';
}

/**
 * Command: install <git-url>
 * Installs a skill from a git repository.
 */
export async function install(gitUrl, options = {}) {
  const {
    global: isGlobal = false,
    force = false,
    dryRun = false,
    ide: cliIde,
    multiIde = false
  } = options;

  const logger = new TreeLogger('Installing skill from git');

  // Determine IDE selection
  let selectedIde = cliIde;

  // If IDE not specified via CLI and not explicitly multi-ide, prompt for selection
  if (!selectedIde && !multiIde) {
    logger.logStep('Detecting configured IDEs...');
    selectedIde = await selectPrimaryIde({ silent: false });

    if (selectedIde) {
      logger.logStep(`Selected IDE: ${selectedIde}`);
    } else {
      logger.logStep('Multi-IDE mode selected (skills will install to .rosetta/skills)');
    }
  } else if (multiIde) {
    selectedIde = null; // Explicitly set to null for multi-ide
    logger.logStep('Multi-IDE mode enabled (skills will install to .rosetta/skills)');
  } else if (selectedIde) {
    logger.logStep(`Using specified IDE: ${selectedIde}`);
  }

  try {
    logger.logStep('Transforming URL...');
    const { repoUrl, subdirectory } = transformGitHubUrl(gitUrl);

    if (subdirectory) {
      logger.logStep(`Detected skill in subdirectory: ${subdirectory}`, '!');
    }

    logger.logStep('Validating git URL...');

    if (!isValidHttpsGitUrl(repoUrl) && !repoUrl.startsWith('file://')) {
      throw new Error('Invalid git URL. Must start with https:// or file://');
    }

    logger.logStep('Creating temporary clone directory...');

    const tempDir = path.join(os.tmpdir(), `rosetta-install-${Date.now()}-${generateInstanceId()}`);

    try {
      logger.logStep(`Cloning repository from ${repoUrl}...`);
      await cloneWithSubdirectory(repoUrl, tempDir, subdirectory, { dryRun });

      logger.logStep('Checking for SKILL.md...');

      const skillFilePath = path.join(tempDir, 'SKILL.md');
      const skillFileExists = await fs.pathExists(skillFilePath);

      if (!skillFileExists) {
        throw new Error('SKILL.md not found in repository root' + (subdirectory ? ` or subdirectory: ${subdirectory}` : ''));
      }

      logger.logStep('Parsing SKILL.md frontmatter...');
      const metadata = await parseSkillFrontmatter(skillFilePath);

      const { name, description } = metadata;

      if (!name || !description) {
        throw new Error('SKILL.md must contain "name" and "description" in frontmatter');
      }

      logger.logStep(`Validating skill name: "${name}"...`);
      const nameValidation = validateSkillName(name);
      if (!nameValidation.valid) {
        throw new Error(nameValidation.error);
      }

      const destPath = getSkillDestPath(name, selectedIde, isGlobal);

      // Ensure the skills directory exists
      await ensureIdeSkillsDir(selectedIde, isGlobal, { dryRun });

      logger.logStep(`Destination: ${destPath}`);

      if (await fs.pathExists(destPath)) {
        if (!force) {
          throw new Error(`Skill "${name}" is already installed at ${destPath}. Use --force to overwrite.`);
        }
        logger.logStep('Removing existing installation (--force)...', '!');
        if (!dryRun) {
          await fs.remove(destPath);
        }
      }

      if (!dryRun) {
        logger.logStep('Moving cloned repository to destination...');
        await fs.move(tempDir, destPath);
      } else {
        logger.logStep(`[Dry-run] Would move ${tempDir} to ${destPath}`);
      }

      logger.logStep('Adding upstream remote...');
      await gitAddRemote(destPath, 'upstream', gitUrl, { dryRun });

      logger.logStep('Recording in manifest...');
      const manifestPath = getIdeManifestPath(selectedIde, isGlobal);

      let manifest = await loadManifest(manifestPath);
      const commit = await gitCurrentCommit(destPath, { dryRun });

      // If force is true, remove any existing entry for this skill name to allow overwrite
      if (force) {
        const existingCount = manifest.installed.filter(s => s.name.toLowerCase() === name.toLowerCase()).length;
        if (existingCount > 0) {
          manifest = {
            ...manifest,
            installed: manifest.installed.filter(s => s.name.toLowerCase() !== name.toLowerCase())
          };
        }
      }

      const skillData = {
        name,
        source: gitUrl,
        commit,
        scope: isGlobal ? 'global' : 'project',
        path: isGlobal
          ? path.join(getIdeBasePath(selectedIde, true), name)
          : path.join(getIdeBasePath(selectedIde, false), name),
        tag: metadata.version || metadata.tag || null,
        description,
        instanceId: generateInstanceId(),
        installedAt: new Date().toISOString(),
        ide: selectedIde || 'multi-ide' // Track which IDE this belongs to
      };

      const updatedManifest = await addInstalledSkill(skillData, manifest);

      if (!dryRun) {
        await saveManifest(updatedManifest, manifestPath);
      } else {
        logger.logStep(`[Dry-run] Would save manifest to ${manifestPath}`);
      }

      logger.logStep('Installation complete!', 'OK', true);

      console.log('');
      console.log(chalk.green(`Successfully installed skill: ${chalk.bold(name)}`));
      console.log(chalk.gray(`  Source: ${gitUrl}`));
      console.log(chalk.gray(`  Location: ${destPath}`));
      console.log(chalk.gray(`  Scope: ${isGlobal ? 'global' : 'project'}`));
      console.log('');

    } catch (cloneErr) {
      // Cleanup temp directory if it exists (best effort)
      try {
        if (await fs.pathExists(tempDir)) {
          await fs.remove(tempDir);
        }
      } catch (cleanupErr) {
        // Ignore cleanup errors
      }
      throw cloneErr;
    }

  } catch (err) {
    throw err;
  }
}
