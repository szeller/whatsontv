/**
 * Integration tests for ConfigService implementations
 * These tests verify that config files are actually loaded correctly,
 * unlike the unit tests which mock file operations.
 */
import { describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { CliConfigServiceImpl } from '../../implementations/text/cliConfigServiceImpl.js';
import { LambdaConfigServiceImpl } from '../../implementations/lambda/lambdaConfigServiceImpl.js';

describe('ConfigService Integration Tests', () => {
  describe('CliConfigServiceImpl', () => {
    it('loads config.json and returns valid show options', () => {
      // This test uses the real CliConfigServiceImpl, which reads from config.json
      const configService = new CliConfigServiceImpl();
      const options = configService.getShowOptions();

      // Verify the structure is correct
      expect(options).toHaveProperty('date');
      expect(options).toHaveProperty('country');
      expect(options).toHaveProperty('types');
      expect(options).toHaveProperty('networks');
      expect(options).toHaveProperty('genres');
      expect(options).toHaveProperty('languages');
      expect(options).toHaveProperty('fetchSource');

      // Verify types are correct
      expect(typeof options.date).toBe('string');
      expect(typeof options.country).toBe('string');
      expect(Array.isArray(options.types)).toBe(true);
      expect(Array.isArray(options.networks)).toBe(true);
      expect(Array.isArray(options.genres)).toBe(true);
      expect(Array.isArray(options.languages)).toBe(true);
    });

    it('loads specific values from config.json', () => {
      const configService = new CliConfigServiceImpl();
      const options = configService.getShowOptions();

      // These values should match what's in config.json
      // If config.json changes, these tests will catch it
      expect(options.country).toBe('US');
      expect(options.languages).toContain('English');
      expect(options.types).toEqual(expect.arrayContaining(['Reality', 'Scripted']));
    });

    it('returns valid CLI options', () => {
      const configService = new CliConfigServiceImpl();
      const cliOptions = configService.getCliOptions();

      expect(cliOptions).toHaveProperty('debug');
      expect(cliOptions).toHaveProperty('groupByNetwork');
      expect(typeof cliOptions.debug).toBe('boolean');
      expect(typeof cliOptions.groupByNetwork).toBe('boolean');
    });

    it('returns a valid date', () => {
      const configService = new CliConfigServiceImpl();
      const date = configService.getDate();

      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).not.toBeNaN();
    });
  });

  describe('LambdaConfigServiceImpl', () => {
    let originalAppConfig: string | undefined;

    beforeEach(() => {
      // Save original env var
      originalAppConfig = process.env.APP_CONFIG;
    });

    afterEach(() => {
      // Restore original env var
      if (originalAppConfig === undefined) {
        delete process.env.APP_CONFIG;
      } else {
        process.env.APP_CONFIG = originalAppConfig;
      }
    });

    it('loads config from APP_CONFIG environment variable', () => {
      // Set up test config
      process.env.APP_CONFIG = JSON.stringify({
        country: 'UK',
        languages: ['English', 'Spanish'],
        networks: ['BBC', 'ITV'],
        types: ['Scripted']
      });

      const configService = new LambdaConfigServiceImpl();
      const options = configService.getShowOptions();

      expect(options.country).toBe('UK');
      expect(options.languages).toEqual(['English', 'Spanish']);
      expect(options.networks).toEqual(['BBC', 'ITV']);
      expect(options.types).toEqual(['Scripted']);
    });

    it('uses default config when APP_CONFIG is not set', () => {
      delete process.env.APP_CONFIG;

      const configService = new LambdaConfigServiceImpl();
      const options = configService.getShowOptions();

      // Should have default values
      expect(options.country).toBe('US');
      expect(Array.isArray(options.types)).toBe(true);
      expect(Array.isArray(options.networks)).toBe(true);
    });

    it('uses default config when APP_CONFIG is invalid JSON', () => {
      process.env.APP_CONFIG = 'not valid json';

      // Should not throw, just use defaults
      const configService = new LambdaConfigServiceImpl();
      const options = configService.getShowOptions();

      expect(options.country).toBe('US');
    });

    it('merges partial config with defaults', () => {
      // Only set country, should use defaults for everything else
      process.env.APP_CONFIG = JSON.stringify({
        country: 'CA'
      });

      const configService = new LambdaConfigServiceImpl();
      const options = configService.getShowOptions();

      expect(options.country).toBe('CA');
      // Other fields should have default values
      expect(Array.isArray(options.types)).toBe(true);
      expect(Array.isArray(options.networks)).toBe(true);
    });

    it('reads DEBUG env var correctly', () => {
      process.env.APP_CONFIG = JSON.stringify({ country: 'US' });
      process.env.DEBUG = 'true';

      const configService = new LambdaConfigServiceImpl();
      expect(configService.isDebugMode()).toBe(true);

      // Cleanup
      delete process.env.DEBUG;
    });
  });
});
