# WhatsOnTV Testing Standards

This document outlines the testing standards, patterns, and utilities used in the WhatsOnTV application. It serves as a reference for developers working on the codebase to ensure consistent testing practices.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Coverage Requirements](#test-coverage-requirements)
3. [Test Directory Structure](#test-directory-structure)
4. [Test Fixtures System](#test-fixtures-system)
5. [Testing Patterns](#testing-patterns)
6. [Mocking Strategy](#mocking-strategy)
7. [Testing ES Modules](#testing-es-modules)
8. [Test Naming Conventions](#test-naming-conventions)

## Testing Philosophy

The WhatsOnTV project follows these core testing principles:

- **Test-driven development** is encouraged for new features
- **High test coverage** is maintained across the codebase
- **Domain fixtures** are used for testing consistency
- **Tests should be independent** and not rely on external services
- **Both unit and integration tests** are required for comprehensive coverage

## Test Coverage Requirements

In accordance with our development standards, we maintain the following minimum coverage thresholds:

- **80%** statement coverage
- **80%** branch coverage
- **80%** function coverage
- **80%** line coverage

Coverage reports are generated using Jest's built-in coverage reporter and can be viewed by running:

```bash
npm run test:coverage
```

## Test Directory Structure

Tests are organized to mirror the source code structure:

```
src/
├── tests/
│   ├── fixtures/       # Test fixtures and test data
│   ├── helpers/        # Test helper utilities
│   ├── implementations/ # Tests for implementation classes
│   │   ├── console/    # Tests for console implementations
│   │   └── tvmaze/     # Tests for TVMaze implementations
│   ├── interfaces/     # Tests for interface definitions
│   ├── services/       # Tests for service classes
│   └── utils/          # Tests for utility functions
```

## Test Fixtures System

### Fixture Organization

The WhatsOnTV project uses a comprehensive fixtures system located in `src/tests/fixtures/` to provide consistent test data across all tests:

```
src/tests/fixtures/
├── domain/             # Domain model fixtures
│   ├── networks.ts     # Network groups fixtures
│   └── shows.ts        # Show domain model fixtures
├── tvmaze/             # TVMaze API fixtures
│   ├── models.ts       # TVMaze API model fixtures
│   └── *.json          # Raw JSON fixture data
└── index.ts            # Main export file
```

### Using Fixtures in Tests

The fixtures are exported through a centralized `Fixtures` object that provides access to all test data:

```typescript
import { Fixtures } from '../../fixtures/index.js';

describe('MyComponent', () => {
  it('should process shows correctly', () => {
    // Get sample network shows
    const shows = Fixtures.domain.getNetworkShows();
    
    // Use the fixture data in your test
    const result = myComponent.processShows(shows);
    expect(result).toBeDefined();
  });
});
```

### Available Fixture Categories

1. **Domain Fixtures**
   - `Fixtures.domain.getNetworkShows()` - Sample network TV shows
   - `Fixtures.domain.getStreamingShows()` - Sample streaming shows
   - `Fixtures.domain.getCableShows()` - Sample cable shows
   - `Fixtures.domain.getAllShows()` - Combined array of all show types
   - `Fixtures.domain.getNetworkGroups()` - Sample network groups object

2. **TVMaze API Fixtures**
   - `Fixtures.tvMaze.getSchedule()` - Raw TVMaze schedule data
   - `Fixtures.tvMaze.getNetworkSchedule()` - Network schedule data
   - `Fixtures.tvMaze.getWebSchedule()` - Web/streaming schedule data
   - `Fixtures.tvMaze.getCombinedSchedule()` - Combined schedule data
   - `Fixtures.tvMaze.loadNetworkShows()` - Transformed network shows
   - `Fixtures.tvMaze.loadWebShows()` - Transformed web shows

### Extending Fixtures

When adding new test cases that require specific data patterns, extend the existing fixtures rather than creating inline test data:

1. Add your new fixture function to the appropriate file in `src/tests/fixtures/`
2. Follow the established naming conventions and documentation patterns
3. Export the function through the main `index.ts` file

## Testing Patterns

### Unit Tests

Unit tests should follow the Arrange-Act-Assert (AAA) pattern:

```typescript
describe('MyFunction', () => {
  it('should return expected result', () => {
    // Arrange
    const input = Fixtures.domain.getNetworkShows();
    const expected = 'expected result';
    
    // Act
    const result = myFunction(input);
    
    // Assert
    expect(result).toBe(expected);
  });
});
```

### Integration Tests

Integration tests should test the interaction between multiple components:

```typescript
describe('MyService integration', () => {
  it('should integrate with dependencies correctly', async () => {
    // Arrange
    const mockDependency = createMockDependency();
    const service = new MyService(mockDependency);
    const input = Fixtures.domain.getNetworkShows();
    
    // Act
    const result = await service.processData(input);
    
    // Assert
    expect(mockDependency.method).toHaveBeenCalledWith(expect.any(Object));
    expect(result).toEqual(expect.objectContaining({
      processed: true
    }));
  });
});
```

## Mocking Strategy

### Dependency Injection

The WhatsOnTV project uses dependency injection to facilitate testing. Mock implementations should be provided through the constructor:

```typescript
// Create mock implementations
const mockTvShowService = {
  getShows: jest.fn().mockResolvedValue(Fixtures.domain.getNetworkShows())
};

// Inject mocks into the class under test
const service = new ConsoleOutputServiceImpl(mockTvShowService, mockFormatter);
```

### Jest Mocks

For utility functions or external dependencies, use Jest's mocking capabilities:

```typescript
// Mock a function using spyOn
jest.spyOn(fs, 'readFileSync').mockReturnValue('{"key": "value"}');

// Restore mocks after test
afterEach(() => {
  jest.restoreAllMocks();
});
```

### Pragmatic Testing Approach

When testing ES modules and pure functions, follow these pragmatic guidelines:

1. **Focus on Pure Functions**: Test pure functions directly without complex mocking
2. **Use spyOn for Mocking**: Prefer `jest.spyOn()` over direct module mocking when possible
3. **Mock at the Function Level**: Mock specific functions rather than entire modules
4. **Restore Mocks**: Always restore mocks after tests to prevent test pollution
5. **Test Edge Cases**: Include tests for error handling and edge cases

This approach has proven effective in achieving high test coverage while maintaining test simplicity, as demonstrated in the `fileUtils.ts` module tests.

## Testing ES Modules

Testing ES modules can be challenging due to their import/export behavior. Follow these best practices:

1. **Direct Testing**: When possible, test the exported functions directly rather than mocking the entire module
2. **Function Spying**: Use `jest.spyOn()` to mock specific imported functions:
   ```typescript
   import * as fs from 'fs';
   
   jest.spyOn(fs, 'readFileSync').mockImplementation(() => '{"key": "value"}');
   ```
3. **Avoid Manual Mocks**: Prefer direct mocking over creating manual mock files in `__mocks__` directories
4. **Test Pure Functions**: Focus on testing the pure logic of functions, isolating them from external dependencies
5. **Error Handling**: Include tests for error scenarios, especially for file operations and parsing functions

Example of testing a function that uses ES module imports:

```typescript
import { parseConfigFile } from '../../../utils/fileUtils.js';
import * as fs from 'fs';

describe('parseConfigFile', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should parse valid JSON content', () => {
    // Arrange
    const mockContent = '{"key": "value"}';
    
    // Act
    const result = parseConfigFile(mockContent);
    
    // Assert
    expect(result).toEqual({ key: 'value' });
  });

  it('should handle invalid JSON content', () => {
    // Arrange
    const mockContent = 'invalid json';
    
    // Act & Assert
    expect(() => parseConfigFile(mockContent)).toThrow();
  });
});
```

## Test Naming Conventions

- **Test files**: Should match the file they're testing with `.test.ts` suffix
- **Test suites**: Use `describe()` to group related tests
- **Test cases**: Use `it()` with a clear description of what's being tested
- **Test descriptions**: Should describe the expected behavior, not the implementation

```typescript
// Good
describe('formatEpisodeRanges', () => {
  it('should format consecutive episodes as ranges', () => {
    // Test implementation
  });
  
  it('should handle non-consecutive episodes separately', () => {
    // Test implementation
  });
});

// Avoid
describe('formatEpisodeRanges', () => {
  it('test case 1', () => {
    // Test implementation
  });
  
  it('runs the function with multiple episodes', () => {
    // Test implementation
  });
});
```

By following these testing standards and leveraging our fixture system, we can maintain high-quality tests that are consistent, maintainable, and effective at catching regressions.
