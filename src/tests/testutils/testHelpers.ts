/**
 * Test helpers for the TVMaze application
 */
import { jest } from '@jest/globals';
import { container, DependencyContainer } from 'tsyringe';

// Import factory functions
import { createMockHttpClient } from '../mocks/factories/httpClientFactory.js';
import { createMockConfigService } from '../mocks/factories/configServiceFactory.js';
import { 
  createMockFormatter as factoryCreateMockFormatter 
} from '../mocks/factories/formatterFactory.js';
import { 
  createMockTvShowService as factoryCreateMockTvShowService 
} from '../mocks/factories/tvShowServiceFactory.js';
import { createMockStyleService } from '../mocks/factories/styleServiceFactory.js';
import { createMockOutputService } from '../mocks/factories/outputServiceFactory.js';

// Type imports
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { ShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { HttpClient } from '../../interfaces/httpClient.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { OutputService } from '../../interfaces/outputService.js';

/**
 * Create a mock console output object for testing
 * @deprecated Use createMockConsoleOutput from consoleOutputFactory instead
 * @returns Mock console output
 */
export function createMockConsoleOutput(): jest.Mocked<ConsoleOutput> {
  return {
    log: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
    logWithLevel: jest.fn()
  };
}

/**
 * Create a mock formatter for testing
 * @deprecated Consider using formatterFactory directly for new tests
 * @returns Mock formatter
 */
export function createMockFormatter(): jest.Mocked<ShowFormatter> {
  // Use the factory function to ensure consistency
  return factoryCreateMockFormatter();
}

/**
 * Create a mock TV show service for testing
 * @deprecated Consider using tvShowServiceFactory directly for new tests
 * @returns Mock TV show service with jest mock functions
 */
export function createMockTvShowService(): TvShowService {
  // Use the factory function to ensure consistency
  return factoryCreateMockTvShowService();
}

/**
 * Create a test container with mock dependencies
 * @returns Configured DependencyContainer for testing
 */
export function createTestContainer(): DependencyContainer {
  // Create a child container to avoid polluting the global container
  const testContainer = container.createChildContainer();
  
  // Register mock dependencies using factory functions
  testContainer.register<HttpClient>('HttpClient', { 
    useValue: createMockHttpClient() 
  });
  
  testContainer.register<ConfigService>('ConfigService', { 
    useValue: createMockConfigService() 
  });
  
  testContainer.register<ConsoleOutput>('ConsoleOutput', { 
    useValue: createMockConsoleOutput() 
  });
  
  testContainer.register<ShowFormatter>('ShowFormatter', { 
    useValue: createMockFormatter() 
  });
  
  testContainer.register<TvShowService>('TvShowService', { 
    useValue: createMockTvShowService() 
  });
  
  testContainer.register<StyleService>('StyleService', { 
    useValue: createMockStyleService() 
  });
  
  testContainer.register<OutputService>('OutputService', { 
    useValue: createMockOutputService() 
  });
  
  return testContainer;
}

/**
 * Reset the container to a clean state
 * This is important to call before each test to avoid test pollution
 */
export function resetContainer(): void {
  container.clearInstances();
  
  // Register the mock services in the global container using factory functions
  container.register<HttpClient>('HttpClient', { 
    useValue: createMockHttpClient() 
  });
  
  container.register<ConfigService>('ConfigService', { 
    useValue: createMockConfigService() 
  });
  
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
    useValue: createMockStyleService() 
  });
  
  container.register<OutputService>('OutputService', { 
    useValue: createMockOutputService() 
  });
}
