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
    renderOutput: jest.fn<(shows: Show[]) => Promise<void>>().mockResolvedValue(undefined)
  };

  const mockConfigService = {
    getCliOptions: jest.fn<() => CliOptions>().mockReturnValue({
      debug: false,
      groupByNetwork: true
    }),
    getShowType: jest.fn<() => string>().mockReturnValue('all'),
    getOutputFormat: jest.fn<() => string>().mockReturnValue('text'),
    getEnvironment: jest.fn<() => string>().mockReturnValue('test'),
    getShowOptions: jest.fn<() => ShowOptions>().mockReturnValue({
      date: '2023-01-01',
      country: 'US',
      fetchSource: 'network'
    }),
    getShowOption: jest.fn<(key: string) => unknown>().mockImplementation((key) => {
      const options = {
        date: '2023-01-01',
        country: 'US',
        fetchSource: 'network'
      };
      return options[key as keyof typeof options];
    }),
    getConfig: jest.fn<() => AppConfig>().mockReturnValue({
      country: 'US',
      types: ['Scripted', 'Reality'],
      networks: [],
      genres: [],
      languages: ['English'],
      notificationTime: '09:00',
      slack: { enabled: false }
    }),
    getHelpText: jest.fn<() => string>().mockReturnValue('Help Text')
  };

  const mockConsoleOutput = {
    log: jest.fn<(message: string) => void>(),
    error: jest.fn<(message: string) => void>()
  };

  // Create services object for dependency injection
  let mockServices: CliServices;

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create services object
    mockServices = {
      outputService: mockOutputService as unknown as OutputService,
      tvShowService: mockTvShowService as unknown as TvShowService,
      configService: mockConfigService as unknown as ConfigService,
      consoleOutput: mockConsoleOutput as unknown as ConsoleOutput
    };
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display shows when no special flags are provided', async () => {
    // Arrange
    const mockShows = Fixtures.domain.getNetworkShows();
    mockTvShowService.fetchShows.mockResolvedValue(mockShows);

    // Act
    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockOutputService.renderOutput).toHaveBeenCalledWith(mockShows);
  });

  it('should show network shows when network type is requested', async () => {
    // Arrange
    const mockNetworkShows = Fixtures.domain.getNetworkShows();
    mockConfigService.getShowOptions.mockReturnValue({
      date: '2023-01-01',
      country: 'US',
      fetchSource: 'network'
    });
    mockTvShowService.fetchShows.mockResolvedValue(mockNetworkShows);

    // Act
    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockOutputService.renderOutput).toHaveBeenCalledWith(mockNetworkShows);
  });

  it('should show streaming shows when streaming type is requested', async () => {
    // Arrange
    const mockStreamingShows = Fixtures.domain.getStreamingShows();
    mockConfigService.getShowOptions.mockReturnValue({
      date: '2023-01-01',
      country: 'US',
      fetchSource: 'web'
    });
    mockTvShowService.fetchShows.mockResolvedValue(mockStreamingShows);

    // Act
    await runCli(mockServices);

    expect(mockTvShowService.fetchShows).toHaveBeenCalled();
    expect(mockOutputService.renderOutput).toHaveBeenCalledWith(mockStreamingShows);
  });

  it('should handle errors when fetching shows', async () => {
    // Arrange
    const testError = new Error('Test error');
    mockTvShowService.fetchShows.mockRejectedValue(testError);

    // Act
    await runCli(mockServices);

    // Assert
    expect(mockConsoleOutput.error).toHaveBeenCalledWith('Error fetching TV shows: Test error');
  });

  it('should handle unexpected errors', async () => {
    // Arrange
    const testError = new Error('Unexpected test error');
    mockConfigService.getShowOptions.mockImplementation(() => {
      throw testError;
    });

    // Act
    await runCli(mockServices);

    // Assert
    expect(mockConsoleOutput.error).toHaveBeenCalledWith('Unexpected error: Unexpected test error');
  });
});
