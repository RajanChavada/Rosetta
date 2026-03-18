# Rosetta v0.4.0 Roadmap - Enhanced Developer Experience

**Version**: 0.4.0
**Date**: 2026-03-16
**Status**: Planning

---

## Executive Summary

Rosetta v0.4.0 focuses on expanding the developer experience with HTML documentation visualization, comprehensive tech stack support, OpenClaw integration, intelligent migration system, and proactive skill suggestions. This release transforms Rosetta from a basic scaffolding tool into a comprehensive AI agent configuration platform.

**Key Features**:
- HTML-based skill visualization tool (FastAPI-style documentation)
- Expanded tech stack detection (mobile, cloud, ML, data engineering)
- OpenClaw CLI integration
- Comprehensive migration system for existing configurations
- Smart skill suggestions based on detected tech stack

---

## 1. HTML Documentation Visualization Tool

### Purpose
Provide a simple, FastAPI-style documentation interface for installed skills that opens in the browser, making it easy for developers to discover and understand available skills.

### User Experience
```bash
$ rosetta docs
Generating skill documentation...
✓ Found 8 installed skills (Claude Code)
✓ Documentation generated: .rosetta/docs/skills.html
Opening in browser...
```

### Architecture

**New Command Structure**:
```
lib/
├── commands/
│   └── visualize.js          # Main command handler
└── visualizers/
    ├── skill-card.js         # Skill card component logic
    ├── index.js              # Main visualization logic
    ├── template.html         # HTML template (FastAPI-style)
    └── styles.css            # Embedded styles
```

**Command Specification**:
```bash
rosetta docs [options]
  --output, -o <path>    Output file path (default: .rosetta/docs/skills.html)
  --ide <name>           Filter by specific IDE (auto-detected if omitted)
  --open                 Open in browser after generation
  --quiet                Suppress output
```

### Features

1. **Card-Based Layout**
   - Clean, responsive grid of skill cards
   - Each card shows: name, description, provides, requires
   - Links to source repository

2. **IDE Context Awareness**
   - Auto-detect current IDE from `.ai/master-skill.md` or environment
   - Filter skills relevant to detected IDE
   - Show skill availability across all configured IDEs

3. **Search and Filter**
   - Simple text search across skill names and descriptions
   - Filter by domain (backend, frontend, testing, etc.)
   - Filter by installation status

4. **FastAPI-Style Design**
   - Sidebar navigation
   - Clean typography
   - Code examples with syntax highlighting
   - Responsive for mobile viewing

### Data Sources
- `~/.rosetta/skills-manifest.json` - Installed skills
- `catalog.json` - Available catalog skills
- `.ai/master-skill.md` - Current IDE context
- Skill `SKILL.md` files - Detailed metadata

### Verification
```bash
# Generate and view
rosetta docs --output test-docs.html --open
# Verify HTML structure
rosetta docs --dry-run --json  # Output data as JSON
# Run tests
npm test -- test/visualize
```

---

## 2. Tech Stack Expansion

### Purpose
Enhance project detection to support modern development stacks including mobile, cloud infrastructure, ML/AI, and data engineering.

### Current Gaps
- No mobile framework detection (React Native, Flutter, iOS/Android)
- No cloud service detection (AWS, GCP, Azure)
- No container orchestration (Docker, Kubernetes)
- No CI/CD detection (GitHub Actions, GitLab CI)
- No ML framework detection (PyTorch, TensorFlow)
- No data engineering tools (Trino, Tableau, databases)
- No "None" option for context gathering

### New Analyzers

**File Structure**:
```
lib/analyzers/
├── mobile-analyzer.js      # React Native, Flutter, iOS, Android
├── cloud-analyzer.js       # AWS, GCP, Azure, Docker, K8s
├── devops-analyzer.js      # GitHub Actions, GitLab CI, CircleCI
├── ml-analyzer.js          # PyTorch, TensorFlow, NVIDIA, scikit-learn
├── data-analyzer.js        # Trino, SQL, databases, Tableau
└── index.js                # Updated exports
```

### Mobile Analyzer (`mobile-analyzer.js`)

