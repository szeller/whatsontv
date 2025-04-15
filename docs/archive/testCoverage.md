# WhatsOnTV Test Coverage Assessment and Improvement Plan

## Current Test Coverage Status

As of April 14, 2025, the WhatsOnTV application has the following test coverage metrics:

| Metric      | Current | Target | Gap    |
|-------------|---------|--------|--------|
| Statements  | 73.26%  | 80%    | 6.74%  |
| Branches    | 69.74%  | 80%    | 10.26% |
| Functions   | 61%     | 80%    | 19%    |
| Lines       | 73.83%  | 80%    | 6.17%  |

## Files with Low Coverage

The following files have been identified as having insufficient test coverage:

1. **src/implementations/console/consoleOutputServiceImpl.ts** (34.78% line coverage)
   - Missing tests for lines 58-59, 81-197
   - Functions with 0% branch coverage

2. **src/implementations/gotHttpClientImpl.ts** (71.42% line coverage)
   - Missing tests for lines 88-196, 210-216
   - Only 50.76% branch coverage

3. **src/implementations/tvMazeServiceImpl.ts** (68.18% line coverage)
   - Missing tests for various lines including error handling paths

4. **src/utils/showUtils.ts** (60.65% line coverage)
   - Missing tests for lines 73, 112-176, 188
   - Only 40% function coverage

5. **src/tests/implementations/test/testOutputServiceImpl.ts** (40% line coverage)
   - Missing tests for lines 14, 31, 39-60, 68

## Recent Improvements

### fileUtils.ts (100% coverage)

We've successfully improved test coverage for the `fileUtils.ts` module to 100% across all metrics. This was achieved by:

1. Creating focused tests for pure functions (`parseConfigFile`, `handleConfigError`)
2. Adding tests for edge cases (invalid JSON handling)
3. Using a pragmatic approach that avoids complex mocking of ES modules

This improvement demonstrates our commitment to increasing test coverage across the codebase and serves as a model for testing other utility modules.

## Test Structure Assessment

### Strengths

1. **Test Organization**: Tests are well-organized and follow the same structure as the implementation files.
2. **Mocking Strategy**: Most tests use proper mocking for dependencies.
3. **Test Coverage Reporting**: The project has configured Jest to report coverage metrics.
4. **Pure Function Testing**: Pure functions are tested directly without complex mocking.

### Weaknesses

1. **Incomplete Test Coverage**: Many functions and branches are not tested.
2. **Inconsistent Mocking Approach**: Some tests use subclassing for mocking, while others use Jest mocks.
3. **Missing Integration Tests**: No tests for the CLI entry point.
4. **Insufficient Error Handling Tests**: Error paths are not well-tested.

## Detailed Improvement Plan

### 1. ConsoleOutputServiceImpl Tests

The `ConsoleOutputServiceImpl` class has the lowest coverage (34.78%). The following tests should be added:

