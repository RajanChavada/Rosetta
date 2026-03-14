import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import path from 'path';
import {
  detectRepoState,
  detectProjectType,
  inferStackFromDependencies,
  inferStarterSkills,
  gatherContext
} from '../lib/context.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  cyan: jest.fn(str => str),
  gray: jest.fn(str => str),
  blue: jest.fn(str => str),
  yellow: jest.fn(str => str),
  green: jest.fn(str => str),
  red: jest.fn(str => str),
  magenta: jest.fn(str => str),
  bold: { green: jest.fn(str => str), blue: jest.fn(str => str), yellow: jest.fn(str => str), red: jest.fn(str => str) }
}));

const mockFs = fs;
const mockInquirer = inquirer;

describe('lib/context.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('detectRepoState', () => {
    test('should detect new repository with no IDE folders or agent files', async () => {
      mockFs.readdir.mockResolvedValue([]);
      mockFs.pathExists.mockResolvedValue(false);
      const state = await detectRepoState();
      expect(state.isNewRepo).toBe(true);
      expect(state.hasExistingSetup).toBe(false);
      expect(state.detectedIdes).toEqual([]);
    });

    test('should detect IDE folders', async () => {
      const entries = [
        { name: 'vscode', isDirectory: () => true, isFile: () => false },
        { name: 'cursor', isDirectory: () => true, isFile: () => false },
        { name: 'README.md', isDirectory: () => false, isFile: () => true }
      ];
      mockFs.readdir.mockResolvedValue(entries);
      mockFs.pathExists.mockResolvedValue(false);
      const state = await detectRepoState();
      expect(state.detectedIdes).toContain('vscode');
      expect(state.detectedIdes).toContain('cursor');
    });

    test('should detect existing master-skill.md', async () => {
      mockFs.readdir.mockResolvedValue([]);
      mockFs.pathExists.mockImplementation((filePath) => filePath === '.ai/master-skill.md');
      const state = await detectRepoState();
      expect(state.hasMaster).toBe(true);
      expect(state.hasExistingSetup).toBe(true);
    });
  });

  describe('detectProjectType', () => {
    test('should detect Node.js project from package.json', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'package.json');
      mockFs.readJson.mockResolvedValue({
        dependencies: { react: '18.0.0', express: '4.18.0' },
        devDependencies: {}
      });
      const result = await detectProjectType();
      expect(result.type).toBe('Web app');
      expect(result.stack).toHaveProperty('language');
    });

    test('should detect Go project from go.mod', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'go.mod');
      const result = await detectProjectType();
      expect(result.type).toBe('Go service');
      expect(result.stack).toHaveProperty('language', 'Go');
    });

    test('should detect Python project from requirements.txt', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'requirements.txt');
      const result = await detectProjectType();
      expect(result.type).toBe('Web app');
      expect(result.stack).toHaveProperty('language', 'Python');
    });

    test('should detect Rust project from Cargo.toml', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'Cargo.toml');
      const result = await detectProjectType();
      expect(result.type).toBe('Rust service');
      expect(result.stack).toHaveProperty('language', 'Rust');
    });

    test('should detect Ruby project from Gemfile', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'Gemfile');
      const result = await detectProjectType();
      expect(result.type).toBe('Ruby service');
      expect(result.stack).toHaveProperty('language', 'Ruby');
    });

    test('should return Unknown type for unrecognized projects', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      const result = await detectProjectType();
      expect(result.type).toBe('Unknown');
      expect(result.stack).toHaveProperty('language', 'Unknown');
    });
  });

  describe('inferStackFromDependencies', () => {
    test('should return empty arrays when no package.json exists', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      const stack = await inferStackFromDependencies();
      expect(stack).toEqual({ frontend: [], backend: [], datastores: [] });
    });

    test('should infer frontend stack from dependencies', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({
        dependencies: { react: '18.0.0', next: '14.0.0' },
        devDependencies: {}
      });
      const stack = await inferStackFromDependencies();
      expect(stack.frontend).toContain('Next.js');
    });

    test('should infer backend stack from dependencies', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({
        dependencies: { express: '4.18.0' },
        devDependencies: {}
      });
      const stack = await inferStackFromDependencies();
      expect(stack.backend).toContain('Express');
    });

    test('should infer datastores from dependencies', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readJson.mockResolvedValue({
        dependencies: { pg: '8.0.0', redis: '4.0.0' },
        devDependencies: {}
      });
      const stack = await inferStackFromDependencies();
      expect(stack.datastores).toContain('Postgres');
      expect(stack.datastores).toContain('Redis');
    });
  });

  describe('inferStarterSkills', () => {
    test('should return empty array when no matching skills found', () => {
      const context = { backend: ['Unknown'], datastores: [] };
      const availableSkills = [
        { name: 'node-express-postgres', backend: ['Node/Express'], datastores: ['Postgres'] }
      ];
      const result = inferStarterSkills(context, availableSkills);
      expect(result).toEqual([]);
    });

    test('should infer node-express-postgres skill for Node/Express + Postgres', () => {
      const context = { backend: ['Node/Express'], datastores: ['Postgres'] };
      const availableSkills = [
        { name: 'node-express-postgres', backend: ['Node/Express'], datastores: ['Postgres'] },
        { name: 'other-skill', backend: ['Python'], datastores: [] }
      ];
      const result = inferStarterSkills(context, availableSkills);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('node-express-postgres');
    });

    test('should infer testing-full-pyramid skill for full testing setup', () => {
      const context = { testingSetup: 'Unit + integration + E2E' };
      const availableSkills = [
        { name: 'testing-full-pyramid' }
      ];
      const result = inferStarterSkills(context, availableSkills);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('testing-full-pyramid');
    });

    test('should infer data-ml-project skill for data projects', () => {
      const context = { projectType: 'Data / ML project' };
      const availableSkills = [
        { name: 'data-ml-project' }
      ];
      const result = inferStarterSkills(context, availableSkills);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('data-ml-project');
    });

    test('should infer frontend-react-next skill for React/Next.js', () => {
      const context = { frontend: ['React', 'Next.js'] };
      const availableSkills = [
        { name: 'frontend-react-next' }
      ];
      const result = inferStarterSkills(context, availableSkills);
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('frontend-react-next');
    });

    test('should return multiple matching skills', () => {
      const context = {
        backend: ['Node/Express'],
        datastores: ['Postgres'],
        frontend: ['React'],
        testingSetup: 'Unit + integration + E2E'
      };
      const availableSkills = [
        { name: 'node-express-postgres' },
        { name: 'testing-full-pyramid' },
        { name: 'frontend-react-next' }
      ];
      const result = inferStarterSkills(context, availableSkills);
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('gatherContext', () => {
    beforeEach(() => {
      // Mock path.basename
      jest.spyOn(path, 'basename').mockReturnValue('test-project');
      // Mock process.cwd
      const originalCwd = process.cwd;
      process.cwd = jest.fn(() => '/test/path');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('should return defaults when skip option is true', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readJson.mockResolvedValue({});
      const overrides = { skip: true, projectName: 'Test Project' };
      const context = await gatherContext(overrides);
      expect(context.projectName).toBe('Test Project');
      expect(context.skip).toBe(true);
      expect(mockInquirer.prompt).not.toHaveBeenCalled();
    });

    test('should gather context through inquirer prompts when skip is false', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readJson.mockResolvedValue({});
      mockInquirer.prompt
        .mockResolvedValueOnce({ useDetected: true })
        .mockResolvedValueOnce({ projectName: 'Test', description: 'Test desc', projectType: 'Web app' })
        .mockResolvedValueOnce({ frontend: ['React'] })
        .mockResolvedValueOnce({ backend: ['Node/Express'], datastores: [] })
        .mockResolvedValueOnce({ domainTags: ['Dev'], riskLevel: 'Medium' })
        .mockResolvedValueOnce({ teamSize: 'Solo', gitWorkflow: 'Trunk', testingSetup: 'Unit' })
        .mockResolvedValueOnce({ agentStyle: 'Pair', editPermissions: 'Module' })
        .mockResolvedValueOnce({ extras: [] });

      const context = await gatherContext();
      expect(context.projectName).toBe('Test');
      expect(context.description).toBe('Test desc');
      expect(context.projectType).toBe('Web app');
      expect(mockInquirer.prompt).toHaveBeenCalled();
    });
  });
});
