import { normalizeNetworkName, normalizeShowData, fetchTvShows, TVMAZE_API, api } from '../../services/tvShowService.js';
import MockAdapter from 'axios-mock-adapter';
import { jest } from '@jest/globals';

// Create mock using the exported api instance
const mock = new MockAdapter(api);

describe('tvShowService', () => {
  beforeEach(() => {
    // Reset mock handlers
    mock.reset();
  });

  describe('fetchTvShows', () => {
    const mockTvShow = normalizeShowData({
      airtime: '20:00',
      name: 'NCIS',
      season: 1,
      number: 1,
      show: {
        name: 'NCIS',
        type: 'Scripted',
        network: { name: 'CBS' },
        webChannel: null,
        genres: ['Drama', 'Crime'],
        language: 'English'
      }
    });

    const mockWebShow = normalizeShowData({
      airtime: '12:00',
      name: 'NCIS: Sydney',
      season: 2,
      number: 5,
      show: {
        name: 'NCIS: Sydney',
        type: 'Scripted',
        network: null,
        webChannel: { name: 'Paramount+' },
        genres: ['Drama', 'Crime'],
        language: 'English'
      }
    });

    const mockSpanishShow = {
      airtime: '21:00',
      name: 'La Casa de Papel',
      season: 1,
      number: 1,
      show: {
        id: 'mock-spanish-show',
        name: 'La Casa de Papel',
        type: 'Scripted',
        network: { name: 'Antena 3' },
        webChannel: null,
        genres: ['Drama', 'Crime', 'Thriller'],
        language: 'Spanish',
        image: null,
        summary: 'A Spanish crime drama series'
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

    test('filters shows by language', async () => {
      // Mock both endpoints to include Spanish and English shows
      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [mockTvShow, mockSpanishShow]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          return [200, [mockWebShow]];
        }
        return [404, {}];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        languages: ['Spanish']
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('La Casa de Papel');
      expect(result[0].show.language).toBe('Spanish');
    });

    test('handles missing language gracefully', async () => {
      const showWithoutLanguage = normalizeShowData({
        ...mockTvShow,
        show: { 
          ...mockTvShow.show,
          id: 'mock-no-language',
          language: null,
          image: null,
          summary: 'A show without language'
        }
      });

      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [showWithoutLanguage]];
        }
        if (config.url === TVMAZE_API.WEB_SCHEDULE) {
          return [200, []];
        }
        return [404, {}];
      });

      // Should not include shows with missing language when filtering by language
      const resultWithFilter = await fetchTvShows({
        date: '2025-03-07',
        languages: ['English']
      });
      expect(resultWithFilter).toHaveLength(0);

      // Should include shows with missing language when not filtering by language
      const resultWithoutFilter = await fetchTvShows({
        date: '2025-03-07'
      });
      expect(resultWithoutFilter).toHaveLength(1);
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
    beforeEach(() => {
      // Mock Date.now() to return a consistent value for generateId
      jest.spyOn(Date, 'now').mockImplementation(() => 1234567890);
      // Mock Math.random() to return a consistent value for generateId
      jest.spyOn(Math, 'random').mockImplementation(() => 0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

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
          genres: ['Drama'],
          language: 'English',
          image: null,
          summary: 'A test show'
        }
      };

      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: expect.any(String),
          name: 'Test Show',
          type: 'Scripted',
          network: { name: 'CBS' },
          webChannel: null,
          genres: ['Drama'],
          language: 'English',
          image: null,
          summary: 'A test show'
        }
      });
    });

    test('normalizes web show data with _embedded structure', () => {
      const input = {
        airtime: '12:00',
        name: 'Test Web Show',
        season: 1,
        number: 1,
        _embedded: {
          show: {
            name: 'Test Web Show',
            type: 'Scripted',
            network: null,
            webChannel: { name: 'Paramount+' },
            genres: ['Drama'],
            language: 'English',
            image: null,
            summary: 'A web show'
          }
        }
      };

      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: '12:00',
        name: 'Test Web Show',
        season: 1,
        number: 1,
        show: {
          id: expect.any(String),
          name: 'Test Web Show',
          type: 'Scripted',
          network: null,
          webChannel: { name: 'Paramount+' },
          genres: ['Drama'],
          language: 'English',
          image: null,
          summary: 'A web show'
        }
      });
    });

    test('normalizes direct show data', () => {
      const input = {
        name: 'Direct Show',
        type: 'Reality',
        network: { name: 'Discovery' },
        webChannel: null,
        genres: ['Reality'],
        language: 'English',
        image: null,
        summary: 'A direct show'
      };

      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: '',
        name: 'Direct Show',
        season: '',
        number: '',
        show: {
          id: expect.any(String),
          name: 'Direct Show',
          type: 'Reality',
          network: { name: 'Discovery' },
          webChannel: null,
          genres: ['Reality'],
          language: 'English',
          image: null,
          summary: 'A direct show'
        }
      });
    });

    test('handles missing data', () => {
      const input = {
        show: {}
      };

      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: '',
        name: '',
        season: '',
        number: '',
        show: {
          id: expect.any(String),
          name: '',
          type: '',
          network: null,
          webChannel: null,
          genres: [],
          language: '',
          image: null,
          summary: ''
        }
      });
    });

    test('handles null input', () => {
      expect(normalizeShowData(null)).toBeNull();
    });

    test('handles missing show object', () => {
      const input = {
        airtime: '20:00',
        name: 'Test Show'
      };
      const result = normalizeShowData(input);
      expect(result).toEqual({
        airtime: '20:00',
        name: 'Test Show',
        season: '',
        number: '',
        show: {
          id: expect.any(String),
          name: 'Test Show',
          type: '',
          network: null,
          webChannel: null,
          genres: [],
          language: '',
          image: null,
          summary: ''
        }
      });
    });
  });
});
