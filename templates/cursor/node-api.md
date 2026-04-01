# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** Node.js API Server
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Runtime:** Node.js
- **Framework:** Express/NestJS
- **Testing:** {{TEST_RUNNER}}
- **Linting:** {{LINTER}}
- **Formatting:** {{FORMATTER}}

## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` before starting work
2. **Development**: Use `npm run dev` to start development server
3. **Testing**: Run `npm test` before committing changes
4. **Build**: Run `npm run build` to create production build (if applicable)

## Conventions

<!-- TODO: Add project conventions -->

## Commands

### Development
```bash
{{DEV_COMMAND}}
{{BUILD_COMMAND}}
{{TEST_COMMAND}}
```

### Node.js Specific
```bash
npm run dev          # Start development server
npm test             # Run tests
npm lint             # Run ESLint
npm format           # Format with Prettier
npm start            # Start production server (if applicable)
```

## Cursor Rules

### File Patterns
- `src/` - Source code directory
- `src/controllers/` - Route controllers
- `src/models/` - Data models
- `src/services/` - Business logic services
- `src/middleware/` - Express middleware
- `src/utils/` - Utility functions
- `tests/` - Test files

### Development Patterns
- Use TypeScript strict mode
- Focus on API development patterns
- Follow RESTful API conventions
- Use TypeScript for type safety
- Implement proper error handling middleware
- Implement proper authentication/authorization
- Use environment variables for configuration
- Implement proper logging
- Follow Express/NestJS best practices
- Implement proper request validation
- Use async/await for async operations
- Implement proper database connection patterns

### Key Commands
- `Ctrl+Shift+P` → "Tasks: Run Test Task" for running tests
- `Ctrl+Shift+P` → "Terminal: Run Build Task" for building
- `F5` to start debugging API endpoints
- `Ctrl+F5` to start debugging without breakpoints

### Cursor AI Context
- Focus on API development patterns
- RESTful API design principles
- TypeScript for backend development
- Authentication and authorization patterns
- Database integration patterns
- Error handling best practices
- Testing strategies for APIs