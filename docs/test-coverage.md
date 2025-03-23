# WhatsOnTV Test Coverage Assessment and Improvement Plan

## Current Test Coverage Status

As of March 23, 2025, the WhatsOnTV application has the following test coverage metrics:

| Metric      | Current | Target | Gap    |
|-------------|---------|--------|--------|
| Statements  | 71.26%  | 80%    | 8.74%  |
| Branches    | 67.74%  | 80%    | 12.26% |
| Functions   | 59%     | 80%    | 21%    |
| Lines       | 71.83%  | 80%    | 8.17%  |

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

## Test Structure Assessment

### Strengths

1. **Test Organization**: Tests are well-organized and follow the same structure as the implementation files.
2. **Mocking Strategy**: Most tests use proper mocking for dependencies.
3. **Test Coverage Reporting**: The project has configured Jest to report coverage metrics.

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
        alias: jest.fn().mockReturnThis(),
        version: jest.fn().mockReturnThis(),
        parseSync: jest.fn().mockReturnValue({
          date: '2025-03-23',
          country: 'US',
          timeSort: false,
          query: '',
          slack: false,
          showId: 0,
          limit: 0,
          debug: false,
          help: false,
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
        alias: jest.fn().mockReturnThis(),
        version: jest.fn().mockReturnThis(),
        parseSync: jest.fn().mockReturnValue({
          types: ['Scripted', 'Reality'],
          networks: ['HBO', 'Netflix'],
          genres: ['Drama', 'Comedy'],
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
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('==============================');
  });
});

describe('displayFooter', () => {
  it('should display the application footer', () => {
    // Act
    service.displayFooter();
    
    // Assert
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('==============================');
    expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('TVMaze API'));
  });
});

