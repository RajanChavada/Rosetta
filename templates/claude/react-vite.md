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
<!-- TODO: Add project-specific SOPs -->

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

## IDE Integration

{{#IDE claude}}
## Claude Code Configuration

### File Patterns
- `src/` - Source code directory
- `src/components/` - React components
- `src/lib/` - Utility functions and configurations
- `src/styles/` - CSS/SCSS files
- `public/` - Static assets

### Key Instructions
- Focus on component-based development patterns
- Follow React hooks conventions
- Use TypeScript for type safety
- Implement proper error boundaries
- Use Vite plugins for development optimizations
- Implement proper CSS modules or styled-components
- Optimize build with dynamic imports
- Follow React best practices for state management

{{/IDE}}

{{#IDE cursor}}
## Cursor Rules
- Use TypeScript strict mode
- Follow React component patterns
- Use ESLint and Prettier for code consistency
- Implement proper React hooks usage
- Use Vite features for development optimization
{{/IDE}}

{{/IDE}}