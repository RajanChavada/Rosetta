# Tech Stack Expansion - Rosetta v0.4.0

**Date**: 2025-03-17
**Status**: Ready for Implementation (Revised)
**Scope**: Comprehensive tech stack detection and skill suggestion system

---

## 1. Executive Summary

Expand Rosetta's project detection capabilities to support modern development stacks including mobile, cloud infrastructure, ML/AI, and data engineering. Coupled with an intent matching system that proactively suggests relevant skills based on detected technologies.

**Key Deliverables**:
- 5 new analyzers: mobile, cloud, devops, ml, data
- Enhanced `gatherContext()` with domain-based questioning (preserving backward compatibility)
- Intent matcher for skill suggestions
- Integration with scaffold and ideate commands
- Full test coverage (>80%)

---

## 2. Architecture

### 2.1 New Modules

```
lib/analyzers/
├── mobile-analyzer.js       # iOS, Android, Flutter, React Native
├── cloud-analyzer.js        # AWS, GCP, Azure, Docker, K8s
├── devops-analyzer.js       # CI/CD, IaC, build tools
├── ml-analyzer.js           # PyTorch, TensorFlow, NVIDIA, MLOps
├── data-analyzer.js         # Databases, warehouses, ETL
└── index.js                 # Export all analyzers

lib/
└── intent-matcher.js        # Skill suggestion engine
```

### 2.2 Updated Components

- `lib/context.js`:
  - Enhance `gatherContext()` - add domain-based questions **while preserving** `frontend`, `backend`, `datastores` fields for backward compatibility
  - Update `analyzeProjectForIdeation()` - call new analyzers and include results
  - Add follow-up question triggers
  - Implement `recursiveGlob()` utility (no external dependency)

- `lib/cli-helpers.js`:
  - Show suggestions after scaffold (unless `--no-suggestions`)
  - Display **informational only** - show suggestion with `rosetta install <skill>` command (no auto-install)
  - Maintain existing behavior for backward compatibility

- `lib/commands/ideate.js`:
  - Add "Recommended Skills" section to ideation template
  - Format with relevance percentages

- `cli.js`:
  - Add `--no-suggestions` flag to scaffold command

### 2.3 Data Flow

```
User runs: rosetta scaffold

1. gatherContext() called
   ├── detects current tech (dependency analyzer + new analyzers)
   ├── shows enhanced tiered questions
   │   ├── Web Stack (React, Vue, etc.) [if Web/Internal/Other]
   │   ├── Mobile Stack (iOS, Android, Flutter, RN) [always]
   │   ├── Cloud/Infrastructure (AWS, Docker, K8s) [always]
   │   ├── ML/AI (PyTorch, TensorFlow, etc.) [if Data/ML or ML deps]
   │   ├── Data/Datastores (Postgres, Kafka, etc.) [always]
   │   └── DevOps/CI (GitHub Actions, Terraform) [always]
   │   └── Conditional follow-ups based on selections (grouped by domain)
   └── uses hybrid auto-detection:
       - Show detected summary
       - Ask: "Use detected values? (Y/n)"
       - If No: show full context with detected defaults pre-filled

2. Scaffold completes

3. Show skill suggestions (if enabled)
   └── intentMatcher.suggestSkills(answers + detected)
       ├── Load catalog.json (fallback to built-in catalog)
       ├── Match detected tech **using exact token matching** with confidence threshold ≥ 0.3
       ├── Score by precision (matches / skillKeywords)
       └── Display top 5 with install commands (informational)

4. User can manually install: `rosetta install <skill-name>`
```

---

## 3. Detailed Specifications

### 3.1 Backward Compatibility Guarantee

**CRITICAL**: Enhanced context **preserves** existing fields `frontend`, `backend`, `datastores`. These continue to be used by existing built-in skills (`inferStarterSkills()`) and must remain functional.

**Implementation**:
- `gatherContext()` will still produce `frontend`, `backend`, `datastores` arrays
- New fields: `webStack`, `mobileStack`, `cloudStack`, `mlStack`, `dataStack`, `devopsStack`
- `analyzeProjectForIdeation()` returns both old and new fields
- Old skills continue to work unchanged

**Deprecation Path**: Document that `frontend`/`backend`/`datastores` are legacy; new skills should use domain-specific arrays. No removal planned.

---

### 3.2 Enhanced Context Gathering

**Current Structure** (tiers):
- Tier 1: Project name, description, type
- Tier 2: Frontend, Backend, Datastores (3 separate questions)
- Tier 3+: Domain, risk, team, workflow, agent style, extras

**New Structure** (additive):
- **Tier 1**: Same
- **Tier 2a**: Existing questions (frontend, backend, datastores) for backward compatibility
- **Tier 2b**: **NEW** Domain-based stack questions (showed conditionally):
  1. Web Stack (if project type is Web/Internal/Other)
  2. Mobile Stack (always if not Library/SDK OR if mobile deps detected)
  3. Cloud/Infrastructure (always if not Library/SDK)
  4. ML/AI (if project type is Data/ML OR ML deps detected)
  5. Data/Datastores (always) - **Note**: this is separate from existing datastores question
  6. DevOps/CI (if not Library/SDK)
