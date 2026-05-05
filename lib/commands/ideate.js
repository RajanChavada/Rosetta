import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import { TreeLogger } from '../utils.js';
import { analyzeProjectForIdeation } from '../context.js';
import { generateSkillIdeationTemplate, writeIdeationTemplate } from '../generators/ideation-template-generator.js';

/**
 * Attempts to copy text to the system clipboard using native OS commands.
 * Falls back through multiple Linux clipboard tools.
 * @param {string} text - Text to copy
 * @returns {boolean} Whether the copy succeeded
 */
function copyToClipboard(text) {
  const commands = [];

  if (process.platform === 'darwin') {
    commands.push('pbcopy');
  } else if (process.platform === 'win32') {
    commands.push('clip');
  } else {
    // Linux: try multiple clipboard tools
    commands.push('xclip -selection clipboard', 'xsel --clipboard --input', 'wl-copy');
  }

  for (const cmd of commands) {
    try {
      execSync(cmd, { input: text, stdio: ['pipe', 'ignore', 'ignore'] });
      return true;
    } catch {
      // Try next command
    }
  }

  return false;
}

/**
 * Wraps the raw ideation template in a framing prompt that gives
 * the AI agent context about what to do with the content.
 * @param {string} templateContent - Raw template markdown
 * @returns {string} Framed prompt ready to paste
 */
function buildFramedPrompt(templateContent) {
  return `I'm going to share my project context for a skill design workshop.
Please read the full context below, then ask me 3-5 clarifying questions
about my domain, conventions, and goals before proposing any skills.

---

${templateContent}`;
}

/**
 * Command: ideate [project-path]
 * Generate skill ideation template for use in IDE.
 */
export async function ideate(options = {}) {
  const {
    json = false,
    dryRun = false,
    output = '.ai/skill-ideation-template.md',
    area, // project path from --area option
    interactive,
    nonInteractive,
    clipboard: useClipboard = true
  } = options;

  const projectPath = area || process.cwd();

  // Use silent logger when JSON output is requested
  const logger = json ? {
    logStep: () => {}
  } : new TreeLogger('Generating skill ideation template');

  try {
    // Step 1: Analyze project
    logger.logStep('Analyzing project structure...');
    const analysisResults = await analyzeProjectForIdeation(projectPath);
    logger.logStep(`Project: ${analysisResults.projectName} (${analysisResults.projectPath})`);

    // Step 2: Gather team context (interactive only, skip for JSON and dry-run)
    let teamContext = {};
    if (!json && !dryRun) {
      if (analysisResults.ides.length > 0) {
        const ideNames = analysisResults.ides.map(ide => ide.name).join(', ');
        logger.logStep(`Detected IDEs: ${ideNames}`);
        logger.logStep('Skipping team context questions (IDEs already configured)');
      } else {
        logger.logStep('Gathering team context...');
        const teamAnswers = await inquirer.prompt([
          {
            type: 'input',
            name: 'domain',
            message: 'What is your team\'s domain or industry? (optional)',
            default: ''
          },
          {
            type: 'input',
            name: 'conventions',
            message: 'Any team conventions the AI should follow? (optional)',
            default: ''
          },
          {
            type: 'input',
            name: 'existingSkills',
            message: 'Existing skills or patterns to consider? (optional)',
            default: ''
          }
        ]);

        // Only include non-empty answers
        if (teamAnswers.domain?.trim()) teamContext.domain = teamAnswers.domain.trim();
        if (teamAnswers.conventions?.trim()) teamContext.conventions = teamAnswers.conventions.trim();
        if (teamAnswers.existingSkills?.trim()) teamContext.existingSkills = teamAnswers.existingSkills.trim();

        // Add team context to analysis results
        analysisResults.teamContext = teamContext;
      }
    }

    // Step 3: Generate template content
    logger.logStep('Generating ideation template...');
    let templateContent;
    if (dryRun) {
      // Just generate content, don't write
      templateContent = await generateSkillIdeationTemplate(analysisResults);
    } else {
      // Write to file
      await writeIdeationTemplate(analysisResults, output);
      // Read back for display
      templateContent = await fs.readFile(output, 'utf8');
    }

    // Step 3: Display results
    if (json) {
      const jsonOutput = JSON.stringify({
        analysisResults,
        templatePath: dryRun ? null : output
      }, null, 2);
      console.log(jsonOutput);
      return;
    }

    console.log('');
    console.log(chalk.bold('✅ Ideation template generated successfully!'));
    console.log('');

    if (!dryRun) {
      // Build framed prompt for clipboard
      const framedPrompt = buildFramedPrompt(templateContent);

      if (useClipboard) {
        const copied = copyToClipboard(framedPrompt);
        if (copied) {
          console.log(chalk.green('✅ Copied to clipboard. Paste into your AI agent (Claude Code, Cursor, etc.) to start.'));
          console.log(chalk.gray(`   Template also saved to: ${output}`));
        } else {
          console.log(chalk.yellow('⚠ Could not copy to clipboard. Open and copy manually:'));
          console.log(chalk.gray(`   ${output}`));
        }
      } else {
        console.log(chalk.green(`Template saved to: ${output}`));
        console.log(chalk.gray('Use without --no-clipboard to auto-copy to clipboard.'));
      }
    } else {
      console.log(chalk.gray('Dry run: Template would be saved to:', output));
      console.log('');
      console.log(chalk.gray('Template preview:'));
      console.log(chalk.gray('---'));
      console.log(templateContent.split('\n').slice(0, 10).join('\n'));
      console.log(chalk.gray('...'));
      console.log(chalk.gray('(first 10 lines shown)'));
    }

  } catch (err) {
    console.error(chalk.red(`Error during ideation: ${err.message}`));
    process.exit(1);
  }
}