import { jest } from '@jest/globals';

// Mock all internal modules - must be before dynamic imports
jest.unstable_mockModule('../../lib/skills.js', () => ({
  loadSkillsFromSources: jest.fn()
}));
jest.unstable_mockModule('../../lib/analyzers/dependency-analyzer.js', () => ({
  analyzeDependencies: jest.fn()
}));
jest.unstable_mockModule('../../lib/analyzers/code-pattern-analyzer.js', () => ({
  analyzeCodePatterns: jest.fn()
}));
jest.unstable_mockModule('../../lib/analyzers/structure-analyzer.js', () => ({
  analyzeStructure: jest.fn()
}));
jest.unstable_mockModule('../../lib/analyzers/convention-analyzer.js', () => ({
  analyzeConventions: jest.fn()
}));
jest.unstable_mockModule('../../lib/generators/relevance-scorer.js', () => ({
  scoreAllSkills: jest.fn(),
  displayScoredSkills: jest.fn()
}));
jest.unstable_mockModule('inquirer', () => ({
  default: { prompt: jest.fn() },
  prompt: jest.fn()
}));
jest.unstable_mockModule('fs-extra', () => ({
  default: {
    writeFile: jest.fn(),
    pathExists: jest.fn(),
    readJson: jest.fn()
  },
  writeFile: jest.fn(),
  pathExists: jest.fn(),
  readJson: jest.fn()
}));
jest.unstable_mockModule('chalk', () => {
  const mock = {
    bold: Object.assign(s => s, {
      green: s => s,
      blue: s => s,
      yellow: s => s,
      red: s => s
    }),
    green: Object.assign(s => s, { bold: s => s }),
    blue: Object.assign(s => s, { bold: s => s }),
    yellow: Object.assign(s => s, { bold: s => s }),
    red: Object.assign(s => s, { bold: s => s }),
    gray: s => s,
    cyan: s => s,
    magenta: Object.assign(s => s, { bold: s => s })
  };
  return { ...mock, default: mock };
});

// Dynamic imports AFTER mocks
const { ideate, generateIdeationReport, exportIdeationResults } = await import('../../lib/commands/ideate.js');
const { loadSkillsFromSources } = await import('../../lib/skills.js');
const { analyzeDependencies } = await import('../../lib/analyzers/dependency-analyzer.js');
const { analyzeCodePatterns } = await import('../../lib/analyzers/code-pattern-analyzer.js');
const { analyzeStructure } = await import('../../lib/analyzers/structure-analyzer.js');
const { analyzeConventions } = await import('../../lib/analyzers/convention-analyzer.js');
const { scoreAllSkills, displayScoredSkills } = await import('../../lib/generators/relevance-scorer.js');
const inquirer = (await import('inquirer')).default;
const chalk = (await import('chalk')).default;
const fs = (await import('fs-extra')).default;

