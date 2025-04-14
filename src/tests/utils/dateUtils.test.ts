/**
 * Tests for the DateUtils utility functions
 */
import { jest, describe, it, expect } from '@jest/globals';

// Import the functions to test
import { 
  getTodayDate, 
  formatDate,
  convertTimeToMinutes,
  parseTimeString,
  formatTimeWithPeriod,
  isValidTime,
  parseDateString
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

  describe('parseTimeString', () => {
    it('parses standard time format correctly', () => {
      expect(parseTimeString('14:30')).toEqual({ hours: 14, minutes: 30 });
      expect(parseTimeString('9:15')).toEqual({ hours: 9, minutes: 15 });
      expect(parseTimeString('23:45')).toEqual({ hours: 23, minutes: 45 });
    });

    it('handles AM/PM time formats', () => {
      expect(parseTimeString('2:30 PM')).toEqual({ hours: 14, minutes: 30 });
      expect(parseTimeString('10:15 AM')).toEqual({ hours: 10, minutes: 15 });
      expect(parseTimeString('12:00 AM')).toEqual({ hours: 0, minutes: 0 });
      expect(parseTimeString('12:30 PM')).toEqual({ hours: 12, minutes: 30 });
    });

    it('handles edge cases and invalid inputs', () => {
      expect(parseTimeString('')).toBeNull();
      expect(parseTimeString(null as unknown as string)).toBeNull();
      expect(parseTimeString('invalid')).toBeNull();
      expect(parseTimeString('abc:def')).toBeNull();
    });

    it('handles hour-only format', () => {
      expect(parseTimeString('14')).toEqual({ hours: 14, minutes: 0 });
      expect(parseTimeString('9')).toEqual({ hours: 9, minutes: 0 });
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

  describe('formatTimeWithPeriod', () => {
    it('formats standard time correctly', () => {
      expect(formatTimeWithPeriod('14:30')).toBe('2:30 PM');
      expect(formatTimeWithPeriod('9:15')).toBe('9:15 AM');
      expect(formatTimeWithPeriod('23:45')).toBe('11:45 PM');
      expect(formatTimeWithPeriod('0:30')).toBe('12:30 AM');
      expect(formatTimeWithPeriod('12:00')).toBe('12:00 PM');
    });

    it('handles edge cases and invalid inputs', () => {
      expect(formatTimeWithPeriod('')).toBe('N/A');
      expect(formatTimeWithPeriod(null)).toBe('N/A');
      expect(formatTimeWithPeriod(undefined)).toBe('N/A');
      expect(formatTimeWithPeriod('invalid')).toBe('N/A');
    });

    it('pads minutes with leading zeros', () => {
      expect(formatTimeWithPeriod('9:5')).toBe('9:05 AM');
      expect(formatTimeWithPeriod('14:5')).toBe('2:05 PM');
    });
  });

  describe('isValidTime', () => {
    it('validates standard time formats', () => {
      expect(isValidTime('14:30')).toBe(true);
      expect(isValidTime('9:15')).toBe(true);
      expect(isValidTime('23:45')).toBe(true);
    });

    it('validates AM/PM time formats', () => {
      expect(isValidTime('2:30 PM')).toBe(true);
      expect(isValidTime('10:15 AM')).toBe(true);
      expect(isValidTime('12:00 AM')).toBe(true);
    });

    it('handles invalid inputs', () => {
      expect(isValidTime('')).toBe(false);
      expect(isValidTime(null)).toBe(false);
      expect(isValidTime(undefined)).toBe(false);
      expect(isValidTime('invalid')).toBe(false);
      expect(isValidTime('abc:def')).toBe(false);
    });

    it('validates hour-only format', () => {
      expect(isValidTime('14')).toBe(true);
      expect(isValidTime('9')).toBe(true);
    });
  });

  describe('parseDateString', () => {
    it('parses a valid date string correctly', () => {
      const result = parseDateString('2025-03-20');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(2); // 0-indexed, so 2 = March
      expect(result.getDate()).toBe(20);
    });

    it('handles different date formats', () => {
      const result = parseDateString('2025-12-01');
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(11); // 0-indexed, so 11 = December
      expect(result.getDate()).toBe(1);
    });

    it('returns current date for invalid date strings', () => {
      const now = new Date();
      const result1 = parseDateString('invalid');
      const result2 = parseDateString('');
      const result3 = parseDateString(null);
      const result4 = parseDateString(undefined);

      // We can't test exact equality since the current date might change during test execution
      // So we check if the dates are close (within 1 second)
      expect(Math.abs(result1.getTime() - now.getTime())).toBeLessThan(1000);
      expect(Math.abs(result2.getTime() - now.getTime())).toBeLessThan(1000);
      expect(Math.abs(result3.getTime() - now.getTime())).toBeLessThan(1000);
      expect(Math.abs(result4.getTime() - now.getTime())).toBeLessThan(1000);
    });
  });
});
