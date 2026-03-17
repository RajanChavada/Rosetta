import { gatherData, mergeSkills, computeStats, detectCurrentIde } from '../../lib/visualizers/index.js';
import { jest, describe, test, expect } from '@jest/globals';

describe('visualizers/index - gatherData integration', () => {
  test('returns unified shape with skills, stats, currentIde', async () => {
    const mockLoadInstalled = jest.fn().mockResolvedValue([
      { name: 'SkillA', status: 'installed', domains: ['backend'], ideCompatibility: ['vscode'], source: 'installed' },
      { name: 'SkillB', status: 'installed', domains: ['frontend'], ideCompatibility: ['cursor'], source: 'installed' }
    ]);
    const mockLoadCatalog = jest.fn().mockResolvedValue([
      { name: 'SkillC', status: 'catalog', domains: ['database'], ideCompatibility: ['jetbrains'], source: 'catalog' }
    ]);
    const mockLoadUser = jest.fn().mockResolvedValue([]);
    const mockDetectCurrentIde = jest.fn().mockResolvedValue('Claude Code');

    const result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde
    });

    expect(result).toHaveProperty('skills');
    expect(result).toHaveProperty('stats');
    expect(result).toHaveProperty('currentIde', 'Claude Code');
    expect(Array.isArray(result.skills)).toBe(true);
    expect(typeof result.stats).toBe('object');
  });

  test('precedence: same name appears in installed and catalog → installed wins', async () => {
    const installedSkill = {
      name: 'CommonSkill',
      status: 'installed',
      domains: ['backend'],
      ideCompatibility: ['vscode'],
      source: 'installed'
    };
    const catalogSkill = {
      name: 'CommonSkill',
      status: 'catalog',
      domains: ['frontend'],
      ideCompatibility: ['cursor'],
      source: 'catalog'
    };

    const mockLoadInstalled = jest.fn().mockResolvedValue([installedSkill]);
    const mockLoadCatalog = jest.fn().mockResolvedValue([catalogSkill]);
    const mockLoadUser = jest.fn().mockResolvedValue([]);
    const mockDetectCurrentIde = jest.fn().mockResolvedValue('Cursor');

    const result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde
    });

    expect(result.skills.length).toBe(1);
    expect(result.skills[0].status).toBe('installed');
    expect(result.skills[0].domains).toEqual(['backend']);
  });

  test('precedence: user-created over catalog, but installed over user-created', async () => {
    const installed = {
      name: 'MergeSkill',
      status: 'installed',
      domains: ['inst'],
      ideCompatibility: ['vscode'],
      source: 'installed'
    };
    const user = {
      name: 'MergeSkill',
      status: 'user-created',
      domains: ['user'],
      ideCompatibility: ['cursor'],
      source: 'user'
    };
    const catalog = {
      name: 'MergeSkill',
      status: 'catalog',
      domains: ['cat'],
      ideCompatibility: ['jetbrains'],
      source: 'catalog'
    };

    const mockLoadInstalled = jest.fn().mockResolvedValue([installed]);
    const mockLoadUser = jest.fn().mockResolvedValue([user]);
    const mockLoadCatalog = jest.fn().mockResolvedValue([catalog]);
    const mockDetectCurrentIde = jest.fn().mockResolvedValue('VSCode');

    const result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde
    });

    expect(result.skills.length).toBe(1);
    expect(result.skills[0].status).toBe('installed');
    expect(result.skills[0].domains).toEqual(['inst']);
  });

  test('precedence: case-insensitive name matching', async () => {
    const installed = {
      name: 'MixedCase',
      status: 'installed',
      domains: [],
      ideCompatibility: ['all'],
      source: 'installed'
    };
    const catalog = {
      name: 'mixedcase',
      status: 'catalog',
      domains: ['test'],
      ideCompatibility: ['vscode'],
      source: 'catalog'
    };

    const mockLoadInstalled = jest.fn().mockResolvedValue([installed]);
    const mockLoadCatalog = jest.fn().mockResolvedValue([catalog]);
    const mockLoadUser = jest.fn().mockResolvedValue([]);
    const mockDetectCurrentIde = jest.fn().mockResolvedValue('Auto-detected');

    const result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde
    });

    expect(result.skills.length).toBe(1);
    expect(result.skills[0].status).toBe('installed');
  });

  test('stats computation: counts total, byStatus, byDomain, byIde', async () => {
    const installed = [
      {
        name: 'S1',
        status: 'installed',
        domains: ['backend', 'api'],
        ideCompatibility: ['vscode', 'cursor']
      },
      {
        name: 'S2',
        status: 'installed',
        domains: ['frontend'],
        ideCompatibility: ['vscode']
      }
    ];
    const catalog = [
      {
        name: 'S3',
        status: 'catalog',
        domains: ['backend'],
        ideCompatibility: ['jetbrains']
      },
      {
        name: 'S4',
        status: 'catalog',
        domains: ['frontend', 'mobile'],
        ideCompatibility: ['cursor', 'windsurf']
      }
    ];
    const user = [
      {
        name: 'S5',
        status: 'user-created',
        domains: ['backend', 'testing'],
        ideCompatibility: ['claude-code']
      }
    ];

    const mockLoadInstalled = jest.fn().mockResolvedValue(installed);
    const mockLoadCatalog = jest.fn().mockResolvedValue(catalog);
    const mockLoadUser = jest.fn().mockResolvedValue(user);
    const mockDetectCurrentIde = jest.fn().mockResolvedValue('Claude Code');

    const result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde
    });

    const stats = result.stats;
    expect(stats.total).toBe(5);
    expect(stats.byStatus).toEqual({
      installed: 2,
      catalog: 2,
      'user-created': 1
    });
    expect(stats.byDomain).toEqual({
      backend: 3,
      api: 1,
      frontend: 2,
      mobile: 1,
      testing: 1
    });
    expect(stats.byIde).toEqual({
      vscode: 2,
      cursor: 2,
      jetbrains: 1,
      windsurf: 1,
      'claude-code': 1
    });
  });

  test('stats handles empty arrays', async () => {
    const mockLoadInstalled = jest.fn().mockResolvedValue([]);
    const mockLoadCatalog = jest.fn().mockResolvedValue([]);
    const mockLoadUser = jest.fn().mockResolvedValue([]);
    const mockDetectCurrentIde = jest.fn().mockResolvedValue('auto-detected');

    const result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde
    });

    expect(result.stats.total).toBe(0);
    expect(result.stats.byStatus).toEqual({});
    expect(result.stats.byDomain).toEqual({});
    expect(result.stats.byIde).toEqual({});
  });

  test('IDE detection: uses detectCurrentIde() return value', async () => {
    const mockLoadInstalled = jest.fn().mockResolvedValue([]);
    const mockLoadCatalog = jest.fn().mockResolvedValue([]);
    const mockLoadUser = jest.fn().mockResolvedValue([]);

    const mockDetectCurrentIde1 = jest.fn().mockResolvedValue('Cursor');
    let result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde1
    });
    expect(result.currentIde).toBe('Cursor');

    const mockDetectCurrentIde2 = jest.fn().mockResolvedValue('auto-detected');
    result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      detectCurrentIde: mockDetectCurrentIde2
    });
    expect(result.currentIde).toBe('auto-detected');
  });
});
