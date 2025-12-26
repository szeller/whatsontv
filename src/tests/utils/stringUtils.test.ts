/**
 * Tests for string utility functions
 */
import {
  isEmptyString,
  hasContent,
  isEmptyArray,
  getStringOrDefault,
  getStringValue,
  padString,
  truncateString,
  formatListWithSeparator,
  wrapText,
  createSeparator
} from '../../utils/stringUtils.js';

describe('stringUtils', () => {
  describe('isEmptyString', () => {
    it('should return true for null', () => {
      expect(isEmptyString(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmptyString(undefined)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isEmptyString('')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isEmptyString('test')).toBe(false);
    });

    it('should return false for whitespace without trim', () => {
      expect(isEmptyString('   ')).toBe(false);
    });

    it('should return true for whitespace with trim', () => {
      expect(isEmptyString('   ', true)).toBe(true);
    });

    it('should return false for string with content and trim', () => {
      expect(isEmptyString('  test  ', true)).toBe(false);
    });
  });

  describe('hasContent', () => {
    it('should return false for null', () => {
      expect(hasContent(null)).toBe(false);
    });

    it('should return false for undefined', () => {
      expect(hasContent(undefined)).toBe(false);
    });

    it('should return false for empty string', () => {
      expect(hasContent('')).toBe(false);
    });

    it('should return true for non-empty string', () => {
      expect(hasContent('test')).toBe(true);
    });

    it('should return true for whitespace (does not trim)', () => {
      expect(hasContent('   ')).toBe(true);
    });

    it('should narrow type correctly', () => {
      const value: string | null = 'test';
      if (hasContent(value)) {
        // TypeScript should know value is string here
        expect(value.toUpperCase()).toBe('TEST');
      }
    });
  });

  describe('isEmptyArray', () => {
    it('should return true for null', () => {
      expect(isEmptyArray(null)).toBe(true);
    });

    it('should return true for undefined', () => {
      expect(isEmptyArray(undefined)).toBe(true);
    });

    it('should return true for empty array', () => {
      expect(isEmptyArray([])).toBe(true);
    });

    it('should return false for array with elements', () => {
      expect(isEmptyArray([1, 2, 3])).toBe(false);
    });

    it('should return false for array with single element', () => {
      expect(isEmptyArray(['test'])).toBe(false);
    });

    it('should work with different types', () => {
      expect(isEmptyArray([{ key: 'value' }])).toBe(false);
      expect(isEmptyArray([null])).toBe(false); // Array with null element is not empty
    });
  });

  describe('getStringOrDefault', () => {
    it('should return the input value if it is valid', () => {
      expect(getStringOrDefault('test', 'default')).toBe('test');
    });

    it('should return the default value if input is undefined', () => {
      expect(getStringOrDefault(undefined, 'default')).toBe('default');
    });

    it('should return the default value if input is null', () => {
      expect(getStringOrDefault(null, 'default')).toBe('default');
    });

    it('should return the default value if input is empty string', () => {
      expect(getStringOrDefault('', 'default')).toBe('default');
    });

    it('should return the default value if input is whitespace', () => {
      expect(getStringOrDefault('   ', 'default')).toBe('default');
    });

    it('should trim the input value', () => {
      expect(getStringOrDefault('  test  ', 'default')).toBe('test');
    });
  });

  describe('getStringValue', () => {
    it('should return the input value if it is valid', () => {
      expect(getStringValue('test', 'default')).toBe('test');
    });

    it('should return the default value if input is undefined', () => {
      expect(getStringValue(undefined, 'default')).toBe('default');
    });

    it('should return the default value if input is null', () => {
      expect(getStringValue(null, 'default')).toBe('default');
    });

    it('should return the default value if input is empty string', () => {
      expect(getStringValue('', 'default')).toBe('default');
    });

    it('should not trim the input value', () => {
      expect(getStringValue('  test  ', 'default')).toBe('  test  ');
    });
  });

  describe('padString', () => {
    it('should pad a string to the specified length', () => {
      expect(padString('test', 8)).toBe('test    ');
    });

    it('should handle undefined input', () => {
      expect(padString(undefined, 5)).toBe('     ');
    });

    it('should handle null input', () => {
      expect(padString(null, 5)).toBe('     ');
    });

    it('should use the specified pad character', () => {
      expect(padString('test', 8, '-')).toBe('test----');
    });

    it('should not truncate strings longer than the specified length', () => {
      expect(padString('testing', 5)).toBe('testing');
    });
  });

  describe('truncateString', () => {
    it('should not modify strings shorter than the max length', () => {
      expect(truncateString('test', 10)).toBe('test');
    });

    it('should truncate strings longer than the max length', () => {
      expect(truncateString('testing long string', 10)).toBe('testing...');
    });

    it('should handle undefined input', () => {
      expect(truncateString(undefined, 5)).toBe('');
    });

    it('should handle null input', () => {
      expect(truncateString(null, 5)).toBe('');
    });

    it('should use the specified suffix', () => {
      expect(truncateString('testing long string', 10, '---')).toBe('testing---');
    });

    it('should handle cases where maxLength is less than suffix length', () => {
      expect(truncateString('test', 2, '...')).toBe('..');
    });
  });

  describe('formatListWithSeparator', () => {
    it('should join items with the default separator', () => {
      expect(formatListWithSeparator(['a', 'b', 'c'])).toBe('a, b, c');
    });

    it('should use the specified separator', () => {
      expect(formatListWithSeparator(['a', 'b', 'c'], ' | ')).toBe('a | b | c');
    });

    it('should handle empty arrays', () => {
      expect(formatListWithSeparator([])).toBe('');
    });

    it('should filter out null and undefined values', () => {
      const items = ['a', null, 'b', undefined, 'c', ''];
      expect(formatListWithSeparator(items as string[])).toBe('a, b, c');
    });
  });

  describe('wrapText', () => {
    it('should wrap text to the specified width', () => {
      const text = 'This is a long text that needs to be wrapped to multiple lines';
      const expected = [
        'This is a',
        'long text',
        'that needs',
        'to be',
        'wrapped to',
        'multiple',
        'lines'
      ];
      expect(wrapText(text, 10)).toEqual(expected);
    });

    it('should handle empty input', () => {
      expect(wrapText('', 10)).toEqual([]);
    });

    it('should handle words longer than the max width', () => {
      expect(wrapText('supercalifragilisticexpialidocious', 10)).toEqual([
        'supercalif',
        'ragilistic',
        'expialidoc',
        'ious'
      ]);
    });

    it('should handle single-word input', () => {
      expect(wrapText('test', 10)).toEqual(['test']);
    });

    it('should handle negative max width', () => {
      expect(wrapText('test', -5)).toEqual([]);
    });

    it('should handle zero max width', () => {
      expect(wrapText('test', 0)).toEqual([]);
    });
  });

  describe('createSeparator', () => {
    it('should create a separator with default length and character', () => {
      expect(createSeparator()).toBe('==============================');
    });

    it('should create a separator with specified length', () => {
      expect(createSeparator(10)).toBe('==========');
    });

    it('should create a separator with specified character', () => {
      expect(createSeparator(10, '-')).toBe('----------');
    });
  });
});
