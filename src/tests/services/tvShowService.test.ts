import {
  api,
  TVMAZE_API,
  fetchTvShows,
  normalizeShowData,
  normalizeNetworkName,
  formatTime,
  getTodayDate,
  isUSPlatform,
  groupShowsByNetwork,
  sortShowsByTime,
  getShowDetails
} from '../../services/tvShowService';
import MockAdapter from 'axios-mock-adapter';
import { jest } from '@jest/globals';
import type { Show, TVMazeShow } from '../../types/tvmaze';

// Create mock using the exported api instance
const mock = new MockAdapter(api);

// Common test data
const mockTvShow = normalizeShowData({
  airtime: '20:00',
  name: 'NCIS',
  season: 1,
  number: 1,
  show: {
    id: 1,
    name: 'NCIS',
    type: 'Scripted',
    network: {
      id: 1,
      name: 'CBS',
      country: {
        code: 'US'
      }
    },
    webChannel: null,
    genres: ['Drama', 'Crime'],
    language: 'English',
    image: null,
    summary: 'A TV show'
  }
} as TVMazeShow) as Show;

const mockWebShow = normalizeShowData({
  airtime: '12:00',
  name: 'NCIS: Sydney',
  season: 1,
  number: 1,
  show: {
    id: 2,
    name: 'NCIS: Sydney',
    type: 'Scripted',
    network: null,
    webChannel: {
      id: 1,
      name: 'Paramount+',
      country: {
        code: 'US'
      }
    },
    genres: ['Drama', 'Crime'],
    language: 'English',
    image: null,
    summary: 'A web show'
  }
} as TVMazeShow) as Show;

const mockSpanishShow = {
  airtime: '21:00',
  name: 'La Casa de Papel',
  season: 1,
  number: 1,
  show: {
    id: 'mock-spanish-show',
    name: 'La Casa de Papel',
    type: 'Scripted',
    network: {
      id: 1,
      name: 'Antena 3',
      country: {
        code: 'ES'
      }
    },
    webChannel: null,
    genres: ['Drama', 'Crime', 'Thriller'],
    language: 'Spanish',
    image: null,
    summary: 'A Spanish crime drama series'
  }
} as Show;

// Mock console.error before all tests
const originalConsoleError = console.error;
beforeAll(() => {
  console.error = jest.fn();
});

// Restore console.error after all tests
afterAll(() => {
  console.error = originalConsoleError;
});

beforeEach(() => {
  // Reset mock handlers and clear console.error mock
  mock.reset();
  (console.error as jest.Mock).mockClear();
});

