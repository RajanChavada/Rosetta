import { execFile } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import os from 'os';
import fs from 'fs-extra';
import chalk from 'chalk';
import { TreeLogger } from '../utils.js';
import { gitClone, gitAddRemote, gitCurrentCommit, isValidHttpsGitUrl } from '../git-ops.js';
import { loadManifest, saveManifest, addInstalledSkill } from '../skills-manifest.js';

const execFileAsync = promisify(execFile);

/**
 * Transforms GitHub URLs to extract the base repository URL.
 * Handles URLs like:
 * - https://github.com/user/repo/tree/main/skills/skill-name
 * - https://github.com/user/repo
 * - https://github.com/user/repo.git
 * @param {string} url - The original URL
 * @returns {Object} - { repoUrl: string, subdirectory: string | null }
 */
function transformGitHubUrl(url) {
  // Handle git URLs
  if (url.endsWith('.git')) {
    return { repoUrl: url, subdirectory: null };
  }

  // Special case for superpowers skills
  if (url.includes('github.com/superpowers') && url.includes('/tree/')) {
    const parts = url.split('/');
    // repo is superpowers/skills for all superpowers skills
    const repoUrl = 'https://github.com/superpowers/skills';
    // subdirectory is everything after tree/branch/
    const subdirectory = parts.slice(6).join('/');
    return { repoUrl, subdirectory };
  }

  // Handle GitHub URLs with /tree/ pattern
  const treeMatch = url.match(/https:\/\/github\.com\/([^\/]+\/[^\/]+)\/tree\/([^\/]+)\/(.+)?/);

  if (treeMatch) {
    const repoPath = treeMatch[1];
    const branch = treeMatch[2];
    const subPath = treeMatch[3];
    const repoUrl = `https://github.com/${repoPath}`;
    const subdirectory = subPath || null;

    return { repoUrl, subdirectory };
  }

  // Handle regular GitHub URLs (no /tree/)
  if (url.startsWith('https://github.com/') && !url.includes('/tree/')) {
    const parts = url.split('/');
    // Skip empty string from https:// and github.com
    const repoPath = parts.slice(3, 5).join('/');
    if (repoPath) {
      const repoUrl = `https://github.com/${repoPath}`;
      return { repoUrl, subdirectory: null };
    }
  }

  // For non-GitHub URLs, assume it's a full repo URL
  return { repoUrl: url, subdirectory: null };
}

/**
 * Clones repository and extracts specific subdirectory if needed.
 * @param {string} repoUrl - Repository URL
 * @param {string} dest - Destination directory
 * @param {string|null} subdirectory - Subdirectory to extract (optional)
 * @param {Object} options - Clone options
 * @returns {Promise<string>}
 */
async function cloneWithSubdirectory(repoUrl, dest, subdirectory, options = {}) {
  if (options.dryRun) {
    const message = subdirectory
      ? `[Dry-run] Would clone ${repoUrl} and extract ${subdirectory}`
      : `[Dry-run] Would clone ${repoUrl}`;
    console.log(chalk.yellow(message));
    return message;
  }

  // If no subdirectory, use regular clone
  if (!subdirectory) {
    await gitClone(repoUrl, dest, options);
    return;
  }

  // Clone directly to dest with sparse checkout
  // This creates a git repo at dest that contains only the subdirectory
  try {
    // Clone with --no-checkout so we can configure sparse checkout first
    await execFileAsync('git', ['clone', '--no-checkout', repoUrl, dest]);

    // Configure sparse checkout
    await execFileAsync('git', ['config', 'core.sparseCheckout', 'true'], { cwd: dest });

    // Create sparse-checkout file with the subdirectory path
    const sparseCheckoutFile = path.join(dest, '.git', 'info', 'sparse-checkout');
    await fs.ensureDir(path.dirname(sparseCheckoutFile));
    await fs.writeFile(sparseCheckoutFile, subdirectory + '\n');

    // Checkout - this will only checkout files in the subdirectory
    await execFileAsync('git', ['checkout', 'HEAD'], { cwd: dest });

    // Now the subdirectory's contents are at dest, but nested in a folder named 'subdirectory'
    // We need to move the contents up to the destination root
    const skillDir = path.join(dest, subdirectory);
    const skillFile = path.join(skillDir, 'SKILL.md');

    if (!await fs.pathExists(skillFile)) {
      throw new Error(`SKILL.md not found in subdirectory: ${subdirectory}`);
    }

    // Move all items from subdirectory to dest root
    const items = await fs.readdir(skillDir);
    for (const item of items) {
      const src = path.join(skillDir, item);
      const dst = path.join(dest, item);
      await fs.move(src, dst);
    }

    // Remove the now-empty subdirectory
    await fs.remove(skillDir);

  } catch (err) {
    // Cleanup on error
    if (await fs.pathExists(dest)) {
      await fs.remove(dest);
    }
    throw err;
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
 * Determines the skill destination path.
 */
function getSkillDestPath(skillName, isGlobal, dryRun = false) {
  const baseDir = isGlobal
    ? path.join(os.homedir(), '.rosetta', 'skills')
    : path.join(process.cwd(), '.rosetta', 'skills');

  return path.join(baseDir, skillName);
}

/**
 * Command: install <git-url>
 * Installs a skill from a git repository.
 */
export async function install(gitUrl, options = {}) {
  const { global: isGlobal = false, force = false, dryRun = false } = options;

  const logger = new TreeLogger('Installing skill from git');

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

      const destPath = getSkillDestPath(name, isGlobal, dryRun);

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
      const manifestPath = isGlobal
        ? path.join(os.homedir(), '.rosetta', 'skills', 'manifest.json')
        : path.join(process.cwd(), '.rosetta', 'skills', 'manifest.json');

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
          ? path.join('.rosetta', 'skills', name)
          : path.join('.rosetta', 'skills', name),
        tag: metadata.version || metadata.tag || null,
        description,
        instanceId: generateInstanceId(),
        installedAt: new Date().toISOString()
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
