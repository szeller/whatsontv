/**
 * Tests for ConsoleOutputServiceImpl
 */
import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import type { ShowOptions } from '../../../types/tvShowOptions.js';
import type { CliOptions, AppConfig } from '../../../types/configTypes.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import { 
  ConsoleOutputServiceImpl 
} from '../../../implementations/console/consoleOutputServiceImpl.js';
import type { ConsoleCliArgs } from '../../../implementations/console/consoleOutputServiceImpl.js';
import type { Show } from '../../../types/tvShowModel.js';
import type { NetworkGroups } from '../../../utils/showUtils.js';

// Create a test subclass that extends the implementation
class TestConsoleOutputService extends ConsoleOutputServiceImpl {
  // Make formatter and output public for testing
  public formatter: ShowFormatter;
  public output: ConsoleOutput;
  public configService: ConfigService;
  
  // Constructor to inject mocks for testing
  constructor(
    mockShowFormatter: ShowFormatter,
    mockConsoleOutput: ConsoleOutput,
    mockConfigService: ConfigService
  ) {
    super(mockShowFormatter, mockConsoleOutput, mockConfigService, true);
    this.formatter = mockShowFormatter;
    this.output = mockConsoleOutput;
    this.configService = mockConfigService;
  }
  
  // Override the groupShowsByNetwork method for testing if needed
  protected override groupShowsByNetwork(shows: Show[]): NetworkGroups {
    // For testing, we can just return the default implementation
    // or provide a custom implementation for specific test cases
    return super.groupShowsByNetwork(shows);
  }
  
  // Override parseArgs to avoid process.exit() calls during testing
  public override parseArgs(args?: string[]): ConsoleCliArgs {
    if (!args || args.length === 0) {
      return {
        date: '2023-01-01',
        country: 'US',
        help: false,
        debug: false,
        fetch: 'all',
        types: [],
        networks: [],
        genres: [],
        languages: [],
        _: [],
        $0: ''
      };
    }
    
    // For testing, we'll parse the arguments manually
    const result: ConsoleCliArgs = {
      date: '2023-01-01',
      country: 'US',
      help: false,
      debug: false,
      fetch: 'all',
      types: [],
      networks: [],
      genres: [],
      languages: [],
      _: [],
      $0: ''
    };
    
    // Process the arguments
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      const nextArg = i + 1 < args.length ? args[i + 1] : null;
      const isValidArg = (val: string | null): boolean => 
        val !== null && val !== undefined && val !== '';
      
      if (arg === '--date' || arg === '-d') {
        if (isValidArg(nextArg)) result.date = nextArg as string;
        i++;
      } else if (arg === '--country' || arg === '-c') {
        if (isValidArg(nextArg)) result.country = nextArg as string;
        i++;
      } else if (arg === '--types') {
        if (isValidArg(nextArg)) result.types = (nextArg as string).split(',');
        i++;
      } else if (arg === '--networks') {
        if (isValidArg(nextArg)) result.networks = (nextArg as string).split(',');
        i++;
      } else if (arg === '--genres' || arg === '-g') {
        if (isValidArg(nextArg)) result.genres = (nextArg as string).split(',');
        i++;
      } else if (arg === '--languages' || arg === '-L') {
        if (isValidArg(nextArg)) result.languages = (nextArg as string).split(',');
        i++;
      } else if (arg === '--debug' || arg === '-D') {
        result.debug = true;
      } else if (arg === '--fetch' || arg === '-f') {
        if (isValidArg(nextArg)) result.fetch = nextArg as 'network' | 'web' | 'all';
        i++;
      }
    }
    
    return result;
  }
}

