import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Analyzes project conventions, patterns, and coding standards.
 * Returns convention metadata for ideation scoring.
 */

/**
 * Main function to analyze project conventions.
 */
export async function analyzeConventions(projectPath) {
  const conventions = {
    // Naming conventions
    naming: await analyzeNamingConventions(projectPath),

    // Code organization patterns
    organization: await analyzeOrganizationPatterns(projectPath),

    // Documentation practices
    documentation: await analyzeDocumentationPatterns(projectPath),

    // Testing conventions
    testing: await analyzeTestingConventions(projectPath),

    // Configuration patterns
    configuration: await analyzeConfigurationPatterns(projectPath),

    // Custom patterns specific to the project
    custom: await detectCustomPatterns(projectPath)
  };

  return conventions;
}

/**
 * Analyze naming conventions used in the project.
 */
async function analyzeNamingConventions(projectPath) {
  const naming = {
    directories: { style: 'unknown', consistency: 0, examples: [] },
    files: { style: 'unknown', consistency: 0, examples: [] },
    variables: { style: 'unknown', consistency: 0, examples: [] },
    components: { style: 'unknown', consistency: 0, examples: [] }
  };

  // Analyze directory naming
  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  if (subdirs.length > 0) {
    const dirStyles = analyzeDirectoryNameStyles(subdirs);
    naming.directories = dirStyles;
  }

  // Analyze file naming in source directories
  const sourceDirs = subdirs.filter(d =>
    ['src', 'lib', 'app', 'components', 'pages', 'utils'].includes(d)
  );

  if (sourceDirs.length > 0) {
    for (const dir of sourceDirs.slice(0, 2)) { // Check up to 2 source dirs
      const dirPath = path.join(projectPath, dir);
      if (await fs.pathExists(dirPath)) {
        const files = await fs.readdir(dirPath);
        const sourceFiles = files.filter(f => {
          const ext = path.extname(f).toLowerCase();
          return ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs'].includes(ext);
        });

        if (sourceFiles.length > 0) {
          const fileStyles = analyzeFileNameStyles(sourceFiles);
          naming.files = fileStyles;
          break;
        }
      }
    }
  }

  // Analyze component naming (for React/Vue/etc projects)
  const componentsDir = path.join(projectPath, 'components');
  if (await fs.pathExists(componentsDir)) {
    const componentFiles = await fs.readdir(componentsDir);
    const comps = componentFiles.filter(f =>
      f.endsWith('.tsx') || f.endsWith('.jsx') || f.endsWith('.vue')
    );

    if (comps.length > 0) {
      const compStyles = analyzeComponentNamingStyles(comps);
      naming.components = compStyles;
    }
  }

  return naming;
}

/**
 * Analyze organization patterns and architectural conventions.
 */
