import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Generates skill file content based on analysis results and skill templates.
 */

/**
 * Generate skill content from a skill template with context substitution.
 */
export async function generateSkillContent(skillTemplate, context = {}) {
  const {
    skillName,
    skillDescription,
    projectContext,
    analysisResults,
    userPreferences
  } = context;

  // Read the skill template
  let content = skillTemplate.content || '';

  // Substitute placeholders with context data
  content = substitutePlaceholders(content, {
    skillName,
    skillDescription,
    projectName: projectContext?.projectName || 'the project',
    projectType: projectContext?.projectType || 'web application',
    techStack: formatTechStack(projectContext?.stack || {}),
    frameworks: formatList(projectContext?.stack?.frameworks || []),
    dependencies: formatList(projectContext?.stack?.dependencies || []),
    primaryLanguage: projectContext?.stack?.language || 'unknown',
    detectedPatterns: formatPatterns(analysisResults?.patterns || {}),
    conventions: formatConventions(analysisResults?.conventions || {}),
    customInstructions: userPreferences?.customInstructions || ''
  });

  return content;
}

/**
 * Generate a new skill from scratch based on analysis.
 */
export async function generateSkillFromAnalysis(analysisResults, options = {}) {
  const {
    skillName,
    skillDescription,
    domain,
    focusAreas = [],
    projectContext
  } = options;

  // Build skill frontmatter
  const frontmatter = buildSkillFrontmatter({
    name: skillName,
    description: skillDescription,
    domain,
    focusAreas,
    projectContext,
    analysisResults
  });

  // Build skill content
  const content = buildSkillContent({
    analysisResults,
    projectContext,
    focusAreas
  });

  // Combine frontmatter and content
  return `${frontmatter}\n\n${content}`;
}

/**
 * Generate skill recommendations text for user display.
 */
export async function generateSkillRecommendation(skill, score, reasons) {
  const recommendation = {
    name: skill.name,
    score: score,
    confidence: getConfidenceLabel(score),
    description: skill.description || '',
    domains: skill.domains || [],
    reasons: reasons || [],
    benefits: generateBenefits(skill, analysisResultsToContext(skill))
  };

  return recommendation;
}

/**
 * Generate benefits text for a skill.
 */
