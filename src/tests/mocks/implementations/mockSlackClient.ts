import 'reflect-metadata';
import { injectable } from 'tsyringe';

import type { SlackClient, SlackMessagePayload } from '../../../interfaces/slackClient.js';

/**
 * Mock implementation of SlackClient for testing
 * Stores all messages for later verification and provides configurable debug output
 */
@injectable()
export class MockSlackClient implements SlackClient {
  private messages: SlackMessagePayload[] = [];
  private debugMode: 'none' | 'console' | 'store';
  private debugLogs: string[] = [];
  
  /**
   * Create a new MockSlackClient
   * @param options Configuration options
   */
  constructor(options: { 
    debugMode?: 'none' | 'console' | 'store';
  } = {}) {
    this.debugMode = options.debugMode ?? 'none';
    
    if (this.debugMode === 'console') {
      console.log('MockSlackClient initialized with debug mode:', this.debugMode);
    } else if (this.debugMode === 'store') {
      this.debugLogs.push(`MockSlackClient initialized with debug mode: ${this.debugMode}`);
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
    
    // Handle debug output based on mode
    if (this.debugMode !== 'none') {
      const logMessages = [
        '--- MockSlackClient: Message Sent ---',
        `Channel: ${payload.channel}`,
        `Text: ${payload.text}`
      ];
      
      // Check for blocks
      const hasBlocks = payload.blocks !== undefined && 
                        payload.blocks !== null && 
                        payload.blocks.length > 0;
      if (hasBlocks) {
        logMessages.push(`Blocks: ${JSON.stringify(payload.blocks, null, 2)}`);
      }
      
      // Check for username
      const hasUsername = payload.username !== undefined && 
                          payload.username !== null && 
                          payload.username !== '';
      if (hasUsername) {
        logMessages.push(`Username: ${payload.username}`);
      }
      
      logMessages.push('--- End of MockSlackClient Message ---');
      
      if (this.debugMode === 'console') {
        logMessages.forEach(msg => { console.log(msg); });
      } else if (this.debugMode === 'store') {
        this.debugLogs.push(...logMessages);
      }
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
   * Clear all stored debug logs
   */
  clearDebugLogs(): void {
    this.debugLogs = [];
  }
  
  /**
   * Get stored debug logs
   * @returns Array of debug log messages
   */
  getDebugLogs(): string[] {
    return [...this.debugLogs];
  }
  
  /**
   * Set the debug mode
   * @param mode The debug mode to set
   */
  setDebugMode(mode: 'none' | 'console' | 'store'): void {
    this.debugMode = mode;
    
    if (this.debugMode === 'console') {
      console.log('MockSlackClient debug mode changed to:', mode);
    } else if (this.debugMode === 'store') {
      this.debugLogs.push(`MockSlackClient debug mode changed to: ${mode}`);
    }
  }
  
  /**
   * Print debug information about stored messages
   * @param options Options for formatting the debug output
   */
  printMessageSummary(options: { 
    includeBlocks?: boolean;
    toConsole?: boolean;
  } = {}): string[] {
    const includeBlocks = options.includeBlocks ?? false;
    const toConsole = options.toConsole ?? (this.debugMode === 'console');
    
    const summary = [
      `--- MockSlackClient stored messages (${this.messages.length}) ---`
    ];
    
    this.messages.forEach((msg, index) => {
      summary.push(`[${index}] Channel: ${msg.channel}, Text: ${msg.text}`);
      
      const hasBlocks = includeBlocks && 
                        msg.blocks !== undefined && 
                        msg.blocks !== null && 
                        msg.blocks.length > 0;
      if (hasBlocks) {
        summary.push(`    Blocks: ${JSON.stringify(msg.blocks, null, 2)}`);
      }
    });
    
    summary.push('--- End of MockSlackClient stored messages ---');
    
    if (toConsole) {
      summary.forEach(line => { console.log(line); });
    }
    
    if (this.debugMode === 'store') {
      this.debugLogs.push(...summary);
    }
    
    return summary;
  }
}
