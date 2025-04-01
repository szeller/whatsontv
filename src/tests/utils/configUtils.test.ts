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
  coerceFetchSource 
} from '../../utils/configUtils.js';

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
