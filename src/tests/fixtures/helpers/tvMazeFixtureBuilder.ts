/**
 * TVMaze API fixture builder
 * 
 * Provides builder patterns for creating TVMaze API test fixtures
 */
import type { 
  TvMazeShow, 
  TvMazeScheduleItem, 
  Network 
} from '../../../schemas/tvmaze.js';

/**
 * Builder for TVMaze Network objects
 */
export class NetworkBuilder {
  private id = 1;
  private name = 'Test Network';
  private country: Network['country'] = {
    name: 'United States',
    code: 'US',
    timezone: 'America/New_York'
  };

  /**
   * Set the network ID
   */
  withId(id: number): NetworkBuilder {
    this.id = id;
    return this;
  }

  /**
   * Set the network name
   */
  withName(name: string): NetworkBuilder {
    this.name = name;
    return this;
  }

  /**
   * Set the network country
   */
  withCountry(country: Network['country']): NetworkBuilder {
    this.country = country;
    return this;
  }

  /**
   * Create a web channel (no country)
   */
  asWebChannel(): NetworkBuilder {
    this.country = null;
    return this;
  }

  /**
   * Build the Network object
   */
  build(): Network {
    return {
      id: this.id,
      name: this.name,
      country: this.country
    };
  }
}

/**
 * Builder for TVMaze Show objects
 */
export class TvMazeShowBuilder {
  private id = 100;
  private readonly url = 'https://www.tvmaze.com/shows/100/test-show';
  private name = 'Test Show';
  private type = 'Scripted';
  private language: string | null = 'English';
  private genres: string[] = ['Drama'];
  private status = 'Running';
  private runtime: number | null = 60;
  private averageRuntime = 60;
  private premiered: string | null = '2020-01-01';
  private ended: string | null = null;
  private readonly officialSite: string | null = null;
  private schedule = {
    time: '20:00',
    days: ['Monday']
  };
  private rating: { average: number | null } = { average: 8.5 };
  private readonly weight = 95;
  private network: Network | null = new NetworkBuilder().build();
  private webChannel: Network | null = null;
  private readonly image: { medium: string; original: string } | null = null;
  private summary: string | null = '<p>Test show summary</p>';
  private readonly updated = 1609459200; // 2021-01-01
  private readonly _links = {
    self: { href: 'https://api.tvmaze.com/shows/100' }
  };

  /**
   * Set the show ID
   */
  withId(id: number): TvMazeShowBuilder {
    this.id = id;
    return this;
  }

  /**
   * Set the show name
   */
  withName(name: string): TvMazeShowBuilder {
    this.name = name;
    return this;
  }

  /**
   * Set the show type
   */
  withType(type: string): TvMazeShowBuilder {
    this.type = type;
    return this;
  }

  /**
   * Set the show language
   */
  withLanguage(language: string | null): TvMazeShowBuilder {
    this.language = language;
    return this;
  }

  /**
   * Set the show genres
   */
  withGenres(genres: string[]): TvMazeShowBuilder {
    this.genres = genres;
    return this;
  }

  /**
   * Set the show status
   */
  withStatus(status: string): TvMazeShowBuilder {
    this.status = status;
    return this;
  }

  /**
   * Set the show runtime and average runtime
   */
  withRuntime(runtime: number | null): TvMazeShowBuilder {
    this.runtime = runtime;
    // Always set averageRuntime to a number (0 if runtime is null)
    this.averageRuntime = runtime !== null ? runtime : 0;
    return this;
  }

  /**
   * Set the show average runtime directly
   */
  withAverageRuntime(averageRuntime: number): TvMazeShowBuilder {
    this.averageRuntime = averageRuntime;
    return this;
  }

  /**
   * Set the show premiere date
   */
  withPremiered(premiered: string | null): TvMazeShowBuilder {
    this.premiered = premiered;
    return this;
  }

  /**
   * Set the show end date
   */
  withEnded(ended: string | null): TvMazeShowBuilder {
    this.ended = ended;
    return this;
  }

  /**
   * Set the show schedule
   */
  withSchedule(time: string, days: string[]): TvMazeShowBuilder {
    this.schedule = { time, days };
    return this;
  }

  /**
   * Set the show rating
   */
  withRating(average: number | null): TvMazeShowBuilder {
    this.rating = { average: average !== null ? average : 0 };
    return this;
  }

  /**
   * Set the show network
   */
  withNetwork(network: Network | null): TvMazeShowBuilder {
    this.network = network;
    return this;
  }

  /**
   * Set the show web channel
   */
  withWebChannel(webChannel: Network | null): TvMazeShowBuilder {
    this.webChannel = webChannel;
    return this;
  }

