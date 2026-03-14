# Skill Ideation Algorithm Design

## Overview

This document describes the algorithm for automatically suggesting 1-5 relevant skills based on codebase analysis. The skill ideation system enhances the Rosetta CLI by analyzing a project's codebase and recommending appropriate skills from the available skill templates.

## Algorithm

### Core Principles

1. **Pattern-Based Detection**: Identify code patterns, dependencies, and file structures that correlate with specific skill domains
2. **Confidence Scoring**: Each potential skill receives a confidence score (0-100) based on match strength
3. **Diversity Preservation**: Ensure suggested skills cover different aspects of the project (frontend, backend, testing, etc.)
4. **User Choice Limit**: Present 1-5 high-confidence skills to avoid overwhelming the user

### Why 1-5 Skills?

- **Cognitive Load**: Research shows 3-5 options is the optimal range for effective decision-making
- **Context Relevance**: Fewer, higher-quality suggestions are more useful than many low-confidence ones
- **Installation Time**: Each skill requires installation time; limiting count respects user time
- **Complementary Coverage**: 5 skills can typically cover the essential aspects of any project (frontend, backend, database, testing, deployment)

### Algorithm Pseudocode

```
function ideateSkills(codebase, availableSkills):
    // Step 1: Analyze codebase
    patterns = analyzeCodebase(codebase)
    context = buildContext(patterns)

    // Step 2: Score all available skills
    scoredSkills = []
    for skill in availableSkills:
        score = calculateMatchScore(context, skill)
        if score > MIN_CONFIDENCE_THRESHOLD:
            scoredSkills.append({ skill, score })

    // Step 3: Deduplicate and diversify
    diversified = diversifySelection(scoredSkills, MAX_SUGGESTIONS)

    // Step 4: Sort by confidence and limit
    return sortByConfidence(diversified)[0:MAX_SUGGESTIONS]

function analyzeCodebase(codebase):
    patterns = {}

    // File pattern detection
    patterns.hasPackageJson = fileExists('package.json')
    patterns.hasGoMod = fileExists('go.mod')
    patterns.hasCargoToml = fileExists('Cargo.toml')
    patterns.hasRequirementsTxt = fileExists('requirements.txt')

    // Directory structure
    patterns.hasTestsDir = dirExists('tests/', 'test/', '__tests__/', 'spec/')
    patterns.hasApiDir = dirExists('api/', 'src/api/')
    patterns.hasComponentsDir = dirExists('components/', 'src/components/')

    // Dependency analysis (from package.json, go.mod, etc.)
    patterns.dependencies = extractDependencies(codebase)

    // Framework detection
    patterns.frameworks = detectFrameworks(patterns.dependencies)

    // Testing framework detection
    patterns.testFrameworks = detectTestFrameworks(patterns.dependencies)

    return patterns

function calculateMatchScore(context, skill):
    score = 0

    // Check skill metadata (if present in skill template)
    metadata = parseSkillMetadata(skill)

    // Framework matching
    for framework in metadata.requiredFrameworks or []:
        if framework in context.frameworks:
            score += FRAMEWORK_MATCH_WEIGHT

    // Dependency matching
    for dep in metadata.requiredDependencies or []:
        if dep in context.dependencies:
            score += DEPENDENCY_MATCH_WEIGHT

    // Testing setup matching
    if metadata.requiresTesting and context.testFrameworks.length > 0:
        score += TESTING_MATCH_WEIGHT

    // Project type matching
    if metadata.projectType and matchesProjectType(context, metadata.projectType):
        score += PROJECT_TYPE_MATCH_WEIGHT

    // File pattern matching
    for pattern in metadata.requiredPatterns or []:
        if context.hasFilePattern(pattern):
            score += PATTERN_MATCH_WEIGHT

    // Normalize to 0-100
    return min(100, score)

function diversifySelection(scoredSkills, maxSuggestions):
    // Ensure we don't select multiple skills for the same domain
    selected = []
    seenDomains = new Set()

    for { skill, score } in sortByConfidence(scoredSkills):
        domain = getSkillDomain(skill)

        if domain not in seenDomains and len(selected) < maxSuggestions:
            selected.append({ skill, score })
            seenDomains.add(domain)

    return selected
```

## Skill Matching Criteria

### Skill Metadata Structure

Each skill template should include metadata in its frontmatter:

```yaml
---
name: node-express-postgres-api
description: Help build and maintain Node/Express APIs backed by Postgres
domains:
  - backend
  - api
requiredFrameworks:
  - express
requiredDependencies:
  - pg
  - express
requiredPatterns:
  - package.json
  - routes/
projectTypes:
  - API / backend service
  - Web app
---
```

### Scoring Weights

| Criteria | Weight | Description |
|----------|--------|-------------|
| Framework Match | +30 | Exact match on required framework |
| Dependency Match | +20 | Each required dependency present |
| Testing Match | +15 | Test framework detected when skill requires testing |
| Project Type Match | +15 | Project type matches skill's target |
| Pattern Match | +10 | File/directory patterns match |
| Domain Relevance | +10 | Skill domain aligns with detected domains |

### Confidence Thresholds

- **High Confidence (70+)**: Strong match across multiple criteria
- **Medium Confidence (50-69)**: Good match on primary criteria
- **Low Confidence (30-49)**: Weak match, may be optional
- **Below Threshold (<30)**: Not recommended

### Domain Categories

