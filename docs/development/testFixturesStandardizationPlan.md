# Test Fixtures Standardization Plan

## Overview

This document outlines a detailed plan for standardizing test fixtures across the WhatsOnTV application. The goal is to create a consistent set of test data that can be reused across all tests, reducing duplication and improving maintainability.

## Current Issues

1. **Inconsistent Test Data**: Many tests use one-off mock data defined inline, leading to inconsistencies
2. **Unused Domain Fixtures**: We have well-structured domain fixtures in `src/tests/fixtures/domain/domainFixtures.ts` that aren't being used
3. **No Clear Mapping**: No clear mapping between TVMaze API fixtures and domain model fixtures
4. **Redundant Mock Creation**: Test setup code is duplicated across multiple test files
5. **Incomplete Test Coverage**: Some edge cases aren't consistently tested across all components

## Implementation Plan

### 1. Enhance Domain Fixtures

#### 1.1 Update Show Fixtures

Update `domainFixtures.ts` to include more comprehensive test data:

```typescript
// src/tests/fixtures/domain/domainFixtures.ts

/**
 * Network Shows with various properties
 */
static getNetworkShows(): Show[] {
  return [
    // Current fixtures...
    
    // Add more network shows with different properties
    {
      id: 5,
      name: 'Show with Very Long Name That Might Cause Formatting Issues',
      type: 'scripted',
      language: 'English',
      genres: ['Drama', 'Thriller', 'Crime'],
      channel: 'CBS',
      isStreaming: false,
      summary: 'A show with an extremely long name and multiple genres',
      airtime: '22:00',
      season: 3,
      number: 5
    },
    {
      id: 6,
      name: 'Non-English Show',
      type: 'scripted',
      language: 'Spanish',
      genres: ['Drama'],
      channel: 'Telemundo',
      isStreaming: false,
      summary: 'A show in Spanish language',
      airtime: '19:30',
      season: 1,
      number: 10
    },
    {
      id: 7,
      name: 'Show with No Summary',
      type: 'reality',
      language: 'English',
      genres: ['Reality'],
      channel: 'FOX',
      isStreaming: false,
      summary: null,
      airtime: '20:00',
      season: 5,
      number: 2
    }
  ];
}

/**
 * Streaming Shows with various properties
 */
static getStreamingShows(): Show[] {
  return [
    // Current fixtures...
    
    // Add more streaming shows with different properties
    {
      id: 8,
      name: 'Prime Original',
      type: 'scripted',
      language: 'English',
      genres: ['Drama', 'Sci-Fi'],
      channel: 'Prime Video',
      isStreaming: true,
      summary: 'An Amazon Prime original series',
      airtime: null,
      season: 2,
      number: 1
    },
    {
      id: 9,
      name: 'Netflix Documentary',
      type: 'documentary',
      language: 'English',
      genres: ['Documentary', 'Crime'],
      channel: 'Netflix',
      isStreaming: true,
      summary: 'A Netflix documentary series',
      airtime: null,
      season: 1,
      number: 3
    },
    {
      id: 10,
      name: 'Disney Animation',
      type: 'animation',
      language: 'English',
      genres: ['Animation', 'Family'],
      channel: 'Disney+',
      isStreaming: true,
      summary: 'A Disney+ animated series',
      airtime: null,
      season: 1,
      number: 5
    }
  ];
}
```

#### 1.2 Add Edge Case Fixtures

Create specialized fixtures for edge cases:

```typescript
/**
 * Shows with edge case properties
 */
static getEdgeCaseShows(): Show[] {
  return [
    // Show with empty genres
    {
      id: 11,
      name: 'No Genres Show',
      type: 'variety',
      language: 'English',
      genres: [],
      channel: 'ABC',
      isStreaming: false,
      summary: 'A show with no genres',
      airtime: '21:00',
      season: 1,
      number: 1
    },
    // Show with null language
    {
      id: 12,
      name: 'Unknown Language Show',
      type: 'scripted',
      language: null,
      genres: ['Drama'],
      channel: 'NBC',
      isStreaming: false,
      summary: 'A show with unknown language',
      airtime: '20:00',
      season: 2,
      number: 3
    },
    // Show with very long summary
    {
      id: 13,
      name: 'Long Summary Show',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      channel: 'HBO',
      isStreaming: false,
      summary: 'This show has an extremely long summary that might cause formatting issues when displayed in the console or other output formats. It contains multiple sentences and goes into great detail about the plot, characters, and setting of the show. This is useful for testing how the application handles long text fields and ensures that the formatting is correct in all output formats.',
      airtime: '21:00',
      season: 1,
      number: 1
    }
  ];
}
```

