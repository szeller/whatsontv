/**
 * Tests for common schema utilities
 */
import { describe, it, expect } from '@jest/globals';
import { numberFromMixed, nullableString, dateString } from '../../schemas/common.js';

describe('Common Schema Utilities', () => {
  describe('numberFromMixed', () => {
    it('should pass through numbers', () => {
      expect(numberFromMixed.parse(42)).toBe(42);
    });

    it('should convert string numbers to numbers', () => {
      expect(numberFromMixed.parse('42')).toBe(42);
    });

    it('should convert null to 0', () => {
      expect(numberFromMixed.parse(null)).toBe(0);
    });

    it('should convert undefined to 0', () => {
      expect(numberFromMixed.parse()).toBe(0);
    });

    it('should throw on invalid string input', () => {
      expect(() => numberFromMixed.parse('not-a-number')).toThrow();
    });
  });

  describe('nullableString', () => {
    it('should pass through strings', () => {
      expect(nullableString.parse('test')).toBe('test');
    });

    it('should pass through null', () => {
      expect(nullableString.parse(null)).toBeNull();
    });

    it('should convert undefined to null', () => {
      expect(nullableString.parse()).toBeNull();
    });
  });

  describe('dateString', () => {
    it('should pass valid date strings', () => {
      expect(dateString.parse('2023-01-01')).toBe('2023-01-01');
    });

    it('should reject invalid date formats', () => {
      expect(() => dateString.parse('01/01/2023')).toThrow();
      expect(() => dateString.parse('2023-1-1')).toThrow();
      expect(() => dateString.parse('not-a-date')).toThrow();
    });
  });
});
