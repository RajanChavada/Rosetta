import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Analyzes codebase patterns, file structures, and architecture indicators.
 * Returns structured pattern data for ideation scoring.
 */

/**
 * Main function to analyze codebase patterns.
 */
export async function analyzeCodePatterns(projectPath) {
  const patterns = {
    // File patterns
    hasPackageJson: await fs.pathExists(path.join(projectPath, 'package.json')),
    hasGoMod: await fs.pathExists(path.join(projectPath, 'go.mod')),
    hasCargoToml: await fs.pathExists(path.join(projectPath, 'Cargo.toml')),
    hasRequirementsTxt: await fs.pathExists(path.join(projectPath, 'requirements.txt')),
    hasPyprojectToml: await fs.pathExists(path.join(projectPath, 'pyproject.toml')),
    hasGemfile: await fs.pathExists(path.join(projectPath, 'Gemfile')),

    // Directory patterns
    directories: await detectDirectoryStructure(projectPath),

    // Architecture patterns
    architecture: await detectArchitecturePatterns(projectPath),

    // Testing patterns
    testing: await detectTestingPatterns(projectPath),

    // Source file patterns
    sourceFiles: await detectSourcePatterns(projectPath)
  };

  return patterns;
}

/**
 * Detect directory structure patterns.
 */
async function detectDirectoryStructure(projectPath) {
  const directories = {};

  const checkDir = async (dirName) => {
    const dirPath = path.join(projectPath, dirName);
    return await fs.pathExists(dirPath);
  };

  const checkDirs = async (dirNames) => {
    for (const dir of dirNames) {
      if (await checkDir(dir)) {
        return dir;
      }
    }
    return null;
  };

  // Common directory patterns
  directories.tests = await checkDirs(['tests', 'test', '__tests__', '__test__', 'spec']);
  directories.src = await checkDirs(['src', 'source', 'app']);
  directories.lib = await checkDir('lib');
  directories.api = await checkDirs(['api', 'src/api', 'app/api']);
  directories.components = await checkDirs(['components', 'src/components', 'app/components']);
  directories.pages = await checkDirs(['pages', 'src/pages', 'app/pages']);
  directories.hooks = await checkDirs(['hooks', 'src/hooks']);
  directories.utils = await checkDirs(['utils', 'src/utils', 'lib/utils']);
  directories.models = await checkDirs(['models', 'src/models', 'app/models']);
  directories.controllers = await checkDirs(['controllers', 'src/controllers', 'app/controllers']);
  directories.routes = await checkDirs(['routes', 'src/routes', 'app/routes']);
  directories.middlewares = await checkDirs(['middleware', 'src/middleware', 'app/middleware']);
  directories.services = await checkDirs(['services', 'src/services', 'app/services']);
  directories.repositories = await checkDirs(['repositories', 'src/repositories', 'app/repositories']);
  directories.migrations = await checkDirs(['migrations', 'db/migrations', 'prisma/migrations']);
  directories.seeds = await checkDirs(['seeds', 'db/seeds', 'prisma/seeds']);
  directories.public = await checkDir('public');
  directories.static = await checkDirs(['static', 'public/static']);
  directories.config = await checkDirs(['config', 'src/config', '.config']);
  directories.docker = await checkDir('docker');
  directories.cicd = await checkDirs(['.github', '.gitlab-ci', '.circleci', 'scripts']);
  directories.infrastructure = await checkDirs(['infrastructure', 'infra', 'terraform', 'k8s']);

  return directories;
}

/**
 * Detect architecture patterns from file structure.
 */
