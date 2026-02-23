import { 
  formatNetworkName, 
  formatShowType, 
  formatEpisodeInfo, 
  hasAirtime,
  allShowsHaveNoAirtime,
  prepareShowComponents,
  groupShowsByShowId,
  formatNetworkHeader
} from '../../utils/formatUtils.js';
import { Show } from '../../schemas/domain.js';
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';

describe('formatUtils', () => {
  describe('formatNetworkName', () => {
    it('should return the network name when provided', () => {
      expect(formatNetworkName('ABC')).toBe('ABC');
    });

    it('should return the default unknown label when network is null', () => {
      expect(formatNetworkName(null)).toBe('Unknown Network');
    });

    it('should return the default unknown label when network is undefined', () => {
      expect(formatNetworkName()).toBe('Unknown Network');
    });

    it('should return the custom unknown label when provided', () => {
      expect(formatNetworkName(null, 'No Network')).toBe('No Network');
    });
  });

  describe('formatShowType', () => {
    it('should return the show type when provided', () => {
      expect(formatShowType('Drama')).toBe('Drama');
    });

    it('should return the default unknown label when type is null', () => {
      expect(formatShowType(null)).toBe('Unknown Type');
    });

    it('should return the default unknown label when type is undefined', () => {
      expect(formatShowType()).toBe('Unknown Type');
    });

    it('should return the custom unknown label when provided', () => {
      expect(formatShowType(null, 'No Type')).toBe('No Type');
    });
  });

  describe('formatEpisodeInfo', () => {
    it('should format episode info with season and episode number', () => {
      const show = ShowBuilder.createTestShow({
        season: 2,
        number: 3
      });
      
      expect(formatEpisodeInfo(show)).toBe('S02E03');
    });

    it('should format episode info with double-digit season and episode', () => {
      const show = ShowBuilder.createTestShow({
        season: 10,
        number: 15
      });
      
      expect(formatEpisodeInfo(show)).toBe('S10E15');
    });

    it('should return empty string for null show', () => {
      expect(formatEpisodeInfo(null)).toBe('');
    });

    it('should return empty string for undefined show', () => {
      expect(formatEpisodeInfo()).toBe('');
    });

    it('should return episode number if season is missing', () => {
      const show = ShowBuilder.createTestShow({
        season: 0,
        number: 5
      });
      
      expect(formatEpisodeInfo(show)).toBe('E05');
    });

    it('should return season if episode number is missing', () => {
      const show = ShowBuilder.createTestShow({
        season: 2,
        number: 0
      });
      
      expect(formatEpisodeInfo(show)).toBe('S02');
    });

    it('should return empty string if both season and episode are missing', () => {
      const show = ShowBuilder.createTestShow({
        season: 0,
        number: 0
      });
      
      expect(formatEpisodeInfo(show)).toBe('');
    });
  });

  describe('hasAirtime', () => {
    it('should return true for show with airtime', () => {
      const show = ShowBuilder.createTestShow({
        airtime: '20:00'
      });
      
      expect(hasAirtime(show)).toBe(true);
    });

    it('should return false for show with null airtime', () => {
      const show = ShowBuilder.createTestShow({
        airtime: null
      });
      
      expect(hasAirtime(show)).toBe(false);
    });

    it('should return false for show with empty airtime', () => {
      const show = ShowBuilder.createTestShow({
        airtime: ''
      });
      
      expect(hasAirtime(show)).toBe(false);
    });
  });

  describe('allShowsHaveNoAirtime', () => {
    it('should return true if all shows have no airtime', () => {
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

    it('should return false if any show has airtime', () => {
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

    it('should return true for empty array', () => {
      const shows: Show[] = [];
      
      expect(allShowsHaveNoAirtime(shows)).toBe(true);
    });

    it('should return true for null input', () => {
      expect(allShowsHaveNoAirtime(null)).toBe(true);
    });
  });

  describe('prepareShowComponents', () => {
    it('should prepare components with airtime when included and available', () => {
      const show: Show = {
        id: 1,
        name: 'Test Show',
        season: 1,
        number: 5,
        type: 'Drama',
        language: 'English',
        genres: ['Drama'],
        network: 'ABC',
        summary: 'Test summary',
        airtime: '20:30'
      };
      
      const components = prepareShowComponents(show, { includeAirtime: true });
      
      expect(components).toEqual({
        name: 'Test Show',
        network: 'ABC',
        type: 'Drama',
        airtime: '8:30 PM',
        episode: 'S01E05'
      });
    });

    it('should prepare components without airtime when not included', () => {
      const show: Show = {
        id: 1,
        name: 'Test Show',
        season: 1,
        number: 5,
        type: 'Drama',
        language: 'English',
        genres: ['Drama'],
        network: 'ABC',
        summary: 'Test summary',
        airtime: '20:30'
      };
      
      const components = prepareShowComponents(show, { includeAirtime: false });
      
      expect(components).toEqual({
        name: 'Test Show',
        network: 'ABC',
        type: 'Drama',
        airtime: 'No airtime',
        episode: 'S01E05'
      });
    });

    it('should use default values for missing show properties', () => {
      const show: Show = {
        id: 1,
        name: '',
        season: 0,
        number: 0,
        type: '',
        language: null,
        genres: [],
        network: '',
        summary: null,
        airtime: null
      };
      
      const components = prepareShowComponents(show, { includeAirtime: true });
      
      expect(components).toEqual({
        name: 'Untitled Show',
        network: 'Unknown Network',
        type: 'Unknown Type',
        airtime: 'No airtime',
        episode: ''
      });
    });

    it('should use custom labels when provided', () => {
      const show: Show = {
        id: 1,
        name: '',
        season: 0,
        number: 0,
        type: '',
        language: null,
        genres: [],
        network: '',
        summary: null,
        airtime: null
      };
      
      const components = prepareShowComponents(show, { 
        includeAirtime: true,
        networkUnknownLabel: 'No Network',
        typeUnknownLabel: 'No Type'
      });
      
      expect(components).toEqual({
        name: 'Untitled Show',
        network: 'No Network',
        type: 'No Type',
        airtime: 'No airtime',
        episode: ''
      });
    });
  });

  describe('groupShowsByShowId', () => {
    it('should group shows by id', () => {
      const shows: Show[] = [
        ShowBuilder.createTestShow({
          id: 1,
          name: 'Show 1, Ep 1',
          season: 1,
          number: 1
        }),
        ShowBuilder.createTestShow({
          id: 1,
          name: 'Show 1, Ep 2',
          season: 1,
          number: 2
        }),
        ShowBuilder.createTestShow({
          id: 2,
          name: 'Show 2, Ep 1',
          season: 1,
          number: 1
        })
      ];
      
      const result = groupShowsByShowId(shows);
      
      expect(Object.keys(result)).toHaveLength(2);
      expect(result['1']).toHaveLength(2);
      expect(result['2']).toHaveLength(1);
      expect(result['1'][0].name).toBe('Show 1, Ep 1');
      expect(result['1'][1].name).toBe('Show 1, Ep 2');
      expect(result['2'][0].name).toBe('Show 2, Ep 1');
    });

    it('should return empty object for empty array', () => {
      const result = groupShowsByShowId([]);
      
      expect(Object.keys(result)).toHaveLength(0);
    });

    it('should return empty object for null input', () => {
      const result = groupShowsByShowId(null);
      
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('formatNetworkHeader', () => {
    it('should format network header with default unknown label', () => {
      const [header, separator] = formatNetworkHeader('HBO');
      expect(header).toBe('HBO:');
      expect(separator).toBe('----');
    });

    it('should format network header with custom unknown label', () => {
      const [header, separator] = formatNetworkHeader('HBO', 'No Network');
      expect(header).toBe('HBO:');
      expect(separator).toBe('----');
    });

    it('should handle null network', () => {
      const [header, separator] = formatNetworkHeader(null);
      expect(header).toBe('Unknown Network:');
      expect(separator).toBe('----------------');
    });

    it('should handle undefined network', () => {
      const [header, separator] = formatNetworkHeader();
      expect(header).toBe('Unknown Network:');
      expect(separator).toBe('----------------');
    });

    it('should handle empty network', () => {
      const [header, separator] = formatNetworkHeader('');
      expect(header).toBe('Unknown Network:');
      expect(separator).toBe('----------------');
    });
  });
});
