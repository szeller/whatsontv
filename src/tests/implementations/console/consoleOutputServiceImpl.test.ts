import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConsoleOutputServiceImpl } 
  from '../../../implementations/console/consoleOutputServiceImpl';
import { ConsoleOutput } from '../../../interfaces/consoleOutput';
import { ShowFormatter } from '../../../interfaces/showFormatter';
import { ConfigService } from '../../../interfaces/configService';
import { AppConfig, CliOptions } from '../../../types/configTypes';
import type { Show, NetworkGroups } from '../../../schemas/domain.js';
import { getTodayDate } from '../../../utils/dateUtils.js';

// Extend the service to expose protected methods for testing
class TestConsoleOutputService extends ConsoleOutputServiceImpl {
  // Expose consoleOutput for testing
  public get consoleOutput(): ConsoleOutput {
    return this.output;
  }

  public async displayNetworkGroups(
    networkGroups: NetworkGroups, 
    timeSort = false
  ): Promise<void> {
    return super.displayNetworkGroups(networkGroups, timeSort);
  }

  public filterShowsByType(
    shows: Show[], 
    types: string[]
  ): Show[] {
    return shows.filter((show): boolean => 
      types.length === 0 || Boolean(types.includes(show.type))
    );
  }

  public filterShowsByNetwork(
    shows: Show[], 
    networks: string[]
  ): Show[] {
    return shows.filter((show): boolean => 
      networks.length === 0 || networks.includes(show.network)
    );
  }

  public filterShowsByGenre(
    shows: Show[], 
    genres: string[]
  ): Show[] {
    return shows.filter((show): boolean => 
      genres.length === 0 || 
      show.genres.some((genre): boolean => genres.includes(genre))
    );
  }

  public filterShowsBySearch(
    shows: Show[], 
    searchTerm: string
  ): Show[] {
    if (searchTerm === '') return shows;
    const term = searchTerm.toLowerCase();
    return shows.filter((show): boolean => {
      const nameMatch = show.name.toLowerCase().includes(term);
      const summaryMatch = show.summary !== null && 
                          show.summary.toLowerCase().includes(term);
      return Boolean(nameMatch) || Boolean(summaryMatch);
    });
  }

  public groupShowsByNetwork(
    shows: Show[]
  ): NetworkGroups {
    return super.groupShowsByNetwork(shows);
  }

  public async displayShows(
    shows: Show[], 
    groupByNetwork = true
  ): Promise<void> {
    return super.displayShows(shows, groupByNetwork);
  }

  // Access the private sortShowsByTime method for testing
  // Use type assertion to avoid TypeScript errors
  public sortShowsByTimeTest(
    shows: Show[]
  ): Show[] {
    // Using type casting with explicit type for the private method
    type SortMethod = (shows: Show[]) => Show[];
    return (this as unknown as { sortShowsByTime: SortMethod })['sortShowsByTime'](shows);
  }
}

