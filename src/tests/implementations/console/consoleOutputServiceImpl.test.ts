import { jest, describe, it, expect, beforeEach } from '@jest/globals';
import { ConsoleOutputServiceImpl } 
  from '../../../implementations/console/consoleOutputServiceImpl.js';
import { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { Show } from '../../../schemas/domain.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder.js';
import { groupShowsByNetwork } from '../../../utils/showUtils.js';

// Extend the service to expose protected methods for testing
class TestConsoleOutputService extends ConsoleOutputServiceImpl {
  // Expose output for testing
  getOutput(): ConsoleOutput {
    return this.output;
  }
  
  // Expose protected methods for testing
  testRenderHeader(date: Date): Promise<void> {
    return this.renderHeader(date);
  }
  
  testRenderContent(networkGroups: Record<string, Show[]>, date: Date): Promise<void> {
    return this.renderContent(networkGroups, date);
  }
  
  testRenderFooter(): Promise<void> {
    return this.renderFooter();
  }
  
  testRenderDebugInfo(shows: Show[], date: Date): Promise<void> {
    return this.renderDebugInfo(shows, date);
  }
  
  testHandleError(error: unknown): Promise<void> {
    return this.handleError(error);
  }
}

describe('ConsoleOutputServiceImpl', () => {
  let service: TestConsoleOutputService;
  let mockOutput: ConsoleOutput;
  let mockFormatter: ShowFormatter<string>;
  let mockConfigService: ConfigService;
  let sampleShows: Show[];
  
  beforeEach(() => {
    // Create mock dependencies
    mockOutput = {
      log: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      logWithLevel: jest.fn()
    } as unknown as ConsoleOutput;
    
    // Create mock formatter with proper return types
    mockFormatter = {
      formatTimedShow: jest.fn().mockReturnValue('Formatted timed show'),
      formatUntimedShow: jest.fn().mockReturnValue('Formatted untimed show'),
      formatMultipleEpisodes: jest.fn().mockReturnValue(['Multiple episodes']),
      formatNetwork: jest.fn().mockReturnValue(['Network header', 'Show 1', 'Show 2']),
      formatNetworkGroups: jest.fn().mockReturnValue([
        'Network 1', 'Show 1', 'Show 2', 'Network 2', 'Show 3'
      ])
    } as unknown as ShowFormatter<string>;
    
    // Create mock config service
    mockConfigService = {
      getDate: jest.fn().mockReturnValue(new Date('2023-01-01')),
      isDebugMode: jest.fn().mockReturnValue(false),
      getSlackOptions: jest.fn(),
      getCliOptions: jest.fn().mockReturnValue({
        debug: false,
        groupByNetwork: true
      }),
      // Add missing methods required by the interface
      getShowOptions: jest.fn(),
      getShowOption: jest.fn(),
      getConfig: jest.fn(),
      getEnvironment: jest.fn(),
      getShowType: jest.fn(),
      getOutputFormat: jest.fn(),
      getHelpText: jest.fn()
    } as unknown as ConfigService;
    
    // Create sample shows for testing
    sampleShows = [
      new ShowBuilder()
        .withId(1)
        .withName('Show 1')
        .withNetwork('ABC')
        .withGenres(['Comedy', 'Drama'])
        .withAirtime('20:00')
        .withType('scripted')
        .build(),
      new ShowBuilder()
        .withId(2)
        .withName('Show 2')
        .withNetwork('NBC')
        .withGenres(['Drama'])
        .withAirtime('21:00')
        .withType('reality')
        .build(),
      new ShowBuilder()
        .withId(3)
        .withName('Show 3')
        .withNetwork('ABC')
        .withGenres(['Drama', 'Thriller'])
        .withAirtime('19:00')
        .withType('scripted')
        .build()
    ];
    
    // Create service with mocks
    service = new TestConsoleOutputService(
      mockFormatter,
      mockOutput,
      mockConfigService
    );
  });
  
  // Test individual protected methods
  describe('renderHeader', () => {
    it('should display the application header with date', async () => {
      // Act
      await service.testRenderHeader(new Date('2023-01-01'));
      
      // Assert
      expect(mockOutput.log).toHaveBeenCalledWith(expect.stringContaining('WhatsOnTV'));
      expect(mockOutput.log).toHaveBeenCalledWith(expect.stringContaining('Shows for'));
    });
  });
  
  describe('renderContent', () => {
    it('should display formatted network groups', async () => {
      // Arrange
      const networkGroups = groupShowsByNetwork(sampleShows);
      
      // Act
      await service.testRenderContent(networkGroups, new Date());
      
      // Assert
      expect(mockFormatter.formatNetworkGroups).toHaveBeenCalledWith(networkGroups);
      expect(mockOutput.log).toHaveBeenCalled();
    });
    
    it('should handle empty network groups', async () => {
      // Act
      await service.testRenderContent({}, new Date());
      
      // Assert
      expect(mockOutput.log).toHaveBeenCalledWith('No shows found for the specified criteria.');
      expect(mockFormatter.formatNetworkGroups).not.toHaveBeenCalled();
    });
    
    it('should handle errors in formatter', async () => {
      // Arrange
      const networkGroups = groupShowsByNetwork(sampleShows);
      (mockFormatter.formatNetworkGroups as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Formatter error');
      });
      
      // Act
      await service.testRenderContent(networkGroups, new Date());
      
      // Assert
      const expectedErrorMsg = 'Error: Formatter error';
      expect(mockOutput.error).toHaveBeenCalledWith(expectedErrorMsg);
    });
  });
  
  describe('renderFooter', () => {
    it('should display the application footer', async () => {
      // Act
      await service.testRenderFooter();
      
      // Assert
      expect(mockOutput.log).toHaveBeenCalledWith(expect.stringContaining('TVMaze API'));
    });
  });
  
  describe('renderDebugInfo', () => {
    it('should display debug information', async () => {
      // Act
      await service.testRenderDebugInfo(sampleShows, new Date('2023-01-01'));
      
      // Assert
      expect(mockOutput.log).toHaveBeenCalledWith('\nDebug Information:');
      expect(mockOutput.log).toHaveBeenCalledWith(expect.stringContaining('Available Networks:'));
      expect(mockOutput.log).toHaveBeenCalledWith(expect.stringContaining('Total Shows: 3'));
    });
  });
  
  describe('handleError', () => {
    it('should handle Error objects', async () => {
      // Act
      await service.testHandleError(new Error('Test error'));
      
      // Assert
      expect(mockOutput.error).toHaveBeenCalledWith('Error: Test error');
    });
    
    it('should handle non-Error exceptions', async () => {
      // Act
      await service.testHandleError('String error');
      
      // Assert
      expect(mockOutput.error).toHaveBeenCalledWith('Error: String error');
    });
  });
  
  // Test the full renderOutput flow
  describe('renderOutput', () => {
    it('should display shows grouped by network by default', async () => {
      // Arrange
      (mockConfigService.isDebugMode as jest.Mock).mockReturnValue(false);
      
      // Act
      await service.renderOutput(sampleShows);
      
      // Assert
      expect(mockOutput.log).toHaveBeenCalled();
      expect(mockFormatter.formatNetworkGroups).toHaveBeenCalled();
    });
    
    it('should handle error in formatter', async () => {
      // Arrange
      (mockFormatter.formatNetworkGroups as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Formatter error');
      });
      
      // Act
      await service.renderOutput(sampleShows);
      
      // Assert
      const expectedErrorMsg = 'Error: Formatter error';
      expect(mockOutput.error).toHaveBeenCalledWith(expectedErrorMsg);
    });
    
    it('should display debug info when debug flag is true', async () => {
      // Arrange
      (mockConfigService.isDebugMode as jest.Mock).mockReturnValue(true);
      
      // Act
      await service.renderOutput(sampleShows);
      
      // Assert
      expect(mockOutput.log).toHaveBeenCalledWith('\nDebug Information:');
      expect(mockOutput.log).toHaveBeenCalledWith(expect.stringContaining('Available Networks:'));
    });
  });
});
