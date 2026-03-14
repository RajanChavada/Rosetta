import chalk from 'chalk';

/**
 * Scores skill relevance based on analysis results and skill metadata.
 * Implements the scoring algorithm from SKILL_IDEATION_DESIGN.md.
 */

/**
 * Scoring weights from the design document.
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
 * Confidence thresholds.
 */
const CONFIDENCE_THRESHOLDS = {
  HIGH: 70,
  MEDIUM: 50,
  LOW: 30
};

/**
 * Score a single skill against analysis results.
 */
export function scoreSkill(skill, analysisResults, options = {}) {
  const {
    customWeights = {},
    minThreshold = CONFIDENCE_THRESHOLDS.LOW
  } = options;

  // Merge custom weights with defaults
  const weights = { ...SCORING_WEIGHTS, ...customWeights };

  let score = 0;
  const reasons = [];

  // Parse skill metadata
  const metadata = parseSkillMetadata(skill);

  // 1. Framework matching (+30 per match)
  if (metadata.requiredFrameworks && metadata.requiredFrameworks.length > 0) {
    const frameworkMatches = countMatches(
      metadata.requiredFrameworks,
      analysisResults.dependencies?.allFrameworks || []
    );

    if (frameworkMatches > 0) {
      const frameworkScore = Math.min(frameworkMatches * weights.FRAMEWORK_MATCH, weights.FRAMEWORK_MATCH * 2);
      score += frameworkScore;
      reasons.push(`Matches ${frameworkMatches} framework(s): ${metadata.requiredFrameworks.join(', ')}`);
    }
  }

  // 2. Dependency matching (+20 per match)
  if (metadata.requiredDependencies && metadata.requiredDependencies.length > 0) {
    const depMatches = countMatches(
      metadata.requiredDependencies,
      Object.keys(analysisResults.dependencies?.allDependencies || {})
    );

    if (depMatches > 0) {
      const depScore = Math.min(depMatches * weights.DEPENDENCY_MATCH, weights.DEPENDENCY_MATCH * 2);
      score += depScore;
      reasons.push(`Matches ${depMatches} dependenc(y/ies): ${metadata.requiredDependencies.slice(0, 3).join(', ')}`);
    }
  }

  // 3. Testing setup matching (+15)
  if (metadata.requiresTesting) {
    const hasTesting = analysisResults.patterns?.testing?.hasTests ||
                      analysisResults.patterns?.testing?.frameworks?.length > 0;

    if (hasTesting) {
      score += weights.TESTING_MATCH;
      const frameworks = analysisResults.patterns.testing.frameworks.join(', ');
      reasons.push(`Testing setup detected (${frameworks})`);
    }
  }

  // 4. Project type matching (+15)
  if (metadata.projectTypes && metadata.projectTypes.length > 0) {
    const projectType = analysisResults.context?.projectType ||
                       analysisResults.dependencies?.primaryLanguage ||
                       'web application';

    if (metadata.projectTypes.includes(projectType)) {
      score += weights.PROJECT_TYPE_MATCH;
      reasons.push(`Project type matches: ${projectType}`);
    }
  }

  // 5. File/directory pattern matching (+10 per pattern)
  if (metadata.requiredPatterns && metadata.requiredPatterns.length > 0) {
    const patternMatches = checkPatterns(
      metadata.requiredPatterns,
      analysisResults.patterns || {}
    );

    if (patternMatches > 0) {
      const patternScore = Math.min(patternMatches * weights.PATTERN_MATCH, weights.PATTERN_MATCH * 2);
      score += patternScore;
      reasons.push(`Matches ${patternMatches} file/director(y/ies) pattern(s)`);
    }
  }

  // 6. Domain relevance (+10)
  if (metadata.domains && metadata.domains.length > 0) {
    const detectedDomains = detectDomains(analysisResults);
    const domainMatches = countMatches(metadata.domains, detectedDomains);

    if (domainMatches > 0) {
      const domainScore = Math.min(domainMatches * weights.DOMAIN_RELEVANCE, weights.DOMAIN_RELEVANCE * 2);
      score += domainScore;
      reasons.push(`Relevant to domain(s): ${metadata.domains.join(', ')}`);
    }
  }

  // Normalize score to 0-100
  const normalizedScore = Math.min(100, Math.round(score));

  return {
    skill,
    score: normalizedScore,
    confidence: getConfidenceLevel(normalizedScore),
    reasons,
    passesThreshold: normalizedScore >= minThreshold
  };
}

/**
 * Score multiple skills and return sorted results.
 */
