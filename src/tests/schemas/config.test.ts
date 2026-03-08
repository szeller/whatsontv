/**
 * Tests for config schema validation
 */
import { describe, it, expect } from '@jest/globals';
import {
  showNameFilterSchema,
  slackConfigSchema,
  showOptionsSchema,
  appConfigSchema,
  extractShowOptionsForLambda,
  type AppConfig
} from '../../schemas/config.js';

const DAYS_OF_OUR_LIVES = 'Days of Our Lives';
const TEST_SLACK_TOKEN = 'xoxb-test-token';
const TEST_DATE = '2025-04-01';
const LA_TIMEZONE = 'America/Los_Angeles';
const MOCK_SLACK_TOKEN = 'xoxb-token';
const MOCK_CHANNEL_ID = 'C123';
const TEST_CHANNEL_ID = 'C12345678';
const GENERAL_HOSPITAL = 'General Hospital';
const MIN_AIRTIME = '18:00';
const DEFAULT_NOTIFICATION_TIME = '09:00';
const OPS_EMAIL = 'ops@example.com';

describe('config schemas', () => {
  describe('showNameFilterSchema', () => {
    it('should validate a valid show name filter array', () => {
      const input = [DAYS_OF_OUR_LIVES, GENERAL_HOSPITAL];

      const result = showNameFilterSchema.parse(input);
      expect(result).toEqual([DAYS_OF_OUR_LIVES, GENERAL_HOSPITAL]);
    });

    it('should provide default empty array', () => {
      const result = showNameFilterSchema.parse();
      expect(result).toEqual([]);
    });

    it('should accept regex patterns as strings', () => {
      const input = ['^The .*Restless$', 'General.*'];

      const result = showNameFilterSchema.parse(input);
      expect(result).toEqual(['^The .*Restless$', 'General.*']);
    });

    it('should accept empty array', () => {
      const input: string[] = [];

      const result = showNameFilterSchema.parse(input);
      expect(result).toEqual([]);
    });
  });

  describe('slackConfigSchema', () => {
    it('should validate a valid slack config', () => {
      const input = {
        token: TEST_SLACK_TOKEN,
        channelId: TEST_CHANNEL_ID,
        username: 'TestBot'
      };

      const result = slackConfigSchema.parse(input);
      expect(result.token).toBe(TEST_SLACK_TOKEN);
      expect(result.channelId).toBe(TEST_CHANNEL_ID);
      expect(result.username).toBe('TestBot');
    });

    it('should provide default username', () => {
      const input = {
        token: TEST_SLACK_TOKEN,
        channelId: TEST_CHANNEL_ID
      };

      const result = slackConfigSchema.parse(input);
      expect(result.username).toBe('WhatsOnTV');
    });

    it('should allow optional fields', () => {
      const input = {
        token: TEST_SLACK_TOKEN,
        channelId: TEST_CHANNEL_ID,
        icon_emoji: ':tv:',
        dateFormat: 'en-US'
      };

      const result = slackConfigSchema.parse(input);
      expect(result.icon_emoji).toBe(':tv:');
      expect(result.dateFormat).toBe('en-US');
    });

    it('should reject missing required fields', () => {
      const input = {
        token: TEST_SLACK_TOKEN
        // missing channelId
      };

      expect(() => slackConfigSchema.parse(input)).toThrow();
    });
  });

  describe('showOptionsSchema', () => {
    it('should validate a complete show options object', () => {
      const input = {
        date: TEST_DATE,
        country: 'US',
        timezone: LA_TIMEZONE,
        types: ['Scripted', 'Reality'],
        networks: ['HBO', 'Netflix'],
        genres: ['Drama', 'Comedy'],
        languages: ['English'],
        minAirtime: MIN_AIRTIME,
        excludeShowNames: [DAYS_OF_OUR_LIVES]
      };

      const result = showOptionsSchema.parse(input);
      expect(result.date).toBe(TEST_DATE);
      expect(result.country).toBe('US');
      expect(result.types).toEqual(['Scripted', 'Reality']);
      expect(result.excludeShowNames).toEqual([DAYS_OF_OUR_LIVES]);
    });

    it('should validate an empty object', () => {
      const input = {};

      const result = showOptionsSchema.parse(input);
      expect(result.date).toBeUndefined();
      expect(result.country).toBeUndefined();
    });

    it('should validate partial options', () => {
      const input = {
        date: TEST_DATE,
        country: 'CA'
      };

      const result = showOptionsSchema.parse(input);
      expect(result.date).toBe(TEST_DATE);
      expect(result.country).toBe('CA');
      expect(result.types).toBeUndefined();
    });
  });

  describe('appConfigSchema', () => {
    it('should validate a complete app config', () => {
      const input = {
        country: 'US',
        timezone: 'America/New_York',
        types: ['Scripted'],
        networks: ['ABC'],
        genres: ['Drama'],
        languages: ['English'],
        minAirtime: '19:00',
        notificationTime: '08:00',
        showNameFilter: ['Test Show'],
        slack: {
          token: MOCK_SLACK_TOKEN,
          channelId: MOCK_CHANNEL_ID
        },
        operationsEmail: OPS_EMAIL
      };

      const result = appConfigSchema.parse(input);
      expect(result.country).toBe('US');
      expect(result.timezone).toBe('America/New_York');
      expect(result.showNameFilter).toEqual(['Test Show']);
      expect(result.operationsEmail).toBe(OPS_EMAIL);
    });

    it('should provide default values', () => {
      const input = {
        slack: {
          token: MOCK_SLACK_TOKEN,
          channelId: MOCK_CHANNEL_ID
        }
      };

      const result = appConfigSchema.parse(input);
      expect(result.country).toBe('US');
      expect(result.types).toEqual([]);
      expect(result.networks).toEqual([]);
      expect(result.minAirtime).toBe(MIN_AIRTIME);
      expect(result.notificationTime).toBe(DEFAULT_NOTIFICATION_TIME);
    });

    it('should require slack config', () => {
      const input = {
        country: 'US'
      };

      expect(() => appConfigSchema.parse(input)).toThrow();
    });
  });

  describe('extractShowOptionsForLambda', () => {
    it('should extract show options from app config', () => {
      const appConfig: AppConfig = {
        country: 'US',
        timezone: LA_TIMEZONE,
        types: ['Scripted'],
        networks: ['HBO'],
        genres: ['Drama'],
        languages: ['English'],
        minAirtime: MIN_AIRTIME,
        notificationTime: DEFAULT_NOTIFICATION_TIME,
        showNameFilter: [DAYS_OF_OUR_LIVES, GENERAL_HOSPITAL],
        slack: {
          token: MOCK_SLACK_TOKEN,
          channelId: MOCK_CHANNEL_ID,
          username: 'Bot'
        },
        operationsEmail: OPS_EMAIL
      };

      const result = extractShowOptionsForLambda(appConfig);

      // Should include filtering options
      expect(result.country).toBe('US');
      expect(result.timezone).toBe(LA_TIMEZONE);
      expect(result.types).toEqual(['Scripted']);
      expect(result.networks).toEqual(['HBO']);
      expect(result.genres).toEqual(['Drama']);
      expect(result.languages).toEqual(['English']);
      expect(result.minAirtime).toBe(MIN_AIRTIME);
      expect(result.excludeShowNames).toEqual([DAYS_OF_OUR_LIVES, GENERAL_HOSPITAL]);

      // Should not include operational config
      expect((result as Record<string, unknown>).slack).toBeUndefined();
      expect((result as Record<string, unknown>).notificationTime).toBeUndefined();
      expect((result as Record<string, unknown>).operationsEmail).toBeUndefined();
    });

    it('should handle missing showNameFilter', () => {
      const appConfig: AppConfig = {
        country: 'US',
        types: [],
        networks: [],
        genres: [],
        languages: [],
        minAirtime: MIN_AIRTIME,
        notificationTime: DEFAULT_NOTIFICATION_TIME,
        slack: {
          token: MOCK_SLACK_TOKEN,
          channelId: MOCK_CHANNEL_ID,
          username: 'Bot'
        }
      };

      const result = extractShowOptionsForLambda(appConfig);

      expect(result.excludeShowNames).toBeUndefined();
    });
  });
});