**Detection Patterns**:
- `package.json`: `react-native`, `expo`, `@react-native-*`
- `pubspec.yaml`: `flutter` framework
- iOS: `.xcodeproj`, `Podfile`, Swift/Objective-C files
- Android: `build.gradle`, `settings.gradle`, `AndroidManifest.xml`
- Cross-platform: Capacitor, Cordova, Ionic

**Output**:
```javascript
{
  frameworks: ['react-native'],
  platforms: ['ios', 'android'],
  buildTools: ['expo', 'xcode'],
  configFiles: ['app.json', 'metro.config.js']
}
```

### Cloud Analyzer (`cloud-analyzer.js`)

**Detection Patterns**:
- AWS: `aws-sdk`, `@aws-sdk/*`, `.aws/config`, `serverless.yml`
- GCP: `@google-cloud/*`, `firebase`, `.gcloud/`
- Azure: `@azure/*`, `azure-functions-core-tools`
- Docker: `Dockerfile`, `docker-compose.yml`, `.dockerignore`
- Kubernetes: `k8s/`, `helm/`, `*.yaml` with k8s resources
- Terraform: `*.tf`, `.terraform/`
- Serverless: `serverless.yml`, `serverless.yaml`, `sls`

**Output**:
```javascript
{
  providers: ['aws', 'docker'],
  services: ['s3', 'lambda', 'ecs'],
  configFiles: ['Dockerfile', 'docker-compose.yml', 'serverless.yml'],
  orchestration: ['kubernetes']
}
```

### ML Analyzer (`ml-analyzer.js`)

**Detection Patterns**:
- PyTorch: `torch`, `torchvision`, `torchaudio`
- TensorFlow: `tensorflow`, `keras`, `tf-*`
- NVIDIA: `cuda`, `cudnn`, `nvidia-*`, `pip install nvidia-*`
- scikit-learn: `sklearn`, `scikit-learn`
- MLOps: `mlflow`, `wandb`, `tensorboard`
- Jupyter: `.ipynb` files, `jupyter`, `ipython`

**Output**:
```javascript
{
  frameworks: ['pytorch', 'tensorflow'],
  gpu: true,
  mlops: ['mlflow'],
  notebooks: true,
  configFiles: ['requirements.txt', 'environment.yml']
}
```

### Data Analyzer (`data-analyzer.js`)

**Detection Patterns**:
- Databases: `pg`, `mysql2`, `mongodb`, `redis`, `sqlite3`
- Data Warehouse: `trino`, `presto`, `snowflake-connector`
- SQL: `.sql` files, `knex`, `sequelize`, `typeorm`, `prisma`
- Visualization: `tableau`, `plotly`, `matplotlib`, `seaborn`
- ETL: `airflow`, `dagster`, `prefect`
- Streaming: `kafka`, `pulsar`, `rabbitmq`

**Output**:
```javascript
{
  databases: ['postgresql', 'redis'],
  warehouses: ['trino'],
  etl: ['airflow'],
  visualization: ['plotly'],
  configFiles: ['prisma/schema.prisma', 'knexfile.js']
}
```

### Enhanced Context Gathering

**Updates to `lib/context.js`**:

1. **Add "None" Options**:
   ```javascript
   {
     frontend: ['React', 'Vue', 'Svelte', 'None'],
     backend: ['Node/Express', 'FastAPI', 'Django', 'None'],
     datastores: ['PostgreSQL', 'MongoDB', 'Redis', 'None']
   }
   ```

2. **Hybrid Stack Support**:
   - Detect projects with both mobile and web components
   - Support microservice architectures
   - Handle monorepos with mixed tech stacks

3. **Version Detection**:
   - Parse `package.json` for exact versions
   - Detect framework versions from lock files
   - Identify breaking changes (e.g., Next.js 13+ App Router vs Pages Router)

### Integration Points

