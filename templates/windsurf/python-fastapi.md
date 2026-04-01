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

## Windsurf Configuration

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

### Key Features
- FastAPI framework
- Python async support
- Pydantic data validation
- OpenAPI documentation
- Dependency injection system
- Authentication middleware
- Database integration
- Docker deployment
- Testing with pytest
- Type checking with mypy

### Key Features
- FastAPI framework
- Python async support
- Pydantic data validation
- OpenAPI documentation
- Dependency injection system
- Authentication middleware
- Database integration
- Docker deployment
- Testing with pytest
- Type checking with mypy