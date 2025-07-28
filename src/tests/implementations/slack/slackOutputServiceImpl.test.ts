/**
 * Tests for the Slack Output Service Implementation
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { container } from 'tsyringe';
import { SlackOutputServiceImpl } from '../../../implementations/slack/slackOutputServiceImpl.js';
import { MockLoggerServiceImpl } from '../../../implementations/test/mockLoggerServiceImpl.js';
import type { SlackShowFormatter } from '../../../interfaces/showFormatter.js';
import type { SlackClient } from '../../../interfaces/slackClient.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import type { LoggerService } from '../../../interfaces/loggerService.js';
import type { NetworkGroups } from '../../../schemas/domain.js';
import { ShowBuilder } from '../../fixtures/helpers/showFixtureBuilder.js';
import { SlackShowFormatterFixture } from '../../fixtures/helpers/slackShowFormatterFixture.js';
import { groupShowsByNetwork } from '../../../utils/showUtils.js';

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
    container.registerInstance<LoggerService>('LoggerService', new MockLoggerServiceImpl());
    
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
      
      // Act
      await outputService.renderOutput(testShows);
      
      // Assert
      expect(mockSlackClient.sendMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: 'mock-channel',
          text: 'Error fetching TV shows: Formatter error'
        })
      );
    });
    
    it('should handle errors when sending to Slack', async () => {
      // Arrange
      const error = new Error('Slack API error');
      mockSlackClient.sendMessage.mockRejectedValue(error);
      
      // Act
      await outputService.renderOutput(testShows);
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
      
      // Act
      await outputService.renderOutput(testShows);
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
  
  // Debug tests removed - debug functionality now uses structured logging (LoggerService.debug)
  // Set LOG_LEVEL=debug to see detailed debug information
  
  // Debug test removed - debug functionality now uses structured logging
  // Debug information is now emitted via LoggerService.debug instead of Slack messages
});
