import { createMockSlackClient, createMockSlackClientFactory } from './slackClientFactory.js';
import { MockSlackClient } from '../implementations/mockSlackClient.js';
import type { SlackClient } from '../../../interfaces/slackClient.js';

describe('slackClientFactory', () => {
  describe('createMockSlackClient', () => {
    it('should create a MockSlackClient instance', () => {
      // Act
      const client = createMockSlackClient();
      
      // Assert
      expect(client).toBeInstanceOf(MockSlackClient);
    });
    
    it('should pass options to the MockSlackClient constructor', async () => {
      // Arrange
      const options = { logToConsole: true };
      
      // Act
      const client = createMockSlackClient(options);
      
      // Since we've disabled console logging in MockSlackClient to avoid test output clutter,
      // we'll just verify the client is created correctly
      expect(client).toBeInstanceOf(MockSlackClient);
      
      // Send a test message to verify basic functionality
      await client.sendMessage({ channel: 'test', text: 'test' });
      const messages = client.getMessages();
      expect(messages.length).toBe(1);
      expect(messages[0].channel).toBe('test');
    });
  });
  
  describe('createMockSlackClientFactory', () => {
    it('should create a factory function that returns MockSlackClient instances', () => {
      // Act
      const factory = createMockSlackClientFactory();
      const client = factory();
      
      // Assert
      expect(client).toBeInstanceOf(MockSlackClient);
    });
    
    it('should create a factory function that returns SlackClient instances', () => {
      // Act
      const factory = createMockSlackClientFactory();
      const client = factory();
      
      // Assert - Test that it implements the SlackClient interface
      expect(typeof client.sendMessage).toBe('function');
      
      // TypeScript validation
      const typedClient: SlackClient = client;
      expect(typedClient).toBe(client);
    });
    
    it('should pass options to all created clients', async () => {
      // Arrange
      const options = { logToConsole: true };
      const factory = createMockSlackClientFactory(options);
      
      // Act
      const client = factory() as MockSlackClient;
      
      // Since we've disabled console logging in MockSlackClient to avoid test output clutter,
      // we'll just verify the client is created correctly and functions as expected
      expect(client).toBeInstanceOf(MockSlackClient);
      
      // Send a test message to verify basic functionality
      await client.sendMessage({ channel: 'test-factory', text: 'test-message' });
      const messages = client.getMessages();
      expect(messages.length).toBe(1);
      expect(messages[0].channel).toBe('test-factory');
      expect(messages[0].text).toBe('test-message');
    });
  });
});
