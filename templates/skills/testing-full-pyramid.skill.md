---
name: testing-full-pyramid
description: Expert-level workflow for executing a comprehensive testing strategy across all application layers.
domains:
  - testing
  - quality
---

# Testing Strategy Skill: Full Pyramid

## Expert Intent
Ensure 100% confidence in every deployment. This skill guides the agent through the "Full Pyramid" testing model (Unit -> Integration -> E2E), prioritizing high coverage in high-risk modules while maintaining a fast, reliable developer inner loop.

## Pre-Checks & Context Intake
- **Framework Check**: Confirm the current test runner and suite setup: **{{TESTING_SETUP}}**.
- **Coverage Audit**: Locate existing coverage reports or scan for `__tests__` directories and `*.test.js` files.
- **Risk Assessment**: Read `PROJECT_MEMORY.md` to identify "High-Risk" modules that require mandatory E2E coverage.
- **Data State**: Verify how test databases or mock servers are initialized.

## Expert Workflow (SOF)
1. **Unit Isolation**: Target individual functions or components.
   - Requirement: 100% Mocking of external services.
   - Focus: Edge cases, logic branches, and pure functions.
2. **Integration Layer**: Focus on the boundary between components (e.g., API <-> Database).
   - Requirement: Use a transient test database or a "clean-slate" environment.
   - Focus: Data persistence, side-effects, and middleware integration.
3. **E2E Critical Paths**: Validate the most important user journeys (e.g., registration, payment, critical CRUD).
   - Requirement: Run in a production-like environment (Browser/Simulated).
4. **Cleanup**: Proactively prune flaky tests and ensure the environment is reset after every run.

## Strict Guardrails
- **FLAKINESS CONTROL**: Never commit tests that rely on external, non-deterministic production APIs.
- **SPEED**: Do not let unit test suites exceed a 2-minute execution budget.
- **MANDATORY**: New features MUST include a matching test file before being marked as "GSD" (Get Shit Done).

## Expected Output
- A robust, passing suite of Unit and Integration tests.
- E2E scripts for critical paths.
- Updated coverage reports with zero regressions.
