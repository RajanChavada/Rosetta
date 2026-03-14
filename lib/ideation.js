import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { analyzeDependencies } from './analyzers/dependency-analyzer.js';
import { analyzeCodePatterns } from './analyzers/code-pattern-analyzer.js';

/**
 * Scoring weights for different match criteria.
 */
const SCORING_WEIGHTS = {
  FRAMEWORK_MATCH: 30,
  DEPENDENCY_MATCH: 20,
  TESTING_MATCH: 15,
  PROJECT_TYPE_MATCH: 15,
  PATTERN_MATCH: 10,
  DOMAIN_RELEVANCE: 10
};

/**
 * Minimum confidence threshold for skill suggestions.
 */
const MIN_CONFIDENCE_THRESHOLD = 30;

/**
 * Maximum number of skills to suggest.
 */
const MAX_SUGGESTIONS = 5;

/**
 * Main ideation engine - analyzes codebase and suggests relevant skills.
 *
 * @param {string} projectPath - Path to the project directory
 * @param {Array} availableSkills - Array of skill objects with metadata
 * @returns {Promise<Array>} - Array of suggested skills with confidence scores
 */
export async function ideateSkills(projectPath, availableSkills = []) {
  console.log(chalk.cyan('Analyzing codebase for skill suggestions...'));

  // Step 1: Analyze codebase
  const dependencyAnalysis = await analyzeDependencies(projectPath);
  const patternAnalysis = await analyzeCodePatterns(projectPath);

  // Build context object
  const context = {
    dependencies: dependencyAnalysis,
    patterns: patternAnalysis,
    primaryLanguage: dependencyAnalysis.primaryLanguage,
    frameworks: dependencyAnalysis.allFrameworks,
    allDependencies: dependencyAnalysis.allDependencies,
    hasTests: patternAnalysis.testing.hasTests,
    testFrameworks: patternAnalysis.testing.frameworks,
    architecture: patternAnalysis.architecture.pattern
  };

  console.log(chalk.gray(`  Detected language: ${context.primaryLanguage || 'Unknown'}`));
  console.log(chalk.gray(`  Detected frameworks: ${context.frameworks.join(', ') || 'None'}`));
  console.log(chalk.gray(`  Testing setup: ${context.testFrameworks.join(', ') || 'None'}`));

  // Step 2: Score all available skills
  const scoredSkills = [];

  for (const skill of availableSkills) {
    const score = await calculateMatchScore(context, skill);

    if (score >= MIN_CONFIDENCE_THRESHOLD) {
      scoredSkills.push({
        skill,
        score,
        reasons: getMatchReasons(context, skill)
      });
    }
  }

  // Step 3: Sort by score and limit to top suggestions
  const sortedSkills = scoredSkills
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS * 2); // Get more candidates for diversification

  // Step 4: Diversify selection
  const diversified = diversifySelection(sortedSkills, MAX_SUGGESTIONS);

  // Final sort by score
  const finalSuggestions = diversified
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_SUGGESTIONS);

  console.log(chalk.green(`  Found ${finalSuggestions.length} skill suggestion(s)`));

  return finalSuggestions;
}

/**
 * Calculate match score between context and skill.
 *
 * @param {Object} context - Codebase context
 * @param {Object} skill - Skill object with metadata
 * @returns {number} - Confidence score (0-100)
 */
async function calculateMatchScore(context, skill) {
  let score = 0;

  // Parse skill metadata
  const metadata = parseSkillMetadata(skill);

  // Framework matching (highest weight)
  if (metadata.requiredFrameworks && metadata.requiredFrameworks.length > 0) {
    for (const framework of metadata.requiredFrameworks) {
      if (context.frameworks.includes(framework.toLowerCase())) {
        score += SCORING_WEIGHTS.FRAMEWORK_MATCH;
        break;
      }
    }
  }

  // Dependency matching
  if (metadata.requiredDependencies && metadata.requiredDependencies.length > 0) {
    for (const dep of metadata.requiredDependencies) {
      if (Object.keys(context.allDependencies).some(k => k.toLowerCase().includes(dep.toLowerCase()))) {
        score += SCORING_WEIGHTS.DEPENDENCY_MATCH;
        break;
      }
    }
  }

  // Testing setup matching
  if (metadata.requiresTesting && context.hasTests) {
    score += SCORING_WEIGHTS.TESTING_MATCH;
  }

  // Project type matching
  if (metadata.projectTypes && metadata.projectTypes.length > 0) {
    const inferredType = inferProjectType(context);
    if (metadata.projectTypes.some(type => type.toLowerCase().includes(inferredType.toLowerCase()))) {
      score += SCORING_WEIGHTS.PROJECT_TYPE_MATCH;
    }
  }

  // File pattern matching
  if (metadata.requiredPatterns && metadata.requiredPatterns.length > 0) {
    for (const pattern of metadata.requiredPatterns) {
      if (hasFilePattern(context, pattern)) {
        score += SCORING_WEIGHTS.PATTERN_MATCH;
        break;
      }
    }
  }

  // Domain relevance
  if (metadata.domains && metadata.domains.length > 0) {
    const inferredDomains = inferDomains(context);
    if (metadata.domains.some(domain => inferredDomains.includes(domain.toLowerCase()))) {
      score += SCORING_WEIGHTS.DOMAIN_RELEVANCE;
    }
  }

  // Normalize to 0-100
  return Math.min(100, score);
}