async function analyzeOrganizationPatterns(projectPath) {
  const organization = {
    pattern: 'unknown',
    usesBarrels: false,
    barrelFiles: [],
    usesIndexExports: false,
    usesBarrel: false,
    groupingStrategy: 'unknown',
    featureBased: false,
    layerBased: false
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  // Check for barrel files (index.js/ts exports)
  const srcPath = path.join(projectPath, 'src');
  if (await fs.pathExists(srcPath)) {
    await scanForBarrelFiles(srcPath, organization);
  }

  // Detect grouping strategy
  const hasFeatureDirs = subdirs.some(d =>
    /^(features|modules|domains|entities)/.test(d)
  );
  const hasLayerDirs = subdirs.some(d =>
    /^(components|services|models|controllers|views|utils)/.test(d)
  );

  if (hasFeatureDirs) {
    organization.groupingStrategy = 'feature-based';
    organization.featureBased = true;
  } else if (hasLayerDirs) {
    organization.groupingStrategy = 'layer-based';
    organization.layerBased = true;
  } else {
    organization.groupingStrategy = 'mixed or flat';
  }

  // Check for index.ts/js exports pattern (TypeScript/JavaScript)
  const indexPath = path.join(projectPath, 'src', 'index.ts');
  if (await fs.pathExists(indexPath)) {
    organization.usesIndexExports = true;
  }

  return organization;
}

/**
 * Analyze documentation patterns and practices.
 */
async function analyzeDocumentationPatterns(projectPath) {
  const documentation = {
    hasReadme: false,
    readmeFormat: 'none',
    hasChangelog: false,
    hasContributing: false,
    hasDocsDir: false,
    hasInlineDocs: false,
    hasApiDocs: false,
    docStandard: 'unknown',
    docTools: []
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });

  // Check for README
  const readmeFile = entries.find(e =>
    e.isFile() && e.name.toLowerCase().startsWith('readme')
  );
  if (readmeFile) {
    documentation.hasReadme = true;
    const readmePath = path.join(projectPath, readmeFile.name);
    const content = await fs.readFile(readmePath, 'utf8');

    // Detect README format
    if (content.includes('```') || content.includes('```typescript')) {
      documentation.readmeFormat = 'markdown-with-code';
    } else if (content.includes('<!--') || content.includes('<h')) {
      documentation.readmeFormat = 'html';
    } else {
      documentation.readmeFormat = 'markdown';
    }

    // Check for common sections
    if (content.includes('## Installation') || content.includes('# Installation')) {
      documentation.docStandard = 'structured';
    }
  }

  // Check for CHANGELOG
  const changelogFile = entries.find(e =>
    e.isFile() && e.name.toLowerCase().includes('changelog')
  );
  if (changelogFile) {
    documentation.hasChangelog = true;
  }

  // Check for CONTRIBUTING
  const contributingFile = entries.find(e =>
    e.isFile() && e.name.toLowerCase().includes('contributing')
  );
  if (contributingFile) {
    documentation.hasContributing = true;
  }

  // Check for docs directory
  const docsDir = entries.find(e =>
    e.isDirectory() && (e.name === 'docs' || e.name === 'documentation')
  );
  if (docsDir) {
    documentation.hasDocsDir = true;
  }

  // Check for API docs tools
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['@storybook/react'] || deps['@storybook/vue'] || deps['@storybook/nextjs']) {
        documentation.docTools.push('storybook');
      }
      if (deps.swagger || deps['@apidevtools/swagger-cli']) {
        documentation.docTools.push('swagger');
      }
      if (deps['@docusaurus/core']) {
        documentation.docTools.push('docusaurus');
      }
      if (deps['vuepress']) {
        documentation.docTools.push('vuepress');
      }
    } catch (err) {
      // Ignore parse errors
    }
  }

  // Check for inline documentation patterns
  const srcPath = path.join(projectPath, 'src');
  if (await fs.pathExists(srcPath)) {
    const hasJSDoc = await checkForJSDocPatterns(srcPath);
    documentation.hasInlineDocs = hasJSDoc;
  }

  return documentation;
}

/**
 * Analyze testing conventions and patterns.
 */
async function analyzeTestingConventions(projectPath) {
  const testing = {
    framework: 'unknown',
    namingPattern: 'unknown',
    locationStrategy: 'unknown',
    usesTestDoubles: false,
    hasTestUtils: false,
    coverageConfigured: false,
    testStructure: 'unknown'
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });

  // Detect test framework from package.json
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(packageJsonPath)) {
    try {
      const pkg = await fs.readJson(packageJsonPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.jest || deps['@jest/globals']) {
        testing.framework = 'jest';
      } else if (deps.mocha) {
        testing.framework = 'mocha';
      } else if (deps.vitest) {
        testing.framework = 'vitest';
      } else if (deps['@playwright/test']) {
        testing.framework = 'playwright';
      } else if (deps.cypress) {
        testing.framework = 'cypress';
      }
    } catch (err) {
      // Ignore parse errors
    }
  }

  // Detect test naming pattern
  const testDirs = entries.filter(e =>
    e.isDirectory() && (e.name.includes('test') || e.name.includes('spec'))
  );

  if (testDirs.length > 0) {
    for (const testDir of testDirs.slice(0, 1)) { // Check first test dir
      const dirPath = path.join(projectPath, testDir.name);
      const files = await fs.readdir(dirPath);
      const testFiles = files.filter(f =>
        f.endsWith('.test.js') || f.endsWith('.test.ts') ||
        f.endsWith('.spec.js') || f.endsWith('.spec.ts')
      );

      if (testFiles.length > 0) {
        if (testFiles.some(f => f.includes('.test.'))) {
          testing.namingPattern = '*.test.*';
        } else if (testFiles.some(f => f.includes('.spec.'))) {
          testing.namingPattern = '*.spec.*';
        }
      }
    }
  }

  // Detect test location strategy
  const srcPath = path.join(projectPath, 'src');
  if (await fs.pathExists(srcPath)) {
    const hasCoLocated = await scanForCoLocatedTests(srcPath);
    const hasSeparate = testDirs.length > 0;

    if (hasCoLocated && hasSeparate) {
      testing.locationStrategy = 'mixed';
    } else if (hasCoLocated) {
      testing.locationStrategy = 'co-located';
    } else if (hasSeparate) {
      testing.locationStrategy = 'separate';
    }
  }

  // Check for test utilities
  const testUtilsPath = path.join(projectPath, 'test-utils');
  const testHelpersPath = path.join(projectPath, 'tests', 'helpers');

  if (await fs.pathExists(testUtilsPath) || await fs.pathExists(testHelpersPath)) {
    testing.hasTestUtils = true;
  }

  // Check for coverage configuration
  const jestConfigPath = path.join(projectPath, 'jest.config.js');
  const vitestConfigPath = path.join(projectPath, 'vitest.config.js');

  if (await fs.pathExists(jestConfigPath) || await fs.pathExists(vitestConfigPath)) {
    testing.coverageConfigured = true;
  }

  return testing;
}

