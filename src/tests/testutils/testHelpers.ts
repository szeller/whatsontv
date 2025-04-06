/**
 * Test helpers for the TVMaze application
 */
import { container, DependencyContainer } from 'tsyringe';

// Import factory functions
import { createMockHttpClient } from '../mocks/factories/httpClientFactory.js';
import { createMockConfigService } from '../mocks/factories/configServiceFactory.js';
import { createMockFormatter } from '../mocks/factories/formatterFactory.js';
import { createMockTvShowService } from '../mocks/factories/tvShowServiceFactory.js';
import { createMockStyleService } from '../mocks/factories/styleServiceFactory.js';
import { createMockOutputService } from '../mocks/factories/outputServiceFactory.js';
import { createMockConsoleOutput } from '../mocks/factories/consoleOutputFactory.js';

// Type imports
import type { HttpClient } from '../../interfaces/httpClient.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { TextShowFormatter } from '../../interfaces/showFormatter.js';
import type { StyleService } from '../../interfaces/styleService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { OutputService } from '../../interfaces/outputService.js';

/**
 * Create a test container with mock dependencies
 * @returns Configured DependencyContainer for testing
 */
export function createTestContainer(): DependencyContainer {
  // Create a child container to avoid polluting the global container
  const testContainer = container.createChildContainer();
  
  // Register mock dependencies using factory functions
  testContainer.registerInstance<HttpClient>('HttpClient', createMockHttpClient());
  testContainer.registerInstance<ConfigService>('ConfigService', createMockConfigService());
  testContainer.registerInstance<ConsoleOutput>('ConsoleOutput', createMockConsoleOutput());
  testContainer.registerInstance<TextShowFormatter>('TextShowFormatter', createMockFormatter());
  testContainer.registerInstance<TvShowService>('TvShowService', createMockTvShowService());
  testContainer.registerInstance<StyleService>('StyleService', createMockStyleService());
  testContainer.registerInstance<OutputService>('OutputService', createMockOutputService());
  
  return testContainer;
}

/**
 * Reset the container to a clean state
 * This is important to call before each test to avoid test pollution
 */
export function resetContainer(): void {
  container.clearInstances();
  
  // Register the mock services in the global container using factory functions
  container.registerInstance<HttpClient>('HttpClient', createMockHttpClient());
  container.registerInstance<ConfigService>('ConfigService', createMockConfigService());
  container.registerInstance<ConsoleOutput>('ConsoleOutput', createMockConsoleOutput());
  container.registerInstance<TextShowFormatter>('TextShowFormatter', createMockFormatter());
  container.registerInstance<TvShowService>('TvShowService', createMockTvShowService());
  container.registerInstance<StyleService>('StyleService', createMockStyleService());
  container.registerInstance<OutputService>('OutputService', createMockOutputService());
}