**Update `analyzeProjectForIdeation()`**:
```javascript
async function analyzeProjectForIdeation(projectPath) {
  // Existing analyzers
  const deps = await analyzeDependencies(projectPath);
  const patterns = await analyzeCodePatterns(projectPath);
  const structure = await analyzeStructure(projectPath);
  const conventions = await analyzeConventions(projectPath);

  // New analyzers
  const mobile = await analyzeMobile(projectPath);
  const cloud = await analyzeCloud(projectPath);
  const devops = await analyzeDevOps(projectPath);
  const ml = await analyzeML(projectPath);
  const data = await analyzeData(projectPath);

  return {
    // Existing
    languages: deps.languages,
    frameworks: deps.frameworks,
    tests: patterns.testing.frameworks,

    // New
    mobile: mobile.frameworks,
    cloud: cloud.providers,
    devops: devops.tools,
    ml: ml.frameworks,
    data: data.databases,
    dataWarehouses: data.warehouses,

    // Combined
    allTechnologies: [
      ...deps.frameworks,
      ...mobile.frameworks,
      ...cloud.providers,
      ...ml.frameworks
    ]
  };
}
```

### Verification
```bash
# Test with React Native project
rosetta ideate --area /path/to/rn-project --dry-run --json
# Test with ML project
rosetta ideate --area /path/to/ml-project --dry-run --json
# Test with data engineering project
rosetta ideate --area /path/to/data-project --dry-run --json
# Run analyzer tests
npm test -- test/analyzers
```

---

## 3. OpenClaw Integration

### Purpose
Add support for OpenClaw CLI-based AI tool following Rosetta's existing IDE integration patterns.

### Integration Approach
Follow the established pattern used for Codex CLI, Kilo Code, and Continue.dev.

### Configuration

**Add to `lib/constants.js` TARGETS array**:
```javascript
{
  label: 'OpenClaw',
  path: '.openclaw/rules.md',
  template: 'openclaw.md',
  skillsDir: '.openclaw/skills'
}
```

**Create `templates/openclaw.md`**:
```markdown
# {{PROJECT_NAME}} - OpenClaw Configuration

## Project Overview
{{PROJECT_OVERVIEW}}

## Tech Stack
- **Languages**: {{LANGUAGES}}
- **Frontend**: {{FRONTEND_STACK}}
- **Backend**: {{BACKEND_STACK}}
- **Datastores**: {{DATASTORES}}

## AI Agent Instructions

### Reasoning Procedures
1. Analyze the codebase structure before making changes
2. Follow existing patterns and conventions
3. Write tests for new functionality
4. Document significant decisions

### Standard Operating Procedures
- Use async/await for all async operations
- Follow error handling patterns from existing code
- Run tests before committing changes
- Update documentation when changing behavior

## Commands Reference
{{COMMANDS_REFERENCE}}

## Universal Memory
{{UNIVERSAL_MEMORY}}
```

### Translation Support

**Add to `lib/translators/base.js`**:
```javascript
const FORMAT_MAP = {
  // Existing
  'claude': 'claude',
  'cursor': 'cursor',
  'codex': 'codex',
  // New
  'openclaw': 'openclaw'
};
```

### Detection Support

**Update `findExistingAgentFiles()` in `lib/context.js`**:
```javascript
async function findExistingAgentFiles(customSource) {
  const existingFiles = [];

  // Existing detection
  if (await fs.pathExists('.claude/')) existingFiles.push('Claude Code');
  if (await fs.pathExists('.cursorrules')) existingFiles.push('Cursor');
  // ... other existing checks

  // OpenClaw detection
  if (await fs.pathExists('.openclaw/')) existingFiles.push('OpenClaw');
  if (await fs.pathExists('.openclaw/rules.md')) existingFiles.push('OpenClaw');

  return existingFiles;
}
```

### Commands

After integration, these commands work automatically:
- `rosetta add-ide openclaw` - Add OpenClaw to existing project
- `rosetta translate --to openclaw` - Convert to OpenClaw format
- `rosetta translate-all --to openclaw` - Bulk migrate to OpenClaw
- `rosetta sync` - Sync OpenClaw configuration

### Verification
```bash
# Test detection
rosetta ideate --dry-run --json  # Should detect OpenClaw if .openclaw/ exists
# Test add-ide
rosetta add-ide openclaw --dry-run
# Test translation
rosetta translate .cursorrules --to openclaw --dry-run
# Run tests
npm test -- test/commands/add-ide
npm test -- test/translators
```

---

