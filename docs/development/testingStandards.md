# WhatsOnTV Testing Standards

This document outlines the comprehensive testing standards, patterns, and utilities used in the WhatsOnTV application. It serves as a reference for developers working on the codebase to ensure consistent testing practices.

## Table of Contents

1. [Testing Philosophy](#testing-philosophy)
2. [Test Coverage Requirements](#test-coverage-requirements)
3. [Test Directory Structure](#test-directory-structure)
4. [Test Fixtures System](#test-fixtures-system)
   - [JSON Fixtures](#json-fixtures)
   - [Builder Pattern](#builder-pattern)
   - [ShowBuilder Usage](#showbuilder-usage)
   - [Best Practices](#fixture-best-practices)
5. [Mock Implementation System](#mock-implementation-system)
   - [Mock Factories](#mock-factories)
   - [Mock Implementations](#mock-implementations)
   - [Using Mocks in Tests](#using-mocks-in-tests)
6. [Testing Patterns](#testing-patterns)
7. [Mocking Strategy](#mocking-strategy)
8. [Testing ES Modules](#testing-es-modules)
9. [Test Naming Conventions](#test-naming-conventions)

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
│   │   ├── domain/     # Domain model fixtures
│   │   └── helpers/    # Fixture helper utilities
│   ├── helpers/        # Test helper utilities
│   ├── implementations/ # Tests for implementation classes
│   │   ├── console/    # Tests for console implementations
│   │   └── tvmaze/     # Tests for TVMaze implementations
│   ├── interfaces/     # Tests for interface definitions
│   ├── mocks/          # Mock implementations and factories
│   │   ├── factories/  # Factory functions for creating mocks
│   │   └── implementations/ # Mock implementations of interfaces
│   ├── services/       # Tests for service classes
│   └── utils/          # Tests for utility functions
```

## Test Fixtures System

The WhatsOnTV project uses a standardized approach to test fixtures to ensure consistency, maintainability, and readability across all test files.

### JSON Fixtures

Use JSON fixtures when:

- You need consistent, reusable test data across multiple test files
- The test data represents real-world examples (e.g., API responses)
- The data structure is complex and would be verbose to create programmatically
- You want to simulate specific edge cases consistently

JSON fixtures are located in `src/tests/fixtures/domain/` and can be loaded using the `Fixtures` helper.

### Builder Pattern

Use the builder pattern (e.g., `ShowBuilder`) when:

- You need to create variations of objects with specific properties
- You need to create objects dynamically during test execution
- You need to create multiple similar objects with slight variations
- You want to improve test readability by focusing on the properties relevant to the test

### ShowBuilder Usage

The `ShowBuilder` class provides a fluent interface for creating `Show` objects:

```typescript
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';

// Create a basic show
const basicShow = new ShowBuilder()
  .withId(1)
  .withName('Test Show')
  .withNetwork('Test Network')
  .build();

// Create a show with an episode
const episodeShow = new ShowBuilder()
  .withId(2)
  .withName('Episode Show')
  .withEpisode(1, 5) // Season 1, Episode 5
  .build();
```

### Fixture Best Practices

1. **Use Helper Functions**: Create helper functions for common test data patterns to avoid duplication:

   ```typescript
   function createTestEpisode(season: number, number: number): Show {
     return new ShowBuilder()
       .withId(1)
       .withName('Test Show')
       .withEpisode(season, number)
       .build();
   }
   ```

2. **Minimal Test Data**: Only set the properties that are relevant to your test:

   ```typescript
   // Good - only sets properties needed for the test
   const show = new ShowBuilder()
     .withNetwork('CBS')
     .build();

   // Avoid - sets unnecessary properties
   const show = new ShowBuilder()
     .withId(1)
     .withName('Test Show')
     .withNetwork('CBS')
     .withLanguage('English')
     .withType('Scripted')
     .withGenres(['Drama'])
     .withSummary('Test summary')
     .withAirtime('20:00')
     .withEpisode(1, 1)
     .build();
   ```

3. **Consistent Naming**: Use consistent naming conventions for test data:

   ```typescript
   // Descriptive names that indicate the purpose
   const showWithNoAirtime = new ShowBuilder().withAirtime(null).build();
   const englishShow = new ShowBuilder().withLanguage('English').build();
   ```

4. **Array Creation Helpers**: Use the helper functions in `showFixtureHelpers.ts` for creating arrays of shows:

   ```typescript
   import { createShowArrayWithSequentialIds } from '../fixtures/helpers/showFixtureHelpers.js';

   // Create 5 shows with IDs 1-5
   const shows = createShowArrayWithSequentialIds(5);
   ```

## Mock Implementation System

The WhatsOnTV project uses a standardized approach to mocks with centralized mock implementations and factory functions to create properly configured mock instances.

### Mock Factories

Mock factories are reusable functions that create and configure mock instances for testing:

```typescript
import { createMockHttpClient } from '../../mocks/factories/httpClientFactory.js';
import { createMockConfigService } from '../../mocks/factories/configServiceFactory.js';

// Create a mock HTTP client with specific configuration
const mockHttpClient = createMockHttpClient({
  defaultResponse: { data: { result: 'success' }, status: 200, headers: {} },
  errorOnPaths: ['/error']
});

// Create a mock config service with specific settings
const mockConfigService = createMockConfigService({
  date: new Date('2025-04-14'),
  debugMode: true
});
```

The project provides the following mock factories:

1. `configServiceFactory.ts` - Creates mock ConfigService instances
2. `consoleOutputFactory.ts` - Creates mock ConsoleOutput instances
3. `formatterFactory.ts` - Creates mock ShowFormatter instances
4. `httpClientFactory.ts` - Creates mock HttpClient instances
5. `outputServiceFactory.ts` - Creates mock OutputService instances
6. `slackClientFactory.ts` - Creates mock SlackClient instances
7. `styleServiceFactory.ts` - Creates mock StyleService instances
8. `tvShowServiceFactory.ts` - Creates mock TvShowService instances

All factories are exported through a central index.ts file and can be imported as:

```typescript
import { 
  createMockHttpClient, 
  createMockConfigService,
  // other factories...
} from '../../mocks/factories/index.js';
```

### Mock Implementations

For interfaces that require more complex behavior, the project maintains dedicated mock implementations:

```typescript
// Using a mock implementation directly
import { MockSlackClient } from '../../mocks/implementations/mockSlackClient.js';

const slackClient = new MockSlackClient();
```

Mock implementations are found in the `src/tests/mocks/implementations/` directory.

### Using Mocks in Tests

Tests should use mock factories and implementations to create consistent, type-safe mocks:

```typescript
describe('MyService', () => {
  let service: MyService;
  let mockHttpClient: jest.Mocked<HttpClient>;
  let mockConfigService: ConfigService;

  beforeEach(() => {
    // Create mocks using factories
    mockHttpClient = createMockHttpClient();
    mockConfigService = createMockConfigService();

    // Create the service with mocks injected
    service = new MyService(mockHttpClient, mockConfigService);
  });

  it('should fetch data successfully', async () => {
    // Configure mock behavior for this test
    mockHttpClient.get.mockResolvedValueOnce({
      data: { id: 1, name: 'Test' },
      status: 200,
      headers: {}
    });

    // Test the service
    const result = await service.fetchData();
    
    // Verify expectations
    expect(result).toEqual({ id: 1, name: 'Test' });
    expect(mockHttpClient.get).toHaveBeenCalledWith('/data');
  });
});
```

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

By following these testing standards and leveraging our fixture and mock systems, we can maintain high-quality tests that are consistent, maintainable, and effective at catching regressions.
