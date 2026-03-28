# Auto Memory

This file contains **agent-maintained notes and heuristics** that are useful across sessions but are not formal project decisions. Think of this as the "collective brain" of all agents who have worked on this project.

## What Belongs Here

**DO ADD:**
- Reusable troubleshooting steps ("When tests fail with X, check Y first")
- Observed patterns in the codebase ("Most services use helper Z for logging")
- Short reminders about gotchas ("Do not modify table A directly; use migration scripts")
- Performance shortcuts and optimizations
- Common debugging workflows
- Tool-specific tips and quirks

**DO NOT ADD:**
- Long narratives or full task logs (those go in `.ai/logs/daily/YYYY-MM-DD.md`)
- Major architectural or product decisions (those belong in `PROJECT_MEMORY.md`)
- Tribal knowledge requiring permanent archival (use `.ai/archive/tribal-knowledge.md`)
- Sensitive data like access tokens or raw secrets

---

## Update Guidelines

- **Append short, bulleted notes** - not essays
- **Prefer patterns over one-off events** - look for repeatable advice
- **Date your entries** - helps track when things were learned
- **Generalize specifics** - turn "fix bug in file X" into "pattern for debugging Y"
- **Propose promotion** - if a note becomes project-wide, suggest moving to PROJECT_MEMORY.md

---

## Example Entries

- **2026-03-15** When updating DB schema, always run `npm test db` before committing to catch migration issues early.
- **2026-03-10** Frontend components live under `src/ui/` and follow the `Feature/Component` pattern for consistency.
- **2026-02-28** Integration tests use a seeded Postgres test database defined in `docker-compose.test.yml` - run `docker-compose -f docker-compose.test.yml up -d` first.
- **2026-02-15** The build cache in `.next/cache/` sometimes gets corrupted - if builds fail mysteriously, try `rm -rf .next/cache/ && npm run build`.

---

## Testing

<!-- Testing-related heuristics -->

- When a test fails intermittently, check for race conditions - most are related to async timing
- Use `--no-cache` flag with test commands when debugging flaky tests
- Mock external services in `tests/mocks/` following the existing patterns

---

## Development Workflow

<!-- Development process heuristics -->

- Run `npm run lint:fix` before committing - catches most formatting issues
- Use `npm run type-check` to catch TypeScript errors before running tests
- Hot reload works for most files, but requires restart when changing config files

---

## Debugging

<!-- Common debugging workflows -->

- When API requests fail, check the network tab first - often it's a CORS issue
- Use `DEBUG=*` environment variable to see detailed logging from all packages
- The `--inspect` flag with Node.js enables debugger on port 9229

---

## Performance

<!-- Performance optimization tips -->

- Images are optimized automatically on build - no manual optimization needed
- Database queries are logged in development - check for N+1 queries
- Bundle analysis: run `npm run analyze` after build to see bundle size breakdown

---

## Gotchas

<!-- Common pitfalls and workarounds -->

- Environment variables must be prefixed with `NEXT_PUBLIC_` to be available in browser code
- The auth token expires after 1 hour - refresh token flow handles this automatically
- Static files in `public/` are cached aggressively - use cache-busting for updates

---

*This file is maintained by the agentic-memory skill. Agents append findings here; users review and promote to PROJECT_MEMORY.md when appropriate.*
