import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { TreeLogger } from '../utils.js';
import { loadSkillsFromSources } from '../skills.js';
import { analyzeDependencies } from '../analyzers/dependency-analyzer.js';
import { analyzeCodePatterns } from '../analyzers/code-pattern-analyzer.js';
import { analyzeStructure } from '../analyzers/structure-analyzer.js';
import { analyzeConventions } from '../analyzers/convention-analyzer.js';
import { scoreAllSkills, displayScoredSkills } from '../generators/relevance-scorer.js';
import { generateSkillContent, formatSkillForDisplay } from '../generators/skill-generator.js';

/**
 * Command: ideate [project-path]
 * Analyze codebase and suggest relevant skills.
 */
export async function ideate(projectPath = process.cwd(), options = {}) {
  const {
    json = false,
    dryRun = false,
    maxSkills = 5,
    verbose = false,
    skillsDir,
    skillsRepo,
    outputFormat = 'display'
  } = options;

  const logger = new TreeLogger('Analyzing codebase for skill suggestions');

  try {
    // Step 1: Load available skills
    logger.logStep('Loading available skills...');
    const skills = await loadSkillsFromSources({ skillsDir, skillsRepo });

    if (skills.length === 0) {
      console.log(chalk.yellow('No skills available. Ensure skills are in templates/skills/ or specified via --skills-dir.'));
      return;
    }

    logger.logStep(`Loaded ${skills.length} skill(s)`);

    // Step 2: Analyze dependencies
    logger.logStep('Analyzing project dependencies...');
    const dependencyAnalysis = await analyzeDependencies(projectPath);
    logger.logStep(`Detected language: ${dependencyAnalysis.primaryLanguage || 'unknown'}`);

    // Step 3: Analyze code patterns
    logger.logStep('Analyzing code patterns...');
    const patternAnalysis = await analyzeCodePatterns(projectPath);
    logger.logStep(`Architecture: ${patternAnalysis.architecture.pattern}`);

    // Step 4: Analyze structure
    logger.logStep('Analyzing project structure...');
    const structureAnalysis = await analyzeStructure(projectPath);
    logger.logStep(`Layout: ${structureAnalysis.layout.pattern}`);

    // Step 5: Analyze conventions
    logger.logStep('Analyzing project conventions...');
    const conventionAnalysis = await analyzeConventions(projectPath);
    logger.logStep(`Naming: ${conventionAnalysis.naming.files.style || 'mixed'}`);

    // Combine all analysis results
    const analysisResults = {
      dependencies: dependencyAnalysis,
      patterns: patternAnalysis,
      structure: structureAnalysis,
      conventions: conventionAnalysis,
      context: {
        projectPath,
        projectName: path.basename(projectPath)
      }
    };

    // Step 6: Score skills
    logger.logStep('Scoring skills based on analysis...');
    const scoredSkills = scoreAllSkills(skills, analysisResults, {
      maxSkills,
      minThreshold: 30,
      verbose
    });

    if (scoredSkills.length === 0) {
      logger.logStep('No skills matched above threshold', '!', true);
      console.log(chalk.yellow('\nTry lowering the threshold or add more skills to your collection.'));
      return;
    }

    logger.logStep(`Found ${scoredSkills.length} relevant skill(s)`, '✓', true);

    // Step 7: Display results
    if (json) {
      console.log(JSON.stringify({
        analysisResults,
        scoredSkills: scoredSkills.map(s => ({
          name: s.skill.name,
          score: s.score,
          confidence: s.confidence,
          reasons: s.reasons
        }))
      }, null, 2));
      return;
    }

    console.log('');
    console.log(chalk.bold('📊 Analysis Summary'));
    console.log('');

    // Show detected information
    if (verbose) {
      console.log(chalk.gray('Detected:'));
      if (dependencyAnalysis.primaryLanguage) {
        console.log(chalk.gray(`  Language: ${dependencyAnalysis.primaryLanguage}`));
      }
      if (dependencyAnalysis.primaryFramework.length > 0) {
        console.log(chalk.gray(`  Frameworks: ${dependencyAnalysis.primaryFramework.join(', ')}`));
      }
      if (patternAnalysis.architecture.pattern !== 'unknown') {
        console.log(chalk.gray(`  Architecture: ${patternAnalysis.architecture.pattern}`));
      }
      if (patternAnalysis.testing.hasTests) {
        console.log(chalk.gray(`  Testing: ${patternAnalysis.testing.frameworks.join(', ')}`));
      }
      console.log('');
    }

    // Display suggested skills
    console.log(chalk.bold('💡 Suggested Skills'));
    console.log('');
    displayScoredSkills(scoredSkills, { verbose, json });

    // Step 8: Interactive selection (if not in dry-run mode)
    if (!dryRun && scoredSkills.length > 0) {
      const { shouldInstall } = await inquirer.prompt([{
        type: 'confirm',
        name: 'shouldInstall',
        message: 'Would you like to install any of these skills?',
        default: false
      }]);

      if (shouldInstall) {
        await handleSkillInstallation(scoredSkills, projectPath, analysisResults);
      }
    }

  } catch (err) {
    console.error(chalk.red(`Error during ideation: ${err.message}`));
    if (verbose) {
      console.error(err.stack);
    }
    process.exit(1);
  }
}