- **Tier 3+**: Same

**Question Format** (example for Web Stack):
```javascript
{
  type: 'checkbox',
  name: 'webStack',
  message: 'Web stack (select frameworks/libraries):',
  choices: [
    'React',
    'Next.js',
    'Vue',
    'Svelte',
    'Angular',
    'Astro',
    'HTMX',
    'None'  // Special option meaning "no web stack"
  ],
  default: detected.webStack || []
}
```

**"None" Option Handling**:
- "None" checkbox included in every domain question
- If user selects "None" and no other items → context field = `[]`
- If user selects "None" + other items → ignore "None", use only selected items
- In auto-detection summary: display "None" if detected array is empty

**Auto-Detection Display (Simplified)**:

Follow existing Rosetta pattern (no custom keypress handling):

Step 1:
```
Auto-detected project information:
  Type: Web app
  Web Stack: React, Next.js (detected from package.json)
  Mobile: None
  Cloud: Docker (Dockerfile found)
  ML/AI: None
  Data: PostgreSQL, Redis
  DevOps: GitHub Actions (.github/workflows/)

Use detected values? [Y/n]
```

Step 2:
```
? Use detected values? (Y/n)
  ❯ Yes
    No
```

Step 3 (if No): Standard `gatherContext()` flow with detected values as defaults for all questions (both old and new fields). This already works in existing code.

---

### 3.3 Follow-up Questions (Grouped, With Skip)

**Design**: After Tier 2 (all domain questions complete), trigger **grouped** follow-ups by domain. Offer a global "Skip remaining details" option.

**Follow-up Question Mapping**:
```javascript
const FOLLOW_UP_BY_DOMAIN = {
  mobile: {
    'iOS/Swift': [
      { type: 'checkbox', name: 'iosTargets', message: 'iOS target platforms?', choices: ['iPhone', 'iPad', 'macOS', 'watchOS', 'tvOS'] },
      { type: 'input', name: 'iosMinVersion', message: 'Minimum iOS version?', default: '15.0' }
    ],
    'Android/Kotlin': [
      { type: 'input', name: 'androidMinSdk', message: 'Minimum SDK version?', default: '21' }
    ],
    'Flutter': [
      { type: 'list', name: 'flutterPlatform', message: 'Target platform?', choices: ['iOS', 'Android', 'Web', 'All'] }
    ],
    'React Native': [
      { type: 'checkbox', name: 'rnTargets', message: 'Target platforms?', choices: ['iOS', 'Android'] },
      { type: 'confirm', name: 'expo', message: 'Using Expo?', default: false }
    ]
  },

  cloud: {
    'Docker': [
      { type: 'list', name: 'dockerUseCase', message: 'Docker use case?', choices: ['Development', 'Production', 'Both'] },
      { type: 'list', name: 'dockerOrchestration', message: 'Orchestration?', choices: ['Docker Compose', 'Kubernetes', 'ECS', 'None'] }
    ],
    'Kubernetes': [
      { type: 'list', name: 'k8sEnvironment', message: 'K8s environment?', choices: ['Local (Minikube/k3s)', 'Cloud (EKS/GKE/AKS)', 'On-prem'] }
    ],
    'AWS': [
      { type: 'checkbox', name: 'awsServices', message: 'Which AWS services?', choices: ['EC2', 'S3', 'Lambda', 'RDS', 'ECS', 'DynamoDB', 'SQS', 'SNS'] }
    ],
    'GCP': [
      { type: 'checkbox', name: 'gcpServices', message: 'Which GCP services?', choices: ['Compute Engine', 'Cloud Run', 'GCS', 'BigQuery', 'GKE'] }
    ],
    'Azure': [
      { type: 'checkbox', name: 'azureServices', message: 'Which Azure services?', choices: ['VMs', 'App Service', 'Blob Storage', 'AKS', 'Functions'] }
    ]
  },

  ml: {
    'PyTorch': [
      { type: 'list', name: 'pytorchUseCase', message: 'ML use case?', choices: ['Training', 'Inference', 'Computer Vision', 'NLP', 'Generative AI'] },
      { type: 'list', name: 'pytorchDeployment', message: 'Deployment target?', choices: ['Cloud', 'Edge', 'Mobile', 'Server'] }
    ],
    'TensorFlow': [
      { type: 'list', name: 'tfUseCase', message: 'TensorFlow use case?', choices: ['Training', 'Inference', 'Production serving', 'Research'] }
    ],
    'NVIDIA CUDA': [
      { type: 'confirm', name: 'gpuTraining', message: 'GPU training?', default: true }
    ],
    'MLOps': [
      { type: 'checkbox', name: 'mlopsTools', message: 'MLOps tools?', choices: ['MLflow', 'Weights & Biases', 'TensorBoard', 'Kubeflow'] }
    ]
  },

  data: {
    'PostgreSQL': [
      { type: 'confirm', name: 'postgresHA', message: 'High availability?', default: false }
    ],
    'Kafka': [
      { type: 'list', name: 'kafkaUseCase', message: 'Kafka use case?', choices: ['Event streaming', 'Message queue', 'Log aggregation', 'CDC'] }
    ]
  },

  devops: {
    'GitHub Actions': [
      { type: 'list', name: 'ghaTriggers', message: 'Primary triggers?', choices: ['Push to main', 'Pull requests', 'Schedule', 'Manual'] }
    ],
    'Terraform': [
      { type: 'list', name: 'terraformEnv', message: 'Target environment?', choices: ['AWS', 'Azure', 'GCP', 'Multi-cloud', 'On-prem'] }
    ]
  }
};
```

