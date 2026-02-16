import { MockSlackClient } from './mockSlackClient.js';
import type { SlackMessagePayload } from '../../../interfaces/slackClient.js';
import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';

describe('MockSlackClient', () => {
  let mockSlackClient: MockSlackClient;

  beforeEach(() => {
    // Mock console.log to suppress output
    jest.spyOn(console, 'log').mockImplementation(() => { /* noop */ });

    mockSlackClient = new MockSlackClient();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
  
  it('should store sent messages', async () => {
    // Arrange
    const testMessage: SlackMessagePayload = {
      channel: 'test-channel',
      text: 'Test message'
    };
    
    // Act
    await mockSlackClient.sendMessage(testMessage);
    
    // Assert
    expect(mockSlackClient.getMessages()).toHaveLength(1);
    expect(mockSlackClient.getMessages()[0]).toEqual(testMessage);
  });
  
  it('should filter messages by channel', async () => {
    // Arrange
    const channel1 = 'channel-1';
    const channel2 = 'channel-2';
    
    // Act
    await mockSlackClient.sendMessage({ channel: channel1, text: 'Message 1' });
    await mockSlackClient.sendMessage({ channel: channel2, text: 'Message 2' });
    await mockSlackClient.sendMessage({ channel: channel1, text: 'Message 3' });
    
    // Assert
    expect(mockSlackClient.getMessagesForChannel(channel1)).toHaveLength(2);
    expect(mockSlackClient.getMessagesForChannel(channel2)).toHaveLength(1);
  });
  
  it('should find messages by text content', async () => {
    // Arrange
    await mockSlackClient.sendMessage({ channel: 'test', text: 'Hello world' });
    await mockSlackClient.sendMessage({ channel: 'test', text: 'Testing 123' });
    await mockSlackClient.sendMessage({ channel: 'test', text: 'Hello again' });
    
    // Act & Assert
    expect(mockSlackClient.findMessagesByText('Hello')).toHaveLength(2);
    expect(mockSlackClient.findMessagesByText('Testing')).toHaveLength(1);
    expect(mockSlackClient.findMessagesByText('Goodbye')).toHaveLength(0);
  });
  
  it('should detect if a message was sent with specific criteria', async () => {
    // Arrange
    const message: SlackMessagePayload = {
      channel: 'test-channel',
      text: 'Test with blocks',
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'Header' } },
        { type: 'section', text: { type: 'mrkdwn', text: 'Section content' } }
      ],
      username: 'TestBot'
    };
    
    // Act
    await mockSlackClient.sendMessage(message);
    
    // Assert
    expect(mockSlackClient.wasMessageSent({ channel: 'test-channel' })).toBe(true);
    expect(mockSlackClient.wasMessageSent({ text: 'Test with blocks' })).toBe(true);
    expect(mockSlackClient.wasMessageSent({ username: 'TestBot' })).toBe(true);
    expect(mockSlackClient.wasMessageSent({ 
      blocks: [
        { type: 'header', text: { type: 'plain_text', text: 'Test' } }, 
        { type: 'section', text: { type: 'mrkdwn', text: 'Test' } }
      ] 
    })).toBe(true);
    
    // Negative cases
    expect(mockSlackClient.wasMessageSent({ channel: 'wrong-channel' })).toBe(false);
    expect(mockSlackClient.wasMessageSent({ text: 'Wrong text' })).toBe(false);
  });
  
  it('should clear all messages', async () => {
    // Arrange
    await mockSlackClient.sendMessage({ channel: 'test', text: 'Message 1' });
    await mockSlackClient.sendMessage({ channel: 'test', text: 'Message 2' });
    expect(mockSlackClient.getMessages()).toHaveLength(2);
    
    // Act
    mockSlackClient.clearMessages();
    
    // Assert
    expect(mockSlackClient.getMessages()).toHaveLength(0);
  });
  
  it('should create a deep copy of messages when retrieving them', async () => {
    // Arrange
    await mockSlackClient.sendMessage({ channel: 'test', text: 'Original' });
    
    // Act
    const messages = mockSlackClient.getMessages();
    messages[0].text = 'Modified';
    
    // Assert
    expect(mockSlackClient.getMessages()[0].text).toBe('Original');
  });
  
  describe('Debug functionality', () => {
    it('should store debug logs when in store mode', async () => {
      // Arrange
      const debugClient = new MockSlackClient({ debugMode: 'store' });
      
      // Act
      await debugClient.sendMessage({ 
        channel: 'debug-channel', 
        text: 'Debug message',
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Content' } }],
        username: 'DebugBot'
      });
      
      // Assert
      expect(debugClient.getDebugLogs().length).toBeGreaterThan(0);
      expect(debugClient.getDebugLogs()[0]).toContain('initialized with debug mode');
    });
    
    it('should clear debug logs', async () => {
      // Arrange
      const debugClient = new MockSlackClient({ debugMode: 'store' });
      await debugClient.sendMessage({ channel: 'test', text: 'Test' });
      expect(debugClient.getDebugLogs().length).toBeGreaterThan(0);
      
      // Act
      debugClient.clearDebugLogs();
      
      // Assert
      expect(debugClient.getDebugLogs()).toHaveLength(0);
    });
    
    it('should change debug mode', async () => {
      // Arrange
      const debugClient = new MockSlackClient();
      
      // Act
      debugClient.setDebugMode('store');
      await debugClient.sendMessage({ channel: 'test', text: 'After mode change' });
      
      // Assert
      expect(debugClient.getDebugLogs().length).toBeGreaterThan(0);
    });
    
    it('should generate message summary', async () => {
      // Arrange
      const debugClient = new MockSlackClient();
      await debugClient.sendMessage({ 
        channel: 'test', 
        text: 'Test message',
        blocks: [{ type: 'section', text: { type: 'mrkdwn', text: 'Content' } }]
      });
      
      // Act
      const summary = debugClient.printMessageSummary({ 
        includeBlocks: true,
        toConsole: false 
      });
      
      // Assert
      expect(summary.length).toBeGreaterThan(0);
      expect(summary[0]).toContain('stored messages');
      expect(summary.some(line => line.includes('Blocks:'))).toBe(true);
    });
    
    it('should print message summary to console when toConsole is true', async () => {
      // Arrange
      const debugClient = new MockSlackClient();
      await debugClient.sendMessage({ channel: 'test', text: 'Console output test' });
      
      // Act
      const consoleLogMock = console.log as jest.Mock;
      consoleLogMock.mockClear(); // Clear previous calls
      
      debugClient.printMessageSummary({ toConsole: true });
      
      // Assert
      expect(consoleLogMock).toHaveBeenCalled();
    });
    
    it('should handle different debug modes correctly', async () => {
      // Test console mode - no need to mock console.log again as it's already mocked in beforeEach
      const consoleClient = new MockSlackClient({ debugMode: 'console' });
      
      // Use the already mocked console.log
      const consoleLogMock = console.log as jest.Mock;
      consoleLogMock.mockClear(); // Clear previous calls
      
      try {
        await consoleClient.sendMessage({ channel: 'test', text: 'Console mode test' });
        expect(consoleLogMock).toHaveBeenCalled();
        
        // Reset for next test
        consoleLogMock.mockClear();
        
        // Test none mode
        const noneClient = new MockSlackClient({ debugMode: 'none' });
        await noneClient.sendMessage({ channel: 'test', text: 'None mode test' });
        expect(consoleLogMock).not.toHaveBeenCalled();
      } finally {
        // Restore is handled by afterEach
      }
    });
  });
});
