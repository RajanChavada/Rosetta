/**
 * Tests for dependency-analyzer.js
 */

import {
  parseNodeDependencies,
  parseGoDependencies,
  parsePythonDependencies,
  parseRustDependencies,
  parseRubyDependencies,
  analyzeDependencies
} from '../../lib/analyzers/dependency-analyzer.js';
import fs from 'fs-extra';

jest.mock('fs-extra');
jest.mock('chalk', () => ({
  yellow: jest.fn(s => s)
}));

describe('parseNodeDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse package.json dependencies', async () => {
    const mockPackageJson = {
      dependencies: {
        express: '^4.18.0',
        react: '^18.0.0'
      },
      devDependencies: {
        jest: '^29.0.0',
        typescript: '^5.0.0'
      }
    };

    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue(mockPackageJson);

    const result = await parseNodeDependencies('/test/project');

    expect(result).toEqual({
      dependencies: { express: '^4.18.0', react: '^18.0.0' },
      devDependencies: { jest: '^29.0.0', typescript: '^5.0.0' },
      frameworks: ['express', 'react', 'jest', 'typescript'],
      language: 'TypeScript/JavaScript',
      hasTypeScript: true
    });
  });

  test('should detect common Node.js frameworks', async () => {
    const mockPackageJson = {
      dependencies: {
        express: '^4.18.0',
        react: '^18.0.0',
        next: '^13.0.0',
        '@nestjs/core': '^10.0.0',
        '@prisma/client': '^5.0.0'
      },
      devDependencies: {
        jest: '^29.0.0',
        cypress: '^12.0.0'
      }
    };

    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockResolvedValue(mockPackageJson);

    const result = await parseNodeDependencies('/test/project');

    expect(result.frameworks).toContain('express');
    expect(result.frameworks).toContain('react');
    expect(result.frameworks).toContain('next');
    expect(result.frameworks).toContain('nestjs');
    expect(result.frameworks).toContain('prisma');
    expect(result.frameworks).toContain('jest');
    expect(result.frameworks).toContain('cypress');
  });

  test('should return empty result when package.json not found', async () => {
    fs.pathExists.mockResolvedValue(false);

    const result = await parseNodeDependencies('/test/project');

    expect(result).toEqual({
      dependencies: {},
      devDependencies: {},
      frameworks: [],
      language: null
    });
  });

  test('should handle parse errors gracefully', async () => {
    fs.pathExists.mockResolvedValue(true);
    fs.readJson.mockRejectedValue(new Error('Invalid JSON'));

    const result = await parseNodeDependencies('/test/project');

    expect(result).toEqual({
      dependencies: {},
      devDependencies: {},
      frameworks: [],
      language: null
    });
  });
});

describe('parseGoDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse go.mod dependencies', async () => {
    const mockGoMod = `
module github.com/example/project

go 1.21

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/gorilla/mux v1.8.0
	gorm.io/gorm v1.25.0
)
`;

    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue(mockGoMod);

    const result = await parseGoDependencies('/test/project');

    expect(result.language).toBe('Go');
    expect(result.frameworks).toContain('gin');
    expect(result.frameworks).toContain('gorilla/mux');
    expect(result.frameworks).toContain('gorm');
    expect(result.dependencies['github.com/gin-gonic/gin']).toBe('v1.9.1');
  });

  test('should detect common Go frameworks', async () => {
    const mockGoMod = `
module github.com/example/project

require (
	github.com/gin-gonic/gin v1.9.1
	github.com/labstack/echo/v4 v4.10.0
	gofiber.io/v2 v2.47.0
)
`;

    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue(mockGoMod);

    const result = await parseGoDependencies('/test/project');

    expect(result.frameworks).toContain('gin');
    expect(result.frameworks).toContain('echo');
    expect(result.frameworks).toContain('fiber');
  });

  test('should return empty result when go.mod not found', async () => {
    fs.pathExists.mockResolvedValue(false);

    const result = await parseGoDependencies('/test/project');

    expect(result).toEqual({
      dependencies: {},
      frameworks: [],
      language: null
    });
  });
});

describe('parsePythonDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse requirements.txt', async () => {
    const mockRequirements = `
# Core dependencies
django==4.2.0
djangorestframework==3.14.0
pytest==7.4.0
celery==5.3.0
`;

    fs.pathExists.mockImplementation((path) => {
      if (path.includes('requirements.txt')) return Promise.resolve(true);
      if (path.includes('pyproject.toml')) return Promise.resolve(false);
      return Promise.resolve(false);
    });
    fs.readFile.mockResolvedValue(mockRequirements);

    const result = await parsePythonDependencies('/test/project');

    expect(result.language).toBe('Python');
    expect(result.frameworks).toContain('django');
    expect(result.frameworks).toContain('pytest');
    expect(result.frameworks).toContain('celery');
    expect(result.dependencies.django).toBe('django==4.2.0');
  });

  test('should detect common Python frameworks', async () => {
    const mockRequirements = `
fastapi==0.100.0
sqlalchemy==2.0.0
pytest==7.4.0
pymongo==4.5.0
redis==4.6.0
`;

    fs.pathExists.mockImplementation((path) => {
      if (path.includes('requirements.txt')) return Promise.resolve(true);
      if (path.includes('pyproject.toml')) return Promise.resolve(false);
      return Promise.resolve(false);
    });
    fs.readFile.mockResolvedValue(mockRequirements);

    const result = await parsePythonDependencies('/test/project');

    expect(result.frameworks).toContain('fastapi');
    expect(result.frameworks).toContain('sqlalchemy');
    expect(result.frameworks).toContain('pytest');
    expect(result.frameworks).toContain('mongodb');
    expect(result.frameworks).toContain('redis');
  });

  test('should parse pyproject.toml', async () => {
    const mockPyproject = `
[project]
name = "myproject"
dependencies = [
    "django>=4.2",
    "pytest>=7.4"
]
`;

    fs.pathExists.mockImplementation((path) => {
      if (path.includes('requirements.txt')) return Promise.resolve(false);
      if (path.includes('pyproject.toml')) return Promise.resolve(true);
      return Promise.resolve(false);
    });
    fs.readFile.mockResolvedValue(mockPyproject);

    const result = await parsePythonDependencies('/test/project');

    expect(result.language).toBe('Python');
    expect(result.frameworks).toContain('django');
    expect(result.frameworks).toContain('pytest');
  });
});