**Trigger Logic**:
```javascript
// After main Tier 2 questions complete
const followUpOptions = ['Yes', 'No, skip remaining details'];
const { doFollowUps } = await inquirer.prompt([{
  type: 'list',
  name: 'doFollowUps',
  message: 'Would you like to provide additional details about your tech stack?',
  choices: followUpOptions,
  default: 'Yes'
}]);

if (doFollowUps === 'Yes') {
  // Process by domain in fixed order: mobile → cloud → ml → data → devops
  for (const domain of ['mobile', 'cloud', 'ml', 'data', 'devops']) {
    const domainAnswers = context[`${domain}Stack`] || [];
    for (const item of domainAnswers) {
      const questions = FOLLOW_UP_BY_DOMAIN[domain]?.[item];
      if (questions) {
        const responses = await inquirer.prompt(questions);
        Object.assign(context, responses);
      }
    }
  }
}
```

This groups questions by domain (all mobile together, then cloud, etc.) and allows a single skip for all.

---

### 3.4 Simple Analyzer Implementations

**Design Principles**:
- **File-based detection**: Check existence of key files/directories
- **Dependency scanning**: Parse package manager files for known packages
- **Simple returns**: `{ frameworks: [], platforms: [], configFiles: [] }`
- **No complex scoring**: Presence = detected

**Shared Utility** (`lib/analyzers/utils.js`):
```javascript
import fs from 'fs-extra';
import path from 'path';

/**
 * Recursively find files matching glob pattern (simple implementation).
 * Supports: '**/*.tf', '**/Dockerfile', etc.
 */
export async function recursiveGlob(dir, pattern) {
  const results = [];
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    // Skip common ignores
    if (['node_modules', '.git', 'dist', 'build', 'coverage', '.venv'].includes(entry.name)) {
      continue;
    }

    if (entry.isDirectory()) {
      const subResults = await recursiveGlob(fullPath, pattern);
      results.push(...subResults);
    } else if (entry.isFile()) {
      // Simple pattern matching: '**/*.tf' → file ends with '.tf'
      const regex = pattern
        .replace('**/', '')
        .replace(/\*/g, '.*');
      const match = new RegExp(regex);
      if (match.test(entry.name)) {
        results.push(fullPath);
      }
    }
  }

  return results;
}
```

#### Mobile Analyzer (`lib/analyzers/mobile-analyzer.js`)

```javascript
import fs from 'fs-extra';
import path from 'path';
import { recursiveGlob } from './utils.js';

export async function analyzeMobile(projectPath) {
  const detected = {
    frameworks: [],
    platforms: [],
    buildTools: [],
    configFiles: []
  };

  // Package.json → React Native, Expo
  const pkgPath = path.join(projectPath, 'package.json');
  if (await fs.pathExists(pkgPath)) {
    try {
      const pkg = await fs.readJson(pkgPath);
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };

      if (deps['react-native'] || deps['@react-native-*']) {
        detected.frameworks.push('react-native');
      }
      if (deps.expo) {
        detected.frameworks.push('react-native');  // expo is RN variant
        detected.buildTools.push('expo');
      }
    } catch (e) {}
  }

  // Flutter: pubspec.yaml with sdk: flutter
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
    path.join(projectPath, 'Podfile')
  ];
  if (await Promise.any(iosIndicators.map(p => fs.pathExists(p)))) {
    detected.frameworks.push('ios');
    detected.platforms.push('ios');
    detected.buildTools.push('xcode');
  }

  // Android detection
  const androidIndicators = [
    path.join(projectPath, 'android'),
    path.join(projectPath, 'build.gradle'),
    path.join(projectPath, 'app/build.gradle'),
    path.join(projectPath, 'AndroidManifest.xml')
  ];
  if (await Promise.any(androidIndicators.map(p => fs.pathExists(p)))) {
    detected.frameworks.push('android');
    detected.platforms.push('android');
  }

  // Deduplicate
  detected.frameworks = [...new Set(detected.frameworks)];
  detected.platforms = [...new Set(detected.platforms)];
  detected.buildTools = [...new Set(detected.buildTools)];

  return detected;
}
```

