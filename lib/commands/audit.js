import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
// import { loadYAML } from '../parsers/yaml-parser.js';
// import { validateConfig } from '../validation/index.js';

// Audit scoring criteria
const AUDIT_CRITERIA = {
  presence: {
    'project-name': { weight: 0.1, required: true },
    'language': { weight: 0.1, required: true },
    'framework': { weight: 0.15, required: true },
    'testing': { weight: 0.1, required: true },
    'commands': { weight: 0.15, required: true },
    'ide-sections': { weight: 0.2, required: true },
    'conventions': { weight: 0.1, required: false },
    'description': { weight: 0.1, required: false },
  },
  quality: {
    'proper-structure': { weight: 0.2 },
    'no-todo-comments': { weight: 0.1 },
    'comprehensive-coverage': { weight: 0.2 },
    'ide-specific': { weight: 0.2 },
    'clear-instructions': { weight: 0.3 },
  }
};

/**
 * Calculate audit score for a template
 * @param {string} templatePath - Path to template file
 * @param {string} ide - IDE name (claude, cursor, windsurf)
 * @param {string} stack - Stack name (next.js, react-vite, etc.)
 * @returns {Promise<Object>} Audit result with score and feedback
 */
export async function auditTemplate(templatePath, ide, stack) {
  const result = {
    path: templatePath,
    ide,
    stack,
    score: 0,
    maxScore: 0,
    feedback: [],
    details: {}
  };

  try {
    // Read template content
    const content = await fs.readFile(templatePath, 'utf-8');
    result.details.content = content;

    // Check presence criteria
    let presenceScore = 0;
    let presenceMax = 0;

    for (const [key, criteria] of Object.entries(AUDIT_CRITERIA.presence)) {
      presenceMax += criteria.weight;

      if (criteria.required && !checkPresence(content, key)) {
        result.feedback.push(`❌ Missing required: ${key}`);
        continue;
      }

      if (checkPresence(content, key)) {
        presenceScore += criteria.weight;
        result.details[key] = true;
      } else {
        result.details[key] = false;
      }
    }

    // Check quality criteria
    let qualityScore = 0;
    let qualityMax = 0;

    for (const [key, criteria] of Object.entries(AUDIT_CRITERIA.quality)) {
      qualityMax += criteria.weight;
      qualityScore += calculateQualityScore(content, key, criteria.weight);
    }

    // Calculate final score
    result.score = Math.round(((presenceScore + qualityScore) / (presenceMax + qualityMax)) * 100);
    result.maxScore = 100;
    result.passed = result.score >= 75;

    // Add feedback
    if (result.score >= 90) {
      result.feedback.unshift(`✅ Excellent template! Score: ${result.score}/100`);
    } else if (result.score >= 75) {
      result.feedback.unshift(`✅ Passed audit! Score: ${result.score}/100`);
    } else {
      result.feedback.unshift(`❌ Failed audit. Score: ${result.score}/100 (needs ≥75)`);
    }

  } catch (err) {
    result.error = err.message;
    result.feedback.push(`❌ Error reading template: ${err.message}`);
  }

  return result;
}

/**
 * Check if content has presence of required elements
 */
function checkPresence(content, key) {
  switch (key) {
    case 'project-name':
      return content.includes('{{PROJECT_NAME}}');
    case 'language':
      return content.includes('{{LANGUAGE}}');
    case 'framework':
      return content.includes('{{FRAMEWORK}}');
    case 'testing':
      return content.includes('{{TEST_RUNNER}}');
    case 'commands':
      return content.includes('```bash') || content.includes('```bash\n');
    case 'ide-sections':
      return content.includes('{{#IDE') || content.includes('## IDE Integration');
    case 'conventions':
      return content.includes('Conventions') || content.includes('conventions');
    case 'description':
      return content.includes('Description') || content.includes('<!-- TODO: Add project description -->');
    default:
      return false;
  }
}

/**
 * Calculate quality score for specific criteria
 */