/**
 * Handle interactive skill installation.
 */
async function handleSkillInstallation(scoredSkills, projectPath, analysisResults) {
  const choices = scoredSkills.map((s, i) => ({
    name: `${i + 1}. ${s.skill.name} (${s.score}% confidence)`,
    value: s.skill.name,
    short: s.skill.name
  }));

  choices.push(new inquirer.Separator());
  choices.push({ name: 'Cancel', value: null });

  const { selectedSkills } = await inquirer.prompt([{
    type: 'checkbox',
    name: 'selectedSkills',
    message: 'Select skills to install (press space to select, enter to confirm):',
    choices,
    validate: (answer) => {
      if (answer.length === 0) {
        return 'Please select at least one skill or choose Cancel.';
      }
      return true;
    }
  }]);

  if (!selectedSkills || selectedSkills.length === 0) {
    console.log(chalk.yellow('Installation cancelled.'));
    return;
  }

  console.log('');
  console.log(chalk.bold('Installing selected skills...'));
  console.log('');

  const fs = (await import('fs-extra')).default;
  const skillsDir = path.join(projectPath, '.claude', 'skills');
  await fs.ensureDir(skillsDir);

  for (const skillName of selectedSkills) {
    const scoredSkill = scoredSkills.find(s => s.skill.name === skillName);
    if (!scoredSkill) continue;

    const skill = scoredSkill.skill;
    const targetPath = path.join(skillsDir, `${skill.name}.md`);

    try {
      // Generate skill content with context
      let content = skill.content;

      // If skill is a template, substitute placeholders
      if (skill.content.includes('{{') && skill.content.includes('}}')) {
        content = await generateSkillContent(skill, {
          skillName: skill.name,
          skillDescription: skill.description,
          projectContext: analysisResults.context,
          analysisResults
        });
      }

      // Write skill file
      await fs.writeFile(targetPath, content);
      console.log(chalk.green(`✓ Installed ${skill.name}`));

      if (analysisResults.context.verbose) {
        console.log(chalk.gray(`  Location: ${targetPath}`));
      }
    } catch (err) {
      console.error(chalk.red(`✗ Failed to install ${skill.name}: ${err.message}`));
    }
  }

  console.log('');
  console.log(chalk.green(`Successfully installed ${selectedSkills.length} skill(s).`));
  console.log(chalk.gray(`Skills directory: ${skillsDir}`));
  console.log(chalk.gray('\nTip: Use these skills by running `/skill <name>` in your AI agent.'));
}

/**
 * Generate a summary report of the ideation process.
 */
export async function generateIdeationReport(analysisResults, scoredSkills, options = {}) {
  const { outputPath, format = 'text' } = options;

  const report = {
    timestamp: new Date().toISOString(),
    project: analysisResults.context,
    analysis: {
      language: analysisResults.dependencies.primaryLanguage,
      frameworks: analysisResults.dependencies.primaryFramework,
      architecture: analysisResults.patterns.architecture.pattern,
      hasTests: analysisResults.patterns.testing.hasTests
    },
    suggestedSkills: scoredSkills.map(s => ({
      name: s.skill.name,
      score: s.score,
      confidence: s.confidence,
      reasons: s.reasons
    }))
  };

  if (format === 'json') {
    return JSON.stringify(report, null, 2);
  }

  // Text format
  const lines = [
    '# Skill Ideation Report',
    '',
    `Generated: ${report.timestamp}`,
    `Project: ${report.project.projectName}`,
    `Path: ${report.project.projectPath}`,
    '',
    '## Analysis Summary',
    '',
    `Language: ${report.analysis.language || 'unknown'}`,
    `Frameworks: ${report.analysis.frameworks.join(', ') || 'none'}`,
    `Architecture: ${report.analysis.architecture}`,
    `Testing: ${report.analysis.hasTests ? 'Yes' : 'No'}`,
    '',
    '## Suggested Skills',
    ''
  ];

  report.suggestedSkills.forEach((skill, i) => {
    lines.push(`${i + 1}. ${skill.name} (${skill.score}% confidence)`);
    if (skill.reasons.length > 0) {
      lines.push(`   Reasons:`);
      skill.reasons.forEach(r => lines.push(`   - ${r}`));
    }
    lines.push('');
  });

  return lines.join('\n');
}

/**
 * Export ideation results to a file.
 */
export async function exportIdeationResults(analysisResults, scoredSkills, outputPath, options = {}) {
  const fs = (await import('fs-extra')).default;
  const report = await generateIdeationReport(analysisResults, scoredSkills, options);

  await fs.writeFile(outputPath, report);
  console.log(chalk.green(`Report exported to: ${outputPath}`));
}