describe('displayShows with empty array', () => {
  it('should display a message when no shows are found', async () => {
    // Act
    await service.displayShows([], false);
    
    // Assert
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('No shows found for the specified criteria.');
    expect(mockShowFormatter.formatNetworkGroups).not.toHaveBeenCalled();
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
      .toThrow('Request Error: HTTP Error 404: Not Found');
  });
  
  it('should handle 500 server errors', async () => {
    // Setup mock response with Nock
    nock(BASE_URL)
      .get('/server-error')
      .reply(500, 'Internal Server Error');
    
    // Execute and expect error
    await expect(client.get('/server-error'))
      .rejects
      .toThrow('Request Error: HTTP Error 500: Internal Server Error');
  });
  
  it('should handle network errors', async () => {
    // Setup Nock to simulate a network error
    nock(BASE_URL)
      .get('/network-error')
      .replyWithError('Network error: Connection refused');
    
    // Execute and expect error
    await expect(client.get('/network-error'))
      .rejects
      .toThrow('Network Error: Network error: Connection refused');
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
  
  it('should handle non-JSON content types', () => {
    // Create a mock response
    const mockResponse = {
      statusCode: 200,
      headers: { 'content-type': 'text/plain' },
      body: 'Plain text response'
    } as unknown as Response;
    
    // Call the method directly
    const result = client['transformResponse'](mockResponse);
    
    // Verify the result
    expect(result).toEqual({
      status: 200,
      headers: { 'content-type': 'text/plain' },
      data: 'Plain text response'
    });
  });
  
  it('should handle empty responses', () => {
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
      .post('/form', 'key=value')
      .reply(200, { success: true });
    
    // Execute the method
    const result = await client.post('/form', formData);
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ success: true });
  });
  
  it('should handle binary data', async () => {
    // Setup mock response with Nock
    const binaryData = Buffer.from('binary data');
    
    nock(BASE_URL)
      .post('/binary', binaryData)
      .reply(200, { success: true });
    
    // Execute the method
    const result = await client.post('/binary', binaryData);
    
    // Verify the result
    expect(result.status).toBe(200);
    expect(result.data).toEqual({ success: true });
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
    const result = await service.getShowsByDate('2025-03-23');
    
    // Assert
    expect(result).toEqual([]);
    expect(mockHttpClient.get).toHaveBeenCalled();
  });
  
  it('should return an empty array when getShowsByQuery encounters an error', async () => {
    // Arrange
    mockHttpClient.get.mockRejectedValue(new Error('API Error'));
    
    // Act
    const result = await service.getShowsByQuery('test query');
    
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

describe('data normalization', () => {
  it('should normalize show data from date endpoint', async () => {
    // Arrange
    const mockRawShow = {
      id: 1,
      name: 'Test Show',
      airdate: '2025-03-23',
      airtime: '20:00',
      show: {
        id: 1,
        name: 'Test Show',
        type: 'Scripted',
        language: 'English',
        genres: ['Drama'],
        network: { id: 1, name: 'Test Network', country: { code: 'US' } }
      }
    };
    
    mockHttpClient.get.mockResolvedValue({
      data: [mockRawShow],
      status: 200,
      headers: {}
    });
    
    // Act
    const result = await service.getShowsByDate('2025-03-23');
    
    // Assert
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Test Show');
    expect(result[0].airtime).toBe('20:00');
  });
  
  it('should normalize show data from query endpoint', async () => {
    // Arrange
    const mockRawShow = {
      score: 0.9,
      show: {
        id: 1,
        name: 'Test Show',
        type: 'Scripted',
        language: 'English',
        genres: ['Drama'],
        network: { id: 1, name: 'Test Network', country: { code: 'US' } }
      }
    };
    
    mockHttpClient.get.mockResolvedValue({
      data: [mockRawShow],
      status: 200,
      headers: {}
    });
    
    // Act
    const result = await service.getShowsByQuery('test');
    
    // Assert
    expect(result.length).toBe(1);
    expect(result[0].name).toBe('Test Show');
  });
});
```

### 4. ShowUtils Tests

The `showUtils.ts` file needs additional tests for utility functions:

```typescript
// File: src/tests/utils/showUtils.test.ts

// Add these tests to the existing test file

describe('formatTime', () => {
  it('should format time string to 12-hour format', () => {
    expect(formatTime('13:30')).toBe('1:30 PM');
    expect(formatTime('08:15')).toBe('8:15 AM');
    expect(formatTime('00:00')).toBe('12:00 AM');
    expect(formatTime('12:00')).toBe('12:00 PM');
  });
  
  it('should handle undefined time', () => {
    expect(formatTime(undefined)).toBe('TBA');
  });
  
  it('should handle invalid time format', () => {
    expect(formatTime('not-a-time')).toBe('TBA');
  });
});

describe('filterByType', () => {
  it('should filter shows by type', () => {
    // Create test data
    const shows: Show[] = [
      createTestShow('Show 1', 'Scripted'),
      createTestShow('Show 2', 'Reality'),
      createTestShow('Show 3', 'Documentary')
    ];
    
    // Test filtering
    const filtered = filterByType(shows, ['Scripted', 'Documentary']);
    
    // Assert
    expect(filtered.length).toBe(2);
    expect(filtered[0].show.name).toBe('Show 1');
    expect(filtered[1].show.name).toBe('Show 3');
  });
  
  it('should return all shows when types array is empty', () => {
    // Create test data
    const shows: Show[] = [
      createTestShow('Show 1', 'Scripted'),
      createTestShow('Show 2', 'Reality')
    ];
    
    // Test filtering
    const filtered = filterByType(shows, []);
    
    // Assert
    expect(filtered.length).toBe(2);
  });
});

describe('filterByNetwork', () => {
  it('should filter shows by network', () => {
    // Create test data with different networks
    const shows: Show[] = [
      createTestShowWithNetwork('Show 1', 'HBO'),
      createTestShowWithNetwork('Show 2', 'Netflix'),
      createTestShowWithNetwork('Show 3', 'ABC')
    ];
    
    // Test filtering
    const filtered = filterByNetwork(shows, ['HBO', 'ABC']);
    
    // Assert
    expect(filtered.length).toBe(2);
    expect(filtered[0].show.name).toBe('Show 1');
    expect(filtered[1].show.name).toBe('Show 3');
  });
  
  it('should return all shows when networks array is empty', () => {
    // Create test data
    const shows: Show[] = [
      createTestShowWithNetwork('Show 1', 'HBO'),
      createTestShowWithNetwork('Show 2', 'Netflix')
    ];
    
    // Test filtering
    const filtered = filterByNetwork(shows, []);
    
    // Assert
    expect(filtered.length).toBe(2);
  });
});

describe('filterByGenre', () => {
  it('should filter shows by genre', () => {
    // Create test data with different genres
    const shows: Show[] = [
      createTestShowWithGenres('Show 1', ['Drama', 'Thriller']),
      createTestShowWithGenres('Show 2', ['Comedy']),
      createTestShowWithGenres('Show 3', ['Drama', 'Fantasy'])
    ];
    
    // Test filtering
    const filtered = filterByGenre(shows, ['Drama']);
    
    // Assert
    expect(filtered.length).toBe(2);
    expect(filtered[0].show.name).toBe('Show 1');
    expect(filtered[1].show.name).toBe('Show 3');
  });
  
  it('should return all shows when genres array is empty', () => {
    // Create test data
    const shows: Show[] = [
      createTestShowWithGenres('Show 1', ['Drama']),
      createTestShowWithGenres('Show 2', ['Comedy'])
    ];
    
    // Test filtering
    const filtered = filterByGenre(shows, []);
    
    // Assert
    expect(filtered.length).toBe(2);
  });
});

describe('filterByLanguage', () => {
  it('should filter shows by language', () => {
    // Create test data with different languages
    const shows: Show[] = [
      createTestShowWithLanguage('Show 1', 'English'),
      createTestShowWithLanguage('Show 2', 'Spanish'),
      createTestShowWithLanguage('Show 3', 'English')
    ];
    
    // Test filtering
    const filtered = filterByLanguage(shows, ['English']);
    
    // Assert
    expect(filtered.length).toBe(2);
    expect(filtered[0].show.name).toBe('Show 1');
    expect(filtered[1].show.name).toBe('Show 3');
  });
  
  it('should return all shows when languages array is empty', () => {
    // Create test data
    const shows: Show[] = [
      createTestShowWithLanguage('Show 1', 'English'),
      createTestShowWithLanguage('Show 2', 'Spanish')
    ];
    
    // Test filtering
    const filtered = filterByLanguage(shows, []);
    
    // Assert
    expect(filtered.length).toBe(2);
  });
});

describe('normalizeShowData', () => {
  it('should normalize TVMaze show data to internal format', () => {
    // Create a raw TVMaze show
    const tvMazeShow = {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama', 'Thriller'],
      network: {
        id: 1,
        name: 'HBO',
        country: {
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        }
      },
      webChannel: null,
      image: {
        medium: 'http://example.com/image.jpg',
        original: 'http://example.com/image_large.jpg'
      },
      summary: '<p>Test summary</p>'
    };
    
    // Normalize the data
    const normalized = normalizeShowData(tvMazeShow);
    
    // Assert
    expect(normalized.show.id).toBe(1);
    expect(normalized.show.name).toBe('Test Show');
    expect(normalized.show.type).toBe('Scripted');
    expect(normalized.show.language).toBe('English');
    expect(normalized.show.genres).toEqual(['Drama', 'Thriller']);
    expect(normalized.show.network?.name).toBe('HBO');
    expect(normalized.show.summary).toBe('Test summary');
  });
  
  it('should handle missing or null properties', () => {
    // Create a minimal TVMaze show with missing properties
    const tvMazeShow = {
      id: 1,
      name: 'Test Show'
    };
    
    // Normalize the data
    const normalized = normalizeShowData(tvMazeShow);
    
    // Assert
    expect(normalized.show.id).toBe(1);
    expect(normalized.show.name).toBe('Test Show');
    expect(normalized.show.genres).toEqual([]);
    expect(normalized.show.network).toBeNull();
    expect(normalized.show.webChannel).toBeNull();
    expect(normalized.show.image).toBeNull();
    expect(normalized.show.summary).toBe('');
  });
});

// Helper functions for creating test data
function createTestShow(name: string, type: string): Show {
  return {
    name,
    season: 1,
    number: 1,
    airtime: '20:00',
    show: {
      id: Math.floor(Math.random() * 1000),
      name,
      type,
      language: 'English',
      genres: ['Drama'],
      network: { id: 1, name: 'Test Network', country: null },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
  };
}

function createTestShowWithNetwork(name: string, networkName: string): Show {
  const show = createTestShow(name, 'Scripted');
  show.show.network = { id: Math.floor(Math.random() * 1000), name: networkName, country: null };
  return show;
}

function createTestShowWithGenres(name: string, genres: string[]): Show {
  const show = createTestShow(name, 'Scripted');
  show.show.genres = genres;
  return show;
}

function createTestShowWithLanguage(name: string, language: string): Show {
  const show = createTestShow(name, 'Scripted');
  show.show.language = language;
  return show;
}
```

### 5. CLI Integration Tests

Create a new test file for CLI integration tests:

```typescript
// File: src/tests/cli.test.ts

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { container } from 'tsyringe';
import { exec } from 'child_process';
import { promisify } from 'util';

// Promisify exec for easier testing
const execAsync = promisify(exec);

describe('CLI Integration Tests', () => {
  // Capture console output
  let consoleLogSpy: jest.SpyInstance;
  let consoleErrorSpy: jest.SpyInstance;
  
  beforeEach(() => {
    // Mock console methods
    consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
    
    // Reset container
    container.clearInstances();
  });
  
  afterEach(() => {
    // Restore console methods
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });
  
  it('should run the CLI with default arguments', async () => {
    // Run the CLI script
    const { stdout, stderr } = await execAsync('node dist/cli.js');
    
    // Assert
    expect(stdout).toContain('WhatsOnTV');
    expect(stderr).toBe('');
  });
  
  it('should handle --help argument', async () => {
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
| Statements  | 71.26%  | 80%    | 85%+                         |
| Branches    | 67.74%  | 80%    | 80%+                         |
| Functions   | 59%     | 80%    | 80%+                         |
| Lines       | 71.83%  | 80%    | 85%+                         |

## Conclusion

This test coverage improvement plan provides a comprehensive approach to increasing the test coverage of the WhatsOnTV application. By following the detailed implementation steps and adding the suggested tests, the application will reach the target coverage of 80% across all metrics.

The plan focuses on:
1. Adding missing tests for uncovered code paths
2. Standardizing the mocking approach
3. Implementing integration tests for the CLI
4. Refactoring or removing problematic tests

This structured approach ensures that the most critical components are tested first, with a clear path to achieving the desired coverage targets.
