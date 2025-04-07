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
      
      // Assert - We can't directly test private properties, so we'll test behavior
      // Temporarily redirect console.error
      const originalConsoleError = console.error;
      let logCalled = false;
      console.error = () => { logCalled = true; };
      
      // This should log to console if logToConsole is true
      await client.sendMessage({ channel: 'test', text: 'test' });
      
      // Restore console.error
      console.error = originalConsoleError;
      
      expect(logCalled).toBe(true);
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
      
      // Assert - We can't directly test private properties, so we'll test behavior
      // Temporarily redirect console.error
      const originalConsoleError = console.error;
      let logCalled = false;
      console.error = () => { logCalled = true; };
      
      // This should log to console if logToConsole is true
      await client.sendMessage({ channel: 'test', text: 'test' });
      
      // Restore console.error
      console.error = originalConsoleError;
      
      expect(logCalled).toBe(true);
    });
  });
});
