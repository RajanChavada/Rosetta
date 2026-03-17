import { describe, test, expect } from '@jest/globals';
import { renderSkillCard } from '../../lib/visualizers/skill-card.js';

describe('renderSkillCard', () => {
  const mockSkill = {
    id: 'test-skill',
    name: 'Test Skill',
    displayName: 'Test Skill Display',
    description: 'This is a test skill description that might be long enough to be truncated in minimal view.',
    status: 'installed',
    ideCompatibility: ['vscode', 'cursor'],
    domains: ['frontend', 'testing'],
    tags: ['javascript', 'testing', 'ui'],
    provides: ['Code completion', 'Testing utilities'],
    requires: ['Node.js', 'npm'],
    repoUrl: 'https://github.com/example/test-skill'
  };

  test('should render minimal card with correct structure', () => {
    const result = renderSkillCard(mockSkill, false);

    // Basic structure
    expect(result).toContain('class="skill-card"');
    expect(result).toContain('data-id="test-skill"');
    expect(result).toContain('data-status="installed"');
    expect(result).toContain('data-ide="vscode"'); // first IDE

    // Header with name
    expect(result).toContain('Test Skill Display');

    // Status badge
    expect(result).toContain('status-badge');
    expect(result).toContain('Installed');

    // Description (truncated)
    expect(result).toContain('class="description"');

    // Metadata section
    expect(result).toContain('class="metadata"');
    expect(result).toContain('IDE:'); // or some variation
    expect(result).toContain('Domains:');
  });

  test('should render expanded card with all sections', () => {
    const result = renderSkillCard(mockSkill, true);

    // Full description (not truncated)
    expect(result).toContain('This is a test skill description');

    // Provides section
    expect(result).toContain('Provides');
    expect(result).toContain('<ul>');
    expect(result).toContain('Code completion');
    expect(result).toContain('Testing utilities');

    // Requires section
    expect(result).toContain('Requires');
    expect(result).toContain('Node.js');
    expect(result).toContain('npm');

    // Tags cloud
    expect(result).toContain('class="tags"');
    expect(result).toContain('javascript');
    expect(result).toContain('testing');
    expect(result).toContain('ui');

    // Repo link
    expect(result).toContain('class="repo-link"');
    expect(result).toContain('https://github.com/example/test-skill');

    // Toggle button
    expect(result).toContain('Show less');
    expect(result).toContain('toggleCard(\'test-skill\')');
  });

  test('should escape HTML in skill name to prevent XSS', () => {
    const maliciousSkill = {
      ...mockSkill,
      name: '<script>alert("XSS")</script>',
      displayName: '<img src=x onerror=alert(1)>'
    };

    const result = renderSkillCard(maliciousSkill, false);

    // Should NOT contain raw HTML tags
    expect(result).not.toContain('<script>');
    expect(result).not.toContain('<img');

    // Should contain escaped version
    expect(result).toContain('&lt;img');
    expect(result).toContain('&gt;'); // closing bracket escaped
  });

  test('should escape HTML in description', () => {
    const maliciousSkill = {
      ...mockSkill,
      description: 'Normal text <b>bold</b> <script>malicious()</script>'
    };

    const result = renderSkillCard(maliciousSkill, true);

    expect(result).not.toContain('<script>malicious()</script>');
    expect(result).toContain('&lt;script&gt;malicious()&lt;/script&gt;');
  });

  test('should escape HTML in provides and requires', () => {
    const maliciousSkill = {
      ...mockSkill,
      provides: ['<script>evil()</script>'],
      requires: ['<img src=x onerror=alert(2)>']
    };

    const result = renderSkillCard(maliciousSkill, true);

    expect(result).not.toContain('<script>evil()</script>');
    expect(result).toContain('&lt;script&gt;evil()&lt;/script&gt;');
    expect(result).not.toContain('<img src=x');
    expect(result).toContain('&lt;img');
  });

  test('should escape HTML in tags', () => {
    const maliciousSkill = {
      ...mockSkill,
      tags: ['<script>alert(3)</script>', 'normal']
    };

    const result = renderSkillCard(maliciousSkill, true);

    expect(result).not.toContain('<script>alert(3)</script>');
    expect(result).toContain('&lt;script&gt;alert(3)&lt;/script&gt;');
  });

  test('should use displayName if provided, otherwise fallback to name', () => {
    const withDisplayName = renderSkillCard(mockSkill, false);
    expect(withDisplayName).toContain('Test Skill Display');

    const withoutDisplayName = renderSkillCard({ ...mockSkill, displayName: undefined }, false);
    expect(withoutDisplayName).toContain('Test Skill');
  });

  test('should set data-ide to first IDE or "all" if empty', () => {
    const withIdes = renderSkillCard(mockSkill, false);
    expect(withIdes).toContain('data-ide="vscode"');

    const allIde = renderSkillCard({ ...mockSkill, ideCompatibility: [] }, false);
    expect(allIde).toContain('data-ide="all"');
  });

  test('should handle missing optional fields gracefully', () => {
    const minimalSkill = {
      id: 'minimal',
      name: 'Minimal Skill',
      description: 'A minimal skill',
      status: 'catalog',
      ideCompatibility: ['all'],
      domains: [],
      tags: [],
      provides: [],
      requires: [],
      repoUrl: ''
    };

    const minimalResult = renderSkillCard(minimalSkill, false);
    expect(minimalResult).toContain('class="skill-card"');
    expect(minimalResult).toContain('data-id="minimal"');

    const expandedResult = renderSkillCard(minimalSkill, true);
    expect(expandedResult).toContain('class="skill-card"');
  });

  test('should truncate description in minimal view', () => {
    const longDescriptionSkill = {
      ...mockSkill,
      description: 'A'.repeat(200) // Long description
    };

    const result = renderSkillCard(longDescriptionSkill, false);

    // Should not contain the full long description
    expect(result).not.toContain('A'.repeat(200));
  });

  test('should not truncate description in expanded view', () => {
    const longDescriptionSkill = {
      ...mockSkill,
      description: 'A'.repeat(200)
    };

    const result = renderSkillCard(longDescriptionSkill, true);

    // Should contain the full description
    expect(result).toContain('A'.repeat(200));
  });
});