## 4. Comprehensive Migration System

### Purpose
Handle users with existing agentic files in custom folders, provide intelligent conflict resolution, and support migration from other AI agent tools.

### Current Limitations
- Only detects hardcoded folder names
- No pattern-based detection for custom folders
- Limited conflict resolution (backup/overwrite only)
- No migration wizard for users from other tools

### Architecture

**New Modules**:
```
lib/
├── migration-enhanced.js      # Enhanced migration logic
├── detectors/
│   ├── custom-paths.js        # Detect custom folder patterns
│   ├── agent-patterns.js      # Detect AI agent tool patterns
│   └── conflict-resolver.js   # Intelligent conflict resolution
└── migration-wizard.js        # Interactive migration guide
```

### Custom Path Detection (`lib/detectors/custom-paths.js`)

**Pattern Matching**:
```javascript
const CUSTOM_PATTERNS = [
  // Common custom folder names
  { pattern: /\.agentic[-_]?code/i, type: 'custom-agent' },
  { pattern: /\.?agent[-_]?config/i, type: 'custom-agent' },
  { pattern: /\.?ai[-_]?rules/i, type: 'custom-agent' },
  { pattern: /\.?copilot[-_]?rules/i, type: 'copilot' },
  { pattern: /\.?cursor[-_]?config/i, type: 'cursor' },

  // Generic patterns
  { pattern: /skills/i, type: 'skills-folder' },
  { pattern: /rules/i, type: 'rules-folder' },
  { pattern: /instructions/i, type: 'instructions-folder' }
];

async function detectCustomPaths(projectPath) {
  const detected = [];
  const entries = await fs.readdir(projectPath);

  for (const entry of entries) {
    for (const { pattern, type } of CUSTOM_PATTERNS) {
      if (pattern.test(entry)) {
        const fullPath = path.join(projectPath, entry);
        const stat = await fs.stat(fullPath);

        if (stat.isDirectory()) {
          detected.push({
            path: fullPath,
            name: entry,
            type,
            contents: await analyzeDirectory(fullPath)
          });
        }
      }
    }
  }

  return detected;
}
```

### Agent Pattern Detection (`lib/detectors/agent-patterns.js`)

**Detect configurations from other AI tools**:
```javascript
const AGENT_PATTERNS = {
  // GitHub Copilot
  'copilot': {
    markers: ['.github/copilot-instructions.md', '.copilotignore'],
    configFiles: ['.github/copilot-instructions.md']
  },

  // Cursor
  'cursor': {
    markers: ['.cursorrules', '.cursorignore'],
    configFiles: ['.cursorrules']
  },

  // Claude Code
  'claude': {
    markers: ['CLAUDE.md', '.claude/'],
    configFiles: ['CLAUDE.md']
  },

  // Windsurf
  'windsurf': {
    markers: ['.windsurf/'],
    configFiles: ['.windsurf/rules/rosetta-rules.md']
  },

  // Generic AI tools
  'generic-ai': {
    markers: ['.ai/', 'AGENTS.md', 'AGENTS.yaml'],
    configFiles: ['.ai/master-skill.md', 'AGENTS.md']
  }
};

async function detectAgentTools(projectPath) {
  const detected = [];

  for (const [tool, config] of Object.entries(AGENT_PATTERNS)) {
    for (const marker of config.markers) {
      const fullPath = path.join(projectPath, marker);
      if (await fs.pathExists(fullPath)) {
        detected.push({
          tool,
          configPath: fullPath,
          type: config.configFiles.includes(marker) ? 'config' : 'marker'
        });
        break; // Only detect once per tool
      }
    }
  }

  return detected;
}
```

### Intelligent Conflict Resolution (`lib/detectors/conflict-resolver.js`)

**Conflict Types**:
1. **File conflicts**: Same file exists in multiple locations
2. **Content conflicts**: Different content for same purpose
3. **Structure conflicts**: Different folder structures
4. **Tool conflicts**: Multiple AI tools configured