#### 1.3 Add Utility Methods

Add utility methods to make it easier to work with fixtures:

```typescript
/**
 * Get a show with specific properties
 * @param props Properties to override in the base show
 * @returns A show with the specified properties
 */
static getShowWithProps(props: Partial<Show>): Show {
  const baseShow = this.getNetworkShows()[0];
  return {
    ...baseShow,
    ...props
  };
}

/**
 * Get shows filtered by genre
 * @param genre Genre to filter by
 * @returns Array of shows with the specified genre
 */
static getShowsByGenre(genre: string): Show[] {
  const allShows = [
    ...this.getNetworkShows(),
    ...this.getStreamingShows(),
    ...this.getEdgeCaseShows()
  ];
  
  return allShows.filter(show => 
    show.genres.some(g => g.toLowerCase() === genre.toLowerCase())
  );
}

/**
 * Get shows filtered by type
 * @param type Show type to filter by
 * @returns Array of shows with the specified type
 */
static getShowsByType(type: string): Show[] {
  const allShows = [
    ...this.getNetworkShows(),
    ...this.getStreamingShows(),
    ...this.getEdgeCaseShows()
  ];
  
  return allShows.filter(show => 
    show.type.toLowerCase() === type.toLowerCase()
  );
}

/**
 * Get shows filtered by channel
 * @param channel Channel to filter by
 * @returns Array of shows on the specified channel
 */
static getShowsByChannel(channel: string): Show[] {
  const allShows = [
    ...this.getNetworkShows(),
    ...this.getStreamingShows(),
    ...this.getEdgeCaseShows()
  ];
  
  return allShows.filter(show => 
    show.channel.toLowerCase() === channel.toLowerCase()
  );
}

/**
 * Get all shows combined
 * @returns Array of all shows from all categories
 */
static getAllShows(): Show[] {
  return [
    ...this.getNetworkShows(),
    ...this.getStreamingShows(),
    ...this.getEdgeCaseShows()
  ];
}
```

### 2. Create Fixture Mapping Utilities

#### 2.1 Create Mapping Functions

Create utility functions to map between TVMaze API fixtures and domain fixtures:

```typescript
// src/tests/utils/fixtureUtils.ts

import { TvMazeFixtures } from '../fixtures/tvmaze/tvMazeFixtures.js';
import { DomainFixtures } from '../fixtures/domain/domainFixtures.js';
import { transformSchedule } from '../../utils/tvmazeTransformer.js';
import type { Show } from '../../types/tvShowModel.js';

/**
 * Map TVMaze network schedule fixture to domain model
 * @returns Array of domain model shows
 */
export function getTvMazeNetworkShowsAsDomain(): Show[] {
  const networkSchedule = TvMazeFixtures.getSchedule('network-schedule');
  return transformSchedule(networkSchedule, false);
}

/**
 * Map TVMaze web schedule fixture to domain model
 * @returns Array of domain model shows
 */
export function getTvMazeWebShowsAsDomain(): Show[] {
  const webSchedule = TvMazeFixtures.getSchedule('web-schedule');
  return transformSchedule(webSchedule, true);
}

/**
 * Map TVMaze combined schedule fixture to domain model
 * @returns Array of domain model shows
 */
export function getTvMazeCombinedShowsAsDomain(): Show[] {
  const networkShows = getTvMazeNetworkShowsAsDomain();
  const webShows = getTvMazeWebShowsAsDomain();
  return [...networkShows, ...webShows];
}

/**
 * Get a specific show from the domain fixtures by ID
 * @param id Show ID to find
 * @returns The show with the specified ID or undefined if not found
 */
export function getShowById(id: number): Show | undefined {
  return DomainFixtures.getAllShows().find(show => show.id === id);
}
```

### 3. Update Test Helpers

#### 3.1 Enhance Mock Service Creation

Update the test helpers to use domain fixtures:

```typescript
// src/tests/utils/testHelpers.ts

import { DomainFixtures } from '../fixtures/domain/domainFixtures.js';
import type { Show } from '../../types/tvShowModel.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';

/**
 * Create a mock TV show service with predefined shows
 * @param shows Optional array of shows to return from the service
 * @returns Mock TV show service
 */
export function createMockTvShowService(shows?: Show[]): jest.Mocked<TvShowService> {
  const defaultShows = shows ?? DomainFixtures.getNetworkShows();
  
  return {
    getShowsByDate: jest.fn().mockResolvedValue(defaultShows),
    fetchShowsWithOptions: jest.fn().mockImplementation(async (options) => {
      if (options.webOnly) {
        return DomainFixtures.getStreamingShows();
      } else if (options.showAll) {
        return [...DomainFixtures.getNetworkShows(), ...DomainFixtures.getStreamingShows()];
      } else {
        return defaultShows;
      }
    }),
    getShowsByNetwork: jest.fn().mockImplementation(async (network) => {
      return DomainFixtures.getShowsByChannel(network);
    }),
    getShowsByType: jest.fn().mockImplementation(async (type) => {
      return DomainFixtures.getShowsByType(type);
    }),
    getShowsByGenre: jest.fn().mockImplementation(async (genre) => {
      return DomainFixtures.getShowsByGenre(genre);
    })
  };
}
```

