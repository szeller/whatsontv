/**
 * Fixture factory for SlackClient
 */
import { jest } from '@jest/globals';
import type { SlackClient, SlackMessagePayload } from '../../../interfaces/slackClient.js';

/**
 * Creates a mock SlackClient with default implementations
 */
export const SlackClientFixture = {
  /**
   * Create a mock SlackClient with default implementations
   * @returns A jest mocked SlackClient
   */
  createMockClient(): jest.Mocked<SlackClient> {
    return {
      sendMessage: jest.fn<() => Promise<void>>().mockResolvedValue()
    } as jest.Mocked<SlackClient>;
  },

  /**
   * Create a mock SlackClient with custom implementations
   * @param overrides Custom implementations to override defaults
   * @returns A jest mocked SlackClient with custom implementations
   */
  createCustomMockClient(
    overrides: Partial<jest.Mocked<SlackClient>>
  ): jest.Mocked<SlackClient> {
    return {
      ...this.createMockClient(),
      ...overrides
    };
  },

  /**
   * Create a default message payload for testing
   * @param overrides Custom properties to override defaults
   * @returns A SlackMessagePayload with default values
   */
  createMessagePayload(
    overrides: Partial<SlackMessagePayload> = {}
  ): SlackMessagePayload {
    return {
      channel: 'test-channel',
      text: 'Test message',
      ...overrides
    };
  }
};
