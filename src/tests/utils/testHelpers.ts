/**
 * Test helpers for working with tsyringe dependency injection
 * Provides utilities to create mock objects and test containers
 */

import 'reflect-metadata';

import { jest } from '@jest/globals';
import { container, DependencyContainer } from 'tsyringe';

// Local imports

// Type imports
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { NetworkGroups } from '../../types/app.js';
import type { Show } from '../../types/tvmaze.js';
import { PlainStyleService } from '../../utils/styleService.js';
import type { StyleService } from '../../utils/styleService.js';

/**
 * Create a mock console output object for testing
 */
export function createMockConsoleOutput(): ConsoleOutput {
  return {
    log: jest.fn(),
    error: jest.fn(),
    logWithLevel: jest.fn()
  };
}

/**
 * Create a mock show formatter for testing
 */
export function createMockShowFormatter(): ShowFormatter {
  return {
    formatShow: jest.fn<(show: Show) => string>().mockReturnValue('Formatted show'),
    formatTimedShow: jest.fn<(show: Show) => string>().mockReturnValue('Formatted timed show'),
    formatUntimedShow: jest.fn<(show: Show) => string>()
      .mockReturnValue('Formatted untimed show'),
    formatMultipleEpisodes: jest.fn<(shows: Show[]) => string>()
      .mockReturnValue('Formatted multiple episodes'),
    formatNetworkGroups: jest.fn<
      (
        networkGroups: NetworkGroups,
        timeSort?: boolean
      ) => string[]
    >()
      .mockReturnValue(['Formatted network groups'])
  };
}

/**
 * Create a mock TV show service for testing
 * @returns Mock TV show service with jest mock functions
 */
export function createMockTvShowService(): TvShowService {
  return {
    getShowsByDate: jest.fn<(date: string) => Promise<Show[]>>().mockResolvedValue([]),
    searchShows: jest.fn<(query: string) => Promise<Show[]>>().mockResolvedValue([]),
    getEpisodes: jest.fn<(showId: number) => Promise<Show[]>>().mockResolvedValue([]),
    getShows: jest.fn<(options: { 
      date?: string; 
      search?: string; 
      show?: number;
      genres?: string[];
      languages?: string[];
    }) => Promise<Show[]>>().mockResolvedValue([]),
    // Removed groupShowsByNetwork as it's now a utility function, not part of the interface
    // Removed non-interface methods
    fetchShowsWithOptions: jest.fn<(options: {
      date?: string;
      search?: string;
      show?: number;
    }) => Promise<Show[]>>().mockResolvedValue([])
  };
}

/**
 * Create a test container with mock dependencies
 * @returns Configured DependencyContainer for testing
 */
export function createTestContainer(): DependencyContainer {
  // Create a child container to avoid polluting the global container
  const testContainer = container.createChildContainer();
  
  // Register mock dependencies
  testContainer.register<ConsoleOutput>('ConsoleOutput', { 
    useValue: createMockConsoleOutput() 
  });
  testContainer.register<ShowFormatter>('ShowFormatter', { 
    useValue: createMockShowFormatter() 
  });
  testContainer.register<TvShowService>('TvShowService', { 
    useValue: createMockTvShowService() 
  });
  
  // Use real style service with plain styling
  testContainer.register<StyleService>('StyleService', { 
    useClass: PlainStyleService 
  });
  
  return testContainer;
}

/**
 * Reset the container to a clean state
 * This is important to call before each test to avoid test pollution
 */
export function resetContainer(): void {
  container.clearInstances();
  
  // Register the mock services in the global container
  container.register<ConsoleOutput>('ConsoleOutput', { 
    useValue: createMockConsoleOutput() 
  });
  container.register<ShowFormatter>('ShowFormatter', { 
    useValue: createMockShowFormatter() 
  });
  container.register<TvShowService>('TvShowService', { 
    useValue: createMockTvShowService() 
  });
  container.register<StyleService>('StyleService', { 
    useClass: PlainStyleService 
  });
}
