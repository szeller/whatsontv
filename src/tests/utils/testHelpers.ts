/**
 * Test helpers for the TVMaze application
 */
import { jest } from '@jest/globals';
import { container, DependencyContainer } from 'tsyringe';

// Local imports
import { PlainStyleServiceImpl } from '../../implementations/test/plainStyleServiceImpl.js';

// Type imports
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { Show } from '../../types/tvShowModel.js';
import type { NetworkGroups } from '../../utils/showUtils.js';

/**
 * Create a mock console output object for testing
 * @returns Mock console output
 */
export function createMockConsoleOutput(): jest.Mocked<ConsoleOutput> {
  return {
    log: jest.fn(),
    error: jest.fn(),
    logWithLevel: jest.fn()
  };
}

/**
 * Create a mock formatter for testing
 * @returns Mock formatter
 */
export function createMockFormatter(): jest.Mocked<ShowFormatter> {
  return {
    formatShow: jest.fn(),
    formatTimedShow: jest.fn(),
    formatUntimedShow: jest.fn(),
    formatMultipleEpisodes: jest.fn(),
    formatNetworkGroups: jest.fn<(groups: NetworkGroups, timeSort?: boolean) => string[]>()
  };
}

/**
 * Create a mock TV show service for testing
 * @returns Mock TV show service with jest mock functions
 */
export function createMockTvShowService(): TvShowService {
  return {
    getShowsByDate: jest.fn<(date: string) => Promise<Show[]>>().mockResolvedValue([]),
    fetchShowsWithOptions: jest.fn<(options: {
      date?: string;
      country?: string;
      types?: string[];
      networks?: string[];
      genres?: string[];
      languages?: string[];
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
    useValue: createMockFormatter() 
  });
  testContainer.register<TvShowService>('TvShowService', { 
    useValue: createMockTvShowService() 
  });
  
  // Use real style service with plain styling
  testContainer.register<StyleService>('StyleService', { 
    useClass: PlainStyleServiceImpl 
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
    useValue: createMockFormatter() 
  });
  container.register<TvShowService>('TvShowService', { 
    useValue: createMockTvShowService() 
  });
  container.register<StyleService>('StyleService', { 
    useClass: PlainStyleServiceImpl 
  });
}
