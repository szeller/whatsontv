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
    it('should display shows grouped by network', async (): Promise<void> => {
      // Arrange
      mockShowFormatter.formatNetworkGroups.mockReturnValue(['Formatted network output']);

      // Act
      await service.displayShows(mockShows, false);

      // Assert
      expect(mockShowFormatter.formatNetworkGroups.mock.calls.length).toBe(1);
      const formatArgs = mockShowFormatter.formatNetworkGroups.mock.calls[0];
      
      // The first argument should be the shows grouped by network
      const expectedNetworkGroups = { 'Test Network': mockShows };
      expect(formatArgs[0]).toEqual(expectedNetworkGroups);
      expect(formatArgs[1]).toBe(false);
      
      expect(mockConsoleOutput.log.mock.calls.length).toBe(1);
      const logArgs = mockConsoleOutput.log.mock.calls[0];
      expect(logArgs[0]).toBe('Formatted network output');
    });

    it('should handle empty shows array', async (): Promise<void> => {
      // Act
      await service.displayShows([], false);

      // Assert
      expect(mockConsoleOutput.log.mock.calls.length).toBe(1);
      const logArgs = mockConsoleOutput.log.mock.calls[0];
      expect(logArgs[0]).toBe('No shows found for the specified criteria.');
    });

    it(
      'should display shows with detailed output when verbose is true',
      async (): Promise<void> => {
        // Arrange
        mockShowFormatter.formatNetworkGroups.mockReturnValue(['Formatted network output']);

        // Act
        await service.displayShows(mockShows, true);

        // Assert
        expect(mockShowFormatter.formatNetworkGroups.mock.calls.length).toBe(1);
        const formatArgs = mockShowFormatter.formatNetworkGroups.mock.calls[0];
        
        // The first argument should be the shows grouped by network
        const expectedNetworkGroups = { 'Test Network': mockShows };
        expect(formatArgs[0]).toEqual(expectedNetworkGroups);
        expect(formatArgs[1]).toBe(true);
        
        expect(mockConsoleOutput.log.mock.calls.length).toBe(1);
        const logArgs = mockConsoleOutput.log.mock.calls[0];
        expect(logArgs[0]).toBe('Formatted network output');
      }
    );
  });

  describe('displayNetworkGroups', () => {
    it('should format and display network groups', async () => {
      // Arrange
      const mockNetworkGroups = {
        'Network A': [mockShow],
        'Network B': [mockShow]
      };
      mockShowFormatter.formatNetworkGroups.mockReturnValue([
        'Formatted network A', 
        'Formatted network B'
      ]);
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, false);
      
      // Assert
      expect(() => mockShowFormatter.formatNetworkGroups(mockNetworkGroups, false)).not.toThrow();
      expect(() => mockConsoleOutput.log('Formatted network A')).not.toThrow();
      expect(() => mockConsoleOutput.log('Formatted network B')).not.toThrow();
    });
    
    it('should sort shows by time when timeSort is true', async () => {
      // Arrange
      const mockNetworkGroups = {
        'Network A': [mockShow],
        'Network B': [mockShow]
      };
      
      // Act
      await service.displayNetworkGroups(mockNetworkGroups, true);
      
      // Assert
      expect(() => mockShowFormatter.formatNetworkGroups(mockNetworkGroups, true)).not.toThrow();
    });
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
  });

  describe('displayHeader', () => {
    it('should display the application header', () => {
      // Act
      service.displayHeader();
      
      // Assert
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(2);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('WhatsOnTV'));
      expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('='));
    });
  });

  describe('displayFooter', () => {
    it('should display the application footer', () => {
      // Act
      service.displayFooter();
      
      // Assert
      expect(mockConsoleOutput.log).toHaveBeenCalledTimes(2);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('='));
      expect(mockConsoleOutput.log).toHaveBeenCalledWith(expect.stringContaining('TVMaze API'));
    });
  });

  describe('isInitialized', () => {
    it('should return true when properly initialized', () => {
      // Act
      const result = service.isInitialized();

      // Assert
      expect(result).toBe(true);
    });

    it('should return false when output is null', () => {
      // Arrange
      const serviceWithNullOutput = new ConsoleOutputServiceImpl(
        mockShowFormatter,
        null as unknown as ConsoleOutput
      );

      // Act
      const result = serviceWithNullOutput.isInitialized();

      // Assert
      expect(result).toBe(false);
    });

    it('should return false when formatter is null', () => {
      // Arrange
      const serviceWithNullFormatter = new ConsoleOutputServiceImpl(
        null as unknown as ShowFormatter,
        mockConsoleOutput
      );

      // Act
      const result = serviceWithNullFormatter.isInitialized();

      // Assert
      expect(result).toBe(false);
    });
  });
});
