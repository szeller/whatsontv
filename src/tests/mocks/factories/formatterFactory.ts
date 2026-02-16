import type { TextShowFormatter } from '../../../interfaces/showFormatter.js';
import type { NetworkGroups, Show } from '../../../schemas/domain.js';
import { MockOptions } from './types.js';
import { jest } from '@jest/globals';

/**
 * Options for creating a mock formatter
 */
export interface FormatterOptions extends MockOptions<TextShowFormatter> {
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
 * Creates a mock text show formatter for testing
 * @param options Options for configuring the mock
 * @returns A mock text show formatter instance
 */
export function createMockFormatter(
  options: FormatterOptions = {}
): jest.Mocked<TextShowFormatter> {
  const mockFormatter: jest.Mocked<TextShowFormatter> = {
    formatTimedShow: jest.fn((show: Show) => {
      // If we have a custom formatter for this show ID, use it
      const custom = options.showFormatters?.[show.id];
      if (custom !== undefined && custom !== '') {
        return custom;
      }

      // Get the airtime or use a fallback
      const airtime = show.airtime ?? 'unknown time';

      // Otherwise use the default or a generic string
      return options.defaultFormattedTimedShow ?? `Timed Show: ${show.name} at ${airtime}`;
    }),

    formatUntimedShow: jest.fn((show: Show) => {
      // If we have a custom formatter for this show ID, use it
      const custom = options.showFormatters?.[show.id];
      if (custom !== undefined && custom !== '') {
        return custom;
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
    
    formatNetwork: jest.fn((network: string, shows: Show[]) => {
      // Generate a default array for a network and its shows
      return [
        `Network: ${network}`,
        ...shows.map(show => `  Show: ${show.name}`)
      ];
    }),
    
    formatNetworkGroups: jest.fn((networkGroups: NetworkGroups) => {
      if (options.defaultFormattedNetworkGroups) {
        return [...options.defaultFormattedNetworkGroups];
      }
      
      // Generate a default array of formatted network groups
      const result: string[] = [];
      
      for (const [network, shows] of Object.entries(networkGroups)) {
        result.push(`Network: ${network} (${shows.length} shows)`);
        shows.forEach(show => {
          result.push(`  Show: ${show.name}`);
        });
      }
      
      return result;
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