/**
 * Analyze configuration patterns.
 */
async function analyzeConfigurationPatterns(projectPath) {
  const configuration = {
    style: 'unknown',
    hasEnvFiles: false,
    envFiles: [],
    usesConfigFiles: false,
    configFiles: [],
    usesJsonConfig: false,
    usesYamlConfig: false,
    hasBuildConfig: false,
    hasLintConfig: false
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });

  // Check for environment files
  const envFiles = entries.filter(e =>
    e.isFile() && e.name.startsWith('.env')
  );

  if (envFiles.length > 0) {
    configuration.hasEnvFiles = true;
    configuration.envFiles = envFiles.map(f => f.name);
    configuration.style = 'env-based';
  }

  // Check for configuration files
  const configExtensions = ['.json', '.js', '.ts', '.yaml', '.yml', '.toml', '.ini'];
  const configFiles = entries.filter(e =>
    e.isFile() && configExtensions.includes(path.extname(e.name).toLowerCase())
  );

  if (configFiles.length > 0) {
    configuration.usesConfigFiles = true;
    configuration.configFiles = configFiles.map(f => f.name);

    // Determine config style
    const hasJson = configFiles.some(f => f.name.endsWith('.json'));
    const hasYaml = configFiles.some(f => f.name.endsWith('.yaml') || f.name.endsWith('.yml'));

    if (hasJson) {
      configuration.usesJsonConfig = true;
      configuration.style = 'json-based';
    }
    if (hasYaml) {
      configuration.usesYamlConfig = true;
      configuration.style = 'yaml-based';
    }
  }

  // Check for build configuration
  const buildConfigs = ['webpack.config.js', 'vite.config.js', 'rollup.config.js',
    'tsconfig.json', 'next.config.js', 'angular.json'];
  const hasBuildConfig = entries.some(e =>
    e.isFile() && buildConfigs.includes(e.name)
  );

  if (hasBuildConfig) {
    configuration.hasBuildConfig = true;
  }

  // Check for lint configuration
  const lintConfigs = ['.eslintrc.js', '.eslintrc.json', '.eslintrc.yml',
    '.prettierrc', 'prettier.config.js', '.pylintrc'];
  const hasLintConfig = entries.some(e =>
    e.isFile() && lintConfigs.includes(e.name)
  );

  if (hasLintConfig) {
    configuration.hasLintConfig = true;
  }

  return configuration;
}

/**
 * Detect custom patterns specific to the project.
 */
async function detectCustomPatterns(projectPath) {
  const custom = {
    patterns: [],
    uniqueDirectories: [],
    uniqueFiles: [],
    unusualConfigurations: []
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);
  const files = entries.filter(e => e.isFile()).map(e => e.name);

  // Detect unusual directories (not in common patterns)
  const commonDirs = ['src', 'lib', 'app', 'test', 'tests', 'docs', 'config',
    'node_modules', '.git', 'dist', 'build', 'public', 'static',
    'components', 'pages', 'api', 'utils', 'services', 'models',
    'controllers', 'views', 'assets', 'styles', 'scripts'];

  const unusualDirs = subdirs.filter(d => !commonDirs.includes(d));
  if (unusualDirs.length > 0) {
    custom.uniqueDirectories = unusualDirs;
  }

  // Detect unusual configuration files
  const unusualConfigs = files.filter(f =>
    f.includes('config') && !f.startsWith('.') &&
    !['package.json', 'package-lock.json', 'yarn.lock'].includes(f)
  );
  if (unusualConfigs.length > 0) {
    custom.unusualConfigurations = unusualConfigs;
  }

  // Detect custom scripts
  const scripts = files.filter(f =>
    f.endsWith('.sh') || f.startsWith('Makefile') || f === 'Rakefile'
  );
  if (scripts.length > 0) {
    custom.patterns.push('Custom build scripts');
  }

  // Detect monorepo patterns
  if (subdirs.includes('packages') || subdirs.includes('apps') || subdirs.includes('services')) {
    custom.patterns.push('Monorepo structure');
  }

  // Detect docker usage
  if (files.includes('Dockerfile') || subdirs.includes('docker')) {
    custom.patterns.push('Docker containerization');
  }

  // Detect CI/CD
  if (subdirs.includes('.github') || subdirs.includes('.gitlab-ci') ||
    files.includes('.travis.yml') || files.includes('circleci.config.yml')) {
    custom.patterns.push('CI/CD pipeline');
  }

  return custom;
}

