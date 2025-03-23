/**
 * Dependency Injection Container Setup
 * 
 * This file configures the tsyringe dependency injection container
 * with all service registrations for the application.
 */

import 'reflect-metadata';
import { container } from 'tsyringe';

// Implementation imports
import { ChalkStyleServiceImpl } from './implementations/console/chalkStyleServiceImpl.js';
import { ConsoleFormatterImpl } from './implementations/console/consoleFormatterImpl.js';
import { ConsoleOutputImpl } from './implementations/console/consoleOutputImpl.js';
import { ConsoleOutputServiceImpl } from './implementations/console/consoleOutputServiceImpl.js';
import { GotHttpClientImpl } from './implementations/gotHttpClientImpl.js';
import { SlackFormatterImpl } from './implementations/slack/slackFormatterImpl.js';
import { SlackOutputServiceImpl } from './implementations/slack/slackOutputServiceImpl.js';
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';

// Interface imports
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { HttpClient } from './interfaces/httpClient.js';
import type { OutputService } from './interfaces/outputService.js';
import type { ShowFormatter } from './interfaces/showFormatter.js';
import type { StyleService } from './interfaces/styleService.js';
import type { TvShowService } from './interfaces/tvShowService.js';

// Register dependencies in the container
// Default implementations
container.registerSingleton<StyleService>('StyleService', ChalkStyleServiceImpl);
container.registerSingleton<ShowFormatter>('ShowFormatter', ConsoleFormatterImpl);
container.registerSingleton<TvShowService>('TvShowService', TvMazeServiceImpl);
container.registerSingleton<OutputService>('OutputService', ConsoleOutputServiceImpl);
container.registerSingleton<ConsoleOutput>('ConsoleOutput', ConsoleOutputImpl);

// Register HttpClient with factory to provide empty options object
container.register<HttpClient>('HttpClient', {
  useFactory: () => new GotHttpClientImpl({})
});

// Register named implementations for specific platforms
container.register('ConsoleFormatter', { useClass: ConsoleFormatterImpl });
container.register('SlackFormatter', { useClass: SlackFormatterImpl });
container.register('ConsoleOutputService', { useClass: ConsoleOutputServiceImpl });
container.register('SlackOutputService', { useClass: SlackOutputServiceImpl });

export { container };