async function detectArchitecturePatterns(projectPath) {
  const architecture = {
    pattern: 'unknown',
    indicators: []
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  // Detect monorepo
  if (subdirs.includes('packages') || subdirs.includes('apps') || subdirs.includes('services')) {
    architecture.pattern = 'monorepo';
    architecture.indicators.push('Has packages/ or apps/ directory');
  }

  // Detect Next.js app router
  const appDir = path.join(projectPath, 'app');
  if (await fs.pathExists(appDir)) {
    const appContents = await fs.readdir(appDir, { withFileTypes: true });
    if (appContents.some(e => e.name.endsWith('.tsx') || e.name.endsWith('.ts'))) {
      architecture.pattern = 'nextjs-app-router';
      architecture.indicators.push('App router structure detected');
    }
  }

  // Detect pages router
  const pagesDir = path.join(projectPath, 'pages');
  if (await fs.pathExists(pagesDir)) {
    const pagesContents = await fs.readdir(pagesDir, { withFileTypes: true });
    if (pagesContents.some(e => e.name.endsWith('.tsx') || e.name.endsWith('.ts') || e.name.endsWith('.jsx') || e.name.endsWith('.js'))) {
      if (architecture.pattern === 'unknown') {
        architecture.pattern = 'nextjs-pages-router';
        architecture.indicators.push('Pages router structure detected');
      }
    }
  }

  // Detect MVC pattern
  const hasModels = await fs.pathExists(path.join(projectPath, 'models')) ||
                    await fs.pathExists(path.join(projectPath, 'src/models')) ||
                    await fs.pathExists(path.join(projectPath, 'app/models'));
  const hasViews = await fs.pathExists(path.join(projectPath, 'views')) ||
                   await fs.pathExists(path.join(projectPath, 'src/views'));
  const hasControllers = await fs.pathExists(path.join(projectPath, 'controllers')) ||
                         await fs.pathExists(path.join(projectPath, 'src/controllers')) ||
                         await fs.pathExists(path.join(projectPath, 'app/controllers'));

  if (hasModels && hasViews && hasControllers) {
    architecture.pattern = 'mvc';
    architecture.indicators.push('MVC structure detected');
  }

  // Detect layered architecture
  const hasServices = await fs.pathExists(path.join(projectPath, 'services')) ||
                      await fs.pathExists(path.join(projectPath, 'src/services'));
  const hasRepositories = await fs.pathExists(path.join(projectPath, 'repositories')) ||
                          await fs.pathExists(path.join(projectPath, 'src/repositories'));

  if (hasServices || hasRepositories) {
    if (architecture.pattern === 'unknown') {
      architecture.pattern = 'layered';
      architecture.indicators.push('Layered architecture detected');
    }
  }

  // Detect microservices
  if (subdirs.filter(d => d.startsWith('service-') || d.startsWith('svc-')).length >= 2) {
    architecture.pattern = 'microservices';
    architecture.indicators.push('Multiple service directories detected');
  }

  return architecture;
}

/**
 * Detect testing patterns and frameworks.
 */
async function detectTestingPatterns(projectPath) {
  const testing = {
    hasTests: false,
    frameworks: [],
    structure: 'none',
    indicators: []
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  // Check for test directories
  const testDirs = subdirs.filter(d => d.includes('test') || d.includes('spec'));
  if (testDirs.length > 0) {
    testing.hasTests = true;
    testing.structure = testDirs[0];
    testing.indicators.push(`Test directory: ${testDirs[0]}`);
  }

  // Scan for test files (limited depth to avoid long scans)
  const testFilePatterns = [
    '*.test.js', '*.test.ts', '*.test.tsx',
    '*.spec.js', '*.spec.ts', '*.spec.tsx',
    '*_test.js', '*_test.ts', '*_test.tsx',
    '*_spec.js', '*_spec.ts', '*_spec.tsx'
  ];

  // Quick scan of root and immediate subdirectories
  const searchDirs = ['.', 'src', 'lib', 'app', ...subdirs.slice(0, 5)];

  for (const dir of searchDirs) {
    const dirPath = path.join(projectPath, dir);
    if (!await fs.pathExists(dirPath)) continue;

    try {
      const files = await fs.readdir(dirPath);
      const testFiles = files.filter(f =>
        testFilePatterns.some(pattern => f.match(pattern.replace('*', '.*')))
      );

      if (testFiles.length > 0) {
        testing.hasTests = true;
        testing.indicators.push(`${testFiles.length} test file(s) in ${dir}`);
        break;
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  // Check for test framework indicators
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.jest || deps['@jest/globals']) testing.frameworks.push('jest');
      if (deps.mocha) testing.frameworks.push('mocha');
      if (deps.chai) testing.frameworks.push('chai');
      if (deps.vitest) testing.frameworks.push('vitest');
      if (deps['@playwright/test']) testing.frameworks.push('playwright');
      if (deps.cypress) testing.frameworks.push('cypress');
      if (deps['@testing-library/react']) testing.frameworks.push('testing-library');
      if (deps['@testing-library/vue']) testing.frameworks.push('testing-library');
      if (deps.jasmine) testing.frameworks.push('jasmine');
      if (deps['@supertest/supertest']) testing.frameworks.push('supertest');
    } catch (err) {
      // Ignore parse errors
    }
  }

  // Check for Python test files
  const testPyPattern = /test_.*\.py$/;
  for (const dir of searchDirs) {
    const dirPath = path.join(projectPath, dir);
    if (!await fs.pathExists(dirPath)) continue;

    try {
      const files = await fs.readdir(dirPath);
      const testFiles = files.filter(f => testPyPattern.test(f));

      if (testFiles.length > 0) {
        testing.hasTests = true;
        if (!testing.frameworks.includes('pytest')) {
          testing.frameworks.push('pytest');
        }
        testing.indicators.push(`Python test files in ${dir}`);
        break;
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  // Check for Go test files
  const testGoPattern = /_test\.go$/;
  for (const dir of searchDirs) {
    const dirPath = path.join(projectPath, dir);
    if (!await fs.pathExists(dirPath)) continue;

    try {
      const files = await fs.readdir(dirPath);
      const testFiles = files.filter(f => testGoPattern.test(f));

      if (testFiles.length > 0) {
        testing.hasTests = true;
        testing.frameworks.push('go-testing');
        testing.indicators.push(`Go test files in ${dir}`);
        break;
      }
    } catch (err) {
      // Skip directories we can't read
    }
  }

  return testing;
}

/**
 * Detect source file patterns and languages.
 */
async function detectSourcePatterns(projectPath) {
  const sourceFiles = {
    languages: [],
    fileCounts: {},
    indicators: []
  };

  const languageExtensions = {
    javascript: ['.js', '.jsx', '.mjs', '.cjs'],
    typescript: ['.ts', '.tsx'],
    python: ['.py'],
    go: ['.go'],
    rust: ['.rs'],
    ruby: ['.rb'],
    java: ['.java'],
    csharp: ['.cs'],
    php: ['.php'],
    html: ['.html', '.htm'],
    css: ['.css', '.scss', '.sass', '.less'],
    sql: ['.sql'],
    yaml: ['.yml', '.yaml'],
    json: ['.json'],
    markdown: ['.md']
  };

  // Quick scan of common source directories
  const searchDirs = ['src', 'lib', 'app', 'components', 'pages', 'models', 'controllers', 'services'];

  for (const dir of searchDirs) {
    const dirPath = path.join(projectPath, dir);
    if (!await fs.pathExists(dirPath)) continue;

    try {
      await scanDirectory(dirPath, sourceFiles, languageExtensions, 2); // Max depth 2
      if (Object.keys(sourceFiles.fileCounts).length > 0) break;
    } catch (err) {
      // Skip directories we can't read
    }
  }

  // Also scan root directory for source files
  try {
    const rootFiles = await fs.readdir(projectPath);
    const rootSourceFiles = rootFiles.filter(f => {
      const ext = path.extname(f).toLowerCase();
      return Object.values(languageExtensions).flat().includes(ext);
    });

    rootSourceFiles.forEach(f => {
      const ext = path.extname(f).toLowerCase();
      for (const [lang, exts] of Object.entries(languageExtensions)) {
        if (exts.includes(ext)) {
          sourceFiles.fileCounts[lang] = (sourceFiles.fileCounts[lang] || 0) + 1;
          break;
        }
      }
    });
  } catch (err) {
    // Ignore scan errors
  }

  // Determine primary languages
  const sortedLanguages = Object.entries(sourceFiles.fileCounts)
    .sort((a, b) => b[1] - a[1])
    .map(([lang]) => lang);

  sourceFiles.languages = sortedLanguages;

  if (sortedLanguages.length > 0) {
    sourceFiles.indicators.push(`Primary language: ${sortedLanguages[0]}`);
    if (sortedLanguages.length > 1) {
      sourceFiles.indicators.push(`Secondary languages: ${sortedLanguages.slice(1).join(', ')}`);
    }
  }

  return sourceFiles;
}

/**
 * Helper: Recursively scan directory for source files.
 */
async function scanDirectory(dirPath, sourceFiles, languageExtensions, maxDepth, currentDepth = 0) {
  if (currentDepth >= maxDepth) return;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip common directories to avoid long scans
        if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__'].includes(entry.name)) {
          continue;
        }
        await scanDirectory(path.join(dirPath, entry.name), sourceFiles, languageExtensions, maxDepth, currentDepth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        for (const [lang, exts] of Object.entries(languageExtensions)) {
          if (exts.includes(ext)) {
            sourceFiles.fileCounts[lang] = (sourceFiles.fileCounts[lang] || 0) + 1;
            break;
          }
        }
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
}
