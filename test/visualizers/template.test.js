import { describe, test, expect } from '@jest/globals';
import { readTemplate } from '../../lib/visualizers/utils.js';

describe('Template Placeholders', () => {
  test('should have all required placeholders', async () => {
    const result = await readTemplate('lib/visualizers/template.html');

    // Required placeholders from spec
    expect(result).toContain('{{TITLE}}');
    expect(result).toContain('{{STYLES}}');
    expect(result).toContain('{{SIDEBAR_STATS}}');
    expect(result).toContain('{{IDE_TABS}}');
    expect(result).toContain('{{SEARCH_BAR}}');
    expect(result).toContain('{{SKILL_GRID}}');
    expect(result).toContain('{{CURRENT_IDE}}');
    expect(result).toContain('const skillsData = {{SKILLS_JSON}};');
  });

  test('should have basic HTML structure', async () => {
    const result = await readTemplate('lib/visualizers/template.html');

    expect(result).toContain('<!DOCTYPE html>');
    expect(result).toContain('<html lang="en">');
    expect(result).toContain('<head>');
    expect(result).toContain('</head>');
    expect(result).toContain('<body>');
    expect(result).toContain('</body>');
    expect(result).toContain('<header class="header">');
    expect(result).toContain('Rosetta Skills');
    expect(result).toContain('Explore your AI agent skill library');
    expect(result).toContain('<aside class="sidebar">');
    expect(result).toContain('<main class="content">');
    expect(result).toContain('<script>');
    expect(result).toContain('</script>');
  });

  test('should have sidebar stats section with placeholder', async () => {
    const result = await readTemplate('lib/visualizers/template.html');
    expect(result).toContain('class="stats-section"');
    expect(result).toContain('{{SIDEBAR_STATS}}');
  });

  test('should have IDE filters with placeholder', async () => {
    const result = await readTemplate('lib/visualizers/template.html');
    expect(result).toContain('class="ide-tabs"');
    expect(result).toContain('{{IDE_TABS}}');
    expect(result).toContain('id="current-ide"');
    expect(result).toContain('{{CURRENT_IDE}}');
  });

  test('should have search bar placeholder', async () => {
    const result = await readTemplate('lib/visualizers/template.html');
    expect(result).toContain('class="search-bar"');
    expect(result).toContain('{{SEARCH_BAR}}');
  });

  test('should have skill grid placeholder', async () => {
    const result = await readTemplate('lib/visualizers/template.html');
    expect(result).toContain('class="skill-grid"');
    expect(result).toContain('id="skill-grid"');
    expect(result).toContain('{{SKILL_GRID}}');
  });

  test('should have script with skillsData placeholder', async () => {
    const result = await readTemplate('lib/visualizers/template.html');
    expect(result).toContain('<script>');
    expect(result).toContain('const skillsData = {{SKILLS_JSON}};');
    expect(result).toContain('</script>');
  });

  test('should include viewport meta tag for responsive design', async () => {
    const result = await readTemplate('lib/visualizers/template.html');
    expect(result).toContain('<meta name="viewport" content="width=device-width, initial-scale=1.0">');
  });
});
