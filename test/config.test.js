import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import path from 'path';
import os from 'os';
import { loadConfig, useProfile, ensureRegistry, loadRegistry, searchRegistry, findRegistryItem } from '../lib/config.js';

describe('lib/config.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe('loadConfig', () => {
    test('should return empty object when no config file exists', async () => {
      fs.pathExists.mockResolvedValue(false);
      const config = await loadConfig();
      expect(config).toEqual({});
    });

    test('should load and parse .rosetta.json when it exists', async () => {
      const mockConfig = { project: 'test', presets: ['minimal'] };
      fs.pathExists.mockResolvedValueOnce(true).mockResolvedValue(false);
      fs.readJson.mockResolvedValue(mockConfig);
      const config = await loadConfig();
      expect(config).toEqual(mockConfig);
    });

    test('should handle malformed .rosetta.json gracefully', async () => {
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockRejectedValue(new Error('Parse error'));
      const consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
      const config = await loadConfig();
      expect(config).toEqual({});
      expect(consoleWarnSpy).toHaveBeenCalled();
      consoleWarnSpy.mockRestore();
    });
  });

  describe('useProfile', () => {
    test('should create profile directory and active-profile.json', async () => {
      const profileDir = path.join(os.homedir(), '.rosetta');
      const profileFile = path.join(profileDir, 'active-profile.json');
      fs.ensureDir.mockResolvedValue();
      fs.writeJson.mockResolvedValue();
      const consoleLogSpy = jest.spyOn(console, 'log').mockImplementation(() => {});

      await useProfile('test-profile');

      expect(fs.ensureDir).toHaveBeenCalledWith(profileDir);
      expect(fs.writeJson).toHaveBeenCalledWith(profileFile, { active: 'test-profile' }, { spaces: 2 });
      consoleLogSpy.mockRestore();
    });
  });

  describe('ensureRegistry', () => {
    test('should create registry directory if it does not exist', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(false);
      await ensureRegistry();
      expect(fs.ensureDir).toHaveBeenCalled();
    });

    test('should create default registry file if it does not exist', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(false);
      fs.writeJson.mockResolvedValue();
      await ensureRegistry();
      expect(fs.writeJson).toHaveBeenCalled();
    });
  });

  describe('loadRegistry', () => {
    test('should load and return registry content', async () => {
      const mockRegistry = { presets: [], skills: [] };
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(mockRegistry);
      const registry = await loadRegistry();
      expect(registry).toEqual(mockRegistry);
    });
  });

  describe('searchRegistry', () => {
    test('should return all items of a type when no domain specified', async () => {
      const mockRegistry = {
        presets: [
          { name: 'preset1', domain: 'web' },
          { name: 'preset2', domain: 'mobile' }
        ],
        skills: []
      };
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(mockRegistry);
      const results = await searchRegistry('presets');
      expect(results).toHaveLength(2);
    });

    test('should filter items by domain when specified', async () => {
      const mockRegistry = {
        presets: [
          { name: 'preset1', domain: 'web' },
          { name: 'preset2', domain: 'mobile' }
        ],
        skills: []
      };
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(mockRegistry);
      const results = await searchRegistry('presets', 'web');
      expect(results).toHaveLength(1);
      expect(results[0].name).toBe('preset1');
    });
  });

  describe('findRegistryItem', () => {
    test('should return null when item not found', async () => {
      const mockRegistry = { presets: [], skills: [] };
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(mockRegistry);
      const result = await findRegistryItem('presets', 'nonexistent');
      expect(result).toBeUndefined();
    });

    test('should return item when found', async () => {
      const mockRegistry = {
        presets: [{ name: 'test-preset', domain: 'web' }],
        skills: []
      };
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      fs.readJson.mockResolvedValue(mockRegistry);
      const result = await findRegistryItem('presets', 'test-preset');
      expect(result).toBeDefined();
      expect(result.name).toBe('test-preset');
    });
  });
});
