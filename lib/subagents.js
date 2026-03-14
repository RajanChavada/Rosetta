import { spawn } from 'child_process';
import chalk from 'chalk';
import fs from 'fs-extra';

/**
 * Subagent system for delegating heavy exploration and analysis tasks.
 */

/**
 * Configuration for available subagents.
 */
export const SUBAGENTS = {
  'explore-codebase': {
    name: 'Explore Codebase',
    file: '.claude/agents/explore-codebase.md',
    description: 'Scan repository, map patterns, find files',
    timeout: 60000 // 60 seconds
  },
  'security-review': {
    name: 'Security Review',
    file: '.claude/agents/security-review.md',
    description: 'Security scanning, dependency audit (read-only)',
    timeout: 30000 // 30 seconds
  }
};

/**
 * Execute a subagent with the given configuration.
 */
export async function executeSubagent(agentName, args = {}, context = {}) {
  const agent = SUBAGENTS[agentName];
  if (!agent) {
    throw new Error(`Unknown subagent: ${agentName}`);
  }

  const agentFile = path.join('.claude', 'agents', `${agentName}.md`);

  if (!(await fs.pathExists(agentFile))) {
    console.log(chalk.red(`Subagent file not found: ${agentFile}`));
    return null;
  }

  // Read agent configuration
  const agentConfig = await fs.readFile(agentFile, 'utf8');

  // Prepare context (include work area if specified)
  const agentContext = {
    ...context,
    agentName,
    agentConfig,
    baseDir: process.cwd()
  };

  // Write context to temp file for subagent to read
  const contextFile = `/tmp/rosetta-agent-${Date.now()}.json`;
  await fs.writeJson(contextFile, agentContext);

  console.log(chalk.blue(`🤖 Invoking ${agent.name}...`));

  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    // Spawn subagent (as separate Node process)
    const subagent = spawn('node', [
      '-e',
      `process.env.ROSETTA_AGENT=${JSON.stringify(agentContext)}`,
      '-e',
      `process.env.ROSETTA_MODE=subagent`,
      '--',
      agentFile
    ], {
      stdio: ['pipe', 'pipe', 'inherit'],
      cwd: process.cwd()
    });

    let output = '';
    let hasError = false;

    subagent.stdout.on('data', (data) => {
      output += data.toString();
      // Process in chunks to avoid buffer issues
    });

    subagent.stderr.on('data', (data) => {
      const error = data.toString();
      if (error.trim()) {
        hasError = true;
      }
    });

    subagent.on('close', async () => {
      // Clean up context file
      try {
        await fs.remove(contextFile);
      } catch (err) {
        // Ignore cleanup errors
      }

      const duration = Date.now() - startTime;
      const timedOut = duration >= agent.timeout;

      if (hasError || timedOut) {
        console.log(chalk.red(`✗ ${agent.name} failed.`));
        if (hasError) {
          console.log(chalk.gray('Check agent configuration and try again.'));
        }
        if (timedOut) {
          console.log(chalk.yellow('  Agent timed out. Consider breaking task into smaller parts.'));
        }
        resolve({ success: false, output });
      } else {
        console.log(chalk.green(`✓ ${agent.name} completed.`));
        console.log(chalk.gray(`  Duration: ${Math.round(duration / 1000)}s`));
        resolve({ success: true, output });
      }
    });

    subagent.on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Parse subagent output into structured result.
 */
export function parseSubagentOutput(output, agentName) {
  const agent = SUBAGENTS[agentName];
  const result = {
    agent: agentName,
    files: [],
    patterns: [],
    findings: []
  };

  const lines = output.split('\n');

  for (const line of lines) {
    if (line.startsWith('# Exploration:')) {
      result.mode = 'exploration';
      // Parse files found section
      const filesSection = lines.slice(lines.indexOf(line) + 1);
      const filesMatch = filesSection.join('\n').match(/Files Found:[\s\S]*/i);

      if (filesMatch) {
        const filesText = filesMatch[1];
        const fileRegex = /-\s+lib\/[^`]+\.js\s+-\s+<[^>]+>/g;
        let match;
        while ((match = fileRegex.exec(filesText)) !== null) {
          const filePath = match[0].trim();
          const purpose = match[1].replace(' - ', '').trim();
          result.files.push({ path: filePath, purpose });
          filesText = filesText.replace(match[0], '');
        }
      }

      // Parse patterns section
      const patternsSection = output.substring(filesSection ? lines.indexOf(filesSection) : 0);
      const patternsMatch = patternsSection.match(/Key Patterns:[\s\S]*/i);

      if (patternsMatch) {
        const patternsText = patternsMatch[1];
        const patternRegex = /-\s+<pattern description>:/g;
        let match;
        while ((match = patternRegex.exec(patternsText)) !== null) {
          const pattern = match[1].replace(' - ', '').trim();
          result.patterns.push(pattern);
          patternsText = patternsText.replace(match[0], '');
        }
      }

      // Parse hotspots section
      const hotspotsMatch = output.match(/Hotspots:[\s\S]*/i);
      if (hotspotsMatch) {
        const hotspotsText = hotspotsMatch[1];
        const hotspotRegex = /-\s+<file>:\s+<reason>/g;
        let match;
        while ((match = hotspotRegex.exec(hotspotsText)) !== null) {
          const [file, reason] = match[1].split(':').map(s => s.trim());
          result.hotspots.push({ file, reason });
          hotspotsText = hotspotsText.replace(match[0], '');
        }
      }

    } else if (line.startsWith('# Security Review:')) {
      result.mode = 'review';
      // Parse dependencies section
      const depsSection = output.substring(output.indexOf(line));
      const depsMatch = depsSection.match(/Dependencies:[\s\S]*/i);

      if (depsMatch) {
        const depsText = depsMatch[1];
        const depRegex = /-\s+<package>@<version>:\s+<vulnerability summary>/g;
        let match;
        while ((match = depRegex.exec(depsText)) !== null) {
          const [pkg, version, vuln] = match[1].split(':').map(s => s.trim());
          result.findings.push({
            type: 'vulnerability',
            package: pkg,
            version,
            vulnerability: vuln
          });
          depsText = depsText.replace(match[0], '');
        }
      }

      // Parse code issues section
      const codeMatch = output.match(/Code Issues:[\s\S]*/i);
      if (codeMatch) {
        const codeText = codeMatch[1];
        const issueRegex = /-\s+<file>:\s+<line>:\s+-\s+<issue description>/g;
        let match;
        while ((match = issueRegex.exec(codeText)) !== null) {
          const [file, line, issue] = match[1].split(':').map(s => s.trim());
          result.findings.push({
            type: 'code_issue',
            file,
            line: line ? parseInt(line.replace(':', '')) : 0,
            issue
          });
          codeText = codeText.replace(match[0], '');
        }
      }
    }
  }

  return result;
}
