/**
 * Tests for skill-generator.js
 */

import {
  generateSkillContent,
  generateSkillFromAnalysis,
  generateSkillRecommendation,
  formatSkillForDisplay,
  generateInstallationPreview
} from '../../lib/generators/skill-generator.js';
import chalk from 'chalk';

jest.mock('chalk', () => ({
  bold: jest.fn(s => s),
  green: jest.fn(s => s),
  yellow: jest.fn(s => s),
  gray: jest.fn(s => s)
}));

describe('generateSkillContent', () => {
  test('should substitute placeholders in skill template', async () => {
    const skillTemplate = {
      content: `# {{SKILL_NAME}}

Description: {{SKILL_DESCRIPTION}}

## Project
Name: {{PROJECT_NAME}}
Type: {{PROJECT_TYPE}}

## Tech Stack
{{TECH_STACK}}

## Frameworks
{{FRAMEWORKS}}

## Primary Language
{{PRIMARY_LANGUAGE}}`
    };

    const context = {
      skillName: 'react-patterns',
      skillDescription: 'React component patterns',
      projectContext: {
        projectName: 'my-app',
        projectType: 'web application',
        stack: {
          language: 'JavaScript',
          frameworks: ['react', 'next'],
          dependencies: ['lodash', 'axios']
        }
      },
      analysisResults: {
        patterns: {
          architecture: { pattern: 'mvc' },
          testing: { hasTests: true, frameworks: ['jest'] }
        },
        conventions: {
          naming: { files: { style: 'kebab-case' } },
          testing: { framework: 'jest' }
        }
      }
    };

    const result = await generateSkillContent(skillTemplate, context);

    expect(result).toContain('# react-patterns');
    expect(result).toContain('Description: React component patterns');
    expect(result).toContain('Name: my-app');
    expect(result).toContain('Type: web application');
    expect(result).toContain('**Language**: JavaScript');
    expect(result).toContain('**Frameworks**: react, next');
    expect(result).toContain('react-patterns');
  });

  test('should handle missing context values', async () => {
    const skillTemplate = {
      content: `# {{SKILL_NAME}}

{{PROJECT_NAME}}`
    };

    const context = {};

    const result = await generateSkillContent(skillTemplate, context);

    expect(result).toContain('# ');
    expect(result).toContain('the project'); // default fallback
  });
});

describe('generateSkillFromAnalysis', () => {
  test('should generate skill from analysis results', async () => {
    const analysisResults = {
      dependencies: {
        primaryLanguage: 'JavaScript',
        allFrameworks: ['react', 'jest'],
        allDependencies: { react: '^18.0.0' }
      },
      patterns: {
        architecture: { pattern: 'mvc' },
        testing: { hasTests: true, frameworks: ['jest'] },
        directories: { src: 'src', components: 'src/components' }
      },
      conventions: {
        naming: { files: { style: 'kebab-case' } }
      }
    };

    const projectContext = {
      projectName: 'my-app',
      projectType: 'web application',
      stack: {
        language: 'JavaScript',
        frameworks: ['react'],
        dependencies: ['lodash']
      }
    };

    const options = {
      skillName: 'react-patterns',
      skillDescription: 'React component patterns',
      domain: 'frontend',
      focusAreas: ['Components', 'Hooks'],
      projectContext
    };

    const result = await generateSkillFromAnalysis(analysisResults, options);

    expect(result).toContain('---');
    expect(result).toContain('name: react-patterns');
    expect(result).toContain('description: React component patterns');
    expect(result).toContain('domain: frontend');
    expect(result).toContain('## Introduction');
    expect(result).toContain('## Tech Stack');
    expect(result).toContain('## Architecture');
    expect(result).toContain('## File Organization');
    expect(result).toContain('## Code Conventions');
  });

  test('should include frontmatter metadata', async () => {
    const analysisResults = {
      dependencies: {
        allFrameworks: ['express', 'jest'],
        allDependencies: { express: '^4.18.0' }
      },
      patterns: {
        architecture: { pattern: 'layered' },
        testing: { hasTests: true, frameworks: ['jest'] }
      }
    };

    const projectContext = {
      projectName: 'my-api',
      projectType: 'API / backend service',
      stack: {
        frameworks: ['express'],
        dependencies: ['cors']
      }
    };

    const options = {
      skillName: 'express-routes',
      skillDescription: 'Express routing patterns',
      domain: 'backend',
      focusAreas: ['Routes', 'Middleware'],
      projectContext
    };

    const result = await generateSkillFromAnalysis(analysisResults, options);

    expect(result).toContain('name: express-routes');
    expect(result).toContain('description: Express routing patterns');
    expect(result).toContain('domains:');
    expect(result).toContain('- backend');
    expect(result).toContain('focusAreas:');
    expect(result).toContain('- Routes');
    expect(result).toContain('requiredFrameworks:');
    expect(result).toContain('- express');
    expect(result).toContain('requiresTesting: true');
    expect(result).toContain('projectTypes:');
    expect(result).toContain('- API / backend service');
  });
});