describe('ideate command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation();
    jest.spyOn(console, 'error').mockImplementation();
    jest.spyOn(process, 'exit').mockImplementation(() => {});
  });

  afterEach(() => {
    console.log.mockRestore();
    console.error.mockRestore();
    process.exit.mockRestore();
  });

  test('should analyze codebase and suggest skills', async () => {
    // Mock skills
    const mockSkills = [
      {
        name: 'express-middleware',
        description: 'Express middleware patterns',
        metadata: {
          requiredFrameworks: ['express'],
          domains: ['backend']
        }
      }
    ];

    // Mock analysis results
    const mockDependencyAnalysis = {
      primaryLanguage: 'JavaScript',
      allFrameworks: ['express'],
      allDependencies: { express: '^4.18.0' }
    };

    const mockPatternAnalysis = {
      hasPackageJson: true,
      directories: { tests: 'tests' },
      architecture: { pattern: 'mvc' },
      testing: { hasTests: true, frameworks: ['jest'] }
    };

    const mockStructureAnalysis = {
      layout: { pattern: 'src-based' },
      organization: { depth: 2, branchingFactor: 3 },
      distribution: { totalFiles: 50 },
      complexity: { level: 'medium' },
      bestPractices: { score: 3 }
    };

    const mockConventionAnalysis = {
      naming: { files: { style: 'kebab-case' } },
      organization: { groupingStrategy: 'feature-based' },
      documentation: { hasReadme: true },
      testing: { framework: 'jest' },
      configuration: { style: 'json-based' },
      custom: { patterns: [] }
    };

    // Mock scored skills
    const mockScoredSkills = [
      {
        skill: mockSkills[0],
        score: 75,
        confidence: 'high',
        reasons: ['Framework match: express', 'Domain: backend'],
        passesThreshold: true
      }
    ];

    // Setup mocks
    loadSkillsFromSources.mockResolvedValue(mockSkills);
    analyzeDependencies.mockResolvedValue(mockDependencyAnalysis);
    analyzeCodePatterns.mockResolvedValue(mockPatternAnalysis);
    analyzeStructure.mockResolvedValue(mockStructureAnalysis);
    analyzeConventions.mockResolvedValue(mockConventionAnalysis);
    scoreAllSkills.mockReturnValue(mockScoredSkills);
    displayScoredSkills.mockImplementation();

    await ideate('/test/project', { dryRun: true });

    expect(loadSkillsFromSources).toHaveBeenCalled();
    expect(analyzeDependencies).toHaveBeenCalledWith('/test/project');
    expect(analyzeCodePatterns).toHaveBeenCalledWith('/test/project');
    expect(analyzeStructure).toHaveBeenCalledWith('/test/project');
    expect(analyzeConventions).toHaveBeenCalledWith('/test/project');
    expect(scoreAllSkills).toHaveBeenCalled();
    expect(displayScoredSkills).toHaveBeenCalled();
  });

  test('should handle no skills available', async () => {
    loadSkillsFromSources.mockResolvedValue([]);

    await ideate('/test/project', {});

    expect(loadSkillsFromSources).toHaveBeenCalled();
    expect(analyzeDependencies).not.toHaveBeenCalled();
  });

  test('should handle no matching skills', async () => {
    loadSkillsFromSources.mockResolvedValue([
      { name: 'unrelated-skill', metadata: { requiredFrameworks: ['rails'] } }
    ]);

    const mockDependencyAnalysis = {
      primaryLanguage: 'JavaScript',
      allFrameworks: ['express'],
      allDependencies: { express: '^4.18.0' }
    };

    const mockPatternAnalysis = {
      hasPackageJson: true,
      directories: {},
      architecture: { pattern: 'unknown' },
      testing: { hasTests: false, frameworks: [] }
    };

    const mockStructureAnalysis = {
      layout: { pattern: 'flat' },
      organization: { depth: 1 },
      distribution: { totalFiles: 5 },
      complexity: { level: 'low' },
      bestPractices: { score: 1 }
    };

    const mockConventionAnalysis = {
      naming: { files: { style: 'unknown' } },
      organization: { groupingStrategy: 'unknown' },
      documentation: { hasReadme: false },
      testing: { framework: 'unknown' },
      configuration: { style: 'unknown' },
      custom: { patterns: [] }
    };

    analyzeDependencies.mockResolvedValue(mockDependencyAnalysis);
    analyzeCodePatterns.mockResolvedValue(mockPatternAnalysis);
    analyzeStructure.mockResolvedValue(mockStructureAnalysis);
    analyzeConventions.mockResolvedValue(mockConventionAnalysis);
    scoreAllSkills.mockReturnValue([]);

    await ideate('/test/project', {});

    expect(scoreAllSkills).toHaveBeenCalled();
  });

  test('should output JSON format when requested', async () => {
    const mockSkills = [{ name: 'test-skill', metadata: {} }];
    const mockScoredSkills = [
      {
        skill: mockSkills[0],
        score: 50,
        confidence: 'medium',
        reasons: [],
        passesThreshold: true
      }
    ];

    const mockAnalysisResults = {
      dependencies: { 
        primaryLanguage: 'JavaScript',
        primaryFramework: ['express']
      },
      patterns: {
        architecture: { pattern: 'mvc' },
        testing: { hasTests: true, frameworks: ['jest'] }
      },
      structure: {
        layout: { pattern: 'src-based' }
      },
      conventions: {
        naming: { files: { style: 'kebab-case' } }
      },
      context: { projectName: 'test' }
    };

    loadSkillsFromSources.mockResolvedValue(mockSkills);
    analyzeDependencies.mockResolvedValue({
      primaryLanguage: 'JavaScript',
      primaryFramework: ['express'],
      allFrameworks: ['express'],
      allDependencies: { express: '^4.18.0' }
    });
    analyzeCodePatterns.mockResolvedValue({
      hasPackageJson: true,
      directories: {},
      architecture: { pattern: 'mvc' },
      testing: { hasTests: true, frameworks: ['jest'] }
    });
    analyzeStructure.mockResolvedValue({
      layout: { pattern: 'src-based' }
    });
    analyzeConventions.mockResolvedValue({
      naming: { files: { style: 'kebab-case' } }
    });
    scoreAllSkills.mockReturnValue(mockScoredSkills);

    await ideate('/test/project', { json: true });
    
    // Debug: what was logged?
    // console.log.mock.calls.forEach((c, i) => console.error(`CALL ${i}: ${c[0].substring(0, 50)}...`));

    // Find the call that contains valid JSON (ignoring TreeLogger output)
    const jsonCall = console.log.mock.calls.find(call => {
      try {
        const content = typeof call[0] === 'string' ? call[0].trim() : '';
        if (!content.startsWith('{')) return false;
        JSON.parse(content);
        return true;
      } catch (e) {
        return false;
      }
    });

    if (!jsonCall) {
      const allCalls = console.log.mock.calls.map(c => c[0]).join('\n');
      throw new Error(`Could not find JSON in console.log calls. Total calls: ${console.log.mock.calls.length}. Content: ${allCalls.substring(0, 100)}...`);
    }

    const parsedOutput = JSON.parse(jsonCall[0]);

    expect(parsedOutput).toHaveProperty('analysisResults');
    expect(parsedOutput).toHaveProperty('scoredSkills');
    expect(parsedOutput.scoredSkills[0]).toHaveProperty('name', 'test-skill');
    expect(parsedOutput.scoredSkills[0]).toHaveProperty('score', 50);
  });

  test('should handle errors gracefully', async () => {
    analyzeDependencies.mockRejectedValue(new Error('Analysis failed'));

    await ideate('/test/project', { verbose: true });

    expect(console.error).toHaveBeenCalled();
  });
});

