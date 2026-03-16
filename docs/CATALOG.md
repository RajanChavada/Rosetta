# Skill Catalog

Centralized discovery and metadata for Rosetta skills.

## What is the Skill Catalog?

The **Skill Catalog** is a curated, versioned collection of skill metadata stored in `catalog.json` at the root of the Rosetta repository. It serves as a centralized registry for discovering, evaluating, and composing skills across the ecosystem.

### Purpose

- **Discovery**: Browse available skills with rich metadata (domains, tags, descriptions)
- **Composition**: Understand skill dependencies and capabilities through the skill graph
- **Quality Signal**: Star counts, author reputation, and update recency
- **Integration**: Enables commands like `rosetta catalog`, `rosetta search` (planned), and `rosetta compose` (planned)

### Design Principles

- **Versioned**: Each catalog has a semantic version (e.g., "1.0.0")
- **Curated**: Only vetted, high-quality skills are included
- **Git-first**: No backend service; catalog is a static JSON file
- **CLI-native**: All operations happen locally; no network calls required

---

## Catalog Structure

The catalog is a JSON object with this top-level structure:

```json
{
  "version": "1.0.0",
  "updated": "2026-03-15",
  "skills": [
    { /* skill entry */ }
  ]
}
```

### Field Reference

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `version` | string | Yes | Semantic version of the catalog (e.g., "1.0.0") |
| `updated` | string | Yes | ISO 8601 date of last catalog update |
| `skills` | array | Yes | Array of skill entry objects |

### Skill Entry Schema

Each skill object in the `skills` array contains:

```json
{
  "name": "node-express-postgres",
  "displayName": "Node.js Express PostgreSQL",
  "description": "Full-stack Node.js skill with Express and PostgreSQL...",
  "repoUrl": "https://github.com/rosetta-ai/node-express-postgres",
  "domains": ["backend", "api"],
  "tags": ["node", "express", "postgres", "api", "rest"],
  "intentKeywords": ["api", "backend", "database", "sql"],
  "author": "Rosetta Team",
  "stars": 120,
  "lastUpdated": "2026-03-15",
  "provides": ["api-development", "database-integration"],
  "requires": ["nodejs", "postgres"],
  "enhances": [],
  "icon": "🚀",
  "color": "#339AF0"
}
```

#### Detailed Field Descriptions

**Identity & Presentation**

- `name` (string, required): Unique identifier in kebab-case. Used in commands and file names.
  - Example: `"node-express-postgres"`
  - Rules: Lowercase, hyphens only, no spaces, must be unique across catalog

- `displayName` (string, required): Human-readable name for UI display.
  - Example: `"Node.js Express PostgreSQL"`
  - Rules: Can include spaces, capitals, punctuation

- `description` (string, required): 1-3 sentence summary of what the skill does.
  - Example: `"Full-stack Node.js skill with Express and PostgreSQL. Provides IDE integration, database management, and API development templates."`
  - Best practice: Start with the technology stack, then mention key capabilities

- `icon` (string, required): Emoji or icon identifier for visual recognition.
  - Example: `"🚀"` or `"⚛️"` or `"🔬"`
  - Rules: Single emoji or icon name; displays in catalog table and skill graph

- `color` (string, required): Hex color code for theming.
  - Example: `"#339AF0"` (blue), `"#61DAFB"` (React blue)
  - Pattern: `^#[0-9A-Fa-f]{6}$`
  - Use: Highlights skill in terminal output and visualizations

**Metadata & Discovery**

- `repoUrl` (string, required): HTTPS URL to the skill's Git repository.
  - Example: `"https://github.com/rosetta-ai/node-express-postgres"`
  - Validation: Must be valid HTTP/HTTPS URL
  - Use: Users can visit to see full skill implementation; `rosetta install` will clone this URL

- `author` (string, required): Name of the skill maintainer or organization.
  - Example: `"Rosetta Team"` or `"Jane Doe"`

- `stars` (number, required): GitHub star count or quality score (non-negative).
  - Example: `120`
  - Use: Popularity signal for discovery