- `frontend` - UI components, client-side logic
- `backend` - API, server-side logic
- `database` - Database schema, migrations, queries
- `testing` - Test setup, test patterns
- `deployment` - CI/CD, infrastructure
- `data` - Data processing, ML pipelines

## User Selection Flow

### Step-by-Step Flow

```
1. User runs: rosetta scaffold --ide <name> [project-path]
   or: rosetta ideate-skills

2. Rosetta analyzes codebase (fast, <5 seconds):
   - Scan for config files
   - Parse dependencies
   - Detect frameworks
   - Identify patterns

3. Rosetta scores and selects 1-5 skills:
   - Apply scoring algorithm
   - Diversify by domain
   - Sort by confidence

4. Present skills to user:

   ┌─────────────────────────────────────────────┐
   │ Based on your codebase analysis:            │
   │                                             │
   │ ✓ node-express-postgres (92% confidence)   │
   │   Your project uses Express + Postgres     │
   │                                             │
   │ ✓ testing-full-pyramid (78% confidence)    │
   │   Jest and Playwright detected              │
   │                                             │
   │ ✓ frontend-react-next (65% confidence)     │
   │   React components found in src/           │
   │                                             │
   │ [Select all to install] [Deselect] [Done]  │
   └─────────────────────────────────────────────┘

5. User can:
   - Accept all suggested skills (default)
   - Deselect specific skills
   - Choose "None"
   - Browse additional skills

6. Installation proceeds with selected skills
```

### Selection Options

- **Accept All**: Install all suggested skills (default)
- **Deselect**: Toggle individual skill selection
- **Browse More**: Show full skill catalog with confidence scores
- **Skip Skills**: Proceed with only core IDE setup

### Post-Selection Feedback

After selection, show what each skill will provide:

```
Installing 3 skills:

[1/3] node-express-postgres
  - Express route best practices
  - Postgres query patterns
  - Safe CRUD operations

[2/3] testing-full-pyramid
  - Test organization structure
  - Mock strategies
  - E2E test patterns

[3/3] frontend-react-next
  - Component design patterns
  - State management guidance
  - Performance optimization tips
```

## Integration with Existing Skills

### Skill Sources Priority

1. **User-defined skills** (`--skills-dir`): Highest priority
2. **Git repo skills** (`--skills-repo`): Medium priority
3. **Built-in Rosetta skills** (`templates/skills/`): Fallback

### Conflict Resolution

When a skill with the same name exists in multiple sources:

1. **Name conflicts**: Later source overrides earlier source
2. **Domain overlap**: Allow multiple skills from same domain if scores warrant
3. **Content conflicts**: Don't merge; let user choose via selection flow

### Existing Skills Handling

- **New projects**: All suggestions are fresh installations
- **Existing projects**: Detect installed skills, exclude from suggestions
- **Skill updates**: Check version compatibility before suggesting updates

### Integration Points

1. **`lib/skills-ideation.js`**: New module implementing the algorithm
2. **`lib/context.js`**: Extend with `ideateSkills()` function
3. **`lib/commands/scaffold.js`**: Add skill ideation step before installation
4. **`cli.js`**: Add `rosetta ideate-skills` command

## Edge Cases

### No Skills Match

- If no skills score above threshold, show message
- Offer to browse full skill catalog
- Allow manual skill selection

### Multiple High-Confidence Skills

- If >5 skills score >70, show top 5 by score
- Allow "Show more options" to view additional skills

### Heterogeneous Projects

- Projects with multiple frameworks (e.g., Next.js + Python backend)
- Score skills for each detected stack
- Present balanced selection across stacks

### Minimal Projects

- New/empty projects with few patterns
- Suggest generic skills based on project type selection
- Default to minimal setup (no skills forced)

### Dependency-Heavy Projects

- Projects with many dependencies
- Prioritize skills matching core dependencies
- Filter out low-confidence matches

### Conflicting Skills

- Skills with overlapping domains or patterns
- Present both with clear descriptions
- Let user choose or select both if desired

## Implementation Notes

### Performance Considerations

- File scanning should be <5 seconds for typical projects
- Cache analysis results for subsequent runs
- Parallel file operations where possible
- Skip deep directory scans (max depth 3)

### Extensibility

- Skills can define custom detection rules
- Pluggable pattern matchers
- Extensible scoring weights via config

### Logging

- Log analysis steps for debugging
- Show confidence scores in verbose mode
- Track skill installation success rates

## Example Outputs

### Full-Stack Next.js App

```
Detected: Next.js 14, Prisma, Jest, Playwright

Suggested Skills (3):
1. frontend-react-next (88%) - Next.js + React patterns
2. node-express-postgres (72%) - API + Postgres (Prisma)
3. testing-full-pyramid (85%) - Jest + Playwright setup
```

### Pure Python API

```
Detected: FastAPI, Pytest, PostgreSQL

Suggested Skills (2):
1. python-fastapi-api (91%) - FastAPI patterns
2. testing-full-pyramid (78%) - Pytest setup
```

### Go Microservice

```
Detected: Go, PostgreSQL, no testing

Suggested Skills (2):
1. go-postgres-service (83%) - Go + Postgres patterns
2. testing-unit-tests (45%) - Basic testing setup (optional)
```

## Future Enhancements

- **AI-Powered Ideation**: Use LLM to analyze code patterns beyond simple detection
- **Community Skill Registry**: Discover skills from community-maintained registry
- **Skill Analytics**: Track most-used skills, improve suggestions
- **Custom Detection Rules**: Allow users to define custom pattern rules
- **Skill Dependencies**: Skills that require other skills (auto-install)
