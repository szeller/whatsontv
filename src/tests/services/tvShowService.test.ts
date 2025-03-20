import { jest, describe, it } from '@jest/globals';


import {
  TVMAZE_API,
  setApiClient,
  normalizeShowData,
  isUSPlatform,
  groupShowsByNetwork,
  sortShowsByTime,
  getShowDetails,
  fetchTvShows
} from '../../services/tvShowService.js';
import type { Show, TVMazeShow } from '../../types/tvmaze.js';
import { MockHttpClient } from '../utils/mockHttpClient.js';

// Create a mock HTTP client
let mockClient: MockHttpClient;

const usCountry = {
  name: 'United States',
  code: 'US',
  timezone: 'America/New_York'
};

const ukCountry = {
  name: 'United Kingdom',
  code: 'GB',
  timezone: 'Europe/London'
};

const mockTvShow: TVMazeShow = {
  id: 1,
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
      country: usCountry
    },
    webChannel: null,
    genres: ['Drama', 'Crime'],
    language: 'English',
    image: null,
    summary: 'Test summary'
  }
};

const mockWebShow: TVMazeShow = {
  id: 2,
  airtime: '20:00',
  name: 'NCIS: Sydney',
  season: 1,
  number: 1,
  show: {
    id: 2,
    name: 'NCIS: Sydney',
    type: 'Scripted',
    webChannel: {
      id: 1,
      name: 'Paramount+',
      country: usCountry
    },
    network: null,
    genres: ['Drama', 'Crime'],
    language: 'English',
    image: null,
    summary: 'Test summary'
  }
};

const mockSpanishShow: TVMazeShow = {
  id: 3,
  airtime: '21:00',
  name: 'La Casa de Papel',
  season: 1,
  number: 1,
  show: {
    id: 3,
    name: 'La Casa de Papel',
    type: 'Scripted',
    network: {
      id: 1,
      name: 'Antena 3',
      country: ukCountry
    },
    webChannel: null,
    genres: ['Drama', 'Crime', 'Thriller'],
    language: 'Spanish',
    image: null,
    summary: 'A Spanish crime drama series'
  }
};