- `lastUpdated` (string, required): ISO 8601 date of last skill update.
  - Example: `"2026-03-15"`
  - Validation: Must be valid date string
  - Use: Filter for recently maintained skills

- `domains` (array of strings, required): Categories the skill belongs to.
  - Example: `["backend", "api"]`
  - Common values: `frontend`, `backend`, `testing`, `database`, `security`, `infrastructure`, `data`, `devops`, `api`, `spa`, `mobile`
  - At least one domain required; used for filtering (`rosetta catalog --domain`)

- `tags` (array of strings, required): Technology-specific keywords.
  - Example: `["node", "express", "postgres", "api", "rest"]`
  - Use: Fine-grained search; broadens discoverability

- `intentKeywords` (array of strings, required): Problem-space keywords for intent matching.
  - Example: `["api", "backend", "database", "sql"]`
  - Difference from tags: tags are tech stack; intentKeywords are use cases
  - At least one keyword required

**Skill Graph Metadata** (for planned `rosetta compose`)

- `provides` (array of strings, required): Capabilities this skill delivers.
  - Example: `["api-development", "database-integration"]`
  - Purpose: When user runs `rosetta compose <capability>`, Rosetta finds skills that provide it
  - Naming: Use kebab-case, be specific but reusable (e.g., "api-development", "auth-security", "real-time-messaging")

- `requires` (array of strings, required): Dependencies this skill needs.
  - Example: `["nodejs", "postgres"]`
  - Purpose: `rosetta compose` automatically installs dependencies
  - Mapping: Each `requires` entry should match a `provides` entry from another catalog skill (creating graph edges)
  - Note: Rosetta doesn't validate cross-skill mappings; that's the maintainer's responsibility

- `enhances` (array of strings, optional): Skills this one extends or improves.
  - Example: `["basic-auth"]` (the skill enhances the basic-auth skill)
  - Purpose: Optional graph relationship for skill versioning/forks

---

## Using the Catalog

### `rosetta catalog`

List skills in the catalog with optional filtering.

**Basic usage:**
```bash
# List all skills
rosetta catalog

# Filter by domain
rosetta catalog --domain backend

# Filter by multiple domains
rosetta catalog --domain frontend,spa

# Limit results
rosetta catalog --limit 10

# JSON output (for scripting)
rosetta catalog --json

# Combine options
rosetta catalog --domain api --limit 20
```

**Options:**

| Flag | Type | Default | Description |
|------|------|---------|-------------|
| `--json` | boolean | `false` | Output as JSON instead of formatted table |
| `--domain` | string | (none) | Filter by domain(s). Comma-separated for multiple (e.g., `frontend,backend`) |
| `--limit` | number | (none) | Maximum number of skills to return |

**Output Examples:**

*Table format (default):*
```bash
$ rosetta catalog

📦 Catalog: 2 skill(s)

┝────────────────────────────────┬──────────────────────────────────────────────┬──────────────────────────────┑
│ Name                           │ Description                                  │ Domains                      │
├────────────────────────────────┼──────────────────────────────────────────────┼──────────────────────────────┤
│ node-express-postgres          │ Full-stack Node.js skill with Express...   │ backend, api                 │
├────────────────────────────────┼──────────────────────────────────────────────┼──────────────────────────────┤
│ react-redux-firebase           │ React frontend with Redux state mana...   │ frontend, spa                │
└────────────────────────────────┴──────────────────────────────────────────────┴──────────────────────────────┘
```

*JSON format:*
```bash
$ rosetta catalog --domain backend --json
{
  "count": 1,
  "skills": [
    {
      "name": "node-express-postgres",
      "displayName": "Node.js Express PostgreSQL",
      "description": "Full-stack Node.js skill with Express and PostgreSQL...",
      "repoUrl": "https://github.com/rosetta-ai/node-express-postgres",
      "domains": ["backend", "api"],
      "tags": ["node", "express", "postgres", "api", "rest"],
      "intentKeywords": ["api", "backend", "database", "sql"],
      "author": "Rosetta Team",
      "stars": 120,
      "lastUpdated": "2026-03-15",
      "provides": ["api-development", "database-integration"],
      "requires": ["nodejs", "postgres"],
      "enhances": [],
      "icon": "🚀",
      "color": "#339AF0"
    }
  ]
}
```

