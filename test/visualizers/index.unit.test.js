import { jest, describe, test, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compute absolute paths for modules to mock
const skillsManifestModulePath = path.resolve(__dirname, '../../lib/skills-manifest.js');
const catalogModulePath = path.resolve(__dirname, '../../lib/catalog.js');

// Mock the skills-manifest module
jest.unstable_mockModule(skillsManifestModulePath, () => ({
  loadManifest: jest.fn()
}));

// Mock the catalog module
jest.unstable_mockModule(catalogModulePath, () => ({
  loadCatalog: jest.fn()
}));

// Variables for imports
let loadInstalledSkills;
let loadCatalogSkills;
let loadManifestMock;
let loadCatalogMock;

beforeAll(async () => {
  // Import the mocked modules to get the mock functions
  const skillsManifest = await import(skillsManifestModulePath);
  loadManifestMock = skillsManifest.loadManifest;

  const catalog = await import(catalogModulePath);
  loadCatalogMock = catalog.loadCatalog;

  // Import the module under test
  const visualizers = await import('../../lib/visualizers/index.js');
  loadInstalledSkills = visualizers.loadInstalledSkills;
  loadCatalogSkills = visualizers.loadCatalogSkills;
});

afterEach(() => {
  jest.clearAllMocks();
});

describe('visualizers/index - loadInstalledSkills', () => {
  test('loads installed skills from manifest and transforms to unified schema', async () => {
    const mockManifest = {
      version: '1.0',
      installed: [
        {
          name: 'node-express-postgres',
          source: 'catalog',
          commit: 'abc123',
          installedAt: '2026-03-15T10:30:00.000Z',
          path: '.rosetta/skills/node-express-postgres'
        }
      ]
    };
    loadManifestMock.mockResolvedValue(mockManifest);

    const skills = await loadInstalledSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(1);

    const skill = skills[0];
    expect(skill).toHaveProperty('status', 'installed');
    expect(skill).toHaveProperty('id', 'node-express-postgres');
    expect(skill).toHaveProperty('name', 'node-express-postgres');
    expect(skill).toHaveProperty('description', '');
    expect(skill).toHaveProperty('domains', []);
    expect(skill).toHaveProperty('tags', []);
    expect(skill).toHaveProperty('provides', []);
    expect(skill).toHaveProperty('requires', []);
    expect(skill).toHaveProperty('ideCompatibility', ['all']);
    expect(skill).toHaveProperty('repoUrl', '');
    expect(skill).toHaveProperty('source', 'manifest');
  });

  test('handles missing manifest gracefully by returning empty array', async () => {
    loadManifestMock.mockRejectedValue(new Error('Manifest not found'));

    const skills = await loadInstalledSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });

  test('handles manifest with no installed skills', async () => {
    const mockManifest = {
      version: '1.0',
      installed: []
    };
    loadManifestMock.mockResolvedValue(mockManifest);

    const skills = await loadInstalledSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });

  test('preserves original skill fields and adds unified schema fields', async () => {
    const mockManifest = {
      version: '1.0',
      installed: [
        {
          name: 'my-skill',
          source: 'catalog',
          commit: 'def456',
          installedAt: '2026-03-16T10:30:00.000Z',
          path: '.rosetta/skills/my-skill',
          tag: 'v1.0.0',
          scope: 'project'
        }
      ]
    };
    loadManifestMock.mockResolvedValue(mockManifest);

    const skills = await loadInstalledSkills();

    expect(skills[0].name).toBe('my-skill');
    expect(skills[0].source).toBe('manifest'); // source is normalized to 'manifest'
    expect(skills[0].commit).toBe('def456');
    expect(skills[0].installedAt).toBe('2026-03-16T10:30:00.000Z');
    expect(skills[0].path).toBe('.rosetta/skills/my-skill');
    expect(skills[0].tag).toBe('v1.0.0');
    expect(skills[0].scope).toBe('project');
    expect(skills[0].status).toBe('installed');
    expect(skills[0].id).toBe('my-skill');
  });

  test('uses default values when skill has partial data', async () => {
    const mockManifest = {
      version: '1.0',
      installed: [
        {
          name: 'partial-skill',
          source: 'custom',
          commit: 'xyz789',
          installedAt: '2026-03-17T10:30:00.000Z',
          path: '.rosetta/skills/partial-skill'
        }
      ]
    };
    loadManifestMock.mockResolvedValue(mockManifest);

    const skills = await loadInstalledSkills();

    expect(skills[0].description).toBe('');
    expect(skills[0].domains).toEqual([]);
    expect(skills[0].tags).toEqual([]);
    expect(skills[0].provides).toEqual([]);
    expect(skills[0].requires).toEqual([]);
    expect(skills[0].ideCompatibility).toEqual(['all']);
    expect(skills[0].repoUrl).toBe('');
  });

  test('handles multiple installed skills', async () => {
    const mockManifest = {
      version: '1.0',
      installed: [
        {
          name: 'skill-1',
          source: 'catalog',
          commit: 'commit1',
          installedAt: '2026-03-15T10:30:00.000Z',
          path: '.rosetta/skills/skill-1'
        },
        {
          name: 'Skill-2',
          source: 'custom',
          commit: 'commit2',
          installedAt: '2026-03-16T10:30:00.000Z',
          path: '.rosetta/skills/skill-2'
        }
      ]
    };
    loadManifestMock.mockResolvedValue(mockManifest);

    const skills = await loadInstalledSkills();

    expect(skills.length).toBe(2);
    expect(skills[0].id).toBe('skill-1');
    expect(skills[1].id).toBe('skill-2'); // lowercase conversion
    expect(skills[0].status).toBe('installed');
    expect(skills[1].status).toBe('installed');
  });
});

describe('visualizers/index - loadCatalogSkills', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('loads catalog skills from catalog and transforms to unified schema', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'node-express-postgres',
          displayName: 'Node.js + Express + PostgreSQL',
          description: 'A full-stack Node.js skill',
          repoUrl: 'https://github.com/example/node-express-postgres',
          domains: ['backend', 'database'],
          tags: ['node', 'express', 'postgres', 'vscode'],
          provides: ['api', 'orm'],
          requires: ['nodejs']
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(1);

    const skill = skills[0];
    expect(skill).toHaveProperty('status', 'catalog');
    expect(skill).toHaveProperty('id', 'node-express-postgres');
    expect(skill).toHaveProperty('name', 'node-express-postgres');
    expect(skill).toHaveProperty('description', 'A full-stack Node.js skill');
    expect(skill).toHaveProperty('domains', ['backend', 'database']);
    expect(skill).toHaveProperty('tags', ['node', 'express', 'postgres', 'vscode']);
    expect(skill).toHaveProperty('provides', ['api', 'orm']);
    expect(skill).toHaveProperty('requires', ['nodejs']);
    expect(skill).toHaveProperty('source', 'catalog');
    expect(skill).toHaveProperty('ideCompatibility');
    expect(skill.ideCompatibility).toContain('vscode');
  });

  test('derives IDE compatibility from tags - vscode variants', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'vscode-skill',
          displayName: 'VS Code Skill',
          description: 'A skill for VS Code',
          domains: ['editor'],
          tags: ['vscode', 'typescript'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(skills[0].ideCompatibility).toContain('vscode');
  });

  test('derives IDE compatibility from tags - jetbrains variants', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'jetbrains-skill',
          displayName: 'JetBrains Skill',
          description: 'A skill for JetBrains IDEs',
          domains: ['editor'],
          tags: ['jetbrains', 'intellij', 'pycharm'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(skills[0].ideCompatibility).toContain('jetbrains');
  });

  test('derives IDE compatibility from tags - claude-code variants', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'claude-skill',
          displayName: 'Claude Code Skill',
          description: 'A skill for Claude Code',
          domains: ['ai'],
          tags: ['claude-code', 'anthropic', 'ai'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(skills[0].ideCompatibility).toContain('claude-code');
  });

  test('derives multiple IDE compatibilities from tags', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'multi-ide-skill',
          displayName: 'Multi-IDE Skill',
          description: 'Works with multiple IDEs',
          domains: ['editor'],
          tags: ['vscode', 'cursor', 'windsurf'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(skills[0].ideCompatibility).toContain('vscode');
    expect(skills[0].ideCompatibility).toContain('cursor');
    expect(skills[0].ideCompatibility).toContain('windsurf');
  });

  test('defaults to all IDE compatibility when no IDE tags found', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'generic-skill',
          displayName: 'Generic Skill',
          description: 'A generic skill',
          domains: ['tools'],
          tags: ['node', 'react', 'testing'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(skills[0].ideCompatibility).toEqual(['all']);
  });

  test('handles empty catalog', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: []
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });

  test('handles loadRawCatalog error gracefully', async () => {
    loadCatalogMock.mockRejectedValue(new Error('Catalog not found'));

    const skills = await loadCatalogSkills();

    expect(Array.isArray(skills)).toBe(true);
    expect(skills.length).toBe(0);
  });

  test('accepts custom catalog parameter', async () => {
    const customCatalog = {
      version: '2.0.0',
      skills: [
        {
          name: 'custom-skill',
          displayName: 'Custom Skill',
          description: 'A custom catalog skill',
          domains: ['custom'],
          tags: ['custom', 'codex'],
          provides: [],
          requires: []
        }
      ]
    };

    const skills = await loadCatalogSkills(customCatalog);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('custom-skill');
    expect(skills[0].ideCompatibility).toContain('codex');
  });

  test('ensures unique IDE compatibility values', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'duplicate-ide-tags',
          displayName: 'Duplicate IDE Tags',
          description: 'Skill with duplicate IDE tags',
          domains: ['editor'],
          tags: ['vscode', 'vscode', 'cursor', 'cursor'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    const ideCompatibility = skills[0].ideCompatibility;
    const uniqueIdeCompatibility = [...new Set(ideCompatibility)];
    expect(ideCompatibility.length).toBe(uniqueIdeCompatibility.length);
  });

  test('maps all catalog skill fields correctly', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'full-skill',
          displayName: 'Full Skill',
          description: 'Complete skill',
          repoUrl: 'https://github.com/example/full-skill',
          domains: ['backend', 'frontend'],
          tags: ['fullstack', 'popular'],
          provides: ['api', 'authentication'],
          requires: ['nodejs', 'postgres'],
          author: 'test-author',
          stars: 100,
          lastUpdated: '2026-03-17T00:00:00.000Z'
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    const skill = skills[0];
    expect(skill.status).toBe('catalog');
    expect(skill.id).toBe('full-skill');
    expect(skill.name).toBe('full-skill');
    expect(skill.displayName).toBe('Full Skill');
    expect(skill.description).toBe('Complete skill');
    expect(skill.domains).toEqual(['backend', 'frontend']);
    expect(skill.tags).toEqual(['fullstack', 'popular']);
    expect(skill.provides).toEqual(['api', 'authentication']);
    expect(skill.requires).toEqual(['nodejs', 'postgres']);
    expect(skill.repoUrl).toBe('https://github.com/example/full-skill');
    expect(skill.author).toBe('test-author');
    expect(skill.stars).toBe(100);
    expect(skill.lastUpdated).toBe('2026-03-17T00:00:00.000Z');
    expect(skill.source).toBe('catalog');
  });

  test('handles catalog skill with missing optional fields', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'minimal-skill',
          domains: ['minimal'],
          tags: [],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    const skill = skills[0];
    expect(skill.name).toBe('minimal-skill');
    expect(skill.displayName).toBeUndefined();
    expect(skill.description).toBe('');
    expect(skill.domains).toEqual(['minimal']);
    expect(skill.tags).toEqual([]);
    expect(skill.provides).toEqual([]);
    expect(skill.requires).toEqual([]);
    expect(skill.repoUrl).toBeUndefined();
    expect(skill.author).toBeUndefined();
    expect(skill.stars).toBe(0);
    expect(skill.lastUpdated).toBeUndefined();
  });
});
