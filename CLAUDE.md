# Rosetta

> Primary configuration: rosetta.yaml (if present) or CLAUDE.md

## Project Overview

**Name:** Rosetta
**Type:** web_app
**Description:** A modern web application built with Next.js

### Technology Stack

- **Language:** <!-- TODO: Add LANGUAGE -->
- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Datastores:** PostgreSQL, Redis
- **Testing:** <!-- TODO: Add TEST_RUNNER -->
- **Risk Level:** medium

## Standard Operating Procedures

1. **Sync State**: At the start of a session, run `rosetta sync` to ensure your IDE context is up-to-date
2. **Task Audit**: Read `.ai/task.md` and `PLAN.md` before taking action
3. **Design First**: For non-trivial tasks, propose an implementation plan or design document
4. **Verification**: ALWAYS run tests and builds before declaring success

## Project Guardrails

- **App Router**: Use the app directory structure (not pages)
- **Server Components**: Use Server Components by default, Client Components only when needed
- **Type Safety**: All components should be properly typed with TypeScript
- **Database**: All database queries must use Prisma ORM
- **API Routes**: API routes go in `app/api/` directory



## Conventions

### Next.js
- **[Enforced]** Use App Router
- **[Enforced]** Use Server Components by default
- **[Enforced]** Client Components must have 'use client' directive

### TypeScript
- **[Enforced]** Enable strict mode
- **[Enforced]** Use interfaces for object types

### Testing
- **[Enforced]** Write tests for all new components
- **Test Runner:** <!-- TODO: Add TEST_RUNNER -->
- **Test Location:** `__tests__/` or `*.test.tsx`

## Commands

### Development
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run all tests
npm test:watch       # Watch mode
```

## Notes

### GOTCHA - Server vs Client Components
**Priority:** 8
Server Components are the default in Next.js App Router. Only add 'use client' when you need:
- React hooks (useState, useEffect)
- Browser APIs (window, document)
- Event handlers (onClick, onChange)

### GOTCHA - API Routes
**Priority:** 7
API routes must be in `app/api/` directory. Route handlers export named functions: GET, POST, PUT, DELETE.

### OPTIMIZATION - Image Optimization
**Priority:** 5
Always use `next/image` component for images. It provides automatic optimization.