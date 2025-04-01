/**
 * Show Fixture Helper Functions
 * 
 * Utilities for creating and manipulating show fixtures for testing
 */
import type { Show } from '../../../schemas/domain.js';

/**
 * Create a basic show object with default values
 * @returns A minimal valid Show object
 */
export function createBasicShow(): Show {
  return {
    id: 1,
    name: 'Test Show',
    type: 'Scripted',
    language: 'English',
    genres: ['Drama'],
    network: 'Test Network',
    summary: 'Test summary',
    airtime: '20:00',
    season: 1,
    number: 1
  };
}

/**
 * Create a show with custom properties by overriding defaults
 * @param overrides Properties to override in the basic show
 * @returns A customized Show object
 */
export function createShow(overrides: Partial<Show> = {}): Show {
  return {
    ...createBasicShow(),
    ...overrides
  };
}

/**
 * Create a show with a specific airtime
 * @param airtime The airtime to set
 * @returns A Show object with the specified airtime
 */
export function createShowWithAirtime(airtime: string | null): Show {
  return createShow({ airtime });
}

/**
 * Create a show with a specific network
 * @param network The network name
 * @returns A Show object with the specified network
 */
export function createShowWithNetwork(network: string): Show {
  return createShow({ network });
}

/**
 * Create a show with specific genres
 * @param genres Array of genre names
 * @returns A Show object with the specified genres
 */
export function createShowWithGenres(genres: string[]): Show {
  return createShow({ genres });
}

/**
 * Create a show with a specific language
 * @param language The language
 * @returns A Show object with the specified language
 */
export function createShowWithLanguage(language: string): Show {
  return createShow({ language });
}

/**
 * Create a show with specific episode information
 * @param season The season number
 * @param number The episode number
 * @returns A Show object with the specified episode info
 */
export function createShowWithEpisode(season: number, number: number): Show {
  return createShow({ season, number });
}

/**
 * Create a show with missing or null fields to test edge cases
 * @returns A Show object with minimal required fields
 */
export function createMinimalShow(): Show {
  return {
    id: 0,
    name: 'Minimal Show',
    type: '',
    language: null,
    genres: [],
    network: '',
    summary: null,
    airtime: null,
    season: 0,
    number: 0
  };
}

/**
 * Create an array of shows with sequential episode numbers
 * @param baseName Base name for all shows
 * @param count Number of episodes to create
 * @param season Season number
 * @param startNumber Starting episode number
 * @returns Array of shows with sequential episode numbers
 */
export function createEpisodeSequence(
  baseName: string,
  count: number,
  season: number,
  startNumber: number
): Show[] {
  return Array.from({ length: count }, (_, _index) => {
    return createShow({
      name: `${baseName}`,
      season,
      number: startNumber + _index
    });
  });
}

/**
 * Create an array of shows with different airtimes
 * @param count Number of shows to create
 * @returns Array of shows with different airtimes
 */
export function createShowsWithDifferentAirtimes(count: number): Show[] {
  return Array.from({ length: count }, (_, _index) => {
    // Create shows with times spread throughout the day
    const hour = Math.floor((24 / count) * _index);
    const minute = 0;
    const formattedHour = hour.toString().padStart(2, '0');
    const formattedMinute = minute.toString().padStart(2, '0');
    
    return createShow({
      name: `Show at ${formattedHour}:${formattedMinute}`,
      airtime: `${formattedHour}:${formattedMinute}`
    });
  });
}

/**
 * Create an array of shows with different networks
 * @param networks Array of network names
 * @returns Array of shows with different networks
 */
export function createShowsWithDifferentNetworks(networks: string[]): Show[] {
  return networks.map((network, _index) => {
    return createShow({
      name: `${network} Show`,
      network
    });
  });
}

/**
 * Create an array of shows with different types
 * @param types Array of show types
 * @returns Array of shows with different types
 */
export function createShowsWithDifferentTypes(types: string[]): Show[] {
  return types.map((type, _index) => {
    return createShow({
      name: `${type} Show`,
      type
    });
  });
}

/**
 * Create an array of shows with different genres
 * @param genreSets Array of genre arrays
 * @returns Array of shows with different genre combinations
 */
export function createShowsWithDifferentGenres(genreSets: string[][]): Show[] {
  return genreSets.map((genres, _index) => {
    return createShow({
      name: `${genres.join('/')} Show`,
      genres
    });
  });
}

/**
 * Create an array of shows with the given count
 * @param count Number of shows to create
 * @param customizer Optional function to customize each show
 * @returns Array of shows
 */
export function createShowArray(
  count: number,
  customizer?: (show: Show, _index: number) => void
): Show[] {
  return Array.from({ length: count }, (_, _index) => {
    const show = createShow();
    if (customizer) {
      customizer(show, _index);
    }
    return show;
  });
}

/**
 * Create an array of shows with sequential IDs
 * @param count Number of shows to create
 * @param startId Starting ID (default: 1)
 * @param customizer Optional function to customize each show
 * @returns Array of shows with sequential IDs
 */
export function createShowArrayWithSequentialIds(
  count: number,
  startId = 1,
  customizer?: (show: Show, _index: number) => void
): Show[] {
  return Array.from({ length: count }, (_, _index) => {
    const show = createShow();
    show.id = startId + _index;
    if (customizer) {
      customizer(show, _index);
    }
    return show;
  });
}

/**
 * Create an array of shows with different networks
 * @param networks Array of network names
 * @param customizer Optional function to customize each show
 * @returns Array of shows with different networks
 */
export function createShowArrayWithDifferentNetworks(
  networks: string[],
  customizer?: (show: Show, _index: number) => void
): Show[] {
  return networks.map((network, _index) => {
    const show = createShow();
    show.network = network;
    if (customizer) {
      customizer(show, _index);
    }
    return show;
  });
}
