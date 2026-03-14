import { jest } from '@jest/globals';

// Mock the analyzers - must be before importing lib/ideation.js
jest.unstable_mockModule('../lib/analyzers/dependency-analyzer.js', () => ({
  analyzeDependencies: jest.fn()
}));
jest.unstable_mockModule('../lib/analyzers/code-pattern-analyzer.js', () => ({
  analyzeCodePatterns: jest.fn()
}));
jest.unstable_mockModule('fs-extra', () => ({
  default: {
    pathExists: jest.fn(),
    readJson: jest.fn(),
    writeJson: jest.fn()
  },
  pathExists: jest.fn(),
  readJson: jest.fn(),
  writeJson: jest.fn()
}));
jest.unstable_mockModule('chalk', () => ({
  default: {
    cyan: jest.fn(s => s),
    gray: jest.fn(s => s),
    green: jest.fn(s => s),
    yellow: jest.fn(s => s),
    bold: jest.fn(s => s)
  },
  cyan: jest.fn(s => s),
  gray: jest.fn(s => s),
  green: jest.fn(s => s),
  yellow: jest.fn(s => s),
  bold: jest.fn(s => s)
}));

// Import the modules under test using dynamic import AFTER mocking
const { ideateSkills, analyzeCodebase } = await import('../lib/ideation.js');
const fs = (await import('fs-extra')).default;
const path = await import('path');

describe('ideateSkills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Suppress console output
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    console.log.mockRestore();
  });

  test('should return empty array when no skills available', async () => {
    const mockDependencyAnalysis = {
      primaryLanguage: 'JavaScript',
      allFrameworks: ['express'],
      allDependencies: { express: '^4.18.0' },
      raw: {}
    };

    const mockPatternAnalysis = {
      hasPackageJson: true,
      hasGoMod: false,
      hasCargoToml: false,
      hasRequirementsTxt: false,
      directories: {
        tests: 'tests',
        src: 'src',
        api: 'src/api'
      },
      architecture: { pattern: 'mvc', indicators: ['MVC structure detected'] },
      testing: { hasTests: true, frameworks: ['jest'] },
      sourceFiles: { languages: ['javascript', 'typescript'] }
    };

    const dependencyAnalyzer = await import('../lib/analyzers/dependency-analyzer.js');
    const codePatternAnalyzer = await import('../lib/analyzers/code-pattern-analyzer.js');

    jest.spyOn(dependencyAnalyzer, 'analyzeDependencies').mockResolvedValue(mockDependencyAnalysis);
    jest.spyOn(codePatternAnalyzer, 'analyzeCodePatterns').mockResolvedValue(mockPatternAnalysis);

    const result = await ideateSkills('/test/project', []);

    expect(result).toEqual([]);
  });

  test('should score skills based on framework matches', async () => {
    const mockDependencyAnalysis = {
      primaryLanguage: 'JavaScript',
      allFrameworks: ['express', 'jest'],
      allDependencies: { express: '^4.18.0', jest: '^29.0.0' },
      raw: {}
    };

    const mockPatternAnalysis = {
      hasPackageJson: true,
      directories: { tests: 'tests', src: 'src' },
      architecture: { pattern: 'layered', indicators: [] },
      testing: { hasTests: true, frameworks: ['jest'] },
      sourceFiles: { languages: ['javascript'] }
    };

    const dependencyAnalyzer = await import('../lib/analyzers/dependency-analyzer.js');
    const codePatternAnalyzer = await import('../lib/analyzers/code-pattern-analyzer.js');

    jest.spyOn(dependencyAnalyzer, 'analyzeDependencies').mockResolvedValue(mockDependencyAnalysis);
    jest.spyOn(codePatternAnalyzer, 'analyzeCodePatterns').mockResolvedValue(mockPatternAnalysis);

    const skills = [
      {
        name: 'express-middleware',
        description: 'Express middleware patterns',
        metadata: {
          requiredFrameworks: ['express'],
          domains: ['backend']
        }
      },
      {
        name: 'vue-components',
        description: 'Vue component patterns',
        metadata: {
          requiredFrameworks: ['vue'],
          domains: ['frontend']
        }
      }
    ];

    const result = await ideateSkills('/test/project', skills);

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].skill.name).toBe('express-middleware');
    expect(result[0].score).toBeGreaterThanOrEqual(30); // MIN_CONFIDENCE_THRESHOLD
  });

  test('should diversify selection across domains', async () => {
    const mockDependencyAnalysis = {
      primaryLanguage: 'JavaScript',
      allFrameworks: ['express', 'react', 'jest'],
      allDependencies: { express: '^4.18.0', react: '^18.0.0', jest: '^29.0.0' },
      raw: {}
    };

    const mockPatternAnalysis = {
      hasPackageJson: true,
      directories: {
        tests: 'tests',
        src: 'src',
        components: 'src/components',
        api: 'src/api'
      },
      architecture: { pattern: 'mvc', indicators: [] },
      testing: { hasTests: true, frameworks: ['jest'] },
      sourceFiles: { languages: ['javascript', 'typescript'] }
    };

    const dependencyAnalyzer = await import('../lib/analyzers/dependency-analyzer.js');
    const codePatternAnalyzer = await import('../lib/analyzers/code-pattern-analyzer.js');

    jest.spyOn(dependencyAnalyzer, 'analyzeDependencies').mockResolvedValue(mockDependencyAnalysis);
    jest.spyOn(codePatternAnalyzer, 'analyzeCodePatterns').mockResolvedValue(mockPatternAnalysis);

    const skills = [
      {
        name: 'express-middleware',
        description: 'Express middleware patterns',
        metadata: {
          requiredFrameworks: ['express'],
          domains: ['backend']
        }
      },
      {
        name: 'react-components',
        description: 'React component patterns',
        metadata: {
          requiredFrameworks: ['react'],
          domains: ['frontend']
        }
      },
      {
        name: 'jest-testing',
        description: 'Jest testing patterns',
        metadata: {
          requiredFrameworks: ['jest'],
          domains: ['testing']
        }
      }
    ];

    const result = await ideateSkills('/test/project', skills);

    // Should have diverse domains (not all backend or all frontend)
    const domains = result.map(r => r.skill.metadata.domains[0]);
    const uniqueDomains = new Set(domains);
    expect(uniqueDomains.size).toBeGreaterThan(1);
  });
});

