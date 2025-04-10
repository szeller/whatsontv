/**
 * Slack dependency injection container setup
 */
import 'reflect-metadata';
import { container } from 'tsyringe';

// Interface imports
import type { ConfigService } from './interfaces/configService.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { HttpClient } from './interfaces/httpClient.js';
import type { OutputService } from './interfaces/outputService.js';
import type { SlackClient } from './interfaces/slackClient.js';
import type { SlackShowFormatter } from './interfaces/showFormatter.js';
import type { TvShowService } from './interfaces/tvShowService.js';

// Implementation imports
import { ConsoleConfigServiceImpl } from './implementations/console/consoleConfigServiceImpl.js';
import { ConsoleOutputImpl } from './implementations/console/consoleOutputImpl.js';
import { FetchHttpClientImpl } from './implementations/fetchHttpClientImpl.js';
import { SlackClientImpl } from './implementations/slack/slackClientImpl.js';
import { SlackOutputServiceImpl } from './implementations/slack/slackOutputServiceImpl.js';
import { SlackShowFormatterImpl } from './implementations/slack/slackShowFormatterImpl.js';
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';

/**
 * Initialize the Slack container with all required dependencies
 */
export function initializeSlackContainer(): void {
  // Register core services
  container.registerSingleton<TvShowService>('TvShowService', TvMazeServiceImpl);
  container.registerSingleton<ConsoleOutput>('ConsoleOutput', ConsoleOutputImpl);
  
  // Register Slack-specific services
  container.registerSingleton<SlackShowFormatter>('SlackFormatter', SlackShowFormatterImpl);
  
  // Register ConfigService with factory to handle the optional parameter
  container.register<ConfigService>('ConfigService', {
    useFactory: () => new ConsoleConfigServiceImpl(false)
  });
  
  // Register HttpClient
  container.register<HttpClient>('HttpClient', {
    useFactory: () => new FetchHttpClientImpl()
  });
  
  // Register real SlackClient implementation
  container.registerSingleton<SlackClient>('SlackClient', SlackClientImpl);
  
  // Register SlackOutputService with factory to properly inject dependencies
  container.register<OutputService>('SlackOutputService', {
    useFactory: (dependencyContainer) => {
      const formatter = dependencyContainer.resolve<SlackShowFormatter>('SlackFormatter');
      const slackClient = dependencyContainer.resolve<SlackClient>('SlackClient');
      const configService = dependencyContainer.resolve<ConfigService>('ConfigService');
      return new SlackOutputServiceImpl(formatter, slackClient, configService);
    }
  });
  
  // Register platform type
  container.register('PlatformType', { useValue: 'slack' });
}

// Export the container
export { container };