#### Cloud Analyzer (`lib/analyzers/cloud-analyzer.js`)

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
  if (await fs.pathExists(path.join(projectPath, 'Dockerfile'))) {
    detected.configFiles.push('Dockerfile');
    detected.providers.push('docker');
  }
  if (await fs.pathExists(path.join(projectPath, 'docker-compose.yml'))) {
    detected.configFiles.push('docker-compose.yml');
    detected.providers.push('docker');
  }
  if (await fs.pathExists(path.join(projectPath, '.dockerignore'))) {
    detected.configFiles.push('.dockerignore');
  }

  // Kubernetes
  const k8sDir = path.join(projectPath, 'k8s');
  const helmDir = path.join(projectPath, 'helm');
  if (await fs.pathExists(k8sDir) || await fs.pathExists(helmDir)) {
    detected.orchestration.push('kubernetes');
    // also check for .yaml files with apiVersion
    const yamlFiles = await recursiveGlob(projectPath, '**/*.yaml');
    for (const file of yamlFiles) {
      try {
        const content = await fs.readFile(file, 'utf8');
        if (content.includes('apiVersion:')) {
          detected.orchestration.push('kubernetes'); // already there
          break;
        }
      } catch (e) {}
    }
  }

  // Terraform
  const tfFiles = await recursiveGlob(projectPath, '**/*.tf');
  if (tfFiles.length > 0) {
    detected.configFiles.push(...tfFiles.slice(0, 5)); // limit to 5
    detected.providers.push('terraform');
  }

  // Serverless Framework
  if (await fs.pathExists(path.join(projectPath, 'serverless.yml')) ||
      await fs.pathExists(path.join(projectPath, 'serverless.yaml'))) {
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
        detected.services.push('s3', 'lambda', 'ec2', 'dynamodb'); // conservative
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

**Similar implementations for other analyzers** (see full implementations in code):

- **devops-analyzer.js**: Detect `.github/workflows/`, `.gitlab-ci.yml`, `Jenkinsfile`, `*.tf` (reuse from cloud if needed), `CircleCI`, `bitrise`
- **ml-analyzer.js**: Detect `torch`, `tensorflow`, `sklearn` in deps; `.ipynb` files; `mlflow`, `wandb`, `tensorboard`; `requirements.txt` with `cuda`
- **data-analyzer.js**: Detect database drivers from deps (`pg`, `mysql2`, `mongodb`, `redis`, `sqlite3`), data warehouses (`trino`, `presto`, `snowflake`), ETL (`airflow`, `dagster`), streaming (`kafka`, `pulsar`), schema files (`prisma/schema.prisma`, `knexfile.js`), BI tools (`tableau`, `metabase`)

---

### 3.5 Intent Matching Engine

**Purpose**: Match detected tech (from analyzers + user answers) to catalog skills using **exact token matching** with confidence threshold.

**`lib/intent-matcher.js`**:

```javascript
import fs from 'fs-extra';
import path from 'path';

/**
 * Load catalog from built-in or user location.
 * Falls back to built-in catalog.json in project root or package catalog.
 */
export async function loadCatalog(catalogPath = null) {
  const pathsToTry = [
    catalogPath,
    path.join(process.cwd(), 'catalog.json'),
    path.join(__dirname, '../../catalog.json') // built-in
  ];

  for (const p of pathsToTry) {
    if (p && await fs.pathExists(p)) {
      try {
        return await fs.readJson(p);
      } catch (e) {
        console.warn(`Failed to read catalog at ${p}: ${e.message}`);
      }
    }
  }

  return { skills: [] };
}

/**
 * Tokenize and normalize keywords for exact matching.
 */
function normalizeKeyword(keyword) {
  return keyword.toLowerCase().trim();
}

/**
 * Build keyword set from skill catalog entry.
 */
function buildSkillKeywordSet(skill) {
  const keywords = new Set();

  const add = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(k => keywords.add(normalizeKeyword(k)));
    }
  };

  add(skill.intentKeywords);
  add(skill.provides);
  add(skill.requires);
  add(skill.tags);

  return keywords;
}

/**
 * Build tech set from project analysis and user context.
 */
function buildTechSet(analysis) {
  const tech = new Set();

  const add = (arr) => {
    if (Array.isArray(arr)) {
      arr.forEach(item => tech.add(normalizeKeyword(String(item)));
    }
  };

  // From analyzers
  add(analysis.frameworks);
  add(analysis.mobile?.frameworks);
  add(analysis.cloud?.providers);
  add(analysis.ml?.frameworks);
  add(analysis.data?.databases);
  add(analysis.data?.warehouses);
  add(analysis.devops?.tools);

  // From user context (new domain fields)
  add(analysis.webStack);
  add(analysis.mobileStack);
  add(analysis.cloudStack);
  add(analysis.mlStack);
  add(analysis.dataStack);
  add(analysis.devopsStack);

  // Legacy fields (for backward compat)
  add(analysis.frontend);
  add(analysis.backend);
  add(analysis.datastores);

  return tech;
}

/**
 * Main suggestion function.
 */
export async function suggestSkills(projectAnalysis, options = {}) {
  const catalog = await loadCatalog();
  const suggestions = [];
  const techSet = buildTechSet(projectAnalysis);

  if (techSet.size === 0) {
    return suggestions; // no tech to match
  }

  for (const skill of catalog.skills) {
    const skillKeywords = buildSkillKeywordSet(skill);

    // Exact token matching: count how many skill keywords are in tech set
    const matches = [...skillKeywords].filter(kw => techSet.has(kw));

    if (matches.length === 0) continue;

    // Confidence: fraction of skill keywords matched
    const confidence = matches.length / skillKeywords.size;

    // Minimum threshold: at least 30% of skill keywords must match
    if (confidence < 0.3) continue;

    suggestions.push({
      name: skill.name,
      displayName: skill.displayName || skill.name,
      description: skill.description,
      repoUrl: skill.repoUrl,
      relevance: matches.length,
      matchedKeywords: matches,
      confidence
    });
  }

  // Sort by precision (confidence) descending, then by matches count
  suggestions.sort((a, b) => {
    if (Math.abs(b.confidence - a.confidence) > 0.01) {
      return b.confidence - a.confidence;
    }
    return b.relevance - a.relevance;
  });

  const limit = options.limit || 5;
  return suggestions.slice(0, limit);
}
```

---

### 3.6 Integration Points

#### Update `lib/context.js`

**Add new analyzer imports**:
```javascript
import { analyzeMobile } from './analyzers/mobile-analyzer.js';
import { analyzeCloud } from './analyzers/cloud-analyzer.js';
import { analyzeDevOps } from './analyzers/devops-analyzer.js';
import { analyzeML } from './analyzers/ml-analyzer.js';
import { analyzeData } from './analyzers/data-analyzer.js';
```

**Update `analyzeProjectForIdeation()`**:
```javascript
export async function analyzeProjectForIdeation(projectPath = process.cwd()) {
  // Existing steps...
  const dependencyAnalysis = await analyzeDependencies(projectPath);
  const patternAnalysis = await analyzeCodePatterns(projectPath);
  const structureAnalysis = await analyzeStructure(projectPath);
  const conventionAnalysis = await analyzeConventions(projectPath);

  // NEW: Run expanded analyzers
  const mobile = await analyzeMobile(projectPath);
  const cloud = await analyzeCloud(projectPath);
  const devops = await analyzeDevOps(projectPath);
  const ml = await analyzeML(projectPath);
  const data = await analyzeData(projectPath);

  // Build languages set
  const languages = new Set();
  if (dependencyAnalysis.primaryLanguage) {
    languages.add(dependencyAnalysis.primaryLanguage);
  }

  // Frameworks from dependency analyzer
  const frameworks = [...new Set(dependencyAnalysis.allFrameworks || [])];

  // Tests
  const tests = [];
  if (patternAnalysis.testing?.frameworks) {
    tests.push(...patternAnalysis.testing.frameworks);
  }

  // Directories (unchanged)
  let directories = [];
  try {
    const entries = await fs.readdir(projectPath, { withFileTypes: true });
    directories = entries
      .filter(e => e.isDirectory())
      .map(e => e.name)
      .filter(name => !['node_modules', '.git', 'dist', 'build', '.next', '.nuxt', 'coverage', '.venv', 'venv'].includes(name))
      .slice(0, 10);
  } catch (e) {}

  // Architecture
  const primaryArchitecture = patternAnalysis.architecture?.pattern || 'unknown';

  // Project name
  let projectName = path.basename(projectPath);
  try {
    const pkgPath = path.join(projectPath, 'package.json');
    if (await fs.pathExists(pkgPath)) {
      const pkg = await fs.readJson(pkgPath);
      if (pkg.name) projectName = pkg.name;
    }
  } catch (e) {}

  return {
    // Existing
    languages: Array.from(languages),
    frameworks,
    tests,
    directories,
    repoSize: structureAnalysis.distribution
      ? { files: structureAnalysis.distribution.totalFiles || 0, loc: 0 }
      : { files: 0, loc: 0 },
    primaryArchitecture,
    projectPath,
    projectName,
    ides: await detectIdes(projectPath),

    // NEW: Detailed analysis includes results from new analyzers
    detailed: {
      dependencies: dependencyAnalysis,
      patterns: patternAnalysis,
      structure: structureAnalysis,
      conventions: conventionAnalysis,
      mobile,
      cloud,
      devops,
      ml,
      data
    }
  };
}
```

**Refactor `gatherContext()`** - high-level changes only (full implementation in code):

1. Keep Tier 1 unchanged
2. Keep Tier 2a (frontend/backend/datastores) unchanged for backward compatibility
3. Add Tier 2b: Show 6 domain questions **conditionally**, each with "None" option
4. After Tier 2, ask: "Provide additional tech details?" (Yes/No)
5. If Yes: run follow-ups grouped by domain using `FOLLOW_UP_BY_DOMAIN`
6. Continue to Tiers 3+ unchanged

**Context return shape** (example):
```javascript
{
  projectName: 'myapp',
  description: '...',
  projectType: 'Web app',
  frontend: ['React'],           // legacy
  backend: ['Node/Express'],     // legacy
  datastores: ['Postgres'],      // legacy
  webStack: ['React', 'Next.js'],
  mobileStack: [],
  cloudStack: ['Docker'],
  mlStack: [],
  dataStack: ['PostgreSQL', 'Redis'],
  devopsStack: ['GitHub Actions'],
  iosTargets: ['iPhone', 'iPad'],    // from follow-up
  iosMinVersion: '15.0',
  dockerUseCase: 'Development',
  // ... other follow-up answers
  domainTags: [...],
  riskLevel: 'Medium',
  teamSize: 'Solo',
  gitWorkflow: 'Feature branches',
  testingSetup: 'Unit + integration',
  agentStyle: 'Pair programmer',
  editPermissions: 'Whole repo',
  extras: [...]
}
```

#### Update `lib/commands/ideate.js`

In template generation, after main analysis section:
```javascript
// Build tech summary for template
const techSummary = [];
if (context.webStack?.length) techSummary.push(`Web: ${context.webStack.join(', ')}`);
if (context.mobileStack?.length) techSummary.push(`Mobile: ${context.mobileStack.join(', ')}`);
if (context.cloudStack?.length) techSummary.push(`Cloud: ${context.cloudStack.join(', ')}`);
if (context.mlStack?.length) techSummary.push(`ML/AI: ${context.mlStack.join(', ')}`);
if (context.dataStack?.length) techSummary.push(`Data: ${context.dataStack.join(', ')}`);
if (context.devopsStack?.length) techSummary.push(`DevOps: ${context.devopsStack.join(', ')}`);

if (techSummary.length > 0) {
  template += `## Detected Technologies\n\n`;
  template += techSummary.map(t => `- ${t}`).join('\n') + '\n\n';
}

