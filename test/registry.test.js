import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import fs from 'fs-extra';
import https from 'https';
import { RegistryManager } from '../lib/registry.js';
import { ROSETTA_DIR, REGISTRY_PATH, DEFAULT_REGISTRY } from '../lib/constants.js';

describe('lib/registry.js', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.resetAllMocks();
    jest.restoreAllMocks();
  });

  describe('RegistryManager.ensureRegistry', () => {
    test('should create registry directory', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(false);
      await RegistryManager.ensureRegistry();
      expect(fs.ensureDir).toHaveBeenCalledWith(ROSETTA_DIR);
    });

    test('should write default registry when it does not exist', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(false);
      fs.writeJson.mockResolvedValue();
      await RegistryManager.ensureRegistry();
      expect(fs.writeJson).toHaveBeenCalledWith(REGISTRY_PATH, DEFAULT_REGISTRY, { spaces: 2 });
    });
  });

  describe('RegistryManager.load', () => {
    test('should load registry from disk', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      const mockRegistry = { presets: [], skills: [] };
      fs.readJson.mockResolvedValue(mockRegistry);
      const registry = await RegistryManager.load();
      expect(registry).toEqual(mockRegistry);
      expect(fs.readJson).toHaveBeenCalledWith(REGISTRY_PATH);
    });
  });

  describe('RegistryManager.search', () => {
    test('should return all items of a type when no domain specified', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      const mockRegistry = {
        presets: [
          { name: 'preset1', domain: 'web' },
          { name: 'preset2', domain: 'mobile' }
        ],
        skills: []
      };
      fs.readJson.mockResolvedValue(mockRegistry);
      const results = await RegistryManager.search('presets');
      expect(results).toHaveLength(2);
      expect(results).toEqual(mockRegistry.presets);
    });

    test('should filter items by domain when specified', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      const mockRegistry = {
        presets: [
          { name: 'preset1', domain: 'web' },
          { name: 'preset2', domain: 'mobile' }
        ],
        skills: []
      };
      fs.readJson.mockResolvedValue(mockRegistry);
      const results = await RegistryManager.search('presets', 'web');
      expect(results).toHaveLength(1);
      expect(results[0]).toEqual(mockRegistry.presets[0]);
    });
  });

  describe('RegistryManager.find', () => {
    test('should return item when found', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      const mockRegistry = {
        presets: [{ name: 'test-preset', domain: 'web' }],
        skills: []
      };
      fs.readJson.mockResolvedValue(mockRegistry);
      const result = await RegistryManager.find('presets', 'test-preset');
      expect(result).toEqual(mockRegistry.presets[0]);
    });

    test('should return undefined when item not found', async () => {
      fs.ensureDir.mockResolvedValue();
      fs.pathExists.mockResolvedValue(true);
      const mockRegistry = { presets: [], skills: [] };
      fs.readJson.mockResolvedValue(mockRegistry);
      const result = await RegistryManager.find('presets', 'nonexistent');
      expect(result).toBeUndefined();
    });
  });
});