function generateBenefits(skill, context) {
  const benefits = [];

  // Extract benefits from skill template if available
  if (skill.content && skill.content.includes('## Benefits')) {
    const match = skill.content.match(/## Benefits\n([\s\S]*?)(?=\n##|$)/);
    if (match) {
      const lines = match[1].trim().split('\n');
      lines.forEach(line => {
        if (line.trim().startsWith('-')) {
          benefits.push(line.trim().substring(1).trim());
        }
      });
    }
  }

  // Generate contextual benefits based on analysis
  if (context.frameworks && context.frameworks.length > 0) {
    benefits.push(`Optimized for ${context.frameworks.join(', ')}`);
  }

  if (context.projectType) {
    benefits.push(`Tailored for ${context.projectType} projects`);
  }

  return benefits.length > 0 ? benefits : ['General best practices and patterns'];
}

/**
 * Build skill frontmatter from metadata.
 */
function buildSkillFrontmatter(metadata) {
  const lines = ['---'];

  lines.push(`name: ${metadata.name}`);
  lines.push(`description: ${metadata.description}`);

  if (metadata.domain) {
    lines.push(`domain: ${metadata.domain}`);
  }

  if (metadata.domains && metadata.domains.length > 0) {
    lines.push(`domains:`);
    metadata.domains.forEach(d => lines.push(`  - ${d}`));
  }

  if (metadata.focusAreas && metadata.focusAreas.length > 0) {
    lines.push(`focusAreas:`);
    metadata.focusAreas.forEach(area => lines.push(`  - ${area}`));
  }

  if (metadata.projectContext?.stack?.frameworks) {
    lines.push(`requiredFrameworks:`);
    metadata.projectContext.stack.frameworks.forEach(f => lines.push(`  - ${f}`));
  }

  if (metadata.analysisResults?.dependencies?.allDependencies) {
    const deps = Object.keys(metadata.analysisResults.dependencies.allDependencies).slice(0, 5);
    if (deps.length > 0) {
      lines.push(`requiredDependencies:`);
      deps.forEach(d => lines.push(`  - ${d}`));
    }
  }

  if (metadata.analysisResults?.patterns?.testing?.hasTests) {
    lines.push(`requiresTesting: true`);
  }

  if (metadata.projectContext?.projectType) {
    lines.push(`projectTypes:`);
    lines.push(`  - ${metadata.projectContext.projectType}`);
  }

  lines.push('---');

  return lines.join('\n');
}

/**
 * Build skill content from analysis results.
 */
function buildSkillContent({ analysisResults, projectContext, focusAreas }) {
  const sections = [];

  // Introduction
  sections.push('## Introduction');
  sections.push('');
  sections.push(`This skill provides guidance for working with ${projectContext?.projectName || 'this project'}.`);
  sections.push('');

  // Tech Stack
  if (projectContext?.stack) {
    sections.push('## Tech Stack');
    sections.push('');
    sections.push('This project uses:');
    sections.push(formatTechStack(projectContext.stack));
    sections.push('');
  }

  // Architecture
  if (analysisResults?.patterns?.architecture) {
    sections.push('## Architecture');
    sections.push('');
    sections.push(`Architecture Pattern: ${analysisResults.patterns.architecture.pattern}`);
    if (analysisResults.patterns.architecture.indicators.length > 0) {
      sections.push('Indicators:');
      analysisResults.patterns.architecture.indicators.forEach(ind => {
        sections.push(`- ${ind}`);
      });
    }
    sections.push('');
  }

  // File Organization
  if (analysisResults?.patterns?.directories) {
    sections.push('## File Organization');
    sections.push('');
    sections.push('Key directories:');
    for (const [key, value] of Object.entries(analysisResults.patterns.directories)) {
      if (value && value !== 'null') {
        sections.push(`- ${key}: ${value}`);
      }
    }
    sections.push('');
  }

  // Conventions
  if (analysisResults?.conventions) {
    sections.push('## Code Conventions');
    sections.push('');

    if (analysisResults.conventions.naming) {
      sections.push('### Naming');
      sections.push('');
      sections.push(`Files: ${analysisResults.conventions.naming.files.style || 'mixed'}`);
      sections.push(`Directories: ${analysisResults.conventions.naming.directories.style || 'mixed'}`);
      sections.push('');
    }

    if (analysisResults.conventions.testing?.framework) {
      sections.push('### Testing');
      sections.push('');
      sections.push(`Framework: ${analysisResults.conventions.testing.framework}`);
      sections.push(`Pattern: ${analysisResults.conventions.testing.namingPattern || 'unknown'}`);
      sections.push('');
    }
  }

  // Focus Areas
  if (focusAreas.length > 0) {
    sections.push('## Focus Areas');
    sections.push('');
    focusAreas.forEach(area => {
      sections.push(`### ${area}`);
      sections.push('');
      sections.push('Guidance for this area would be specific to the skill template.');
      sections.push('');
    });
  }

  // Best Practices
  sections.push('## Best Practices');
  sections.push('');
  sections.push('- Follow the established patterns in this codebase');
  sections.push('- Maintain consistency with existing conventions');
  sections.push('- Test your changes before committing');
  sections.push('');

  return sections.join('\n');
}

/**
 * Substitute placeholders in template with context values.
 */
function substitutePlaceholders(template, context) {
  let result = template;

  // Simple {{KEY}} placeholder substitution
  const placeholders = {
    '{{SKILL_NAME}}': context.skillName,
    '{{SKILL_DESCRIPTION}}': context.skillDescription,
    '{{PROJECT_NAME}}': context.projectName,
    '{{PROJECT_TYPE}}': context.projectType,
    '{{TECH_STACK}}': context.techStack,
    '{{FRAMEWORKS}}': context.frameworks,
    '{{DEPENDENCIES}}': context.dependencies,
    '{{PRIMARY_LANGUAGE}}': context.primaryLanguage,
    '{{DETECTED_PATTERNS}}': context.detectedPatterns,
    '{{CONVENTIONS}}': context.conventions,
    '{{CUSTOM_INSTRUCTIONS}}': context.customInstructions
  };

  for (const [placeholder, value] of Object.entries(placeholders)) {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value || '');
  }

  return result;
}

