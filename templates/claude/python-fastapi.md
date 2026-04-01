# {{PROJECT_NAME}}

> Status: **Draft** - Review and complete <!-- TODO --> sections before using

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** Python FastAPI Web API
**Description:** <!-- TODO: Add project description -->

### Technology Stack

- **Language:** Python
- **Framework:** FastAPI
- **Testing:** {{TEST_RUNNER}}
- **Linting:** {{LINTER}}
- **Formatting:** {{FORMATTER}}

## Standard Operating Procedures

1. **Sync State**: Run `rosetta sync` before starting work
2. **Development**: Use `uvicorn` or `fastapi dev` to start development server
3. **Testing**: Run `pytest` before committing changes
4. **Build**: Build Docker image for deployment
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

### Python Specific
```bash
python -m uvicorn main:app --reload  # Start development server
pytest                           # Run tests
black .                           # Format with Black
flake8                           # Run flake8 linting
mypy .                           # Run mypy type checking
docker build -t {{PROJECT_NAME}}  # Build Docker image
```

## IDE Integration

{{#IDE claude}}
## Claude Code Configuration

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

### Key Instructions
- Focus on API development patterns
- Follow FastAPI conventions and best practices
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

{{/IDE}}

{{#IDE cursor}}
## Cursor Rules
- Use Python type hints consistently
- Follow FastAPI patterns and conventions
- Use Black and flake8 for code consistency
- Implement proper error handling
- Use environment variables for secrets
- Implement proper database patterns with SQLAlchemy
{{/IDE}}

{{/IDE}}