#### 3.2 Create Standard Test Setup Functions

Create standard test setup functions for common test scenarios:

```typescript
// src/tests/utils/testSetup.ts

import { container } from 'tsyringe';
import { DomainFixtures } from '../fixtures/domain/domainFixtures.js';
import { createMockTvShowService, createMockConsoleOutput, createMockFormatter } from './testHelpers.js';
import { ConsoleFormatterImpl } from '../../implementations/console/consoleFormatterImpl.js';
import { ConsoleOutputServiceImpl } from '../../implementations/console/consoleOutputServiceImpl.js';
import { PlainStyleServiceImpl } from '../../implementations/test/plainStyleServiceImpl.js';

import type { Show } from '../../types/tvShowModel.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { OutputService } from '../../interfaces/outputService.js';

/**
 * Set up a formatter test environment
 * @returns Test environment with formatter and mock dependencies
 */
export function setupFormatterTest() {
  // Reset container
  container.clearInstances();
  
  // Create mocks
  const mockTvShowService = createMockTvShowService();
  const mockConsoleOutput = createMockConsoleOutput();
  const styleService = new PlainStyleServiceImpl();
  
  // Register dependencies
  container.registerInstance<TvShowService>('TvShowService', mockTvShowService);
  container.registerInstance<ConsoleOutput>('ConsoleOutput', mockConsoleOutput);
  container.registerInstance<StyleService>('StyleService', styleService);
  
  // Create formatter
  const formatter = container.resolve(ConsoleFormatterImpl);
  
  // Get sample shows
  const mockShow = DomainFixtures.getNetworkShows()[0];
  const mockShowNoAirtime = DomainFixtures.getShowWithProps({ airtime: null });
  
  return {
    formatter,
    mockTvShowService,
    mockConsoleOutput,
    styleService,
    mockShow,
    mockShowNoAirtime
  };
}

/**
 * Set up an output service test environment
 * @returns Test environment with output service and mock dependencies
 */
export function setupOutputServiceTest() {
  // Reset container
  container.clearInstances();
  
  // Create mocks
  const mockTvShowService = createMockTvShowService();
  const mockConsoleOutput = createMockConsoleOutput();
  const mockFormatter = createMockFormatter();
  
  // Register dependencies
  container.registerInstance<TvShowService>('TvShowService', mockTvShowService);
  container.registerInstance<ConsoleOutput>('ConsoleOutput', mockConsoleOutput);
  container.registerInstance<ShowFormatter>('ShowFormatter', mockFormatter);
  
  // Create output service
  const outputService = container.resolve(ConsoleOutputServiceImpl);
  
  // Get sample shows
  const mockShows = DomainFixtures.getNetworkShows();
  
  return {
    outputService,
    mockTvShowService,
    mockConsoleOutput,
    mockFormatter,
    mockShows
  };
}
```

### 4. Refactor Existing Tests

#### 4.1 Update Console Formatter Tests

Refactor `consoleFormatterImpl.test.ts` to use the standard test setup and domain fixtures:

```typescript
// src/tests/implementations/console/consoleFormatterImpl.test.ts

import { jest } from '@jest/globals';
import { setupFormatterTest } from '../../utils/testSetup.js';
import { DomainFixtures } from '../../fixtures/domain/domainFixtures.js';

describe('ConsoleFormatterImpl', () => {
  let testEnv: ReturnType<typeof setupFormatterTest>;
  
  beforeEach(() => {
    testEnv = setupFormatterTest();
    jest.clearAllMocks();
  });
  
  describe('formatShow', () => {
    it('should call formatTimedShow for shows with airtime', () => {
      const spy = jest.spyOn(testEnv.formatter, 'formatTimedShow');
      testEnv.formatter.formatShow(testEnv.mockShow);
      expect(spy).toHaveBeenCalledWith(testEnv.mockShow);
    });
    
    it('should call formatUntimedShow for shows without airtime', () => {
      const spy = jest.spyOn(testEnv.formatter, 'formatUntimedShow');
      testEnv.formatter.formatShow(testEnv.mockShowNoAirtime);
      expect(spy).toHaveBeenCalledWith(testEnv.mockShowNoAirtime);
    });
  });
  
  // Additional tests...
});
```

