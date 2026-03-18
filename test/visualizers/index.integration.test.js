import { gatherData, mergeSkills, computeStats, detectCurrentIde, renderHtml } from '../../lib/visualizers/index.js';
import { jest, describe, test, expect } from '@jest/globals';

// Mock for loadMasterSkills to prevent picking up real files during tests
const mockLoadMasterSkills = jest.fn().mockResolvedValue([]);

describe('visualizers/index - gatherData integration', () => {
  beforeEach(() => {
    mockLoadMasterSkills.mockClear();
    mockLoadMasterSkills.mockResolvedValue([]);
  });

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
      loadMasterSkills: mockLoadMasterSkills,
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
      loadMasterSkills: mockLoadMasterSkills,
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
      loadMasterSkills: mockLoadMasterSkills,
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
      loadMasterSkills: mockLoadMasterSkills,
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
      loadMasterSkills: mockLoadMasterSkills,
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
      loadMasterSkills: mockLoadMasterSkills,
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
      loadMasterSkills: mockLoadMasterSkills,
      detectCurrentIde: mockDetectCurrentIde1
    });
    expect(result.currentIde).toBe('Cursor');

    const mockDetectCurrentIde2 = jest.fn().mockResolvedValue('auto-detected');
    result = await gatherData({
      loadInstalledSkills: mockLoadInstalled,
      loadCatalogSkills: mockLoadCatalog,
      loadUserSkills: mockLoadUser,
      loadMasterSkills: mockLoadMasterSkills,
      detectCurrentIde: mockDetectCurrentIde2
    });
    expect(result.currentIde).toBe('auto-detected');
  });
});

describe('visualizers/index - renderHtml integration', () => {
  const testTemplate = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{TITLE}}</title>
  <style>{{STYLES}}</style>
</head>
<body>
  <div class="container">
    <aside class="sidebar">{{SIDEBAR_STATS}}</aside>
    <div class="ide-tabs">{{IDE_TABS}}</div>
    <p class="current-ide">{{CURRENT_IDE}}</p>
    <div class="search-bar">{{SEARCH_BAR}}</div>
    <div class="skill-grid" id="skill-grid">{{SKILL_GRID}}</div>
    <div class="empty-state" id="empty-state" style="display:none;">No skills match your search.</div>
    <script>const skillsData = {{SKILLS_JSON}};{{SCRIPT_CONTENT}}</script>
  </div>
</body>
</html>`;

  test('renders complete HTML with all sections replaced', () => {
    const data = {
      skills: [
        {
          id: 'skill1',
          name: 'Skill One',
          status: 'installed',
          description: 'A test skill',
          domains: ['backend'],
          tags: ['nodejs'],
          provides: ['API'],
          requires: ['Node.js'],
          ideCompatibility: ['vscode'],
          repoUrl: ''
        }
      ],
      stats: {
        total: 1,
        byStatus: { installed: 1 },
        byDomain: { backend: 1 },
        byIde: { vscode: 1 }
      },
      currentIde: 'vscode'
    };
    const template = testTemplate;
    const styles = '/* test styles */';
    const html = renderHtml(data, template, styles, 'vscode');

    // Verify no remaining template placeholders (except literal {{SKILLS_JSON}} in script comment)
    expect(html).not.toContain('{{TITLE}}');
    expect(html).not.toContain('{{STYLES}}');
    expect(html).not.toContain('{{SIDEBAR_STATS}}');
    expect(html).not.toContain('{{IDE_TABS}}');
    expect(html).not.toContain('{{CURRENT_IDE}}');
    expect(html).not.toContain('{{SEARCH_BAR}}');
    expect(html).not.toContain('{{SKILL_GRID}}');
    expect(html).not.toContain('{{SCRIPT_CONTENT}}');

    // Verify title
    expect(html).toContain('<title>Rosetta Skills Documentation</title>');

    // Verify styles are embedded and escaped
    expect(html).toContain('<style>/* test styles */</style>');

    // Verify sidebar stats rendered with numbers
    expect(html).toContain('Total Skills');
    expect(html).toContain('1');
    expect(html).toContain('Installed');
    expect(html).toContain('Available');
    expect(html).toContain('Domains');

    // Verify IDE tabs present with active class for vscode
    expect(html).toContain('data-ide="vscode"');
    expect(html).toContain('class="ide-tab active"'); // active tab
    expect(html).toContain('VS Code'); // label for vscode

    // Verify current IDE display
    expect(html).toContain('>vscode<'); // The escaped value appears in HTML

    // Verify search bar
    expect(html).toContain('id="search-input"');
    expect(html).toContain('Search skills');

    // Verify skill grid placeholder
    expect(html).toContain('id="skill-grid"');

    // Verify skillsData JSON embedded
    expect(html).toContain('const skillsData =');
    expect(html).toContain('"count":1');
    expect(html).toContain('"skills"');

    // Verify script functions present
    expect(html).toContain('function toggleCard');
    expect(html).toContain('function filterSkills');
    expect(html).toContain('function renderGrid');
    expect(html).toContain('function updateEmptyState');
  });

  test('handles empty skills array correctly', () => {
    const data = {
      skills: [],
      stats: {
        total: 0,
        byStatus: {},
        byDomain: {},
        byIde: {}
      },
      currentIde: 'all'
    };
    const html = renderHtml(data, testTemplate, '/* styles */', 'all');

    // No template placeholders remain (except literal {{SKILLS_JSON}} in script comment)
    expect(html).not.toContain('{{TITLE}}');
    expect(html).not.toContain('{{STYLES}}');
    expect(html).not.toContain('{{SIDEBAR_STATS}}');
    expect(html).not.toContain('{{IDE_TABS}}');
    expect(html).not.toContain('{{CURRENT_IDE}}');
    expect(html).not.toContain('{{SEARCH_BAR}}');
    expect(html).not.toContain('{{SKILL_GRID}}');
    expect(html).not.toContain('{{SCRIPT_CONTENT}}');

    // Basic structure intact
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<title>Rosetta Skills Documentation</title>');

    // Stats show zero
    expect(html).toContain('Total Skills');
    expect(html).toContain('0');

    // IDE tabs present, "All IDEs" should be active
    expect(html).toContain('data-ide="all"');
    expect(html).toContain('class="ide-tab active"');

    // Current IDE display should be "Auto-detected"
    expect(html).toContain('Auto-detected');

    // Skill grid present
    expect(html).toContain('id="skill-grid"');

    // skillsData empty
    expect(html).toContain('const skillsData = {"count":0,"skills":[]}');

    // Empty state div present (hidden by default)
    expect(html).toContain('id="empty-state"');
    expect(html).toContain('No skills match your search');
  });
});