  /**
   * Set the show summary
   */
  withSummary(summary: string | null): TvMazeShowBuilder {
    this.summary = summary;
    return this;
  }

  /**
   * Build the TVMaze Show object
   */
  build(): TvMazeShow {
    return {
      id: this.id,
      url: this.url,
      name: this.name,
      type: this.type,
      language: this.language,
      genres: this.genres,
      status: this.status,
      runtime: this.runtime,
      averageRuntime: this.averageRuntime,
      premiered: this.premiered,
      ended: this.ended,
      officialSite: this.officialSite,
      schedule: this.schedule,
      rating: this.rating,
      weight: this.weight,
      network: this.network,
      webChannel: this.webChannel,
      dvdCountry: null,
      externals: {
        tvrage: null,
        thetvdb: null,
        imdb: null
      },
      image: this.image,
      summary: this.summary,
      updated: this.updated,
      _links: this._links
    };
  }

  /**
   * Create a TVMaze show with custom options
   * @param options Custom options for the show
   * @returns A TVMaze show object
   */
  static createShow(options: Partial<TvMazeShow> = {}): TvMazeShow {
    const builder = new TvMazeShowBuilder();
    
    if (options.id !== undefined) builder.withId(options.id);
    if (options.name !== undefined) builder.withName(options.name);
    if (options.type !== undefined) builder.withType(options.type);
    if (options.language !== undefined) builder.withLanguage(options.language);
    if (options.genres !== undefined) builder.withGenres(options.genres);
    if (options.status !== undefined) builder.withStatus(options.status);
    
    // Handle runtime and averageRuntime
    if (options.runtime !== undefined) {
      // Use a type guard to handle null values
      if (options.runtime === null) {
        builder.withRuntime(null);
      } else {
        builder.withRuntime(options.runtime);
      }
    }
    
    if (options.averageRuntime !== undefined) {
      // Use a type guard to handle null values
      if (options.averageRuntime === null) {
        builder.withAverageRuntime(0); // Use 0 or another default value for null
      } else {
        builder.withAverageRuntime(options.averageRuntime);
      }
    }
    
    if (options.premiered !== undefined) builder.withPremiered(options.premiered);
    if (options.ended !== undefined) builder.withEnded(options.ended);
    if (options.network !== undefined) builder.withNetwork(options.network);
    if (options.webChannel !== undefined) builder.withWebChannel(options.webChannel);
    if (options.summary !== undefined) builder.withSummary(options.summary);
    
    return builder.build();
  }

  /**
   * Create multiple TVMaze shows with sequential IDs
   * @param count Number of shows to create
   * @param baseOptions Base options for all shows
   * @returns Array of TVMaze show objects
   */
  static createShows(count: number, baseOptions: Partial<TvMazeShow> = {}): TvMazeShow[] {
    return Array.from({ length: count }, (_, index) => {
      const id = baseOptions.id !== undefined ? baseOptions.id + index : 100 + index;
      const name = baseOptions.name !== undefined 
        ? `${baseOptions.name} ${index + 1}` 
        : `Test Show ${index + 1}`;
      
      return TvMazeShowBuilder.createShow({
        ...baseOptions,
        id,
        name
      });
    });
  }

  /**
   * Create a network show (with network, not webChannel)
   * @param options Custom options for the show
   * @returns A TVMaze show with network
   */
  static createNetworkShow(options: Partial<TvMazeShow> = {}): TvMazeShow {
    const network = options.network !== undefined && options.network !== null 
      ? options.network 
      : new NetworkBuilder().build();
    
    return TvMazeShowBuilder.createShow({
      ...options,
      network,
      webChannel: null
    });
  }

  /**
   * Create a web show (with webChannel, not network)
   * @param options Custom options for the show
   * @returns A TVMaze show with webChannel
   */
  static createWebShow(options: Partial<TvMazeShow> = {}): TvMazeShow {
    const webChannel = options.webChannel !== undefined && options.webChannel !== null 
      ? options.webChannel 
      : new NetworkBuilder().withName('Web Channel').asWebChannel().build();
    
    return TvMazeShowBuilder.createShow({
      ...options,
      network: null,
      webChannel
    });
  }
}

/**
 * Builder for TVMaze Schedule Item objects
 */
export class TvMazeScheduleItemBuilder {
  private id = 1000;
  private readonly url = 'https://www.tvmaze.com/episodes/1000/test-show-1x01-pilot';
  private name = 'Pilot';
  private season = 1;
  private number = 1;
  private type = 'regular';
  private airdate = '2020-01-01';
  private airtime: string | null = '20:00';
  private airstamp = '2020-01-01T20:00:00-05:00';
  private runtime: number | null = 60;
  private rating: { average: number | null } = { average: null };
  private readonly image = null;
  private summary: string | null = '<p>Episode summary</p>';
  private show: TvMazeShow = new TvMazeShowBuilder().build();

