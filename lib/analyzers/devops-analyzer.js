import fs from 'fs-extra';
import path from 'path';
import { recursiveGlob } from './utils.js';

export async function analyzeDevOps(projectPath) {
  const detected = {
    ciSystems: [],
    tools: [],
    buildTools: [],
    configFiles: []
  };

  // GitHub Actions
  const ghaDir = path.join(projectPath, '.github', 'workflows');
  if (await fs.pathExists(ghaDir)) {
    detected.ciSystems.push('github-actions');
    detected.tools.push('github-actions');
    detected.configFiles.push('.github/workflows/');
  }

  // GitLab CI
  const gitlabCiPath = path.join(projectPath, '.gitlab-ci.yml');
  if (await fs.pathExists(gitlabCiPath)) {
    detected.ciSystems.push('gitlab-ci');
    detected.configFiles.push('.gitlab-ci.yml');
  }

  // CircleCI
  const circleDir = path.join(projectPath, '.circleci');
  const circleConfig = path.join(circleDir, 'config.yml');
  if (await fs.pathExists(circleDir) && await fs.pathExists(circleConfig)) {
    detected.ciSystems.push('circleci');
    detected.configFiles.push('.circleci/config.yml');
  }

  // Jenkins
  const jenkinsfile = path.join(projectPath, 'Jenkinsfile');
  if (await fs.pathExists(jenkinsfile)) {
    detected.ciSystems.push('jenkins');
    detected.configFiles.push('Jenkinsfile');
  }

  // Terraform (re-use pattern from cloud analyzer but we track here as tool)
  const tfFiles = await recursiveGlob(projectPath, '**/*.tf');
  if (tfFiles.length > 0) {
    detected.tools.push('terraform');
    detected.configFiles.push(...tfFiles.slice(0, 3));
  }

  // Makefile
  if (await fs.pathExists(path.join(projectPath, 'Makefile'))) {
    detected.buildTools.push('make');
    detected.configFiles.push('Makefile');
  }

  // NPM/Yarn/PNPM scripts from package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.scripts && Object.keys(pkg.scripts).length > 0) {
        detected.buildTools.push('npm-scripts');
      }
    } catch (e) {}
  }

  // Deduplicate
  detected.ciSystems = [...new Set(detected.ciSystems)];
  detected.tools = [...new Set(detected.tools)];
  detected.buildTools = [...new Set(detected.buildTools)];
  detected.configFiles = [...new Set(detected.configFiles)];

  return detected;
}
