# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** Next.js Web Application
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** Next.js
- **Testing:** {{TEST_RUNNER}}
- **Linting:** {{LINTER}}
- **Formatting:** {{FORMATTER}}

## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` before starting work
2. **Development**: Use `npm run dev` or `yarn dev` to start development server
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

### Next.js Specific
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm start            # Start production server
npm test             # Run tests
npm lint             # Run ESLint
npm format           # Format with Prettier
```

## IDE Integration

{{#IDE claude}}
## Claude Code Configuration

### File Patterns
- `app/` - Next.js app directory
- `components/` - React components
- `lib/` - Utility functions and configurations
- `styles/` - CSS/SCSS files
- `public/` - Static assets

### Key Instructions
- Focus on component-based development patterns
- Follow Next.js 13+ app router conventions
- Use TypeScript for type safety
- Implement proper error boundaries
- Optimize for performance with Next.js Image optimization
- Use server components where appropriate
- Implement proper loading states and error handling

{{/IDE}}

{{#IDE cursor}}
## Cursor Configuration

### Cursor Rules
- Use TypeScript strict mode
- Follow Next.js file structure conventions
- Implement proper React patterns (hooks, context, etc.)
- Use ESLint and Prettier for code consistency
- Optimize bundle size with dynamic imports
- Implement proper SEO with Next.js metadata
{{/IDE}}

{{/IDE}}