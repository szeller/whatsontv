/**
 * Dependency injection container setup
 */
import 'reflect-metadata';
import { container } from 'tsyringe';

// Interface imports
import type { ConfigService } from './interfaces/configService.js';
import type { ProcessOutput } from './interfaces/processOutput.js';
import type { HttpClient } from './interfaces/httpClient.js';
import type { LoggerService } from './interfaces/loggerService.js';
import type { OutputService } from './interfaces/outputService.js';
import type { TextShowFormatter } from './interfaces/showFormatter.js';
import type { StyleService } from './interfaces/styleService.js';
import type { TvShowService } from './interfaces/tvShowService.js';

// Implementation imports
import { ChalkStyleServiceImpl } from './implementations/text/chalkStyleServiceImpl.js';
import { CliConfigServiceImpl } from './implementations/text/cliConfigServiceImpl.js';
import { ProcessOutputImpl } from './implementations/processOutputImpl.js';
import { TextOutputServiceImpl } from './implementations/text/textOutputServiceImpl.js';
import { FetchHttpClientImpl } from './implementations/fetchHttpClientImpl.js';
import { PinoLoggerServiceImpl } from './implementations/pino/pinoLoggerServiceImpl.js';
import { TextShowFormatterImpl } from './implementations/text/textShowFormatterImpl.js';
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';

// Register core services
container.registerSingleton<StyleService>('StyleService', ChalkStyleServiceImpl);
container.registerSingleton<TvShowService>('TvShowService', TvMazeServiceImpl);
container.registerSingleton<ProcessOutput>('ProcessOutput', ProcessOutputImpl);
container.registerSingleton<TextShowFormatter>('TextShowFormatter', TextShowFormatterImpl);
container.registerSingleton<LoggerService>('LoggerService', PinoLoggerServiceImpl);

// Register ConfigService with factory to handle the optional parameter
container.register<ConfigService>('ConfigService', {
  useFactory: () => new CliConfigServiceImpl(false)
});

// Register OutputService with factory to properly inject dependencies
container.register<OutputService>('OutputService', {
  useFactory: (dependencyContainer) => {
    const formatter = dependencyContainer.resolve<TextShowFormatter>('TextShowFormatter');
    const processOutput = dependencyContainer.resolve<ProcessOutput>('ProcessOutput');
    const configService = dependencyContainer.resolve<ConfigService>('ConfigService');
    return new TextOutputServiceImpl(formatter, processOutput, configService);
  }
});

// Register HttpClient with factory to handle the optional parameter
container.register<HttpClient>('HttpClient', {
  useFactory: () => new FetchHttpClientImpl()
});

// Register named implementations for specific platforms
container.register('PlatformType', { useValue: 'console' });

export { container };
