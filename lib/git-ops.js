import { execFile } from 'child_process';
import { promisify } from 'util';
import chalk from 'chalk';

const execFileAsync = promisify(execFile);

/**
 * Validates that the git binary is available on PATH.
 * @returns {Promise<boolean>} True if git is available
 */
export async function validateGitAvailable() {
  try {
    await execFileAsync('git', ['--version']);
    return true;
  } catch {
    return false;
  }
}

/**
 * Validates that a URL is an HTTPS git URL.
 * @param {string} url - The URL to validate
 * @returns {boolean} True if valid HTTPS URL
 */
export function isValidHttpsGitUrl(url) {
  return typeof url === 'string' && url.startsWith('https://');
}

/**
 * Checks if a path is a valid git repository.
 * @param {string} path - The directory path to check
 * @returns {Promise<boolean>} True if path is a git repo
 */
export async function isGitRepository(path) {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--is-inside-work-tree'], {
      cwd: path
    });
    return stdout.trim() === 'true';
  } catch {
    return false;
  }
}

/**
 * Clones a git repository to the specified destination.
 * @param {string} url - HTTPS git URL to clone
 * @param {string} dest - Destination directory path
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<string>} Output from git clone
 */
export async function gitClone(url, dest, options = {}) {
  // Validation: allow HTTPS or file:// URLs
  if (!isValidHttpsGitUrl(url) && !url.startsWith('file://')) {
    throw new Error(chalk.red(`Invalid git URL: "${url}". Must start with https:// or file://`));
  }

  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would clone: ${url} to ${dest}`));
    return `Dry-run: git clone ${url} ${dest}`;
  }

  // Check git availability
  const gitAvailable = await validateGitAvailable();
  if (!gitAvailable) {
    throw new Error(chalk.red('Git is not installed or not available on PATH.'));
  }

  try {
    const { stdout } = await execFileAsync('git', ['clone', url, dest], {
      timeout: 300000, // 5 minute timeout
      maxBuffer: 10 * 1024 * 1024 // 10MB buffer
    });
    return stdout;
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git clone error';
    throw new Error(chalk.red(`Git clone failed: ${errorMsg}`));
  }
}

/**
 * Adds a remote to an existing git repository.
 * @param {string} path - Path to existing git repository
 * @param {string} name - Remote name (e.g., 'origin', 'upstream')
 * @param {string} url - HTTPS git URL for the remote
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<string>} Output from git remote add
 */
export async function gitAddRemote(path, name, url, options = {}) {
  // Validation: allow HTTPS or file:// URLs
  if (!isValidHttpsGitUrl(url) && !url.startsWith('file://')) {
    throw new Error(chalk.red(`Invalid git URL: "${url}". Must start with https:// or file://`));
  }

  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would add remote "${name}": ${url} to ${path}`));
    return `Dry-run: git remote add ${name} ${url}`;
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    // Check if remote already exists; update if it does
    try {
      const existingRemotes = await execFileAsync('git', ['remote', '-v'], { cwd: path });
      const remoteLines = existingRemotes.stdout.split('\n');
      const remoteExists = remoteLines.some(line => {
        const parts = line.split('\t');
        if (parts[0] !== name) return false;
        // parts[1] contains URL followed by optional ' (fetch)' or ' (push)'
        const remoteUrl = parts[1] ? parts[1].split(' ')[0] : '';
        return remoteUrl === url;
      });

      if (remoteExists) {
        // Update remote URL
        const { stdout } = await execFileAsync('git', ['remote', 'set-url', name, url], { cwd: path });
        console.log(chalk.blue(`Remote "${name}" updated to ${url}`));
        return stdout;
      }
    } catch {
      // remote -v failed, continue to add
    }

    const { stdout } = await execFileAsync('git', ['remote', 'add', name, url], { cwd: path });
    return stdout;
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git remote add error';
    throw new Error(chalk.red(`Git remote add failed: ${errorMsg}`));
  }
}

/**
 * Gets the current commit hash of a git repository.
 * @param {string} path - Path to git repository
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<string>} Current commit hash
 */
export async function gitCurrentCommit(path, options = {}) {
  if (options.dryRun) {
    const mockHash = 'abc1234';
    console.log(chalk.yellow(`[Dry-run] Would get current commit: ${mockHash}`));
    return mockHash;
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', 'HEAD'], { cwd: path });
    return stdout.trim();
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git rev-parse error';
    throw new Error(chalk.red(`Failed to get current commit: ${errorMsg}`));
  }
}

/**
 * Fetches updates from a remote in a git repository.
 * @param {string} path - Path to git repository
 * @param {string} [remoteName] - Optional remote name (defaults to all remotes)
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<string>} Output from git fetch
 */
export async function gitFetch(path, remoteName, options = {}) {
  if (options.dryRun) {
    const target = remoteName ? `remote "${remoteName}"` : 'all remotes';
    console.log(chalk.yellow(`[Dry-run] Would fetch from ${target} in ${path}`));
    return `Dry-run: git fetch ${remoteName ? remoteName : ''}`;
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    const args = remoteName ? ['fetch', remoteName] : ['fetch'];
    const { stdout } = await execFileAsync('git', args, { cwd: path });
    return stdout;
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git fetch error';
    throw new Error(chalk.red(`Git fetch failed: ${errorMsg}`));
  }
}

/**
 * Gets the number of commits the local branch is behind the remote.
 * @param {string} path - Path to git repository
 * @param {string} remoteName - Remote name to compare against
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<number>} Number of commits behind
 */
export async function gitCommitsBehind(path, remoteName, options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would check commits behind ${remoteName}`));
    return 0;
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    // First, get the current branch name
    const { stdout: branch } = await execFileAsync('git', ['rev-parse', '--abbrev-ref', 'HEAD'], {
      cwd: path
    });
    const currentBranch = branch.trim();

    // Get the number of commits behind
    // git rev-list --count HEAD..remote/branch
    const { stdout } = await execFileAsync('git', ['rev-list', '--count', `HEAD..${remoteName}/${currentBranch}`], {
      cwd: path
    });

    const count = parseInt(stdout.trim(), 10);
    return isNaN(count) ? 0 : count;
  } catch (err) {
    // If the error is about the remote branch not existing, return 0
    if (err.stderr && err.stderr.includes('unknown revision or path not in the working tree')) {
      return 0;
    }
    const errorMsg = err.stderr || err.message || 'Unknown git rev-list error';
    throw new Error(chalk.red(`Failed to check commits behind: ${errorMsg}`));
  }
}

