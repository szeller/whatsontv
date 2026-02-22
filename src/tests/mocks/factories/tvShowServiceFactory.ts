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
      // If we should throw an error, do so
      if (options.fetchError) {
        throw options.fetchError;
      }
      
      // Check for date-specific shows
      const hasDateOption = Boolean(showOptions.date);
      const hasDateMatches = Boolean(options.showsByDate);
      
      if (hasDateMatches && hasDateOption) {
        const date = showOptions.date ?? '';
        const dateShows = options.showsByDate?.[date];
        if (dateShows) {
          return dateShows;
        }
      }
      
      // Check for country-specific shows
      const hasCountryOption = Boolean(showOptions.country);
      const hasCountryMatches = Boolean(options.showsByCountry);
      
      if (hasCountryMatches && hasCountryOption) {
        const country = showOptions.country ?? '';
        const countryShows = options.showsByCountry?.[country];
        if (countryShows) {
          return countryShows;
        }
      }
      
      // Check for network-specific shows
      const hasNetworkOptions = Boolean(
        showOptions.networks && showOptions.networks.length > 0
      );
      const hasNetworkMatches = Boolean(options.showsByNetwork);
      
      if (hasNetworkMatches && hasNetworkOptions && showOptions.networks) {
        // Return shows for the first matching network
        for (const network of showOptions.networks) {
          if (!network) continue;
          const networkShows = options.showsByNetwork?.[network];
          if (networkShows) {
            return networkShows;
          }
        }
      }
      
      // Check for genre-specific shows
      const hasGenreOptions = Boolean(
        showOptions.genres && showOptions.genres.length > 0
      );
      const hasGenreMatches = Boolean(options.showsByGenre);
      
      if (hasGenreMatches && hasGenreOptions && showOptions.genres) {
        // Return shows for the first matching genre
        for (const genre of showOptions.genres) {
          if (!genre) continue;
          const genreShows = options.showsByGenre?.[genre];
          if (genreShows) {
            return genreShows;
          }
        }
      }
      
      // Check for language-specific shows
      const hasLanguageOptions = Boolean(
        showOptions.languages && showOptions.languages.length > 0
      );
      const hasLanguageMatches = Boolean(options.showsByLanguage);
      
      if (hasLanguageMatches && hasLanguageOptions && showOptions.languages) {
        // Return shows for the first matching language
        for (const language of showOptions.languages) {
          if (!language) continue;
          const languageShows = options.showsByLanguage?.[language];
          if (languageShows) {
            return languageShows;
          }
        }
      }
      
      // Return default shows if none of the specific criteria matched
      return options.defaultShows ?? [];
    })
  };
  
  // Apply any custom implementations
  if (options.implementation) {
    Object.entries(options.implementation).forEach(([key, value]) => {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockTvShowService as any)[key] = value;
    });
  }
  
  return mockTvShowService;
}
