import { injectVariables } from '../../lib/templates/variable-injector.js';

describe('injectVariables', () => {
  test('replaces variables with values from context', () => {
    const template = 'Name: {{PROJECT_NAME}}, Type: {{PROJECT_TYPE}}';
    const context = {
      projectName: 'my-web-app',
      projectType: 'web_app'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Name: my-web-app, Type: web_app');
  });

  test('replaces multiple variables in a single template', () => {
    const template = 'Project: {{PROJECT_NAME}} - {{PROJECT_DESCRIPTION}} ({{PROJECT_TYPE}})';
    const context = {
      projectName: 'test-project',
      projectDescription: 'A test application',
      projectType: 'mobile_app'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Project: test-project - A test application (mobile_app)');
  });

  test('replaces variables multiple times in the same template', () => {
    const template = '{{PROJECT_NAME}} is a {{PROJECT_TYPE}} project called {{PROJECT_NAME}}';
    const context = {
      projectName: 'my-app',
      projectType: 'web_app'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('my-app is a web_app project called my-app');
  });

  test('replaces variables with different data types', () => {
    const template = 'Name: {{PROJECT_NAME}}, Version: {{NEXT_VERSION}}, Node: {{NODE_VERSION}}';
    const context = {
      projectName: 'test-app',
      nextVersion: 2.0,
      nodeVersion: '20.x'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Name: test-app, Version: 2, Node: 20.x');
  });

  test('handles missing variables with TODO comment', () => {
    const template = 'Project: {{PROJECT_NAME}}, Language: {{LANGUAGE}}';
    const context = {
      projectName: 'test-project'
      // language is missing
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Project: test-project, Language: <!-- TODO: Add LANGUAGE -->');
  });

  test('handles all missing variables', () => {
    const template = '{{PROJECT_NAME}} - {{PROJECT_DESCRIPTION}}';
    const context = {
      // No variables provided
    };
    const result = injectVariables(template, context);
    expect(result).toBe('<!-- TODO: Add PROJECT_NAME --> - <!-- TODO: Add PROJECT_DESCRIPTION -->');
  });

  test('handles empty string values', () => {
    const template = 'Name: {{PROJECT_NAME}}, Description: {{PROJECT_DESCRIPTION}}';
    const context = {
      projectName: '',
      projectDescription: 'Some description'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Name: , Description: Some description');
  });

  test('handles undefined values', () => {
    const template = 'Name: {{PROJECT_NAME}}, Description: {{PROJECT_DESCRIPTION}}';
    const context = {
      projectName: undefined,
      projectDescription: 'Some description'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Name: <!-- TODO: Add PROJECT_NAME -->, Description: Some description');
  });

  test('handles null values', () => {
    const template = 'Name: {{PROJECT_NAME}}, Description: {{PROJECT_DESCRIPTION}}';
    const context = {
      projectName: null,
      projectDescription: 'Some description'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Name: <!-- TODO: Add PROJECT_NAME -->, Description: Some description');
  });

  test('ignores unknown variables in template', () => {
    const template = 'Known: {{PROJECT_NAME}}, Unknown: {{UNKNOWN_VAR}}';
    const context = {
      projectName: 'test-project'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('Known: test-project, Unknown: <!-- TODO: Add UNKNOWN_VAR -->');
  });

  test('works with empty template', () => {
    const template = '';
    const context = {
      projectName: 'test-project'
    };
    const result = injectVariables(template, context);
    expect(result).toBe('');
  });

  test('works with empty context', () => {
    const template = 'Name: {{PROJECT_NAME}}';
    const result = injectVariables(template);
    expect(result).toBe('Name: <!-- TODO: Add PROJECT_NAME -->');
  });
});