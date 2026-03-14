/**
 * Tests for relevance-scorer.js
 */

import {
  scoreSkill,
  scoreAllSkills,
  diversifyByDomains,
  displayScoredSkills,
  SCORING_WEIGHTS,
  CONFIDENCE_THRESHOLDS
} from '../../lib/generators/relevance-scorer.js';
import chalk from 'chalk';

jest.mock('chalk', () => ({
  bold: jest.fn(s => s),
  green: jest.fn(s => s),
  yellow: jest.fn(s => s),
  gray: jest.fn(s => s)
}));

describe('scoreSkill', () => {
  const mockAnalysisResults = {
    dependencies: {
      allFrameworks: ['express', 'react', 'jest'],
      allDependencies: { express: '^4.18.0', react: '^18.0.0', lodash: '^4.17.0' }
    },
    patterns: {
      testing: { hasTests: true, frameworks: ['jest'] },
      directories: { src: 'src', components: 'src/components', api: 'src/api' }
    },
    context: {
      projectType: 'web application'
    }
  };

  test('should score skill with framework match', () => {
    const skill = {
      name: 'express-middleware',
      description: 'Express middleware patterns',
      requiredFrameworks: ['express'],
      domains: ['backend']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.skill).toBe(skill);
    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons).toContain('Matches 1 framework(s): express');
  });

  test('should score skill with multiple framework matches', () => {
    const skill = {
      name: 'react-express',
      description: 'Full-stack patterns',
      requiredFrameworks: ['react', 'express'],
      domains: ['frontend', 'backend']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBeGreaterThan(30); // Should get bonus for multiple matches
    expect(result.reasons.some(r => r.includes('Matches 2 framework(s)'))).toBe(true);
  });

  test('should score skill with dependency match', () => {
    const skill = {
      name: 'lodash-patterns',
      description: 'Lodash utility patterns',
      requiredDependencies: ['lodash'],
      domains: ['utilities']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('dependenc'))).toBe(true);
  });

  test('should score skill with testing match', () => {
    const skill = {
      name: 'jest-patterns',
      description: 'Jest testing patterns',
      requiredFrameworks: ['jest'],
      requiresTesting: true,
      domains: ['testing']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('Testing'))).toBe(true);
  });

  test('should score skill with project type match', () => {
    const skill = {
      name: 'web-app-patterns',
      description: 'Web application patterns',
      projectTypes: ['web application'],
      domains: ['frontend']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('Project type'))).toBe(true);
  });

  test('should score skill with pattern match', () => {
    const skill = {
      name: 'api-patterns',
      description: 'API routing patterns',
      requiredPatterns: ['api/'],
      domains: ['backend']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('pattern'))).toBe(true);
  });

  test('should score skill with domain match', () => {
    const skill = {
      name: 'frontend-patterns',
      description: 'Frontend component patterns',
      domains: ['frontend']
    };

    const result = scoreSkill(skill, {
      ...mockAnalysisResults,
      dependencies: {
        allFrameworks: ['react'],
        allDependencies: {}
      }
    });

    expect(result.score).toBeGreaterThan(0);
    expect(result.reasons.some(r => r.includes('Domain'))).toBe(true);
  });

  test('should return low score for unrelated skill', () => {
    const skill = {
      name: 'rails-patterns',
      description: 'Ruby on Rails patterns',
      requiredFrameworks: ['rails'],
      domains: ['backend']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBe(0);
    expect(result.reasons).toEqual([]);
  });

  test('should normalize score to 0-100', () => {
    const skill = {
      name: 'perfect-match',
      description: 'Perfectly matching skill',
      requiredFrameworks: ['express', 'react', 'jest'],
      requiredDependencies: ['lodash'],
      requiresTesting: true,
      projectTypes: ['web application'],
      requiredPatterns: ['api/', 'src'],
      domains: ['frontend', 'backend', 'testing']
    };

    const result = scoreSkill(skill, mockAnalysisResults);

    expect(result.score).toBeLessThanOrEqual(100);
    expect(result.score).toBeGreaterThan(0);
  });

  test('should set confidence level based on score', () => {
    const highScoreSkill = {
      name: 'high',
      requiredFrameworks: ['express', 'react'],
      domains: ['backend']
    };

    const mediumScoreSkill = {
      name: 'medium',
      requiredFrameworks: ['express'],
      domains: ['backend']
    };

    const lowScoreSkill = {
      name: 'low',
      requiredFrameworks: ['jest'],
      domains: ['testing']
    };

    const highResult = scoreSkill(highScoreSkill, mockAnalysisResults);
    const mediumResult = scoreSkill(mediumScoreSkill, mockAnalysisResults);
    const lowResult = scoreSkill(lowScoreSkill, mockAnalysisResults);

    expect(highResult.confidence).toBe('high');
    expect(mediumResult.confidence).toBe('medium');
    expect(lowResult.confidence).toBe('low');
  });

  test('should respect custom weights', () => {
    const skill = {
      name: 'custom-weight',
      requiredFrameworks: ['express'],
      domains: ['backend']
    };

    const customWeights = {
      FRAMEWORK_MATCH: 50 // Higher than default
    };

    const result = scoreSkill(skill, mockAnalysisResults, { customWeights });

    expect(result.score).toBeGreaterThan(0);
  });

  test('should set passesThreshold flag', () => {
    const goodSkill = {
      name: 'good',
      requiredFrameworks: ['express'],
      domains: ['backend']
    };

    const badSkill = {
      name: 'bad',
      requiredFrameworks: ['rails'],
      domains: ['backend']
    };

    const goodResult = scoreSkill(goodSkill, mockAnalysisResults, { minThreshold: 30 });
    const badResult = scoreSkill(badSkill, mockAnalysisResults, { minThreshold: 30 });

    expect(goodResult.passesThreshold).toBe(true);
    expect(badResult.passesThreshold).toBe(false);
  });
});