```typescript
// File: src/tests/implementations/console/consoleOutputServiceImpl.test.ts

// Add these tests to the existing test file

describe('displayNetworkGroups', () => {
  it('should format and display network groups', async () => {
    // Arrange
    const mockNetworkGroups = {
      'Network A': [mockShow],
      'Network B': [mockShow]
    };
    
    // Act
    await service.displayNetworkGroups(mockNetworkGroups, false);
    
    // Assert
    expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledWith(mockNetworkGroups, false);
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('Formatted network output');
  });
  
  it('should sort shows by time when timeSort is true', async () => {
    // Arrange
    const mockNetworkGroups = {
      'Network A': [mockShow],
      'Network B': [mockShow]
    };
    
    // Act
    await service.displayNetworkGroups(mockNetworkGroups, true);
    
    // Assert
    expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledWith(mockNetworkGroups, true);
  });
});

describe('isInitialized', () => {
  it('should return true when properly initialized', () => {
    // Act
    const result = service.isInitialized();
    
    // Assert
    expect(result).toBe(true);
  });
  
  it('should return false when formatter is not initialized', () => {
    // Arrange
    (service as any).formatter = undefined;
    
    // Act
    const result = service.isInitialized();
    
    // Assert
    expect(result).toBe(false);
  });
  
  it('should return false when output is not initialized', () => {
    // Arrange
    (service as any).output = undefined;
    
    // Act
    const result = service.isInitialized();
    
    // Assert
    expect(result).toBe(false);
  });
});

describe('parseArgs', () => {
  it('should parse command line arguments with defaults', () => {
    // Mock yargs to return a predictable result
    jest.mock('yargs', () => {
      return {
        options: jest.fn().mockReturnThis(),
        help: jest.fn().mockReturnThis(),
        parse: jest.fn().mockReturnValue({
          date: '2025-03-23',
          country: 'US',
          types: [],
          networks: [],
          languages: [],
          version: false
        })
      };
    });
    
    // Act
    const args = service.parseArgs(['--date', '2025-03-23']);
    
    // Assert
    expect(args.date).toBe('2025-03-23');
    expect(args.country).toBe('US');
  });
  
  it('should handle array parameters correctly', () => {
    // Mock yargs for array parameters
    jest.mock('yargs', () => {
      return {
        options: jest.fn().mockReturnThis(),
        help: jest.fn().mockReturnThis(),
        parse: jest.fn().mockReturnValue({
          date: '2025-03-23',
          country: 'US',
          types: ['Scripted', 'Reality'],
          networks: [],
          languages: ['English', 'Spanish']
        })
      };
    });
    
    // Act
    const args = service.parseArgs(['--types', 'Scripted,Reality']);
    
    // Assert
    expect(args.types).toEqual(['Scripted', 'Reality']);
  });
});

describe('displayHeader', () => {
  it('should display the application header', () => {
    // Act
    service.displayHeader();
    
    // Assert
    expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('WhatsOnTV'));
  });
  
  it('should include version information in the header', () => {
    // Act
    service.displayHeader();
    
    // Assert
    expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('v'));
  });
  
  it('should include date in the header when provided', () => {
    // Arrange
    const date = '2025-03-23';
    
    // Act
    service.displayHeader(date);
    
    // Assert
    expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('2025-03-23'));
  });
  
  it('should include today\'s date when no date is provided', () => {
    // Mock date
    const mockDate = new Date('2025-03-23');
    jest.spyOn(global, 'Date').mockImplementation(() => mockDate as any);
    
    // Act
    service.displayHeader();
    
    // Assert
    expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('2025-03-23'));
    
    // Restore Date
    jest.restoreAllMocks();
  });
});
```

### 2. GotHttpClientImpl Tests

The `GotHttpClientImpl` class needs additional tests for error handling and edge cases:

```typescript
// File: src/tests/implementations/gotHttpClientImpl.test.ts

// Add these tests to the existing test file

describe('error handling', () => {
  it('should handle 404 errors properly', async () => {
    // Setup mock response with Nock
    nock(BASE_URL)
      .get('/not-found')
      .reply(404, 'Not Found');
    
    // Execute and expect error
    await expect(client.get('/not-found'))
      .rejects
      .toThrow();
    
    // Verify error is properly formatted
    try {
      await client.get('/not-found');
    } catch (error) {
      expect(error.status).toBe(404);
      expect(error.message).toContain('Not Found');
    }
  });
  
  it('should handle network errors properly', async () => {
    // Setup mock response with Nock
    nock(BASE_URL)
      .get('/network-error')
      .replyWithError('Network error');
    
    // Execute and expect error
    await expect(client.get('/network-error'))
      .rejects
      .toThrow();
    
    // Verify error is properly formatted
    try {
      await client.get('/network-error');
    } catch (error) {
      expect(error.message).toContain('Network error');
    }
  });
  
  it('should handle malformed JSON responses', async () => {
    // Setup mock response with Nock
    nock(BASE_URL)
      .get('/malformed-json')
      .reply(200, '{not valid json}', { 'content-type': 'application/json' });
    
    // Execute and expect error
    await expect(client.get('/malformed-json'))
      .rejects
      .toThrow();
  });
});

describe('transformResponse', () => {
  it('should transform a JSON response correctly', () => {
    // Create a mock response
    const mockResponse = {
      statusCode: 200,
      headers: { 'content-type': 'application/json' },
      body: '{"key": "value"}'
    } as unknown as Response;
    
    // Call the method directly
    const result = client['transformResponse'](mockResponse);
    
    // Verify the result
    expect(result).toEqual({
      status: 200,
      headers: { 'content-type': 'application/json' },
      data: { key: 'value' }
    });
  });
  
  it('should transform a text response correctly', () => {
    // Create a mock response
    const mockResponse = {
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'plain text response'
    } as unknown as Response;
    
    // Call the method directly
    const result = client['transformResponse'](mockResponse);
    
    // Verify the result
    expect(result).toEqual({
      status: 200,
      headers: { 'content-type': 'text/plain' },
      data: 'plain text response'
    });
  });
  
  it('should handle empty responses correctly', () => {
    // Create a mock response
    const mockResponse = {
      statusCode: 204,
      headers: {},
      body: ''
    } as unknown as Response;
    
    // Call the method directly
    const result = client['transformResponse'](mockResponse);
    
    // Verify the result
    expect(result).toEqual({
      status: 204,
      headers: {},
      data: ''
    });
  });
});

describe('post with different content types', () => {
  it('should handle form data', async () => {
    // Setup mock response with Nock
    const formData = new URLSearchParams();
    formData.append('key', 'value');
    
    nock(BASE_URL)
      .post('/form', formData.toString())
      .reply(200, { success: true });
    
    // Execute request
    const response = await client.post('/form', formData, {
      headers: { 'content-type': 'application/x-www-form-urlencoded' }
    });
    
    // Verify response
    expect(response.data).toEqual({ success: true });
  });
  
  it('should handle JSON data', async () => {
    // Setup mock response with Nock
    const jsonData = { key: 'value' };
    
    nock(BASE_URL)
      .post('/json', jsonData)
      .reply(200, { success: true });
    
    // Execute request
    const response = await client.post('/json', jsonData);
    
    // Verify response
    expect(response.data).toEqual({ success: true });
  });
});
```

