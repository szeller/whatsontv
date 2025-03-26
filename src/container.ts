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
import { ConsoleConfigServiceImpl } from './implementations/console/consoleConfigServiceImpl.js';
import { ConsoleFormatterImpl } from './implementations/console/consoleFormatterImpl.js';
import { ConsoleOutputImpl } from './implementations/console/consoleOutputImpl.js';
import { ConsoleOutputServiceImpl } from './implementations/console/consoleOutputServiceImpl.js';
import { GotHttpClientImpl } from './implementations/gotHttpClientImpl.js';
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';

// Interface imports
import type { ConfigService } from './interfaces/configService.js';
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
container.registerSingleton<ConsoleOutput>('ConsoleOutput', ConsoleOutputImpl);

// Register ConfigService with factory to handle the optional parameter
container.register<ConfigService>('ConfigService', {
  useFactory: () => new ConsoleConfigServiceImpl(false)
});

// Register OutputService with factory to properly inject dependencies
container.register<OutputService>('OutputService', {
  useFactory: (dependencyContainer) => {
    const formatter = dependencyContainer.resolve<ShowFormatter>('ShowFormatter');
    const consoleOutput = dependencyContainer.resolve<ConsoleOutput>('ConsoleOutput');
    const configService = dependencyContainer.resolve<ConfigService>('ConfigService');
    return new ConsoleOutputServiceImpl(formatter, consoleOutput, configService, false);
  }
});

// Register HttpClient with factory to provide empty options object
container.register<HttpClient>('HttpClient', {
  useFactory: () => new GotHttpClientImpl({})
});

// Register named implementations for specific platforms
container.register('ConsoleFormatter', { useClass: ConsoleFormatterImpl });
container.register('ConsoleOutputService', { 
  useFactory: (dependencyContainer) => {
    const formatter = dependencyContainer.resolve<ShowFormatter>('ShowFormatter');
    const consoleOutput = dependencyContainer.resolve<ConsoleOutput>('ConsoleOutput');
    const configService = dependencyContainer.resolve<ConfigService>('ConfigService');
    return new ConsoleOutputServiceImpl(formatter, consoleOutput, configService, false);
  }
});

export { container };
