import { jest, describe, test, expect } from '@jest/globals';
import {
  TARGETS,
  SKILLS_SOURCES,
  ROSETTA_DIR,
  REGISTRY_PATH,
  DEFAULT_REGISTRY,
  PROJECT_MEMORY_TEMPLATE,
  AUTO_MEMORY_TEMPLATE,
  DAILY_LOG_TEMPLATE
} from '../lib/constants.js';

describe('lib/constants.js', () => {
  describe('TARGETS', () => {
    test('should be an array of IDE targets', () => {
      expect(Array.isArray(TARGETS)).toBe(true);
      expect(TARGETS.length).toBeGreaterThan(0);
    });

    test('each target should have label, path, and template properties', () => {
      TARGETS.forEach(target => {
        expect(target).toHaveProperty('label');
        expect(target).toHaveProperty('path');
        expect(target).toHaveProperty('template');
        expect(typeof target.label).toBe('string');
        expect(typeof target.path).toBe('string');
        expect(typeof target.template).toBe('string');
      });
    });

    test('should include VSCode / Claude Code target', () => {
      const claudeTarget = TARGETS.find(t => t.label === 'VSCode / Claude Code');
      expect(claudeTarget).toBeDefined();
      expect(claudeTarget?.path).toBe('CLAUDE.md');
    });

    test('should include Cursor target', () => {
      const cursorTarget = TARGETS.find(t => t.label === 'Cursor');
      expect(cursorTarget).toBeDefined();
      expect(cursorTarget?.path).toBe('.cursorrules');
    });
  });

  describe('SKILLS_SOURCES', () => {
    test('should be an array of skill source paths', () => {
      expect(Array.isArray(SKILLS_SOURCES)).toBe(true);
      expect(SKILLS_SOURCES.length).toBeGreaterThan(0);
    });

    test('each source should be a valid path string', () => {
      SKILLS_SOURCES.forEach(source => {
        expect(typeof source).toBe('string');
        expect(source.length).toBeGreaterThan(0);
      });
    });
  });

  describe('ROSETTA_DIR', () => {
    test('should be a valid directory path', () => {
      expect(typeof ROSETTA_DIR).toBe('string');
      expect(ROSETTA_DIR).toContain('.rosetta');
    });
  });

  describe('REGISTRY_PATH', () => {
    test('should be a valid file path', () => {
      expect(typeof REGISTRY_PATH).toBe('string');
      expect(REGISTRY_PATH).toMatch(/registry\.json$/);
    });
  });

  describe('DEFAULT_REGISTRY', () => {
    test('should be an object with presets and skills arrays', () => {
      expect(DEFAULT_REGISTRY).toBeInstanceOf(Object);
      expect(Array.isArray(DEFAULT_REGISTRY.presets)).toBe(true);
      expect(Array.isArray(DEFAULT_REGISTRY.skills)).toBe(true);
    });

    test('each preset should have required properties', () => {
      DEFAULT_REGISTRY.presets.forEach(preset => {
        expect(preset).toHaveProperty('name');
        expect(preset).toHaveProperty('domain');
        expect(preset).toHaveProperty('description');
        expect(preset).toHaveProperty('url');
      });
    });

    test('each skill should have required properties', () => {
      DEFAULT_REGISTRY.skills.forEach(skill => {
        expect(skill).toHaveProperty('name');
        expect(skill).toHaveProperty('domain');
        expect(skill).toHaveProperty('description');
        expect(skill).toHaveProperty('url');
      });
    });
  });

  describe('PROJECT_MEMORY_TEMPLATE', () => {
    test('should be a non-empty string', () => {
      expect(typeof PROJECT_MEMORY_TEMPLATE).toBe('string');
      expect(PROJECT_MEMORY_TEMPLATE.length).toBeGreaterThan(0);
    });

    test('should contain key sections', () => {
      expect(PROJECT_MEMORY_TEMPLATE).toContain('## What belongs here');
      expect(PROJECT_MEMORY_TEMPLATE).toContain('## What does NOT belong here');
      expect(PROJECT_MEMORY_TEMPLATE).toContain('## How the agent should update this file');
    });
  });

  describe('AUTO_MEMORY_TEMPLATE', () => {
    test('should be a non-empty string', () => {
      expect(typeof AUTO_MEMORY_TEMPLATE).toBe('string');
      expect(AUTO_MEMORY_TEMPLATE.length).toBeGreaterThan(0);
    });

    test('should contain key sections', () => {
      expect(AUTO_MEMORY_TEMPLATE).toContain('## What belongs here');
      expect(AUTO_MEMORY_TEMPLATE).toContain('## What does NOT belong here');
      expect(AUTO_MEMORY_TEMPLATE).toContain('## How the agent should update this file');
    });
  });

  describe('DAILY_LOG_TEMPLATE', () => {
    test('should be a non-empty string', () => {
      expect(typeof DAILY_LOG_TEMPLATE).toBe('string');
      expect(DAILY_LOG_TEMPLATE.length).toBeGreaterThan(0);
    });

    test('should contain placeholder for date', () => {
      expect(DAILY_LOG_TEMPLATE).toContain('{{DATE}}');
    });

    test('should contain key sections', () => {
      expect(DAILY_LOG_TEMPLATE).toContain('## How to use this file');
      expect(DAILY_LOG_TEMPLATE).toContain('## Entries');
    });
  });
});
