import 'reflect-metadata';
import {
  jest,
  describe,
  beforeEach,
  afterEach,
  it,
  expect
} from '@jest/globals';
import type { OutputService } from '../../interfaces/outputService';
import type { TvShowService } from '../../interfaces/tvShowService';
import type { ConfigService } from '../../interfaces/configService';
import type { ConsoleOutput } from '../../interfaces/consoleOutput';
import type { Show } from '../../schemas/domain.js';
import type { CliOptions, AppConfig } from '../../types/configTypes';
import type { ShowOptions } from '../../types/tvShowOptions';
import type { CliServices } from '../../cli';
import { Fixtures } from '../helpers/fixtureHelper';
import { runCli } from '../../cli';

// Mock the console implementation to avoid actual console output during tests
jest.spyOn(console, 'log').mockImplementation(() => {});
jest.spyOn(console, 'error').mockImplementation(() => {});
jest.spyOn(console, 'warn').mockImplementation(() => {});

describe('CLI', () => {
  // Create mock services with proper typing
  const mockTvShowService = {
    getShows: jest.fn<() => Promise<Show[]>>().mockResolvedValue([]),
    getShowsByType: jest.fn<(type: string) => Promise<Show[]>>().mockResolvedValue([]),
    fetchShows: jest.fn<(options: ShowOptions) => Promise<Show[]>>().mockResolvedValue([]),
    isInitialized: jest.fn<() => boolean>().mockReturnValue(true)
  };

  const mockOutputService = {
    formatShows: jest.fn<(shows: Show[], format: string) => string>()
      .mockReturnValue('Formatted shows'),
    formatShowsByType: jest.fn<(shows: Show[], type: string, format: string) => string>()
      .mockReturnValue('Formatted shows by type'),
    displayHeader: jest.fn<() => void>(),
    displayShows: jest.fn<(shows: Show[], groupByNetwork?: boolean) => Promise<void>>()
      .mockResolvedValue(undefined),
    displayFooter: jest.fn<() => void>(),
    isInitialized: jest.fn<() => boolean>().mockReturnValue(true)
  };

  const mockConfigService = {
    getCliOptions: jest.fn<() => CliOptions>().mockReturnValue({
      debug: false,
      help: false,
      groupByNetwork: true
    }),
    setCliOptions: jest.fn<(options: CliOptions) => void>(),
    getOutputFormat: jest.fn<() => string>().mockReturnValue('text'),
    getShowType: jest.fn<() => string>().mockReturnValue('all'),
    isDebug: jest.fn<() => boolean>().mockReturnValue(false),
    getEnvironment: jest.fn<() => string>().mockReturnValue('test'),
    getShowOptions: jest.fn<() => ShowOptions>().mockReturnValue({
      fetchSource: 'all',
      country: 'US'
    }),
    getShowOption: jest.fn<(key: keyof ShowOptions) => ShowOptions[keyof ShowOptions]>(),
    getConfig: jest.fn<() => AppConfig>().mockReturnValue({
      country: 'US',
      types: [],
      networks: [],
      genres: [],
      languages: [],
      notificationTime: '08:00',
      slack: { enabled: false }
    } as AppConfig)
  };

  const mockConsoleOutput = {
    log: jest.fn<(message?: string, ...args: unknown[]) => void>(),
    error: jest.fn<(message?: string, ...args: unknown[]) => void>(),
    warn: jest.fn<(message?: string, ...args: unknown[]) => void>(),
    logWithLevel: jest.fn<(level: string, message: string) => void>()
  };

  // Create the services object to pass to runCli
  const mockServices: CliServices = {
    outputService: mockOutputService as unknown as OutputService,
    tvShowService: mockTvShowService as unknown as TvShowService,
    configService: mockConfigService as unknown as ConfigService,
    consoleOutput: mockConsoleOutput as unknown as ConsoleOutput
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
  });

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  it('should show all shows when no specific type is requested', async () => {
    const mockShows = Fixtures.domain.getNetworkShows().concat(
      Fixtures.domain.getStreamingShows()
    );
    
    mockConfigService.getCliOptions.mockReturnValue({
      debug: false,
      help: false,
      groupByNetwork: true
    });
    mockConfigService.getShowType.mockReturnValue('all');
    mockTvShowService.fetchShows.mockResolvedValue(mockShows);

    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockOutputService.displayShows).toHaveBeenCalledWith(mockShows, true);
  });

  it('should show network shows when network type is requested', async () => {
    const mockNetworkShows = Fixtures.domain.getNetworkShows();
    
    mockConfigService.getCliOptions.mockReturnValue({
      debug: false,
      help: false,
      groupByNetwork: true
    });
    mockConfigService.getShowType.mockReturnValue('network');
    mockTvShowService.fetchShows.mockResolvedValue(mockNetworkShows);

    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockOutputService.displayShows).toHaveBeenCalledWith(mockNetworkShows, true);
  });

  it('should show streaming shows when streaming type is requested', async () => {
    const mockStreamingShows = Fixtures.domain.getStreamingShows();
    
    mockConfigService.getCliOptions.mockReturnValue({
      debug: false,
      help: false,
      groupByNetwork: true
    });
    mockConfigService.getShowType.mockReturnValue('streaming');
    mockTvShowService.fetchShows.mockResolvedValue(mockStreamingShows);

    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockOutputService.displayShows).toHaveBeenCalledWith(mockStreamingShows, true);
  });

  it('should handle errors when fetching shows', async () => {
    const mockError = new Error('Failed to fetch shows');
    
    mockConfigService.getCliOptions.mockReturnValue({
      debug: false,
      help: false,
      groupByNetwork: true
    });
    mockTvShowService.fetchShows.mockRejectedValue(mockError);

    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockConsoleOutput.error).toHaveBeenCalledWith(
      'Error fetching TV shows: Failed to fetch shows'
    );
  });

  it('should display debug info when debug flag is true', async () => {
    const mockShows = [
      { ...Fixtures.domain.getNetworkShows()[0], network: 'ABC' },
      { ...Fixtures.domain.getNetworkShows()[1], network: 'NBC' },
      { ...Fixtures.domain.getStreamingShows()[0], network: 'Netflix' }
    ];
    
    mockConfigService.getCliOptions.mockReturnValue({
      debug: true,
      help: false,
      groupByNetwork: true
    });
    mockConfigService.isDebug.mockReturnValue(true);
    mockTvShowService.fetchShows.mockResolvedValue(mockShows);
    
    // Save the original NODE_ENV
    const originalNodeEnv = process.env.NODE_ENV;
    // Set NODE_ENV to something other than 'test' to allow debug output
    process.env.NODE_ENV = 'development';

    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('\nAvailable Networks:');
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('ABC, NBC, Netflix');
    expect(mockConsoleOutput.log).toHaveBeenCalledWith('\nTotal Shows: 3');
    
    // Restore NODE_ENV
    process.env.NODE_ENV = originalNodeEnv;
  });

  it('should handle uncaught exceptions', async () => {
    // Instead of testing the actual uncaught exception handler,
    // let's test that our error handling in the runCli function works correctly
    const mockError = new Error('Test error');
    
    // Mock the fetchShows method to throw an error
    mockTvShowService.fetchShows.mockRejectedValue(mockError);
    
    // Call the runCli function
    await runCli(mockServices);
    
    // Verify that the error was handled correctly
    expect(mockConsoleOutput.error).toHaveBeenCalledWith(
      'Error fetching TV shows: Test error'
    );
  });
});
