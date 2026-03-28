# Retired Patterns Archive

This file contains **deprecated patterns and approaches** that are no longer used but worth remembering to avoid repeating mistakes or to understand historical context.

## Purpose

Track patterns that were:
- Replaced by better approaches
- Deprecated due to security concerns
- Removed but might appear in old code
- Tried and failed (anti-patterns to avoid)

## Entry Format

## [YYYY-MM-DD] Pattern Name - [DEPRECATED | REPLACED | FAILED]

**Status:** [DEPRECATED | REPLACED | FAILED | SECURITY-RISK]

**What it was:** Brief description of the pattern or approach.

**Why it was used:** The original reasoning or use case.

**Why it was retired:** The issue or limitation that led to deprecation.

**Replacement:** What to use instead (if applicable).

**Migration notes:** How to update old code using this pattern.

**Deprecated date:** When this pattern was retired.

---

## Example Entry

## [2026-02-15] Direct Database Queries from Controllers - REPLACED

**Status:** REPLACED

**What it was:** Controllers executed SQL queries directly using database client libraries.

**Why it was used:** Quick prototyping, seemed simple for basic CRUD operations.

**Why it was retired:** Created tight coupling between controllers and database schema, made testing difficult, led to SQL injection vulnerabilities in several endpoints, and made schema changes error-prone.

**Replacement:** All database access now goes through the Repository pattern in `lib/repositories/`. Repositories handle data access, mapping, and transactions.

**Migration notes:**
1. Create a repository class in `lib/repositories/`
2. Move all database queries to repository methods
3. Update controllers to use repository methods
4. Add unit tests for repositories

**Deprecated date:** 2026-02-15

---

## Retired Pattern Categories

### Architecture Patterns
- Patterns that defined system structure or organization

### Code Patterns
- Coding approaches, idioms, or conventions

### Library/Tool Choices
- Dependencies or tools that were replaced

### Security Practices
- Approaches that had security issues

### Performance Patterns
- Optimization attempts that failed or had side effects

---

## Important Notes

- **APPEND-ONLY**: Never modify or delete existing entries
- **Dated entries**: Always include the date in the heading
- **Status indicators**: Clear labeling of why the pattern was retired
- **Replacement guidance**: Always specify what to use instead
- **Migration paths**: Help update old code when possible

---

*This archive is managed by the agentic-memory skill. Entries are added with user approval only.*
