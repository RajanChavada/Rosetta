# Project Memory

This file stores **long-lived architectural knowledge** about the project. These are decisions, conventions, domain facts, and architectural context that should remain true across tasks and over time.

## What Belongs Here

**DO ADD:**
- Key architectural decisions and **why** they were made
- Important domain concepts and invariants (e.g., "a workspace always has at least one owner")
- Naming conventions, folder structure conventions, and patterns to be reused
- Changelogs for major shifts in architecture or tech stack
- System boundaries and integration points
- Data flow and state management rules

**DO NOT ADD:**
- Step-by-step task logs or debugging notes (use `.ai/logs/daily/YYYY-MM-DD.md`)
- Speculative ideas not yet agreed on (put them in issues or task.md first)
- Low-level implementation details that go out of date (prefer code comments)
- Transient workarounds or temporary fixes (use `AUTO_MEMORY.md`)

---

## Entry Format

When adding to PROJECT_MEMORY.md, use this format:

### [Date] Decision Title

**Context:** Why this came up, the problem or situation.

**Decision:** What was decided - the rule or approach now in effect.

**Implications:** Where this matters, what it affects, dependencies.

---

## Architecture

### System Architecture
<!-- Add high-level architectural decisions here -->

### Technology Choices
<!-- Document key technology decisions and why -->

### Integration Points
<!-- External systems, APIs, and service boundaries -->

---

## Domain Model

### Key Concepts
<!-- Important domain entities and their relationships -->

### Invariants
<!-- Rules that must always be true -->

### Business Rules
<!-- Domain-specific constraints and requirements -->

---

## Conventions

### Naming Conventions
- Files: `kebab-case.js` for utilities, `PascalCase.js` for components
- Variables: `camelCase`
- Constants: `UPPER_SNAKE_CASE`

### Folder Structure
```
src/
├── components/     # Reusable UI components
├── lib/           # Utilities and helpers
├── services/      # Business logic
└── types/         # TypeScript types
```

### Code Patterns
<!-- Document consistent patterns used throughout the codebase -->

---

## Data Flow

### State Management
<!-- How state flows through the system -->

### API Contracts
<!-- Important API design decisions -->

### Database Schema Rules
<!-- Schema conventions and constraints -->

---

## Example Entry

### [2026-03-15] API Versioning Strategy

**Context:** Adding breaking changes to the payments API without disrupting existing clients.

**Decision:** All new public APIs must be versioned under `/v2/` with explicit deprecation strategy for `/v1/`. Version-specific routes are isolated in `src/api/v1/` and `src/api/v2/` directories.

**Implications:**
- Update API documentation to include version information
- Client SDKs must specify API version
- Tests cover both v1 (deprecated) and v2 (current) endpoints
- Deprecation timeline: v1 sunset scheduled for 2026-09-01

---

*This file is managed by the agentic-memory skill. Updates should be proposed to the user before modifying.*