/**
 * Gets the commit history between two commits.
 * @param {string} path - Path to git repository
 * @param {string} fromCommit - Starting commit (exclusive)
 * @param {string} toCommit - Ending commit (inclusive)
 * @param {Object} options - Optional settings (dryRun, limit)
 * @returns {Promise<Array>} Array of commit objects
 */
export async function gitGetCommitHistory(path, fromCommit, toCommit = 'HEAD', options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would get commit history from ${fromCommit}..${toCommit}`));
    return [
      { hash: 'abc1234', message: 'Mock commit 1', author: 'Mock Author', date: '2026-03-15T12:00:00Z' },
      { hash: 'def5678', message: 'Mock commit 2', author: 'Mock Author', date: '2026-03-16T12:00:00Z' }
    ];
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    const args = ['log', '--format=%H|%s|%an|%aI', `${fromCommit}..${toCommit}`];
    if (options.limit) {
      args.push(`--max-count=${options.limit}`);
    }

    const { stdout } = await execFileAsync('git', args, { cwd: path });

    const commits = [];
    const lines = stdout.trim().split('\n');

    for (const line of lines) {
      if (line) {
        const [hash, message, author, date] = line.split('|');
        commits.push({ hash, message, author, date });
      }
    }

    return commits;
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git log error';
    throw new Error(chalk.red(`Failed to get commit history: ${errorMsg}`));
  }
}

/**
 * Gets the common ancestor commit between two commits.
 * @param {string} path - Path to git repository
 * @param {string} commitA - First commit
 * @param {string} commitB - Second commit
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<string>} Common ancestor commit hash
 */
export async function gitFindCommonAncestor(path, commitA, commitB, options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would find common ancestor between ${commitA} and ${commitB}`));
    return 'common1234';
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    const { stdout } = await execFileAsync('git', ['merge-base', commitA, commitB], { cwd: path });
    return stdout.trim();
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git merge-base error';
    throw new Error(chalk.red(`Failed to find common ancestor: ${errorMsg}`));
  }
}

/**
 * Gets the git remote URLs for a repository.
 * @param {string} path - Path to git repository
 * @param {Object} options - Optional settings (dryRun)
 * @returns {Promise<Object>} Object with remote names as keys and URLs as values
 */
export async function gitGetRemotes(path, options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would get remotes for ${path}`));
    return {
      origin: 'https://github.com/example/skill.git',
      upstream: 'https://github.com/original/skill.git'
    };
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    const { stdout } = await execFileAsync('git', ['remote', '-v'], { cwd: path });
    const remotes = {};

    const lines = stdout.trim().split('\n');
    for (const line of lines) {
      const parts = line.split('\t');
      if (parts.length >= 2) {
        const name = parts[0];
        const url = parts[1].split(' ')[0]; // Remove trailing ' (fetch)' or ' (push)'
        remotes[name] = url;
      }
    }

    return remotes;
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git remote error';
    throw new Error(chalk.red(`Failed to get remotes: ${errorMsg}`));
  }
}

/**
 * Gets the commit diff between two commits.
 * @param {string} path - Path to git repository
 * @param {string} fromCommit - Starting commit (exclusive)
 * @param {string} toCommit - Ending commit (inclusive)
 * @param {Object} options - Optional settings (dryRun, format)
 * @returns {Promise<string>} Diff output
 */
export async function gitGetDiff(path, fromCommit, toCommit = 'HEAD', options = {}) {
  if (options.dryRun) {
    console.log(chalk.yellow(`[Dry-run] Would get diff from ${fromCommit}..${toCommit}`));
    return `Mock diff between ${fromCommit} and ${toCommit}`;
  }

  const repoExists = await isGitRepository(path);
  if (!repoExists) {
    throw new Error(chalk.red(`Path is not a git repository: "${path}"`));
  }

  try {
    const args = ['diff', '--stat', `${fromCommit}..${toCommit}`];
    if (options.format === 'patch') {
      args.splice(1, 0, '--patch');
    }

    const { stdout } = await execFileAsync('git', args, { cwd: path });
    return stdout;
  } catch (err) {
    const errorMsg = err.stderr || err.message || 'Unknown git diff error';
    throw new Error(chalk.red(`Failed to get diff: ${errorMsg}`));
  }
}