// Add recommendations section
try {
  const { suggestSkills } = await import('../intent-matcher.js');
  const suggestions = await suggestSkills(analysis);

  if (suggestions.length > 0) {
    template += `## Recommended Skills\n\n`;
    template += `Based on your project's tech stack, consider adding these skills:\n\n`;

    for (const s of suggestions) {
      template += `### ${s.displayName}\n\n`;
      template += `${s.description}\n\n`;
      template += `- **Install**: \`rosetta install ${s.name}\`\n`;
      template += `- **Relevance**: ${Math.round(s.confidence * 100)}%\n`;
      template += `- **Matched**: ${s.matchedKeywords.join(', ')}\n\n`;
    }
  }
} catch (e) {
  // Suggestions optional
}
```

#### Update `lib/cli-helpers.js`

In `scaffoldNew()`, after `.ai/` files created:
```javascript
// Show skill suggestions (unless disabled)
if (!options.noSuggestions && !options.dryRun) {
  try {
    const { suggestSkills } = await import('./intent-matcher.js');

    // Build analysis + context
    const analysis = await analyzeProjectForIdeation(projectPath);
    const contextPath = path.join(projectPath, '.ai/context.json');
    const context = await fs.pathExists(contextPath)
      ? await fs.readJson(contextPath)
      : {};

    const combined = { ...analysis, ...context };
    const suggestions = await suggestSkills(combined);

    if (suggestions.length > 0) {
      console.log(chalk.cyan('\n💡 Skill Suggestions:'));
      console.log(chalk.gray('Based on your project, consider installing:'));
      for (const s of suggestions) {
        console.log(chalk.green(`  ${s.name}`));
        console.log(chalk.gray(`    ${s.description}`));
        console.log(chalk.yellow(`    Install: rosetta install ${s.repoUrl || s.name}`));
        console.log('');
      }
    }
  } catch (err) {
    if (options.verbose) {
      console.log(chalk.yellow('Note: Could not generate skill suggestions'));
    }
  }
}
```

**No auto-install**: Suggestions are purely informational; user runs `rosetta install` manually.

#### Update `cli.js`

```javascript
scaffoldCommand
  .option('--no-suggestions', 'Disable skill suggestions after scaffold')
  .action(async (projectPath, options) => {
    await scaffoldNew(projectPath, options);
  });
