# What's On TV Documentation

This directory contains technical documentation for the What's On TV project.

## Available Documentation

### Technical Specification
- [`TechSpec.md`](./TechSpec.md): Comprehensive technical documentation including:
  - Project architecture and design decisions
  - Development workflow and best practices
  - Testing strategy and coverage requirements
  - Version constraints and dependencies
  - Code style guidelines and enforcement

## Code Style and Quality

Our project enforces strict code style and quality standards:

1. **ESLint and Prettier Configuration**
   - Semi-colons required
   - Single quotes for strings
   - 100 character line width
   - 2 space indentation
   - No trailing commas

2. **Version Constraints**
   - ESLint v8.x.x (not v9) for TypeScript ecosystem compatibility
   - TypeScript version constraints (>=4.7.4 <5.6.0) for ESLint tooling
   - Jest v29.x.x with jest-runner-eslint integration

3. **Testing Requirements**
   - Minimum 80% branch coverage
   - Current coverage metrics:
     - Statements: 93.87%
     - Branches: 85.32%
     - Functions: 90.90%
     - Lines: 93.02%

## Development Workflow

1. **Feature Development**
   - Create feature branches for all changes
   - Follow code style guidelines
   - Maintain test coverage thresholds
   - Submit pull requests for review

2. **Quality Gates**
   - Pre-commit hooks run tests and linting
   - Linting errors are treated as breaking changes
   - All tests must pass before merge
   - Coverage thresholds must be met