#### 4.2 Update Console Output Service Tests

Refactor `consoleOutputServiceImpl.test.ts` to use the standard test setup and domain fixtures:

```typescript
// src/tests/implementations/console/consoleOutputServiceImpl.test.ts

import { jest } from '@jest/globals';
import { setupOutputServiceTest } from '../../utils/testSetup.js';

describe('ConsoleOutputServiceImpl', () => {
  let testEnv: ReturnType<typeof setupOutputServiceTest>;
  
  beforeEach(() => {
    testEnv = setupOutputServiceTest();
    jest.clearAllMocks();
  });
  
  describe('displayShows', () => {
    it('should format and display each show', async () => {
      await testEnv.outputService.displayShows(testEnv.mockShows);
      
      expect(testEnv.mockFormatter.formatShow).toHaveBeenCalledTimes(testEnv.mockShows.length);
      expect(testEnv.mockConsoleOutput.log).toHaveBeenCalledTimes(testEnv.mockShows.length);
    });
    
    // Additional tests...
  });
});
```

#### 4.3 Update TvMazeServiceImpl Tests

Refactor `tvMazeServiceImpl.test.ts` to use the fixture utilities:

```typescript
// src/tests/implementations/tvMazeServiceImpl.test.ts

import { jest } from '@jest/globals';
import { container } from 'tsyringe';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import { TvMazeFixtures } from '../fixtures/tvmaze/tvMazeFixtures.js';
import { getTvMazeNetworkShowsAsDomain, getTvMazeWebShowsAsDomain } from '../utils/fixtureUtils.js';

import type { HttpClient } from '../../interfaces/httpClient.js';

describe('TvMazeServiceImpl', () => {
  let tvMazeService: TvMazeServiceImpl;
  let mockHttpClient: jest.Mocked<HttpClient>;
  
  beforeEach(() => {
    // Reset container
    container.clearInstances();
    
    // Create mock HTTP client
    mockHttpClient = {
      get: jest.fn()
    };
    
    // Register dependencies
    container.registerInstance<HttpClient>('HttpClient', mockHttpClient);
    
    // Create service
    tvMazeService = container.resolve(TvMazeServiceImpl);
  });
  
  describe('getShowsByDate', () => {
    it('should fetch shows from both network and web schedules', async () => {
      // Set up mock responses
      mockHttpClient.get
        .mockResolvedValueOnce(TvMazeFixtures.getSchedule('network-schedule'))
        .mockResolvedValueOnce(TvMazeFixtures.getSchedule('web-schedule'));
      
      // Call the method
      const result = await tvMazeService.getShowsByDate('2023-01-01');
      
      // Verify the HTTP client was called with the correct URLs
      expect(mockHttpClient.get).toHaveBeenCalledTimes(2);
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/schedule?date=2023-01-01'));
      expect(mockHttpClient.get).toHaveBeenCalledWith(expect.stringContaining('/schedule/web?date=2023-01-01'));
      
      // Verify the result contains both network and web shows
      const expectedNetworkShows = getTvMazeNetworkShowsAsDomain();
      const expectedWebShows = getTvMazeWebShowsAsDomain();
      
      expect(result.length).toBe(expectedNetworkShows.length + expectedWebShows.length);
      
      // Verify network shows
      const networkShowsInResult = result.filter(show => !show.isStreaming);
      expect(networkShowsInResult.length).toBe(expectedNetworkShows.length);
      
      // Verify web shows
      const webShowsInResult = result.filter(show => show.isStreaming);
      expect(webShowsInResult.length).toBe(expectedWebShows.length);
    });
    
    // Additional tests...
  });
});
```

### 5. Implementation Timeline

#### Week 1: Setup and Initial Implementation

1. Update `domainFixtures.ts` with enhanced fixtures
2. Create fixture mapping utilities
3. Update test helper functions

#### Week 2: Test Refactoring

1. Create standard test setup functions
2. Refactor console formatter tests
3. Refactor console output service tests
4. Refactor TvMazeServiceImpl tests

#### Week 3: Finalization

1. Refactor remaining tests
2. Update documentation
3. Review and finalize changes

## Success Criteria

1. All tests use consistent domain fixtures from `domainFixtures.ts`
2. No inline mock data in tests (except for very specific edge cases)
3. Clear separation between API fixtures and domain fixtures
4. Reduced code duplication in test setup
5. Improved test maintainability and readability
6. All tests pass with the new fixture structure
