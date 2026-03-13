---
name: node-express-postgres-api
description: Help build and maintain Node/Express APIs backed by Postgres with safe CRUD patterns.
---

# Node/Express/Postgres API Skill

## Intent
Use this skill to design, implement, and refactor HTTP APIs backed by Postgres in this repository.

## When to Use
- Creating or modifying Express route handlers.
- Designing new tables or migrations.
- Implementing transactional flows involving multiple tables.

## Workflow
1. Clarify the endpoint(s): method, path, status codes, and data contracts.
2. Inspect existing Express routes, middlewares, and DB access utilities.
3. Design SQL schema changes or queries with attention to indexes, constraints, and safety.
4. Implement route handlers that:
   - Validate input
   - Use parameterized queries / query builder
   - Handle errors and edge cases explicitly
5. Add or update tests (unit + integration) for new behavior.
6. Document the endpoint and any new tables.

## Output
- Updated routes/controller files
- SQL or migration files
- Updated tests and minimal docs