**Resolution Strategies**:
```javascript
const RESOLUTION_STRATEGIES = {
  // Backup and merge
  'merge-backup': async (existing, newContent) => {
    await backup(existing);
    return mergeContent(existing, newContent);
  },

  // Keep existing, skip new
  'keep-existing': async (existing) => {
    return { action: 'skip', reason: 'keeping existing' };
  },

  // Overwrite with backup
  'overwrite-backup': async (existing, newContent) => {
    await backup(existing);
    return { action: 'write', content: newContent };
  },

  // Interactive prompt
  'interactive': async (existing, newContent) => {
    return promptUser(existing, newContent);
  }
};

async function resolveConflict(existingPath, newContent, strategy = 'interactive') {
  const resolver = RESOLUTION_STRATEGIES[strategy];
  if (!resolver) {
    throw new Error(`Unknown resolution strategy: ${strategy}`);
  }

  return resolver(existingPath, newContent);
}
```

### Migration Wizard (`lib/migration-wizard.js`)

**Interactive Flow**:
```
$ rosetta migrate

Scanning for existing configurations...
✓ Found: .cursorrules (Cursor)
✓ Found: .agentic-code/ (Custom folder)
✓ Found: .github/copilot-instructions.md (GitHub Copilot)

Detected multiple configurations. How would you like to proceed?

1. Merge all into .ai/master-skill.md (recommended)
2. Keep existing files, add Rosetta structure alongside
3. Choose specific files to migrate
4. Cancel migration

? Select option: 1

Merging configurations...
✓ .cursorrules content added to master-skill.md
✓ .agentic-code/rules.md content added to master-skill.md
✓ .github/copilot-instructions.md content added to master-skill.md

Creating backup...
✓ Backed up to .rosetta/migration-backup-2026-03-16/

Generating IDE wrappers...
✓ Claude Code wrapper created
✓ Cursor wrapper created
✓ GitHub Copilot wrapper created

Migration complete! Run `rosetta health` to verify.
```

### Migration Command Specification

```bash
rosetta migrate [options]
  --source <path>       Custom source folder/file to migrate from
  --strategy <strategy>  Conflict resolution strategy (merge|keep|overwrite|interactive)
  --dry-run             Preview changes without writing
  --backup              Create backup before migration (default: true)
  --no-backup           Skip backup creation
  --verbose             Show detailed migration logs
```

### Verification
```bash
# Test custom path detection
rosetta migrate --dry-run --verbose
# Test with custom source
rosetta migrate --source ./agentic-code --dry-run
# Test conflict resolution
rosetta migrate --strategy interactive
# Run tests
npm test -- test/migration
npm test -- test/detectors
```

---

## 5. Smart Skill Suggestions

### Purpose
Proactively suggest relevant skills based on detected tech stack during scaffold and ideate commands.

### Architecture

**New Module**:
```
lib/
└── intent-matcher.js          # Skill suggestion engine
```

### Intent Matching Engine (`lib/intent-matcher.js`)

**Core Logic**:
```javascript
const INTENT_MAP = {
  // Frontend
  'react-component-generator': ['react', 'jsx', 'tsx', 'next.js'],
  'vue-component-generator': ['vue', 'nuxt', 'vuex'],
  'svelte-component-generator': ['svelte', 'sveltekit'],

  // Backend
  'api-auth': ['express', 'fastapi', 'django', 'authentication'],
  'api-docs': ['swagger', 'openapi', 'api-documentation'],
  'database-migration': ['prisma', 'sequelize', 'typeorm', 'database'],

  // DevOps
  'docker-deploy': ['docker', 'dockerfile', 'docker-compose'],
  'k8s-deploy': ['kubernetes', 'kubectl', 'helm'],
  'cicd-pipeline': ['github-actions', 'gitlab-ci', 'circleci'],

  // ML/AI
  'ml-pipeline': ['pytorch', 'tensorflow', 'machine-learning'],
  'data-pipeline': ['airflow', 'dagster', 'data-engineering'],

  // Testing
  'test-pyramid': ['jest', 'pytest', 'testing'],
  'e2e-testing': ['cypress', 'playwright', 'selenium']
};

async function suggestSkills(projectAnalysis) {
  const suggestions = [];

  // Match against detected technologies
  const allTech = [
    ...projectAnalysis.frameworks,
    ...projectAnalysis.mobile,
    ...projectAnalysis.cloud,
    ...projectAnalysis.ml,
    ...projectAnalysis.data
  ].map(t => t.toLowerCase());

  // Match against catalog
  const catalog = await loadCatalog();

  for (const skill of catalog.skills) {
    const keywords = [
      ...skill.intentKeywords,
      ...skill.provides,
      ...skill.requires
    ].map(k => k.toLowerCase());

    const matches = keywords.filter(k => allTech.some(t => t.includes(k)));

    if (matches.length > 0) {
      suggestions.push({
        skill: skill.name,
        description: skill.description,
        relevance: matches.length,
        matchedKeywords: matches,
        confidence: matches.length / keywords.length
      });
    }
  }

  // Sort by relevance and confidence
  return suggestions.sort((a, b) => {
    if (b.relevance !== a.relevance) return b.relevance - a.relevance;
    return b.confidence - a.confidence;
  });
}
```

