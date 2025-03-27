/**
 * Tests for the DateUtils utility functions
 */
import { jest, describe, it, expect } from '@jest/globals';

// Import the functions to test
import { 
  getTodayDate, 
  formatDate,
  convertTimeToMinutes
} from '../../utils/dateUtils.js';

describe('DateUtils', () => {
  describe('getTodayDate', () => {
    it('returns date in YYYY-MM-DD format', () => {
      // Mock Date to return a fixed date
      const mockDate = new Date(2025, 2, 20); // March 20, 2025
      const originalDate = global.Date;
      global.Date = jest.fn(() => mockDate) as unknown as DateConstructor;
      global.Date.UTC = originalDate.UTC;
      global.Date.parse = originalDate.parse;
      global.Date.now = originalDate.now;

      // Test the function
      const result = getTodayDate();
      
      // Restore original Date
      global.Date = originalDate;
      
      // Assert the result
      expect(result).toBe('2025-03-20');
    });
  });

  describe('formatDate', () => {
    it('formats a date as YYYY-MM-DD', () => {
      const date = new Date(2025, 2, 20); // March 20, 2025
      const result = formatDate(date);
      expect(result).toBe('2025-03-20');
    });
  });

  describe('convertTimeToMinutes', () => {
    it('converts standard time format correctly', () => {
      expect(convertTimeToMinutes('14:30')).toBe(14 * 60 + 30);
      expect(convertTimeToMinutes('9:15')).toBe(9 * 60 + 15);
      expect(convertTimeToMinutes('23:45')).toBe(23 * 60 + 45);
    });

    it('handles AM/PM time formats', () => {
      expect(convertTimeToMinutes('2:30 PM')).toBe(14 * 60 + 30);
      expect(convertTimeToMinutes('10:15 AM')).toBe(10 * 60 + 15);
      expect(convertTimeToMinutes('12:00 AM')).toBe(0);
      expect(convertTimeToMinutes('12:30 PM')).toBe(12 * 60 + 30);
    });

    it('handles edge cases and invalid inputs', () => {
      expect(convertTimeToMinutes('')).toBe(-1);
      expect(convertTimeToMinutes(null as unknown as string)).toBe(-1);
      expect(convertTimeToMinutes('invalid')).toBe(-1);
      expect(convertTimeToMinutes('25:00')).toBe(25 * 60); // Out of range but still parsed
      expect(convertTimeToMinutes('abc:def')).toBe(-1);
    });

    it('handles hour-only format', () => {
      expect(convertTimeToMinutes('14')).toBe(14 * 60);
      expect(convertTimeToMinutes('9')).toBe(9 * 60);
    });
  });
});
