import fs from 'fs-extra';
import path from 'path';

const FRAMEWORK_PATTERNS = {
  'next.js': { dep: 'next', stack: 'next.js' },
  'react': { dep: 'react', stack: 'react' },
  'vite': { dep: 'vite', stack: 'vite' },
  'express': { dep: 'express', stack: 'node-api' },
  'nestjs': { dep: '@nestjs/core', stack: 'node-api' },
  'fastify': { dep: 'fastify', stack: 'node-api' },
};

const TEST_RUNNER_PATTERNS = {
  'jest': ['jest', '@types/jest'],
  'vitest': ['vitest'],
  'mocha': ['mocha'],
  'jasmine': ['jasmine'],
};

const BUILD_TOOL_PATTERNS = {
  'vite': ['vite'],
  'webpack': ['webpack'],
  'turbopack': ['next'], // Next.js uses Turbopack
  'tsc': ['typescript'],
};

export async function detectNodeStack(cwd) {
  const pkgPath = path.join(cwd, 'package.json');

  if (!(await fs.pathExists(pkgPath))) {
    return { detected: false };
  }

  const pkg = await fs.readJson(pkgPath);
  const deps = { ...pkg.dependencies, ...pkg.devDependencies };

  // Detect framework
  let framework = null;
  let stack = null;

  for (const [name, { dep, stack: stackName }] of Object.entries(FRAMEWORK_PATTERNS)) {
    if (deps[dep]) {
      framework = name;
      stack = stackName;
      break;
    }
  }

  // Determine stack for react+vite
  if (framework === 'react' && deps['vite']) {
    stack = 'react-vite';
  }

  if (!framework) {
    return { detected: false };
  }

  // Detect test runner
  let testRunner = null;
  for (const [runner, patterns] of Object.entries(TEST_RUNNER_PATTERNS)) {
    if (patterns.some(p => deps[p])) {
      testRunner = runner;
      break;
    }
  }

  // Detect build tool
  let buildTool = null;
  for (const [tool, patterns] of Object.entries(BUILD_TOOL_PATTERNS)) {
    if (patterns.some(p => deps[p])) {
      buildTool = tool;
      break;
    }
  }

  // Detect linter/formatter
  const linter = deps['eslint'] ? 'eslint' : null;
  const formatter = deps['prettier'] ? 'prettier' : null;

  return {
    detected: true,
    stack,
    confidence: 'high',
    language: deps['typescript'] ? 'typescript' : 'javascript',
    framework,
    testRunner,
    linter,
    formatter,
    buildTool,
    evidence: {
      files: ['package.json'],
      dependencies: Object.keys(deps).slice(0, 5),
      scripts: pkg.scripts || {},
    },
  };
}