/**
 * Helper: Analyze directory name styles.
 */
function analyzeDirectoryNameStyles(dirNames) {
  const styles = {
    kebabCase: 0,
    camelCase: 0,
    snakeCase: 0,
    PascalCase: 0
  };

  dirNames.forEach(name => {
    if (/^[a-z]+(-[a-z]+)*$/.test(name)) {
      styles.kebabCase++;
    } else if (/^[a-z]+([A-Z][a-z]*)*$/.test(name)) {
      styles.camelCase++;
    } else if (/^[a-z]+(_[a-z]+)*$/.test(name)) {
      styles.snakeCase++;
    } else if (/^[A-Z][a-z]+([A-Z][a-z]*)*$/.test(name)) {
      styles.PascalCase++;
    }
  });

  // Determine dominant style
  let dominantStyle = 'unknown';
  let maxCount = 0;
  for (const [style, count] of Object.entries(styles)) {
    if (count > maxCount) {
      maxCount = count;
      dominantStyle = style;
    }
  }

  const consistency = maxCount / dirNames.length;

  return {
    style: dominantStyle,
    consistency: consistency.toFixed(2),
    examples: dirNames.slice(0, 3)
  };
}

/**
 * Helper: Analyze file name styles.
 */
function analyzeFileNameStyles(fileNames) {
  const styles = {
    kebabCase: 0,
    camelCase: 0,
    PascalCase: 0
  };

  fileNames.forEach(name => {
    const baseName = path.basename(name, path.extname(name));
    if (/^[a-z]+(-[a-z]+)*$/.test(baseName)) {
      styles.kebabCase++;
    } else if (/^[a-z]+([A-Z][a-z]*)*$/.test(baseName)) {
      styles.camelCase++;
    } else if (/^[A-Z][a-z]+([A-Z][a-z]*)*$/.test(baseName)) {
      styles.PascalCase++;
    }
  });

  // Determine dominant style
  let dominantStyle = 'unknown';
  let maxCount = 0;
  for (const [style, count] of Object.entries(styles)) {
    if (count > maxCount) {
      maxCount = count;
      dominantStyle = style;
    }
  }

  const consistency = fileNames.length > 0 ? maxCount / fileNames.length : 0;

  return {
    style: dominantStyle,
    consistency: consistency.toFixed(2),
    examples: fileNames.slice(0, 3)
  };
}

/**
 * Helper: Analyze component naming styles.
 */
function analyzeComponentNamingStyles(fileNames) {
  const styles = {
    PascalCase: 0,
    lowercase: 0,
    other: 0
  };

  fileNames.forEach(name => {
    const baseName = path.basename(name, path.extname(name));
    if (/^[A-Z][a-z]+([A-Z][a-z]*)*$/.test(baseName)) {
      styles.PascalCase++;
    } else if (/^[a-z]+$/.test(baseName)) {
      styles.lowercase++;
    } else {
      styles.other++;
    }
  });

  let dominantStyle = 'unknown';
  let maxCount = 0;
  for (const [style, count] of Object.entries(styles)) {
    if (count > maxCount) {
      maxCount = count;
      dominantStyle = style;
    }
  }

  const consistency = fileNames.length > 0 ? maxCount / fileNames.length : 0;

  return {
    style: dominantStyle,
    consistency: consistency.toFixed(2),
    examples: fileNames.slice(0, 3)
  };
}

/**
 * Helper: Scan for barrel files.
 */
async function scanForBarrelFiles(dirPath, organization) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name === 'index.js' || entry.name === 'index.ts')) {
        organization.barrelFiles.push(path.relative(process.cwd(), dirPath));
        organization.usesBarrels = true;
      }

      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        await scanForBarrelFiles(path.join(dirPath, entry.name), organization);
      }
    }
  } catch (err) {
    // Ignore errors
  }
}

/**
 * Helper: Check for JSDoc patterns.
 */
async function checkForJSDocPatterns(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.endsWith('.js') || entry.name.endsWith('.ts'))) {
        try {
          const content = await fs.readFile(path.join(dirPath, entry.name), 'utf8');
          if (content.includes('/**') && content.includes('* @')) {
            return true;
          }
        } catch (err) {
          // Skip unreadable files
        }
      }
    }
  } catch (err) {
    // Ignore errors
  }

  return false;
}

/**
 * Helper: Scan for co-located tests.
 */
async function scanForCoLocatedTests(srcPath) {
  try {
    const entries = await fs.readdir(srcPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isFile() && (entry.name.includes('.test.') || entry.name.includes('.spec.'))) {
        return true;
      }
    }
  } catch (err) {
    // Ignore errors
  }

  return false;
}
