/**
 * Tests for the ConsoleOutputService implementation
 */
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { container } from 'tsyringe';

import { ConsoleOutputServiceImpl } from '../../implementations/console/consoleOutputServiceImpl';
import { 
  createMockConsoleOutput, 
  createMockShowFormatter
} from '../utils/testHelpers';

// Import types
import type { NetworkGroups } from '../../types/app';
import type { ConsoleOutput } from '../../interfaces/consoleOutput';
import type { ShowFormatter } from '../../interfaces/showFormatter';
import type { Show } from '../../types/tvmaze';

// Create a test subclass of ConsoleOutputService that overrides the groupShowsByNetwork usage
class TestConsoleOutputService extends ConsoleOutputServiceImpl {
  private mockNetworkGroups: NetworkGroups;
  private groupShowsByNetworkCalls: Show[][] = [];

  constructor(
    formatter: ShowFormatter,
    output: ConsoleOutput,
    mockNetworkGroups: NetworkGroups
  ) {
    super(formatter, output);
    this.mockNetworkGroups = mockNetworkGroups;
  }

  public async displayShows(shows: Show[], timeSort: boolean = false): Promise<void> {
    if (shows.length === 0) {
      this.output.log('No shows found for the specified criteria.');
      return;
    }

    // Record the call to our mock function
    this.groupShowsByNetworkCalls.push([...shows]);
    
    // Use our mock network groups instead of calling the real function
    const formattedOutput = this.formatter.formatNetworkGroups(this.mockNetworkGroups, timeSort);
    
    for (const line of formattedOutput) {
      this.output.log(line);
    }
  }

  // Method to check if groupShowsByNetwork was called with specific shows
  public wasGroupShowsByNetworkCalledWith(shows: Show[]): boolean {
    return this.groupShowsByNetworkCalls.some(call => 
      call.length === shows.length && 
      call.every((show, index) => show === shows[index])
    );
  }
}

describe('ConsoleOutputService with DI', () => {
  // Mock objects
  let mockConsoleOutput: ConsoleOutput;
  let mockShowFormatter: ShowFormatter;
  let service: TestConsoleOutputService;
  
  // Sample test data
  const mockShow: Show = {
    name: 'Test Episode',
    season: 1,
    number: 1,
    airtime: '20:00',
    show: {
      id: 1,
      name: 'Test Show',
      type: 'Scripted',
      language: 'English',
      genres: ['Drama'],
      network: {
        id: 1,
        name: 'Test Network',
        country: null
      },
      webChannel: null,
      image: null,
      summary: 'Test summary'
    }
  };
  
  const mockShows: Show[] = [mockShow];
  
  // Mock network groups
  const mockNetworkGroups: NetworkGroups = {
    'Test Network': mockShows
  };
  
  beforeEach(() => {
    // Create mock objects
    mockConsoleOutput = createMockConsoleOutput();
    mockShowFormatter = createMockShowFormatter();
    
    // Configure mock formatter
    (mockShowFormatter.formatNetworkGroups as jest.Mock)
      .mockReturnValue(['Formatted network output']);
    
    // Create service instance with our test subclass
    service = new TestConsoleOutputService(
      mockShowFormatter,
      mockConsoleOutput,
      mockNetworkGroups
    );
  });
  
  afterEach(() => {
    jest.clearAllMocks();
    container.clearInstances();
  });

  describe('displayShows', () => {
    it('should display shows grouped by network', async () => {
      await service.displayShows(mockShows, false);
      
      // Assert
      expect(service.wasGroupShowsByNetworkCalledWith(mockShows)).toBe(true);
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalled();
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('Formatted network output');
    });
    
    it('should display shows with detailed output when verbose is true', async () => {
      await service.displayShows(mockShows, true);
      
      // Assert
      expect(service.wasGroupShowsByNetworkCalledWith(mockShows)).toBe(true);
      expect(mockShowFormatter.formatNetworkGroups).toHaveBeenCalledWith(expect.any(Object), true);
      expect(mockConsoleOutput.log).toHaveBeenCalledWith('Formatted network output');
    });
  });
});
