import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { SlackClient, SlackMessagePayload } from '../../../interfaces/slackClient.js';

/**
 * Mock implementation of SlackClient for testing
 * Stores all messages for later verification and optionally logs to console
 */
@injectable()
export class MockSlackClient implements SlackClient {
  private messages: SlackMessagePayload[] = [];
  private shouldLogToConsole: boolean;
  
  /**
   * Create a new MockSlackClient
   * @param options Configuration options
   */
  constructor(options: { logToConsole?: boolean } = {}) {
    this.shouldLogToConsole = options.logToConsole ?? false;
    
    // Log initialization for debugging
    if (this.shouldLogToConsole) {
      console.log('MockSlackClient initialized with options:', JSON.stringify(options));
    }
  }
  
  /**
   * Send a message to the mock Slack client
   * @param payload The message payload to send
   * @returns Promise resolving when the message is processed
   */
  async sendMessage(payload: SlackMessagePayload): Promise<void> {
    // Store the message
    this.messages.push({ ...payload });
    
    // Simulate network latency
    await new Promise(resolve => global.setTimeout(resolve, 0));
    
    // Optionally log to console for debugging
    if (this.shouldLogToConsole) {
      console.log('--- MockSlackClient: Message Sent ---');
      console.log(`Channel: ${payload.channel}`);
      console.log(`Text: ${payload.text}`);
      
      // Check for blocks with explicit null/undefined and empty array checks
      const hasBlocks = payload.blocks !== undefined && 
                       payload.blocks !== null && 
                       payload.blocks.length > 0;
      if (hasBlocks) {
        console.log(`Blocks: ${JSON.stringify(payload.blocks, null, 2)}`);
      }
      
      // Check for username with explicit null/undefined and empty string checks
      const hasUsername = payload.username !== undefined && 
                         payload.username !== null && 
                         payload.username.length > 0;
      if (hasUsername) {
        console.log(`Username: ${payload.username}`);
      }
      
      console.log('--- End of MockSlackClient Message ---');
    }
    
    // Simulate async behavior
    return Promise.resolve();
  }
  
  /**
   * Get all messages sent to this client
   * @returns Array of message payloads
   */
  getMessages(): SlackMessagePayload[] {
    // Create a deep copy of the messages to prevent modification
    return this.messages.map(msg => JSON.parse(JSON.stringify(msg)));
  }
  
  /**
   * Get messages sent to a specific channel
   * @param channel Channel ID to filter by
   * @returns Array of message payloads sent to the specified channel
   */
  getMessagesForChannel(channel: string): SlackMessagePayload[] {
    return this.messages
      .filter(msg => msg.channel === channel)
      .map(msg => JSON.parse(JSON.stringify(msg)));
  }
  
  /**
   * Find messages containing specific text
   * @param text Text to search for
   * @returns Array of message payloads containing the specified text
   */
  findMessagesByText(text: string): SlackMessagePayload[] {
    return this.messages
      .filter(msg => msg.text.includes(text))
      .map(msg => JSON.parse(JSON.stringify(msg)));
  }
  
  /**
   * Check if a message with specific content was sent
   * @param criteria Partial message payload to match against
   * @returns True if a matching message was sent
   */
  wasMessageSent(criteria: Partial<SlackMessagePayload>): boolean {
    return this.messages.some(msg => {
      return Object.entries(criteria).every(([key, value]) => {
        // Handle blocks separately with explicit null check
        if (key === 'blocks') {
          // If criteria has blocks but message doesn't, return false
          if (Array.isArray(value) && !Array.isArray(msg.blocks)) {
            return false;
          }
          
          // If both have blocks, compare them
          if (Array.isArray(value) && Array.isArray(msg.blocks)) {
            const messageBlocks = msg.blocks ?? [];
            return value.every((block, index) => {
              // Check if the index exists in the message blocks
              if (index < messageBlocks.length) {
                const msgBlock = messageBlocks[index];
                return msgBlock.type === block.type;
              }
              return false;
            });
          }
          
          // If criteria doesn't have blocks, it's a match
          return true;
        }
        
        // For other properties, do a simple equality check
        return msg[key as keyof SlackMessagePayload] === value;
      });
    });
  }
  
  /**
   * Clear all stored messages
   */
  clearMessages(): void {
    this.messages = [];
  }
  
  /**
   * Debug method to print all stored messages to the console
   * @param prefix Optional prefix to add to each line
   */
  debugMessages(prefix = 'MockSlackClient'): void {
    console.log(`--- ${prefix} stored messages (${this.messages.length}) ---`);
    this.messages.forEach((msg, index) => {
      console.log(`[${index}] Channel: ${msg.channel}, Text: ${msg.text}`);
      
      // Check for blocks with explicit null/undefined and empty array checks
      const hasBlocks = msg.blocks !== undefined && 
                       msg.blocks !== null && 
                       msg.blocks.length > 0;
      if (hasBlocks) {
        console.log(`    Blocks: ${JSON.stringify(msg.blocks, null, 2)}`);
      }
    });
    console.log(`--- End of ${prefix} stored messages ---`);
  }
}