function calculateQualityScore(content, key, maxScore) {
  switch (key) {
    case 'proper-structure':
      // Check for proper markdown structure
      let structureScore = 0;
      if (content.includes('# ')) structureScore += maxScore * 0.3;
      if (content.includes('## ')) structureScore += maxScore * 0.3;
      if (content.includes('- ')) structureScore += maxScore * 0.2;
      if (content.includes('```')) structureScore += maxScore * 0.2;
      return structureScore;

    case 'no-todo-comments':
      // Penalize excessive TODO comments
      const todoCount = (content.match(/<!-- TODO:/g) || []).length;
      if (todoCount === 0) return maxScore;
      if (todoCount <= 2) return maxScore * 0.7;
      if (todoCount <= 5) return maxScore * 0.4;
      return maxScore * 0.1;

    case 'comprehensive-coverage':
      // Check for comprehensive content
      let coverage = 0;
      if (content.length > 1000) coverage += maxScore * 0.3;
      if (content.includes('Standard Operating Procedures')) coverage += maxScore * 0.2;
      if (content.includes('Conventions')) coverage += maxScore * 0.2;
      if (content.includes('Commands')) coverage += maxScore * 0.2;
      if (content.includes('IDE') || content.includes('Configuration')) coverage += maxScore * 0.1;
      return coverage;

    case 'ide-specific':
      // Check for IDE-specific content
      if (content.includes('{{#IDE')) return maxScore;
      if (content.includes('## Cursor Rules') || content.includes('## Windsurf Configuration')) return maxScore * 0.8;
      return maxScore * 0.5;

    case 'clear-instructions':
      // Check for clear, actionable instructions
      let instructionScore = 0;
      if (content.includes('Key Instructions') || content.includes('Development Patterns')) instructionScore += maxScore * 0.5;
      if (content.includes('Cursor AI Context') || content.includes('Windsurf Configuration')) instructionScore += maxScore * 0.5;
      return instructionScore;

    default:
      return 0;
  }
}

/**
 * Audit all templates
 */
export async function auditAllTemplates() {
  const results = [];
  const templatesDir = path.resolve('templates');

  if (!(await fs.pathExists(templatesDir))) {
    throw new Error('Templates directory not found');
  }

  // Valid stacks for init command
  const validStacks = ['next.js', 'react-vite', 'node-api', 'python-fastapi', 'swift-ios'];

  // Get all IDE directories
  const ides = await fs.readdir(templatesDir);

  for (const ide of ides) {
    const ideDir = path.join(templatesDir, ide);
    if ((await fs.stat(ideDir)).isDirectory()) {
      const stacks = await fs.readdir(ideDir);

      for (const stack of stacks) {
        if (stack.endsWith('.md') && validStacks.includes(stack.replace('.md', ''))) {
          const templatePath = path.join(ideDir, stack);
          const result = await auditTemplate(templatePath, ide, stack.replace('.md', ''));
          results.push(result);
        }
      }
    }
  }

  return results;
}

/**
 * Generate audit report
 */
export function generateAuditReport(results) {
  const report = {
    summary: {
      total: results.length,
      passed: results.filter(r => r.passed).length,
      failed: results.filter(r => !r.passed).length,
      averageScore: 0,
    },
    templates: results
  };

  // Calculate average score
  report.summary.averageScore = Math.round(
    results.reduce((sum, r) => sum + r.score, 0) / results.length
  );

  // Sort by score (lowest first)
  report.templates.sort((a, b) => a.score - b.score);

  return report;
}

export async function audit(options = {}) {
  const { template, ide, stack, json = false } = options;

  try {
    console.log(chalk.cyan('🔍 Rosetta Audit - Validating Templates\n'));

    let results;

    if (template && ide && stack) {
      // Audit specific template
      const templatePath = path.resolve('templates', ide, `${stack}.md`);
      results = [await auditTemplate(templatePath, ide, stack)];
    } else {
      // Audit all templates
      results = await auditAllTemplates();
    }

    const report = generateAuditReport(results);

    if (json) {
      console.log(JSON.stringify(report, null, 2));
      return { success: true, report };
    }

    // Display summary
    console.log(chalk.bold('\n📊 Audit Summary:'));
    console.log(`  Total templates: ${report.summary.total}`);
    console.log(`  Passed (≥75): ${report.summary.passed} ✅`);
    console.log(`  Failed (<75): ${report.summary.failed} ❌`);
    console.log(`  Average score: ${report.summary.averageScore}/100\n`);

    // Display template results
    for (const result of report.templates) {
      const status = result.passed ? chalk.green('PASS') : chalk.red('FAIL');
      console.log(`${status} ${result.ide}/${result.stack} - ${result.score}/100`);

      if (!result.passed) {
        console.log(chalk.red('  Issues:'));
        result.feedback.slice(1).forEach(issue => {
          console.log(`    ${issue}`);
        });
      }
    }

    if (report.summary.failed > 0) {
      console.log(chalk.red('\n❌ Some templates failed audit. Fix the issues above and re-run.'));
      return { success: false, report };
    }

    console.log(chalk.green('\n✅ All templates passed audit!'));
    return { success: true, report };

  } catch (err) {
    console.error(chalk.red(`Error: ${err.message}`));
    return { success: false, error: err.message };
  }
}