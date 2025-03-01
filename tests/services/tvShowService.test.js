import { normalizeNetworkName, normalizeShowData, fetchTvShows, TVMAZE_API, api } from '../../services/tvShowService.js';
import MockAdapter from 'axios-mock-adapter';

// Create mock using the exported api instance
const mock = new MockAdapter(api);

describe('tvShowService', () => {
  beforeEach(() => {
    // Reset mock handlers
    mock.reset();
  });

  describe('fetchTvShows', () => {
    const mockTvShow = {
      airtime: '20:00',
      name: 'NCIS',
      season: 1,
      number: 1,
      show: {
        name: 'NCIS',
        type: 'Scripted',
        network: { name: 'CBS' },
        webChannel: null,
        genres: ['Drama', 'Crime']
      }
    };

    const mockWebShow = {
      airtime: '12:00',
      name: 'NCIS: Sydney',
      season: 2,
      number: 5,
      show: {
        name: 'NCIS: Sydney',
        type: 'Scripted',
        network: null,
        webChannel: { name: 'Paramount+' },
        genres: ['Drama', 'Crime']
      }
    };

    test('fetches and combines shows from both TV and web schedules', async () => {
      // Mock both endpoints
      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [mockTvShow]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          return [200, [mockWebShow]];
        }
        return [404, {}];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        networks: ['CBS', 'Paramount+']
      });

      expect(result).toHaveLength(2);
      expect(result[0].show.name).toBe('NCIS');
      expect(result[1].show.name).toBe('NCIS: Sydney');
    });

    test('filters shows by network', async () => {
      // Mock both endpoints
      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [mockTvShow]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          return [200, [mockWebShow]];
        }
        return [404, {}];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        networks: ['CBS']
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('NCIS');
    });

    test('filters shows by type', async () => {
      // Mock both endpoints
      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [mockTvShow]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          return [200, [mockWebShow]];
        }
        return [404, {}];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        types: ['Scripted']
      });

      expect(result).toHaveLength(2);
    });

    test('filters shows by genre', async () => {
      // Mock both endpoints
      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [mockTvShow]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          return [200, [mockWebShow]];
        }
        return [404, {}];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        genres: ['Crime']
      });

      expect(result).toHaveLength(2);
    });

    test('handles API errors gracefully', async () => {
      // Mock both endpoints with errors
      mock.onGet().reply(500);

      const result = await fetchTvShows({
        date: '2025-03-07'
      });

      expect(result).toEqual([]);
    });

    test('only uses country parameter with TV schedule endpoint', async () => {
      let tvScheduleParams;
      let webScheduleParams;

      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          tvScheduleParams = config.params;
          return [200, [mockTvShow]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          webScheduleParams = config.params;
          return [200, [mockWebShow]];
        }
        return [404, {}];
      });

      await fetchTvShows({
        date: '2025-03-07',
        country: 'US'
      });

      expect(tvScheduleParams).toEqual({
        date: '2025-03-07',
        country: 'US'
      });
      expect(webScheduleParams).toEqual({
        date: '2025-03-07'
      });
    });
  });

  describe('normalizeNetworkName', () => {
    test('handles Paramount+ variations', () => {
      expect(normalizeNetworkName('Paramount+')).toBe('Paramount+');
      expect(normalizeNetworkName('Paramount Plus')).toBe('Paramount+');
      expect(normalizeNetworkName('paramount+')).toBe('Paramount+');
    });

    test('handles Paramount Network', () => {
      expect(normalizeNetworkName('Paramount Network')).toBe('Paramount Network');
      expect(normalizeNetworkName('paramount network')).toBe('Paramount Network');
    });

    test('handles CBS', () => {
      expect(normalizeNetworkName('CBS')).toBe('CBS');
      expect(normalizeNetworkName('cbs')).toBe('CBS');
    });

    test('handles null or undefined input', () => {
      expect(normalizeNetworkName(null)).toBe('');
      expect(normalizeNetworkName(undefined)).toBe('');
    });
  });

  describe('normalizeShowData', () => {
    test('normalizes regular show data', () => {
      const input = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          name: 'Test Show',
          type: 'Scripted',
          network: { name: 'CBS' },
          webChannel: null,
          genres: ['Drama']
        }
      };

      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          name: 'Test Show',
          type: 'Scripted',
          network: { name: 'CBS' },
          webChannel: null,
          genres: ['Drama']
        }
      });
    });

    test('normalizes web show data', () => {
      const input = {
        airtime: '',
        name: 'Test Web Show',
        season: 1,
        number: 1,
        _embedded: {
          show: {
            name: 'Test Web Show',
            type: 'Scripted',
            network: null,
            webChannel: { name: 'Paramount+' },
            genres: ['Drama']
          }
        }
      };

      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: 'TBA',
        name: 'Test Web Show',
        season: 1,
        number: 1,
        show: {
          name: 'Test Web Show',
          type: 'Scripted',
          network: null,
          webChannel: { name: 'Paramount+' },
          genres: ['Drama']
        }
      });
    });

    test('handles missing data', () => {
      const input = {};
      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: 'TBA',
        name: 'TBA',
        season: 'TBA',
        number: 'TBA',
        show: {
          name: 'Unknown Show',
          type: 'Unknown',
          network: undefined,
          webChannel: undefined,
          genres: []
        }
      });
    });
  });
});
