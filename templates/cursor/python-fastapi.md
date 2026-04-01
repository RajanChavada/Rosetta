# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** Python FastAPI Web API
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** {{LANGUAGE}}
- **Framework:** {{FRAMEWORK}}
- **Testing:** {{TEST_RUNNER}}
- **Linting:** {{LINTER}}
- **Formatting:** {{FORMATTER}}

## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` before starting work
2. **Development**: Use `uvicorn` or `fastapi dev` to start development server
3. **Testing**: Run `pytest` before committing changes
4. **Build**: Build Docker image for deployment

## Conventions

<!-- TODO: Add project conventions -->

## Commands

### Development
```bash
{{DEV_COMMAND}}
{{BUILD_COMMAND}}
{{TEST_COMMAND}}
```

### Python Specific
```bash
python -m uvicorn main:app --reload  # Start development server
pytest                           # Run tests
black .                           # Format with Black
flake8                           # Run flake8 linting
mypy .                           # Run mypy type checking
docker build -t {{PROJECT_NAME}}  # Build Docker image
```

## Cursor Rules

### File Patterns
- `src/` - Source code directory
- `src/main.py` - FastAPI application entry point
- `src/api/` - API endpoints
- `src/models/` - Pydantic models
- `src/services/` - Business logic services
- `src/utils/` - Utility functions
- `tests/` - Test files
- `requirements.txt` - Python dependencies
- `pyproject.toml` - Project configuration

### Development Patterns
- Use Python type hints consistently
- Follow FastAPI patterns and conventions
- Use Pydantic models for data validation
- Implement proper dependency injection
- Use async/await for async operations
- Implement proper error handling
- Use environment variables for configuration
- Follow Python type hints conventions
- Implement proper logging with structlog
- Use SQLAlchemy for database operations
- Implement proper authentication with OAuth2/JWT
- Follow OpenAPI/Swagger documentation conventions

### Key Commands
- `Ctrl+Shift+P` → "Python: Run Test File" for running tests
- `Ctrl+Shift+P` → "Python: Format Document" for formatting
- `F5` to start debugging with Python debugger
- `Ctrl+F5` to start debugging without breakpoints

### Cursor AI Context
- Focus on API development with FastAPI
- Python type safety with mypy
- Async programming patterns
- Database integration with SQLAlchemy
- Authentication with JWT/OAuth2
- OpenAPI/Swagger documentation
- Docker containerization patterns

### Key Commands
- `Ctrl+Shift+P` → "Python: Run Test File" for running tests
- `Ctrl+Shift+P` → "Python: Format Document" for formatting
- `F5` to start debugging with Python debugger
- `Ctrl+F5` to start debugging without breakpoints

### Cursor AI Context
- Focus on API development with FastAPI
- Python type safety with mypy
- Async programming patterns
- Database integration with SQLAlchemy
- Authentication with JWT/OAuth2
- OpenAPI/Swagger documentation
- Docker containerization patterns