describe('parseRustDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse Cargo.toml dependencies', async () => {
    const mockCargo = `
[package]
name = "myproject"
version = "0.1.0"

[dependencies]
actix-web = "4.3"
tokio = { version = "1.0", features = ["full"] }
diesel = "2.1"
`;

    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue(mockCargo);

    const result = await parseRustDependencies('/test/project');

    expect(result.language).toBe('Rust');
    expect(result.frameworks).toContain('actix');
    expect(result.frameworks).toContain('tokio');
    expect(result.frameworks).toContain('diesel');
    expect(result.dependencies.actix-web).toBe('"4.3"');
  });

  test('should detect common Rust frameworks', async () => {
    const mockCargo = `
[dependencies]
rocket = "0.5"
sqlx = "0.7"
redis = "0.23"
`;

    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue(mockCargo);

    const result = await parseRustDependencies('/test/project');

    expect(result.frameworks).toContain('rocket');
    expect(result.frameworks).toContain('sqlx');
    expect(result.frameworks).toContain('redis');
  });
});

describe('parseRubyDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should parse Gemfile', async () => {
    const mockGemfile = `
source 'https://rubygems.org'

gem 'rails', '~> 7.0'
gem 'pg'
gem 'rspec-rails', '~> 6.0'
gem 'sidekiq'
gem 'redis'
`;

    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue(mockGemfile);

    const result = await parseRubyDependencies('/test/project');

    expect(result.language).toBe('Ruby');
    expect(result.frameworks).toContain('rails');
    expect(result.frameworks).toContain('rspec');
    expect(result.frameworks).toContain('postgres');
    expect(result.frameworks).toContain('sidekiq');
    expect(result.frameworks).toContain('redis');
  });

  test('should detect common Ruby frameworks', async () => {
    const mockGemfile = `
gem 'sinatra'
gem 'rspec'
gem 'pg'
gem 'redis'
`;

    fs.pathExists.mockResolvedValue(true);
    fs.readFile.mockResolvedValue(mockGemfile);

    const result = await parseRubyDependencies('/test/project');

    expect(result.frameworks).toContain('sinatra');
    expect(result.frameworks).toContain('rspec');
    expect(result.frameworks).toContain('postgres');
    expect(result.frameworks).toContain('redis');
  });
});

describe('analyzeDependencies', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should detect Node.js as primary language', async () => {
    const mockNodeResult = {
      dependencies: { express: '^4.18.0' },
      devDependencies: {},
      frameworks: ['express'],
      language: 'TypeScript/JavaScript',
      hasTypeScript: false
    };

    const mockOtherResults = {
      dependencies: {},
      frameworks: [],
      language: null
    };

    // Mock all parsers
    const dependencyAnalyzer = await import('../../lib/analyzers/dependency-analyzer.js');
    jest.spyOn(dependencyAnalyzer, 'parseNodeDependencies').mockResolvedValue(mockNodeResult);
    jest.spyOn(dependencyAnalyzer, 'parseGoDependencies').mockResolvedValue(mockOtherResults);
    jest.spyOn(dependencyAnalyzer, 'parsePythonDependencies').mockResolvedValue(mockOtherResults);
    jest.spyOn(dependencyAnalyzer, 'parseRustDependencies').mockResolvedValue(mockOtherResults);
    jest.spyOn(dependencyAnalyzer, 'parseRubyDependencies').mockResolvedValue(mockOtherResults);

    const result = await analyzeDependencies('/test/project');

    expect(result.primaryLanguage).toBe('TypeScript/JavaScript');
    expect(result.allFrameworks).toEqual(['express']);
    expect(result.allDependencies).toEqual({ express: '^4.18.0' });
    expect(result.hasDependencies).toBe(true);
  });

  test('should return empty result when no dependencies found', async () => {
    const mockEmptyResult = {
      dependencies: {},
      frameworks: [],
      language: null
    };

    const dependencyAnalyzer = await import('../../lib/analyzers/dependency-analyzer.js');
    jest.spyOn(dependencyAnalyzer, 'parseNodeDependencies').mockResolvedValue(mockEmptyResult);
    jest.spyOn(dependencyAnalyzer, 'parseGoDependencies').mockResolvedValue(mockEmptyResult);
    jest.spyOn(dependencyAnalyzer, 'parsePythonDependencies').mockResolvedValue(mockEmptyResult);
    jest.spyOn(dependencyAnalyzer, 'parseRustDependencies').mockResolvedValue(mockEmptyResult);
    jest.spyOn(dependencyAnalyzer, 'parseRubyDependencies').mockResolvedValue(mockEmptyResult);

    const result = await analyzeDependencies('/test/project');

    expect(result.primaryLanguage).toBeNull();
    expect(result.allFrameworks).toEqual([]);
    expect(result.allDependencies).toEqual({});
    expect(result.hasDependencies).toBe(false);
  });
});