### 3. TvMazeServiceImpl Tests

The `TvMazeServiceImpl` class needs additional tests for error handling and edge cases:

```typescript
// File: src/tests/implementations/tvMazeServiceImpl.test.ts

// Add these tests to the existing test file

describe('error handling', () => {
  it('should return an empty array when getShowsByDate encounters an error', async () => {
    // Arrange
    mockHttpClient.get.mockRejectedValue(new Error('API Error'));
    
    // Act
    const result = await service.getShowsByDate('2025-03-23', 'US');
    
    // Assert
    expect(result).toEqual([]);
    expect(mockHttpClient.get).toHaveBeenCalled();
  });
  
  it('should return an empty array when getShowsByNetwork encounters an error', async () => {
    // Arrange
    mockHttpClient.get.mockRejectedValue(new Error('API Error'));
    
    // Act
    const result = await service.getShowsByNetwork(123);
    
    // Assert
    expect(result).toEqual([]);
    expect(mockHttpClient.get).toHaveBeenCalled();
  });
  
  it('should return an empty array when getEpisodesByShowId encounters an error', async () => {
    // Arrange
    mockHttpClient.get.mockRejectedValue(new Error('API Error'));
    
    // Act
    const result = await service.getEpisodesByShowId(123);
    
    // Assert
    expect(result).toEqual([]);
    expect(mockHttpClient.get).toHaveBeenCalled();
  });
});

describe('data transformation', () => {
  it('should transform network shows correctly', async () => {
    // Arrange
    const mockApiResponse = [
      {
        show: {
          id: 1,
          name: 'Test Show',
          network: { name: 'Test Network' },
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          schedule: { time: '20:00', days: ['Monday'] }
        },
        airdate: '2025-03-23',
        airtime: '20:00'
      }
    ];
    
    mockHttpClient.get.mockResolvedValue({ data: mockApiResponse });
    
    // Act
    const result = await service.getShowsByDate('2025-03-23', 'US');
    
    // Assert
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Test Show');
    expect(result[0].network).toBe('Test Network');
  });
  
  it('should filter shows by type correctly', async () => {
    // Arrange
    const mockApiResponse = [
      {
        show: {
          id: 1,
          name: 'Scripted Show',
          network: { name: 'Test Network' },
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          schedule: { time: '20:00', days: ['Monday'] }
        },
        airdate: '2025-03-23',
        airtime: '20:00'
      },
      {
        show: {
          id: 2,
          name: 'Reality Show',
          network: { name: 'Test Network' },
          type: 'Reality',
          language: 'English',
          genres: ['Reality'],
          status: 'Running',
          schedule: { time: '21:00', days: ['Monday'] }
        },
        airdate: '2025-03-23',
        airtime: '21:00'
      }
    ];
    
    mockHttpClient.get.mockResolvedValue({ data: mockApiResponse });
    
    // Act
    const result = await service.getShowsByDate('2025-03-23', 'US', { types: ['Scripted'] });
    
    // Assert
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Scripted Show');
  });
  
  it('should filter shows by network correctly', async () => {
    // Arrange
    const mockApiResponse = [
      {
        show: {
          id: 1,
          name: 'Network A Show',
          network: { name: 'Network A' },
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          schedule: { time: '20:00', days: ['Monday'] }
        },
        airdate: '2025-03-23',
        airtime: '20:00'
      },
      {
        show: {
          id: 2,
          name: 'Network B Show',
          network: { name: 'Network B' },
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          status: 'Running',
          schedule: { time: '21:00', days: ['Monday'] }
        },
        airdate: '2025-03-23',
        airtime: '21:00'
      }
    ];
    
    mockHttpClient.get.mockResolvedValue({ data: mockApiResponse });
    
    // Act
    const result = await service.getShowsByDate('2025-03-23', 'US', { networks: ['Network A'] });
    
    // Assert
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Network A Show');
  });
});
```

