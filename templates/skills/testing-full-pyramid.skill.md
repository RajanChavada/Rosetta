---
name: testing-full-pyramid
description: Execute a comprehensive testing strategy including unit, integration, and E2E tests.
domains:
  - testing
  - quality
---

# Testing Strategy Skill: Full Pyramid

## Intent
Guide the implementation and execution of tests across all layers of the application to ensure regression-free deployments and stable features.

## Pre-Checks
- Confirm testing framework: {{TESTING_SETUP}}.
- Scan for existing test files (`*.test.js`, `*.spec.js`, etc.).
- Check coverage reports if available in the repo.

## Workflow
- **Unit Isolation**: Focus on individual functions or logic. Use mocks for all external dependencies.
- **Integration Layer**: Verify interaction between components (e.g., API to DB). Use transient test databases.
- **E2E Critical Paths**: Validate the most important user journeys (e.g., checkout, login, signup).
- **Cleanup**: Ensure test environments are torn down after every run.

## Guardrails
- Never commit tests that rely on external, non-mocked production APIs.
- Do not skip tests in high-risk modules defined in `PROJECT_MEMORY.md`.
- Stop if test execution time exceeds the predefined budget (e.g., > 5 mins for unit).

## Output
- New or updated test suites.
- Coverage reports.
- Verification status (PASS/FAIL logs).
