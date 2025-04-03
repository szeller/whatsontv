import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { NetworkGroups, Show } from '../../../schemas/domain.js';
import { MockOptions } from './types.js';
import { jest } from '@jest/globals';

/**
 * Options for creating a mock formatter
 */
export interface FormatterOptions extends MockOptions<ShowFormatter> {
  /** Default formatted show string */
  defaultFormattedShow?: string;
  
  /** Default formatted timed show string */
  defaultFormattedTimedShow?: string;
  
  /** Default formatted untimed show string */
  defaultFormattedUntimedShow?: string;
  
  /** Default formatted multiple episodes array */
  defaultFormattedMultipleEpisodes?: string[];
  
  /** Default formatted network groups array */
  defaultFormattedNetworkGroups?: string[];
  
  /** Custom formatters for specific shows (by ID) */
  showFormatters?: Record<number, string>;
}

/**
 * Creates a mock show formatter for testing
 * @param options Options for configuring the mock
 * @returns A mock show formatter instance
 */
export function createMockFormatter(options: FormatterOptions = {}): jest.Mocked<ShowFormatter> {
  const mockFormatter: jest.Mocked<ShowFormatter> = {
    formatShow: jest.fn((show: Show) => {
      // If we have a custom formatter for this show ID, use it
      if (options.showFormatters && options.showFormatters[show.id]) {
        return options.showFormatters[show.id];
      }
      
      // Otherwise use the default or a generic string
      return options.defaultFormattedShow ?? `Show: ${show.name}`;
    }),
    
    formatTimedShow: jest.fn((show: Show) => {
      // If we have a custom formatter for this show ID, use it
      if (options.showFormatters && options.showFormatters[show.id]) {
        return options.showFormatters[show.id];
      }
      
      // Get the airtime or use a fallback
      const airtime = show.airtime ?? 'unknown time';
      
      // Otherwise use the default or a generic string
      return options.defaultFormattedTimedShow ?? `Timed Show: ${show.name} at ${airtime}`;
    }),
    
    formatUntimedShow: jest.fn((show: Show) => {
      // If we have a custom formatter for this show ID, use it
      if (options.showFormatters && options.showFormatters[show.id]) {
        return options.showFormatters[show.id];
      }
      
      // Otherwise use the default or a generic string
      return options.defaultFormattedUntimedShow ?? `Untimed Show: ${show.name}`;
    }),
    
    formatMultipleEpisodes: jest.fn((shows: Show[]) => {
      if (options.defaultFormattedMultipleEpisodes) {
        return [...options.defaultFormattedMultipleEpisodes];
      }
      
      // Generate a default array of formatted shows
      return shows.map(show => `Multiple Episodes: ${show.name}`);
    }),
    
    formatNetworkGroups: jest.fn((networkGroups: NetworkGroups, _timeSort?: boolean) => {
      if (options.defaultFormattedNetworkGroups) {
        return [...options.defaultFormattedNetworkGroups];
      }
      
      // Generate a default array of formatted network groups
      return Object.entries(networkGroups).map(
        ([network, shows]) => `Network: ${network} (${shows.length} shows)`
      );
    })
  };
  
  // Apply any custom implementations
  if (options.implementation) {
    Object.entries(options.implementation).forEach(([key, value]) => {
      // We need to cast here because we're dynamically setting properties
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (mockFormatter as any)[key] = value;
    });
  }
  
  return mockFormatter;
}