describe('tvShowService', () => {
  beforeEach(() => {
    // Reset the mock client and replace the real client with our mock
    mockClient = new MockHttpClient();
    setApiClient(mockClient);
    jest.clearAllMocks();
  });

  describe('fetchTvShows', () => {
    const mockDate = '2025-03-18';

    it('fetches and combines shows from both TV and web schedules', async () => {
      mockClient.mockGet(TVMAZE_API.TV_SCHEDULE, {
        data: [mockTvShow],
        status: 200,
        headers: {}
      });
      
      mockClient.mockGet(TVMAZE_API.WEB_SCHEDULE, {
        data: [mockWebShow],
        status: 200,
        headers: {}
      });

      const shows = await fetchTvShows({ date: mockDate });
      expect(shows).toHaveLength(2);
      expect(shows[0].name).toBe('NCIS');
      expect(shows[1].name).toBe('NCIS: Sydney');
    });

    it('handles API errors gracefully', async () => {
      mockClient.mockGetError(TVMAZE_API.TV_SCHEDULE, new Error('Network error'));
      mockClient.mockGetError(TVMAZE_API.WEB_SCHEDULE, new Error('Network error'));

      await expect(fetchTvShows()).rejects.toThrow('Failed to fetch TV shows');
    });
  });

  describe('normalizeShowData', () => {
    it('generates ID when missing', () => {
      const show: TVMazeShow = {
        id: undefined,
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: undefined,
          name: 'Test Show',
          type: 'Scripted',
          network: {
            id: 1,
            name: 'CBS',
            country: usCountry
          },
          webChannel: null,
          genres: ['Drama'],
          language: 'English',
          image: null,
          summary: 'Test summary'
        }
      };

      const result = normalizeShowData(show);
      expect(result?.show.id).toBeTruthy();
      expect(typeof result?.show.id === 'string' && result.show.id.length > 0).toBe(true);
    });
  });

  describe('isUSPlatform', () => {
    const usNetworks = [
      { id: 1, name: 'Netflix', country: usCountry },
      { id: 2, name: 'Paramount+', country: usCountry },
      { id: 3, name: 'Disney Plus', country: usCountry },
      { id: 4, name: 'Apple TV+', country: usCountry }
    ];

    const usTraditionalNetworks = [
      { id: 5, name: 'CBS', country: usCountry },
      { id: 6, name: 'Paramount Network', country: usCountry }
    ];

    const nonUsNetworks = [
      { id: 7, name: 'BBC', country: ukCountry },
      { id: 8, name: 'ITV', country: ukCountry }
    ];

    it('identifies US streaming platforms', () => {
      usNetworks.forEach(network => {
        expect(isUSPlatform(network)).toBe(true);
      });
    });

    it('identifies US networks', () => {
      usTraditionalNetworks.forEach(network => {
        expect(isUSPlatform(network)).toBe(true);
      });
    });

    it('handles non-US platforms', () => {
      nonUsNetworks.forEach(network => {
        expect(isUSPlatform(network)).toBe(false);
      });
    });

    it('handles undefined platform', () => {
      expect(isUSPlatform(null)).toBe(false);
    });

    it('handles case variations', () => {
      const caseVariationNetworks = [
        { id: 9, name: 'NETFLIX', country: usCountry },
        { id: 10, name: 'paramount plus', country: usCountry }
      ];

      caseVariationNetworks.forEach(network => {
        expect(isUSPlatform(network)).toBe(true);
      });
    });
  });

  describe('groupShowsByNetwork', () => {
    it('groups shows by network', () => {
      const shows = [
        { ...mockTvShow, show: { ...mockTvShow.show } } as Show,
        { ...mockWebShow, show: { ...mockWebShow.show } } as Show,
        { ...mockSpanishShow, show: { ...mockSpanishShow.show } } as Show
      ];

      const result = groupShowsByNetwork(shows);
      expect(Object.keys(result)).toHaveLength(3);
      expect(result['CBS']).toBeDefined();
      expect(result['Paramount+']).toBeDefined();
      expect(result['Antena 3']).toBeDefined();
    });

    it('handles shows without network', () => {
      const showWithoutNetwork: Show = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 12,
          name: 'Test Show',
          type: 'Scripted',
          network: null,
          webChannel: null,
          genres: [],
          language: '',
          image: null,
          summary: ''
        }
      };

      const result = groupShowsByNetwork([showWithoutNetwork]);
      expect(Object.keys(result)).toHaveLength(1);
      expect(result['Unknown']).toBeDefined();
    });
  });

  describe('sortShowsByTime', () => {
    it('sorts shows by airtime', () => {
      const shows = [
        { ...mockWebShow, airtime: '12:00' } as Show,
        { ...mockSpanishShow, airtime: '15:30' } as Show,
        { ...mockTvShow, airtime: '21:00' } as Show
      ];

      const result = sortShowsByTime(shows);
      expect(result[0].airtime).toBe('12:00');
      expect(result[1].airtime).toBe('15:30');
      expect(result[2].airtime).toBe('21:00');
    });

    it('handles missing airtimes', () => {
      const shows = [
        { ...mockTvShow, airtime: '' } as Show,
        { ...mockWebShow, airtime: '12:00' } as Show,
        { ...mockSpanishShow, airtime: '' } as Show
      ];

      const result = sortShowsByTime(shows);
      expect(result[0].airtime).toBe('12:00');
      expect(result[1].airtime).toBe('');
      expect(result[2].airtime).toBe('');
    });
  });

  describe('getShowDetails', () => {
    it('extracts show details correctly', () => {
      const show: Show = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 1,
          name: 'Test Show',
          type: 'Scripted',
          network: {
            id: 1,
            name: 'CBS',
            country: usCountry
          },
          webChannel: null,
          genres: ['Drama'],
          language: 'English',
          image: null,
          summary: 'Test summary'
        }
      };

      const result = getShowDetails(show);
      expect(result).toEqual(show.show);
    });

    it('handles missing fields', () => {
      const showWithMissingFields: Show = {
        airtime: '20:00',
        name: 'Test Show',
        season: 1,
        number: 1,
        show: {
          id: 12,
          name: 'Test Show',
          type: 'Scripted',
          network: null,
          webChannel: null,
          genres: [],
          language: '',
          image: null,
          summary: ''
        }
      };

      const result = getShowDetails(showWithMissingFields);
      expect(result).toEqual(showWithMissingFields.show);
    });
  });
});
