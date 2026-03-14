import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Analyzes project directory layout and file organization.
 * Returns structure metadata for ideation scoring.
 */

/**
 * Main function to analyze project structure.
 */
export async function analyzeStructure(projectPath) {
  const structure = {
    // Basic layout
    layout: await detectLayoutPattern(projectPath),

    // Directory organization
    organization: await analyzeOrganization(projectPath),

    // File distribution
    distribution: await analyzeFileDistribution(projectPath),

    // Complexity indicators
    complexity: await assessComplexity(projectPath),

    // Best practices compliance
    bestPractices: await checkBestPractices(projectPath)
  };

  return structure;
}

/**
 * Detect overall layout pattern of the project.
 */
async function detectLayoutPattern(projectPath) {
  const layout = {
    pattern: 'unknown',
    indicators: []
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  // Check for common layout patterns
  const hasSrc = subdirs.includes('src');
  const hasApp = subdirs.includes('app');
  const hasLib = subdirs.includes('lib');
  const hasComponents = subdirs.includes('components');
  const hasPages = subdirs.includes('pages');
  const hasTests = subdirs.some(d => d.includes('test') || d.includes('spec'));

  // Next.js app router
  if (hasApp && !hasSrc) {
    const appDir = path.join(projectPath, 'app');
    if (await fs.pathExists(appDir)) {
      const appContents = await fs.readdir(appDir);
      if (appContents.some(f => f.endsWith('.tsx') || f.endsWith('.ts'))) {
        layout.pattern = 'nextjs-app';
        layout.indicators.push('Next.js App Router layout');
        return layout;
      }
    }
  }

  // Next.js pages router
  if (hasPages && hasComponents) {
    layout.pattern = 'nextjs-pages';
    layout.indicators.push('Next.js Pages Router layout');
    return layout;
  }

  // Standard src-based layout
  if (hasSrc) {
    layout.pattern = 'src-based';
    layout.indicators.push('Source code in src/ directory');

    // Check for sub-organization within src
    const srcPath = path.join(projectPath, 'src');
    if (await fs.pathExists(srcPath)) {
      const srcContents = await fs.readdir(srcPath);
      if (srcContents.includes('components')) {
        layout.indicators.push('Components organized in src/components');
      }
      if (srcContents.includes('pages') || srcContents.includes('routes')) {
        layout.indicators.push('Routes organized in src/');
      }
      if (srcContents.includes('api')) {
        layout.indicators.push('API routes in src/api');
      }
    }
    return layout;
  }

  // App-based layout (common in older Node.js projects)
  if (hasApp && !hasSrc) {
    layout.pattern = 'app-based';
    layout.indicators.push('Source code in app/ directory');
    return layout;
  }

  // Lib-based layout (common in Ruby projects)
  if (hasLib) {
    layout.pattern = 'lib-based';
    layout.indicators.push('Source code in lib/ directory');
    return layout;
  }

  // Flat layout (everything at root)
  const sourceFiles = entries.filter(e => e.isFile()).filter(f => {
    const ext = path.extname(f.name).toLowerCase();
    return ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.rb'].includes(ext);
  });

  if (sourceFiles.length > 3) {
    layout.pattern = 'flat';
    layout.indicators.push('Flat layout with multiple root source files');
    return layout;
  }

  layout.pattern = 'minimal';
  layout.indicators.push('Minimal or new project');
  return layout;
}

/**
 * Analyze directory organization and structure.
 */
async function analyzeOrganization(projectPath) {
  const organization = {
    depth: 0,
    branchingFactor: 0,
    hasLogicalGrouping: false,
    groupings: [],
    irregularities: []
  };

  // Calculate depth and branching
  const maxDepth = await calculateMaxDepth(projectPath, 0, 3); // Max depth 3 to avoid long scans
  organization.depth = maxDepth;

  // Count immediate subdirectories
  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory());
  organization.branchingFactor = subdirs.length;

  // Check for logical groupings
  const logicalGroups = [
    { pattern: /^src\/(components|pages|routes|views)$/, name: 'UI/View layer' },
    { pattern: /^src\/(models|entities|schemas)$/, name: 'Data models' },
    { pattern: /^src\/(controllers|handlers|actions)$/, name: 'Request handlers' },
    { pattern: /^src\/(services|business|domain)$/, name: 'Business logic' },
    { pattern: /^src\/(repositories|dao|db)$/, name: 'Data access' },
    { pattern: /^src\/(utils|helpers|common|shared)$/, name: 'Utilities' },
    { pattern: /^src\/(types|interfaces|dtos)$/, name: 'Type definitions' },
    { pattern: /^src\/(hooks|composables)$/, name: 'React hooks/composables' },
    { pattern: /^src\/(store|state|redux|context)$/, name: 'State management' },
    { pattern: /^(test|tests|spec|__tests__)$/, name: 'Test suite' },
    { pattern: /^(config|configuration)$/, name: 'Configuration' },
    { pattern: /^(migrations|db\/migrations)$/, name: 'Database migrations' }
  ];

  for (const group of logicalGroups) {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const fullPath = path.join(projectPath, entry.name);
        const hasGrouping = await checkForPattern(fullPath, group.pattern);
        if (hasGrouping) {
          organization.hasLogicalGrouping = true;
          organization.groupings.push(group.name);
        }
      }
    }
  }

  // Check for irregularities (e.g., mixed languages, inconsistent naming)
  const dirEntries = await fs.readdir(projectPath, { withFileTypes: true });
  const allSubdirs = dirEntries.filter(e => e.isDirectory()).map(e => e.name);

  // Check for inconsistent naming (mix of kebab-case, camelCase, snake_case)
  const namingStyles = {
    kebab: allSubdirs.filter(d => /^[a-z]+(-[a-z]+)*$/.test(d)).length,
    camel: allSubdirs.filter(d => /^[a-z]+([A-Z][a-z]*)*$/.test(d)).length,
    snake: allSubdirs.filter(d => /^[a-z]+(_[a-z]+)*$/.test(d)).length
  };

  const dirNamingCounts = Object.values(namingStyles);
  const maxNamingCount = Math.max(...dirNamingCounts);
  const mixedNaming = dirNamingCounts.filter(c => c > 0).length > 1 && maxNamingCount < allSubdirs.length * 0.7;

  if (mixedNaming) {
    organization.irregularities.push('Mixed directory naming conventions');
  }

  // Check for node_modules at unusual locations (should be filtered out)
  const nodeModulesDepth = await findNodeModulesDepth(projectPath);
  if (nodeModulesDepth > 1) {
    organization.irregularities.push(`node_modules found at depth ${nodeModulesDepth}`);
  }

  return organization;
}