  /**
   * Set the episode ID
   */
  withId(id: number): TvMazeScheduleItemBuilder {
    this.id = id;
    return this;
  }

  /**
   * Set the episode name
   */
  withName(name: string): TvMazeScheduleItemBuilder {
    this.name = name;
    return this;
  }

  /**
   * Set the episode season
   */
  withSeason(season: number): TvMazeScheduleItemBuilder {
    this.season = season;
    return this;
  }

  /**
   * Set the episode number
   */
  withNumber(number: number): TvMazeScheduleItemBuilder {
    this.number = number;
    return this;
  }

  /**
   * Set the episode type
   */
  withType(type: string): TvMazeScheduleItemBuilder {
    this.type = type;
    return this;
  }

  /**
   * Set the episode air date
   */
  withAirdate(airdate: string): TvMazeScheduleItemBuilder {
    this.airdate = airdate;
    return this;
  }

  /**
   * Set the episode air time
   */
  withAirtime(airtime: string | null): TvMazeScheduleItemBuilder {
    this.airtime = airtime;
    return this;
  }

  /**
   * Set the episode air timestamp
   */
  withAirstamp(airstamp: string): TvMazeScheduleItemBuilder {
    this.airstamp = airstamp;
    return this;
  }

  /**
   * Set the episode runtime
   */
  withRuntime(runtime: number | null): TvMazeScheduleItemBuilder {
    this.runtime = runtime;
    return this;
  }

  /**
   * Set the episode summary
   */
  withSummary(summary: string | null): TvMazeScheduleItemBuilder {
    this.summary = summary;
    return this;
  }

  /**
   * Set the associated show
   */
  withShow(show: TvMazeShow): TvMazeScheduleItemBuilder {
    this.show = show;
    return this;
  }

  /**
   * Set the episode rating
   */
  withRating(average: number | null): TvMazeScheduleItemBuilder {
    this.rating = { average: average !== null ? average : 0 };
    return this;
  }

  /**
   * Build the TVMaze Schedule Item object
   */
  build(): TvMazeScheduleItem {
    return {
      id: this.id,
      url: this.url,
      name: this.name,
      season: this.season,
      number: this.number,
      type: this.type,
      airdate: this.airdate,
      airtime: this.airtime,
      airstamp: this.airstamp,
      runtime: this.runtime,
      rating: this.rating,
      image: this.image,
      summary: this.summary,
      show: this.show
    };
  }

  /**
   * Create a network schedule item
   */
  static createNetworkScheduleItem(options: {
    id?: number;
    name?: string;
    season?: number;
    number?: number;
    airdate?: string;
    airtime?: string;
    showId?: number;
    showName?: string;
    network?: Network;
  } = {}): TvMazeScheduleItem {
    const network = options.network !== undefined && options.network !== null 
      ? options.network 
      : new NetworkBuilder().build();
    const show = new TvMazeShowBuilder()
      .withId(options.showId !== undefined ? options.showId : 100)
      .withName(
        options.showName !== undefined && options.showName !== null 
          ? options.showName 
          : 'Test Show'
      )
      .withNetwork(network)
      .build();

    return new TvMazeScheduleItemBuilder()
      .withId(options.id !== undefined ? options.id : 1000)
      .withName(
        options.name !== undefined && options.name !== null 
          ? options.name 
          : 'Test Episode'
      )
      .withSeason(options.season !== undefined ? options.season : 1)
      .withNumber(options.number !== undefined ? options.number : 1)
      .withAirdate(
        options.airdate !== undefined && options.airdate !== null 
          ? options.airdate 
          : '2020-01-01'
      )
      .withAirtime(options.airtime !== undefined ? options.airtime : '20:00')
      .withShow(show)
      .build();
  }

  /**
   * Create a web schedule item
   */
  static createWebScheduleItem(options: {
    id?: number;
    name?: string;
    season?: number;
    number?: number;
    airdate?: string;
    airtime?: string;
    showId?: number;
    showName?: string;
    webChannel?: Network;
  } = {}): TvMazeScheduleItem {
    const webChannel = options.webChannel !== undefined && options.webChannel !== null 
      ? options.webChannel 
      : new NetworkBuilder().asWebChannel().build();
    const show = new TvMazeShowBuilder()
      .withId(options.showId !== undefined ? options.showId : 200)
      .withName(
        options.showName !== undefined && options.showName !== null 
          ? options.showName 
          : 'Test Web Show'
      )
      .withNetwork(null)
      .withWebChannel(webChannel)
      .build();

    return new TvMazeScheduleItemBuilder()
      .withId(options.id !== undefined ? options.id : 2000)
      .withName(
        options.name !== undefined && options.name !== null 
          ? options.name 
          : 'Test Web Episode'
      )
      .withSeason(options.season !== undefined ? options.season : 1)
      .withNumber(options.number !== undefined ? options.number : 1)
      .withAirdate(
        options.airdate !== undefined && options.airdate !== null 
          ? options.airdate 
          : '2020-01-01'
      )
      .withAirtime(options.airtime !== undefined ? options.airtime : '20:00')
      .withShow(show)
      .build();
  }

