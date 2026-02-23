/**
 * Lambda-specific dependency injection container setup
 * Does not import yargs - uses LambdaConfigServiceImpl for configuration
 */
import 'reflect-metadata';
import { container } from 'tsyringe';
import { WebClient } from '@slack/web-api';

// Interface imports
import type { ConfigService } from './interfaces/configService.js';
import type { ProcessOutput } from './interfaces/processOutput.js';
import type { HttpClient } from './interfaces/httpClient.js';
import type { LoggerService } from './interfaces/loggerService.js';
import type { OutputService } from './interfaces/outputService.js';
import type { SlackClient } from './interfaces/slackClient.js';
import type { SlackShowFormatter } from './interfaces/showFormatter.js';
import type { TvShowService } from './interfaces/tvShowService.js';
import type { SlackConfig } from './types/configTypes.js';

/** Factory function that creates WebClient instances from Slack config */
const createWebClient = (config: SlackConfig): WebClient =>
  new WebClient(config.token);

// Implementation imports - NO yargs dependency
import { LambdaConfigServiceImpl } from './implementations/lambda/lambdaConfigServiceImpl.js';
import { ProcessOutputImpl } from './implementations/processOutputImpl.js';
import { FetchHttpClientImpl } from './implementations/fetchHttpClientImpl.js';
import { PinoLoggerServiceImpl } from './implementations/pino/pinoLoggerServiceImpl.js';
import { SlackClientImpl } from './implementations/slack/slackClientImpl.js';
import { SlackOutputServiceImpl } from './implementations/slack/slackOutputServiceImpl.js';
import { SlackShowFormatterImpl } from './implementations/slack/slackShowFormatterImpl.js';
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';

/**
 * Initialize the Lambda container with all required dependencies
 * Uses LambdaConfigServiceImpl which doesn't depend on yargs
 */
export function initializeLambdaContainer(): void {
  // Register core services
  container.registerSingleton<TvShowService>('TvShowService', TvMazeServiceImpl);
  container.registerSingleton<ProcessOutput>('ProcessOutput', ProcessOutputImpl);
  container.registerSingleton<LoggerService>('LoggerService', PinoLoggerServiceImpl);

  // Register Slack-specific services
  container.registerSingleton<SlackShowFormatter>('SlackFormatter', SlackShowFormatterImpl);

  // Register ConfigService - Lambda-specific, no yargs
  container.registerSingleton<ConfigService>('ConfigService', LambdaConfigServiceImpl);

  // Register HttpClient
  container.register<HttpClient>('HttpClient', {
    useFactory: () => new FetchHttpClientImpl()
  });

  // Register WebClientFactory for creating Slack WebClient instances
  container.register('WebClientFactory', {
    useFactory: () => createWebClient
  });

  // Register real SlackClient implementation
  container.registerSingleton<SlackClient>('SlackClient', SlackClientImpl);

  // Register SlackOutputService with factory to properly inject dependencies
  container.register<OutputService>('SlackOutputService', {
    useFactory: (dependencyContainer) => {
      const formatter = dependencyContainer.resolve<SlackShowFormatter>('SlackFormatter');
      const slackClient = dependencyContainer.resolve<SlackClient>('SlackClient');
      const configService = dependencyContainer.resolve<ConfigService>('ConfigService');
      const logger = dependencyContainer.resolve<LoggerService>('LoggerService');
      return new SlackOutputServiceImpl(formatter, slackClient, configService, logger);
    }
  });

  // Register platform type
  container.register('PlatformType', { useValue: 'lambda' });
}

// Export the container


export { container } from 'tsyringe';