## CLI Integration Tests

To ensure the CLI works correctly, add these integration tests:

```typescript
// File: src/tests/integration/cli/cli.test.ts

import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  it('should display help information', async () => {
    // Run the CLI script with --help
    const { stdout } = await execAsync('node dist/cli.js --help');
    
    // Assert
    expect(stdout).toContain('Options:');
    expect(stdout).toContain('--date');
    expect(stdout).toContain('--country');
  });
  
  it('should handle --version argument', async () => {
    // Run the CLI script with --version
    const { stdout } = await execAsync('node dist/cli.js --version');
    
    // Assert
    expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Should output a version number
  });
  
  it('should handle invalid arguments gracefully', async () => {
    try {
      // Run the CLI script with an invalid argument
      await execAsync('node dist/cli.js --invalid-arg');
      fail('Should have thrown an error');
    } catch (error) {
      // Assert
      expect(error.stderr).toContain('Unknown argument: invalid-arg');
    }
  });
  
  it('should filter shows by type', async () => {
    // Run the CLI script with type filter
    const { stdout } = await execAsync('node dist/cli.js --types Scripted');
    
    // Assert
    expect(stdout).toContain('WhatsOnTV');
    // Additional assertions would depend on the actual output format
  });
});
```

## Tests to Refactor or Delete

### 1. Tests to Refactor

1. **ConsoleOutputServiceImpl Tests**:
   - Refactor to use proper dependency injection instead of subclassing
   - Improve test coverage for all methods

2. **GotHttpClient Tests**:
   - Consolidate duplicate test logic
   - Improve error handling tests

3. **TvMazeServiceImpl Tests**:
   - Refactor to use consistent mocking approach
   - Add more comprehensive test cases

### 2. Tests to Consider Deleting

1. **src/tests/utils/testHelpers.ts** (7.14% function coverage):
   - This file has very low coverage and may contain unused helper functions
   - Evaluate if the helpers are still needed after refactoring

2. **Duplicate Test Files**:
   - Check for any remaining duplicate test files after the refactoring
   - Remove or merge duplicate test files to maintain a clean test structure

## Implementation Strategy

To implement these test improvements efficiently, follow this step-by-step approach:

1. **Start with the Lowest Coverage Files**:
   - Begin with `ConsoleOutputServiceImpl` (34.78% coverage)
   - Then move to `GotHttpClientImpl` (71.42% coverage)

2. **Implement Tests in Order**:
   - Add missing tests for each file as outlined above
   - Run tests after each implementation to verify coverage improvement

3. **Create Helper Functions**:
   - Implement test data creation helpers to reduce duplication
   - Create mock factory functions for common dependencies

4. **Standardize Mocking Approach**:
   - Use Jest mocks consistently across all tests
   - Avoid subclassing for testing purposes

5. **Add Integration Tests Last**:
   - Implement CLI integration tests after unit tests are complete
   - Ensure they run in a controlled environment

## Expected Results

After implementing all the recommended tests, the coverage metrics should improve to:

| Metric      | Current | Target | Expected After Implementation |
|-------------|---------|--------|------------------------------|
| Statements  | 73.26%  | 80%    | 85%+                         |
| Branches    | 69.74%  | 80%    | 80%+                         |
| Functions   | 61%     | 80%    | 80%+                         |
| Lines       | 73.83%  | 80%    | 85%+                         |

## Conclusion

This test coverage improvement plan provides a comprehensive approach to increasing the test coverage of the WhatsOnTV application. By following the detailed implementation steps and adding the suggested tests, the application will reach the target coverage of 80% across all metrics.

The plan focuses on:
1. Adding missing tests for uncovered code paths
2. Standardizing the mocking approach
3. Implementing integration tests for the CLI
4. Refactoring or removing problematic tests

This structured approach ensures that the most critical components are tested first, with a clear path to achieving the desired coverage targets. The recent success with achieving 100% coverage for the `fileUtils.ts` module demonstrates the effectiveness of our focused testing approach.