describe('generateIdeationReport', () => {
  test('should generate text report', async () => {
    const analysisResults = {
      context: {
        projectName: 'my-app',
        projectPath: '/test/project'
      },
      dependencies: {
        primaryLanguage: 'JavaScript',
        primaryFramework: ['express'],
        allFrameworks: ['express', 'jest']
      },
      patterns: {
        architecture: { pattern: 'mvc' },
        testing: { hasTests: true, frameworks: ['jest'] }
      }
    };

    const scoredSkills = [
      {
        skill: { name: 'express-middleware', description: 'Middleware patterns' },
        score: 75,
        confidence: 'high',
        reasons: ['Framework match: express']
      }
    ];

    const report = await generateIdeationReport(analysisResults, scoredSkills);

    expect(report).toContain('# Skill Ideation Report');
    expect(report).toContain('Project: my-app');
    expect(report).toContain('Language: JavaScript');
    expect(report).toContain('Frameworks: express');
    expect(report).toContain('Architecture: mvc');
    expect(report).toContain('Testing: Yes');
    expect(report).toContain('1. express-middleware (75% confidence)');
  });

  test('should generate JSON report', async () => {
    const analysisResults = {
      context: {
        projectName: 'test-project',
        projectPath: '/test/project'
      },
      dependencies: {
        primaryLanguage: 'Python',
        primaryFramework: ['django'],
        allFrameworks: ['django']
      },
      patterns: {
        architecture: { pattern: 'mvc' },
        testing: { hasTests: false }
      }
    };

    const scoredSkills = [
      {
        skill: { name: 'django-models', description: 'Django ORM patterns' },
        score: 80,
        confidence: 'high',
        reasons: ['Framework match: django']
      }
    ];

    const report = await generateIdeationReport(analysisResults, scoredSkills, { format: 'json' });

    const parsed = JSON.parse(report);

    expect(parsed).toHaveProperty('timestamp');
    expect(parsed).toHaveProperty('project');
    expect(parsed).toHaveProperty('analysis');
    expect(parsed).toHaveProperty('suggestedSkills');
    expect(parsed.project.projectName).toBe('test-project');
    expect(parsed.analysis.language).toBe('Python');
    expect(parsed.analysis.frameworks).toEqual(['django']);
    expect(parsed.suggestedSkills).toHaveLength(1);
    expect(parsed.suggestedSkills[0].name).toBe('django-models');
  });
});

describe('exportIdeationResults', () => {
  test('should export report to file', async () => {
    const analysisResults = {
      context: { projectName: 'test', projectPath: '/test/project' },
      dependencies: { 
        primaryLanguage: 'JavaScript',
        primaryFramework: ['express']
      },
      patterns: { 
        architecture: { pattern: 'mvc' },
        testing: { hasTests: true }
      }
    };

    const scoredSkills = [
      {
        skill: { name: 'test-skill', description: 'Test skill' },
        score: 70,
        confidence: 'high',
        reasons: ['Test reason']
      }
    ];

    fs.writeFile.mockResolvedValue();

    await exportIdeationResults(analysisResults, scoredSkills, '/output/report.md');

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/output/report.md',
      expect.any(String)
    );
  });

  test('should export JSON format to file', async () => {
    const analysisResults = {
      context: { projectName: 'test', projectPath: '/test/project' },
      dependencies: { 
        primaryLanguage: 'JavaScript',
        primaryFramework: ['express']
      },
      patterns: { 
        architecture: { pattern: 'mvc' },
        testing: { hasTests: true }
      }
    };

    const scoredSkills = [
      {
        skill: { name: 'test-skill' },
        score: 70,
        confidence: 'high',
        reasons: []
      }
    ];

    fs.writeFile.mockResolvedValue();

    await exportIdeationResults(
      analysisResults,
      scoredSkills,
      '/output/report.json',
      { format: 'json' }
    );

    expect(fs.writeFile).toHaveBeenCalledWith(
      '/output/report.json',
      expect.stringContaining('"suggestedSkills"')
    );
  });
});
