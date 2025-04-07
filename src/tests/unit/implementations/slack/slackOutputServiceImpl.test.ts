/**
 * Tests for the Slack Output Service Implementation
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { container } from 'tsyringe';
import { SlackOutputServiceImpl } from '../../../../implementations/slack/slackOutputServiceImpl';
import type { SlackShowFormatter } from '../../../../interfaces/showFormatter';
import type { SlackClient } from '../../../../interfaces/slackClient';
import type { ConfigService } from '../../../../interfaces/configService';
import type { NetworkGroups } from '../../../../schemas/domain';
import { ShowBuilder } from '../../../fixtures/helpers/showFixtureBuilder';
import { SlackShowFormatterFixture } from '../../../fixtures/helpers/slackShowFormatterFixture';

describe('SlackOutputServiceImpl', () => {
  let outputService: SlackOutputServiceImpl;
  let mockFormatter: jest.Mocked<SlackShowFormatter>;
  let mockSlackClient: jest.Mocked<SlackClient>;
  let mockConfigService: jest.Mocked<ConfigService>;
  let testShows: ReturnType<typeof ShowBuilder.createTestShow>[];
  // We'll use the testNetworkGroups in a future test if needed
  let _testNetworkGroups: NetworkGroups;

  beforeEach(() => {
    // Reset container for each test
    container.clearInstances();
    
    // Create test data
    testShows = [
      ShowBuilder.createTestShow({
        name: 'Test Show 1',
        network: 'Test Network'
      }),
      ShowBuilder.createTestShow({
        name: 'Test Show 2',
        network: 'Test Network'
      }),
      ShowBuilder.createTestShow({
        name: 'Test Show 3',
        network: 'Another Network'
      })
    ];
    
    // Create network groups
    _testNetworkGroups = {
      'Test Network': [testShows[0], testShows[1]],
      'Another Network': [testShows[2]]
    };
    
    // Create mock dependencies with proper types
    mockFormatter = SlackShowFormatterFixture.createMockFormatter();
    
    mockSlackClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    } as jest.Mocked<SlackClient>;
    
    mockConfigService = {
      getShowOptions: jest.fn().mockReturnValue({}),
      getSlackOptions: jest.fn().mockReturnValue({
        token: 'mock-token',
        channelId: 'mock-channel',
        username: 'WhatsOnTV Bot'
      }),
      getCliOptions: jest.fn().mockReturnValue({}),
      getShowOption: jest.fn().mockReturnValue(''),
      getConfig: jest.fn().mockReturnValue({})
    } as jest.Mocked<ConfigService>;
    
    // Register mocks in the container with the correct token names
    container.registerInstance('SlackShowFormatter', mockFormatter);
    container.registerInstance('SlackClient', mockSlackClient);
    container.registerInstance('ConfigService', mockConfigService);
    
    // Create the service instance from the container
    outputService = container.resolve(SlackOutputServiceImpl);
  });

  afterEach(() => {
    // Restore all mocks
    jest.restoreAllMocks();
  });

  describe('renderOutput', () => {
    it('should format shows and send to Slack', async () => {
      // Arrange
      const mockBlocks = [SlackShowFormatterFixture.createHeaderBlock()];
      mockFormatter.formatNetworkGroups.mockReturnValue(mockBlocks);
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert
      expect(mockFormatter.formatNetworkGroups).toHaveBeenCalled();
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith({
        channel: 'mock-channel',
        text: expect.stringContaining('TV Shows for'),
        blocks: mockBlocks
      });
    });
    
    it('should handle errors when formatting shows', async () => {
      // Arrange
      const error = new Error('Formatting error');
      mockFormatter.formatNetworkGroups.mockImplementation(() => {
        throw error;
      });
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error rendering Slack output:',
        'Formatting error'
      );
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'mock-channel',
          text: 'Error fetching TV shows: Formatting error'
        })
      );
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
    
    it('should handle errors when sending to Slack', async () => {
      // Arrange
      const error = new Error('Slack API error');
      mockSlackClient.sendMessage.mockRejectedValue(error);
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error rendering Slack output:',
        'Slack API error'
      );
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
    
    it('should handle errors when sending error message to Slack', async () => {
      // Arrange
      // First call throws an error, second call also throws (when trying to send error message)
      const firstError = new Error('Formatting error');
      const secondError = new Error('Failed to send error message');
      
      mockFormatter.formatNetworkGroups.mockImplementation(() => {
        throw firstError;
      });
      
      mockSlackClient.sendMessage.mockRejectedValue(secondError);
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error rendering Slack output:',
        'Formatting error'
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send error message to Slack:',
        'Failed to send error message'
      );
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
    
    it('should handle empty shows array', async () => {
      // Arrange
      const emptyBlocks = [SlackShowFormatterFixture.createHeaderBlock()];
      mockFormatter.formatNetworkGroups.mockReturnValue(emptyBlocks);
      
      // Act
      await outputService.renderOutput([]);
      
      // Assert
      expect(mockFormatter.formatNetworkGroups).toHaveBeenCalledWith({});
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith({
        channel: 'mock-channel',
        text: expect.stringContaining('TV Shows for'),
        blocks: emptyBlocks
      });
    });
  });
});
