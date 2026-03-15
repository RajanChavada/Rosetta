import path from 'path';
import chalk from 'chalk';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import { TreeLogger } from '../utils.js';
import { analyzeProjectForIdeation } from '../context.js';
import { generateSkillIdeationTemplate, writeIdeationTemplate } from '../generators/ideation-template-generator.js';

/**
 * Command: ideate [project-path]
 * Generate skill ideation template for use in IDE.
 */
export async function ideate(options = {}) {
  const {
    json = false,
    dryRun = false,
    output = '.ai/skill-ideation-template.md',
    verbose = false,
    area, // project path from --area option
    // Deprecated options (accepted for compatibility but ignored)
    maxSkills,
    skillsDir,
    skillsRepo,
    provider,
    apiKey,
    interactive,
    nonInteractive,
    deep
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
      console.log(JSON.stringify({
        analysisResults,
        templatePath: dryRun ? null : output
      }, null, 2));
      return;
    }

    console.log('');
    console.log(chalk.bold('✅ Ideation template generated successfully!'));
    console.log('');

    if (!dryRun) {
      console.log(chalk.green(`Template saved to: ${output}`));
      console.log('');
      console.log(chalk.gray('Next steps:'));
      console.log(chalk.gray('1. Open the template file in your IDE'));
      console.log(chalk.gray('2. Paste the content into your AI agent'));
      console.log(chalk.gray('3. Answer the clarifying questions to generate skill suggestions'));
      console.log('');
      console.log(chalk.gray('The template provides context about your project and guides the AI through'));
      console.log(chalk.gray('creating 1–5 focused Rosetta skills tailored to your needs.'));
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
    console.error(err.stack); // Always show stack for debugging
    process.exit(1);
  }
}