  /**
   * Create a batch of network schedule items
   */
  static createNetworkScheduleItems(count: number, baseOptions: {
    showId?: number;
    showName?: string;
    network?: Network;
    airdate?: string;
  } = {}): TvMazeScheduleItem[] {
    const items: TvMazeScheduleItem[] = [];
    const baseShowId = baseOptions.showId !== undefined ? baseOptions.showId : 100;
    
    for (let i = 0; i < count; i++) {
      const showName = baseOptions.showName !== undefined && baseOptions.showName !== null
        ? `${baseOptions.showName} ${i + 1}`
        : `Test Show ${i + 1}`;
        
      items.push(TvMazeScheduleItemBuilder.createNetworkScheduleItem({
        id: 1000 + i,
        name: `Episode ${i + 1}`,
        season: 1,
        number: i + 1,
        showId: baseShowId + i,
        showName,
        network: baseOptions.network,
        airdate: baseOptions.airdate
      }));
    }
    
    return items;
  }

  /**
   * Create a batch of web schedule items
   */
  static createWebScheduleItems(count: number, baseOptions: {
    showId?: number;
    showName?: string;
    webChannel?: Network;
    airdate?: string;
  } = {}): TvMazeScheduleItem[] {
    const items: TvMazeScheduleItem[] = [];
    const baseShowId = baseOptions.showId !== undefined ? baseOptions.showId : 200;
    
    for (let i = 0; i < count; i++) {
      const showName = baseOptions.showName !== undefined && baseOptions.showName !== null
        ? `${baseOptions.showName} ${i + 1}`
        : `Test Web Show ${i + 1}`;
        
      items.push(TvMazeScheduleItemBuilder.createWebScheduleItem({
        id: 2000 + i,
        name: `Web Episode ${i + 1}`,
        season: 1,
        number: i + 1,
        showId: baseShowId + i,
        showName,
        webChannel: baseOptions.webChannel,
        airdate: baseOptions.airdate
      }));
    }
    
    return items;
  }

  /**
   * Create a batch of network schedule items with specific options for each item
   * @param options Array of options for each schedule item
   * @returns Array of TVMaze schedule items
   */
  static createNetworkScheduleItemsWithOptions(
    options: Partial<{
      id: number;
      name: string;
      season: number;
      number: number;
      airdate: string;
      airtime: string;
      showId: number;
      showName: string;
      network: Network;
    }>[]
  ): TvMazeScheduleItem[] {
    return options.map(opt => TvMazeScheduleItemBuilder.createNetworkScheduleItem(opt));
  }

  /**
   * Create a batch of web schedule items with specific options for each item
   * @param options Array of options for each schedule item
   * @returns Array of TVMaze schedule items
   */
  static createWebScheduleItemsWithOptions(
    options: Partial<{
      id: number;
      name: string;
      season: number;
      number: number;
      airdate: string;
      airtime: string;
      showId: number;
      showName: string;
      webChannel: Network;
    }>[]
  ): TvMazeScheduleItem[] {
    return options.map(opt => TvMazeScheduleItemBuilder.createWebScheduleItem(opt));
  }

  /**
   * Create a mixed batch of network and web schedule items
   * @param networkCount Number of network schedule items
   * @param webCount Number of web schedule items
   * @param baseOptions Base options for all items
   * @returns Array of TVMaze schedule items (network items first, then web items)
   */
  static createMixedScheduleItems(
    networkCount: number,
    webCount: number,
    baseOptions: Partial<{
      airdate: string;
    }> = {}
  ): TvMazeScheduleItem[] {
    const networkItems = TvMazeScheduleItemBuilder.createNetworkScheduleItems(
      networkCount,
      {
        showId: 100,
        showName: 'Network Show',
        airdate: baseOptions.airdate
      }
    );
    
    const webItems = TvMazeScheduleItemBuilder.createWebScheduleItems(
      webCount,
      {
        showId: 200,
        showName: 'Web Show',
        airdate: baseOptions.airdate
      }
    );
    
    return [...networkItems, ...webItems];
  }
}
