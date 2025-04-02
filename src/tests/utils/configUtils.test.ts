/**
 * Tests for configuration utility functions
 */
import path from 'path';
import { fileURLToPath } from 'url';
import { 
  toStringArray, 
  mergeArraysWithPriority, 
  getDirPathFromImportMeta,
  resolveRelativePath,
  coerceFetchSource,
  mergeShowOptions
} from '../../utils/configUtils.js';
import { CliArgs } from '../../types/cliArgs.js';
import { AppConfig } from '../../types/configTypes.js';
import { getTodayDate } from '../../utils/dateUtils.js';

describe('configUtils', () => {
  describe('toStringArray', () => {
    it('should handle undefined values', () => {
      expect(toStringArray(undefined)).toEqual([]);
    });

    it('should handle null values', () => {
      expect(toStringArray(null)).toEqual([]);
    });

    it('should handle empty string', () => {
      expect(toStringArray('')).toEqual([]);
    });

    it('should handle whitespace string', () => {
      expect(toStringArray('  ')).toEqual([]);
    });

    it('should handle string with comma-separated values', () => {
      expect(toStringArray('a,b,c')).toEqual(['a', 'b', 'c']);
    });

    it('should handle string with custom separator', () => {
      expect(toStringArray('a|b|c', '|')).toEqual(['a', 'b', 'c']);
    });

    it('should handle string with whitespace around values', () => {
      expect(toStringArray(' a , b , c ')).toEqual(['a', 'b', 'c']);
    });

    it('should handle array of strings', () => {
      expect(toStringArray(['a', 'b', 'c'])).toEqual(['a', 'b', 'c']);
    });

    it('should convert non-string array items to strings', () => {
      // @ts-expect-error Testing with non-string array
      expect(toStringArray([1, true, null])).toEqual(['1', 'true', 'null']);
    });

    it('should convert non-string/non-array to single item array', () => {
      // @ts-expect-error Testing with non-string value
      expect(toStringArray(123)).toEqual(['123']);
    });
  });

  describe('mergeArraysWithPriority', () => {
    it('should return primary array if not empty', () => {
      expect(mergeArraysWithPriority(['a', 'b'], ['c', 'd'])).toEqual(['a', 'b']);
    });

    it('should return fallback array if primary is empty', () => {
      expect(mergeArraysWithPriority([], ['c', 'd'])).toEqual(['c', 'd']);
    });

    it('should return empty array if both are empty', () => {
      expect(mergeArraysWithPriority([], [])).toEqual([]);
    });

    it('should handle undefined primary array', () => {
      expect(mergeArraysWithPriority(undefined, ['c', 'd'])).toEqual(['c', 'd']);
    });

    it('should handle undefined fallback array', () => {
      expect(mergeArraysWithPriority(['a', 'b'], undefined)).toEqual(['a', 'b']);
    });

    it('should handle both arrays undefined', () => {
      expect(mergeArraysWithPriority(undefined, undefined)).toEqual([]);
    });

    it('should handle null primary array', () => {
      expect(mergeArraysWithPriority(null, ['c', 'd'])).toEqual(['c', 'd']);
    });
  });

  describe('getDirPathFromImportMeta', () => {
    it('should extract directory path from import.meta.url', () => {
      // Create a mock URL that mimics import.meta.url
      const mockUrl = 'file:///Users/test/project/src/file.js';
      const expectedPath = path.dirname(fileURLToPath(mockUrl));
      
      expect(getDirPathFromImportMeta(mockUrl)).toBe(expectedPath);
    });
  });

  describe('resolveRelativePath', () => {
    it('should resolve a relative path from a base directory', () => {
      const baseDir = '/Users/test/project';
      const relativePath = '../otherproject/file.txt';
      const expected = path.resolve(baseDir, relativePath);
      
      expect(resolveRelativePath(baseDir, relativePath)).toBe(expected);
    });

    it('should handle absolute paths in relativePath', () => {
      const baseDir = '/Users/test/project';
      const absolutePath = '/absolute/path/file.txt';
      
      expect(resolveRelativePath(baseDir, absolutePath)).toBe(absolutePath);
    });
  });

  describe('mergeShowOptions', () => {
    it('should correctly merge show options from different sources', () => {
      // Arrange
      const cliArgs: CliArgs = {
        date: '2025-04-01',
        country: 'CA',
        types: ['Drama'],
        networks: [],
        genres: [],
        languages: [],
        debug: true,
        fetch: 'network',
        groupByNetwork: false
      };
      
      const appConfig: AppConfig = {
        country: 'US',
        types: ['Reality'],
        networks: ['ABC'],
        genres: ['Comedy'],
        languages: ['English'],
        notificationTime: '09:00',
        slack: {
          enabled: false
        }
      };
      
      // Act
      const showOptions = mergeShowOptions(cliArgs, appConfig);
      
      // Assert - CLI values should override config values when provided
      expect(showOptions.date).toBe('2025-04-01'); // From CLI
      expect(showOptions.country).toBe('CA'); // From CLI
      expect(showOptions.types).toEqual(['Drama']); // From CLI
      
      // These should be from config since CLI provided empty arrays
      expect(showOptions.networks).toEqual(['ABC']); // From config
      expect(showOptions.genres).toEqual(['Comedy']); // From config
      expect(showOptions.languages).toEqual(['English']); // From config
      
      // Fetch source should be from CLI
      expect(showOptions.fetchSource).toBe('network'); // From CLI
    });

    it('should handle merging arrays with different priorities correctly', () => {
      // Arrange
      const cliArgs: CliArgs = {
        date: '2025-04-01',
        country: 'US',
        types: [], // Empty array should fall back to config
        networks: ['HBO', 'Showtime'], // Should override config
        genres: [], // Empty array should fall back to config
        languages: ['French'], // Should override config
        debug: false,
        fetch: 'all',
        groupByNetwork: true
      };
      
      const appConfig: AppConfig = {
        country: 'US',
        types: ['Reality', 'Game Show'],
        networks: ['ABC', 'NBC', 'CBS'],
        genres: ['Comedy', 'Drama'],
        languages: ['English', 'Spanish'],
        notificationTime: '09:00',
        slack: {
          enabled: false
        }
      };
      
      // Act
      const showOptions = mergeShowOptions(cliArgs, appConfig);
      
      // Assert - arrays should be merged with CLI taking priority when non-empty
      expect(showOptions.types).toEqual(['Reality', 'Game Show']); // From config (CLI was empty)
      expect(showOptions.networks).toEqual(['HBO', 'Showtime']); // From CLI (overrides config)
      expect(showOptions.genres).toEqual(['Comedy', 'Drama']); // From config (CLI was empty)
      expect(showOptions.languages).toEqual(['French']); // From CLI (overrides config)
      expect(showOptions.fetchSource).toBe('all'); // From CLI
    });

    it('should use default values when both CLI and config are empty', () => {
      // Arrange
      const cliArgs: CliArgs = {
        date: '',
        country: '',
        types: [],
        networks: [],
        genres: [],
        languages: [],
        debug: false,
        fetch: 'all', // Changed from empty string to valid enum value
        groupByNetwork: false
      };
      
      const appConfig: AppConfig = {
        country: '',
        types: [],
        networks: [],
        genres: [],
        languages: [],
        notificationTime: '',
        slack: {
          enabled: false
        }
      };
      
      // Act
      const showOptions = mergeShowOptions(cliArgs, appConfig);
      
      // Assert - should use defaults
      expect(showOptions.date).toBe(getTodayDate());
      expect(showOptions.country).toBe('');
      expect(showOptions.types).toEqual([]);
      expect(showOptions.networks).toEqual([]);
      expect(showOptions.genres).toEqual([]);
      expect(showOptions.languages).toEqual([]);
      expect(showOptions.fetchSource).toBe('all');
    });

    it('should handle undefined and null values gracefully', () => {
      // Arrange
      const cliArgs: Partial<CliArgs> = {
        date: undefined,
        country: null as unknown as string,
        types: undefined,
        networks: null as unknown as string[],
        debug: false,
        fetch: undefined,
        groupByNetwork: false
      };
      
      const appConfig: Partial<AppConfig> = {
        country: 'US',
        types: ['Reality'],
        genres: undefined,
        languages: null as unknown as string[],
        notificationTime: '09:00',
        slack: {
          enabled: false
        }
      };
      
      // Act
      const showOptions = mergeShowOptions(cliArgs as CliArgs, appConfig as AppConfig);
      
      // Assert
      expect(showOptions.date).toBe(getTodayDate()); // Default
      expect(showOptions.country).toBe('US'); // From config
      expect(showOptions.types).toEqual(['Reality']); // From config
      expect(showOptions.networks).toEqual([]); // Default
      expect(showOptions.genres).toEqual([]); // Default
      expect(showOptions.languages).toEqual([]); // Default
      expect(showOptions.fetchSource).toBe('all'); // Default
    });
  });

  describe('coerceFetchSource', () => {
    it('should return "web" for "web" input', () => {
      expect(coerceFetchSource('web')).toBe('web');
    });

    it('should return "network" for "network" input', () => {
      expect(coerceFetchSource('network')).toBe('network');
    });

    it('should return "all" for any other string input', () => {
      expect(coerceFetchSource('invalid')).toBe('all');
    });

    it('should handle case-insensitive inputs', () => {
      expect(coerceFetchSource('WEB')).toBe('web');
      expect(coerceFetchSource('Network')).toBe('network');
    });

    it('should return "all" for non-string inputs', () => {
      expect(coerceFetchSource(123)).toBe('all');
      expect(coerceFetchSource(null)).toBe('all');
      expect(coerceFetchSource(undefined)).toBe('all');
      expect(coerceFetchSource({})).toBe('all');
      expect(coerceFetchSource([])).toBe('all');
    });
  });
});
