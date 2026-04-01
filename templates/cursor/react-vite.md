# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** React + Vite Web Application
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** React + Vite
- **Testing:** {{TEST_RUNNER}}
- **Linting:** {{LINTER}}
- **Formatting:** {{FORMATTER}}

## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` before starting work
2. **Development**: Use `npm run dev` to start development server
3. **Testing**: Run `npm test` before committing changes
4. **Build**: Run `npm run build` to create production build

## Conventions

<!-- TODO: Add project conventions -->

## Commands

### Development
```bash
{{DEV_COMMAND}}
{{BUILD_COMMAND}}
{{TEST_COMMAND}}
```

### Vite Specific
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm preview         # Preview production build
npm test             # Run tests
npm lint             # Run ESLint
npm format           # Format with Prettier
```

## Cursor Rules

### File Patterns
- `src/` - Source code directory
- `src/components/` - React components
- `src/lib/` - Utility functions and configurations
- `src/styles/` - CSS/SCSS files
- `public/` - Static assets

### Development Patterns
- Use TypeScript strict mode
- Follow React hooks conventions
- Use component-based development patterns
- Implement proper error boundaries
- Use Vite features for development optimization
- Implement proper CSS modules or styled-components
- Optimize build with dynamic imports
- Follow React best practices for state management

### Key Commands
- `Ctrl+Shift+P` → "Tasks: Run Test Task" for running tests
- `Ctrl+Shift+P` → "Terminal: Run Build Task" for building
- `F5` to start debugging
- `Ctrl+F5` to start debugging without breakpoints

### Cursor AI Context
- Focus on React optimization patterns
- Vite development server features
- TypeScript type safety
- Component architecture best practices
- State management patterns
- Build optimization techniques