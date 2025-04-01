/**
 * Show Fixture Builder
 * 
 * Provides utilities for creating and customizing show fixtures
 * that complement the existing JSON fixtures.
 */
import type { Show } from '../../../schemas/domain.js';
import { loadValidatedArrayFixture } from '../../helpers/fixtureHelper.js';
import { showSchema } from '../../../schemas/domain.js';

/**
 * Base show template with minimal required fields
 */
const baseShow: Show = {
  id: 999,
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

/**
 * Show builder for creating customized show instances
 */
export class ShowBuilder {
  private show: Show;

  /**
   * Create a new show builder
   * @param baseTemplate Optional base show to start with
   */
  constructor(baseTemplate: Partial<Show> = {}) {
    this.show = { ...baseShow, ...baseTemplate };
  }

  /**
   * Set the show ID
   * @param id Show ID
   */
  withId(id: number): ShowBuilder {
    this.show.id = id;
    return this;
  }

  /**
   * Set the show name
   * @param name Show name
   */
  withName(name: string): ShowBuilder {
    this.show.name = name;
    return this;
  }

  /**
   * Set the show type
   * @param type Show type
   */
  withType(type: string): ShowBuilder {
    this.show.type = type;
    return this;
  }

  /**
   * Set the show language
   * @param language Show language
   */
  withLanguage(language: string | null): ShowBuilder {
    this.show.language = language;
    return this;
  }

  /**
   * Set the show genres
   * @param genres Show genres
   */
  withGenres(genres: string[]): ShowBuilder {
    this.show.genres = genres;
    return this;
  }

  /**
   * Set the show network
   * @param network Show network
   */
  withNetwork(network: string): ShowBuilder {
    this.show.network = network;
    return this;
  }

  /**
   * Set the show summary
   * @param summary Show summary
   */
  withSummary(summary: string | null): ShowBuilder {
    this.show.summary = summary;
    return this;
  }

  /**
   * Set the show airtime
   * @param airtime Show airtime
   */
  withAirtime(airtime: string | null): ShowBuilder {
    this.show.airtime = airtime;
    return this;
  }

  /**
   * Set the show episode information
   * @param season Season number
   * @param number Episode number
   */
  withEpisode(season: number, number: number): ShowBuilder {
    this.show.season = season;
    this.show.number = number;
    return this;
  }

  /**
   * Build the final show object
   * @returns The constructed Show object
   */
  build(): Show {
    return { ...this.show };
  }

  /**
   * Create a minimal show with only required fields
   * @param options Optional overrides for the minimal show
   * @returns A minimal show object with only required fields
   */
  static createMinimalShow(options: Partial<Show> = {}): Show {
    const defaults = {
      id: 1,
      name: 'Minimal Show',
      type: '',
      language: null,
      genres: [] as string[],
      network: '',
      summary: null,
      airtime: null,
      season: 1,
      number: 1
    };

    return { ...defaults, ...options };
  }

  /**
   * Create a test show with standard properties for testing
   * @param options Optional overrides for the test show
   * @returns A standard test show with common properties
   */
  static createTestShow(options: Partial<Show> = {}): Show {
    const defaults = {
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

    return { ...defaults, ...options };
  }

  /**
   * Create a minimal show with only required fields
   * @returns A minimal Show object
   */
  static minimal(): Show {
    return new ShowBuilder({
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
    }).build();
  }

  /**
   * Create a show with no airtime
   * @returns A Show object with null airtime
   */
  static withoutAirtime(): Show {
    return new ShowBuilder()
      .withAirtime(null)
      .build();
  }

  /**
   * Create a collection of shows with sequential episode numbers
   * @param count Number of episodes to create
   * @param baseName Base name for all shows
   * @param season Season number
   * @param startNumber Starting episode number
   * @returns Array of shows with sequential episode numbers
   */
  static episodeSequence(
    count: number,
    baseName = 'Episode Show',
    season = 1,
    startNumber = 1
  ): Show[] {
    return Array.from({ length: count }, (_, index) => {
      return new ShowBuilder()
        .withName(baseName)
        .withEpisode(season, startNumber + index)
        .build();
    });
  }

  /**
   * Create a collection of shows with different airtimes
   * @param count Number of shows to create
   * @param customAirtimes Optional array of specific airtimes to use
   * @returns Array of shows with different airtimes
   */
  static withDifferentAirtimes(count: number, customAirtimes?: string[]): Show[] {
    if (customAirtimes && customAirtimes.length >= count) {
      return Array.from({ length: count }, (_, index) => {
        return new ShowBuilder()
          .withId(4000 + index)
          .withName(`Show at ${customAirtimes[index]}`)
          .withAirtime(customAirtimes[index])
          .build();
      });
    }

    return Array.from({ length: count }, (_, index) => {
      // Create shows with times spread throughout the day
      const hour = Math.floor((24 / count) * index);
      const minute = 0;
      const formattedHour = hour.toString().padStart(2, '0');
      const formattedMinute = minute.toString().padStart(2, '0');
      
      return new ShowBuilder()
        .withId(4000 + index)
        .withName(`Show at ${formattedHour}:${formattedMinute}`)
        .withAirtime(`${formattedHour}:${formattedMinute}`)
        .build();
    });
  }

  /**
   * Create a collection of shows with specific airtimes
   * @param airtimes Array of airtimes to use
   * @returns Array of shows with the specified airtimes
   */
  static withSpecificAirtimes(airtimes: (string | null)[]): Show[] {
    return airtimes.map((airtime, index) => {
      const name = airtime !== null && airtime !== '' 
        ? `Show at ${airtime}` 
        : 'Show with no airtime';
        
      return new ShowBuilder()
        .withId(4500 + index)
        .withName(name)
        .withAirtime(airtime)
        .build();
    });
  }

  /**
   * Create a collection of shows with different names but same other properties
   * @param names Array of show names
   * @returns Array of shows with different names
   */
  static withDifferentNames(names: string[]): Show[] {
    return names.map((name, index) => {
      return new ShowBuilder()
        .withId(5000 + index)
        .withName(name)
        .build();
    });
  }

  /**
   * Create episodes for a specific show across multiple seasons
   * @param showName The name of the show
   * @param seasonEpisodes Map of season numbers to episode counts
   * @returns Array of episodes for the show
   */
  static createEpisodeSequence(season: number, episodeNumbers: number[]): Show[] {
    return episodeNumbers.map((episodeNumber, index) => {
      return new ShowBuilder()
        .withId(6000 + index)
        .withName(`S${season}E${episodeNumber}`)
        .withEpisode(season, episodeNumber)
        .build();
    });
  }

  /**
   * Create a range of episodes for a specific season
   * @param season Season number
   * @param startEpisode Starting episode number
   * @param endEpisode Ending episode number (inclusive)
   * @returns Array of episodes in the range
   */
  static createEpisodeRange(season: number, startEpisode: number, endEpisode: number): Show[] {
    const episodeNumbers = Array.from(
      { length: endEpisode - startEpisode + 1 },
      (_, i) => startEpisode + i
    );
    return ShowBuilder.createEpisodeSequence(season, episodeNumbers);
  }

  /**
   * Create episodes across multiple seasons
   * @param seasonEpisodes Map of season numbers to episode counts or arrays
   * @returns Array of episodes across multiple seasons
   */
  static createMultiSeasonEpisodes(
    seasonEpisodes: Record<number, number | number[]>
  ): Show[] {
    const episodes: Show[] = [];
    
    Object.entries(seasonEpisodes).forEach(([seasonStr, episodeInfo]) => {
      const season = parseInt(seasonStr, 10);
      
      if (typeof episodeInfo === 'number') {
        // Create sequential episodes from 1 to episodeInfo
        episodes.push(...ShowBuilder.createEpisodeRange(season, 1, episodeInfo));
      } else if (Array.isArray(episodeInfo)) {
        // Create episodes with specific episode numbers
        episodes.push(...ShowBuilder.createEpisodeSequence(season, episodeInfo));
      }
    });
    
    return episodes;
  }
}

/**
 * Fixture collection utilities for working with show fixtures
 */
export class ShowFixtures {
  /**
   * Load network shows from JSON fixture
   * @returns Array of network shows
   */
  static getNetworkShows(): Show[] {
    return loadValidatedArrayFixture(showSchema, 'domain/network-shows.json');
  }

  /**
   * Load streaming shows from JSON fixture
   * @returns Array of streaming shows
   */
  static getStreamingShows(): Show[] {
    return loadValidatedArrayFixture(showSchema, 'domain/streaming-shows.json');
  }

  /**
   * Load cable shows from JSON fixture
   * @returns Array of cable shows
   */
  static getCableShows(): Show[] {
    return loadValidatedArrayFixture(showSchema, 'domain/cable-shows.json');
  }

  /**
   * Get all sample shows from fixtures
   * @returns Combined array of all show types
   */
  static getAllShows(): Show[] {
    return [
      ...this.getNetworkShows(),
      ...this.getStreamingShows(),
      ...this.getCableShows()
    ];
  }

  /**
   * Create a collection of shows with different types
   * @param types Array of show types
   * @returns Array of shows with different types
   */
  static withDifferentTypes(types: string[]): Show[] {
    return types.map((type, index) => {
      return new ShowBuilder()
        .withId(1000 + index)
        .withName(`${type} Show`)
        .withType(type)
        .build();
    });
  }

  /**
   * Create a collection of shows with different networks
   * @param networks Array of network names
   * @returns Array of shows with different networks
   */
  static withDifferentNetworks(networks: string[]): Show[] {
    return networks.map((network, index) => {
      return new ShowBuilder()
        .withId(2000 + index)
        .withName(`${network} Show`)
        .withNetwork(network)
        .build();
    });
  }

  /**
   * Create a collection of shows with different genres
   * @param genreSets Array of genre arrays
   * @returns Array of shows with different genre combinations
   */
  static withDifferentGenres(genreSets: string[][]): Show[] {
    return genreSets.map((genres, index) => {
      return new ShowBuilder()
        .withId(3000 + index)
        .withName(`${genres.join('/')} Show`)
        .withGenres(genres)
        .build();
    });
  }

  /**
   * Create a collection of shows with different languages
   * @param languages Array of languages
   * @returns Array of shows with different languages
   */
  static withDifferentLanguages(languages: (string | null)[]): Show[] {
    return languages.map((language, index) => {
      const name = language !== null && language !== '' 
        ? `${language} Show` 
        : 'Unknown Language Show';
        
      return new ShowBuilder()
        .withId(7000 + index)
        .withName(name)
        .withLanguage(language)
        .build();
    });
  }

  /**
   * Create a collection of shows with specific properties for filtering tests
   * @param options Configuration options for the test fixtures
   * @returns Array of shows with the specified properties
   */
  static forFilteringTests(options: {
    types?: string[];
    networks?: string[];
    genres?: string[][];
    languages?: string[];
  }): Show[] {
    const shows: Show[] = [];
    
    if (options.types && options.types.length > 0) {
      shows.push(...this.withDifferentTypes(options.types));
    }
    
    if (options.networks && options.networks.length > 0) {
      shows.push(...this.withDifferentNetworks(options.networks));
    }
    
    if (options.genres && options.genres.length > 0) {
      shows.push(...this.withDifferentGenres(options.genres));
    }
    
    if (options.languages && options.languages.length > 0) {
      shows.push(...this.withDifferentLanguages(options.languages));
    }
    
    return shows;
  }

  /**
   * Creates a minimal show with only the required fields
   * @param options Optional overrides for the minimal show
   * @returns A minimal show object with only required fields
   */
  static createMinimalShow(options: Partial<Show> = {}): Show {
    const defaults = {
      id: 1,
      name: 'Minimal Show',
      type: '',
      language: null,
      genres: [] as string[],
      network: '',
      summary: null,
      airtime: null,
      season: 1,
      number: 1
    };

    return { ...defaults, ...options };
  }

  /**
   * Creates a test show with standard properties for testing
   * @param options Optional overrides for the test show
   * @returns A standard test show with common properties
   */
  static createTestShow(options: Partial<Show> = {}): Show {
    const defaults = {
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

    return { ...defaults, ...options };
  }
}
