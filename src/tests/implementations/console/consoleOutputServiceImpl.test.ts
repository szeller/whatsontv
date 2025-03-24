/**
 * Tests for the ConsoleOutputServiceImpl implementation
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';

import { ConsoleOutputServiceImpl } from 
  '../../../implementations/console/consoleOutputServiceImpl.js';
import type { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { Show } from '../../../types/tvShowModel.js';

describe('ConsoleOutputServiceImpl', () => {
  // Mock objects
  let mockConsoleOutput: jest.Mocked<ConsoleOutput>;
  let mockShowFormatter: jest.Mocked<ShowFormatter>;
  let service: ConsoleOutputServiceImpl;

  // Sample test data
  const mockShow: Show = {
    id: 1,
    name: 'Test Show',
    type: 'Scripted',
    language: 'English',
    genres: ['Drama'],
    channel: 'Test Network',
    isStreaming: false,
    summary: 'Test summary',
    airtime: '20:00',
    season: 1,
    number: 1
  };

  const mockShows = [mockShow];

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();

    // Create mock objects
    mockConsoleOutput = {
      log: jest.fn(),
      error: jest.fn(),
      logWithLevel: jest.fn(),
      getOutput: jest.fn().mockReturnValue([])
    } as unknown as jest.Mocked<ConsoleOutput>;

    mockShowFormatter = {
      formatShow: jest.fn(),
      formatTimedShow: jest.fn(),
      formatUntimedShow: jest.fn(),
      formatMultipleEpisodes: jest.fn(),
      formatNetworkGroups: jest.fn().mockReturnValue(['Formatted network output']),
      formatShowsByDate: jest.fn().mockReturnValue('Formatted shows by date output'),
      formatFilteredShows: jest.fn().mockReturnValue('Formatted filtered shows'),
      formatShowDetails: jest.fn().mockReturnValue('Formatted show details'),
      formatSearchResults: jest.fn().mockReturnValue('Formatted search results')
    } as unknown as jest.Mocked<ShowFormatter>;

    // Register mocks in the container
    container.registerInstance<ConsoleOutput>('ConsoleOutput', mockConsoleOutput);
    container.registerInstance<ShowFormatter>('ShowFormatter', mockShowFormatter);

    // Create the service
    service = container.resolve(ConsoleOutputServiceImpl);

    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  describe('displayShows', () => {
    /**
     * Tests that shows are properly displayed when grouped by network
     */
    it('should display shows grouped by network', async (): Promise<void> => {
      // Arrange
      const formatNetworkGroupsSpy = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsSpy.mockReturnValue(['Formatted network output']);

      // Act
      await service.displayShows(mockShows, false);

      // Assert
      expect(formatNetworkGroupsSpy).toHaveBeenCalledTimes(1);
      expect(formatNetworkGroupsSpy).toHaveBeenCalledWith(
        mockShows.reduce((networkGroups: Record<string, Show[]>, show: Show) => {
          if (networkGroups[show.channel] === undefined) {
            networkGroups[show.channel] = [];
          }
          networkGroups[show.channel].push(show);
          return networkGroups;
        }, {}),
        false
      );
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('Formatted network output');
    });

    /**
     * Tests that the service correctly handles empty show arrays
     * by displaying an appropriate message
     */
    it('should handle empty shows array', async (): Promise<void> => {
      // Act
      await service.displayShows([], false);

      // Assert
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      expect(logSpy).toHaveBeenCalledTimes(1);
      expect(logSpy).toHaveBeenCalledWith('No shows found for the specified criteria.');
    });
    
    /**
     * Tests that the service properly handles errors during output
     */
    it('should handle errors during output', async () => {
      // Arrange
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      logSpy.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      // Act
      await service.displayShows(mockShows, false);
      
      // Assert
      const errorSpy = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error displaying output: Test error')
      );
    });
    
    /**
     * Tests that the service properly handles non-Error objects thrown during output
     */
    it('should handle non-Error objects thrown during output', async () => {
      // Arrange
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      logSpy.mockImplementationOnce(() => {
        throw 'String error'; // Not an Error object
      });
      
      // Act
      await service.displayShows(mockShows, false);
      
      // Assert
      const errorSpy = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error displaying output: String error')
      );
    });
  });

  describe('displayNetworkGroups', () => {
    /**
     * Tests that the service correctly formats and displays network groups
     */
    const testFormatAndDisplayNetworkGroups = async (): Promise<void> => {
      // Arrange
      const mockNetworkGroups = {
        'Network A': [mockShow],
        'Network B': []
      };
      const formatNetworkGroupsSpy = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      formatNetworkGroupsSpy.mockReturnValue(['Network A', 'Show 1']);
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, false);
      
      // Assert
      expect(formatNetworkGroupsSpy).toHaveBeenCalledTimes(1);
      expect(formatNetworkGroupsSpy).toHaveBeenCalledWith(
        mockNetworkGroups, 
        false
      );
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(1, 'Network A');
      expect(logSpy).toHaveBeenNthCalledWith(2, 'Show 1');
    };

    it(
      'should format and display network groups',
      testFormatAndDisplayNetworkGroups
    );

    /**
     * Tests that the timeSort parameter is correctly passed to the formatter
     */
    const testPassTimeSortParameterToFormatter = async (): Promise<void> => {
      // Arrange
      const mockNetworkGroups = { 'Network A': [mockShow] };
      const timeSort = true;
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, timeSort);
      
      // Assert
      const formatNetworkGroupsSpy = jest.spyOn(mockShowFormatter, 'formatNetworkGroups');
      expect(formatNetworkGroupsSpy).toHaveBeenCalledTimes(1);
      expect(formatNetworkGroupsSpy).toHaveBeenCalledWith(
        mockNetworkGroups,
        timeSort
      );
    };

    it(
      'should pass timeSort parameter to formatter',
      testPassTimeSortParameterToFormatter
    );

    /**
     * Tests that the service properly handles errors during output
     */
    const testHandleErrorsDuringOutput = async (): Promise<void> => {
      // Arrange
      const mockNetworkGroups = { 'Network A': [mockShow] };
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      logSpy.mockImplementationOnce(() => {
        throw new Error('Test error');
      });
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, false);
      
      // Assert
      const errorSpy = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error displaying output: Test error')
      );
    };

    it(
      'should handle errors during output',
      testHandleErrorsDuringOutput
    );
    
    /**
     * Tests that the service properly handles non-Error objects thrown during output
     */
    const testHandleNonErrorObjectsThrownDuringOutput = async (): Promise<void> => {
      // Arrange
      const mockNetworkGroups = { 'Network A': [mockShow] };
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      logSpy.mockImplementationOnce(() => {
        throw 'String error'; // Not an Error object
      });
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, false);
      
      // Assert
      const errorSpy = jest.spyOn(mockConsoleOutput, 'error');
      expect(errorSpy).toHaveBeenCalledTimes(1);
      expect(errorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Error displaying output: String error')
      );
    };

    it(
      'should handle non-Error objects thrown during output',
      testHandleNonErrorObjectsThrownDuringOutput
    );
  });

  describe('parseArgs', () => {
    it('should parse command line arguments with defaults', () => {
      // Act
      const args = service.parseArgs(['--date', '2025-03-23']);
      
      // Assert
      expect(args.date).toBe('2025-03-23');
      expect(args.country).toBe('US');
      expect(args.timeSort).toBe(false);
    });
    
    it('should handle array parameters correctly', () => {
      // Act
      const args = service.parseArgs(['--types', 'Scripted,Reality', '--networks', 'HBO,Netflix']);
      
      // Assert
      expect(args.types).toEqual(['Scripted', 'Reality']);
      expect(args.networks).toEqual(['HBO', 'Netflix']);
    });

    it('should handle genres and languages parameters', () => {
      // Act
      const args = service.parseArgs([
        '--genres', 'Drama,Comedy', 
        '--languages', 'English,Spanish'
      ]);
      
      // Assert
      expect(args.genres).toEqual(['Drama', 'Comedy']);
      expect(args.languages).toEqual(['English', 'Spanish']);
    });

    it('should handle boolean flags', () => {
      // Act
      const args = service.parseArgs(['--timeSort', '--debug']);
      
      // Assert
      expect(args.timeSort).toBe(true);
      expect(args.debug).toBe(true);
    });
    
    it('should parse provided arguments correctly', () => {
      // Arrange
      const args = ['--date', '2023-01-01', '--timeSort'];
      
      // Act
      const result = service.parseArgs(args);
      
      // Assert
      expect(result.date).toBe('2023-01-01');
      expect(result.timeSort).toBe(true);
    });
    
    it('should handle comma-separated list arguments', () => {
      // Arrange
      const args = [
        '--networks', 'HBO,Netflix',
        '--genres', 'Drama,Comedy',
        '--types', 'Scripted,Reality',
        '--languages', 'English,Spanish'
      ];
      
      // Act
      const result = service.parseArgs(args);
      
      // Assert
      expect(result.networks).toEqual(['HBO', 'Netflix']);
      expect(result.genres).toEqual(['Drama', 'Comedy']);
      expect(result.types).toEqual(['Scripted', 'Reality']);
      expect(result.languages).toEqual(['English', 'Spanish']);
    });
  });

  describe('displayHeader', () => {
    it('should display the application header', () => {
      // Act
      service.displayHeader();
      
      // Assert
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(
        1, 
        expect.stringContaining('WhatsOnTV')
      );
      expect(logSpy).toHaveBeenNthCalledWith(
        2, 
        expect.stringContaining('=')
      );
    });
  });

  describe('displayFooter', () => {
    it('should display application footer', () => {
      // Act
      service.displayFooter();
      
      // Assert
      const logSpy = jest.spyOn(mockConsoleOutput, 'log');
      expect(logSpy).toHaveBeenCalledTimes(2);
      expect(logSpy).toHaveBeenNthCalledWith(
        1, 
        expect.stringContaining('=')
      );
      expect(logSpy).toHaveBeenNthCalledWith(
        2, 
        expect.stringContaining('TVMaze API')
      );
    });
  });

  describe('isInitialized', () => {
    it('should return true when properly initialized', () => {
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(true);
    });

    it('should return false when formatter is not initialized', () => {
      // Arrange
      // @ts-expect-error - Testing invalid state
      service['formatter'] = undefined;
      
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(false);
    });

    it('should return false when output is not initialized', () => {
      // Arrange
      // @ts-expect-error - Testing invalid state
      service['output'] = undefined;
      
      // Act
      const result = service.isInitialized();
      
      // Assert
      expect(result).toBe(false);
    });
  });
});