describe('scoreAllSkills', () => {
  const mockAnalysisResults = {
    dependencies: {
      allFrameworks: ['express', 'react'],
      allDependencies: { express: '^4.18.0', react: '^18.0.0' }
    },
    patterns: {
      testing: { hasTests: true, frameworks: ['jest'] },
      directories: { src: 'src' }
    },
    context: {
      projectType: 'web application'
    }
  };

  test('should score all skills', () => {
    const skills = [
      { name: 'express', requiredFrameworks: ['express'], domains: ['backend'] },
      { name: 'react', requiredFrameworks: ['react'], domains: ['frontend'] },
      { name: 'jest', requiredFrameworks: ['jest'], domains: ['testing'] },
      { name: 'rails', requiredFrameworks: ['rails'], domains: ['backend'] }
    ];

    const result = scoreAllSkills(skills, mockAnalysisResults);

    expect(result.length).toBeGreaterThan(0);
    expect(result.length).toBeLessThanOrEqual(10); // Default maxSkills
  });

  test('should filter skills below threshold', () => {
    const skills = [
      { name: 'express', requiredFrameworks: ['express'], domains: ['backend'] },
      { name: 'rails', requiredFrameworks: ['rails'], domains: ['backend'] }
    ];

    const result = scoreAllSkills(skills, mockAnalysisResults, { minThreshold: 30 });

    expect(result.every(s => s.score >= 30)).toBe(true);
  });

  test('should respect maxSkills limit', () => {
    const skills = Array.from({ length: 20 }, (_, i) => ({
      name: `skill-${i}`,
      requiredFrameworks: ['express'],
      domains: ['backend']
    }));

    const result = scoreAllSkills(skills, mockAnalysisResults, { maxSkills: 5 });

    expect(result.length).toBeLessThanOrEqual(5);
  });

  test('should sort by score descending', () => {
    const skills = [
      { name: 'low', requiredFrameworks: ['jest'], domains: ['testing'] },
      { name: 'high', requiredFrameworks: ['express', 'react'], domains: ['backend', 'frontend'] },
      { name: 'medium', requiredFrameworks: ['express'], domains: ['backend'] }
    ];

    const result = scoreAllSkills(skills, mockAnalysisResults);

    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].score).toBeGreaterThanOrEqual(result[i + 1].score);
    }
  });
});