describe('generateSkillRecommendation', () => {
  test('should generate skill recommendation with metadata', async () => {
    const skill = {
      name: 'react-hooks',
      description: 'React hooks patterns and best practices',
      content: `# React Hooks

## Benefits
- Optimized for React
- Modern hook patterns
- Performance tips`
    };

    const score = 75;
    const reasons = ['Framework match: react', 'Domain: frontend'];

    const result = await generateSkillRecommendation(skill, score, reasons);

    expect(result.name).toBe('react-hooks');
    expect(result.score).toBe(75);
    expect(result.confidence).toBe('High');
    expect(result.description).toBe('React hooks patterns and best practices');
    expect(result.domains).toEqual([]);
    expect(result.reasons).toEqual(reasons);
    expect(result.benefits).toContain('Optimized for React');
  });

  test('should extract benefits from skill content', async () => {
    const skill = {
      name: 'express-middleware',
      description: 'Express middleware patterns',
      content: `# Express Middleware

## Benefits
- Authentication handling
- Error management
- Request logging
- Response compression`
    };

    const result = await generateSkillRecommendation(skill, 50, []);

    expect(result.benefits).toContain('Authentication handling');
    expect(result.benefits).toContain('Error management');
    expect(result.benefits).toContain('Request logging');
    expect(result.benefits).toContain('Response compression');
  });

  test('should provide default benefits if none found', async () => {
    const skill = {
      name: 'generic-skill',
      description: 'Generic patterns',
      content: 'Some content without benefits section'
    };

    const result = await generateSkillRecommendation(skill, 30, []);

    expect(result.benefits).toContain('General best practices and patterns');
  });
});

describe('formatSkillForDisplay', () => {
  test('should format skill with high confidence', () => {
    const skill = {
      name: 'react-components',
      description: 'React component patterns',
      domains: ['frontend']
    };

    const score = 80;
    const reasons = ['Framework match: react', 'Domain: frontend'];

    const result = formatSkillForDisplay(skill, score, reasons);

    expect(result).toContain('react-components');
    expect(result).toContain('(80% confidence)');
    expect(chalk.bold).toHaveBeenCalled();
    expect(chalk.green).toHaveBeenCalled();
  });

  test('should format skill with medium confidence', () => {
    const skill = {
      name: 'vue-components',
      description: 'Vue component patterns',
      domains: ['frontend']
    };

    const score = 55;
    const reasons = ['Framework match: vue'];

    const result = formatSkillForDisplay(skill, score, reasons);

    expect(result).toContain('(55% confidence)');
    expect(chalk.yellow).toHaveBeenCalled();
  });

  test('should format skill with low confidence', () => {
    const skill = {
      name: 'angular-components',
      description: 'Angular component patterns',
      domains: ['frontend']
    };

    const score = 35;
    const reasons = ['Framework match: angular'];

    const result = formatSkillForDisplay(skill, score, reasons);

    expect(result).toContain('(35% confidence)');
    expect(chalk.gray).toHaveBeenCalled();
  });

  test('should include description and domains', () => {
    const skill = {
      name: 'testing-patterns',
      description: 'Testing best practices',
      domains: ['testing', 'quality']
    };

    const result = formatSkillForDisplay(skill, 70, []);

    expect(result).toContain('Testing best practices');
    expect(result).toContain('Domains: testing, quality');
  });

  test('should include reasons when provided', () => {
    const skill = {
      name: 'api-patterns',
      description: 'API design patterns',
      domains: ['backend']
    };

    const reasons = [
      'Framework match: express',
      'Dependencies: cors, helmet',
      'Structure match: api/'
    ];

    const result = formatSkillForDisplay(skill, 65, reasons);

    expect(result).toContain('Why this skill:');
    expect(result).toContain('Framework match: express');
    expect(result).toContain('Dependencies: cors, helmet');
    expect(result).toContain('Structure match: api/');
  });
});

describe('generateInstallationPreview', () => {
  test('should generate installation preview', async () => {
    const skill = {
      name: 'react-hooks',
      content: `# React Hooks

## Introduction
Hook patterns guide

## Benefits
- Performance
- Reusability
- Type safety`
    };

    const targetPath = '/test/project/.claude/skills';

    const result = await generateInstallationPreview(skill, targetPath);

    expect(result.skillName).toBe('react-hooks');
    expect(result.targetPath).toBe('/test/project/.claude/skills/react-hooks.skill.md');
    expect(result.size).toBeGreaterThan(0);
    expect(result.sections).toContain('Introduction');
    expect(result.sections).toContain('Benefits');
  });

  test('should extract sections from skill content', async () => {
    const skill = {
      name: 'full-skill',
      content: `# Full Skill

## Section 1
Content here

## Section 2
More content

## Section 3
Even more content`
    };

    const result = await generateInstallationPreview(skill, '/path');

    expect(result.sections).toContain('Section 1');
    expect(result.sections).toContain('Section 2');
    expect(result.sections).toContain('Section 3');
  });

  test('should handle empty skill content', async () => {
    const skill = {
      name: 'empty-skill',
      content: ''
    };

    const result = await generateInstallationPreview(skill, '/path');

    expect(result.skillName).toBe('empty-skill');
    expect(result.size).toBe(0);
    expect(result.sections).toEqual([]);
  });
});
