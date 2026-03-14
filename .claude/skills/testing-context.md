# Testing Context Skill

**Purpose:** Load test strategy, fixtures, and CI/CD rules for Rosetta CLI development.

## Scope

This skill focuses on testing aspects of Rosetta CLI:
- Test framework setup and structure
- Test coverage requirements
- Testing patterns for file operations and CLI commands

## Current State

**Test Setup:**
- Placeholder test command: `npm test` (echo "TODO: add tests")
- No test framework configured
- No coverage tooling configured

**Test Requirements (from plan):**
- Unit tests for all lib/ modules
- Integration tests for core commands
- >80% code coverage target
- Coverage reporting configuration

## Files to Consult

| File | Purpose |
|-------|----------|
| `lib/utils.js` | Test TreeLogger, dryRunWrite, showBanner |
| `lib/constants.js` | Test constant definitions |
| `lib/config.js` | Test config loading and profile merging |
| `lib/templates.js` | Test template rendering logic |
| `lib/context.js` | Test auto-detection, gatherContext |
| `lib/skills.js` | Test skill loading and creation |
| `lib/migration.js` | Test migration workflows |
| `lib/validation.js` | Test health scoring logic |
| `lib/registry.js` | Test RegistryManager class |
| `lib/commands/*.js` | Test new commands (add-ide, translate) |

## Test Patterns

### Unit Testing
- Test pure functions in isolation
- Mock fs operations with `fs-mock` or similar
- Test all error paths
- Test async functions properly

### Integration Testing
- Test command end-to-end workflows
- Use temporary directories for file operations
- Verify actual file system state after commands
- Test dry-run mode prevents writes

### Coverage
- Use istanbul/nyc for coverage tracking
- Target >80% across all lib/ modules
- Focus on business logic, less on error handling

### Test Commands to Add
- `npm test:unit` - Run unit tests only
- `npm test:integration` - Run integration tests only
- `npm test:coverage` - Run tests with coverage report

## Design Guidelines

- Write tests alongside source files (e.g., `lib/utils.test.js`)
- Use Jest or similar test framework
- Mock `inquirer` prompts for non-interactive testing
- Clean up test files after execution

## Summarization Guidelines

When summarizing testing context for active workspace:

1. **Active work in testing:**
   - Test framework selection and setup
   - Writing unit tests for lib/ modules
   - Integration test implementation

2. **Patterns in use:**
   - Jest/mocha patterns
   - Mocking strategies
   - Coverage tracking

3. **Files to watch:**
   - Test files being created/modified
   - package.json test scripts
   - Coverage reports

4. **Concise output (<80 lines total):**
   ```text
   Testing Context: Test strategy and framework
   - Current: No tests implemented (placeholder)
   - Target: Jest, >80% coverage
   - Patterns: Unit isolation, integration e2e
   - Files: All lib/*.test.js when created
   ```