### Integration with Scaffold

**Update `lib/cli-helpers.js` scaffoldNew()**:
```javascript
async function scaffoldNew(projectPath, options) {
  // ... existing scaffold logic ...

  // After scaffold, suggest skills
  if (!options.noSuggestions) {
    const analysis = await analyzeProjectForIdeation(projectPath);
    const suggestions = await suggestSkills(analysis);

    if (suggestions.length > 0) {
      console.log(chalk.cyan('\nSkill Suggestions:'));
      for (const suggestion of suggestions.slice(0, 3)) {
        console.log(`  ${chalk.green(suggestion.skill)} - ${suggestion.description}`);
        console.log(`    Matched: ${suggestion.matchedKeywords.join(', ')}`);
      }

      if (options.interactive) {
        const install = await prompt.confirm('Install suggested skills?');
        if (install) {
          for (const suggestion of suggestions.slice(0, 3)) {
            await installSkill(suggestion.skill);
          }
        }
      }
    }
  }
}
```

### Integration with Ideate

**Update `lib/commands/ideate.js`**:
```javascript
async function ideateCommand(projectPath, options) {
  // ... existing ideation logic ...

  // Add suggestions to ideation template
  const suggestions = await suggestSkills(analysis);

  if (suggestions.length > 0) {
    template += '\n## Recommended Skills\n\n';
    template += 'Based on your project analysis, consider these skills:\n\n';

    for (const suggestion of suggestions.slice(0, 5)) {
      template += `- **${suggestion.skill}**: ${suggestion.description}\n`;
      template += `  - Relevance: ${Math.round(suggestion.confidence * 100)}%\n`;
      template += `  - Matched: ${suggestion.matchedKeywords.join(', ')}\n\n`;
    }
  }
}
```

### Command Specification

```bash
# Disable suggestions
rosetta scaffold --no-suggestions

# View suggestions only
rosetta suggest-skills [project-path]

# Suggest for specific tech
rosetta suggest-skills --tech react,docker,postgresql
```

### Verification
```bash
# Test with React project
rosetta suggest-skills ./test/fixtures/react-spa --json
# Test with ML project
rosetta suggest-skills ./test/fixtures/ml-project --json
# Test integration
rosetta scaffold --dry-run --json
# Run tests
npm test -- test/intent-matcher
```

---

## Implementation Order

### Phase 1: Tech Stack Expansion (Week 1)
1. Create new analyzer modules (mobile, cloud, devops, ml, data)
2. Update `analyzeProjectForIdeation()` to use new analyzers
3. Add "None" options to context gathering
4. Write unit tests for all new analyzers
5. Update documentation

### Phase 2: OpenClaw Integration (Week 2)
1. Add OpenClaw to `lib/constants.js` TARGETS
2. Create `templates/openclaw.md`
3. Update `findExistingAgentFiles()` for detection
4. Add to translation system
5. Test with mock OpenClaw project
6. Update documentation

### Phase 3: Migration System (Week 3)
1. Create custom path detection module
2. Create agent pattern detection module
3. Create conflict resolver module
4. Implement migration wizard
5. Update `rosetta migrate` command
6. Write integration tests
7. Update documentation