/**
 * Analyze file distribution across directories.
 */
async function analyzeFileDistribution(projectPath) {
  const distribution = {
    totalFiles: 0,
    filesByExtension: {},
    filesByDirectory: {},
    largestDirectory: null,
    distributionPattern: 'unknown'
  };

  // Scan directories with depth limit
  const maxDepth = 3;
  const extensions = {};
  const dirCounts = {};

  await scanDirectoryForDistribution(projectPath, extensions, dirCounts, maxDepth, 0);

  distribution.filesByExtension = extensions;
  distribution.filesByDirectory = dirCounts;
  distribution.totalFiles = Object.values(dirCounts).reduce((sum, count) => sum + count, 0);

  // Find largest directory
  let maxCount = 0;
  for (const [dir, count] of Object.entries(dirCounts)) {
    if (count > maxCount) {
      maxCount = count;
      distribution.largestDirectory = dir;
    }
  }

  // Determine distribution pattern
  const dirCount = Object.keys(dirCounts).length;
  if (dirCount === 0) {
    distribution.distributionPattern = 'empty';
  } else if (dirCount <= 2) {
    distribution.distributionPattern = 'concentrated';
  } else if (dirCount <= 5) {
    distribution.distributionPattern = 'moderate';
  } else {
    distribution.distributionPattern = 'distributed';
  }

  return distribution;
}

/**
 * Assess project complexity based on structure.
 */
async function assessComplexity(projectPath) {
  const complexity = {
    level: 'low',
    indicators: [],
    score: 0
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory());

  // Check number of top-level directories
  if (subdirs.length > 5) {
    complexity.score += 1;
    complexity.indicators.push('Many top-level directories');
  }

  // Check for nested directories
  const maxDepth = await calculateMaxDepth(projectPath, 0, 4);
  if (maxDepth >= 4) {
    complexity.score += 2;
    complexity.indicators.push(`Deep nesting (max depth: ${maxDepth})`);
  }

  // Check for multiple source directories
  const sourceDirs = subdirs.filter(d =>
    ['src', 'lib', 'app', 'source', 'code'].includes(d)
  );
  if (sourceDirs.length > 1) {
    complexity.score += 1;
    complexity.indicators.push('Multiple source directories');
  }

  // Check for configuration complexity
  const configFiles = entries.filter(e => e.isFile()).filter(f =>
    ['.json', '.yaml', '.yml', '.toml', '.ini', '.config.js', '.config.ts'].includes(path.extname(f.name))
  );
  if (configFiles.length > 3) {
    complexity.score += 1;
    complexity.indicators.push('Many configuration files');
  }

  // Check for build tools
  const buildFiles = entries.filter(e => e.isFile()).filter(f =>
    ['webpack.config.js', 'vite.config.js', 'rollup.config.js', 'tsconfig.json',
     'Makefile', 'CMakeLists.txt', 'build.gradle'].includes(f.name)
  );
  if (buildFiles.length > 0) {
    complexity.score += 1;
    complexity.indicators.push('Custom build configuration');
  }

  // Determine complexity level
  if (complexity.score >= 4) {
    complexity.level = 'high';
  } else if (complexity.score >= 2) {
    complexity.level = 'medium';
  } else {
    complexity.level = 'low';
  }

  return complexity;
}

