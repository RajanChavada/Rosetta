import fs from 'fs-extra';
import path from 'path';
import { parseRequirements } from '../parsers/requirements-parser.js';

export async function detectPythonStack(cwd) {
  const requirementsPath = path.join(cwd, 'requirements.txt');
  const pyprojectPath = path.join(cwd, 'pyproject.toml');

  if (!(await fs.pathExists(requirementsPath)) && !(await fs.pathExists(pyprojectPath))) {
    return { detected: false };
  }

  const deps = await parseRequirements(cwd);

  // Detect framework
  let framework = null;
  if (deps.fastapi || deps['starlette']) framework = 'fastapi';
  else if (deps.django || deps['Django']) framework = 'django';
  else if (deps.flask) framework = 'flask';

  if (!framework) {
    return { detected: false };
  }

  // Detect test runner
  let testRunner = null;
  if (deps.pytest) testRunner = 'pytest';
  else if (deps.unittest) testRunner = 'unittest';

  // Detect linter/formatter
  const linter = deps.ruff || deps['ruff'] ? 'ruff' : deps.pylint ? 'pylint' : null;
  const formatter = deps.black || deps['black'] ? 'black' : null;

  return {
    detected: true,
    stack: 'python-fastapi',
    confidence: 'high',
    language: 'python',
    framework,
    testRunner,
    linter,
    formatter,
    buildTool: 'pip',
    evidence: {
      files: [requirementsPath],
      dependencies: Object.keys(deps).slice(0, 5),
    },
  };
}