import { MockSlackClient } from '../implementations/mockSlackClient.js';
import type { SlackClient } from '../../../interfaces/slackClient.js';

/**
 * Options for creating a mock Slack client
 */
export interface SlackClientOptions {
  /**
   * Debug mode for the mock client
   * - 'none': No debug output (default)
   * - 'console': Log messages to console
   * - 'store': Store debug logs in memory
   * @default 'none'
   */
  debugMode?: 'none' | 'console' | 'store';
}

/**
 * Create a mock Slack client for testing
 * 
 * @example
 * ```typescript
 * const mockSlackClient = createMockSlackClient();
 * 
 * // Send a test message
 * await mockSlackClient.sendMessage({
 *   channel: 'test-channel',
 *   text: 'Test message'
 * });
 * 
 * // Verify message was sent
 * expect(mockSlackClient.getMessages()).toHaveLength(1);
 * expect(mockSlackClient.wasMessageSent({ text: 'Test message' })).toBe(true);
 * ```
 * 
 * @param options Configuration options
 * @returns A configured MockSlackClient instance
 */
export function createMockSlackClient(options: SlackClientOptions = {}): MockSlackClient {
  return new MockSlackClient(options);
}

/**
 * Create a factory function that produces mock Slack clients
 * Useful for dependency injection in tests
 * 
 * @param options Configuration options
 * @returns A factory function that returns mock Slack clients
 */
export function createMockSlackClientFactory(options: SlackClientOptions = {}): () => SlackClient {
  return () => createMockSlackClient(options);
}
