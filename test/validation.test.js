import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import {
  validateRepo,
  reportHealth,
  syncMemory
} from '../lib/validation.js';

describe('lib/validation.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('validateRepo', () => {
    test('should return 100 when all required files exist', async () => {
      fs.pathExists.mockResolvedValue(true);
      const score = await validateRepo();
      expect(score).toBe(100);
    });

    test('should deduct points for missing master-skill.md', async () => {
      fs.pathExists.mockImplementation((filePath) => filePath !== '.ai/master-skill.md');
      const score = await validateRepo();
      expect(score).toBeLessThan(100);
    });

    test('should check all six validation points', async () => {
      fs.pathExists.mockResolvedValue(true);
      await validateRepo();
      expect(fs.pathExists).toHaveBeenCalledWith('.ai/master-skill.md');
      expect(fs.pathExists).toHaveBeenCalledWith('.ai/AGENT.md');
      expect(fs.pathExists).toHaveBeenCalledWith('.ai/task.md');
      expect(fs.pathExists).toHaveBeenCalledWith('.ai/memory/PROJECT_MEMORY.md');
      expect(fs.pathExists).toHaveBeenCalledWith('.ai/memory/AUTO_MEMORY.md');
      expect(fs.pathExists).toHaveBeenCalledWith('.ai/logs/daily/');
    });
  });

  describe('syncMemory', () => {
    test('should return early when log directory does not exist', async () => {
      fs.pathExists.mockResolvedValue(false);
      await syncMemory();
      expect(fs.readdir).not.toHaveBeenCalled();
    });

    test('should find and display existing daily logs', async () => {
      fs.pathExists.mockImplementation((filePath) => filePath === '.ai/logs/daily');
      fs.readdir.mockResolvedValue(['2023-01-01.md', '2023-01-02.md']);
      await syncMemory();
      expect(fs.readdir).toHaveBeenCalledWith('.ai/logs/daily');
    });

    test('should rotate logs when more than 7 exist', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readdir.mockResolvedValue(Array(10).fill(0).map((_, i) => `2023-01-0${i + 1}.md`));
      await syncMemory();
      expect(fs.ensureDir).toHaveBeenCalledWith('.ai/logs/archive');
    });
  });
});