### Phase 4: Smart Suggestions (Week 4)
1. Create intent matcher module
2. Integrate with scaffold command
3. Integrate with ideate command
4. Create `rosetta suggest-skills` command
5. Write unit tests
6. Update documentation

### Phase 5: HTML Documentation (Week 5)
1. Create visualization command
2. Create HTML template (FastAPI-style)
3. Implement skill card components
4. Add search and filter functionality
5. Write E2E tests
6. Update documentation

---

## Testing Strategy

### Unit Tests
- Each new analyzer (mobile, cloud, devops, ml, data)
- Intent matcher with various project configurations
- Custom path detection patterns
- Conflict resolver strategies

### Integration Tests
- Migration workflow with multiple configurations
- Scaffold with smart suggestions
- Ideate with skill recommendations
- OpenClaw detection and sync

### E2E Tests
- Complete migration flow: detect → resolve → generate
- Full scaffold with suggestions: analyze → suggest → install
- HTML docs generation: analyze → generate → open

### Test Coverage Target
- Maintain >80% coverage for new code
- 100% coverage for critical paths (migration, conflict resolution)

---

## Success Criteria

1. **Tech Stack Detection**: 90%+ accuracy for mobile, cloud, ML, and data projects
2. **OpenClaw Integration**: Seamless detection and configuration like existing IDEs
3. **Migration System**: Successfully migrates 95%+ of common custom configurations
4. **Smart Suggestions**: Relevant skills suggested for 80%+ of analyzed projects
5. **HTML Documentation**: FastAPI-style docs generated in <2 seconds
6. **User Experience**: No breaking changes to existing workflows

---

## Risk Assessment

| Component | Risk | Impact | Mitigation |
|-----------|-------|---------|-------------|
| New Analyzers | Medium | High | Incremental rollout, feature flags |
| OpenClaw Config | Low | Medium | Follow existing patterns exactly |
| Migration System | High | High | Extensive testing, backup by default |
| Intent Matching | Medium | Medium | Start with conservative suggestions |
| HTML Generator | Low | Low | Static generation, no external dependencies |

---

## Files to Create/Modify

### New Files
```
lib/analyzers/mobile-analyzer.js
lib/analyzers/cloud-analyzer.js
lib/analyzers/devops-analyzer.js
lib/analyzers/ml-analyzer.js
lib/analyzers/data-analyzer.js
lib/detectors/custom-paths.js
lib/detectors/agent-patterns.js
lib/detectors/conflict-resolver.js
lib/intent-matcher.js
lib/migration-enhanced.js
lib/migration-wizard.js
lib/commands/visualize.js
lib/visualizers/skill-card.js
lib/visualizers/index.js
lib/visualizers/template.html
templates/openclaw.md
```

### Modified Files
```
lib/constants.js              # Add OpenClaw TARGET
lib/context.js                # Update analyzeProjectForIdeation, findExistingAgentFiles
lib/cli-helpers.js            # Add suggestions to scaffoldNew
lib/commands/ideate.js        # Add suggestions to template
lib/translators/base.js       # Add OpenClaw format
cli.js                        # Add visualize command
README.md                     # Update with new features
```

### Test Files
```
test/analyzers/mobile-analyzer.test.js
test/analyzers/cloud-analyzer.test.js
test/analyzers/devops-analyzer.test.js
test/analyzers/ml-analyzer.test.js
test/analyzers/data-analyzer.test.js
test/detectors/custom-paths.test.js
test/detectors/agent-patterns.test.js
test/detectors/conflict-resolver.test.js
test/intent-matcher.test.js
test/migration-enhanced.test.js
test/commands/visualize.test.js
test/integration/migration.test.js
test/integration/suggestions.test.js
```

---

## Documentation Updates

1. **docs/VISUALIZATION.md** - HTML documentation tool guide
2. **docs/MIGRATION.md** - Enhanced migration system guide
3. **docs/TECH_STACKS.md** - Supported tech stacks reference
4. **docs/OPENCLAW.md** - OpenClaw integration guide
5. **README.md** - Update with new commands and features
6. **docs/API.md** - Update with new commands

---

**Last Updated**: 2026-03-16
**Author**: Rosetta Team
**Status**: Ready for Implementation
