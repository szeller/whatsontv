/**
 * Tests for TVMaze utility functions
 */
import { describe, it, expect } from '@jest/globals';
import { getNetworkScheduleUrl, getWebScheduleUrl } from '../../utils/tvMazeUtils.js';

describe('TVMaze Utils', () => {
  describe('getNetworkScheduleUrl', () => {
    it('should generate a URL with date parameter', () => {
      const url = getNetworkScheduleUrl('2023-01-01');
      expect(url).toBe('https://api.tvmaze.com/schedule?date=2023-01-01');
    });

    it('should generate a URL with date and country parameters', () => {
      const url = getNetworkScheduleUrl('2023-01-01', 'US');
      expect(url).toBe('https://api.tvmaze.com/schedule?date=2023-01-01&country=US');
    });

    it('should handle empty date parameter', () => {
      const url = getNetworkScheduleUrl('');
      expect(url).toBe('https://api.tvmaze.com/schedule');
    });

    it('should handle empty country parameter', () => {
      const url = getNetworkScheduleUrl('2023-01-01', '');
      expect(url).toBe('https://api.tvmaze.com/schedule?date=2023-01-01');
    });

    it('should handle null or undefined parameters', () => {
      // Testing null input
      const url1 = getNetworkScheduleUrl(null as unknown as string);
      expect(url1).toBe('https://api.tvmaze.com/schedule');

      // Testing undefined input
      const url2 = getNetworkScheduleUrl(undefined as unknown as string);
      expect(url2).toBe('https://api.tvmaze.com/schedule');

      // Testing null country
      const url3 = getNetworkScheduleUrl('2023-01-01', null as unknown as string);
      expect(url3).toBe('https://api.tvmaze.com/schedule?date=2023-01-01');

      // Testing undefined country
      const url4 = getNetworkScheduleUrl('2023-01-01', undefined as unknown as string);
      expect(url4).toBe('https://api.tvmaze.com/schedule?date=2023-01-01');
    });

    it('should handle whitespace in parameters', () => {
      const url1 = getNetworkScheduleUrl('  2023-01-01  ');
      expect(url1).toBe('https://api.tvmaze.com/schedule?date=2023-01-01');

      const url2 = getNetworkScheduleUrl('2023-01-01', '  US  ');
      expect(url2).toBe('https://api.tvmaze.com/schedule?date=2023-01-01&country=US');
    });
  });

  describe('getWebScheduleUrl', () => {
    it('should generate a URL with date parameter', () => {
      const url = getWebScheduleUrl('2023-01-01');
      expect(url).toBe('https://api.tvmaze.com/schedule/web?date=2023-01-01');
    });

    it('should handle empty date parameter', () => {
      const url = getWebScheduleUrl('');
      expect(url).toBe('https://api.tvmaze.com/schedule/web');
    });

    it('should handle null or undefined parameters', () => {
      // Testing null input
      const url1 = getWebScheduleUrl(null as unknown as string);
      expect(url1).toBe('https://api.tvmaze.com/schedule/web');

      // Testing undefined input
      const url2 = getWebScheduleUrl(undefined as unknown as string);
      expect(url2).toBe('https://api.tvmaze.com/schedule/web');
    });

    it('should handle whitespace in parameters', () => {
      const url = getWebScheduleUrl('  2023-01-01  ');
      expect(url).toBe('https://api.tvmaze.com/schedule/web?date=2023-01-01');
    });
  });
});