/**
 * Parse skill metadata from skill content.
 *
 * @param {Object} skill - Skill object
 * @returns {Object} - Parsed metadata
 */
function parseSkillMetadata(skill) {
  const metadata = {
    requiredFrameworks: [],
    requiredDependencies: [],
    requiresTesting: false,
    projectTypes: [],
    requiredPatterns: [],
    domains: []
  };

  // If skill has explicit metadata, use it
  if (skill.metadata) {
    return { ...metadata, ...skill.metadata };
  }

  // If skill has frontmatter, parse it
  if (skill.content) {
    const frontmatterMatch = skill.content.match(/^---\n(.*?)\n---/s);
    if (frontmatterMatch) {
      try {
        const yaml = frontmatterMatch[1];
        const lines = yaml.split('\n');

        lines.forEach(line => {
          const [key, ...valueParts] = line.split(':');
          const value = valueParts.join(':').trim();

          switch (key.trim()) {
            case 'domains':
              metadata.domains = parseArray(value);
              break;
            case 'requiredFrameworks':
              metadata.requiredFrameworks = parseArray(value);
              break;
            case 'requiredDependencies':
              metadata.requiredDependencies = parseArray(value);
              break;
            case 'requiredPatterns':
              metadata.requiredPatterns = parseArray(value);
              break;
            case 'projectTypes':
              metadata.projectTypes = parseArray(value);
              break;
            case 'requiresTesting':
              metadata.requiresTesting = value.toLowerCase() === 'true';
              break;
          }
        });
      } catch (err) {
        // Ignore parse errors
      }
    }
  }

  return metadata;
}

/**
 * Parse array from YAML-like string.
 */
