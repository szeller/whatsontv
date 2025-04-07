/**
 * Tests for console formatting utilities
 */
import { describe, expect, test } from '@jest/globals';
import type { Show } from '../../schemas/domain.js';
import {
  formatNetworkName,
  formatShowType,
  formatEpisodeInfo,
  formatNetworkHeader,
  groupShowsByShowId,
  prepareShowRowComponents,
  hasAirtime,
  allShowsHaveNoAirtime
} from '../../utils/consoleFormatUtils.js';
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';

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

    test('should handle null episode', () => {
      expect(formatEpisodeInfo({ season: 1, number: null })).toBe('');
    });

    test('should handle both null values', () => {
      expect(formatEpisodeInfo({ season: null, number: null })).toBe('');
    });
    
    test('should handle Show object', () => {
      const show = ShowBuilder.createTestShow({
        season: 2,
        number: 3
      });
      
      expect(formatEpisodeInfo(show)).toBe('S02E03');
    });
  });

  describe('formatNetworkHeader', () => {
    test('should format network header with default unknown label', () => {
      const [header, separator] = formatNetworkHeader('HBO');
      expect(header).toBe('HBO:');
      expect(separator).toBe('----');
    });

    test('should format network header with custom unknown label', () => {
      const [header, separator] = formatNetworkHeader('HBO', 'No Network');
      expect(header).toBe('HBO:');
      expect(separator).toBe('----');
    });

    test('should handle null network', () => {
      const [header, separator] = formatNetworkHeader(null);
      expect(header).toBe('Unknown Network:');
      expect(separator).toBe('----------------');
    });

    test('should handle undefined network', () => {
      const [header, separator] = formatNetworkHeader(undefined);
      expect(header).toBe('Unknown Network:');
      expect(separator).toBe('----------------');
    });

    test('should handle empty network', () => {
      const [header, separator] = formatNetworkHeader('');
      expect(header).toBe('Unknown Network:');
      expect(separator).toBe('----------------');
    });
  });

  describe('groupShowsByShowId', () => {
    test('should group shows by show ID', () => {
      const shows: Show[] = [
        ShowBuilder.createTestShow({
          id: 1,
          name: 'Show 1',
          airtime: '20:00',
          network: 'Network A'
        }),
        ShowBuilder.createTestShow({
          id: 2,
          name: 'Show 2',
          airtime: '21:00',
          network: 'Network B'
        }),
        ShowBuilder.createTestShow({
          id: 1,
          name: 'Show 1',
          airtime: '22:00',
          season: 1,
          number: 2
        })
      ];

      const result = groupShowsByShowId(shows);
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1']).toHaveLength(2);
      expect(result['2']).toHaveLength(1);
    });

    test('should handle empty shows array', () => {
      const shows: Show[] = [];
      const result = groupShowsByShowId(shows);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('prepareShowRowComponents', () => {
    test('should prepare show row components with default options', () => {
      const show = ShowBuilder.createTestShow();
      
      const components = prepareShowRowComponents(show);
      expect(components.time).toBe('20:00');
      expect(components.network).toBe('Test Network');
      expect(components.type).toBe('Scripted');
      expect(components.showName).toBe('Test Show');
      expect(components.episodeInfo).toBe('S01E01');
    });

    test('should use custom options for missing values', () => {
      const customOptions = {
        noAirtime: 'No Time',
        noNetwork: 'No Network',
        unknownShow: 'No Show',
        unknownType: 'No Type'
      };
      
      const show = ShowBuilder.createMinimalShow({
        name: '',
        airtime: '',
        network: '',
        type: ''
      });
      
      const components = prepareShowRowComponents(show, customOptions);
      expect(components.time).toBe('No Time');
      expect(components.network).toBe('No Network');
      expect(components.type).toBe('No Type');
      expect(components.showName).toBe('No Show');
      // Minimal show still has season and episode numbers
      expect(components.episodeInfo).toBe('S01E01');
    });
  });

  describe('hasAirtime', () => {
    test('should return true for show with airtime', () => {
      const show = ShowBuilder.createTestShow({
        airtime: '20:00'
      });
      expect(hasAirtime(show)).toBe(true);
    });

    test('should return false for show with null airtime', () => {
      const show = ShowBuilder.createTestShow({
        airtime: null
      });
      expect(hasAirtime(show)).toBe(false);
    });

    test('should return false for show with empty airtime', () => {
      const show = ShowBuilder.createTestShow({
        airtime: ''
      });
      expect(hasAirtime(show)).toBe(false);
    });
  });

  describe('allShowsHaveNoAirtime', () => {
    test('should return true if all shows have no airtime', () => {
      const shows: Show[] = [
        ShowBuilder.createTestShow({
          airtime: ''
        }),
        ShowBuilder.createTestShow({
          airtime: null
        })
      ];
      expect(allShowsHaveNoAirtime(shows)).toBe(true);
    });

    test('should return false if any show has airtime', () => {
      const shows: Show[] = [
        ShowBuilder.createTestShow({
          airtime: ''
        }),
        ShowBuilder.createTestShow({
          airtime: '21:00'
        })
      ];
      expect(allShowsHaveNoAirtime(shows)).toBe(false);
    });

    test('should return true for empty array', () => {
      const shows: Show[] = [];
      expect(allShowsHaveNoAirtime(shows)).toBe(true);
    });
  });
});