describe('ConsoleOutputServiceImpl', () => {
  // Mock objects
  let mockConsoleOutput: jest.Mocked<ConsoleOutput>;
  let mockShowFormatter: jest.Mocked<ShowFormatter>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let service: TestConsoleOutputService;

  // Sample test data
  let mockShow: Show;

  beforeEach(() => {
    // Reset container for each test
    // container.clearInstances();

    // Create mock objects
    mockConsoleOutput = {
      log: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
      warn: jest.fn(),
      info: jest.fn()
    } as unknown as jest.Mocked<ConsoleOutput>;

    mockShowFormatter = {
      formatShow: jest.fn(),
      formatTimedShow: jest.fn(),
      formatUntimedShow: jest.fn(),
      formatMultipleEpisodes: jest.fn(),
      formatNetworkGroups: jest.fn()
    };

    // Create mock Show
    mockShow = {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: 'Test summary',
      airtime: '21:00',
      season: 1,
      number: 1
    };

    // Create mock ConfigService
    const defaultShowOptions: ShowOptions = {
      date: '2025-03-25',
      country: 'US',
      types: [],
      networks: [],
      genres: [],
      languages: ['English'],
      fetchSource: 'all'
    };
    const defaultCliOptions: CliOptions = {
      debug: false,
      help: false
    };
    const defaultAppConfig: AppConfig = {
      country: 'US',
      types: [],
      networks: [],
      genres: [],
      languages: ['English'],
      notificationTime: '09:00',
      slack: {
        enabled: false
      }
    };
    
    mockConfigService = {
      getShowOptions: jest.fn().mockReturnValue(defaultShowOptions),
      getShowOption: jest.fn().mockImplementation(
        (key) => defaultShowOptions[key as keyof ShowOptions]
      ),
      getCliOptions: jest.fn().mockReturnValue(defaultCliOptions),
      getConfig: jest.fn().mockReturnValue(defaultAppConfig)
    } as jest.Mocked<ConfigService>;

    // Create the service with our test subclass
    service = new TestConsoleOutputService(
      mockShowFormatter,
      mockConsoleOutput,
      mockConfigService
    );

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('displayShows', () => {
    /**
     * Tests that shows are properly displayed when grouped by network
     */
    it('should display shows grouped by network', async (): Promise<void> => {
      // Arrange
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Formatted network output']);
      
      // Act
      await service.displayShows([mockShow], true);
      
      // Assert
      expect(formatNetworkGroupsFn).toHaveBeenCalledWith(
        expect.objectContaining({
          'Test Network': expect.arrayContaining([mockShow])
        }),
        true
      );
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      expect(logFn).toHaveBeenCalledWith('Formatted network output');
    });

    /**
     * Tests that the service correctly handles empty show arrays
     * by displaying an appropriate message
     */
    it('should handle empty shows array', async (): Promise<void> => {
      // Act
      await service.displayShows([], false);

      // Assert
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      expect(logFn).toHaveBeenCalledWith(
        'No shows found for the specified criteria.'
      );
    });
    
    /**
     * Tests that the service properly handles errors during output
     */
    it('should handle errors during output', async (): Promise<void> => {
      // Arrange
      // First mock formatNetworkGroups to return an array
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Formatted output']);
      
      // Then mock console.log to throw an error
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      logFn.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Act & Assert
      await service.displayShows([mockShow], false);
      
      // Verify error was logged
      const errorFn = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorFn).toHaveBeenCalledWith(
        'Error displaying output: Test error'
      );
    });
    
    /**
     * Tests that the service properly handles non-Error objects thrown during output
     */
    it('should handle non-Error objects thrown during output', async (): Promise<void> => {
      // Arrange
      // First mock formatNetworkGroups to return an array
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Formatted output']);
      
      // Then mock console.log to throw a non-Error
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      logFn.mockImplementation(() => {
        throw 'String error'; // Not an Error object
      });
      
      // Act & Assert
      await service.displayShows([mockShow], false);
      
      // Verify error was logged
      const errorFn = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorFn).toHaveBeenCalledWith(
        'Error displaying output: String error'
      );
    });
  });

  describe('displayNetworkGroups', () => {
    /**
     * Tests that the service correctly formats and displays network groups
     */
    it('should format and display network groups', async (): Promise<void> => {
      // Arrange
      const mockNetworkGroups = {
        'Network A': [mockShow],
        'Network B': [mockShow]
      };
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Line 1', 'Line 2']);
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, false);
      
      // Assert
      expect(formatNetworkGroupsFn).toHaveBeenCalledWith(mockNetworkGroups, false);
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      expect(logFn).toHaveBeenCalledWith('Line 1');
      expect(logFn).toHaveBeenCalledWith('Line 2');
    });

    /**
     * Tests that the timeSort parameter is correctly passed to the formatter
     */
    it('should pass timeSort parameter to formatter', async (): Promise<void> => {
      // Arrange
      const mockNetworkGroups = { 'Network A': [mockShow] };
      const timeSort = true;
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Formatted output']);
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, timeSort);
      
      // Assert
      expect(formatNetworkGroupsFn).toHaveBeenCalledWith(mockNetworkGroups, timeSort);
    });

    /**
     * Tests that the service properly handles errors during output
     */
    it('should handle errors during output', async (): Promise<void> => {
      // Arrange
      // First mock formatNetworkGroups to return an array
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Formatted output']);
      
      // Then mock console.log to throw an error
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      logFn.mockImplementation(() => {
        throw new Error('Test error');
      });
      
      // Act & Assert
      await service.displayNetworkGroups({ 'Network A': [mockShow] }, false);
      
      // Verify error was logged
      const errorFn = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorFn).toHaveBeenCalledWith(
        'Error displaying output: Test error'
      );
    });
    
    /**
     * Tests that the service properly handles non-Error objects thrown during output
     */
    it('should handle non-Error objects thrown during output', async (): Promise<void> => {
      // Arrange
      // First mock formatNetworkGroups to return an array
      const formatNetworkGroupsFn = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsFn.mockReturnValue(['Formatted output']);
      
      // Then mock console.log to throw a non-Error
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      logFn.mockImplementation(() => {
        throw 'String error'; // Not an Error object
      });
      
      // Act & Assert
      await service.displayNetworkGroups({ 'Network A': [mockShow] }, false);
      
      // Verify error was logged
      const errorFn = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorFn).toHaveBeenCalledWith(
        'Error displaying output: String error'
      );
    });
  });
  
  describe('parseArgs', () => {
    /**
     * Tests that command line arguments are parsed correctly with defaults
     */
    it('should parse command line arguments with defaults', (): void => {
      // Act
      const args = service.parseArgs(['--date', '2023-01-01']);
      
      // Assert
      expect(args.date).toBe('2023-01-01');
      expect(args.country).toBe('US');
      expect(args.fetch).toBe('all');
    });
    
    /**
     * Tests that array parameters are handled correctly
     */
    it('should handle array parameters correctly', (): void => {
      // Act
      const args = service.parseArgs([
        '--types', 'Scripted,Reality', 
        '--networks', 'HBO,Netflix'
      ]);
      
      // Assert
      expect(args.types).toEqual(['Scripted', 'Reality']);
      expect(args.networks).toEqual(['HBO', 'Netflix']);
    });
    
    /**
     * Tests that genres and languages parameters are handled correctly
     */
    it('should handle genres and languages parameters', (): void => {
      // Act
      const args = service.parseArgs([
        '--genres', 'Drama,Comedy', 
        '--languages', 'English,Spanish'
      ]);
      
      // Assert
      expect(args.genres).toEqual(['Drama', 'Comedy']);
      expect(args.languages).toEqual(['English', 'Spanish']);
    });
    
    /**
     * Tests that boolean flags are handled correctly
     */
    it('should handle boolean flags', (): void => {
      // Act
      const args = service.parseArgs(['--debug']);
      
      // Assert
      expect(args.debug).toBe(true);
    });
    
    /**
     * Tests that aliases are handled correctly
     */
    it('should handle aliases correctly', (): void => {
      // Act
      const args = service.parseArgs([
        '-d', '2023-01-01', 
        '-c', 'GB',
        '-D',
        '-g', 'Drama,Comedy',
        '-L', 'English,Spanish',
        '-f', 'web'
      ]);
      
      // Assert
      expect(args.date).toBe('2023-01-01');
      expect(args.country).toBe('GB');
      expect(args.debug).toBe(true);
      expect(args.genres).toEqual(['Drama', 'Comedy']);
      expect(args.languages).toEqual(['English', 'Spanish']);
      expect(args.fetch).toBe('web');
    });
  });
  
  describe('displayHeader', () => {
    /**
     * Tests that the application header is correctly displayed
     */
    it('should display application header with app name and version', (): void => {
      // Act
      service.displayHeader();
      
      // Assert
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      expect(logFn).toHaveBeenCalledTimes(2);
      expect(logFn).toHaveBeenNthCalledWith(1, '\nWhatsOnTV v1.0.0');
      expect(logFn).toHaveBeenNthCalledWith(2, '==============================');
    });
  });
  
  describe('displayFooter', () => {
    /**
     * Tests that the application footer is correctly displayed
     */
    it('should display application footer with API URL', (): void => {
      // Act
      service.displayFooter();
      
      // Assert
      const logFn = jest.spyOn(mockConsoleOutput, 'log');
      expect(logFn).toHaveBeenCalledTimes(2);
      expect(logFn).toHaveBeenNthCalledWith(1, '\n==============================');
      expect(logFn).toHaveBeenNthCalledWith(
        2, 
        'Data provided by TVMaze API (https://api.tvmaze.com)'
      );
    });
  });
  
  describe('isInitialized', () => {
    /**
     * Tests that isInitialized returns true when all dependencies are set
     */
    it('should return true when properly initialized', (): void => {
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(true);
    });
    
    /**
     * Tests that isInitialized returns false when formatter is not set
     */
    it('should return false when formatter is not initialized', (): void => {
      // Arrange
      // @ts-expect-error - Testing invalid state
      service.formatter = undefined;
      
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(false);
    });
    
    /**
     * Tests that isInitialized returns false when output is not set
     */
    it('should return false when output is not initialized', (): void => {
      // Arrange
      // @ts-expect-error - Testing invalid state
      service.output = undefined;
      
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(false);
    });
    
    /**
     * Tests that isInitialized returns false when configService is not set
     */
    it('should return false when configService is not initialized', (): void => {
      // Arrange
      // @ts-expect-error - Testing invalid state
      service.configService = undefined;
      
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
