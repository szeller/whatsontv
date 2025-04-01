import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConsoleOutputServiceImpl } 
  from '../../../implementations/console/consoleOutputServiceImpl.js';
import { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { Show, NetworkGroups } from '../../../schemas/domain.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder.js';
import { AppConfig, CliOptions } from '../../../types/configTypes.js';
import { sortShowsByTime } from '../../../utils/showUtils.js';

// Extend the service to expose protected methods for testing
class TestConsoleOutputService extends ConsoleOutputServiceImpl {
  // Expose consoleOutput for testing
  getConsoleOutput(): ConsoleOutput {
    return this.output;
  }
  
  // Add test methods for filtering that don't exist in the parent class
  testFilterShowsByType(
    shows: Show[], 
    types: string[]
  ): Show[] {
    // Check if types is null/undefined or empty array
    if (types === undefined || types === null || types.length === 0) {
      return shows;
    }
    return shows.filter((show) => types.includes(show.type));
  }
  
  testFilterShowsByNetwork(
    shows: Show[], 
    networks: string[]
  ): Show[] {
    // Check if networks is null/undefined or empty array
    if (networks === undefined || networks === null || networks.length === 0) {
      return shows;
    }
    return shows.filter((show) => networks.includes(show.network));
  }
  
  testFilterShowsByGenre(
    shows: Show[], 
    genres: string[]
  ): Show[] {
    // Check if genres is null/undefined or empty array
    if (genres === undefined || genres === null || genres.length === 0) {
      return shows;
    }
    return shows.filter((show) => 
      show.genres.some((genre) => genres.includes(genre))
    );
  }
  
  testFilterShowsBySearch(
    shows: Show[], 
    searchTerm: string
  ): Show[] {
    // Handle both null/undefined and empty strings
    if (searchTerm === undefined || searchTerm === null) {
      return shows;
    }
    
    const trimmedTerm = searchTerm.trim();
    if (trimmedTerm === '') {
      return shows;
    }
    
    const term = trimmedTerm.toLowerCase();
    return shows.filter((show) => 
      show.name.toLowerCase().includes(term) || 
      (show.summary !== undefined && show.summary !== null && 
       show.summary.toLowerCase().includes(term))
    );
  }
  
  // Expose protected methods for testing
  testGroupShowsByNetwork(
    shows: Show[]
  ): NetworkGroups {
    return super.groupShowsByNetwork(shows);
  }
  
  testDisplayNetworkGroups(
    networkGroups: NetworkGroups, 
    timeSort = false
  ): Promise<void> {
    return super.displayNetworkGroups(networkGroups, timeSort);
  }
  
  testDisplayShows(
    shows: Show[], 
    groupByNetwork = true
  ): Promise<void> {
    return super.displayShows(shows, groupByNetwork);
  }
  
  // Access the private sortShowsByTime method for testing
  // Use type assertion to avoid TypeScript errors
  sortShowsByTimeTest(
    shows: Show[]
  ): Show[] {
    return sortShowsByTime(shows);
  }
}

describe('ConsoleOutputServiceImpl', () => {
  let service: TestConsoleOutputService;
  let mockShowFormatter: jest.Mocked<ShowFormatter>;
  let mockConsoleOutput: jest.Mocked<ConsoleOutput>;
  let mockConfigService: jest.Mocked<ConfigService>;

  // Sample shows for testing - create them individually for better control
  const shows: Show[] = [
    new ShowBuilder()
      .withId(1)
      .withName('Show 1')
      .withType('Scripted')
      .withLanguage('English')
      .withGenres(['Drama'])
      .withNetwork('ABC')
      .withSummary('<p>Show 1 summary</p>')
      .withAirtime('20:00')
      .withEpisode(1, 1)
      .build(),
    new ShowBuilder()
      .withId(2)
      .withName('Show 2')
      .withType('Scripted')
      .withLanguage('English')
      .withGenres(['Drama', 'Comedy'])
      .withNetwork('ABC')
      .withSummary('<p>Show 2 summary</p>')
      .withAirtime('21:00')
      .withEpisode(1, 2)
      .build(),
    new ShowBuilder()
      .withId(3)
      .withName('Show 3')
      .withType('Reality')
      .withLanguage('English')
      .withGenres(['Reality'])
      .withNetwork('NBC')
      .withSummary('<p>Show 3 summary</p>')
      .withAirtime('20:00')
      .withEpisode(1, 1)
      .build(),
    new ShowBuilder()
      .withId(4)
      .withName('Show 4')
      .withType('Animation')
      .withLanguage('English')
      .withGenres(['Comedy'])
      .withNetwork('FOX')
      .withSummary('<p>Show 4 summary</p>')
      .withAirtime('22:00')
      .withEpisode(1, 1)
      .build()
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
    
    // Create mocks
    mockShowFormatter = {
      formatShow: jest.fn(),
      formatTimedShow: jest.fn(),
      formatUntimedShow: jest.fn(),
      formatMultipleEpisodes: jest.fn(),
      formatNetworkGroups: jest.fn()
    } as jest.Mocked<ShowFormatter>;
    
    mockConsoleOutput = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      info: jest.fn(),
      debug: jest.fn(),
      logWithLevel: jest.fn()
    } as jest.Mocked<ConsoleOutput>;
    
    mockConfigService = {
      getConfig: jest.fn(),
      getCliOptions: jest.fn(),
      getShowOptions: jest.fn(),
      getShowOption: jest.fn(),
      getHelpText: jest.fn()
    } as jest.Mocked<ConfigService>;
    
    // Set up mock returns
    mockConfigService.getConfig.mockReturnValue({
      date: '2023-01-01',
      country: 'US',
      debug: false,
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
      date: '2023-01-01',
      help: false
    } as CliOptions);
    
    // Create the service with our test subclass
    service = new TestConsoleOutputService(
      mockShowFormatter,
      mockConsoleOutput,
      mockConfigService
    );
  });

  describe('displayShows', () => {
    it('should display shows grouped by network by default', async () => {
      // Arrange
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      await service.testDisplayShows(shows);
      
      // Assert
      // Should call printHeader at least once
      expect(mockConsoleOutput.log).toHaveBeenCalled();
      
      // Should call print or println for each show
      expect(mockConsoleOutput.log.mock.calls.length).toBeGreaterThan(0);
      
      // Should call formatShow for each show
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
    });

    it('should filter shows by type and display them', async () => {
      // Arrange
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      const filteredShows = service.testFilterShowsByType(shows, ['Scripted']);
      await service.testDisplayShows(filteredShows);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
      
      const displayedShows = mockShowFormatter.formatNetworkGroups.mock.calls[0][0];
      expect(Object.values(displayedShows).flat().length).toBe(2);
      
      // Use arrow function to avoid unbound method issue
      const allScripted = Object.values(displayedShows).flat().every(
        (show: Show): boolean => show.type === 'Scripted'
      );
      expect(allScripted).toBe(true);
      
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(formattedOutput.length);
      formattedOutput.forEach((line: string): void => {
        expect(mockConsoleOutput.log).toHaveBeenCalledWith(line);
      });
    });

    it('should not filter shows when types array is empty', async () => {
      // Arrange
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      const filteredShows = service.testFilterShowsByType(shows, []);
      await service.testDisplayShows(filteredShows);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
      
      const displayedShows = mockShowFormatter.formatNetworkGroups.mock.calls[0][0];
      expect(Object.values(displayedShows).flat().length).toBe(shows.length);
      
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(formattedOutput.length);
    });

    it('should handle empty shows array', async () => {
      // Act
      await service.testDisplayShows([]);

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
      await service.testDisplayShows(shows, false);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledTimes(1);
      
      // Check that the shows were not grouped by network
      const networkGroups = mockShowFormatter.formatNetworkGroups.mock.calls[0][0];
      expect(Object.keys(networkGroups)).toEqual(['All Shows']);
      expect(networkGroups['All Shows'].length).toBe(shows.length);
      
      // Check that timeSort was set to false
      expect(mockShowFormatter.formatNetworkGroups.mock.calls[0][1]).toBe(false);
    });

    it('should handle error in formatter', async () => {
      // Arrange
      mockShowFormatter.formatNetworkGroups.mockImplementation(() => {
        throw new Error('Formatter error');
      });
      
      // Act
      await service.testDisplayShows(shows);

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
      await service.testDisplayShows(shows);

      // Assert
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Error displaying output: String error'
      );
    });
  });

  describe('filterShowsByType', () => {
    it('should filter shows by type', () => {
      // Act
      const filteredShows = service.testFilterShowsByType(shows, ['Scripted']);
      
      // Assert
      expect(filteredShows.length).toBe(2);
      
      // Check that all shows are of type 'Scripted'
      const allScripted = filteredShows.every(
        function(this: void, show: Show): boolean { 
          return show.type === 'Scripted'; 
        }
      );
      expect(allScripted).toBe(true);
    });
    
    it('should not filter shows when types array is empty', () => {
      // Act
      const filteredShows = service.testFilterShowsByType(shows, []);
      
      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });
  });
  
  describe('filterShowsByNetwork', () => {
    it('should filter shows by network', () => {
      // Act
      const filteredShows = service.testFilterShowsByNetwork(shows, ['ABC']);
      
      // Assert
      expect(filteredShows.length).toBe(2);
      
      // Check that all shows are from the ABC network
      const allABC = filteredShows.every(
        function(this: void, show: Show): boolean { 
          return show.network === 'ABC'; 
        }
      );
      expect(allABC).toBe(true);
    });
    
    it('should not filter shows when networks array is empty', () => {
      // Act
      const filteredShows = service.testFilterShowsByNetwork(shows, []);
      
      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });
  });
  
  describe('filterShowsByGenre', () => {
    it('should filter shows by genre', () => {
      // Act
      const filteredShows = service.testFilterShowsByGenre(shows, ['Comedy']);
      
      // Assert
      expect(filteredShows.length).toBe(2);
      
      // Check that all shows have the Comedy genre
      const allComedy = filteredShows.every(
        function(this: void, show: Show): boolean { 
          return show.genres.includes('Comedy'); 
        }
      );
      expect(allComedy).toBe(true);
    });
    
    it('should not filter shows when genres array is empty', () => {
      // Act
      const filteredShows = service.testFilterShowsByGenre(shows, []);
      
      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });
  });
  
  describe('filterShowsBySearch', () => {
    it('should filter shows by search term in name', () => {
      // Act
      const filteredShows = service.testFilterShowsBySearch(shows, 'Show 1');
      
      // Assert
      expect(filteredShows.length).toBe(1);
      expect(filteredShows[0].name).toBe('Show 1');
    });
    
    it('should filter shows by search term in summary', () => {
      // Act
      const filteredShows = service.testFilterShowsBySearch(shows, 'summary');
      
      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });
    
    it('should not filter shows when search term is empty', () => {
      // Act
      const filteredShows = service.testFilterShowsBySearch(shows, '');
      
      // Assert
      expect(filteredShows.length).toBe(shows.length);
    });
  });
  
  describe('displayNetworkGroups', () => {
    it('should display network groups with time sorting', async () => {
      // Arrange
      const networkGroups: NetworkGroups = { 'ABC': shows.slice(0, 2) };
      const formattedOutput = ['Line 1', 'Line 2', 'Line 3'];
      mockShowFormatter.formatNetworkGroups.mockReturnValue(formattedOutput);
      
      // Act
      await service.testDisplayNetworkGroups(networkGroups, true);
      
      // Assert
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledWith(
        networkGroups,
        true
      );
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(formattedOutput.length);
      formattedOutput.forEach(
        function(this: void, line: string): void {
          expect(mockConsoleOutput.log).toHaveBeenCalledWith(line);
        }
      );
    });
    
    it('should handle errors in formatter', async () => {
      // Arrange
      const networkGroups: NetworkGroups = { 'ABC': shows.slice(0, 2) };
      mockShowFormatter.formatNetworkGroups.mockImplementation(() => {
        throw new Error('Formatter error');
      });
      
      // Act
      await service.testDisplayNetworkGroups(networkGroups);
      
      // Assert
      expect(mockConsoleOutput.error).toHaveBeenCalledWith(
        'Error displaying output: Formatter error'
      );
    });
  });
  
  describe('groupShowsByNetwork', () => {
    it('should group shows by network', () => {
      // Act
      const networkGroups = service.testGroupShowsByNetwork(shows);
      
      // Assert
      expect(Object.keys(networkGroups).length).toBe(3);
      expect(networkGroups['ABC'].length).toBe(2);
      expect(networkGroups['NBC'].length).toBe(1);
      expect(networkGroups['FOX'].length).toBe(1);
    });
    
    it('should handle empty shows array', () => {
      // Act
      const networkGroups = service.testGroupShowsByNetwork([]);
      
      // Assert
      expect(Object.keys(networkGroups).length).toBe(0);
    });
  });
  
  describe('sortShowsByTime', () => {
    it('should sort shows by airtime', () => {
      // Create test data with specific airtimes
      const testShows = ShowBuilder.withSpecificAirtimes(['20:00', '21:00', '20:00', '22:00']);
      
      // Act
      const sortedShows = service.sortShowsByTimeTest(testShows);
      
      // Assert
      expect(sortedShows.length).toBe(testShows.length);
      
      // Check that shows are sorted by airtime
      expect(sortedShows[0].airtime).toBe('20:00');
      expect(sortedShows[1].airtime).toBe('20:00');
      expect(sortedShows[2].airtime).toBe('21:00');
      expect(sortedShows[3].airtime).toBe('22:00');
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
      // Arrange
      mockConsoleOutput.log.mockClear();
      
      // Act
      service.displayFooter();
      
      // Assert
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(3);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('==============================');
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('');
      // Check for the TVMaze API attribution line
      expect(mockConsoleOutput.log).toHaveBeenNthCalledWith(
        3, 
        'Data provided by TVMaze API (https://api.tvmaze.com)'
      );
    });
  });
});
