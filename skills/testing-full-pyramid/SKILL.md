---
name: testing-full-pyramid
description: Execute a comprehensive testing strategy including unit, integration, and E2E tests.
---

# Testing Strategy Skill: Full Pyramid

## Intent
Guide the implementation and execution of tests across all layers of the application.

## When to Use
- Adding new features that require verification.
- Refactoring existing code and ensuring no regressions.
- Debugging complex issues that span multiple components.

## Workflow
1. **Unit Tests**: Focus on individual functions or logic in isolation. Use mocks for dependencies.
2. **Integration Tests**: Verify interactions between components (e.g., API -> Database). Use test databases or staging environments.
3. **E2E Tests**: Validate full user journeys in a browser or simulated environment. Focus on critical paths.
4. **Maintenance**: Keep test data clean and ensure suites run fast.

## Guidelines
- Follow the project's testing convention: Unit + integration + E2E.
- Respect the Git workflow: Feature branches only when merging test changes.
- Prioritize coverage for high-risk areas.
