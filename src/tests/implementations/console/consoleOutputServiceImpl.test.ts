/**
 * Tests for the ConsoleOutputServiceImpl implementation
 */
import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { container } from 'tsyringe';

import { ConsoleOutputServiceImpl } from 
  '../../../implementations/console/consoleOutputServiceImpl.js';
import type { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { Show } from '../../../types/tvmaze.js';

describe('ConsoleOutputServiceImpl', () => {
  // Mock objects
  let mockConsoleOutput: jest.Mocked<ConsoleOutput>;
  let mockShowFormatter: jest.Mocked<ShowFormatter>;
  let service: ConsoleOutputServiceImpl;
  
  // Sample test data
  const mockShow: Show = {
    airtime: '20:00',
    name: 'Test Show',
    season: 1,
    number: 1,
    show: {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: {
        id: 1,
        name: 'Test Network',
        country: {
          name: 'United States',
          code: 'US',
          timezone: 'America/New_York'
        }
      },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
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
      formatNetworkGroups: jest.fn().mockReturnValue(['Formatted network output'])
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
    it('should display shows grouped by network', async () => {
      // Act
      await service.displayShows(mockShows, false);
      
      // Assert - use a local variable to avoid unbound method reference
      const formatNetworkGroupsFn = mockShowFormatter.formatNetworkGroups;
      // Use a separate variable to store the function result
      const wasCalled = jest.isMockFunction(formatNetworkGroupsFn) && 
        formatNetworkGroupsFn.mock.calls.length > 0;
      expect(wasCalled).toBe(true);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('Formatted network output');
    });
    
    it('should display shows with detailed output when verbose is true', async () => {
      // Act
      await service.displayShows(mockShows, true);
      
      // Assert - use a local variable to avoid unbound method reference
      const formatNetworkGroupsFn = mockShowFormatter.formatNetworkGroups;
      // Check if the function was called with the right parameters
      const wasCalled = jest.isMockFunction(formatNetworkGroupsFn) && 
        formatNetworkGroupsFn.mock.calls.length > 0;
      expect(wasCalled).toBe(true);
      
      if (formatNetworkGroupsFn.mock.calls.length > 0) {
        const callArgs = formatNetworkGroupsFn.mock.calls[0];
        expect(callArgs[1]).toBe(true); // Second argument should be true (timeSort)
      }
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('Formatted network output');
    });
  });
});
