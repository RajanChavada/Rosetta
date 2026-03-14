import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { performSync } from '../../lib/ide-adapters.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  yellow: jest.fn(str => str),
  gray: jest.fn(str => str),
  red: jest.fn(str => str)
}));

const mockFs = fs;
const mockInquirer = inquirer;

describe('Integration: sync command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('verify mode (default)', () => {
    test('should return early when master-skill.md does not exist', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      await performSync({ interactive: false });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No .ai/master-skill.md found')
      );
    });

    test('should verify all configured IDEs exist', async () => {
      mockFs.pathExists.mockResolvedValue(true);

      await performSync({ interactive: false });

      // Verify all 9 IDE targets are checked
      expect(mockFs.pathExists).toHaveBeenCalledWith('CLAUDE.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.cursorrules');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.agent/skills/project-skill.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.github/copilot-instructions.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.windsurf/rules/rosetta-rules.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('skills/gsd-skill.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.codex/rules.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.kilo/rules.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('.continue/config.md');
    });

    test('should log status for existing IDE files', async () => {
      mockFs.pathExists.mockResolvedValue(true);

      await performSync({ interactive: false });

      const logCalls = console.log.mock.calls.map(call => call[0]);
      expect(logCalls.some(msg => msg.includes('exists and references master spec'))).toBe(true);
    });

    test('should not modify files in verify mode', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await performSync({ interactive: false, regenerateWrappers: false });

      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });

    test('should prompt for missing files in interactive mode', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === '.ai/master-skill.md');
      mockInquirer.prompt.mockResolvedValue({ create: false });
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await performSync({ interactive: true });

      expect(mockInquirer.prompt).toHaveBeenCalled();
    });

    test('should create missing file when confirmed in interactive mode', async () => {
      mockFs.pathExists.mockImplementation((filePath) => filePath === '.ai/master-skill.md');
      mockInquirer.prompt.mockResolvedValue({ create: true });
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await performSync({ interactive: true });

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });

  describe('regenerate mode', () => {
    test('should regenerate all IDE wrappers from templates', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await performSync({ interactive: false, regenerateWrappers: true });

      // Should regenerate all 9 IDE wrappers
      expect(mockFs.writeFile).toHaveBeenCalledTimes(9);
    });

    test('should regenerate only selected IDEs', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await performSync({
        interactive: false,
        regenerateWrappers: true,
        selectedIdes: ['VSCode / Claude Code', 'Cursor']
      });

      expect(mockFs.writeFile).toHaveBeenCalledTimes(2);
      expect(mockFs.writeFile).toHaveBeenCalledWith('CLAUDE.md', expect.any(String));
      expect(mockFs.writeFile).toHaveBeenCalledWith('.cursorrules', expect.any(String));
    });

    test('should not regenerate wrappers in dry-run mode', async () => {
      mockFs.pathExists.mockResolvedValue(true);

      await performSync({
        interactive: false,
        regenerateWrappers: true,
        dryRun: true
      });

      expect(mockFs.writeFile).not.toHaveBeenCalled();
    });
  });

  describe('error handling', () => {
    test('should handle missing master-skill.md gracefully', async () => {
      mockFs.pathExists.mockResolvedValue(false);

      await performSync({ interactive: false });

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No .ai/master-skill.md found')
      );
    });

    test('should continue if one IDE file read fails', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile
        .mockResolvedValueOnce('Template 1')
        .mockRejectedValueOnce(new Error('Read error'))
        .mockResolvedValue('Template 2');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

      await performSync({ interactive: false, regenerateWrappers: true });

      // Should still try to write files for other IDEs
      expect(mockFs.writeFile).toHaveBeenCalled();
      consoleErrorSpy.mockRestore();
    });
  });
});