/**
 * Format tech stack as markdown list.
 */
function formatTechStack(stack) {
  const lines = [];

  if (stack.language) {
    lines.push(`- **Language**: ${stack.language}`);
  }

  if (stack.frameworks && stack.frameworks.length > 0) {
    lines.push(`- **Frameworks**: ${stack.frameworks.join(', ')}`);
  }

  if (stack.backend && stack.backend.length > 0) {
    lines.push(`- **Backend**: ${stack.backend.join(', ')}`);
  }

  if (stack.frontend && stack.frontend.length > 0) {
    lines.push(`- **Frontend**: ${stack.frontend.join(', ')}`);
  }

  if (stack.datastores && stack.datastores.length > 0) {
    lines.push(`- **Datastores**: ${stack.datastores.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format a list as comma-separated string.
 */
function formatList(items) {
  if (!items || items.length === 0) return 'none';
  return items.join(', ');
}

/**
 * Format analysis patterns as markdown.
 */
function formatPatterns(patterns) {
  const lines = [];

  if (patterns.architecture) {
    lines.push(`Architecture: ${patterns.architecture.pattern}`);
  }

  if (patterns.testing?.hasTests) {
    lines.push(`Testing: Yes (${patterns.testing.frameworks.join(', ')})`);
  }

  if (patterns.sourceFiles?.languages.length > 0) {
    lines.push(`Languages: ${patterns.sourceFiles.languages.join(', ')}`);
  }

  return lines.join('\n');
}

/**
 * Format conventions as markdown.
 */
function formatConventions(conventions) {
  const lines = [];

  if (conventions.naming?.files?.style) {
    lines.push(`File naming: ${conventions.naming.files.style}`);
  }

  if (conventions.organization?.groupingStrategy) {
    lines.push(`Organization: ${conventions.organization.groupingStrategy}`);
  }

  if (conventions.testing?.framework) {
    lines.push(`Testing framework: ${conventions.testing.framework}`);
  }

  return lines.join('\n');
}

/**
 * Get confidence label from score.
 */
function getConfidenceLabel(score) {
  if (score >= 70) return 'High';
  if (score >= 50) return 'Medium';
  if (score >= 30) return 'Low';
  return 'Very Low';
}

/**
 * Convert analysis results to context object.
 */
function analysisResultsToContext(skill) {
  // Extract relevant context from skill metadata or analysis
  return {
    frameworks: skill.requiredFrameworks || [],
    projectType: skill.projectTypes?.[0] || 'web application',
    stack: {
      frameworks: skill.requiredFrameworks || [],
      dependencies: skill.requiredDependencies || []
    }
  };
}

/**
 * Format a skill for display (e.g., in CLI output).
 */
export function formatSkillForDisplay(skill, score, reasons = []) {
  const lines = [];

  // Header with name and score
  const scoreColor = score >= 70 ? chalk.green : score >= 50 ? chalk.yellow : chalk.gray;
  lines.push(chalk.bold(`${skill.name} ${scoreColor(`(${score}% confidence)`)}`));

  // Description
  if (skill.description) {
    lines.push(chalk.gray(`  ${skill.description}`));
  }

  // Domains
  if (skill.domains && skill.domains.length > 0) {
    lines.push(chalk.gray(`  Domains: ${skill.domains.join(', ')}`));
  }

  // Reasons
  if (reasons.length > 0) {
    lines.push('');
    lines.push(chalk.gray('  Why this skill:'));
    reasons.forEach(reason => {
      lines.push(chalk.gray(`    • ${reason}`));
    });
  }

  return lines.join('\n');
}

/**
 * Generate installation preview for a skill.
 */
export async function generateInstallationPreview(skill, targetPath) {
  const preview = {
    skillName: skill.name,
    targetPath: path.join(targetPath, `${skill.name}.skill.md`),
    size: skill.content ? skill.content.length : 0,
    sections: extractSections(skill.content || '')
  };

  return preview;
}

/**
 * Extract sections from skill content.
 */
function extractSections(content) {
  const sections = [];
  const lines = content.split('\n');

  for (const line of lines) {
    if (line.startsWith('##')) {
      sections.push(line.replace(/^##\s*/, ''));
    }
  }

  return sections;
}
