---
name: node-express-postgres-api
description: Expert-level workflow for building and maintaining robust Node/Express APIs backed by Postgres.
domains:
  - backend
  - database
---

# Node/Express/Postgres API Skill

## Expert Intent
Standardize the engineering lifecycle of HTTP APIs. Focus on type safety (via JSDoc or TS), parameterized query security, and predictable error handling to ensure high performance and zero regression in **{{PROJECT_TYPE}}**.

## Pre-Checks & Context Intake
- **Entry Points**: Locate Express route definitions and the database initialization logic.
- **Migration State**: Identify the source of truth for the schema (e.g., `migrations/` folder or `schema.sql`).
- **Middlewares**: Scan for global auth, validation, and logging layers that must be respected.
- **Memory Check**: Read `PROJECT_MEMORY.md` for existing DB connection pool or transaction patterns.

## Expert Workflow (SOF)
1. **Contract Design**: Define the "External Contract" first (Method, Path, Request Schema, Response Codes).
2. **Schema Evolution**: Draft the SQL migration using idempotent `CREATE TABLE IF NOT EXISTS` or standard versioned migration tools.
3. **Controller Logic**: Implement the handler using a "Service/Repository" pattern to separate business logic from SQL.
4. **Validation**: Enforce the contract using a validation library (Zod, Joi) or robust manual checks.
5. **Security**: Audit for raw template strings in SQL; enforce parameterized input for ALL queries.
6. **Verification**: write and run integration tests that verify database side-effects.

## Strict Guardrails
- **SQL SAFETY**: Raw `query()` calls with template literals are strictly forbidden. Use parameterized arguments.
- **ERROR LEAKAGE**: Do not return raw DB errors to the client. Map them to safe, structured JSON responses.
- **ARCHITECTURE**: Do not bypass existing service layers. Maintain the repo's established coupling rules.

## Expected Output
- Versioned SQL migration files.
- Documented Express route handlers.
- New or updated integration tests proving the fix/feature.