export function scoreAllSkills(skills, analysisResults, options = {}) {
  const {
    maxSkills = 10,
    minThreshold = CONFIDENCE_THRESHOLDS.LOW,
    diversifyBy = 'domains'
  } = options;

  // Score all skills
  const scoredSkills = skills.map(skill =>
    scoreSkill(skill, analysisResults, { minThreshold, ...options })
  );

  // Filter out skills that don't pass threshold
  const passingSkills = scoredSkills.filter(s => s.passesThreshold);

  // Diversify selection if requested
  let diversifiedSkills;
  if (diversifyBy === 'domains') {
    diversifiedSkills = diversifyByDomains(passingSkills, maxSkills);
  } else if (diversifyBy === 'score') {
    diversifiedSkills = passingSkills.sort((a, b) => b.score - a.score).slice(0, maxSkills);
  } else {
    diversifiedSkills = passingSkills;
  }

  // Sort by confidence score
  diversifiedSkills.sort((a, b) => b.score - a.score);

  return diversifiedSkills.slice(0, maxSkills);
}

/**
 * Diversify skill selection by ensuring different domains are represented.
 */
export function diversifyByDomains(scoredSkills, maxSkills) {
  const selected = [];
  const seenDomains = new Set();

  // Sort by score first
  const sorted = [...scoredSkills].sort((a, b) => b.score - a.score);

  for (const scoredSkill of sorted) {
    if (selected.length >= maxSkills) break;

    const skillDomains = scoredSkill.skill.domains || [];
    const hasNewDomain = skillDomains.some(d => !seenDomains.has(d));

    if (hasNewDomain || skillDomains.length === 0) {
      selected.push(scoredSkill);
      skillDomains.forEach(d => seenDomains.add(d));
    }
  }

  // If we still have room, add more skills even with overlapping domains
  if (selected.length < maxSkills && sorted.length > selected.length) {
    for (const scoredSkill of sorted) {
      if (selected.length >= maxSkills) break;
      if (!selected.includes(scoredSkill)) {
        selected.push(scoredSkill);
      }
    }
  }

  return selected;
}

/**
 * Parse skill metadata from skill content or object.
 */
function parseSkillMetadata(skill) {
  const metadata = {
    name: skill.name,
    description: skill.description,
    domains: [],
    requiredFrameworks: [],
    requiredDependencies: [],
    requiredPatterns: [],
    projectTypes: [],
    requiresTesting: false
  };

  // If skill has metadata directly
  if (skill.domains) metadata.domains = skill.domains;
  if (skill.requiredFrameworks) metadata.requiredFrameworks = skill.requiredFrameworks;
  if (skill.requiredDependencies) metadata.requiredDependencies = skill.requiredDependencies;
  if (skill.requiredPatterns) metadata.requiredPatterns = skill.requiredPatterns;
  if (skill.projectTypes) metadata.projectTypes = skill.projectTypes;
  if (skill.requiresTesting !== undefined) metadata.requiresTesting = skill.requiresTesting;

  // If skill has frontmatter in content
  if (skill.content && skill.content.includes('---')) {
    const frontmatter = extractFrontmatter(skill.content);

    if (frontmatter.domains) metadata.domains = frontmatter.domains;
    if (frontmatter.requiredFrameworks) metadata.requiredFrameworks = frontmatter.requiredFrameworks;
    if (frontmatter.requiredDependencies) metadata.requiredDependencies = frontmatter.requiredDependencies;
    if (frontmatter.requiredPatterns) metadata.requiredPatterns = frontmatter.requiredPatterns;
    if (frontmatter.projectTypes) metadata.projectTypes = frontmatter.projectTypes;
    if (frontmatter.requiresTesting !== undefined) metadata.requiresTesting = frontmatter.requiresTesting;
  }

  return metadata;
}

/**
 * Extract frontmatter from skill content.
 */
function extractFrontmatter(content) {
  const frontmatter = {};
  const lines = content.split('\n');

  let inFrontmatter = false;
  for (const line of lines) {
    if (line.trim() === '---') {
      inFrontmatter = !inFrontmatter;
      continue;
    }

    if (inFrontmatter) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim();

        // Parse list values
        if (value.startsWith('-')) {
          frontmatter[key] = [];
          const listLines = [line];
          // Continue collecting list items
          for (let i = lines.indexOf(line) + 1; i < lines.length; i++) {
            if (lines[i].trim().startsWith('-')) {
              listLines.push(lines[i]);
            } else if (lines[i].trim() && !lines[i].trim().startsWith('-')) {
              break;
            }
          }
          frontmatter[key] = listLines.map(l => l.replace(/-\s*/, '').trim());
        } else {
          // Parse boolean values
          if (value === 'true') {
            frontmatter[key] = true;
          } else if (value === 'false') {
            frontmatter[key] = false;
          } else {
            frontmatter[key] = value.replace(/"/g, '');
          }
        }
      }
    }
  }

  return frontmatter;
}

