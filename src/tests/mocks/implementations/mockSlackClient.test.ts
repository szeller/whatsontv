import { MockSlackClient } from './mockSlackClient.js';
import type { SlackMessagePayload } from '../../../interfaces/slackClient.js';

describe('MockSlackClient', () => {
  let mockSlackClient: MockSlackClient;
  
  beforeEach(() => {
    mockSlackClient = new MockSlackClient();
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
      blocks: [{ type: 'header' }, { type: 'section' }] 
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
});
