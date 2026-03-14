import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import {
  migrateExisting,
  findExistingAgentFiles,
  migrateFromSource
} from '../lib/migration.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  red: jest.fn(str => str),
  yellow: jest.fn(str => str),
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  bold: { green: jest.fn(str => str) }
}));

const mockFs = fs;
const mockInquirer = inquirer;

describe('lib/migration.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('findExistingAgentFiles', () => {
    test('should return empty array when no agent files exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      const files = await findExistingAgentFiles();
      expect(files).toEqual([]);
    });

    test('should find CLAUDE.md file', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'CLAUDE.md');
      const files = await findExistingAgentFiles();
      expect(files).toContain('CLAUDE.md');
    });

    test('should find .cursorrules file', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === '.cursorrules');
      const files = await findExistingAgentFiles();
      expect(files).toContain('.cursorrules');
    });

    test('should find multiple agent files', async () => {
      mockFs.pathExists.mockImplementation((filePath) => {
        return ['CLAUDE.md', '.cursorrules', '.github/copilot-instructions.md'].includes(filePath);
      });
      const files = await findExistingAgentFiles();
      expect(files.length).toBe(3);
      expect(files).toContain('CLAUDE.md');
      expect(files).toContain('.cursorrules');
      expect(files).toContain('.github/copilot-instructions.md');
    });

    test('should include custom source if provided and exists', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === '/custom/source.md');
      const files = await findExistingAgentFiles('/custom/source.md');
      expect(files).toContain('/custom/source.md');
    });

    test('should handle custom source that does not exist', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValue(false);
      const files = await findExistingAgentFiles('/nonexistent/source.md');
      expect(files).not.toContain('/nonexistent/source.md');
      consoleLogSpy.mockRestore();
    });
  });

  describe('migrateExisting', () => {
    beforeEach(() => {
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
    });

    test('should return early when no existing agent files found', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValue(false);
      await migrateExisting();
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });

    test('should create master-skill.md from existing file', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'CLAUDE.md');
      mockInquirer.prompt.mockResolvedValue({ sourceChoice: 'CLAUDE.md' });
      await migrateExisting();
      expect(mockFs.ensureDir).toHaveBeenCalledWith('.ai');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/master-skill.md',
        expect.stringContaining('CLAUDE.md')
      );
    });

    test('should merge all files when user chooses merge option', async () => {
      mockFs.pathExists.mockImplementation((filePath) =>
        ['CLAUDE.md', '.cursorrules'].includes(filePath)
      );
      mockFs.readFile.mockImplementation((filePath) => `Content from ${filePath}`);
      mockInquirer.prompt.mockResolvedValue({ sourceChoice: 'Merge all (concatenate)' });
      await migrateExisting();
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/master-skill.md',
        expect.stringContaining('CLAUDE.md')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/master-skill.md',
        expect.stringContaining('.cursorrules')
      );
    });

    test('should prompt for IDE wrapper regeneration', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      mockInquirer.prompt.mockResolvedValue({
        sourceChoice: 'CLAUDE.md',
        regenerate: false
      });
      await migrateExisting();
      expect(mockInquirer.prompt).toHaveBeenCalled();
    });
  });

  describe('migrateFromSource', () => {
    beforeEach(() => {
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Source content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
    });

    test('should create .ai directory and master-skill.md', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'CLAUDE.md');
      await migrateFromSource('CLAUDE.md');
      expect(mockFs.ensureDir).toHaveBeenCalledWith('.ai');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/master-skill.md',
        expect.stringContaining('CLAUDE.md')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/master-skill.md',
        expect.stringContaining('Source content')
      );
    });

    test('should add header comment with source file reference', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'CLAUDE.md');
      await migrateFromSource('CLAUDE.md');
      const writeCall = mockFs.writeFile.mock.calls[0];
      const writtenContent = writeCall[1];
      expect(writtenContent).toContain('<!-- Generated by rosetta from CLAUDE.md -->');
    });

    test('should return error when source file does not exist', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValue(false);
      await migrateFromSource('nonexistent.md');
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Source file nonexistent.md not found')
      );
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });

    test('should prompt for scaffolding rest of .ai structure', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === 'CLAUDE.md');
      mockInquirer.prompt.mockResolvedValue({ scaffoldOthers: true });
      await migrateFromSource('CLAUDE.md');
      expect(mockInquirer.prompt).toHaveBeenCalled();
    });
  });
});