### `rosetta search` (Planned)

Search the catalog by name, description, tags, or intent keywords.

*This command is planned but not yet implemented. The underlying `searchCatalog()` function exists in `lib/catalog.js` but is not exposed via CLI.*

**Planned usage:**
```bash
# Simple text search across all fields
rosetta search react

# Search with filters (future)
rosetta search --tag typescript --domain frontend
```

---

## Adding Skills to the Catalog

The skill catalog is maintained via pull request to the Rosetta repository. Skills undergo review before merging.

### Submission Process

1. **Prepare your skill**: Ensure your skill follows Rosetta's skill format (see `SKILLS.md`). The skill should be in its own repository or a clearly separated directory.

2. **Test locally**: Validate your skill file with `rosetta validate` (or implement this validation):
   ```bash
   # Ensure skill structure is valid
   rosetta validate .claude/skills/your-skill.md
   ```

3. **Add to catalog.json**: Add your skill entry to the `skills` array in `catalog.json`. Follow the schema exactly:
   - Include **all required fields**
   - Use semantic version for catalog (bump if adding skills)
   - Keep entries sorted alphabetically by `name` (maintainers will do this)

4. **Validate**: Run the catalog validation (future command):
   ```bash
   # Validate the entire catalog
   rosetta catalog --validate
   ```
   Or manually test with Node:
   ```bash
   node -e "import('./lib/catalog.js').then(m => m.validateCatalogFile()).then(console.log)"
   ```

5. **Submit PR**: Create a pull request with:
   - Updated `catalog.json`
   - (Optional) Add your skill icon to `docs/assets/icons/` if using custom icon
   - Clear description of the skill's purpose and use cases

6. **Review**: Maintainers will:
   - Validate schema and data types
   - Verify skill repository is accessible and well-documented
   - Check that `provides` and `requires` make sense in the skill graph
   - Suggest improvements to description or metadata

7. **Merge**: Upon approval, your skill is added to the official catalog.

### Schema Validation

The `validateSkill()` function in `lib/catalog.js` enforces:

- **Type checking**: All fields must match expected types (string, number, array)
- **Required fields**: No missing fields allowed
- **Non-empty strings**: `name`, `displayName`, `description` cannot be blank
- **URL format**: `repoUrl` must be valid HTTP/HTTPS URL
- **Numeric constraints**: `stars` must be non-negative
- **Color format**: `color` must be 6-digit hex (e.g., `#FF5733`)
- **Date format**: `lastUpdated` must be valid ISO 8601 date
- **Array constraints**:
  - `domains` must contain at least one item
  - `intentKeywords` must contain at least one item
  - All array items must be strings

**Common validation errors:**
```
"Missing required field: repoUrl"
"Field 'name' cannot be empty"
"Field 'color' must be a valid hex color"
"Skill at index 3: Field 'domains' must contain at least one domain"
"Duplicate skill names found: my-skill"
```

### Graph Metadata Guidelines

The `provides` / `requires` / `enhances` fields enable **skill composition** (planned feature). When adding these fields:

**For `provides`:**
- List capabilities your skill delivers to a project
- Use kebab-case (e.g., `"api-development"`, `"auth-security"`)
- Be specific but reusable: `"postgres-migrations"` is better than `"database"`
- Typical count: 1-5 capabilities per skill

**For `requires`:**
- List dependencies your skill needs to function
- Each entry should correspond to a `provides` value from another catalog skill
- Example: Node.js Express PostgreSQL skill `requires` `["nodejs", "postgres"]`
- These are **capability references**, not package names
- If your skill has no external dependencies beyond the language/runtime, use `["nodejs"]` or `["python"]` as appropriate

**For `enhances`:**
- Optional; list skills this skill extends or improves upon
- Use skill `name` values from catalog (not `provides` values)
- Example: `"enhances": ["basic-auth"]` means this skill builds on basic-auth
- Use for forked/derived skills or specialized versions

