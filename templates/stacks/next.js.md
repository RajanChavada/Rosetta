# {{PROJECT_NAME}}

> Primary configuration: rosetta.yaml (if present) or CLAUDE.md

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** web_app
**Description:** A modern web application built with Next.js

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** Next.js
- **Styling:** Tailwind CSS
- **Datastores:** PostgreSQL, Redis
- **Testing:** {{TEST_RUNNER}}
- **Risk Level:** medium

{{#IDE claude}}
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
{{/IDE}}

{{#IDE cursor}}
## Cursor AI Configuration

### Project Context
You are working on a **Next.js** application with:
- App Router (not Pages Router)
- TypeScript for type safety
- Tailwind CSS for styling
- Prisma for database access

### Key Rules
- Always use Server Components unless 'use client' directive is needed
- API routes belong in `app/api/` directory
- Run `npm run build` to check for type errors
- Use `npm run dev` for development with hot reload
{{/IDE}}

{{#IDE windsurf}}
## Windsurf Configuration

### Multi-Lens Reasoning
- **Architecture Lens**: Consider App Router structure and Server Component patterns
- **Performance Lens**: Server Components reduce client bundle size
- **DX Lens**: Use Turbopack for faster development builds
{{/IDE}}

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
- **Test Runner:** {{TEST_RUNNER}}
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