```

---

### 3.7 Catalog Enrichment (Prerequisite)

**PHASE 0 TASK**: Enrich `catalog.json` with intent keywords for all new tech domains.

**Minimum coverage** (each skill must have `intentKeywords` array):
- Mobile: `react-native`, `ios`, `swift`, `android`, `kotlin`, `flutter`
- Cloud: `docker`, `kubernetes`, `k8s`, `aws`, `gcp`, `azure`, `terraform`, `serverless`
- ML: `pytorch`, `tensorflow`, `mlflow`, `wandb`, `cuda`, `machine-learning`, `deep-learning`
- Data: `postgresql`, `mysql`, `mongodb`, `redis`, `kafka`, `trino`, `airflow`, `etl`
- DevOps: `github-actions`, `gitlab-ci`, `jenkins`, `terraform`, `cicd`

**Process**: Manually edit `catalog.json` to add `intentKeywords` to existing skills and create new entries for missing domains.

**Verification**: `node cli.js suggest-skills --tech react,docker,postgresql --json` should return relevant skills.

---

## 4. Implementation Phases

### Phase 0: Catalog Enrichment (1 day)
- [ ] Review `catalog.json` - identify skills lacking `intentKeywords`
- [ ] Add comprehensive `intentKeywords` for all 5 domains (mobile, cloud, devops, ml, data)
- [ ] Add new catalog entries if gaps exist (e.g., no Flutter skill, no Kubernetes skill)
- [ ] Validate catalog with `rosetta catalog`
- [ ] Test: `rosetta suggest-skills --tech docker,postgresql` returns expected results

**Deliverable**: Enriched `catalog.json` covering all new tech domains.

---

### Phase 1: Analyzers (3 days)

**Tasks**:
1. Create `lib/analyzers/utils.js` with `recursiveGlob()`
2. Implement `lib/analyzers/mobile-analyzer.js` with unit tests
3. Implement `lib/analyzers/cloud-analyzer.js` with unit tests
4. Implement `lib/analyzers/devops-analyzer.js` with unit tests
5. Implement `lib/analyzers/ml-analyzer.js` with unit tests
6. Implement `lib/analyzers/data-analyzer.js` with unit tests
7. Update `lib/analyzers/index.js` to export new analyzers
8. Update `analyzeProjectForIdeation()` in `lib/context.js` to call new analyzers and include results
9. Create test fixtures in `test/fixtures/` for each analyzer
10. Write unit tests for each analyzer

**Success Criteria**:
- Each analyzer unit test covers main detection patterns
- `rosetta ideate --dry-run --json` includes new tech fields in output
- Analyzers run in parallel (Promise.all) for performance
- No breaking changes to existing analyzers

---

### Phase 2: Context Enhancement (2 days)

**Tasks**:
1. Define `FOLLOW_UP_BY_DOMAIN` mapping in `lib/context.js`
2. Refactor `gatherContext()`:
   - Add Tier 2b domain questions (web, mobile, cloud, ml, data, devops)
   - Implement conditional display logic (based on project type)
   - Add "None" option to each domain
   - Implement hybrid auto-detection: show summary → "Use detected values? Y/n" → if No, full context with defaults
   - Add follow-up trigger after Tier 2
3. Create unit tests for `gatherContext()` (mock inquirer for interactions)
4. Create integration tests for `scaffold` command with new questions
5. Update `lib/cli-helpers.js` to pass context (no changes needed if context returns new fields)

**Success Criteria**:
- Scaffold shows all domain questions correctly based on project type
- Auto-detection summary displays per-domain detected values
- Follow-ups appear grouped by domain when user opts in
- Empty selections (None only) produce empty arrays
- Backward compatibility: `frontend`/`backend`/`datastores` still populated

---

### Phase 3: Intent Matching (2 days)

**Tasks**:
1. Implement `lib/intent-matcher.js` with exact token matching + confidence threshold (≥0.3)
2. Write unit tests:
   - Token matching precision
   - Confidence threshold filtering
   - Empty tech set handling
   - Case insensitivity
   - False positive prevention
3. Integrate with `scaffoldNew()` in `lib/cli-helpers.js`
4. Integrate with `lib/commands/ideate.js` template generation
5. Add `--no-suggestions` flag to scaffold
6. Create integration tests for suggestions
7. Test with real catalog data and various tech combos

**Success Criteria**:
- Suggestions are relevant for tested tech stacks (React+Node+Postgres → node-express-postgres skill)
- No obvious false positives
- Suggestions show correct install command
- Disable flag works

---

### Phase 4: Polish & Integration (2 days)

**Tasks**:
1. End-to-end testing:
   - Mobile project (React Native) → suggestions
   - Cloud project (Docker + AWS) → suggestions
   - ML project (PyTorch + airflow) → suggestions
2. Performance optimization:
   - Run analyzers in parallel with `Promise.all()`
   - Cache catalog load in `intent-matcher.js` (module-level cache)
3. Error handling:
   - Analyzer failures fallback gracefully
   - Missing catalog falls back to empty array
   - Context file errors handled
4. Bug fixes from testing

**Success Criteria**:
- Scaffold with all analyzers completes in <30 seconds
- All E2E tests pass
- No console errors in normal usage

---

### Phase 5: Documentation (1 day)

**Tasks**:
1. Create `docs/TECH_STACKS.md` - comprehensive list of all detected technologies with examples
2. Update `README.md` - new scaffold questions, skill suggestions feature
3. Update `docs/API.md` - scaffold command options, new context fields
4. Create `docs/INTENT_MATCHING.md` - how intent matcher works, how to add intentKeywords to custom skills
5. Update `docs/ROADMAP_V0.4.0.md` with implementation completion

**Success Criteria**:
- All docs updated and accurate
- Examples match actual implementation
- Cross-references to related features

---

## 5. Testing Strategy

### Unit Tests

**Analyzers** (`test/analyzers/*.test.js`):
- Each analyzer: 8-12 test cases covering file detection, dependency parsing, edge cases
- Mock file system with `jest.mock('fs-extra')` or use `memfs`
- Examples:
  ```javascript
  test('mobile-analyzer detects React Native from package.json', async () => {})
  test('mobile-analyzer detects iOS from .xcodeproj', async () => {})
  test('cloud-analyzer detects Dockerfile', async () => {})
  test('devops-analyzer detects GitHub Actions workflows', async () => {})
  ```

**Context** (`test/context/unit.test.js`):
- `test/analyzers/utils.test.js`: `recursiveGlob` pattern matching
- `test/context/gather-context.test.js`: Mock inquirer to test question flow
- `test/context/analyze-project-for-ideation.test.js`: Verify new fields present

**Intent Matcher** (`test/intent-matcher.test.js`):
- Token normalization
- Matching logic precision/recall
- Confidence threshold filtering
- Catalog loading fallback
- Empty/error cases

### Integration Tests

**`test/integration/scaffold.expanded.test.js`**:
- Run scaffold with `--dry-run --json` to capture context questions
- Verify all domain questions appear
- Provide answers and verify context.json contains expected fields
- Test follow-up flow

**`test/integration/scaffold.suggestions.test.js``:
- Run scaffold with fixture project
- Capture console output
- Verify suggestions appear with correct format
- Test `--no-suggestions` flag

**`test/integration/ideate.suggestions.test.js`**:
- Run ideate on fixture project
- Parse generated template
- Verify "Recommended Skills" section exists and is formatted correctly

### E2E Tests

Create realistic fixture projects:
- `test/fixtures/e2e/react-native-project/` with iOS + Android + Expo
- `test/fixtures/e2e/cloud-native-project/` with Docker + AWS + GitHub Actions
- `test/fixtures/e2e/ml-project/` with PyTorch + MLflow + airflow

E2E test:
1. `rosetta ideate --area fixture --output template.md --dry-run`
2. Parse template.md → verify recommendations present
3. Run `rosetta scaffold fixture-project --dry-run --json`
4. Parse output → verify suggestions in console

### Coverage Target

- All new analyzers: >90%
- `intent-matcher.js`: >85%
- `context.js` changes: >80%
- Overall new code: >80%

---

## 6. Success Criteria

1. **Detection Accuracy**: >90% of common frameworks detected in sample projects (React Native, Flutter, Docker, K8s, PyTorch, PostgreSQL, GitHub Actions)
2. **Relevance**: Top 3 skill suggestions have >70% confidence score for well-known tech stacks (MERN, T3 stack, mobile-first, data pipeline)
3. **Performance**: Scaffold with all analyzers completes in <30 seconds (average laptop)
4. **Testing**: >80% code coverage, all tests passing
5. **Backward Compat**: Existing skills using `frontend`/`backend`/`datastores` continue to work unchanged
6. **UX**: New domain questions clear; "None" option available; follow-ups not overwhelming

---

## 7. Risks & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Analyzers false positives | Medium | Medium | Conservative patterns, manual testing, fallback to empty |
| Too many questions overwhelm users | High | High | Group follow-ups, global skip option, good defaults |
| Catalog not enriched → useless suggestions | Critical | Complete | **Phase 0**: enforce enrichment before Phase 3 |
| Context shape breaks existing skills | High | High | Preserve `frontend`/`backend`/`datastores`; comprehensive backward-compat tests |
| Intent matcher irrelevant matches | Medium | Medium | Exact token matching, ≥0.3 threshold, manual catalog validation |
| Slow performance (analyzers running sequentially) | Medium | Medium | Use `Promise.all()` for analyzers in `analyzeProjectForIdeation()` |
| Follow-up questions too long | Medium | High | Batch by domain, global skip, max 2-3 per technology |
| No catalog in CWD → empty suggestions | Low | Low | Fallback to built-in catalog (package data) |

---

## 8. Dependencies

- **Existing**: `fs-extra`, `path`, `chalk`, `inquirer` - all in package.json
- **No new external dependencies**: `recursiveGlob` implemented inline
- **Catalog**: Must be enriched before Phase 3

---

## 9. Implementation Order (Revised)

- **Phase 0**: Catalog enrichment (can be done in parallel with planning)
- **Phase 1**: Analyzers + tests + integration into `analyzeProjectForIdeation()`
- **Phase 2**: Context enhancement (Tier 2b, follow-ups, auto-detection)
- **Phase 3**: Intent matcher + integration (scaffold + ideate)
- **Phase 4**: Integration polish, performance, error handling, E2E tests
- **Phase 5**: Documentation finalization

Each phase should be **code-reviewed** and **tests passing** before moving to next.

---

## 10. Open Questions

1. **Should analyzers run on every scaffold, or cache results?** → Run on every (simple, fast enough), cache in future if needed
2. **What if user selects both iOS and Android?** → Allowed (hybrid apps), follow-ups for both
3. **How to handle conflicting detections (e.g., analyzer says React Native but user says Flutter)?** → User override wins; analyzer results only used for auto-detection defaults
4. **Should suggestions include skills from catalog only, or also allow arbitrary install?** → Catalog only for now; arbitrary install via `rosetta install <url>` exists
5. **What if `catalog.json` is missing or malformed?** → Fallback to built-in catalog in package; error log; suggestions disabled

---

**Last Updated**: 2025-03-17 (Revised after spec review)
**Author**: Rosetta Team
**Implementation Ready**: Yes
