import { jest, describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { renderTemplate } from '../lib/templates.js';

describe('lib/templates.js - renderTemplate', () => {
  test('should replace all placeholders with context values', () => {
    const template = 'Project: {{PROJECT_NAME}} - {{PROJECT_TYPE}}';
    const context = { projectName: 'Test Project', projectType: 'Web app' };
    const result = renderTemplate(template, context);
    expect(result).toBe('Project: Test Project - Web app');
  });

  test('should use defaults when context values are missing', () => {
    const template = '{{PROJECT_NAME}} - {{PROJECT_DESCRIPTION}}';
    const context = {};
    const result = renderTemplate(template, context);
    expect(result).toBe('My Project - No description provided.');
  });

  test('should handle array values correctly', () => {
    const template = 'Frontend: {{FRONTEND_STACK}}';
    const context = { frontend: ['React', 'Next.js'] };
    const result = renderTemplate(template, context);
    expect(result).toBe('Frontend: React, Next.js');
  });

  test('should display "None" for empty or missing arrays', () => {
    const template = 'Frontend: {{FRONTEND_STACK}}';
    const context = {};
    const result = renderTemplate(template, context);
    expect(result).toBe('Frontend: None');
  });

  test('should replace all known placeholders', () => {
    const template = `Name: {{PROJECT_NAME}}
Desc: {{PROJECT_DESCRIPTION}}
Type: {{PROJECT_TYPE}}
Frontend: {{FRONTEND_STACK}}
Backend: {{BACKEND_STACK}}
Datastores: {{DATASTORES}}
Domain: {{DOMAIN_TAGS}}
Risk: {{RISK_LEVEL}}
Team: {{TEAM_SIZE}}
Git: {{GIT_WORKFLOW}}
Testing: {{TESTING_SETUP}}
Agent: {{AGENT_STYLE}}
Permissions: {{EDIT_PERMISSIONS}}
Extras: {{EXTRA_CONTEXTS}}`;
    const context = {
      projectName: 'MyApp',
      description: 'Test app',
      projectType: 'CLI tool',
      frontend: [],
      backend: ['Node'],
      datastores: [],
      domainTags: ['Dev'],
      riskLevel: 'Low',
      teamSize: 'Solo',
      gitWorkflow: 'Trunk',
      testingSetup: 'Unit',
      agentStyle: 'Pair',
      editPermissions: 'Module',
      extras: []
    };
    const result = renderTemplate(template, context);
    expect(result).toContain('Name: MyApp');
    expect(result).toContain('Frontend: None');
    expect(result).toContain('Backend: Node');
    expect(result).toContain('Extras: None');
  });
});
