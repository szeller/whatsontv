/**
 * Dependency injection container setup
 */
import 'reflect-metadata';
import { container } from 'tsyringe';

// Interface imports
import type { ConfigService } from './interfaces/configService.js';
import type { ConsoleOutput } from './interfaces/consoleOutput.js';
import type { HttpClient } from './interfaces/httpClient.js';
import type { LoggerService } from './interfaces/loggerService.js';
import type { OutputService } from './interfaces/outputService.js';
import type { TextShowFormatter } from './interfaces/showFormatter.js';
import type { StyleService } from './interfaces/styleService.js';
import type { TvShowService } from './interfaces/tvShowService.js';

// Implementation imports
import { ChalkStyleServiceImpl } from './implementations/console/chalkStyleServiceImpl.js';
import { ConsoleConfigServiceImpl } from './implementations/console/consoleConfigServiceImpl.js';
import { ConsoleOutputImpl } from './implementations/console/consoleOutputImpl.js';
import { ConsoleOutputServiceImpl } from './implementations/console/consoleOutputServiceImpl.js';
import { FetchHttpClientImpl } from './implementations/fetchHttpClientImpl.js';
import { PinoLoggerServiceImpl } from './implementations/pino/pinoLoggerServiceImpl.js';
import { TextShowFormatterImpl } from './implementations/console/textShowFormatterImpl.js';
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';

// Register core services
container.registerSingleton<StyleService>('StyleService', ChalkStyleServiceImpl);
container.registerSingleton<TvShowService>('TvShowService', TvMazeServiceImpl);
container.registerSingleton<ConsoleOutput>('ConsoleOutput', ConsoleOutputImpl);
container.registerSingleton<TextShowFormatter>('TextShowFormatter', TextShowFormatterImpl);
container.registerSingleton<LoggerService>('LoggerService', PinoLoggerServiceImpl);

// Register ConfigService with factory to handle the optional parameter
container.register<ConfigService>('ConfigService', {
  useFactory: () => new ConsoleConfigServiceImpl(false)
});

// Register OutputService with factory to properly inject dependencies
container.register<OutputService>('OutputService', {
  useFactory: (dependencyContainer) => {
    const formatter = dependencyContainer.resolve<TextShowFormatter>('TextShowFormatter');
    const consoleOutput = dependencyContainer.resolve<ConsoleOutput>('ConsoleOutput');
    const configService = dependencyContainer.resolve<ConfigService>('ConfigService');
    return new ConsoleOutputServiceImpl(formatter, consoleOutput, configService);
  }
});

// Register HttpClient with factory to handle the optional parameter
container.register<HttpClient>('HttpClient', {
  useFactory: () => new FetchHttpClientImpl()
});

// Register named implementations for specific platforms
container.register('PlatformType', { useValue: 'console' });

export { container };
