/**
 * Tests for code-pattern-analyzer.js
 */

import { analyzeCodePatterns } from '../../lib/analyzers/code-pattern-analyzer.js';
import fs from 'fs-extra';

jest.mock('fs-extra');
jest.mock('chalk', () => ({
  yellow: jest.fn(s => s)
}));

describe('analyzeCodePatterns', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should analyze codebase patterns', async () => {
    fs.pathExists.mockImplementation((path) => {
      if (path.includes('package.json')) return Promise.resolve(true);
      if (path.includes('go.mod')) return Promise.resolve(false);
      if (path.includes('Cargo.toml')) return Promise.resolve(false);
      if (path.includes('requirements.txt')) return Promise.resolve(false);
      if (path.includes('pyproject.toml')) return Promise.resolve(false);
      if (path.includes('Gemfile')) return Promise.resolve(false);
      return Promise.resolve(false);
    });

    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false, isFile: () => true },
          { name: 'src', isDirectory: () => true, isFile: () => false },
          { name: 'tests', isDirectory: () => true, isFile: () => false },
          { name: 'models', isDirectory: () => true, isFile: () => false },
          { name: 'views', isDirectory: () => true, isFile: () => false },
          { name: 'controllers', isDirectory: () => true, isFile: () => false }
        ]);
      }
      if (path === '/test/project/src') {
        return Promise.resolve([
          { name: 'index.js', isDirectory: () => false, isFile: () => true },
          { name: 'app.js', isDirectory: () => false, isFile: () => true }
        ]);
      }
      return Promise.resolve([]);
    });

    fs.readJson.mockResolvedValue({
      dependencies: { express: '^4.18.0' },
      devDependencies: { jest: '^29.0.0' }
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result).toHaveProperty('hasPackageJson', true);
    expect(result).toHaveProperty('hasGoMod', false);
    expect(result).toHaveProperty('directories');
    expect(result).toHaveProperty('architecture');
    expect(result).toHaveProperty('testing');
    expect(result).toHaveProperty('sourceFiles');
  });

  test('should detect MVC architecture', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'models', isDirectory: () => true, isFile: () => false },
          { name: 'views', isDirectory: () => true, isFile: () => false },
          { name: 'controllers', isDirectory: () => true, isFile: () => false }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.architecture.pattern).toBe('mvc');
    expect(result.architecture.indicators).toContain('MVC structure detected');
  });

  test('should detect monorepo architecture', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'packages', isDirectory: () => true, isFile: () => false },
          { name: 'apps', isDirectory: () => true, isFile: () => false }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.architecture.pattern).toBe('monorepo');
    expect(result.architecture.indicators).toContain('Has packages/ or apps/ directory');
  });

  test('should detect Next.js app router', async () => {
    fs.pathExists.mockImplementation((path) => {
      if (path.includes('app')) return Promise.resolve(true);
      return Promise.resolve(false);
    });

    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'app', isDirectory: () => true, isFile: () => false }
        ]);
      }
      if (path === '/test/project/app') {
        return Promise.resolve([
          { name: 'page.tsx', isDirectory: () => false, isFile: () => true }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.architecture.pattern).toBe('nextjs-app-router');
    expect(result.architecture.indicators).toContain('App router structure detected');
  });

  test('should detect testing patterns', async () => {
    fs.pathExists.mockImplementation((path) => {
      if (path.includes('package.json')) return Promise.resolve(true);
      return Promise.resolve(false);
    });

    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'package.json', isDirectory: () => false, isFile: () => true },
          { name: 'tests', isDirectory: () => true, isFile: () => false }
        ]);
      }
      if (path === '/test/project/tests') {
        return Promise.resolve([
          { name: 'app.test.js', isDirectory: () => false, isFile: () => true },
          { name: 'utils.test.js', isDirectory: () => false, isFile: () => true }
        ]);
      }
      return Promise.resolve([]);
    });

    fs.readJson.mockResolvedValue({
      dependencies: {},
      devDependencies: { jest: '^29.0.0' }
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.testing.hasTests).toBe(true);
    expect(result.testing.frameworks).toContain('jest');
    expect(result.testing.structure).toBe('tests');
  });

  test('should detect Python test files', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'tests', isDirectory: () => true, isFile: () => false }
        ]);
      }
      if (path === '/test/project/tests') {
        return Promise.resolve([
          { name: 'test_app.py', isDirectory: () => false, isFile: () => true },
          { name: 'test_utils.py', isDirectory: () => false, isFile: () => true }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.testing.hasTests).toBe(true);
    expect(result.testing.frameworks).toContain('pytest');
    expect(result.testing.indicators).toContain('Python test files in tests');
  });

  test('should detect Go test files', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'src', isDirectory: () => true, isFile: () => false }
        ]);
      }
      if (path === '/test/project/src') {
        return Promise.resolve([
          { name: 'app_test.go', isDirectory: () => false, isFile: () => true },
          { name: 'utils_test.go', isDirectory: () => false, isFile: () => true }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.testing.hasTests).toBe(true);
    expect(result.testing.frameworks).toContain('go-testing');
  });

  test('should detect source file languages', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'src', isDirectory: () => true, isFile: () => false }
        ]);
      }
      if (path === '/test/project/src') {
        return Promise.resolve([
          { name: 'index.js', isDirectory: () => false, isFile: () => true },
          { name: 'app.ts', isDirectory: () => false, isFile: () => true },
          { name: 'utils.py', isDirectory: () => false, isFile: () => true }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.sourceFiles.languages).toContain('javascript');
    expect(result.sourceFiles.languages).toContain('typescript');
    expect(result.sourceFiles.languages).toContain('python');
    expect(result.sourceFiles.fileCounts.javascript).toBeGreaterThan(0);
    expect(result.sourceFiles.fileCounts.typescript).toBeGreaterThan(0);
  });

  test('should detect directory patterns', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockImplementation((path) => {
      if (path === '/test/project') {
        return Promise.resolve([
          { name: 'src', isDirectory: () => true, isFile: () => false },
          { name: 'tests', isDirectory: () => true, isFile: () => false },
          { name: 'components', isDirectory: () => true, isFile: () => false },
          { name: 'pages', isDirectory: () => true, isFile: () => false },
          { name: 'api', isDirectory: () => true, isFile: () => false },
          { name: 'models', isDirectory: () => true, isFile: () => false },
          { name: 'controllers', isDirectory: () => true, isFile: () => false },
          { name: 'services', isDirectory: () => true, isFile: () => false },
          { name: 'utils', isDirectory: () => true, isFile: () => false },
          { name: 'lib', isDirectory: () => true, isFile: () => false }
        ]);
      }
      return Promise.resolve([]);
    });

    const result = await analyzeCodePatterns('/test/project');

    expect(result.directories.tests).toBe('tests');
    expect(result.directories.src).toBe('src');
    expect(result.directories.components).toBe('components');
    expect(result.directories.pages).toBe('pages');
    expect(result.directories.api).toBe('api');
    expect(result.directories.models).toBe('models');
    expect(result.directories.controllers).toBe('controllers');
    expect(result.directories.services).toBe('services');
    expect(result.directories.utils).toBe('utils');
    expect(result.directories.lib).toBe('lib');
  });

  test('should handle unknown architecture', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockResolvedValue([]);

    const result = await analyzeCodePatterns('/test/project');

    expect(result.architecture.pattern).toBe('unknown');
    expect(result.architecture.indicators).toEqual([]);
  });

  test('should handle minimal project', async () => {
    fs.pathExists.mockResolvedValue(false);
    fs.readdir.mockResolvedValue([
      { name: 'index.js', isDirectory: () => false, isFile: () => true }
    ]);

    const result = await analyzeCodePatterns('/test/project');

    expect(result.architecture.pattern).toBe('minimal');
    expect(result.testing.hasTests).toBe(false);
    expect(result.testing.frameworks).toEqual([]);
  });
});
