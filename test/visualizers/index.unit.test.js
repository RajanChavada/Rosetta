import { jest, describe, test, expect, beforeEach, afterEach, beforeAll } from '@jest/globals';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Compute absolute paths for modules to mock
const skillsManifestModulePath = path.resolve(__dirname, '../../lib/skills-manifest.js');

// Mock the skills-manifest module
jest.unstable_mockModule(skillsManifestModulePath, () => ({
  loadManifest: jest.fn()
}));

// Variables for imports
let loadInstalledSkills;
let loadManifestMock;

beforeAll(async () => {
  // Import the mocked module to get the mock function
  const skillsManifest = await import(skillsManifestModulePath);
  loadManifestMock = skillsManifest.loadManifest;

  // Import the module under test
  const visualizers = await import('../../lib/visualizers/index.js');
  loadInstalledSkills = visualizers.loadInstalledSkills;
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
