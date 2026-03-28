# {{PROJECT_NAME}}

> Primary configuration: rosetta.yaml (if present) or CLAUDE.md

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** api
**Description:** A Node.js API service

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** {{FRAMEWORK}}
- **Testing:** {{TEST_RUNNER}}
- **Risk Level:** medium

{{#IDE claude}}
## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` at session start
2. **API Design**: Design endpoints before implementing
3. **Verification**: Run tests and check API logs before declaring success

## Project Guardrails

- **Routes**: All routes must be validated with middleware
- **Errors**: Never expose stack traces in API responses
- **Database**: Use Prisma or similar ORM for database access
{{/IDE}}

## Conventions

### API Design
- **[Enforced]** RESTful naming conventions
- **[Enforced]** All endpoints validate input
- **[Enforced]** Consistent error response format

### Express
- **[Enforced]** Use express-validator or zod for validation
- **[Enforced]** Middleware for authentication/authorization

## Commands

### Development
```bash
npm run dev          # Start dev server with hot reload
npm run build        # Build TypeScript
npm run start        # Start production server
npm test             # Run tests
```

## Notes

### GOTCHA - Async Errors
**Priority:** 8
Always use express-async-handler or wrap async route handlers in try-catch.
Unhandled promise rejections will crash the server.

### DOMAIN RULE - Authentication
**Priority:** 9
All API routes must validate the Authorization header. Unauthorized requests return 401 without leaking information.
