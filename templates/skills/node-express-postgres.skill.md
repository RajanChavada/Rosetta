---
name: node-express-postgres-api
description: Help build and maintain Node/Express APIs backed by Postgres with safe CRUD patterns.
domains:
  - backend
  - database
---

# Node/Express/Postgres API Skill

## Intent
Standardize the design, implementation, and refactoring of HTTP APIs backed by Postgres, ensuring performance, safety, and clear contracts.

## Pre-Checks
- Identify Express route entry points and database connection utilities.
- Scan for existing migrations or SQL schemas.
- Check for global middlewares (auth, validation, logging).

## Workflow
- **Contract First**: Define the method, path, status codes, and data schemas before writing code.
- **Schema Design**: Draft SQL migrations with explicit constraints and appropriate indexes.
- **Implementation**: Write route handlers using parameterized queries and structured error handling.
- **Validation**: Ensure all inputs are validated against the defined contract.
- **Testing**: Add integration tests that verify the DB state after API calls.

## Guardrails
- Never use raw template strings for SQL queries; always use parameterized input.
- Do not bypass existing auth or validation middlewares.
- Stop if the proposed change violates the "Risk Level" constraints in `AGENT.md`.

## Output
- Refined route/controller files.
- SQL migration files.
- Updated integration tests and documentation.
