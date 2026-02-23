/**
 * Fixture factory for SlackShowFormatter
 */
import { jest } from '@jest/globals';
import type { SlackShowFormatter } from '../../../interfaces/showFormatter.js';
import type { SlackBlock } from '../../../interfaces/slackClient.js';

/**
 * Creates a mock SlackShowFormatter with default implementations
 */
export const SlackShowFormatterFixture = {
  /**
   * Create a mock SlackShowFormatter with default implementations
   * @returns A jest mocked SlackShowFormatter
   */
  createMockFormatter(): jest.Mocked<SlackShowFormatter> {
    return {
      formatTimedShow: jest.fn().mockReturnValue({ 
        type: 'section', 
        text: { type: 'mrkdwn', text: 'Mocked timed show' } 
      }),
      formatUntimedShow: jest.fn().mockReturnValue({ 
        type: 'section', 
        text: { type: 'mrkdwn', text: 'Mocked untimed show' } 
      }),
      formatMultipleEpisodes: jest.fn().mockReturnValue([{ 
        type: 'section', 
        text: { type: 'mrkdwn', text: 'Mocked multiple episodes' } 
      }]),
      formatNetwork: jest.fn().mockReturnValue([{ 
        type: 'section', 
        text: { type: 'mrkdwn', text: 'Mocked network' } 
      }]),
      formatNetworkGroups: jest.fn().mockReturnValue([
        { 
          type: 'header', 
          text: { type: 'plain_text', text: 'TV Shows', emoji: true } 
        }
      ])
    } as jest.Mocked<SlackShowFormatter>;
  },

  /**
   * Create a mock SlackShowFormatter with custom implementations
   * @param overrides Custom implementations to override defaults
   * @returns A jest mocked SlackShowFormatter with custom implementations
   */
  createCustomMockFormatter(
    overrides: Partial<jest.Mocked<SlackShowFormatter>>
  ): jest.Mocked<SlackShowFormatter> {
    return {
      ...this.createMockFormatter(),
      ...overrides
    };
  },

  /**
   * Create a mock header block
   * @param text The text to display in the header
   * @returns A SlackBlock with header type
   */
  createHeaderBlock(text = 'TV Shows'): SlackBlock {
    return {
      type: 'header',
      text: { type: 'plain_text', text, emoji: true }
    };
  },

  /**
   * Create a mock section block
   * @param text The text to display in the section
   * @returns A SlackBlock with section type
   */
  createSectionBlock(text: string): SlackBlock {
    return {
      type: 'section',
      text: { type: 'mrkdwn', text }
    };
  }
};
