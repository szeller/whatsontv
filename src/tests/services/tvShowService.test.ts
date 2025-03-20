import { jest, describe, it } from '@jest/globals';

import {
  TVMAZE_API,
  setApiClient,
  normalizeShowData,
  isUSPlatform,
  groupShowsByNetwork,
  sortShowsByTime,
  getShowDetails,
  fetchTvShows,
  applyShowFilters,
  isTVMazeShow,
  extractShowId,
  extractShowName,
  extractShowType,
  extractShowLanguage,
  extractShowGenres
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

  describe('applyShowFilters', () => {
    // Create a set of test shows with various properties
    const testShows: Show[] = [
      // US Network drama show
      {
        airtime: '20:00',
        name: 'Drama Show',
        season: 1,
        number: 1,
        show: {
          id: 101,
          name: 'Drama Show',
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
          summary: 'A drama show'
        }
      },
      // Comedy show on streaming
      {
        airtime: '21:00',
        name: 'Comedy Show',
        season: 2,
        number: 5,
        show: {
          id: 102,
          name: 'Comedy Show',
          type: 'Scripted',
          network: null,
          webChannel: {
            id: 2,
            name: 'Netflix',
            country: usCountry
          },
          genres: ['Comedy'],
          language: 'English',
          image: null,
          summary: 'A comedy show'
        }
      },
      // Reality show
      {
        airtime: '19:00',
        name: 'Reality Show',
        season: 5,
        number: 10,
        show: {
          id: 103,
          name: 'Reality Show',
          type: 'Reality',
          network: {
            id: 3,
            name: 'ABC',
            country: usCountry
          },
          webChannel: null,
          genres: ['Reality'],
          language: 'English',
          image: null,
          summary: 'A reality show'
        }
      },
      // Spanish drama
      {
        airtime: '22:00',
        name: 'Spanish Drama',
        season: 1,
        number: 3,
        show: {
          id: 104,
          name: 'Spanish Drama',
          type: 'Scripted',
          network: {
            id: 4,
            name: 'Telemundo',
            country: usCountry
          },
          webChannel: null,
          genres: ['Drama', 'Thriller'],
          language: 'Spanish',
          image: null,
          summary: 'A Spanish drama'
        }
      },
      // Show with missing data
      {
        airtime: '18:00',
        name: 'Incomplete Show',
        season: 1,
        number: 1,
        show: {
          id: 105,
          name: 'Incomplete Show',
          type: '',
          network: null,
          webChannel: null,
          genres: [],
          language: '',
          image: null,
          summary: ''
        }
      }
    ];

    it('filters shows by type', () => {
      const result = applyShowFilters(testShows, { types: ['Scripted'] });
      expect(result).toHaveLength(3);
      expect(result.map(show => show.show.name)).toContain('Drama Show');
      expect(result.map(show => show.show.name)).toContain('Comedy Show');
      expect(result.map(show => show.show.name)).toContain('Spanish Drama');
      expect(result.map(show => show.show.name)).not.toContain('Reality Show');
    });

    it('filters shows by network', () => {
      const result = applyShowFilters(testShows, { networks: ['CBS'] });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Drama Show');
    });

    it('filters shows by web channel', () => {
      const result = applyShowFilters(testShows, { networks: ['Netflix'] });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Comedy Show');
    });

    it('filters shows by genre', () => {
      const result = applyShowFilters(testShows, { genres: ['Thriller'] });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Spanish Drama');
    });

    it('filters shows by language', () => {
      const result = applyShowFilters(testShows, { languages: ['Spanish'] });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Spanish Drama');
    });

    it('applies multiple filters with AND logic', () => {
      const result = applyShowFilters(testShows, { 
        types: ['Scripted'], 
        genres: ['Drama'],
        languages: ['English']
      });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Drama Show');
    });

    it('returns all shows when no filters are provided', () => {
      const result = applyShowFilters(testShows, {});
      expect(result).toHaveLength(testShows.length);
    });

    it('handles case-insensitive filtering', () => {
      const result = applyShowFilters(testShows, { networks: ['cbs'] });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Drama Show');
    });

    it('handles shows with missing properties', () => {
      const result = applyShowFilters(testShows, { types: [''] });
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Incomplete Show');
    });

    it('handles partial matches in network names', () => {
      const result = applyShowFilters(testShows, { networks: ['mun'] }); // Should match "Telemundo"
      expect(result).toHaveLength(1);
      expect(result[0].show.name).toBe('Spanish Drama');
    });
  });

  // New test suite for isTVMazeShow
  describe('isTVMazeShow', () => {
    it('identifies valid TVMazeShow with embedded show structure', () => {
      const validShow = {
        _embedded: {
          show: {
            id: 1,
            name: 'Test Show'
          }
        }
      };
      expect(isTVMazeShow(validShow)).toBe(true);
    });

    it('identifies valid TVMazeShow with direct show property', () => {
      const validShow = {
        show: {
          id: 1,
          name: 'Test Show'
        }
      };
      expect(isTVMazeShow(validShow)).toBe(true);
    });

    it('identifies valid TVMazeShow with direct show properties', () => {
      const validShow = {
        id: 1,
        name: 'Test Show'
      };
      expect(isTVMazeShow(validShow)).toBe(true);
    });

    it('rejects null or undefined values', () => {
      expect(isTVMazeShow(null)).toBe(false);
      expect(isTVMazeShow(undefined)).toBe(false);
    });

    it('rejects objects without required properties', () => {
      expect(isTVMazeShow({})).toBe(false);
      expect(isTVMazeShow({ id: 1 })).toBe(false);
      expect(isTVMazeShow({ _embedded: {} })).toBe(false);
      expect(isTVMazeShow({ show: null })).toBe(false);
    });
  });

  // Test suite for extractShowId
  describe('extractShowId', () => {
    it('extracts ID from embedded show structure', () => {
      const show = {
        _embedded: {
          show: {
            id: 123
          }
        }
      } as TVMazeShow;
      expect(extractShowId(show)).toBe(123);
    });

    it('extracts ID from direct show property', () => {
      const show = {
        show: {
          id: 456
        }
      } as TVMazeShow;
      expect(extractShowId(show)).toBe(456);
    });

    it('extracts ID from direct properties', () => {
      const show = {
        id: 789
      } as TVMazeShow;
      expect(extractShowId(show)).toBe(789);
    });

    it('generates ID when all IDs are missing', () => {
      const show = {
        show: {
          id: undefined
        }
      } as TVMazeShow;
      const result = extractShowId(show);
      expect(typeof result).toBe('string');
      expect((result as string).length).toBeGreaterThan(0);
    });
  });

  // Test suite for extractShowName
  describe('extractShowName', () => {
    it('extracts name from embedded show structure', () => {
      const show = {
        _embedded: {
          show: {
            name: 'Embedded Show'
          }
        }
      } as TVMazeShow;
      expect(extractShowName(show)).toBe('Embedded Show');
    });

    it('extracts name from direct show property', () => {
      const show = {
        show: {
          name: 'Direct Show'
        }
      } as TVMazeShow;
      expect(extractShowName(show)).toBe('Direct Show');
    });

    it('extracts name from direct properties', () => {
      const show = {
        name: 'Simple Show'
      } as TVMazeShow;
      expect(extractShowName(show)).toBe('Simple Show');
    });

    it('returns empty string when name is missing', () => {
      const show = {} as TVMazeShow;
      expect(extractShowName(show)).toBe('');
    });
  });

  // Test suite for extractShowType
  describe('extractShowType', () => {
    it('extracts type from embedded show structure', () => {
      const show = {
        _embedded: {
          show: {
            type: 'Scripted'
          }
        }
      } as TVMazeShow;
      expect(extractShowType(show)).toBe('Scripted');
    });

    it('extracts type from direct show property', () => {
      const show = {
        show: {
          type: 'Reality'
        }
      } as TVMazeShow;
      expect(extractShowType(show)).toBe('Reality');
    });

    it('extracts type from direct properties', () => {
      const show = {
        type: 'Documentary'
      } as TVMazeShow;
      expect(extractShowType(show)).toBe('Documentary');
    });

    it('returns empty string when type is missing', () => {
      const show = {} as TVMazeShow;
      expect(extractShowType(show)).toBe('');
    });
  });

  // Test suite for extractShowLanguage
  describe('extractShowLanguage', () => {
    it('extracts language from embedded show structure', () => {
      const show = {
        _embedded: {
          show: {
            language: 'English'
          }
        }
      } as TVMazeShow;
      expect(extractShowLanguage(show)).toBe('English');
    });

    it('extracts language from direct show property', () => {
      const show = {
        show: {
          language: 'Spanish'
        }
      } as TVMazeShow;
      expect(extractShowLanguage(show)).toBe('Spanish');
    });

    it('extracts language from direct properties', () => {
      const show = {
        language: 'French'
      } as TVMazeShow;
      expect(extractShowLanguage(show)).toBe('French');
    });

    it('returns null when language is missing', () => {
      const show = {} as TVMazeShow;
      expect(extractShowLanguage(show)).toBe(null);
    });
  });

  // Test suite for extractShowGenres
  describe('extractShowGenres', () => {
    it('extracts genres from embedded show structure', () => {
      const show = {
        _embedded: {
          show: {
            genres: ['Drama', 'Thriller']
          }
        }
      } as TVMazeShow;
      expect(extractShowGenres(show)).toEqual(['Drama', 'Thriller']);
    });

    it('extracts genres from direct show property', () => {
      const show = {
        show: {
          genres: ['Comedy', 'Romance']
        }
      } as TVMazeShow;
      expect(extractShowGenres(show)).toEqual(['Comedy', 'Romance']);
    });

    it('extracts genres from direct properties', () => {
      const show = {
        genres: ['Action', 'Adventure']
      } as TVMazeShow;
      expect(extractShowGenres(show)).toEqual(['Action', 'Adventure']);
    });

    it('returns empty array when genres are missing', () => {
      const show = {} as TVMazeShow;
      expect(extractShowGenres(show)).toEqual([]);
    });

    it('handles non-array genres', () => {
      const show = {
        show: {
          genres: 'Drama' as unknown as string[]
        }
      } as TVMazeShow;
      expect(extractShowGenres(show)).toEqual([]);
    });
  });
});
