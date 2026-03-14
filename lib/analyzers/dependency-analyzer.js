import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Analyzes project dependencies from various package manager files.
 * Returns structured dependency data for ideation scoring.
 */

/**
 * Parse package.json and extract dependencies.
 */
export async function parseNodeDependencies(projectPath) {
  const packageJsonPath = path.join(projectPath, 'package.json');
  if (!await fs.pathExists(packageJsonPath)) {
    return { dependencies: {}, devDependencies: {}, frameworks: [], language: null };
  }

  try {
    const pkg = await fs.readJson(packageJsonPath);
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const frameworks = detectNodeFrameworks(deps);

    return {
      dependencies: pkg.dependencies || {},
      devDependencies: pkg.devDependencies || {},
      frameworks,
      language: 'TypeScript/JavaScript',
      hasTypeScript: !!pkg.dependencies?.typescript || !!pkg.devDependencies?.typescript
    };
  } catch (err) {
    console.log(chalk.yellow(`Warning: Could not parse package.json: ${err.message}`));
    return { dependencies: {}, devDependencies: {}, frameworks: [], language: null };
  }
}

/**
 * Parse go.mod and extract dependencies.
 */
export async function parseGoDependencies(projectPath) {
  const goModPath = path.join(projectPath, 'go.mod');
  if (!await fs.pathExists(goModPath)) {
    return { dependencies: {}, frameworks: [], language: null };
  }

  try {
    const content = await fs.readFile(goModPath, 'utf8');
    const lines = content.split('\n');
    const dependencies = {};
    const frameworks = [];

    lines.forEach(line => {
      const match = line.match(/^\s+([^\s]+)\s+([^\s]+)/);
      if (match) {
        const dep = match[1];
        dependencies[dep] = match[2];

        // Detect common Go frameworks/libraries
        if (dep.includes('gin-gonic')) frameworks.push('gin');
        if (dep.includes('gorilla/mux')) frameworks.push('gorilla/mux');
        if (dep.includes('echo')) frameworks.push('echo');
        if (dep.includes('fiber')) frameworks.push('fiber');
        if (dep.includes('gorm')) frameworks.push('gorm');
        if (dep.includes('lib/pq') || dep.includes('jackc/pgx')) frameworks.push('postgres');
      }
    });

    return {
      dependencies,
      frameworks,
      language: 'Go'
    };
  } catch (err) {
    console.log(chalk.yellow(`Warning: Could not parse go.mod: ${err.message}`));
    return { dependencies: {}, frameworks: [], language: null };
  }
}

/**
 * Parse requirements.txt and extract dependencies.
 */
export async function parsePythonDependencies(projectPath) {
  const requirementsPath = path.join(projectPath, 'requirements.txt');
  const pyprojectPath = path.join(projectPath, 'pyproject.toml');

  if (!await fs.pathExists(requirementsPath) && !await fs.pathExists(pyprojectPath)) {
    return { dependencies: {}, frameworks: [], language: null };
  }

  const dependencies = {};
  const frameworks = [];

  // Parse requirements.txt
  if (await fs.pathExists(requirementsPath)) {
    try {
      const content = await fs.readFile(requirementsPath, 'utf8');
      const lines = content.split('\n').map(l => l.trim()).filter(l => l && !l.startsWith('#'));

      lines.forEach(line => {
        // Extract package name (before version specifiers)
        const match = line.match(/^([a-zA-Z0-9_-]+)/);
        if (match) {
          const pkg = match[1].toLowerCase();
          dependencies[pkg] = line;

          // Detect common Python frameworks/libraries
          if (pkg.includes('django')) frameworks.push('django');
          if (pkg.includes('fastapi')) frameworks.push('fastapi');
          if (pkg.includes('flask')) frameworks.push('flask');
          if (pkg.includes('sqlalchemy')) frameworks.push('sqlalchemy');
          if (pkg.includes('pytest')) frameworks.push('pytest');
          if (pkg.includes('pymongo') || pkg.includes('motor')) frameworks.push('mongodb');
          if (pkg.includes('redis')) frameworks.push('redis');
          if (pkg.includes('celery')) frameworks.push('celery');
        }
      });
    } catch (err) {
      console.log(chalk.yellow(`Warning: Could not parse requirements.txt: ${err.message}`));
    }
  }

  // Parse pyproject.toml
  if (await fs.pathExists(pyprojectPath)) {
    try {
      const content = await fs.readFile(pyprojectPath, 'utf8');
      // Simple parsing - look for common framework patterns
      const lowerContent = content.toLowerCase();
      if (lowerContent.includes('django')) frameworks.push('django');
      if (lowerContent.includes('fastapi')) frameworks.push('fastapi');
      if (lowerContent.includes('flask')) frameworks.push('flask');
      if (lowerContent.includes('pytest')) frameworks.push('pytest');
    } catch (err) {
      console.log(chalk.yellow(`Warning: Could not parse pyproject.toml: ${err.message}`));
    }
  }

  return {
    dependencies,
    frameworks,
    language: 'Python'
  };
}

/**
 * Parse Cargo.toml and extract dependencies.
 */