describe('analyzeCodebase', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should combine dependency and pattern analysis', async () => {
    const mockDependencyAnalysis = {
      primaryLanguage: 'JavaScript',
      allFrameworks: ['express'],
      allDependencies: { express: '^4.18.0' },
      raw: {}
    };

    const mockPatternAnalysis = {
      hasPackageJson: true,
      directories: { tests: 'tests' },
      architecture: { pattern: 'mvc', indicators: [] },
      testing: { hasTests: true, frameworks: ['jest'] },
      sourceFiles: { languages: ['javascript'] }
    };

    const dependencyAnalyzer = await import('../lib/analyzers/dependency-analyzer.js');
    const codePatternAnalyzer = await import('../lib/analyzers/code-pattern-analyzer.js');

    jest.spyOn(dependencyAnalyzer, 'analyzeDependencies').mockResolvedValue(mockDependencyAnalysis);
    jest.spyOn(codePatternAnalyzer, 'analyzeCodePatterns').mockResolvedValue(mockPatternAnalysis);

    const result = await analyzeCodebase('/test/project');

    expect(result).toHaveProperty('dependencies', mockDependencyAnalysis);
    expect(result).toHaveProperty('patterns', mockPatternAnalysis);
    expect(result).toHaveProperty('primaryLanguage', 'JavaScript');
    expect(result).toHaveProperty('frameworks', ['express']);
    expect(result).toHaveProperty('allDependencies', { express: '^4.18.0' });
    expect(result).toHaveProperty('hasTests', true);
    expect(result).toHaveProperty('testFrameworks', ['jest']);
    expect(result).toHaveProperty('architecture', 'mvc');
  });
});
