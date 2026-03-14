import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { performSync } from '../../lib/ide-adapters.js';
import { scaffoldNew } from '../../lib/cli-helpers.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('chalk', () => ({
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  yellow: jest.fn(str => str),
  gray: jest.fn(str => str),
  cyan: jest.fn(str => str),
  bold: { green: jest.fn(str => str), blue: jest.fn(str => str), yellow: jest.fn(str => str) }
}));
jest.mock('../../lib/config.js');
jest.mock('../../lib/context.js');
jest.mock('../../lib/skills.js');

const mockFs = fs;
const mockInquirer = inquirer;

describe('Integration: scaffold command', () => {
  let tempDir;

  beforeEach(() => {
    jest.clearAllMocks();
    // Create temp directory path for testing
    tempDir = path.join(os.tmpdir(), `rosetta-test-${Date.now()}`);
  });

  afterEach(async () => {
    jest.resetAllMocks();
    // Clean up temp directory if it exists
    if (await mockFs.pathExists(tempDir)) {
      await mockFs.remove(tempDir);
    }
  });

  describe('scaffoldNew command flow', () => {
    test('should scaffold new agentic structure with minimal preset', async () => {
      // Mock the necessary functions
      const { loadConfig } = await import('../../lib/config.js');
      const { loadSkillsFromSources } = await import('../../lib/skills.js');
      const { gatherContext, inferStarterSkills } = await import('../../lib/context.js');

      // Setup mocks
      loadConfig.mockResolvedValue({
        defaultPreset: 'minimal',
        autoContext: { enabled: false }
      });
      loadSkillsFromSources.mockResolvedValue([]);
      mockInquirer.prompt
        .mockResolvedValueOnce({ preset: 'minimal' })
        .mockResolvedValueOnce({ useExtraContext: false })
        .mockResolvedValueOnce({ ides: ['VSCode / Claude Code'] })
        .mockResolvedValueOnce({ extraSkillsToCreate: [] });

      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.appendFile.mockResolvedValue();

      // Execute scaffold
      await scaffoldNew({});

      // Verify .ai directory was created
      expect(mockFs.ensureDir).toHaveBeenCalledWith('.ai');

      // Verify core files were written
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/master-skill.md',
        expect.any(String)
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/AGENT.md',
        expect.any(String)
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/task.md',
        expect.any(String)
      );

      // Verify IDE wrapper was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'CLAUDE.md',
        expect.any(String)
      );
    });

    test('should scaffold memory and logs layout', async () => {
      // Mock config
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockInquirer.prompt
        .mockResolvedValueOnce({ preset: 'minimal' })
        .mockResolvedValueOnce({ useExtraContext: false })
        .mockResolvedValueOnce({ ides: [] })
        .mockResolvedValueOnce({ extraSkillsToCreate: [] });

      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.appendFile.mockResolvedValue();

      await scaffoldNew({});

      // Verify memory directory was created
      expect(mockFs.ensureDir).toHaveBeenCalledWith('.ai/memory');
      expect(mockFs.ensureDir).toHaveBeenCalledWith('.ai/memory/entities');
      expect(mockFs.ensureDir).toHaveBeenCalledWith('.ai/logs/daily');

      // Verify memory files were written
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/memory/PROJECT_MEMORY.md',
        expect.any(String)
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.ai/memory/AUTO_MEMORY.md',
        expect.any(String)
      );

      // Verify daily log was created with today's date
      const today = new Date().toISOString().slice(0, 10);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        `.ai/logs/daily/${today}.md`,
        expect.stringContaining(today)
      );
    });

    test('should add starter skills when detected', async () => {
      // Mock config and context
      const { loadConfig } = await import('../../lib/config.js');
      const { loadSkillsFromSources } = await import('../../lib/skills.js');
      const { gatherContext, inferStarterSkills } = await import('../../lib/context.js');

      loadConfig.mockResolvedValue({});

      const mockSkills = [
        {
          name: 'node-express-postgres',
          fileName: 'node-express-postgres.skill.md',
          fullPath: '/templates/skills/node-express-postgres.skill.md',
          source: 'templates/skills'
        }
      ];

      loadSkillsFromSources.mockResolvedValue(mockSkills);
      gatherContext.mockResolvedValue({
        projectName: 'TestProject',
        description: 'Test project',
        projectType: 'API / backend service',
        frontend: [],
        backend: ['Node/Express'],
        datastores: ['Postgres']
      });
      inferStarterSkills.mockReturnValue(mockSkills);

      mockInquirer.prompt
        .mockResolvedValueOnce({ preset: 'minimal' })
        .mockResolvedValueOnce({ useExtraContext: true })
        .mockResolvedValueOnce({ ides: [] })
        .mockResolvedValueOnce({ addSkills: true })
        .mockResolvedValueOnce({ extraSkillsToCreate: [] });

      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Skill template {{PROJECT_NAME}}');
      mockFs.writeFile.mockResolvedValue();

      await scaffoldNew({});

      // Verify skill was created
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'skills/node-express-postgres/SKILL.md',
        expect.stringContaining('TestProject')
      );
    });

    test('should update .gitignore with Rosetta paths', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockInquirer.prompt
        .mockResolvedValueOnce({ preset: 'minimal' })
        .mockResolvedValueOnce({ useExtraContext: false })
        .mockResolvedValueOnce({ ides: [] })
        .mockResolvedValueOnce({ extraSkillsToCreate: [] });

      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.appendFile.mockResolvedValue();

      await scaffoldNew({});

      // Verify .gitignore was created with Rosetta entries
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.gitignore',
        expect.stringContaining('.ai/logs/')
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        '.gitignore',
        expect.stringContaining('.ai/task.md')
      );
    });

    test('should append to existing .gitignore', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockInquirer.prompt
        .mockResolvedValueOnce({ preset: 'minimal' })
        .mockResolvedValueOnce({ useExtraContext: false })
        .mockResolvedValueOnce({ ides: [] })
        .mockResolvedValueOnce({ extraSkillsToCreate: [] });

      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(true); // .gitignore exists
      mockFs.readFile.mockResolvedValue('Existing content\n');
      mockFs.writeFile.mockResolvedValue();
      mockFs.appendFile.mockResolvedValue();

      await scaffoldNew({});

      // Verify .gitignore was appended, not overwritten
      expect(mockFs.appendFile).toHaveBeenCalledWith(
        '.gitignore',
        expect.stringContaining('.ai/logs/')
      );
      expect(mockFs.writeFile).not.toHaveBeenCalledWith('.gitignore');
    });
  });

  describe('scaffold with dry-run mode', () => {
    test('should not write files in dry-run mode', async () => {
      const { loadConfig } = await import('../../lib/config.js');
      loadConfig.mockResolvedValue({});

      mockInquirer.prompt
        .mockResolvedValueOnce({ preset: 'minimal' })
        .mockResolvedValueOnce({ useExtraContext: false })
        .mockResolvedValueOnce({ ides: [] })
        .mockResolvedValueOnce({ extraSkillsToCreate: [] });

      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.appendFile.mockResolvedValue();

      await scaffoldNew({ dryRun: true });

      // Verify write was not called
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      expect(mockFs.appendFile).not.toHaveBeenCalled();
    });
  });

  describe('sync command flow', () => {
    test('should verify existing IDE wrappers', async () => {
      mockFs.pathExists.mockImplementation((filePath) => {
        return filePath === '.ai/master-skill.md' || filePath === 'CLAUDE.md';
      });
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await performSync({ interactive: false });

      expect(mockFs.pathExists).toHaveBeenCalledWith('.ai/master-skill.md');
      expect(mockFs.pathExists).toHaveBeenCalledWith('CLAUDE.md');
      consoleLogSpy.mockRestore();
    });

    test('should regenerate wrappers when requested', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readFile.mockResolvedValue('Template content');
      mockFs.writeFile.mockResolvedValue();
      mockFs.ensureDir.mockResolvedValue();

      await performSync({ interactive: false, regenerateWrappers: true });

      expect(mockFs.writeFile).toHaveBeenCalled();
    });
  });
});