describe('diversifyByDomains', () => {
  test('should diversify across domains', () => {
    const scoredSkills = [
      {
        skill: { name: 'backend-1', domains: ['backend'] },
        score: 80
      },
      {
        skill: { name: 'frontend-1', domains: ['frontend'] },
        score: 75
      },
      {
        skill: { name: 'backend-2', domains: ['backend'] },
        score: 70
      },
      {
        skill: { name: 'testing-1', domains: ['testing'] },
        score: 65
      },
      {
        skill: { name: 'frontend-2', domains: ['frontend'] },
        score: 60
      }
    ];

    const result = diversifyByDomains(scoredSkills, 3);

    expect(result.length).toBe(3);
    const domains = result.map(s => s.skill.domains[0]);
    const uniqueDomains = new Set(domains);
    expect(uniqueDomains.size).toBeGreaterThan(1);
  });

  test('should prioritize higher scores', () => {
    const scoredSkills = [
      {
        skill: { name: 'backend-high', domains: ['backend'] },
        score: 90
      },
      {
        skill: { name: 'frontend-low', domains: ['frontend'] },
        score: 40
      },
      {
        skill: { name: 'testing-medium', domains: ['testing'] },
        score: 70
      }
    ];

    const result = diversifyByDomains(scoredSkills, 2);

    expect(result[0].skill.name).toBe('backend-high');
    expect(result[0].score).toBe(90);
  });

  test('should fill remaining slots with any skills', () => {
    const scoredSkills = [
      {
        skill: { name: 'backend-1', domains: ['backend'] },
        score: 80
      },
      {
        skill: { name: 'backend-2', domains: ['backend'] },
        score: 75
      },
      {
        skill: { name: 'backend-3', domains: ['backend'] },
        score: 70
      }
    ];

    const result = diversifyByDomains(scoredSkills, 3);

    expect(result.length).toBe(3);
  });

  test('should handle skills with no domains', () => {
    const scoredSkills = [
      {
        skill: { name: 'no-domain', domains: [] },
        score: 80
      },
      {
        skill: { name: 'backend', domains: ['backend'] },
        score: 70
      }
    ];

    const result = diversifyByDomains(scoredSkills, 2);

    expect(result.length).toBe(2);
  });
});

describe('displayScoredSkills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('should display skills with colored scores', () => {
    const scoredSkills = [
      {
        skill: {
          name: 'react-hooks',
          description: 'React hook patterns',
          domains: ['frontend']
        },
        score: 85,
        confidence: 'high',
        reasons: ['Framework match: react']
      },
      {
        skill: {
          name: 'express-routes',
          description: 'Express routing',
          domains: ['backend']
        },
        score: 60,
        confidence: 'medium',
        reasons: ['Framework match: express']
      }
    ];

    displayScoredSkills(scoredSkills, { verbose: true });

    expect(console.log).toHaveBeenCalled();
    expect(chalk.bold).toHaveBeenCalled();
    expect(chalk.green).toHaveBeenCalled();
    expect(chalk.yellow).toHaveBeenCalled();
  });

  test('should display JSON format', () => {
    const scoredSkills = [
      {
        skill: { name: 'test-skill' },
        score: 70,
        confidence: 'high',
        reasons: []
      }
    ];

    displayScoredSkills(scoredSkills, { json: true });

    const output = console.log.mock.calls.flat().join('');
    const parsed = JSON.parse(output);

    expect(parsed).toHaveLength(1);
    expect(parsed[0]).toHaveProperty('skill');
    expect(parsed[0]).toHaveProperty('score', 70);
  });

  test('should display empty message for no skills', () => {
    displayScoredSkills([], {});

    expect(console.log).toHaveBeenCalled();
  });

  test('should include domains in output', () => {
    const scoredSkills = [
      {
        skill: {
          name: 'multi-domain',
          description: 'Multi-domain patterns',
          domains: ['frontend', 'backend']
        },
        score: 70,
        confidence: 'high',
        reasons: []
      }
    ];

    displayScoredSkills(scoredSkills, { verbose: false });

    const output = console.log.mock.calls.flat().join('');
    expect(output).toContain('Domains: frontend, backend');
  });
});

describe('SCORING_WEIGHTS', () => {
  test('should have correct scoring weights', () => {
    expect(SCORING_WEIGHTS.FRAMEWORK_MATCH).toBe(30);
    expect(SCORING_WEIGHTS.DEPENDENCY_MATCH).toBe(20);
    expect(SCORING_WEIGHTS.TESTING_MATCH).toBe(15);
    expect(SCORING_WEIGHTS.PROJECT_TYPE_MATCH).toBe(15);
    expect(SCORING_WEIGHTS.PATTERN_MATCH).toBe(10);
    expect(SCORING_WEIGHTS.DOMAIN_RELEVANCE).toBe(10);
  });
});

describe('CONFIDENCE_THRESHOLDS', () => {
  test('should have correct thresholds', () => {
    expect(CONFIDENCE_THRESHOLDS.HIGH).toBe(70);
    expect(CONFIDENCE_THRESHOLDS.MEDIUM).toBe(50);
    expect(CONFIDENCE_THRESHOLDS.LOW).toBe(30);
  });
});
