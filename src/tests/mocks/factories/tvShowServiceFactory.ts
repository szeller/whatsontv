import type { TvShowService } from '../../../interfaces/tvShowService.js';
import type { Show } from '../../../schemas/domain.js';
import type { ShowOptions } from '../../../types/tvShowOptions.js';
import { MockOptions } from './types.js';
import { jest } from '@jest/globals';

/**
 * Options for creating a mock TV show service
 */
export interface TvShowServiceOptions extends MockOptions<TvShowService> {
  /** Default shows to return from fetchShows */
  defaultShows?: Show[];
  
  /** Shows to return for specific date strings */
  showsByDate?: Record<string, Show[]>;
  
  /** Shows to return for specific country codes */
  showsByCountry?: Record<string, Show[]>;
  
  /** Shows to return for specific network names */
  showsByNetwork?: Record<string, Show[]>;
  
  /** Shows to return for specific genre names */
  showsByGenre?: Record<string, Show[]>;
  
  /** Shows to return for specific language names */
  showsByLanguage?: Record<string, Show[]>;
  
  /** Error to throw when fetchShows is called */
  fetchError?: Error;
}

/**
 * Creates a mock TV show service for testing
 * @param options Options for configuring the mock
 * @returns A mock TV show service instance
 */
export function createMockTvShowService(
  options: TvShowServiceOptions = {}
): jest.Mocked<TvShowService> {
  const mockTvShowService: jest.Mocked<TvShowService> = {
    // eslint-disable-next-line @typescript-eslint/require-await
    fetchShows: jest.fn(async (showOptions: ShowOptions): Promise<Show[]> => {
      if (options.fetchError) {
        throw options.fetchError;
      }

      return resolveShows(showOptions, options);
    })
  };

  if (options.implementation) {
    for (const [key, value] of Object.entries(options.implementation)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockTvShowService as any)[key] = value;
    }
  }

  return mockTvShowService;
}

/** Look up a single string key in a shows map */
function lookupByKey(
  key: string | undefined, map: Record<string, Show[]> | undefined
): Show[] | undefined {
  if (key === undefined || key === '' || map === undefined) {
    return undefined;
  }
  return map[key];
}

/** Find the first matching entry from an array key in a shows map */
function lookupByArray(
  keys: string[] | undefined, map: Record<string, Show[]> | undefined
): Show[] | undefined {
  if (keys === undefined || keys.length === 0 || map === undefined) {
    return undefined;
  }
  for (const key of keys) {
    if (key === '') continue;
    if (key in map) {
      return map[key];
    }
  }
  return undefined;
}

/** Resolve shows from options based on the show options criteria */
function resolveShows(
  showOptions: ShowOptions, options: TvShowServiceOptions
): Show[] {
  return lookupByKey(showOptions.date, options.showsByDate)
    ?? lookupByKey(showOptions.country, options.showsByCountry)
    ?? lookupByArray(showOptions.networks, options.showsByNetwork)
    ?? lookupByArray(showOptions.genres, options.showsByGenre)
    ?? lookupByArray(showOptions.languages, options.showsByLanguage)
    ?? options.defaultShows
    ?? [];
}
