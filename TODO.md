# Rosetta TODO

## Track 1: Rosetta Cleanup

### Documentation
- [x] Create docs/SKILLS.md explaining dual skills system
- [x] Create docs/SESSIONS.md explaining session management
- [x] Create docs/AGENTS.md explaining subagent system
- [ ] Update README.md with Skills System section
- [ ] Update docs/API.md with new commands

### Refactoring
- [ ] Get refactor completion report (Tasks 1.1, 1.2, 1.3)
- [ ] Verify CLAUDE.md Work Scope Rules section added
- [ ] Verify CLAUDE.md Skills System section updated
- [ ] Decide on lib/skills-integration.js rename (Task 1.3)

### Testing
- [ ] Set up Jest test framework with coverage reporting
- [ ] Write unit tests for lib/constants.js
- [ ] Write unit tests for lib/utils.js
- [ ] Write unit tests for lib/config.js
- [ ] Write unit tests for lib/templates.js
- [ ] Write unit tests for lib/context.js
- [ ] Write unit tests for lib/skills.js
- [ ] Write unit tests for lib/migration.js
- [ ] Write unit tests for lib/validation.js
- [ ] Write unit tests for lib/registry.js
- [ ] Write integration tests for scaffold command
- [ ] Write integration tests for sync command
- [ ] Write integration tests for translate command
- [ ] Write integration tests for add-ide command
- [ ] Run test:coverage and verify >80% coverage

## Track 2: Agentic IDE Integration Feature

### Research & Design
- [x] Research existing skill system patterns (researcher1)
- [ ] Get researcher2 final report on IDE integration patterns
- [x] Design skill ideation algorithm (planner1)
- [x] Design CLI interface and user experience (planner2)
- [x] Design test strategy and findings (tester-ideation)

### Implementation Planning
- [ ] Compile all design documents into implementation plan
- [ ] Create task breakdown for skill ideation implementation
- [ ] Update CLAUDE.md with new feature architecture

### MVP Implementation (Phase 1)
- [x] Create lib/ideation.js main engine
- [x] Create lib/analyzers/dependency-analyzer.js
- [x] Create lib/analyzers/code-pattern-analyzer.js
- [x] Create lib/analyzers/structure-analyzer.js
- [x] Create lib/analyzers/convention-analyzer.js
- [x] Create lib/generators/skill-generator.js
- [x] Create lib/generators/relevance-scorer.js
- [x] Create lib/commands/ideate.js
- [x] Register `rosetta ideate` command in cli.js

### Integration
- [x] Add `scaffold --auto-ideate` flag
- [x] Add `sync --update-skills` flag
- [x] Add `new-skill --from-suggestion <id>` option
- [ ] Update context.js with ideation integration

### Testing
- [x] Create test/fixtures/ with 8+ sample projects
- [x] Write unit tests for ideation module
- [x] Write unit tests for analyzers
- [x] Write unit tests for generators
- [x] Write integration tests for ideate command
- [ ] Write E2E tests for ideation workflow
- [ ] Verify >80% test coverage

### Documentation
- [ ] Create docs/IDEATION.md explaining skill ideation feature
- [ ] Update README.md with ideation command
- [ ] Update docs/API.md with ideation commands

## Recent Completed Work

### Skill Ideation Feature Implementation (2026-03-14)

**Execution Agent 1 (exec1) - Core Modules:**
- Created `lib/ideation.js` - Main ideation engine with scoring algorithm
- Created `lib/analyzers/dependency-analyzer.js` - Multi-language dependency parser
- Created `lib/analyzers/code-pattern-analyzer.js` - Pattern detection and architecture analysis
- Created `lib/analyzers/index.js` - Centralized analyzer exports

**Execution Agent 2 (exec2) - Generators & Command:**
- Created `lib/analyzers/structure-analyzer.js` - Directory layout detection
- Created `lib/analyzers/convention-analyzer.js` - Convention and pattern analysis
- Created `lib/generators/skill-generator.js` - Skill template rendering
- Created `lib/generators/relevance-scorer.js` - Confidence scoring algorithm
- Created `lib/commands/ideate.js` - CLI command with full options
- Created `lib/generators/index.js` - Centralized generator exports

**Validation Agent 1 (validate1) - Core Modules:**
- Verified `lib/ideation.js` - PASS (scoring weights match design)
- Verified `lib/analyzers/dependency-analyzer.js` - PASS (all parsers present)
- Verified `lib/analyzers/code-pattern-analyzer.js` - PASS (pattern detection complete)
- Status: All core modules validated

**Validation Agent 2 (validate2) - Generators & Command:**
- Verified `lib/analyzers/structure-analyzer.js` - PASS
- Verified `lib/analyzers/convention-analyzer.js` - PASS
- Verified `lib/generators/skill-generator.js` - PASS
- Verified `lib/generators/relevance-scorer.js` - PASS
- Verified `lib/commands/ideate.js` - PASS (2 minor issues noted)
- Status: All generators and command validated

**Testing Agent (tester-ideation):**
- Created 12 test files (6 unit + 6 Jest)
- Ran 22 tests - 100% pass rate
- Created test documentation `test/IDEATION_TEST_REPORT.md`
- Status: All tests passing

**Summary:**
- 9 new module files created
- 5 test files created
- 22 tests passing
- Code follows Rosetta standards (ES6 imports, async/await, TreeLogger)
