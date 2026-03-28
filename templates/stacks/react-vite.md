# {{PROJECT_NAME}}

> Primary configuration: rosetta.yaml (if present) or CLAUDE.md

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** web_app
**Description:** A modern React application built with Vite

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** React + Vite
- **Testing:** {{TEST_RUNNER}}
- **Build Tool:** Vite
- **Risk Level:** low

{{#IDE claude}}
## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` at session start
2. **Verification**: Run `npm run build` and `npm test` before declaring success
3. **Component Structure**: Keep components under 200 lines

## Project Guardrails

- **Vite**: Use Vite for dev server and builds
- **Components**: Use functional components with hooks
- **TypeScript**: Strict mode enabled
- **Testing**: Vitest for unit tests
{{/IDE}}

{{#IDE cursor}}
## Cursor AI Configuration

### Project Context
You are working on a **React + Vite** application with TypeScript.

### Key Rules
- Use functional components with hooks
- All components must have proper TypeScript types
- Run `npm run build` to verify production build
- Use `npm run dev` for development with hot module replacement
{{/IDE}}

## Conventions

### React
- **[Enforced]** Use functional components with hooks
- **[Enforced]** Components should be in PascalCase
- **[Enforced]** Use 'use client' directive if using React hooks (Vite defaults to client)

### TypeScript
- **[Enforced]** Enable strict mode
- **[Enforced]** Use interfaces for object types

## Commands

### Development
```bash
npm run dev          # Start dev server (Vite HMR)
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
```

### Testing
```bash
npm test             # Run Vitest
npm test:ui          # Vitest UI
```

## Notes

### GOTCHA - No Server Components
**Priority:** 8
Vite builds client-side only. There are no Server Components like Next.js.
