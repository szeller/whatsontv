/**
 * Tests for console formatting utilities
 */
import { describe, expect, test } from '@jest/globals';
import type { Show } from '../../schemas/domain.js';
import {
  formatNetworkName,
  formatShowType,
  formatEpisodeInfo,
  formatShowForConsole,
  formatTableRow,
  createTableHeader,
  createBulletList
} from '../../utils/consoleFormatUtils.js';

describe('Console Format Utilities', () => {
  describe('formatNetworkName', () => {
    test('should format valid network name', () => {
      expect(formatNetworkName('HBO')).toBe('HBO');
    });

    test('should handle null network name', () => {
      expect(formatNetworkName(null)).toBe('Unknown Network');
    });

    test('should handle undefined network name', () => {
      expect(formatNetworkName(undefined)).toBe('Unknown Network');
    });

    test('should handle empty network name', () => {
      expect(formatNetworkName('')).toBe('Unknown Network');
    });
  });

  describe('formatShowType', () => {
    test('should format valid show type', () => {
      expect(formatShowType('Scripted')).toBe('Scripted');
    });

    test('should handle null show type', () => {
      expect(formatShowType(null)).toBe('Unknown');
    });

    test('should handle undefined show type', () => {
      expect(formatShowType(undefined)).toBe('Unknown');
    });

    test('should handle empty show type', () => {
      expect(formatShowType('')).toBe('Unknown');
    });
  });

  describe('formatEpisodeInfo', () => {
    test('should format valid episode information', () => {
      expect(formatEpisodeInfo({ season: 1, number: 5 })).toBe('S01E05');
    });

    test('should format double-digit episode information', () => {
      expect(formatEpisodeInfo({ season: 10, number: 15 })).toBe('S10E15');
    });

    test('should handle null season', () => {
      expect(formatEpisodeInfo({ season: null, number: 5 })).toBe('');
    });

    test('should handle undefined episode', () => {
      expect(formatEpisodeInfo({ season: 1, number: undefined })).toBe('');
    });

    test('should handle both null values', () => {
      expect(formatEpisodeInfo({ season: null, number: null })).toBe('');
    });
    
    test('should handle Show object', () => {
      const show: Show = {
        id: 1,
        name: 'Test Show',
        airtime: '20:00',
        network: 'Test Network',
        type: 'Scripted',
        season: 2,
        number: 3,
        genres: ['Drama'],
        language: 'English',
        summary: 'A test show summary'
      };
      expect(formatEpisodeInfo(show)).toBe('S02E03');
    });
  });

  describe('formatShowForConsole', () => {
    // Create a mock show that matches the required interface
    const mockShow: Show = {
      id: 1,
      name: 'Test Show',
      airtime: '20:00',
      network: 'Test Network',
      type: 'Scripted',
      season: 1,
      number: 5,
      genres: ['Drama'],
      language: 'English',
      summary: 'A test show summary'
    };

    test('should format show with default options', () => {
      const result = formatShowForConsole(mockShow);
      expect(result).toContain('Test Show');
      expect(result).toContain('8:00 PM');
      expect(result).toContain('Test Network');
      expect(result).toContain('Scripted');
      expect(result).toContain('S01E05');
    });

    test('should respect nameWidth option', () => {
      const result = formatShowForConsole(mockShow, { nameWidth: 10 });
      // Name should be padded to exactly 10 characters
      expect(result.substring(0, 10)).toBe('Test Show ');
    });

    test('should truncate long show name', () => {
      const longNameShow: Show = { 
        ...mockShow, 
        name: 'This is a very long show name that should be truncated' 
      };
      const result = formatShowForConsole(longNameShow, { nameWidth: 20 });
      // Check that the result starts with the truncated name
      expect(result.substring(0, 20)).toBe('This is a very lo...');
    });

    test('should exclude time when includeTime is false', () => {
      const result = formatShowForConsole(mockShow, { includeTime: false });
      expect(result).not.toContain('8:00 PM');
    });

    test('should exclude network when includeNetwork is false', () => {
      const result = formatShowForConsole(mockShow, { includeNetwork: false });
      expect(result).not.toContain('Test Network');
    });

    test('should exclude episode when includeEpisode is false', () => {
      const result = formatShowForConsole(mockShow, { includeEpisode: false });
      expect(result).not.toContain('S01E05');
    });

    test('should handle missing airtime', () => {
      const noAirtimeShow: Show = { ...mockShow, airtime: null };
      const result = formatShowForConsole(noAirtimeShow);
      expect(result).toContain('TBA');
    });

    test('should handle missing network', () => {
      // Create a new object with the required structure but with network set to a default value
      // since the interface requires network to be a string
      const noNetworkShow: Show = { 
        ...mockShow, 
        // TypeScript will enforce that network is a string, so we use a placeholder
        // that our formatNetworkName function will handle appropriately
        network: '' 
      };
      const result = formatShowForConsole(noNetworkShow);
      expect(result).toContain('Unknown Network');
    });

    test('should handle missing type', () => {
      // Create a new object with the required structure but with type set to a default value
      // since the interface requires type to be a string
      const noTypeShow: Show = { 
        ...mockShow, 
        // TypeScript will enforce that type is a string, so we use a placeholder
        // that our formatShowType function will handle appropriately
        type: '' 
      };
      const result = formatShowForConsole(noTypeShow);
      expect(result).toContain('Unknown');
    });
  });

  describe('formatTableRow', () => {
    test('should format table row with proper spacing', () => {
      const columns = ['Column1', 'Column2', 'Column3'];
      const widths = [10, 15, 20];
      const result = formatTableRow(columns, widths);
      
      expect(result).toBe('Column1    Column2         Column3             ');
    });

    test('should handle null and undefined values', () => {
      const columns = ['Column1', null, undefined];
      const widths = [10, 15, 20];
      const result = formatTableRow(columns, widths);
      
      expect(result).toBe('Column1                                        ');
    });

    test('should truncate columns that exceed width', () => {
      const columns = ['VeryLongColumn', 'Column2', 'Column3'];
      const widths = [5, 15, 20];
      const result = formatTableRow(columns, widths);
      
      // First column should be truncated to 5 characters
      expect(result.substring(0, 5)).toBe('VeryL');
    });
  });

  describe('createTableHeader', () => {
    test('should create table header with separator', () => {
      const headers = ['Name', 'Time', 'Network'];
      const widths = [20, 10, 15];
      const result = createTableHeader(headers, widths);
      
      expect(result).toHaveLength(2);
      expect(result[0]).toBe('Name                 Time       Network        ');
      expect(result[1]).toBe('-------------------- ---------- ---------------');
    });

    test('should create table header without separator', () => {
      const headers = ['Name', 'Time', 'Network'];
      const widths = [20, 10, 15];
      const result = createTableHeader(headers, widths, false);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toBe('Name                 Time       Network        ');
    });
  });

  describe('createBulletList', () => {
    test('should create bullet list with default bullet character', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const result = createBulletList(items);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('• Item 1');
      expect(result[1]).toBe('• Item 2');
      expect(result[2]).toBe('• Item 3');
    });

    test('should create bullet list with custom bullet character', () => {
      const items = ['Item 1', 'Item 2', 'Item 3'];
      const result = createBulletList(items, '* ');
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('* Item 1');
      expect(result[1]).toBe('* Item 2');
      expect(result[2]).toBe('* Item 3');
    });

    test('should handle multi-line items', () => {
      const items = ['Item 1\nSecond line', 'Item 2'];
      const result = createBulletList(items);
      
      expect(result).toHaveLength(3);
      expect(result[0]).toBe('• Item 1');
      expect(result[1]).toBe('  Second line');
      expect(result[2]).toBe('• Item 2');
    });

    test('should handle empty items array', () => {
      const items: string[] = [];
      const result = createBulletList(items);
      
      expect(result).toHaveLength(0);
    });
  });
});
