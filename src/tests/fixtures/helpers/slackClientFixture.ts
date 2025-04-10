/**
 * Fixture factory for SlackClient
 */
import { jest } from '@jest/globals';
import type { SlackClient, SlackMessagePayload } from '../../../interfaces/slackClient.js';

/**
 * Creates a mock SlackClient with default implementations
 */
export class SlackClientFixture {
  /**
   * Create a mock SlackClient with default implementations
   * @returns A jest mocked SlackClient
   */
  static createMockClient(): jest.Mocked<SlackClient> {
    return {
      sendMessage: jest.fn().mockImplementation(() => Promise.resolve())
    } as jest.Mocked<SlackClient>;
  }

  /**
   * Create a mock SlackClient with custom implementations
   * @param overrides Custom implementations to override defaults
   * @returns A jest mocked SlackClient with custom implementations
   */
  static createCustomMockClient(
    overrides: Partial<jest.Mocked<SlackClient>>
  ): jest.Mocked<SlackClient> {
    return {
      ...this.createMockClient(),
      ...overrides
    };
  }

  /**
   * Create a default message payload for testing
   * @param overrides Custom properties to override defaults
   * @returns A SlackMessagePayload with default values
   */
  static createMessagePayload(
    overrides: Partial<SlackMessagePayload> = {}
  ): SlackMessagePayload {
    return {
      channel: 'test-channel',
      text: 'Test message',
      ...overrides
    };
  }
}
