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

describe('config schemas', () => {
  describe('showNameFilterSchema', () => {
    it('should validate a valid show name filter array', () => {
      const input = ['Days of Our Lives', 'General Hospital'];

      const result = showNameFilterSchema.parse(input);
      expect(result).toEqual(['Days of Our Lives', 'General Hospital']);
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
        token: 'xoxb-test-token',
        channelId: 'C12345678',
        username: 'TestBot'
      };

      const result = slackConfigSchema.parse(input);
      expect(result.token).toBe('xoxb-test-token');
      expect(result.channelId).toBe('C12345678');
      expect(result.username).toBe('TestBot');
    });

    it('should provide default username', () => {
      const input = {
        token: 'xoxb-test-token',
        channelId: 'C12345678'
      };

      const result = slackConfigSchema.parse(input);
      expect(result.username).toBe('WhatsOnTV');
    });

    it('should allow optional fields', () => {
      const input = {
        token: 'xoxb-test-token',
        channelId: 'C12345678',
        icon_emoji: ':tv:',
        dateFormat: 'en-US'
      };

      const result = slackConfigSchema.parse(input);
      expect(result.icon_emoji).toBe(':tv:');
      expect(result.dateFormat).toBe('en-US');
    });

    it('should reject missing required fields', () => {
      const input = {
        token: 'xoxb-test-token'
        // missing channelId
      };

      expect(() => slackConfigSchema.parse(input)).toThrow();
    });
  });

  describe('showOptionsSchema', () => {
    it('should validate a complete show options object', () => {
      const input = {
        date: '2025-04-01',
        country: 'US',
        timezone: 'America/Los_Angeles',
        types: ['Scripted', 'Reality'],
        networks: ['HBO', 'Netflix'],
        genres: ['Drama', 'Comedy'],
        languages: ['English'],
        minAirtime: '18:00',
        excludeShowNames: ['Days of Our Lives']
      };

      const result = showOptionsSchema.parse(input);
      expect(result.date).toBe('2025-04-01');
      expect(result.country).toBe('US');
      expect(result.types).toEqual(['Scripted', 'Reality']);
      expect(result.excludeShowNames).toEqual(['Days of Our Lives']);
    });

    it('should validate an empty object', () => {
      const input = {};

      const result = showOptionsSchema.parse(input);
      expect(result.date).toBeUndefined();
      expect(result.country).toBeUndefined();
    });

    it('should validate partial options', () => {
      const input = {
        date: '2025-04-01',
        country: 'CA'
      };

      const result = showOptionsSchema.parse(input);
      expect(result.date).toBe('2025-04-01');
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
          token: 'xoxb-token',
          channelId: 'C123'
        },
        operationsEmail: 'ops@example.com'
      };

      const result = appConfigSchema.parse(input);
      expect(result.country).toBe('US');
      expect(result.timezone).toBe('America/New_York');
      expect(result.showNameFilter).toEqual(['Test Show']);
      expect(result.operationsEmail).toBe('ops@example.com');
    });

    it('should provide default values', () => {
      const input = {
        slack: {
          token: 'xoxb-token',
          channelId: 'C123'
        }
      };

      const result = appConfigSchema.parse(input);
      expect(result.country).toBe('US');
      expect(result.types).toEqual([]);
      expect(result.networks).toEqual([]);
      expect(result.minAirtime).toBe('18:00');
      expect(result.notificationTime).toBe('09:00');
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
        timezone: 'America/Los_Angeles',
        types: ['Scripted'],
        networks: ['HBO'],
        genres: ['Drama'],
        languages: ['English'],
        minAirtime: '18:00',
        notificationTime: '09:00',
        showNameFilter: ['Days of Our Lives', 'General Hospital'],
        slack: {
          token: 'xoxb-token',
          channelId: 'C123',
          username: 'Bot'
        },
        operationsEmail: 'ops@example.com'
      };

      const result = extractShowOptionsForLambda(appConfig);

      // Should include filtering options
      expect(result.country).toBe('US');
      expect(result.timezone).toBe('America/Los_Angeles');
      expect(result.types).toEqual(['Scripted']);
      expect(result.networks).toEqual(['HBO']);
      expect(result.genres).toEqual(['Drama']);
      expect(result.languages).toEqual(['English']);
      expect(result.minAirtime).toBe('18:00');
      expect(result.excludeShowNames).toEqual(['Days of Our Lives', 'General Hospital']);

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
        minAirtime: '18:00',
        notificationTime: '09:00',
        slack: {
          token: 'xoxb-token',
          channelId: 'C123',
          username: 'Bot'
        }
      };

      const result = extractShowOptionsForLambda(appConfig);

      expect(result.excludeShowNames).toBeUndefined();
    });
  });
});
