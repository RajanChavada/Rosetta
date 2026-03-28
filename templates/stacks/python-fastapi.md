# {{PROJECT_NAME}}

> Primary configuration: rosetta.yaml (if present) or CLAUDE.md

## Project Overview

**Name:** {{PROJECT_NAME}}
**Type:** api
**Description:** A FastAPI web service

### Technology Stack

- **Language:** Python
- **Framework:** FastAPI
- **Testing:** {{TEST_RUNNER}}
- **Linter:** {{LINTER}}
- **Formatter:** {{FORMATTER}}
- **Risk Level:** medium

{{#IDE claude}}
## Standard Operating Procedures

1. **Virtual Environment**: Always activate venv before working
2. **Type Hints**: Use type hints for all function signatures
3. **Verification**: Run tests and type checker before committing

## Project Guardrails

- **Async**: Use async/await for database and external API calls
- **Pydantic**: All request/response bodies use Pydantic models
- **Testing**: Write tests for all endpoints
{{/IDE}}

## Conventions

### FastAPI
- **[Enforced]** Use async route handlers
- **[Enforced]** Pydantic models for request/response validation
- **[Enforced]** Type hints for all functions

### Python
- **[Enforced]** Follow PEP 8 style guide
- **[Enforced]** Use type hints
- **[Enforced]** Document public APIs with docstrings

## Commands

### Development
```bash
source venv/bin/activate
uvicorn main:app --reload
pytest
black .
ruff check .
```

## Notes

### GOTCHA - Async Context
**Priority:** 8
When using async route handlers, ensure database clients and HTTP clients support async.

### GOTCHA - Pydantic Validation
**Priority:** 7
Pydantic validates automatically. Use `@model_validator` for custom validation logic.