export async function parseRustDependencies(projectPath) {
  const cargoPath = path.join(projectPath, 'Cargo.toml');
  if (!await fs.pathExists(cargoPath)) {
    return { dependencies: {}, frameworks: [], language: null };
  }

  try {
    const content = await fs.readFile(cargoPath, 'utf8');
    const dependencies = {};
    const frameworks = [];

    // Simple parsing - look for dependency lines
    const lines = content.split('\n');
    let inDependencies = false;

    lines.forEach(line => {
      if (line.trim() === '[dependencies]') {
        inDependencies = true;
        return;
      }
      if (inDependencies && line.trim().startsWith('[')) {
        inDependencies = false;
        return;
      }
      if (inDependencies) {
        const match = line.match(/^\s*([a-zA-Z0-9_-]+)\s*=\s*"([^"]+)"/);
        if (match) {
          const dep = match[1].toLowerCase();
          dependencies[dep] = match[2];

          // Detect common Rust frameworks/libraries
          if (dep.includes('actix')) frameworks.push('actix');
          if (dep.includes('rocket')) frameworks.push('rocket');
          if (dep.includes('tokio')) frameworks.push('tokio');
          if (dep.includes('diesel')) frameworks.push('diesel');
          if (dep.includes('sqlx')) frameworks.push('sqlx');
          if (dep.includes('redis')) frameworks.push('redis');
        }
      }
    });

    return {
      dependencies,
      frameworks,
      language: 'Rust'
    };
  } catch (err) {
    console.log(chalk.yellow(`Warning: Could not parse Cargo.toml: ${err.message}`));
    return { dependencies: {}, frameworks: [], language: null };
  }
}

/**
 * Parse Gemfile and extract dependencies.
 */
export async function parseRubyDependencies(projectPath) {
  const gemfilePath = path.join(projectPath, 'Gemfile');
  if (!await fs.pathExists(gemfilePath)) {
    return { dependencies: {}, frameworks: [], language: null };
  }

  try {
    const content = await fs.readFile(gemfilePath, 'utf8');
    const dependencies = {};
    const frameworks = [];

    // Simple parsing - look for gem declarations
    const lines = content.split('\n');
    lines.forEach(line => {
      const match = line.match(/gem\s+["']([a-zA-Z0-9_-]+)/);
      if (match) {
        const dep = match[1].toLowerCase();
        dependencies[dep] = 'latest';

        // Detect common Ruby frameworks/libraries
        if (dep.includes('rails')) frameworks.push('rails');
        if (dep.includes('sinatra')) frameworks.push('sinatra');
        if (dep.includes('rspec')) frameworks.push('rspec');
        if (dep.includes('pg')) frameworks.push('postgres');
        if (dep.includes('redis')) frameworks.push('redis');
        if (dep.includes('sidekiq')) frameworks.push('sidekiq');
      }
    });

    return {
      dependencies,
      frameworks,
      language: 'Ruby'
    };
  } catch (err) {
    console.log(chalk.yellow(`Warning: Could not parse Gemfile: ${err.message}`));
    return { dependencies: {}, frameworks: [], language: null };
  }
}

/**
 * Main function to analyze all dependencies in a project.
 * Detects the package manager and parses accordingly.
 */
export async function analyzeDependencies(projectPath) {
  const results = {
    node: await parseNodeDependencies(projectPath),
    go: await parseGoDependencies(projectPath),
    python: await parsePythonDependencies(projectPath),
    rust: await parseRustDependencies(projectPath),
    ruby: await parseRubyDependencies(projectPath)
  };

  // Find the primary language based on which parser returned data
  let primaryLanguage = null;
  let primaryFramework = [];
  let allDependencies = {};
  let allFrameworks = [];

  for (const [lang, data] of Object.entries(results)) {
    if (data.language) {
      primaryLanguage = data.language;
      primaryFramework = data.frameworks;
      allDependencies = { ...allDependencies, ...data.dependencies };
      allFrameworks = [...allFrameworks, ...data.frameworks];
      break;
    }
  }

  return {
    primaryLanguage,
    primaryFramework,
    allDependencies,
    allFrameworks,
    hasDependencies: Object.keys(allDependencies).length > 0,
    raw: results
  };
}

/**
 * Helper: Detect Node.js frameworks from dependencies.
 */
function detectNodeFrameworks(deps) {
  const frameworks = [];

  // Backend frameworks
  if (deps.express) frameworks.push('express');
  if (deps['@nestjs/core']) frameworks.push('nestjs');
  if (deps.fastify) frameworks.push('fastify');
  if (deps.koa) frameworks.push('koa');
  if (deps.hapi) frameworks.push('hapi');
  if (deps.remix || deps['@remix-run/react']) frameworks.push('remix');

  // Frontend frameworks
  if (deps.react) frameworks.push('react');
  if (deps.next) frameworks.push('next');
  if (deps.vue || deps.nuxt) frameworks.push('vue');
  if (deps.svelte) frameworks.push('svelte');
  if (deps['@angular/core']) frameworks.push('angular');
  if (deps.astro) frameworks.push('astro');

  // Databases
  if (deps.prisma || deps['@prisma/client']) frameworks.push('prisma');
  if (deps.sequelize) frameworks.push('sequelize');
  if (deps.mongoose) frameworks.push('mongoose');
  if (deps.typeorm) frameworks.push('typeorm');
  if (deps['mikro-orm']) frameworks.push('mikro-orm');
  if (deps.pg) frameworks.push('postgres');
  if (deps.mysql || deps.mysql2) frameworks.push('mysql');
  if (deps.redis || deps.ioredis) frameworks.push('redis');

  // Testing
  if (deps.jest || deps['@jest/globals']) frameworks.push('jest');
  if (deps.mocha) frameworks.push('mocha');
  if (deps.chai) frameworks.push('chai');
  if (deps.vitest) frameworks.push('vitest');
  if (deps['@playwright/test']) frameworks.push('playwright');
  if (deps.cypress) frameworks.push('cypress');
  if (deps['@testing-library/react']) frameworks.push('testing-library');

  return frameworks;
}
