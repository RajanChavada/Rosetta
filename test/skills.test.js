import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import inquirer from 'inquirer';
import { execSync } from 'child_process';
import {
  loadSkillsFromSources,
  createSkill,
  createSkillFromFile
} from '../lib/skills.js';

// Mock dependencies
jest.mock('fs-extra');
jest.mock('inquirer');
jest.mock('child_process');
jest.mock('chalk', () => ({
  blue: jest.fn(str => str),
  green: jest.fn(str => str),
  yellow: jest.fn(str => str),
  red: jest.fn(str => str),
  gray: jest.fn(str => str)
}));

const mockFs = fs;
const mockInquirer = inquirer;
const mockExecSync = execSync;

describe('lib/skills.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('loadSkillsFromSources', () => {
    test('should load skills from default sources', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readdir.mockResolvedValue(['test.skill.md', 'another.skill.md']);
      const skills = await loadSkillsFromSources();
      expect(skills).toHaveLength(2);
      expect(skills[0]).toHaveProperty('name');
      expect(skills[0]).toHaveProperty('fileName');
      expect(skills[0]).toHaveProperty('fullPath');
      expect(skills[0]).toHaveProperty('source');
    });

    test('should filter only .skill.md files', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readdir.mockResolvedValue(['test.skill.md', 'other.md', 'README.md']);
      const skills = await loadSkillsFromSources();
      expect(skills).toHaveLength(1);
      expect(skills[0].name).toBe('test');
    });

    test('should handle non-existent skill directories', async () => {
      mockFs.pathExists.mockResolvedValue(false);
      const skills = await loadSkillsFromSources();
      expect(skills).toHaveLength(0);
    });

    test('should deduplicate skills by name, keeping the last occurrence', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readdir
        .mockResolvedValueOnce(['test.skill.md'])
        .mockResolvedValueOnce(['test.skill.md', 'other.skill.md']);
      const skills = await loadSkillsFromSources();
      const testSkills = skills.filter(s => s.name === 'test');
      expect(testSkills).toHaveLength(1);
    });

    test('should add custom skills directory when provided', async () => {
      mockFs.pathExists.mockResolvedValue(true);
      mockFs.readdir.mockResolvedValue(['custom.skill.md']);
      const skills = await loadSkillsFromSources({ skillsDir: '/custom/skills' });
      expect(skills.length).toBeGreaterThan(0);
    });

    test('should clone skills from git repo when provided', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValue(false);
      mockExecSync.mockReturnValue();
      mockFs.readdir.mockResolvedValue(['repo-skill.skill.md']);
      const skills = await loadSkillsFromSources({ skillsRepo: 'https://github.com/test/skills.git' });
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining('git clone'),
        expect.any(Object)
      );
      consoleLogSpy.mockRestore();
    });

    test('should handle git clone errors gracefully', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValue(false);
      mockExecSync.mockImplementation(() => {
        throw new Error('Clone failed');
      });
      const skills = await loadSkillsFromSources({ skillsRepo: 'https://github.com/test/skills.git' });
      expect(skills).toHaveLength(0);
      consoleLogSpy.mockRestore();
    });
  });

  describe('createSkill', () => {
    beforeEach(() => {
      mockFs.ensureDir.mockResolvedValue();
      mockFs.pathExists.mockResolvedValue(false);
      mockFs.readFile.mockResolvedValue('Skill template content');
      mockFs.writeFile.mockResolvedValue();
      mockInquirer.prompt.mockResolvedValue({ proceed: true });
    });

    test('should create skill directory structure', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await createSkill('test-skill');
      expect(mockFs.ensureDir).toHaveBeenCalledWith('skills/test-skill');
      expect(mockFs.ensureDir).toHaveBeenCalledWith('skills/test-skill/tests');
      consoleLogSpy.mockRestore();
    });

    test('should create SKILL.md and tests/prompts.md files', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await createSkill('test-skill');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'skills/test-skill/SKILL.md',
        expect.any(String)
      );
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'skills/test-skill/tests/prompts.md',
        expect.any(String)
      );
      consoleLogSpy.mockRestore();
    });

    test('should replace {{name}} placeholder in templates', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.readFile.mockResolvedValue('Skill name: {{name}}');
      await createSkill('test-skill');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'skills/test-skill/SKILL.md',
        'Skill name: test-skill'
      );
      consoleLogSpy.mockRestore();
    });

    test('should not overwrite when user declines in interactive mode', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValueOnce(true).mockResolvedValue(false);
      mockInquirer.prompt.mockResolvedValue({ proceed: false });
      await createSkill('test-skill', { interactive: true });
      expect(mockFs.writeFile).not.toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });

    test('should create skill without confirmation in non-interactive mode', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      mockFs.pathExists.mockResolvedValue(true);
      await createSkill('test-skill', { interactive: false });
      expect(mockFs.writeFile).toHaveBeenCalled();
      consoleLogSpy.mockRestore();
    });
  });

  describe('createSkillFromFile', () => {
    beforeEach(() => {
      mockFs.ensureDir.mockResolvedValue();
      mockFs.readFile.mockResolvedValue('Template content with {{PROJECT_NAME}}');
      mockFs.writeFile.mockResolvedValue();
    });

    test('should create skill directory and write rendered content', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      await createSkillFromFile('test-skill', '/path/to/template.md', { projectName: 'Test' });
      expect(mockFs.ensureDir).toHaveBeenCalledWith('skills/test-skill');
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'skills/test-skill/SKILL.md',
        'Template content with Test'
      );
      consoleLogSpy.mockRestore();
    });

    test('should read template from provided path', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const templatePath = '/path/to/template.md';
      await createSkillFromFile('test-skill', templatePath, {});
      expect(mockFs.readFile).toHaveBeenCalledWith(templatePath, 'utf8');
      consoleLogSpy.mockRestore();
    });

    test('should apply context to template rendering', async () => {
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});
      const context = {
        projectName: 'MyProject',
        projectType: 'CLI tool',
        frontend: [],
        backend: ['Node']
      };
      mockFs.readFile.mockResolvedValue('{{PROJECT_NAME}} - {{PROJECT_TYPE}} - {{BACKEND_STACK}}');
      await createSkillFromFile('test-skill', '/path/to/template.md', context);
      expect(mockFs.writeFile).toHaveBeenCalledWith(
        'skills/test-skill/SKILL.md',
        expect.stringContaining('MyProject')
      );
      consoleLogSpy.mockRestore();
    });
  });
});