/**
 * Check for common best practices in project structure.
 */
async function checkBestPractices(projectPath) {
  const bestPractices = {
    follows: [],
    violations: [],
    score: 0
  };

  const entries = await fs.readdir(projectPath, { withFileTypes: true });
  const subdirs = entries.filter(e => e.isDirectory()).map(e => e.name);

  // Check for test directory
  const hasTests = subdirs.some(d => d.includes('test') || d.includes('spec'));
  if (hasTests) {
    bestPractices.follows.push('Has dedicated test directory');
    bestPractices.score += 1;
  } else {
    bestPractices.violations.push('No dedicated test directory');
  }

  // Check for README
  const hasReadme = entries.some(e => e.isFile() && e.name.toLowerCase().includes('readme'));
  if (hasReadme) {
    bestPractices.follows.push('Has README');
    bestPractices.score += 1;
  }

  // Check for .gitignore
  const hasGitignore = entries.some(e => e.isFile() && e.name === '.gitignore');
  if (hasGitignore) {
    bestPractices.follows.push('Has .gitignore');
    bestPractices.score += 1;
  }

  // Check for separate src directory
  if (subdirs.includes('src')) {
    bestPractices.follows.push('Uses src/ for source code');
    bestPractices.score += 1;
  } else {
    // Check if there are many source files at root (potential violation)
    const sourceFiles = entries.filter(e => e.isFile()).filter(f => {
      const ext = path.extname(f.name).toLowerCase();
      return ['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs'].includes(ext);
    });
    if (sourceFiles.length > 5) {
      bestPractices.violations.push('Many source files at root (consider using src/)');
    }
  }

  // Check for environment files
  const hasEnv = entries.some(e => e.isFile() && e.name.startsWith('.env'));
  if (hasEnv) {
    bestPractices.follows.push('Has environment configuration');
    bestPractices.score += 1;
  }

  // Check for documentation directory
  if (subdirs.includes('docs') || subdirs.includes('documentation')) {
    bestPractices.follows.push('Has documentation directory');
    bestPractices.score += 1;
  }

  return bestPractices;
}

/**
 * Helper: Calculate maximum directory depth.
 */
async function calculateMaxDepth(dirPath, currentDepth, maxDepth) {
  if (currentDepth >= maxDepth) return currentDepth;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const subdirs = entries.filter(e => e.isDirectory());

    if (subdirs.length === 0) return currentDepth;

    let maxChildDepth = currentDepth;
    for (const subdir of subdirs.slice(0, 10)) { // Limit to 10 subdirs to avoid long scans
      if (['node_modules', '.git', 'dist', 'build', '.next'].includes(subdir.name)) continue;

      const childDepth = await calculateMaxDepth(
        path.join(dirPath, subdir.name),
        currentDepth + 1,
        maxDepth
      );
      maxChildDepth = Math.max(maxChildDepth, childDepth);
    }

    return maxChildDepth;
  } catch (err) {
    return currentDepth;
  }
}

/**
 * Helper: Check if directory contains files matching pattern.
 */
async function checkForPattern(dirPath, pattern) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const entryPath = path.join(dirPath, entry.name);
      const relativePath = path.relative(process.cwd(), entryPath);
      
      if (pattern.test(relativePath)) {
        return true;
      }
      if (entry.isDirectory()) {
        const found = await checkForPattern(entryPath, pattern);
        if (found) return true;
      }
    }
  } catch (err) {
    // Ignore errors
  }

  return false;
}

/**
 * Helper: Scan directory for file distribution.
 */
async function scanDirectoryForDistribution(dirPath, extensions, dirCounts, maxDepth, currentDepth) {
  if (currentDepth >= maxDepth) return;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        // Skip common directories to avoid long scans
        if (['node_modules', '.git', 'dist', 'build', '.next', 'coverage', '__pycache__'].includes(entry.name)) {
          continue;
        }
        await scanDirectoryForDistribution(path.join(dirPath, entry.name), extensions, dirCounts, maxDepth, currentDepth + 1);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name).toLowerCase();
        if (ext) {
          extensions[ext] = (extensions[ext] || 0) + 1;
        }

        // Count files per directory
        const relDir = path.relative(process.cwd(), dirPath);
        dirCounts[relDir] = (dirCounts[relDir] || 0) + 1;
      }
    }
  } catch (err) {
    // Skip directories we can't read
  }
}

/**
 * Helper: Find depth of node_modules.
 */
async function findNodeModulesDepth(dirPath, currentDepth = 0) {
  if (currentDepth > 5) return -1; // Don't search too deep

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory() && entry.name === 'node_modules') {
        return currentDepth;
      }
    }

    for (const entry of entries) {
      if (entry.isDirectory() && !['node_modules', '.git', 'dist', 'build'].includes(entry.name)) {
        const found = await findNodeModulesDepth(path.join(dirPath, entry.name), currentDepth + 1);
        if (found >= 0) return found;
      }
    }
  } catch (err) {
    // Ignore errors
  }

  return -1;
}
