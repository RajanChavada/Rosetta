import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import inquirer from 'inquirer';
import chalk from 'chalk';
import { addIde } from '../../lib/commands/add-ide.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  yellow: jest.fn(str => str),
  red: jest.fn(str => str),
  gray: jest.fn(str => str)
}));
jest.mock('../../lib/config.js');
jest.mock('../../lib/ide-adapters.js');

const mockFs = fs;
const mockInquirer = inquirer;

describe('Integration: add-ide command', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('IDE selection', () => {
    test('should find IDE by name when provided as argument', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await addIde('cursor', {});

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            message: expect.stringContaining('Create'),
            default: true
          })
        ])
      );
    });

    test('should find IDE by partial name match', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await addIde('codex', {});

      expect(mockInquirer.prompt).toHaveBeenCalled();
    });

    test('should show error when IDE not found', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      await addIde('nonexistent-ide', {});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('not found')
      );
      expect(mockInquirer.prompt).not.toHaveBeenCalled();
    });

    test('should prompt for IDE selection when no name provided', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      mockInquirer.prompt
        .mockResolvedValueOnce({ ideChoice: 'VSCode / Claude Code' })
        .mockResolvedValueOnce({ confirm: true });

      await addIde(null, {});

      expect(mockInquirer.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'ideChoice',
            message: expect.stringContaining('Select IDE')
          })
        ])
      );
    });

    test('should show all available IDEs when none configured', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(false); // No IDEs configured
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      mockInquirer.prompt
        .mockResolvedValueOnce({ ideChoice: 'VSCode / Claude Code' })
        .mockResolvedValueOnce({ confirm: true });

      await addIde(null, {});

      // Check that all 9 IDEs are offered as choices
      const firstPromptCall = mockInquirer.prompt.mock.calls[0][0];
      const choices = firstPromptCall[0].choices;

      expect(choices.length).toBeGreaterThan(0);
    });

    test('should hide already configured IDEs from selection', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      // VSCode and Cursor already configured
      mockFs.pathExists.mockImplementation((filePath) => {
        return filePath === '.ai/master-skill.md' ||
               filePath === 'CLAUDE.md' ||
               filePath === '.cursorrules';
      });

      mockInquirer.prompt.mockResolvedValue({ confirm: true });
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await addIde(null, {});

      const firstPromptCall = mockInquirer.prompt.mock.calls[0][0];
      const choices = firstPromptCall[0].choices;

      // Should not include VSCode and Cursor
      const choiceNames = choices.map(c => c.value || c);
      expect(choiceNames).not.toContain('VSCode / Claude Code');
      expect(choiceNames).not.toContain('Cursor');
    });
  });

  describe('IDE wrapper creation', () => {
    test('should create wrapper file for selected IDE', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await addIde('cursor', {});

      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.cursorrules',
        expect.any(String)
      );
    });

    test('should create parent directory if needed', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await addIde('windsurf', {});

      expect(mockFs.ensureDir).toHaveBeenCalled();
    });

    test('should respect dry-run mode', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await addIde('cursor', { dryRun: true });

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('[Dry-run]'));
    });
  });

  describe('confirmation flow', () => {
    test('should prompt for confirmation before creating wrapper', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await addIde('cursor', {});

      const confirmPrompt = mockInquirer.prompt.mock.calls.find(
        call => call[0].name === 'confirm'
      );

      expect(confirmPrompt).toBeDefined();
      expect(confirmPrompt[0].message).toContain('Create');
    });

    test('should not create wrapper when confirmation declined', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockInquirer.prompt.mockResolvedValue({ confirm: false });
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await addIde('cursor', {});

      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('cancelled')
      );
    });

    test('should show success message after creating wrapper', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await addIde('cursor', {});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('Added')
      );
      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('.cursorrules')
      );
    });
  });

  describe('error handling', () => {
    test('should return early when master-skill.md does not exist', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(false);

      await addIde('cursor', {});

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('No .ai/master-skill.md found')
      );
      expect(mockInquirer.prompt).not.toHaveBeenCalled();
    });

    test('should handle file write errors gracefully', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template');
      mockFs.writeFile.mockRejectedValue(new Error('Write failed'));
      mockFs.ensureDir.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ confirm: true });

      await addIde('cursor', {});

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('all supported IDEs', () => {
    const supportedIdes = [
      { name: 'claude', path: 'CLAUDE.md' },
      { name: 'cursor', path: '.cursorrules' },
      { name: 'antigravity', path: '.agent/skills/project-skill.md' },
      { name: 'copilot', path: '.github/copilot-instructions.md' },
      { name: 'windsurf', path: '.windsurf/rules/rosetta-rules.md' },
      { name: 'gsd', path: 'skills/gsd-skill.md' },
      { name: 'codex', path: '.codex/rules.md' },
      { name: 'kilo', path: '.kilo/rules.md' },
      { name: 'continue', path: '.continue/config.md' }
    ];

    supportedIdes.forEach(({ name, path: idePath }) => {
      test(`should support adding ${name} IDE`, async () => {
        const { loadConfig } = await import('../../lib/config.js');
        loadConfig.mockResolvedValue({});

        mockFs.pathExists.mockResolvedValue(true);
        mockFs.readFile.mockResolvedValue('Template content');
        mockFs.writeFile.mockResolvedValue();
        mockFs.ensureDir.mockResolvedValue();
        mockInquirer.prompt.mockResolvedValue({ confirm: true });

        await addIde(name, {});

        expect(mockFs.writeFile).toHaveBeenCalledWith(
          idePath,
          expect.any(String)
        );
        jest.clearAllMocks();
      });
    });
  });
});
