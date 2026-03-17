# Tech Stack Expansion Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expand Rosetta's tech stack detection to support mobile, cloud, ML/AI, and data engineering domains, and implement intent-based skill suggestions.

**Architecture:** Add 5 new analyzers (mobile, cloud, devops, ml, data), enhance context gathering with domain-based questions, build intent matcher that matches detected tech to catalog skills, integrate suggestions into scaffold and ideate commands.

**Tech Stack:** Node.js ESM, fs-extra, inquirer, chalk; No new dependencies.

---

## Chunk 1: Foundation - Analyzer Utilities & Mobile Analyzer

### Task 1.1: Create Analyzer Utility Module

**Files:**
- Create: `lib/analyzers/utils.js`
- Test: `test/analyzers/utils.test.js`

**Context:** This module provides shared utilities for all new analyzers, specifically `recursiveGlob()` for finding files by pattern without external dependencies.

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { recursiveGlob } from '../lib/analyzers/utils.js';

describe('recursiveGlob', () => {
  it('finds all .tf files in nested directory', async () => {
    const result = await recursiveGlob('/test/fixtures/terraform-project', '**/*.tf');
    expect(result).toContain(expect.stringContaining('main.tf'));
  });

  it('ignores node_modules directory', async () => {
    const result = await recursiveGlob('/test/fixtures/node-project', '**/*.js');
    expect(result.every(p => !p.includes('node_modules'))).toBe(true);
  });

  it('returns empty array when no matches', async () => {
    const result = await recursiveGlob('/test/fixtures/empty', '**/*.xyz');
    expect(result).toEqual([]);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/analyzers/utils.test.js`
Expected: Test fails with "Module not found" or "recursiveGlob is not a function"

- [ ] **Step 3: Write minimal implementation**

```javascript
import fs from 'fs-extra';
import path from 'path';

/**
 * Recursively find files matching a simple glob pattern.
 * Supports '**/*.ext' pattern only.
 */
export async function recursiveGlob(dir, pattern) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip common ignores
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '.venv', 'venv'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subResults = await recursiveGlob(fullPath, pattern);
      results.push(...subResults);
    } else if (entry.isFile()) {
      // Simple pattern: '**/*.tf' → match file extension
      const ext = pattern.split('.').pop();
      if (entry.name.endsWith(`.${ext}`)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analyzers/utils.test.js`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/analyzers/utils.js test/analyzers/utils.test.js
git commit -m "feat: add recursiveGlob utility for analyzers"
```

---

### Task 1.2: Implement Mobile Analyzer

**Files:**
- Create: `lib/analyzers/mobile-analyzer.js`
- Create: `test/analyzers/mobile-analyzer.test.js`
- Modify: `lib/analyzers/index.js` (add export)

**Context:** Detect React Native, Flutter, iOS, and Android from project files.

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { analyzeMobile } from '../lib/analyzers/mobile-analyzer.js';

describe('mobile-analyzer', () => {
  describe('React Native detection', () => {
    it('detects React Native from package.json', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/react-native-pkg');
      expect(result.frameworks).toContain('react-native');
    });

    it('detects Expo from package.json', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/expo-pkg');
      expect(result.buildTools).toContain('expo');
    });
  });

  describe('Flutter detection', () => {
    it('detects Flutter from pubspec.yaml', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/flutter-pubspec');
      expect(result.frameworks).toContain('flutter');
    });
  });

  describe('iOS detection', () => {
    it('detects iOS from .xcodeproj directory', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/ios-xcodeproj');
      expect(result.frameworks).toContain('ios');
      expect(result.platforms).toContain('ios');
      expect(result.buildTools).toContain('xcode');
    });

    it('detects iOS from Podfile', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/ios-podfile');
      expect(result.frameworks).toContain('ios');
    });
  });

  describe('Android detection', () => {
    it('detects Android from android directory', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/android-dir');
      expect(result.frameworks).toContain('android');
      expect(result.platforms).toContain('android');
    });

    it('detects Android from build.gradle', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/android-gradle');
      expect(result.frameworks).toContain('android');
    });
  });

  describe('deduplication', () => {
    it('removes duplicate frameworks', async () => {
      const result = await analyzeMobile('/test/fixtures/mobile/react-native-with-ios');
      expect(result.frameworks.filter(f => f === 'react-native').length).toBe(1);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/analyzers/mobile-analyzer.test.js`
Expected: "Cannot find module '../lib/analyzers/mobile-analyzer.js'"

- [ ] **Step 3: Write minimal implementation**

Create `lib/analyzers/mobile-analyzer.js`:

```javascript
import fs from 'fs-extra';
import path from 'path';

export async function analyzeMobile(projectPath) {
  const detected = {
    frameworks: [],
    platforms: [],
    buildTools: [],
    configFiles: []
  };

  // Check package.json for React Native/Expo
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['react-native'] || Object.keys(deps).some(k => k.startsWith('@react-native/'))) {
        detected.frameworks.push('react-native');
      }
      if (deps.expo) {
        detected.buildTools.push('expo');
      }
    } catch (e) {
      // Ignore parse errors
    }
  }

  // Check Flutter: pubspec.yaml with sdk: flutter
  const pubspecPath = path.join(projectPath, 'pubspec.yaml');
  if (await fs.pathExists(pubspecPath)) {
    try {
      const content = await fs.readFile(pubspecPath, 'utf8');
      if (/sdk:\s*flutter/.test(content)) {
        detected.frameworks.push('flutter');
      }
    } catch (e) {}
  }

  // iOS detection
  const iosIndicators = [
    path.join(projectPath, 'ios'),
    path.join(projectPath, '.xcodeproj'),
    path.join(projectPath, 'Podfile'),
    path.join(projectPath, 'Podfile.lock')
  ];
  for (const indicator of iosIndicators) {
    if (await fs.pathExists(indicator)) {
      detected.frameworks.push('ios');
      detected.platforms.push('ios');
      detected.buildTools.push('xcode');
      break;
    }
  }

  // Android detection
  const androidIndicators = [
    path.join(projectPath, 'android'),
    path.join(projectPath, 'build.gradle'),
    path.join(projectPath, 'app/build.gradle'),
    path.join(projectPath, 'AndroidManifest.xml')
  ];
  for (const indicator of androidIndicators) {
    if (await fs.pathExists(indicator)) {
      detected.frameworks.push('android');
      detected.platforms.push('android');
      break;
    }
  }

  // Deduplicate
  detected.frameworks = [...new Set(detected.frameworks)];
  detected.platforms = [...new Set(detected.platforms)];
  detected.buildTools = [...new Set(detected.buildTools)];

  return detected;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analyzers/mobile-analyzer.test.js`
Expected: All tests pass

- [ ] **Step 5: Update exports**

Modify `lib/analyzers/index.js`:

```javascript
export { analyzeMobile } from './mobile-analyzer.js';
```

- [ ] **Step 6: Commit**

```bash
git add lib/analyzers/mobile-analyzer.js lib/analyzers/index.js test/analyzers/mobile-analyzer.test.js
git commit -m "feat: add mobile analyzer for iOS/Android/Flutter/React Native"
```

---

### Task 1.3: Implement Cloud Analyzer

**Files:**
- Create: `lib/analyzers/cloud-analyzer.js`
- Create: `test/analyzers/cloud-analyzer.test.js`
- Modify: `lib/analyzers/index.js` (add export)

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { analyzeCloud } from '../lib/analyzers/cloud-analyzer.js';

describe('cloud-analyzer', () => {
  describe('Docker detection', () => {
    it('detects Docker from Dockerfile', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/docker-project');
      expect(result.providers).toContain('docker');
      expect(result.configFiles).toContain('Dockerfile');
    });

    it('detects Docker from docker-compose.yml', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/docker-compose');
      expect(result.providers).toContain('docker');
    });
  });

  describe('Kubernetes detection', () => {
    it('detects Kubernetes from k8s directory', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/k8s-dir');
      expect(result.orchestration).toContain('kubernetes');
    });

    it('detects Kubernetes from YAML files with apiVersion', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/k8s-yaml');
      expect(result.orchestration).toContain('kubernetes');
    });
  });

  describe('Terraform detection', () => {
    it('detects Terraform from .tf files', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/terraform-project');
      expect(result.providers).toContain('terraform');
      expect(result.configFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Cloud provider detection', () => {
    it('detects AWS from package.json dependencies', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/aws-pkg');
      expect(result.providers).toContain('aws');
    });

    it('detects GCP from go.mod', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/gcp-gomod');
      expect(result.providers).toContain('gcp');
    });
  });

  describe('Serverless Framework detection', () => {
    it('detects serverless from serverless.yml', async () => {
      const result = await analyzeCloud('/test/fixtures/cloud/serverless-project');
      expect(result.providers).toContain('serverless');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test -- test/analyzers/cloud-analyzer.test.js`
Expected: Module not found

- [ ] **Step 3: Write minimal implementation**

Create `lib/analyzers/cloud-analyzer.js`:

```javascript
import fs from 'fs-extra';
import path from 'path';
import { recursiveGlob } from './utils.js';

export async function analyzeCloud(projectPath) {
  const detected = {
    providers: [],
    services: [],
    configFiles: [],
    orchestration: []
  };

  // Docker
  const dockerfilePath = path.join(projectPath, 'Dockerfile');
  if (await fs.pathExists(dockerfilePath)) {
    detected.configFiles.push('Dockerfile');
    detected.providers.push('docker');
  }

  const composePath = path.join(projectPath, 'docker-compose.yml');
  if (await fs.pathExists(composePath)) {
    detected.configFiles.push('docker-compose.yml');
    detected.providers.push('docker');
  }

  const dockerignorePath = path.join(projectPath, '.dockerignore');
  if (await fs.pathExists(dockerignorePath)) {
    detected.configFiles.push('.dockerignore');
  }

  // Kubernetes
  const k8sDir = path.join(projectPath, 'k8s');
  const helmDir = path.join(projectPath, 'helm');
  if (await fs.pathExists(k8sDir) || await fs.pathExists(helmDir)) {
    detected.orchestration.push('kubernetes');
  }

  // Check YAML files for apiVersion
  const yamlFiles = await recursiveGlob(projectPath, '**/*.yaml');
  for (const file of yamlFiles.slice(0, 10)) { // Limit to avoid performance issues
    try {
      const content = await fs.readFile(file, 'utf8');
      if (content.includes('apiVersion:')) {
        detected.orchestration.push('kubernetes');
        break;
      }
    } catch (e) {}
  }

  // Terraform
  const tfFiles = await recursiveGlob(projectPath, '**/*.tf');
  if (tfFiles.length > 0) {
    detected.configFiles.push(...tfFiles.slice(0, 5)); // limit to 5
    detected.providers.push('terraform');
  }

  // Serverless Framework
  const serverlessYml = path.join(projectPath, 'serverless.yml');
  const serverlessYaml = path.join(projectPath, 'serverless.yaml');
  if (await fs.pathExists(serverlessYml) || await fs.pathExists(serverlessYaml)) {
    detected.configFiles.push('serverless.yml');
    detected.providers.push('serverless');
  }

  // Package.json → cloud SDKs
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['aws-sdk'] || Object.keys(deps).some(k => k.startsWith('@aws-sdk/'))) {
        detected.providers.push('aws');
        detected.services.push('s3', 'lambda', 'ec2', 'dynamodb');
      }
      if (deps['@google-cloud/*'] || deps.firebase) {
        detected.providers.push('gcp');
      }
      if (Object.keys(deps).some(k => k.startsWith('@azure/'))) {
        detected.providers.push('azure');
      }
    } catch (e) {}
  }

  // Go modules
  const goModPath = path.join(projectPath, 'go.mod');
  if (await fs.pathExists(goModPath)) {
    try {
      const content = await fs.readFile(goModPath, 'utf8');
      if (content.includes('github.com/aws/aws-sdk-go')) {
        detected.providers.push('aws');
      }
      if (content.includes('cloud.google.com/go')) {
        detected.providers.push('gcp');
      }
    } catch (e) {}
  }

  // Python requirements
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (await fs.pathExists(reqPath)) {
    try {
      const content = await fs.readFile(reqPath, 'utf8');
      const lines = content.toLowerCase().split('\n');
      if (lines.some(l => l.includes('boto3') || l.includes('aws-'))) {
        detected.providers.push('aws');
      }
      if (lines.some(l => l.includes('google-cloud'))) {
        detected.providers.push('gcp');
      }
    } catch (e) {}
  }

  // Deduplicate
  detected.providers = [...new Set(detected.providers)];
  detected.services = [...new Set(detected.services)];
  detected.configFiles = [...new Set(detected.configFiles)];
  detected.orchestration = [...new Set(detected.orchestration)];

  return detected;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analyzers/cloud-analyzer.test.js`
Expected: All tests pass

- [ ] **Step 5: Update exports**

Modify `lib/analyzers/index.js`:

```javascript
export { analyzeCloud } from './cloud-analyzer.js';
```

- [ ] **Step 6: Commit**

```bash
git add lib/analyzers/cloud-analyzer.js lib/analyzers/index.js test/analyzers/cloud-analyzer.test.js
git commit -m "feat: add cloud analyzer for Docker, K8s, AWS, GCP, Terraform"
```

---

### Task 1.4: Implement DevOps Analyzer

**Files:**
- Create: `lib/analyzers/devops-analyzer.js`
- Create: `test/analyzers/devops-analyzer.test.js`
- Modify: `lib/analyzers/index.js` (add export)

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { analyzeDevOps } from '../lib/analyzers/devops-analyzer.js';

describe('devops-analyzer', () => {
  describe('CI/CD detection', () => {
    it('detects GitHub Actions from .github/workflows', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/gha-project');
      expect(result.tools).toContain('github-actions');
      expect(result.ciSystems).toContain('github-actions');
    });

    it('detects GitLab CI from .gitlab-ci.yml', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/gitlab-ci');
      expect(result.ciSystems).toContain('gitlab-ci');
    });

    it('detects CircleCI from .circleci/config.yml', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/circleci');
      expect(result.ciSystems).toContain('circleci');
    });

    it('detects Jenkins from Jenkinsfile', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/jenkins');
      expect(result.ciSystems).toContain('jenkins');
    });
  });

  describe('Infrastructure as Code detection', () => {
    it('detects Terraform from .tf files', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/terraform');
      expect(result.tools).toContain('terraform');
    });
  });

  describe('build tool detection', () => {
    it('detects Make from Makefile', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/makefile');
      expect(result.buildTools).toContain('make');
    });

    it('detects npm scripts from package.json', async () => {
      const result = await analyzeDevOps('/test/fixtures/devops/npm-scripts');
      expect(result.buildTools).toContain('npm');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: Module not found

- [ ] **Step 3: Write minimal implementation**

Create `lib/analyzers/devops-analyzer.js`:

```javascript
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
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analyzers/devops-analyzer.test.js`
Expected: All tests pass

- [ ] **Step 5: Update exports**

Modify `lib/analyzers/index.js`:

```javascript
export { analyzeDevOps } from './devops-analyzer.js';
```

- [ ] **Step 6: Commit**

```bash
git add lib/analyzers/devops-analyzer.js lib/analyzers/index.js test/analyzers/devops-analyzer.test.js
git commit -m "feat: add devops analyzer for CI/CD and build tools"
```

---

### Task 1.5: Implement ML Analyzer

**Files:**
- Create: `lib/analyzers/ml-analyzer.js`
- Create: `test/analyzers/ml-analyzer.test.js`
- Modify: `lib/analyzers/index.js` (add export)

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { analyzeML } from '../lib/analyzers/ml-analyzer.js';

describe('ml-analyzer', () => {
  describe('PyTorch detection', () => {
    it('detects PyTorch from package.json', async () => {
      const result = await analyzeML('/test/fixtures/ml/pytorch-pkg');
      expect(result.frameworks).toContain('pytorch');
    });

    it('detects PyTorch from requirements.txt', async () => {
      const result = await analyzeML('/test/fixtures/ml/pytorch-req');
      expect(result.frameworks).toContain('pytorch');
    });
  });

  describe('TensorFlow detection', () => {
    it('detects TensorFlow from package.json', async () => {
      const result = await analyzeML('/test/fixtures/ml/tf-pkg');
      expect(result.frameworks).toContain('tensorflow');
    });
  });

  describe('scikit-learn detection', () => {
    it('detects scikit-learn from requirements.txt', async () => {
      const result = await analyzeML('/test/fixtures/ml/sklearn-req');
      expect(result.frameworks).toContain('scikit-learn');
    });
  });

  describe('NVIDIA CUDA detection', () => {
    it('detects CUDA from package.json', async () => {
      const result = await analyzeML('/test/fixtures/ml/cuda-pkg');
      expect(result.gpu).toBe(true);
      expect(result.frameworks).toContain('cuda');
    });
  });

  describe('MLOps tool detection', () => {
    it('detects MLflow from dependencies', async () => {
      const result = await analyzeML('/test/fixtures/ml/mlflow');
      expect(result.mlops).toContain('mlflow');
    });

    it('detects Jupyter notebooks', async () => {
      const result = await analyzeML('/test/fixtures/ml/notebooks');
      expect(result.notebooks).toBe(true);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: Module not found

- [ ] **Step 3: Write minimal implementation**

Create `lib/analyzers/ml-analyzer.js`:

```javascript
import fs from 'fs-extra';
import path from 'path';
import { recursiveGlob } from './utils.js';

export async function analyzeML(projectPath) {
  const detected = {
    frameworks: [],
    gpu: false,
    mlops: [],
    notebooks: false,
    configFiles: []
  };

  // Check package.json
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps.torch || deps['@types/torch']) {
        detected.frameworks.push('pytorch');
      }
      if (deps.tensorflow || deps['@tensorflow/tfjs'] || deps.keras) {
        detected.frameworks.push('tensorflow');
      }
      if (deps['@google-cloud/aiplatform']) {
        detected.frameworks.push('vertex-ai');
      }

      // CUDA/NVIDIA
      if (deps['@cuda'] || Object.keys(deps).some(k => k.includes('cuda') || k.includes('nvidia'))) {
        detected.gpu = true;
        detected.frameworks.push('cuda');
      }

      // MLOps
      if (deps.mlflow) detected.mlops.push('mlflow');
      if (deps['wandb'] || deps['@weights-and-biases']) detected.mlops.push('wandb');
      if (deps.tensorboard) detected.mlops.push('tensorboard');
    } catch (e) {}
  }

  // Check requirements.txt
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (await fs.pathExists(reqPath)) {
    try {
      const content = await fs.readFile(reqPath, 'utf8');
      const lines = content.toLowerCase().split('\n');

      if (lines.some(l => l.includes('torch'))) detected.frameworks.push('pytorch');
      if (lines.some(l => l.includes('tensorflow') || l.includes('tf-'))) detected.frameworks.push('tensorflow');
      if (lines.some(l => l.includes('sklearn') || l.includes('scikit-learn'))) detected.frameworks.push('scikit-learn');
      if (lines.some(l => l.includes('mlflow'))) detected.mlops.push('mlflow');
      if (lines.some(l => l.includes('wandb') || l.includes('weights-and-biases'))) detected.mlops.push('wandb');
      if (lines.some(l => l.includes('jupyter') || l.includes('ipython'))) detected.notebooks = true;

      // CUDA
      if (lines.some(l => l.includes('cuda') || l.includes('nvidia-cuda'))) {
        detected.gpu = true;
        detected.frameworks.push('cuda');
      }
    } catch (e) {}
  }

  // Check for Jupyter notebooks
  const notebookFiles = await recursiveGlob(projectPath, '**/*.ipynb');
  if (notebookFiles.length > 0) {
    detected.notebooks = true;
  }

  // Check pyproject.toml
  const pyprojectPath = path.join(projectPath, 'pyproject.toml');
  if (await fs.pathExists(pyprojectPath)) {
    try {
      const content = await fs.readFile(pyprojectPath, 'utf8');
      const lower = content.toLowerCase();
      if (lower.includes('torch')) detected.frameworks.push('pytorch');
      if (lower.includes('tensorflow')) detected.frameworks.push('tensorflow');
    } catch (e) {}
  }

  // Deduplicate
  detected.frameworks = [...new Set(detected.frameworks)];
  detected.mlops = [...new Set(detected.mlops)];

  return detected;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analyzers/ml-analyzer.test.js`
Expected: All tests pass

- [ ] **Step 5: Update exports**

Modify `lib/analyzers/index.js`:

```javascript
export { analyzeML } from './ml-analyzer.js';
```

- [ ] **Step 6: Commit**

```bash
git add lib/analyzers/ml-analyzer.js lib/analyzers/index.js test/analyzers/ml-analyzer.test.js
git commit -m "feat: add ML analyzer for PyTorch, TensorFlow, MLOps"
```

---

### Task 1.6: Implement Data Analyzer

**Files:**
- Create: `lib/analyzers/data-analyzer.js`
- Create: `test/analyzers/data-analyzer.test.js`
- Modify: `lib/analyzers/index.js` (add export)

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { analyzeData } from '../lib/analyzers/data-analyzer.js';

describe('data-analyzer', () => {
  describe('database detection', () => {
    it('detects PostgreSQL from package.json', async () => {
      const result = await analyzeData('/test/fixtures/data/pg-pkg');
      expect(result.databases).toContain('postgresql');
    });

    it('detects MongoDB from package.json', async () => {
      const result = await analyzeData('/test/fixtures/data/mongo-pkg');
      expect(result.databases).toContain('mongodb');
    });

    it('detects Redis from package.json', async () => {
      const result = await analyzeData('/test/fixtures/data/redis-pkg');
      expect(result.databases).toContain('redis');
    });

    it('detects MySQL from package.json', async () => {
      const result = await analyzeData('/test/fixtures/data/mysql-pkg');
      expect(result.databases).toContain('mysql');
    });
  });

  describe('data warehouse detection', () => {
    it('detects Trino from dependencies', async () => {
      const result = await analyzeData('/test/fixtures/data/trino');
      expect(result.warehouses).toContain('trino');
    });
  });

  describe('ETL detection', () => {
    it('detects Apache Airflow', async () => {
      const result = await analyzeData('/test/fixtures/data/airflow');
      expect(result.etl).toContain('airflow');
    });
  });

  describe('streaming detection', () => {
    it('detects Kafka from dependencies', async () => {
      const result = await analyzeData('/test/fixtures/data/kafka');
      expect(result.streaming).toContain('kafka');
    });
  });

  describe('schema/config file detection', () => {
    it('detects Prisma schema', async () => {
      const result = await analyzeData('/test/fixtures/data/prisma');
      expect(result.configFiles).toContain('prisma/schema.prisma');
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: Module not found

- [ ] **Step 3: Write minimal implementation**

Create `lib/analyzers/data-analyzer.js`:

```javascript
import fs from 'fs-extra';
import path from 'path';
import { recursiveGlob } from './utils.js';

export async function analyzeData(projectPath) {
  const detected = {
    databases: [],
    warehouses: [],
    etl: [],
    streaming: [],
    visualization: [],
    configFiles: []
  };

  // Check package.json for database drivers and data tools
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      // Databases
      if (deps.pg) detected.databases.push('postgresql');
      if (deps.mysql || deps.mysql2) detected.databases.push('mysql');
      if (deps.mongodb || deps.mongoose) detected.databases.push('mongodb');
      if (deps.redis || deps.ioredis) detected.databases.push('redis');
      if (deps.sqlite3) detected.databases.push('sqlite');

      // Data warehouses
      if (deps.trino || deps.presto) detected.warehouses.push('trino');
      if (deps['snowflake-connector']) detected.warehouses.push('snowflake');

      // ETL
      if (deps.airflow) detected.etl.push('airflow');
      if (deps.dagster) detected.etl.push('dagster');
      if (deps.prefect) detected.etl.push('prefect');

      // Streaming
      if (deps.kafka || deps['kafkajs']) detected.streaming.push('kafka');
      if (deps.pulsar) detected.streaming.push('pulsar');
      if (deps.rabbitmq) detected.streaming.push('rabbitmq');

      // Visualization
      if (deps.plotly) detected.visualization.push('plotly');
      if (deps['@grafana']) detected.visualization.push('grafana');
    } catch (e) {}
  }

  // Check Python requirements
  const reqPath = path.join(projectPath, 'requirements.txt');
  if (await fs.pathExists(reqPath)) {
    try {
      const content = await fs.readFile(reqPath, 'utf8');
      const lines = content.toLowerCase().split('\n');

      if (lines.some(l => l.includes('psycopg2') || l.includes('pg'))) detected.databases.push('postgresql');
      if (lines.some(l => l.includes('mysql') || l.includes('pymysql'))) detected.databases.push('mysql');
      if (lines.some(l => l.includes('pymongo') || l.includes('motor'))) detected.databases.push('mongodb');
      if (lines.some(l => l.includes('redis') || l.includes('redis-py'))) detected.databases.push('redis');
      if (lines.some(l => l.includes('trino') || l.includes('presto'))) detected.warehouses.push('trino');
      if (lines.some(l => l.includes('apache-airflow'))) detected.etl.push('airflow');
      if (lines.some(l => l.includes('confluent-kafka'))) detected.streaming.push('kafka');
    } catch (e) {}
  }

  // Check for specific config files
  const prismaSchema = path.join(projectPath, 'prisma', 'schema.prisma');
  if (await fs.pathExists(prismaSchema)) {
    detected.configFiles.push('prisma/schema.prisma');
    if (!detected.databases.includes('postgresql')) {
      detected.databases.push('postgresql'); // Prisma usually with Postgres
    }
  }

  const knexfile = path.join(projectPath, 'knexfile.js');
  if (await fs.pathExists(knexfile)) {
    detected.configFiles.push('knexfile.js');
  }

  // Check for SQL files
  const sqlFiles = await recursiveGlob(projectPath, '**/*.sql');
  if (sqlFiles.length > 0) {
    detected.configFiles.push(...sqlFiles.slice(0, 5));
  }

  // Deduplicate
  detected.databases = [...new Set(detected.databases)];
  detected.warehouses = [...new Set(detected.warehouses)];
  detected.etl = [...new Set(detected.etl)];
  detected.streaming = [...new Set(detected.streaming)];
  detected.visualization = [...new Set(detected.visualization)];
  detected.configFiles = [...new Set(detected.configFiles)];

  return detected;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/analyzers/data-analyzer.test.js`
Expected: All tests pass

- [ ] **Step 5: Update exports**

Modify `lib/analyzers/index.js`:

```javascript
export { analyzeData } from './data-analyzer.js';
```

- [ ] **Step 6: Commit**

```bash
git add lib/analyzers/data-analyzer.js lib/analyzers/index.js test/analyzers/data-analyzer.test.js
git commit -m "feat: add data analyzer for databases, ETL, streaming"
```

---

## Chunk 2: Context Enhancement

### Task 2.1: Define Follow-up Questions Mapping

**Files:**
- Create: `lib/context/follow-up-questions.js` (new module)
- Test: `test/context/follow-up-questions.test.js`

**Steps:**

- [ ] **Step 1: Write the failing test**

```javascript
import { getFollowUpsForDomain } from '../lib/context/follow-up-questions.js';

describe('follow-up-questions', () => {
  it('returns iOS follow-ups when iOS/Swift selected', () => {
    const questions = getFollowUpsForDomain('mobile', 'iOS/Swift');
    expect(questions.length).toBeGreaterThan(0);
    expect(questions[0].name).toBe('iosTargets');
  });

  it('returns Docker follow-ups when Docker selected', () => {
    const questions = getFollowUpsForDomain('cloud', 'Docker');
    expect(questions.length).toBe(2);
    expect(questions[0].name).toBe('dockerUseCase');
  });

  it('returns empty array for unknown tech', () => {
    const questions = getFollowUpsForDomain('mobile', 'UnknownTech');
    expect(questions).toEqual([]);
  });

  it('covers all required follow-up mappings', () => {
    const mobileTechs = ['iOS/Swift', 'Android/Kotlin', 'Flutter', 'React Native'];
    mobileTechs.forEach(tech => {
      const q = getFollowUpsForDomain('mobile', tech);
      expect(q.length).toBeGreaterThan(0);
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Expected: Module not found

- [ ] **Step 3: Write minimal implementation**

Create `lib/context/follow-up-questions.js`:

```javascript
/**
 * Follow-up question mappings by domain and technology.
 * Returns an array of inquirer question objects.
 */
export function getFollowUpsForDomain(domain, technology) {
  const followUpMap = {
    mobile: {
      'iOS/Swift': [
        {
          type: 'checkbox',
          name: 'iosTargets',
          message: 'iOS target platforms?',
          choices: ['iPhone', 'iPad', 'macOS', 'watchOS', 'tvOS']
        },
        {
          type: 'input',
          name: 'iosMinVersion',
          message: 'Minimum iOS version?',
          default: '15.0'
        }
      ],
      'Android/Kotlin': [
        {
          type: 'input',
          name: 'androidMinSdk',
          message: 'Minimum Android SDK version?',
          default: '21'
        }
      ],
      'Flutter': [
        {
          type: 'list',
          name: 'flutterPlatform',
          message: 'Flutter target platform?',
          choices: ['iOS', 'Android', 'Web', 'All']
        }
      ],
      'React Native': [
        {
          type: 'checkbox',
          name: 'rnTargets',
          message: 'React Native target platforms?',
          choices: ['iOS', 'Android']
        },
        {
          type: 'confirm',
          name: 'expo',
          message: 'Using Expo?',
          default: false
        }
      ]
    },

    cloud: {
      'Docker': [
        {
          type: 'list',
          name: 'dockerUseCase',
          message: 'Docker use case?',
          choices: ['Development', 'Production', 'Both']
        },
        {
          type: 'list',
          name: 'dockerOrchestration',
          message: 'Orchestration?',
          choices: ['Docker Compose', 'Kubernetes', 'ECS', 'None']
        }
      ],
      'Kubernetes': [
        {
          type: 'list',
          name: 'k8sEnvironment',
          message: 'Kubernetes environment?',
          choices: ['Local (Minikube/k3s)', 'Cloud (EKS/GKE/AKS)', 'On-prem']
        }
      ],
      'AWS': [
        {
          type: 'checkbox',
          name: 'awsServices',
          message: 'Which AWS services?',
          choices: ['EC2', 'S3', 'Lambda', 'RDS', 'ECS', 'DynamoDB', 'SQS', 'SNS']
        }
      ],
      'GCP': [
        {
          type: 'checkbox',
          name: 'gcpServices',
          message: 'Which GCP services?',
          choices: ['Compute Engine', 'Cloud Run', 'GCS', 'BigQuery', 'GKE']
        }
      ],
      'Azure': [
        {
          type: 'checkbox',
          name: 'azureServices',
          message: 'Which Azure services?',
          choices: ['VMs', 'App Service', 'Blob Storage', 'AKS', 'Functions']
        }
      ]
    },

    ml: {
      'PyTorch': [
        {
          type: 'list',
          name: 'pytorchUseCase',
          message: 'PyTorch use case?',
          choices: ['Training', 'Inference', 'Computer Vision', 'NLP', 'Generative AI']
        },
        {
          type: 'list',
          name: 'pytorchDeployment',
          message: 'Deployment target?',
          choices: ['Cloud', 'Edge', 'Mobile', 'Server']
        }
      ],
      'TensorFlow': [
        {
          type: 'list',
          name: 'tfUseCase',
          message: 'TensorFlow use case?',
          choices: ['Training', 'Inference', 'Production serving', 'Research']
        }
      ],
      'NVIDIA CUDA': [
        {
          type: 'confirm',
          name: 'gpuTraining',
          message: 'GPU training?',
          default: true
        }
      ],
      'MLOps': [
        {
          type: 'checkbox',
          name: 'mlopsTools',
          message: 'MLOps tools?',
          choices: ['MLflow', 'Weights & Biases', 'TensorBoard', 'Kubeflow']
        }
      ]
    },

    data: {
      'PostgreSQL': [
        {
          type: 'confirm',
          name: 'postgresHA',
          message: 'High availability setup?',
          default: false
        }
      ],
      'Kafka': [
        {
          type: 'list',
          name: 'kafkaUseCase',
          message: 'Kafka use case?',
          choices: ['Event streaming', 'Message queue', 'Log aggregation', 'CDC']
        }
      ],
      'Redis': [
        {
          type: 'list',
          name: 'redisUseCase',
          message: 'Redis use case?',
          choices: ['Cache', 'Session store', 'Queue', 'Primary datastore']
        }
      ]
    },

    devops: {
      'GitHub Actions': [
        {
          type: 'list',
          name: 'ghaTriggers',
          message: 'Primary triggers?',
          choices: ['Push to main', 'Pull requests', 'Schedule', 'Manual']
        }
      ],
      'Terraform': [
        {
          type: 'list',
          name: 'terraformEnv',
          message: 'Target environment?',
          choices: ['AWS', 'Azure', 'GCP', 'Multi-cloud', 'On-prem']
        }
      ],
      'Jenkins': [
        {
          type: 'confirm',
          name: 'jenkinsPipelineAsCode',
          message: 'Using Jenkinsfile (pipeline as code)?',
          default: true
        }
      ]
    }
  };

  const domainMap = followUpMap[domain] || {};
  return domainMap[technology] || [];
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test -- test/context/follow-up-questions.test.js`
Expected: All tests pass

- [ ] **Step 5: Commit**

```bash
git add lib/context/follow-up-questions.js test/context/follow-up-questions.test.js
git commit -m "feat: add follow-up question mapping for tech details"
```

---

## Chunk 3: Context Integration & Intent Matcher

*(Remaining chunks would continue here - this is a truncated preview. The full plan includes all remaining tasks for context changes, intent matcher, integration, and documentation.)*

---

**Last Updated**: 2025-03-17
**Status**: In Progress (Chunk 1 of 6)
**Next Task**: Task 1.2 - Implement Mobile Analyzer