**Example with graph metadata:**
```json
{
  "name": "api-rate-limiting",
  "provides": ["rate-limiting", "throttling"],
  "requires": ["api-development", "redis"],
  "enhances": ["basic-api"]
}
```

### Visualization: Icon and Color

Choose visually distinctive yet thematically appropriate icons and colors:

**Icon selection:**
- Use common emojis (✅, 🚀, ⚛️, 🔧, 📊, 🔐, 🧪, 📦)
- Avoid obscure emojis that may not render on all terminals
- Consider meaning: 🔒 for security, 📈 for analytics, 🧪 for experimental

**Color selection:**
- Use brand colors when available (React blue #61DAFB, Vue green #41B883)
- For generic skills, use distinct colors from the palette:
  - Backend: Blues (#339AF0, #228BE6)
  - Frontend: Greens (#51CF66, #37B24D)
  - Testing: Oranges (#FF922B, #FD7E14)
  - Infrastructure: Purples (#9775FA, #7950F2)
- Ensure sufficient contrast for terminal readability

### Testing Before Submission

Before submitting, test that your skill integrates correctly:

1. **Validate schema:**
   ```bash
   node -e "import('./lib/catalog.js').then(m => m.validateCatalogFile('catalog.json')).then(r => { if (!r.valid) { console.error(r.errors.join('\n')); process.exit(1); } else { console.log('Catalog valid'); } })"
   ```

2. **Check loading:**
   ```bash
   node -e "import('./lib/catalog.js').then(m => m.loadCatalog()).then(c => console.log('Loaded', c.skills.length, 'skills'))"
   ```

3. **Test filtering:**
   ```bash
   node -e "import('./lib/catalog.js').then(m => m.filterByDomain('frontend')).then(s => console.log('Found', s.length, 'frontend skills'))"
   ```

4. **Verify repo URL:** Ensure the repository is publicly accessible (no authentication required).

---

## Skill Graph Integration

The skill catalog provides the foundation for **Skill Graph** features (see `docs/SKILL_GRAPH_ANCESTRY_GAMIFICATION.md`). These are planned but not yet implemented.

### How It Works

1. **Graph construction**: Each skill's `provides` and `requires` fields define directed edges:
   - `skillA.requires = ["nodejs"]` → edge from skillA to any skill with `provides: ["nodejs"]`
   - Rosetta builds a dependency graph across the catalog

2. **Capability lookup**: When a user wants a capability, Rosetta finds all skills that `provide` it.

3. **Composition**: `rosetta compose <capability>` (planned) would:
   - Find skill(s) providing the requested capability
   - Recursively install all `requires` dependencies
   - Detect cycles or conflicts
   - Present a composition plan for user approval

4. **Visualization**: `rosetta skill-graph` (planned) would:
   - Render the graph structure (using Mermaid, DOT, or terminal ASCII)
   - Show nodes (skills) with icons and colors
   - Show edges labeled "provides"/"requires"/"enhances"

### Example Graph Scenario

Catalog entries:
```json
{
  "name": "node-express-api",
  "provides": ["api-development"],
  "requires": ["nodejs", "express"]
},
{
  "name": "express-framework",
  "provides": ["express"],
  "requires": ["nodejs"]
},
{
  "name": "nodejs-runtime",
  "provides": ["nodejs"],
  "requires": []
}
```

User runs: `rosetta compose api-development`

**Composition algorithm (planned):**
```
1. Find skill that provides "api-development" → node-express-api
2. node-express-api requires: ["nodejs", "express"]
3. Find skill that provides "express" → express-framework
4. express-framework requires: ["nodejs"]
5. Find skill that provides "nodejs" → nodejs-runtime
6. nodejs-runtime requires: [] (leaf node)
7. Install order (dependencies first): nodejs-runtime → express-framework → node-express-api
```

This graph-driven composition ensures all dependencies are satisfied automatically.

---

## Best Practices

### For Catalog Maintainers

- **Keep entries sorted**: Alphabetize by `name` field for readability
- **Version bump policy**: Increment catalog version for every change (semantic versioning)
  - Patch: Minor metadata fixes, typos
  - Minor: Adding new skills (1-5 additions)
  - Major: Overhauling schema, removing many skills
- **Quality over quantity**: Include only well-maintained, documented skills
- **Verify URLs**: Ensure `repoUrl` is accessible and contains a valid skill file
- **Consistent domains**: Reuse existing domain values; avoid creating new ones for minor variations
- **Accurate stars**: Pull actual GitHub star counts; don't inflate

### For Skill Authors Submitting to Catalog

- **Write clear descriptions**: First sentence should answer "What stack + what can I do?"
- **Choose appropriate domains**: Primary domain first; add secondary if truly applicable
- **Use tags wisely**: 3-7 tags per skill; include language, framework, key libraries
- **Intent keywords**: Think "What problem is the user trying to solve?" not "What tech does this use?"
- **Graph metadata**: Spend time on `provides`/`requires`—they enable the compose feature
  - Test your graph: Does every `requires` entry have a corresponding `provides` somewhere in catalog?
  - Avoid circular dependencies (A requires B, B requires A)
- **Icon & color**: Make your skill visually distinct but thematically consistent

### When to Update Catalog Entries

Update a skill's metadata (not the skill itself) when:
- `stars` count changes significantly (±10-20%)
- Skill repository moves to new URL
- `lastUpdated` becomes stale (skills not updated in >1 year may be deprecated)
- `provides`/`requires` relationships change
- New version of skill adds/removes capabilities

---

## Troubleshooting

### Catalog validation fails

**Symptom:** Error message listing validation errors.

**Solution:**
1. Check the error messages—they indicate exact field problems
2. Common issues:
   - Missing required field: Add the field
   - Type mismatch: Ensure `stars` is number, `tags` is array, etc.
   - Empty string: `name`, `displayName`, `description` cannot be blank
   - Duplicate `name`: Choose a unique identifier
3. Run validation programmatically (see Testing section above)

### `rosetta catalog` command not found

**Symptom:** `command not found: catalog`

**Solution:** The `catalog` command is available in Ro

### Skill not appearing after adding to catalog.json

**Symptom:** You added a skill entry but `rosetta catalog` doesn't show it.

**Solution:**
1. Ensure you're running the command from Rosetta repository root (where `catalog.json` lives)
2. Verify JSON syntax is valid (no trailing commas, proper brackets)
3. Check that the file is saved and committed
4. Run `rosetta catalog --json` to see raw data and confirm

### Domain filter returns no results

**Symptom:** `rosetta catalog --domain frontend` shows "No skills found"

**Solution:**
1. Check spelling: domain values are case-insensitive but must match exactly (e.g., `frontend` not `front-end`)
2. Verify the skill you expect actually has that domain in its entry
3. List all domains (future command): `rosetta catalog --json | jq '.skills[].domains'`

### Incorrect or outdated skill data

**Symptom:** Skill shows wrong `stars`, outdated `lastUpdated`, broken `repoUrl`.

**Solution:**
1. This is a catalog metadata issue, not a skill file issue
2. Submit a PR to update `catalog.json` with corrected data
3. For `stars`, fetch from GitHub API: `curl -s https://api.github.com/repos/owner/repo | jq .stargazers_count`
4. For `lastUpdated`, check the skill repository's latest commit date

### Compose command fails (when implemented)

**Symptom:** `rosetta compose <capability>` says "No skill provides..."

**Solution:**
1. Check your spelling: capability must match a `provides` value exactly (kebab-case)
2. Search catalog: `rosetta catalog --json | grep -i "your-capability"`
3. If no skill provides it, the capability may not be in any catalog skill yet
4. Consider contributing a skill that provides that capability

---

## See Also

- [SKILLS.md](SKILLS.md) - Rosetta's dual skills system explained
- [SKILL_GRAPH_ANCESTRY_GAMIFICATION.md](SKILL_GRAPH_ANCESTRY_GAMIFICATION.md) - Skill graph design document
- [IDEATION.md](IDEATION.md) - Creating new skills for your project
- [API.md](API.md) - Complete command reference (including `catalog`)
- [ARCHITECTURE.md](ARCHITECTURE.md) - System architecture and design principles
