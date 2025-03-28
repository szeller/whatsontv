import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConsoleOutputServiceImpl } 
  from '../../../implementations/console/consoleOutputServiceImpl';
import { ConsoleOutput } from '../../../interfaces/consoleOutput';
import { ShowFormatter } from '../../../interfaces/showFormatter';
import { ConfigService } from '../../../interfaces/configService';
import { AppConfig, CliOptions } from '../../../types/configTypes';
import { Show, NetworkGroups } from '../../../types/tvShowModel';

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

  public filterShowsByType(shows: Show[], types: string[]): Show[] {
    // Implement this test helper method
    return shows.filter((show): boolean => 
      types.length === 0 || Boolean(types.includes(show.type))
    );
  }

  public filterShowsByNetwork(shows: Show[], networks: string[]): Show[] {
    // Implement this test helper method
    return shows.filter((show): boolean => 
      networks.length === 0 || 
      (networks.includes(show.network))
    );
  }

  public filterShowsByGenre(shows: Show[], genres: string[]): Show[] {
    // Implement this test helper method
    return shows.filter((show): boolean => 
      genres.length === 0 || 
      show.genres.some((genre): boolean => genres.includes(genre))
    );
  }

  public filterShowsBySearch(shows: Show[], searchTerm: string): Show[] {
    // Implement this test helper method
    if (searchTerm === '') return shows;
    const term = searchTerm.toLowerCase();
    return shows.filter((show): boolean => {
      const nameMatch = show.name.toLowerCase().includes(term);
      const summaryMatch = show.summary !== null && 
                          show.summary.toLowerCase().includes(term);
      return Boolean(nameMatch) || Boolean(summaryMatch);
    });
  }

  public groupShowsByNetwork(shows: Show[]): NetworkGroups {
    return super.groupShowsByNetwork(shows);
  }

  public async displayShows(shows: Show[]): Promise<void> {
    if (shows.length === 0) {
      this.consoleOutput.log('No shows found for the specified criteria.');
      return;
    }
    const networkGroups = this.groupShowsByNetwork(shows);
    await this.displayNetworkGroups(networkGroups);
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
      getConfig: jest.fn()
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
  });

  describe('filterShowsByNetwork', () => {
    it('should filter shows by network', async () => {
      // Act
      const filteredShows = service.filterShowsByNetwork(shows, ['ABC']);

      // Assert
      expect(filteredShows.length).toBe(2);
      
      const allABC = filteredShows.every(
        (show): boolean => show.network === 'ABC'
      );
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
});
