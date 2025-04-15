/**
 * Tests for the Slack Output Service Implementation
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { container } from 'tsyringe';
import { SlackOutputServiceImpl } from '../../../implementations/slack/slackOutputServiceImpl';
import type { SlackShowFormatter } from '../../../interfaces/showFormatter';
import type { SlackClient } from '../../../interfaces/slackClient';
import type { ConfigService } from '../../../interfaces/configService';
import type { NetworkGroups, Show } from '../../../schemas/domain';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder';
import { SlackShowFormatterFixture } from '../../fixtures/helpers/slackShowFormatterFixture';
import { groupShowsByNetwork } from '../../../utils/showUtils';

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
    _testNetworkGroups = groupShowsByNetwork(testShows);
    
    // Create mock dependencies with proper types
    mockFormatter = SlackShowFormatterFixture.createMockFormatter();
    
    mockSlackClient = {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    } as jest.Mocked<SlackClient>;
    
    mockConfigService = {
      getDate: jest.fn().mockReturnValue(new Date('2022-12-28')),
      isDebugMode: jest.fn().mockReturnValue(false),
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
      
      // Should send two messages - header and content
      expect(mockSlackClient.sendMessage).toHaveBeenCalledTimes(2);
      
      // First call should be the header with date
      expect(mockSlackClient.sendMessage).toHaveBeenNthCalledWith(1, {
        channel: 'mock-channel',
        text: expect.stringContaining('TV Shows for'),
        blocks: [expect.objectContaining({
          type: 'header',
          text: expect.objectContaining({
            text: expect.stringContaining('📺 TV Shows for')
          })
        })]
      });
      
      // Second call should be the content
      expect(mockSlackClient.sendMessage).toHaveBeenNthCalledWith(2, {
        channel: 'mock-channel',
        text: 'TV Shows by Network',
        blocks: mockBlocks
      });
    });
    
    it('should handle errors when formatting shows', async () => {
      // Arrange
      const error = new Error('Formatter error');
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
        'Formatter error'
      );
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'mock-channel',
          text: 'Error fetching TV shows: Formatter error'
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
      const firstError = new Error('Failed to send error message');
      const secondError = new Error('Failed to send error message');
      
      mockFormatter.formatNetworkGroups.mockImplementation(() => {
        throw firstError;
      });
      
      mockSlackClient.sendMessage.mockRejectedValue(secondError);
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert - check for the first error
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error rendering Slack output:',
        'Failed to send error message'
      );
      
      // Check for the second error (when trying to send error message)
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
      
      // Should send two messages - header and content
      expect(mockSlackClient.sendMessage).toHaveBeenCalledTimes(2);
      
      // First call should be the header with date
      expect(mockSlackClient.sendMessage).toHaveBeenNthCalledWith(1, {
        channel: 'mock-channel',
        text: expect.stringContaining('TV Shows for'),
        blocks: [expect.objectContaining({
          type: 'header',
          text: expect.objectContaining({
            text: expect.stringContaining('📺 TV Shows for')
          })
        })]
      });
      
      // Second call should be the content
      expect(mockSlackClient.sendMessage).toHaveBeenNthCalledWith(2, {
        channel: 'mock-channel',
        text: 'TV Shows by Network',
        blocks: emptyBlocks
      });
    });
  });
  
  describe('renderFooter', () => {
    it('should not send any additional messages', async () => {
      // We need to access the protected method, so we'll create a test class
      class TestSlackOutputService extends SlackOutputServiceImpl {
        public async testRenderFooter(): Promise<void> {
          return this.renderFooter();
        }
      }
      
      // Create instance with our existing mocks
      const testService = new TestSlackOutputService(
        mockFormatter,
        mockSlackClient,
        mockConfigService
      );
      
      // Act
      await testService.testRenderFooter();
      
      // Assert - footer doesn't send any messages for Slack
      expect(mockSlackClient.sendMessage).not.toHaveBeenCalled();
    });
  });
  
  describe('renderDebugInfo', () => {
    it('should send debug information to Slack when debug mode is enabled', async () => {
      // We need to access the protected method, so we'll create a test class
      class TestSlackOutputService extends SlackOutputServiceImpl {
        public async testRenderDebugInfo(shows: Show[], date: Date): Promise<void> {
          return this.renderDebugInfo(shows, date);
        }
      }
      
      // Create instance with our existing mocks
      const testService = new TestSlackOutputService(
        mockFormatter,
        mockSlackClient,
        mockConfigService
      );
      
      // Enable debug mode
      mockConfigService.isDebugMode.mockReturnValue(true);
      
      // Act
      await testService.testRenderDebugInfo(testShows, new Date('2022-12-28'));
      
      // Assert
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'mock-channel',
          text: expect.stringContaining('*Debug Information:*')
        })
      );
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          text: expect.stringContaining('Total Shows: 3')
        })
      );
    });
    
    it('should handle errors when sending debug information', async () => {
      // We need to access the protected method, so we'll create a test class
      class TestSlackOutputService extends SlackOutputServiceImpl {
        public async testRenderDebugInfo(shows: Show[], date: Date): Promise<void> {
          return this.renderDebugInfo(shows, date);
        }
      }
      
      // Create instance with our existing mocks
      const testService = new TestSlackOutputService(
        mockFormatter,
        mockSlackClient,
        mockConfigService
      );
      
      // Mock Slack client to throw an error
      const error = new Error('Failed to send debug info');
      mockSlackClient.sendMessage.mockRejectedValue(error);
      
      // Spy on console.error
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
      
      // Act
      await testService.testRenderDebugInfo(testShows, new Date('2022-12-28'));
      
      // Assert
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send debug info to Slack:',
        'Failed to send debug info'
      );
      
      // Restore console.error
      consoleSpy.mockRestore();
    });
  });
  
  describe('full renderOutput with debug mode', () => {
    it('should include debug information when debug mode is enabled', async () => {
      // Arrange
      mockConfigService.isDebugMode.mockReturnValue(true);
      const mockBlocks = [SlackShowFormatterFixture.createHeaderBlock()];
      mockFormatter.formatNetworkGroups.mockReturnValue(mockBlocks);
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert
      // Should send three messages - header, content, and debug info
      expect(mockSlackClient.sendMessage).toHaveBeenCalledTimes(3);
      
      // Verify that one of the calls contains debug info
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'mock-channel',
          text: expect.stringContaining('*Debug Information:*')
        })
      );
    });
  });
});