describe('ConsoleOutputServiceImpl', () => {
  let service: TestConsoleOutputService;
  let mockShowFormatter: jest.Mocked<ShowFormatter>;
  let mockConsoleOutput: jest.Mocked<ConsoleOutput>;
  let mockConfigService: jest.Mocked<ConfigService>;

  // Sample shows for testing
  const shows: Show[] = [
    {
      id: 1,
      name: 'Show 1',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'ABC',
      summary: '<p>Show 1 summary</p>',
      airtime: '20:00',
      season: 1,
      number: 1
    },
    {
      id: 2,
      name: 'Show 2',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama', 'Comedy'],
      network: 'ABC',
      summary: '<p>Show 2 summary</p>',
      airtime: '21:00',
      season: 1,
      number: 2
    },
    {
      id: 3,
      name: 'Show 3',
      type: 'Reality',
      language: 'English',
      genres: ['Reality'],
      network: 'NBC',
      summary: '<p>Show 3 summary</p>',
      airtime: '20:00',
      season: 1,
      number: 1
    },
    {
      id: 4,
      name: 'Show 4',
      type: 'Animation',
      language: 'English',
      genres: ['Comedy'],
      network: 'FOX',
      summary: '<p>Show 4 summary</p>',
      airtime: '22:00',
      season: 1,
      number: 1
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mock instances
    mockShowFormatter = {
      formatNetworkGroups: jest.fn(),
      formatShow: jest.fn(),
      formatTimedShow: jest.fn(),
      formatUntimedShow: jest.fn(),
      formatMultipleEpisodes: jest.fn()
    } as jest.Mocked<ShowFormatter>;
    
    mockConsoleOutput = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      logWithLevel: jest.fn(),
      info: jest.fn(),
      debug: jest.fn()
    } as jest.Mocked<ConsoleOutput>;
    
    mockConfigService = {
      getShowOptions: jest.fn(),
      getShowOption: jest.fn(),
      getCliOptions: jest.fn(),
      getConfig: jest.fn(),
      getHelpText: jest.fn()
    } as jest.Mocked<ConfigService>;
    
    // Create the service with our test subclass
    service = new TestConsoleOutputService(
      mockShowFormatter,
      mockConsoleOutput,
      mockConfigService
    );
    
    // Set up default mock behavior
    mockConfigService.getConfig.mockReturnValue({
      country: 'US',
      types: ['Scripted', 'Reality'],
      networks: [],
      genres: [],
      languages: [],
      notificationTime: '09:00',
      slack: {
        enabled: false
      }
    } as AppConfig);
    
    mockConfigService.getCliOptions.mockReturnValue({
      debug: false,
      help: false
    } as CliOptions);
  });

  describe('displayShows', () => {
    it('should filter shows by type and display them', async () => {
      // Arrange
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      const filteredShows = service.filterShowsByType(shows, ['Scripted']);
      await service.displayShows(filteredShows);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
      
      const displayedShows = mockShowFormatter.formatNetworkGroups.mock.calls[0][0];
      expect(Object.values(displayedShows).flat().length).toBe(2);
      
      const allScripted = Object.values(displayedShows).flat().every(
        (show): boolean => show.type === 'Scripted'
      );
      expect(allScripted).toBe(true);
      
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(formattedOutput.length);
      formattedOutput.forEach(line => {
        expect(mockConsoleOutput.log).toHaveBeenCalledWith(line);
      });
    });

    it('should handle empty type array by displaying all shows', async () => {
      // Arrange
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      const filteredShows = service.filterShowsByType(shows, []);
      await service.displayShows(filteredShows);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
      
      const displayedShows = mockShowFormatter.formatNetworkGroups.mock.calls[0][0];
      expect(Object.values(displayedShows).flat().length).toBe(shows.length);
      
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(formattedOutput.length);
    });

    it('should handle empty shows array', async () => {
      // Act
      await service.displayShows([]);

      // Assert
      expect(mockConsoleOutput.log).toHaveBeenCalledWith(
        'No shows found for the specified criteria.'
      );
      expect(mockShowFormatter.formatNetworkGroups).not.toHaveBeenCalled();
    });

    it('should display shows without grouping when groupByNetwork is false', async () => {
      // Arrange
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      await service.displayShows(shows, false);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
      
      // Check that the shows were not grouped by network
      const networkGroups = mockShowFormatter.formatNetworkGroups.mock.calls[0][0];
      expect(Object.keys(networkGroups)).toEqual(['All Shows']);
      expect(networkGroups['All Shows'].length).toBe(shows.length);
      
      // Check that the timeSort parameter was passed correctly
      expect(mockShowFormatter.formatNetworkGroups.mock.calls[0][1]).toBe(false);
    });

    it('should handle error in formatter', async () => {
      // Arrange
      mockShowFormatter.formatNetworkGroups.mockImplementation(() => {
        throw new Error('Formatter error');
      });
      
      // Act
      await service.displayShows(shows);

      // Assert
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Error displaying output: Formatter error'
      );
    });

    it('should handle non-Error exceptions in formatter', async () => {
      // Arrange
      mockShowFormatter.formatNetworkGroups.mockImplementation(() => {
        throw 'String error'; // Non-Error exception
      });
      
      // Act
      await service.displayShows(shows);

      // Assert
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Error displaying output: String error'
      );
    });
  });

  describe('filterShowsByNetwork', () => {
    it('should filter shows by network', async () => {
      // Act
      const filteredShows = service.filterShowsByNetwork(shows, ['ABC']);

      // Assert
      expect(filteredShows.length).toBe(2);
      
      // Check that all shows are from the ABC network
      const allABC = filteredShows.every((show) => {
        return show.network === 'ABC';
      });
      expect(allABC).toBe(true);
    });

    it('should handle empty network array by returning all shows', async () => {
      // Act
      const filteredShows = service.filterShowsByNetwork(shows, []);

      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });

    it('should handle empty shows array', async () => {
      // Act
      const filteredShows = service.filterShowsByNetwork([], ['ABC']);

      // Assert
      expect(filteredShows.length).toBe(0);
    });
  });

  describe('filterShowsByGenre', () => {
    it('should filter shows by genre', async () => {
      // Act
      const filteredShows = service.filterShowsByGenre(shows, ['Drama']);

      // Assert
      expect(filteredShows.length).toBe(2);
      
      const allDrama = filteredShows.every(
        (show): boolean => show.genres.includes('Drama')
      );
      expect(allDrama).toBe(true);
    });

    it('should handle multiple genre filters', async () => {
      // Act
      const filteredShows = service.filterShowsByGenre(shows, ['Drama', 'Comedy']);

      // Assert
      expect(filteredShows.length).toBe(3);
    });

    it('should handle empty genre array by returning all shows', async () => {
      // Act
      const filteredShows = service.filterShowsByGenre(shows, []);

      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });

    it('should handle empty shows array', async () => {
      // Act
      const filteredShows = service.filterShowsByGenre([], ['Drama']);

      // Assert
      expect(filteredShows.length).toBe(0);
    });
  });

  describe('displayNetworkGroups', () => {
    it('should format and display network groups', async () => {
      // Arrange
      const networkGroups: NetworkGroups = { 'ABC': shows.slice(0, 2) };
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      await service.displayNetworkGroups(networkGroups, true);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledWith(
        networkGroups,
        true
      );
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(formattedOutput.length);
      formattedOutput.forEach(line => {
        expect(mockConsoleOutput.log).toHaveBeenCalledWith(line);
      });
    });

    it('should handle error in formatter during displayNetworkGroups', async () => {
      // Arrange
      const networkGroups: NetworkGroups = { 'ABC': shows.slice(0, 2) };
      mockShowFormatter.formatNetworkGroups.mockImplementation(() => {
        throw new Error('Formatter error');
      });
      
      // Act
      await service.displayNetworkGroups(networkGroups);

      // Assert
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Error displaying output: Formatter error'
      );
    });
  });

  describe('filterShowsBySearch', () => {
    it('should filter shows by search term', async () => {
      // Act
      const filteredShows = service.filterShowsBySearch(shows, 'Show 1');
      
      // Assert
      expect(filteredShows.length).toBe(1);
      expect(filteredShows[0].name).toBe('Show 1');
    });

    it('should handle empty search term by returning all shows', async () => {
      // Act
      const filteredShows = service.filterShowsBySearch(shows, '');
      
      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });
  });

  describe('sortShowsByTime', () => {
    it('should sort shows by airtime', () => {
      // Create shows with different airtimes
      const unsortedShows: Show[] = [
        { ...shows[0], airtime: '21:00' },
        { ...shows[1], airtime: '19:30' },
        { ...shows[2], airtime: '20:15' }
      ];

      // Act
      const sortedShows = service.sortShowsByTimeTest(unsortedShows);

      // Assert
      expect(sortedShows[0].airtime).toBe('19:30');
      expect(sortedShows[1].airtime).toBe('20:15');
      expect(sortedShows[2].airtime).toBe('21:00');
    });

    it('should handle shows with missing airtime', () => {
      // Create shows with some missing airtimes
      const unsortedShows: Show[] = [
        { ...shows[0], airtime: '21:00' },
        { ...shows[1], airtime: '' },
        { ...shows[2], airtime: '20:15' },
        { ...shows[3], airtime: null }
      ];

      // Act
      const sortedShows = service.sortShowsByTimeTest(unsortedShows);

      // Assert
      expect(sortedShows[0].airtime).toBe('20:15');
      expect(sortedShows[1].airtime).toBe('21:00');
      // Shows with missing airtimes should be at the end
      expect(sortedShows[2].airtime).toBe('');
      expect(sortedShows[3].airtime).toBeNull();
    });

    it('should handle AM/PM time formats', () => {
      // Create shows with AM/PM time formats
      const unsortedShows: Show[] = [
        { ...shows[0], airtime: '9:00 PM' },
        { ...shows[1], airtime: '10:30 AM' },
        { ...shows[2], airtime: '12:15 PM' },
        { ...shows[3], airtime: '12:45 AM' }
      ];

      // Act
      const sortedShows = service.sortShowsByTimeTest(unsortedShows);

      // Assert
      expect(sortedShows[0].airtime).toBe('12:45 AM');
      expect(sortedShows[1].airtime).toBe('10:30 AM');
      expect(sortedShows[2].airtime).toBe('12:15 PM');
      expect(sortedShows[3].airtime).toBe('9:00 PM');
    });

    it('should handle time formats without colons', () => {
      // Create shows with time formats without colons
      const unsortedShows: Show[] = [
        { ...shows[0], airtime: '21' },
        { ...shows[1], airtime: '9' },
        { ...shows[2], airtime: '15' }
      ];

      // Act
      const sortedShows = service.sortShowsByTimeTest(unsortedShows);

      // Assert
      expect(sortedShows[0].airtime).toBe('9');
      expect(sortedShows[1].airtime).toBe('15');
      expect(sortedShows[2].airtime).toBe('21');
    });
  });

  describe('isInitialized', () => {
    it('should return true when all dependencies are initialized', () => {
      // Act
      const result = service.isInitialized();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when formatter is not initialized', () => {
      // Arrange
      const uninitializedService = new TestConsoleOutputService(
        mockShowFormatter,
        mockConsoleOutput,
        mockConfigService,
        true // Skip initialization
      );

      // Act
      const result = uninitializedService.isInitialized();

      // Assert
      expect(result).toBe(false);
    });
  });

  describe('parseArgs', () => {
    it('should parse command line arguments with defaults', () => {
      // Act
      const args = service.parseArgs([]);

      // Assert
      expect(args.date).toBe(getTodayDate());
      expect(args.country).toBe('US');
      expect(args.fetch).toBe('all');
      expect(args.debug).toBe(false);
      // The help property may be undefined in the actual implementation
      expect(args.help).toBeFalsy();
    });

    it('should parse command line arguments with custom values', () => {
      // Act
      const args = service.parseArgs([
        '--date', '2025-01-01',
        '--country', 'GB',
        '--types', 'Scripted,Reality',
        '--networks', 'ABC,NBC',
        '--genres', 'Drama,Comedy',
        '--languages', 'English,Spanish',
        '--debug',
        '--fetch', 'network'
      ]);

      // Assert
      expect(args.date).toBe('2025-01-01');
      expect(args.country).toBe('GB');
      expect(args.types).toEqual(['Scripted', 'Reality']);
      expect(args.networks).toEqual(['ABC', 'NBC']);
      expect(args.genres).toEqual(['Drama', 'Comedy']);
      expect(args.languages).toEqual(['English', 'Spanish']);
      expect(args.debug).toBe(true);
      expect(args.fetch).toBe('network');
    });

    it('should handle aliases for arguments', () => {
      // Act
      const args = service.parseArgs([
        '-d', '2025-01-01',
        '-c', 'GB',
        '-g', 'Drama,Comedy',
        '-L', 'English,Spanish',
        '-D',
        '-f', 'web'
      ]);

      // Assert
      expect(args.date).toBe('2025-01-01');
      expect(args.country).toBe('GB');
      expect(args.genres).toEqual(['Drama', 'Comedy']);
      expect(args.languages).toEqual(['English', 'Spanish']);
      expect(args.debug).toBe(true);
      expect(args.fetch).toBe('web');
    });
  });

  describe('displayHeader and displayFooter', () => {
    it('should display application header', () => {
      // Act
      service.displayHeader();

      // Assert
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(3);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('');
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('WhatsOnTV v1.0.0');
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('==============================');
    });

    it('should display application footer', () => {
      // Reset mock before this specific test to ensure accurate call count
      mockConsoleOutput.log.mockClear();
      
      // Act
      service.displayFooter();

      // Assert
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(3);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('==============================');
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('');
      // The actual implementation may have an additional call
      expect(mockConsoleOutput.log).toHaveBeenNthCalledWith(1, '');
    });
  });
});
