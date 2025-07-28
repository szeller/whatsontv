/**
 * Tests for the Slack Client Implementation
 */
import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { WebClient } from '@slack/web-api';
import { SlackClientImpl } from '../../../implementations/slack/slackClientImpl.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import type { SlackConfig } from '../../../types/configTypes.js';
import { SlackClientFixture } from '../../fixtures/helpers/slackClientFixture.js';

// Create mock functions with proper typing
interface MockPostMessageResponse {
  ok: boolean;
}

const mockPostMessage = jest.fn<() => Promise<MockPostMessageResponse>>()
  .mockResolvedValue({ ok: true });

// Create a mock WebClient
const createMockWebClient = (): WebClient => {
  return {
    chat: {
      postMessage: mockPostMessage
    }
  } as unknown as WebClient;
};

describe('SlackClientImpl', () => {
  // Mock dependencies
  const mockConfigService = {
    getShowOptions: jest.fn(),
    getSlackOptions: jest.fn().mockReturnValue({
      token: 'mock-token',
      channelId: 'mock-channel',
      username: 'WhatsOnTV Bot',
      icon_emoji: ':tv:'
    }),
    getCliOptions: jest.fn(),
    getShowOption: jest.fn(),
    getConfig: jest.fn()
  } as jest.Mocked<ConfigService>;
  
  let slackClient: SlackClientImpl;
  let mockWebClient: WebClient;
  
  // Create a mock factory function
  const mockWebClientFactory = jest.fn<(config: SlackConfig) => WebClient>();
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
    
    // Create a new mock WebClient
    mockWebClient = createMockWebClient();
    
    // Set up the factory to return our mock client
    mockWebClientFactory.mockReturnValue(mockWebClient);
    
    // Create a new client instance for each test with the mock factory
    slackClient = new SlackClientImpl(mockConfigService, mockWebClientFactory);
  });
  
  describe('constructor', () => {
    it('should initialize with config service options', () => {
      expect(mockConfigService.getSlackOptions).toHaveBeenCalled();
    });
    
    it('should use the WebClientFactory when provided', () => {
      const slackOptions = mockConfigService.getSlackOptions();
      expect(mockWebClientFactory).toHaveBeenCalledWith(slackOptions);
    });
    
    it('should create a new WebClient when factory is not provided', () => {
      // We need to mock the WebClient constructor for this test
      const mockWebClientConstructor = jest.fn();
      jest.mock('@slack/web-api', () => ({
        WebClient: mockWebClientConstructor
      }));
      
      // Create a client without providing a factory
      const client = new SlackClientImpl(mockConfigService);
      expect(client).toBeDefined();
    });
  });
  
  describe('sendMessage', () => {
    it('should send a message with the provided payload', async () => {
      // Arrange
      const payload = SlackClientFixture.createMessagePayload({
        channel: 'custom-channel',
        username: 'Custom Bot',
        icon_emoji: ':robot:'
      });
      
      // Act
      await slackClient.sendMessage(payload);
      
      // Assert
      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'custom-channel',
        text: 'Test message',
        username: 'Custom Bot',
        icon_emoji: ':robot:'
      });
    });
    
    it('should use default channel from config if not provided', async () => {
      // Arrange
      const payload = SlackClientFixture.createMessagePayload({
        channel: undefined
      });
      
      // Act
      await slackClient.sendMessage(payload);
      
      // Assert
      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'mock-channel',
        text: 'Test message',
        username: 'WhatsOnTV Bot',
        icon_emoji: ':tv:'
      });
    });
    
    it('should use default username from config if not provided', async () => {
      // Arrange
      const payload = SlackClientFixture.createMessagePayload({
        channel: 'custom-channel',
        username: undefined
      });
      
      // Act
      await slackClient.sendMessage(payload);
      
      // Assert
      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'custom-channel',
        text: 'Test message',
        username: 'WhatsOnTV Bot',
        icon_emoji: ':tv:'
      });
    });
    
    it('should use default icon emoji from config if not provided', async () => {
      // Arrange
      const payload = SlackClientFixture.createMessagePayload({
        channel: 'custom-channel',
        username: 'Custom Bot',
        icon_emoji: undefined
      });
      
      // Act
      await slackClient.sendMessage(payload);
      
      // Assert
      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'custom-channel',
        text: 'Test message',
        username: 'Custom Bot',
        icon_emoji: ':tv:'
      });
    });
    
    it('should handle empty strings in payload', async () => {
      // Arrange
      const payload = SlackClientFixture.createMessagePayload({
        channel: '',
        username: '',
        icon_emoji: ''
      });
      
      // Act
      await slackClient.sendMessage(payload);
      
      // Assert
      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'mock-channel',
        text: 'Test message',
        username: 'WhatsOnTV Bot',
        icon_emoji: ':tv:'
      });
    });
    
    it('should throw an error when Slack API fails', async () => {
      // Arrange
      const payload = SlackClientFixture.createMessagePayload({
        channel: 'custom-channel'
      });
      
      // Set up the mock to reject with an error for this test only
      const error = new Error('Slack API error');
      mockPostMessage.mockRejectedValueOnce(error as never);
      
      // Act & Assert
      await expect(slackClient.sendMessage(payload)).rejects.toThrow(
        'Failed to send Slack message'
      );
      
      // Note: Error logging is now handled by LoggerService instead of console.error
    });
  });
});