/**
 * Count matches between two arrays (case-insensitive).
 */
function countMatches(arr1, arr2) {
  const lowerArr1 = arr1.map(s => s.toLowerCase());
  const lowerArr2 = arr2.map(s => s.toLowerCase());

  return lowerArr1.filter(item =>
    lowerArr2.some(target =>
      target.includes(item) || item.includes(target)
    )
  ).length;
}

/**
 * Check if required patterns exist in analysis results.
 */
function checkPatterns(requiredPatterns, patterns) {
  let matches = 0;

  for (const pattern of requiredPatterns) {
    // Check file patterns
    if (patterns.sourceFiles?.languages?.includes(pattern)) {
      matches++;
      continue;
    }

    // Check directory patterns
    const dirs = patterns.directories || {};
    for (const [key, value] of Object.entries(dirs)) {
      if (value && (value.includes(pattern) || key.includes(pattern))) {
        matches++;
        break;
      }
    }

    // Check for specific files
    const keyPattern = pattern.toLowerCase().replace(/\./g, '');
    for (const [key, value] of Object.entries(patterns)) {
      if (key.toLowerCase().includes(keyPattern)) {
        matches++;
        break;
      }
    }
  }

  return matches;
}

/**
 * Detect domains from analysis results.
 */
function detectDomains(analysisResults) {
  const domains = [];

  const frameworks = analysisResults.dependencies?.allFrameworks || [];
  const patterns = analysisResults.patterns || {};

  // Frontend domain
  if (frameworks.some(f => ['react', 'vue', 'svelte', 'angular', 'next', 'nuxt'].includes(f))) {
    domains.push('frontend');
  }

  // Backend domain
  if (frameworks.some(f => ['express', 'nest', 'fastify', 'django', 'flask', 'rails', 'spring'].includes(f))) {
    domains.push('backend');
  }

  // Database domain
  if (frameworks.some(f => ['postgres', 'mysql', 'mongodb', 'redis', 'prisma', 'sequelize', 'mongoose'].includes(f))) {
    domains.push('database');
  }

  // Testing domain
  if (patterns.testing?.hasTests || patterns.testing?.frameworks?.length > 0) {
    domains.push('testing');
  }

  // API domain
  if (patterns.directories?.api || frameworks.some(f => ['express', 'nest', 'fastapi', 'django'].includes(f))) {
    domains.push('api');
  }

  // Data/ML domain
  if (frameworks.some(f => ['pandas', 'numpy', 'tensorflow', 'pytorch', 'scikit'].includes(f))) {
    domains.push('data');
  }

  // Deployment/DevOps domain
  if (patterns.directories?.docker || patterns.directories?.cicd || patterns.directories?.infrastructure) {
    domains.push('deployment');
  }

  return domains;
}

/**
 * Get confidence level from score.
 */
function getConfidenceLevel(score) {
  if (score >= CONFIDENCE_THRESHOLDS.HIGH) return 'high';
  if (score >= CONFIDENCE_THRESHOLDS.MEDIUM) return 'medium';
  if (score >= CONFIDENCE_THRESHOLDS.LOW) return 'low';
  return 'very low';
}

/**
 * Display scored skills to user.
 */
export function displayScoredSkills(scoredSkills, options = {}) {
  const { verbose = false, json = false } = options;

  if (json) {
    console.log(JSON.stringify(scoredSkills, null, 2));
    return;
  }

  if (scoredSkills.length === 0) {
    console.log(chalk.yellow('No skills found that match your project.'));
    return;
  }

  console.log(chalk.bold('\n💡 Suggested Skills for Your Project\n'));

  scoredSkills.forEach((scoredSkill, index) => {
    const { skill, score, confidence, reasons } = scoredSkill;

    // Skill name with score
    const scoreColor = score >= 70 ? chalk.green : score >= 50 ? chalk.yellow : chalk.gray;
    console.log(`${chalk.bold(index + 1)}. ${skill.name} ${scoreColor(`(${score}% confidence)`)}`);

    // Description
    if (skill.description) {
      console.log(chalk.gray(`   ${skill.description}`));
    }

    // Domains
    if (skill.domains && skill.domains.length > 0) {
      console.log(chalk.gray(`   Domains: ${skill.domains.join(', ')}`));
    }

    // Verbose reasons
    if (verbose && reasons.length > 0) {
      console.log(chalk.gray('   Why this skill:'));
      reasons.forEach(reason => {
        console.log(chalk.gray(`     • ${reason}`));
      });
    }

    console.log('');
  });
}

/**
 * Export scoring constants for external use.
 */
export {
  SCORING_WEIGHTS,
  CONFIDENCE_THRESHOLDS
};
