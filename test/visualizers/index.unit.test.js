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

// Mock for fs-extra - must be set before importing visualizers
const fsMock = {
  readFile: jest.fn(),
  readdir: jest.fn(),
  pathExists: jest.fn(),
};
jest.unstable_mockModule('fs-extra', () => ({
  default: fsMock
}));

// Variables for imports
let loadInstalledSkills;
let loadCatalogSkills;
let loadUserSkills;
let parseSkillFile;
let loadManifestMock;
let loadCatalogMock;

beforeAll(async () => {
  // Import the mocked modules to get the mock functions
  const skillsManifest = await import(skillsManifestModulePath);
  loadManifestMock = skillsManifest.loadManifest;

  const catalog = await import(catalogModulePath);
  loadCatalogMock = catalog.loadCatalog;

  // Import the module under test (after all mocks are set)
  const visualizers = await import('../../lib/visualizers/index.js');
  loadInstalledSkills = visualizers.loadInstalledSkills;
  loadCatalogSkills = visualizers.loadCatalogSkills;
  loadUserSkills = visualizers.loadUserSkills;
  parseSkillFile = visualizers.parseSkillFile;
});

afterEach(() => {
  jest.resetAllMocks();
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

  test('derives multiple IDE compatibilities from different families', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'multi-ide-skill',
          displayName: 'Multi-IDE Skill',
          description: 'Works with multiple IDE families',
          domains: ['editor'],
          tags: ['vscode', 'jetbrains'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    expect(skills[0].ideCompatibility).toContain('vscode');
    expect(skills[0].ideCompatibility).toContain('jetbrains');
    expect(skills[0].ideCompatibility).not.toContain('cursor');
    expect(skills[0].ideCompatibility).not.toContain('intellij');
  });

  test('derives separate IDE identifiers for VS Code ecosystem tags', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'vscode-ecosystem-skill',
          displayName: 'VS Code Ecosystem Skill',
          description: 'Works with VS Code and its variants',
          domains: ['editor'],
          tags: ['vscode', 'cursor', 'windsurf', 'codex'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    // Each tag maps to its own IDE identifier (no grouping)
    expect(skills[0].ideCompatibility).toContain('vscode');
    expect(skills[0].ideCompatibility).toContain('cursor');
    expect(skills[0].ideCompatibility).toContain('windsurf');
    expect(skills[0].ideCompatibility).toContain('codex');
    expect(skills[0].ideCompatibility).toHaveLength(4);
  });

  test('groups JetBrains family tags under jetbrains', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'jetbrains-family-skill',
          displayName: 'JetBrains Family Skill',
          description: 'Works with JetBrains IDEs',
          domains: ['editor'],
          tags: ['jetbrains', 'intellij', 'pycharm'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    // All JetBrains family tags should map to 'jetbrains' only
    expect(skills[0].ideCompatibility).toEqual(['jetbrains']);
  });

  test('groups Claude Code family tags under claude-code', async () => {
    const mockCatalog = {
      version: '1.0.0',
      skills: [
        {
          name: 'claude-family-skill',
          displayName: 'Claude Family Skill',
          description: 'Works with Claude Code and Anthropic',
          domains: ['ai'],
          tags: ['claude-code', 'anthropic'],
          provides: [],
          requires: []
        }
      ]
    };
    loadCatalogMock.mockResolvedValue(mockCatalog);

    const skills = await loadCatalogSkills();

    // All Claude Code family tags should map to 'claude-code' only
    expect(skills[0].ideCompatibility).toEqual(['claude-code']);
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
    // 'codex' maps to 'codex' (distinct IDE)
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

describe('visualizers/index - loadUserSkills and parseSkillFile', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('parseSkillFile extracts JSON frontmatter correctly', async () => {
    const content = `---
{
  "name": "My Skill",
  "description": "A test skill",
  "domains": ["backend", "api"],
  "tags": ["node", "express"],
  "provides": ["routes", "middleware"],
  "requires": ["nodejs"],
  "repoUrl": "https://github.com/example/skill"
}
---

# My Skill

This is the markdown content.
`;
    fsMock.readFile.mockResolvedValue(content);

    const result = await parseSkillFile('/path/to/skill/SKILL.md');

    expect(result).toEqual({
      name: 'My Skill',
      description: 'A test skill',
      domains: ['backend', 'api'],
      tags: ['node', 'express'],
      provides: ['routes', 'middleware'],
      requires: ['nodejs'],
      repoUrl: 'https://github.com/example/skill'
    });
  });

  test('parseSkillFile handles missing frontmatter', async () => {
    const content = `# My Skill

This is markdown content without frontmatter.
`;
    fsMock.readFile.mockResolvedValue(content);

    const result = await parseSkillFile('/path/to/skill/SKILL.md');

    expect(result).toEqual({
      name: 'skill',
      description: 'User-created skill'
    });
  });

  test('parseSkillFile handles malformed frontmatter gracefully', async () => {
    const content = `---
name: "Bad Skill"
description: "Invalid JSON"
tags: ["vscode" - missing bracket
---

# My Skill

Content here.
`;
    fsMock.readFile.mockResolvedValue(content);

    const result = await parseSkillFile('/path/to/skill/SKILL.md');

    expect(result).toEqual({
      name: 'skill',
      description: 'User-created skill'
    });
  });

  test('parseSkillFile derives name from dirname when no frontmatter name', async () => {
    const content = `---
description: "A skill without name in frontmatter"
---

# Some Title
`;
    fsMock.readFile.mockResolvedValue(content);

    const result = await parseSkillFile('/path/to/my-great-skill/SKILL.md');

    expect(result.name).toBe('my-great-skill');
  });

  test('loadUserSkills loads skills from subdirectories with SKILL.md', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'skill-one', isDirectory: () => true, isFile: () => false },
      { name: 'skill-two', isDirectory: () => true, isFile: () => false },
      { name: 'not-a-dir.txt', isDirectory: () => false, isFile: () => true }
    ]);

    const skillOneContent = `---
{
  "name": "Skill One",
  "description": "First skill",
  "tags": ["vscode"]
}
---
`;
    const skillTwoContent = `---
{
  "name": "Skill Two",
  "description": "Second skill",
  "tags": ["cursor"]
}
---
`;

    fsMock.readFile
      .mockResolvedValueOnce(skillOneContent) // skill-one/SKILL.md
      .mockResolvedValueOnce(skillTwoContent) // skill-two/SKILL.md
      .mockResolvedValueOnce(skillOneContent) // second call for skill-one (pathExists check)
      .mockResolvedValueOnce(skillTwoContent); // second call for skill-two

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(2);
    expect(skills[0]).toMatchObject({
      name: 'Skill One',
      description: 'First skill',
      status: 'user-created',
      source: 'user',
      tags: ['vscode']
    });
    expect(skills[0].id).toBe('skill-one');
    expect(skills[1]).toMatchObject({
      name: 'Skill Two',
      description: 'Second skill',
      status: 'user-created',
      source: 'user',
      tags: ['cursor']
    });
    expect(skills[1].id).toBe('skill-two');
  });

  test('loadUserSkills handles skill.md (lowercase) filename', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'my-skill', isDirectory: () => true, isFile: () => false }
    ]);

    const content = `---
{
  "name": "My Skill",
  "description": "A skill with lowercase filename",
  "tags": ["jetbrains"]
}
---
`;
    fsMock.readFile.mockResolvedValue(content);

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('My Skill');
    expect(skills[0].tags).toContain('jetbrains');
  });

  test('loadUserSkills handles direct skill files in skills directory (*.skill.md)', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'direct-skill.skill.md', isDirectory: () => false, isFile: () => true }
    ]);

    const content = `---
{
  "name": "Direct Skill",
  "description": "A skill file directly in skills dir",
  "tags": ["windsurf"]
}
---
`;
    fsMock.readFile.mockResolvedValue(content);

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Direct Skill');
    expect(skills[0].id).toBe('direct-skill');
    expect(skills[0].tags).toContain('windsurf');
  });

  test('loadUserSkills handles SKILL.md file directly in skills directory', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'SKILL.md', isDirectory: () => false, isFile: () => true }
    ]);

    const content = `---
{
  "name": "Global Skill",
  "description": "A global skill file",
  "tags": ["all"]
}
---
`;
    fsMock.readFile.mockResolvedValue(content);

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Global Skill');
    expect(skills[0].id).toBe('skill'); // SKILL.md -> 'skill' as id
  });

  test('loadUserSkills respects custom skillsDirs option', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'custom-skill', isDirectory: () => true, isFile: () => false }
    ]);

    const content = `---
{
  "name": "Custom Skill",
  "description": "From custom dir",
  "tags": ["kilo-code"]
}
---
`;
    fsMock.readFile.mockResolvedValue(content);

    const skills = await loadUserSkills(['company-skills']);

    expect(skills.length).toBe(1);
    expect(skills[0].name).toBe('Custom Skill');
    expect(skills[0].tags).toContain('kilo-code');
  });

  test('loadUserSkills skips templates/skills path', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    // readdir should not be called for filtered directory
    const skills = await loadUserSkills(['templates/skills']);
    expect(skills.length).toBe(0);
    expect(fsMock.readdir).not.toHaveBeenCalled();
  });

  test('loadUserSkills returns empty array when directory does not exist', async () => {
    fsMock.pathExists.mockResolvedValue(false);

    const skills = await loadUserSkills(['nonexistent-dir']);

    expect(skills.length).toBe(0);
  });

  test('loadUserSkills handles permission errors gracefully', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockRejectedValue(new Error('Permission denied'));

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(0);
  });

  test('loadUserSkills returns empty array when no skills found', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([]); // Empty directory

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(0);
  });

  test('loadUserSkills adds derived ideCompatibility from tags', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'multi-ide-skill', isDirectory: () => true, isFile: () => false }
    ]);

    const content = `---
{
  "name": "Multi-IDE Skill",
  "description": "Works with multiple IDEs",
  "tags": ["vscode", "cursor", "jetbrains", "claude-code"]
}
---
`;
    fsMock.readFile.mockResolvedValue(content);

    const skills = await loadUserSkills(['skills']);

    expect(skills.length).toBe(1);
    expect(skills[0].ideCompatibility).toContain('vscode');
    expect(skills[0].ideCompatibility).toContain('cursor');
    expect(skills[0].ideCompatibility).toContain('jetbrains');
    expect(skills[0].ideCompatibility).toContain('claude-code');
  });

  test('loadUserSkills defaults ideCompatibility to all when no IDE tags', async () => {
    fsMock.pathExists.mockResolvedValue(true);
    fsMock.readdir.mockResolvedValue([
      { name: 'generic-skill', isDirectory: () => true, isFile: () => false }
    ]);

    const content = `---
{
  "name": "Generic Skill",
  "description": "A generic skill",
  "tags": ["node", "react"]
}
---
`;
    fsMock.readFile.mockResolvedValue(content);

    const skills = await loadUserSkills(['skills']);

    expect(skills[0].ideCompatibility).toEqual(['all']);
  });
});
