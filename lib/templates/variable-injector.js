const VARIABLE_MAP = {
  PROJECT_NAME: 'projectName',
  PROJECT_TYPE: 'projectType',
  PROJECT_DESCRIPTION: 'projectDescription',
  LANGUAGE: 'language',
  FRAMEWORK: 'framework',
  TEST_RUNNER: 'testRunner',
  LINTER: 'linter',
  FORMATTER: 'formatter',
  BUILD_TOOL: 'buildTool',
  DEV_COMMAND: 'devCommand',
  BUILD_COMMAND: 'buildCommand',
  TEST_COMMAND: 'testCommand',
  NEXT_VERSION: 'nextVersion',
  NODE_VERSION: 'nodeVersion',
};

export function injectVariables(template, context = {}) {
  let result = template;

  for (const [placeholder, contextKey] of Object.entries(VARIABLE_MAP)) {
    const regex = new RegExp(`{{${placeholder}}}`, 'g');
    const value = context[contextKey];
    const replacement = value !== undefined && value !== null ? String(value) : `<!-- TODO: Add ${placeholder} -->`;
    result = result.replace(regex, replacement);
  }

  // Handle unknown variables - replace any remaining {{VAR}} patterns
  result = result.replace(/\{\{(\w+)\}\}/g, '<!-- TODO: Add $1 -->');

  return result;
}