describe('tvShowService', () => {
  describe('fetchTvShows', () => {
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

      const shows = await fetchTvShows();
      expect(shows).toHaveLength(2);
      expect(shows[0].name).toBe('NCIS');
      expect(shows[1].name).toBe('NCIS: Sydney');
    });

    test('handles shows with various country data structures', async () => {
      const showWithEmbeddedNetwork = normalizeShowData({
        airtime: '20:00',
        name: 'Show 1',
        show: {
          id: 1,
          name: 'Show 1',
          network: {
            country: { code: 'US' }
          }
        }
      } as TVMazeShow);

      const showWithEmbeddedWebChannel = normalizeShowData({
        airtime: '21:00',
        name: 'Show 2',
        show: {
          id: 2,
          name: 'Show 2',
          webChannel: {
            country: { code: 'US' }
          }
        }
      } as TVMazeShow);

      const showWithoutCountryButUSPlatform = normalizeShowData({
        airtime: '22:00',
        name: 'Show 3',
        show: {
          id: 3,
          name: 'Show 3',
          webChannel: {
            name: 'Netflix'
          }
        }
      } as TVMazeShow);

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, [showWithEmbeddedWebChannel, showWithoutCountryButUSPlatform]];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [showWithEmbeddedNetwork]];
        }
        return [200, []];
      });

      const shows = await fetchTvShows({ country: 'US' });
      expect(shows).toHaveLength(3);
      expect(shows.map((s) => s.name)).toEqual(['Show 1', 'Show 2', 'Show 3']);
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
      } as TVMazeShow) as Show;

      mock.onGet().reply((config) => {
        if (config.url === TVMAZE_API.TV_SCHEDULE) {
          return [200, [showWithoutLanguage]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        languages: ['English']
      });

      expect(result).toHaveLength(0);
    });

    test('handles API errors gracefully', async () => {
      mock.onGet().networkError();

      const result = await fetchTvShows({
        date: '2025-03-07'
      });

      expect(result).toHaveLength(0);
      expect(console.error).toHaveBeenCalled();
    });

    test('filters shows by country', async () => {
      const usShow = {
        airtime: '20:00',
        name: 'Test Show US',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show US',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [usShow]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US'
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.network?.name).toBe('CBS');
    });

    test('includes shows with no country info', async () => {
      const showWithoutCountry = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'Unknown Network',
            country: null
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [showWithoutCountry]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US'
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.network?.name).toBe('Unknown Network');
    });

    test('includes shows from major US streaming platforms', async () => {
      const netflixShow = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: null,
          webChannel: {
            id: 1,
            name: 'Netflix',
            country: {
              code: 'GB',
              name: 'United Kingdom',
              timezone: 'Europe/London'
            }
          },
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, [netflixShow]];
        }
        if (config.url?.includes('/schedule') && !config.url?.includes('/web')) {
          return [200, []];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US'
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.webChannel?.name).toBe('Netflix');
    });

    test('filters shows by type', async () => {
      const scriptedShow = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      const realityShow = {
        airtime: '21:00',
        name: 'Reality Show',
        season: 1,
        number: 1,
        show: {
          id: 2,
          name: 'Reality Show',
          type: 'Reality',
          language: 'English',
          genres: ['Reality'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [scriptedShow, realityShow]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US',
        types: ['Scripted']
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.type).toBe('Scripted');
    });

    test('filters shows by network', async () => {
      const cbsShow = {
        airtime: '20:00',
        name: 'CBS Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'CBS Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      const nbcShow = {
        airtime: '21:00',
        name: 'NBC Show',
        season: 1,
        number: 1,
        show: {
          id: 2,
          name: 'NBC Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'NBC',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [cbsShow, nbcShow]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US',
        networks: ['CBS']
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.network?.name).toBe('CBS');
    });

    test('filters shows by genre', async () => {
      const dramaShow = {
        airtime: '20:00',
        name: 'Drama Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Drama Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      const comedyShow = {
        airtime: '21:00',
        name: 'Comedy Show',
        season: 1,
        number: 1,
        show: {
          id: 2,
          name: 'Comedy Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Comedy'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [dramaShow, comedyShow]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US',
        genres: ['Drama']
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.genres).toContain('Drama');
    });

    test('filters shows by language', async () => {
      const englishShow = {
        airtime: '20:00',
        name: 'English Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'English Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      const spanishShow = {
        airtime: '21:00',
        name: 'Spanish Show',
        season: 1,
        number: 1,
        show: {
          id: 2,
          name: 'Spanish Show',
          type: 'Scripted',
          language: 'Spanish',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US',
              name: 'United States',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [englishShow, spanishShow]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US',
        languages: ['English']
      });

      expect(result).toHaveLength(1);
      expect(result[0].show.language).toBe('English');
    });

    test('handles shows with missing genre and language', async () => {
      const showWithMissingFields = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: null,
          genres: [],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              name: 'United States',
              code: 'US',
              timezone: 'America/New_York'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [showWithMissingFields]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US',
        genres: ['Drama'],
        languages: ['English']
      });

      expect(result).toHaveLength(0);
    });

    test('handles shows with missing network and web channel', async () => {
      const showWithoutPlatform: Show = {
        ...mockTvShow,
        show: {
          ...mockTvShow.show,
          id: 'test-id',
          name: 'Test Show',
          network: null,
          webChannel: null,
          type: 'Scripted',
          language: 'English',
          genres: [],
          image: null,
          summary: ''
        }
      };

      mock.onGet().reply((config) => {
        if (config.url?.includes('/schedule/web')) {
          return [200, []];
        }
        if (config.url?.includes('/schedule') && config.params?.country === 'US') {
          return [200, [showWithoutPlatform]];
        }
        return [200, []];
      });

      const result = await fetchTvShows({
        date: '2025-03-07',
        country: 'US',
        networks: ['CBS']
      });

      expect(result).toHaveLength(0);
    });
  });

  describe('normalizeNetworkName', () => {
    test('handles Paramount+ variations', () => {
      expect(normalizeNetworkName('Paramount+')).toBe('Paramount+');
      expect(normalizeNetworkName('Paramount Plus')).toBe('Paramount+');
      expect(normalizeNetworkName('paramount plus')).toBe('Paramount+');
    });

    test('handles Paramount Network variations', () => {
      expect(normalizeNetworkName('Paramount Network')).toBe('Paramount Network');
      expect(normalizeNetworkName('paramount network')).toBe('Paramount Network');
    });

    test('handles CBS', () => {
      expect(normalizeNetworkName('CBS')).toBe('CBS');
      expect(normalizeNetworkName('cbs')).toBe('CBS');
    });

    test('handles undefined network', () => {
      expect(normalizeNetworkName(undefined)).toBe('');
    });
  });

  describe('normalizeShowData', () => {
    beforeEach(() => {
      // Mock Date.now() and Math.random() to return consistent values for generateId
      jest.spyOn(Date, 'now').mockImplementation(() => 1234567890);
      jest.spyOn(global.Math, 'random').mockImplementation(() => 0.123456789);
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    test('handles null input', () => {
      expect(normalizeShowData(null)).toBeNull();
    });

    test('handles missing show details', () => {
      const result = normalizeShowData({} as TVMazeShow);
      expect(result).toBeNull();
    });

    test('handles embedded show data', () => {
      const show = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US'
            }
          },
          webChannel: null,
          image: null,
          summary: 'Test summary'
        }
      } as TVMazeShow;

      const result = normalizeShowData(show);
      expect(result).toBeTruthy();
      expect(result?.show.name).toBe('Test Show');
    });

    test('generates ID when missing', () => {
      const show = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          name: 'Test Show',
          type: 'Scripted',
          language: 'English',
          genres: ['Drama'],
          network: {
            id: 1,
            name: 'CBS',
            country: {
              code: 'US'
            }
          }
        }
      } as TVMazeShow;

      const result = normalizeShowData(show);
      // Since we mocked Math.random() and Date.now(), we can predict the ID
      expect(result?.show.id).toBe('4fzzzxjylrxkf12oi');
    });
  });

  describe('formatTime', () => {
    test('handles undefined time', () => {
      expect(formatTime(undefined)).toBe('TBA');
    });

    test('formats AM times correctly', () => {
      expect(formatTime('09:30')).toBe('9:30 AM');
      expect(formatTime('00:00')).toBe('12:00 AM');
      expect(formatTime('11:59')).toBe('11:59 AM');
    });

    test('formats PM times correctly', () => {
      expect(formatTime('13:30')).toBe('1:30 PM');
      expect(formatTime('23:59')).toBe('11:59 PM');
      expect(formatTime('12:00')).toBe('12:00 PM');
    });
  });

  describe('getTodayDate', () => {
    test('returns date in YYYY-MM-DD format', () => {
      const mockDate = new Date('2025-03-16T12:00:00Z');
      jest.spyOn(global, 'Date').mockImplementation(() => mockDate);

      expect(getTodayDate()).toBe('2025-03-16');
      jest.restoreAllMocks();
    });
  });

  describe('isUSPlatform', () => {
    test('identifies US streaming platforms', () => {
      expect(isUSPlatform('Netflix')).toBe(true);
      expect(isUSPlatform('Paramount+')).toBe(true);
      expect(isUSPlatform('Disney Plus')).toBe(true);
      expect(isUSPlatform('Apple TV+')).toBe(true);
    });

    test('identifies US networks', () => {
      expect(isUSPlatform('CBS')).toBe(true);
      expect(isUSPlatform('Paramount Network')).toBe(true);
    });

    test('handles non-US platforms', () => {
      expect(isUSPlatform('BBC')).toBe(false);
      expect(isUSPlatform('ITV')).toBe(false);
    });

    test('handles undefined platform', () => {
      expect(isUSPlatform(undefined)).toBe(false);
    });

    test('handles case variations', () => {
      expect(isUSPlatform('NETFLIX')).toBe(true);
      expect(isUSPlatform('paramount plus')).toBe(true);
    });
  });

  describe('groupShowsByNetwork', () => {
    test('groups shows by network and web channel', () => {
      const shows = [mockTvShow, mockWebShow, mockSpanishShow];

      const result = groupShowsByNetwork(shows);
      expect(Object.keys(result)).toHaveLength(3);
      expect(result.CBS).toBeDefined();
      expect(result['Paramount+']).toBeDefined();
      expect(result['Antena 3']).toBeDefined();
    });

    test('handles shows without network or web channel', () => {
      const showWithoutNetwork: Show = {
        ...mockTvShow,
        show: {
          ...mockTvShow.show,
          id: 'test-id',
          name: 'Test Show',
          network: null,
          webChannel: null,
          type: 'Scripted',
          language: 'English',
          genres: [],
          image: null,
          summary: ''
        }
      };

      const result = groupShowsByNetwork([showWithoutNetwork]);
      expect(Object.keys(result)).toHaveLength(1);
      expect(result.Other).toBeDefined();
    });
  });

  describe('sortShowsByTime', () => {
    test('sorts shows by airtime', () => {
      const shows: Show[] = [
        { ...mockWebShow, airtime: '12:00' },
        { ...mockSpanishShow, airtime: '15:30' },
        { ...mockTvShow, airtime: '21:00' }
      ];

      const result = sortShowsByTime(shows);
      expect(result[0].airtime).toBe('12:00');
      expect(result[1].airtime).toBe('15:30');
      expect(result[2].airtime).toBe('21:00');
    });

    test('handles missing airtimes', () => {
      const shows: Show[] = [
        { ...mockTvShow, airtime: '' },
        { ...mockWebShow, airtime: '12:00' },
        { ...mockSpanishShow, airtime: '' }
      ];

      const result = sortShowsByTime(shows);
      expect(result[0].airtime).toBe('12:00');
      expect(result[1].airtime).toBe('');
      expect(result[2].airtime).toBe('');
    });
  });

  describe('getShowDetails', () => {
    test('extracts show details correctly', () => {
      const result = getShowDetails(mockTvShow);
      expect(result).toEqual({
        id: mockTvShow.show.id,
        name: mockTvShow.show.name,
        network: mockTvShow.show.network,
        webChannel: mockTvShow.show.webChannel,
        type: mockTvShow.show.type,
        language: mockTvShow.show.language,
        genres: mockTvShow.show.genres,
        image: mockTvShow.show.image,
        summary: mockTvShow.show.summary
      });
    });

    test('handles missing fields', () => {
      const showWithMissingFields: Show = {
        ...mockTvShow,
        show: {
          id: 'test-id',
          name: mockTvShow.show.name,
          network: null,
          webChannel: null,
          type: '',
          language: '',
          genres: [],
          image: null,
          summary: ''
        }
      };

      const result = getShowDetails(showWithMissingFields);
      expect(result).toEqual({
        id: 'test-id',
        name: showWithMissingFields.show.name,
        network: null,
        webChannel: null,
        type: '',
        language: '',
        genres: [],
        image: null,
        summary: ''
      });
    });
  });
});