function parseArray(value) {
  // Handle [item1, item2] format
  const bracketMatch = value.match(/^\s*\[(.*)\]\s*$/);
  if (bracketMatch) {
    return bracketMatch[1].split(',').map(s => s.trim().replace(/^['"]|['"]$/g, ''));
  }

  // Handle multi-line or simple values
  return value.split(',').map(s => s.trim()).filter(s => s);
}

/**
 * Check if codebase has a specific file pattern.
 *
 * @param {Object} context - Codebase context
 * @param {string} pattern - Pattern to check
 * @returns {boolean}
 */
function hasFilePattern(context, pattern) {
  const patterns = context.patterns;

  // Check file patterns
  if (pattern === 'package.json' && patterns.hasPackageJson) return true;
  if (pattern === 'go.mod' && patterns.hasGoMod) return true;
  if (pattern === 'Cargo.toml' && patterns.hasCargoToml) return true;
  if (pattern === 'requirements.txt' && patterns.hasRequirementsTxt) return true;

  // Check directory patterns
  if (pattern === 'tests/' && patterns.directories.tests) return true;
  if (pattern === 'api/' && patterns.directories.api) return true;
  if (pattern === 'components/' && patterns.directories.components) return true;
  if (pattern === 'routes/' && patterns.directories.routes) return true;
  if (pattern === 'models/' && patterns.directories.models) return true;
  if (pattern === 'controllers/' && patterns.directories.controllers) return true;

  return false;
}

/**
 * Infer project type from context.
 *
 * @param {Object} context - Codebase context
 * @returns {string} - Inferred project type
 */
function inferProjectType(context) {
  const patterns = context.patterns;

  // Check for web app patterns
  if (patterns.directories.components || patterns.directories.pages) {
    return 'Web app';
  }

  // Check for API patterns
  if (patterns.directories.api || patterns.directories.routes) {
    return 'API / backend service';
  }

  // Check for testing patterns
  if (patterns.testing.hasTests && Object.keys(patterns.directories).length === 1) {
    return 'Testing framework';
  }

  // Check for CLI patterns
  if (context.frameworks.includes('commander') || context.frameworks.includes('yargs')) {
    return 'CLI tool';
  }

  // Default
  return 'Web app';
}

/**
 * Infer domains from context.
 *
 * @param {Object} context - Codebase context
 * @returns {Array} - Inferred domains
 */
function inferDomains(context) {
  const domains = [];

  // Frontend domain
  if (context.patterns.directories.components || context.patterns.directories.pages) {
    domains.push('frontend');
  }

  // Backend domain
  if (context.patterns.directories.api || context.patterns.directories.routes ||
      context.patterns.directories.controllers || context.patterns.directories.services) {
    domains.push('backend');
  }

  // Database domain
  if (context.patterns.directories.models || context.patterns.directories.migrations ||
      context.frameworks.some(f => ['prisma', 'sequelize', 'mongoose', 'typeorm'].includes(f))) {
    domains.push('database');
  }

  // Testing domain
  if (context.hasTests) {
    domains.push('testing');
  }

  // Deployment domain
  if (context.patterns.directories.docker || context.patterns.directories.infrastructure ||
      context.patterns.directories.cicd) {
    domains.push('deployment');
  }

  return domains;
}

/**
 * Get human-readable match reasons.
 *
 * @param {Object} context - Codebase context
 * @param {Object} skill - Skill object
 * @returns {Array} - Array of reason strings
 */
function getMatchReasons(context, skill) {
  const reasons = [];
  const metadata = parseSkillMetadata(skill);

  // Framework matches
  const matchingFrameworks = metadata.requiredFrameworks?.filter(f =>
    context.frameworks.includes(f.toLowerCase())
  );
  if (matchingFrameworks?.length > 0) {
    reasons.push(`Framework match: ${matchingFrameworks.join(', ')}`);
  }

  // Dependency matches
  const matchingDeps = metadata.requiredDependencies?.filter(d =>
    Object.keys(context.allDependencies).some(k => k.toLowerCase().includes(d.toLowerCase()))
  );
  if (matchingDeps?.length > 0) {
    reasons.push(`Dependencies: ${matchingDeps.join(', ')}`);
  }

  // Testing match
  if (metadata.requiresTesting && context.hasTests) {
    reasons.push(`Testing setup detected: ${context.testFrameworks.join(', ')}`);
  }

  // Pattern matches
  const matchingPatterns = metadata.requiredPatterns?.filter(p => hasFilePattern(context, p));
  if (matchingPatterns?.length > 0) {
    reasons.push(`Structure match: ${matchingPatterns.join(', ')}`);
  }

  // Domain match
  const inferredDomains = inferDomains(context);
  const matchingDomains = metadata.domains?.filter(d => inferredDomains.includes(d.toLowerCase()));
  if (matchingDomains?.length > 0) {
    reasons.push(`Domain: ${matchingDomains.join(', ')}`);
  }

  return reasons;
}

/**
 * Diversify selection to avoid multiple skills from same domain.
 *
 * @param {Array} scoredSkills - Array of scored skills
 * @param {number} maxSuggestions - Maximum number of suggestions
 * @returns {Array} - Diversified suggestions
 */
function diversifySelection(scoredSkills, maxSuggestions) {
  const selected = [];
  const seenDomains = new Set();

  for (const { skill, score } of scoredSkills) {
    if (selected.length >= maxSuggestions) break;

    const metadata = parseSkillMetadata(skill);
    const domains = metadata.domains || ['unknown'];

    // Check if any domain is already seen
    const hasNewDomain = domains.some(domain => !seenDomains.has(domain.toLowerCase()));

    if (hasNewDomain || seenDomains.size === 0) {
      selected.push({ skill, score });
      domains.forEach(domain => seenDomains.add(domain.toLowerCase()));
    }
  }

  return selected;
}

/**
 * Analyze codebase and return context object.
 * This is a convenience function for external use.
 *
 * @param {string} projectPath - Path to the project directory
 * @returns {Promise<Object>} - Codebase context
 */
export async function analyzeCodebase(projectPath) {
  const dependencyAnalysis = await analyzeDependencies(projectPath);
  const patternAnalysis = await analyzeCodePatterns(projectPath);

  return {
    dependencies: dependencyAnalysis,
    patterns: patternAnalysis,
    primaryLanguage: dependencyAnalysis.primaryLanguage,
    frameworks: dependencyAnalysis.allFrameworks,
    allDependencies: dependencyAnalysis.allDependencies,
    hasTests: patternAnalysis.testing.hasTests,
    testFrameworks: patternAnalysis.testing.frameworks,
    architecture: patternAnalysis.architecture.pattern
  };
}
