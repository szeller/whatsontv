/**
 * Type definitions for the TVMaze API
 * @see https://www.tvmaze.com/api
 * 
 * It provides a clear separation between API responses and our internal domain model.
 */
import { z } from 'zod';
// Only import the Show type since that's what we use in this file
import type { Show } from './tvShowModel.js';
import { getStringOrDefault } from '../utils/stringUtils.js';

// Helper for converting string|number to number
const numberFromMixed = z.union([
  z.number(),
  z.string().transform(val => parseInt(val, 10) || 0),
  z.null().transform(() => 0),
  z.undefined().transform(() => 0)
]);

// Helper for handling nullable strings
const nullableString = z.union([
  z.string(),
  z.null(),
  z.undefined().transform(() => null)
]);

/**
 * API Response Schemas
 */

// Base show schema for common properties
const baseShowSchema = z.object({
  id: z.number().optional(),
  url: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  language: nullableString.optional(),
  genres: z.array(z.string()).optional().default([]),
  status: z.string().optional(),
  runtime: z.number().nullable().optional(),
  premiered: z.string().optional(),
  ended: z.string().nullable().optional(),
  officialSite: z.string().nullable().optional(),
  schedule: z.object({
    time: z.string().optional(),
    days: z.array(z.string()).optional()
  }).optional(),
  rating: z.object({
    average: z.number().nullable().optional()
  }).optional(),
  weight: z.number().optional(),
  summary: z.string().nullable().optional(),
  updated: z.number().optional()
});

// Network schema (simplified)
export const networkSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.object({
    name: z.string(),
    code: z.string(),
    timezone: z.string()
  }).nullable()
});

// Show details schema
export const showDetailsSchema = baseShowSchema.extend({
  network: networkSchema.nullable().optional(),
  webChannel: networkSchema.nullable().optional()
});

// Network schedule item schema
export const networkScheduleItemSchema = z.object({
  id: z.number(),
  url: z.string().optional(),
  name: z.string().optional(),
  season: numberFromMixed.optional(),
  number: numberFromMixed.optional(),
  type: z.string().optional(),
  airdate: z.string().optional(),
  airtime: nullableString.default(''),
  airstamp: z.string().optional(),
  runtime: z.number().nullable().optional(),
  rating: z.object({
    average: z.number().nullable().optional()
  }).optional(),
  summary: z.string().nullable().optional(),
  show: showDetailsSchema
});

// Web schedule item schema (streaming services)
export const webScheduleItemSchema = networkScheduleItemSchema.extend({
  show: z.undefined().optional(),
  _embedded: z.object({
    show: showDetailsSchema
  })
});

// Combined schedule item schema (union instead of discriminated union)
export const scheduleItemSchema = z.union([
  // Network schedule items have a direct 'show' property
  networkScheduleItemSchema,
  // Web schedule items have show nested in _embedded.show
  webScheduleItemSchema
]);

/**
 * TVMaze API model
 * Contains types and transformation functions for the TVMaze API
 */

/**
 * TVMaze API schedule item
 * This is the raw data structure returned by the TVMaze API schedule endpoint
 */
export interface TvMazeScheduleItem {
  id: number;
  url: string;
  name: string;
  season: number | string;
  number: number | string;
  type: string;
  airdate: string;
  airtime: string | null;
  airstamp: string;
  runtime: number | null;
  rating: { average: number | null };
  image: unknown | null;
  summary: string | null;
  show?: TvMazeShow; // For network schedule
  _embedded?: { show: TvMazeShow }; // For web schedule
}

/**
 * TVMaze API show
 * This is the raw data structure for a show returned by the TVMaze API
 */
export interface TvMazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  status: string;
  runtime: number | null;
  averageRuntime: number | null;
  premiered: string | null;
  ended: string | null;
  officialSite: string | null;
  schedule: {
    time: string;
    days: string[];
  };
  rating: { average: number | null };
  weight: number;
  network: {
    id: number;
    name: string;
    country: {
      name: string;
      code: string;
      timezone: string;
    } | null;
  } | null;
  webChannel: {
    id: number;
    name: string;
    country: {
      name: string;
      code: string;
      timezone: string;
    } | null;
  } | null;
  dvdCountry: unknown | null;
  externals: {
    tvrage: number | null;
    thetvdb: number | null;
    imdb: string | null;
  };
  image: {
    medium: string;
    original: string;
  } | null;
  summary: string | null;
  updated: number;
  _links: {
    self: { href: string };
    previousepisode?: { href: string };
    nextepisode?: { href: string };
  };
}

/**
 * TVMaze API search result
 * This is the raw data structure returned by the TVMaze API search endpoint
 */
export interface TvMazeSearchResult {
  score: number;
  show: TvMazeShow;
}

/**
 * TVMaze API episode
 * This is the raw data structure for an episode returned by the TVMaze API
 */
export interface TvMazeEpisode {
  id: number;
  url: string;
  name: string;
  season: number;
  number: number;
  type: string;
  airdate: string;
  airtime: string;
  airstamp: string;
  runtime: number;
  rating: { average: number | null };
  image: {
    medium: string;
    original: string;
  } | null;
  summary: string | null;
  _links: {
    self: { href: string };
  };
}

/**
 * TVMaze API person
 * This is the raw data structure for a person returned by the TVMaze API
 */
export interface TvMazePerson {
  id: number;
  url: string;
  name: string;
  country: {
    name: string;
    code: string;
    timezone: string;
  } | null;
  birthday: string | null;
  deathday: string | null;
  gender: string | null;
  image: {
    medium: string;
    original: string;
  } | null;
  updated: number;
  _links: {
    self: { href: string };
  };
}

/**
 * TVMaze API cast
 * This is the raw data structure for cast returned by the TVMaze API
 */
export interface TvMazeCast {
  person: TvMazePerson;
  character: {
    id: number;
    url: string;
    name: string;
    image: {
      medium: string;
      original: string;
    } | null;
    _links: {
      self: { href: string };
    };
  };
  self: boolean;
  voice: boolean;
}

/**
 * Check if an item is from the web schedule endpoint
 * @param item The schedule item to check
 * @returns True if the item is from the web schedule endpoint
 */
export function isWebScheduleItem(item: unknown): boolean {
  if (item === null || item === undefined || typeof item !== 'object') {
    return false;
  }
  
  const itemObj = item as Record<string, unknown>;
  return itemObj._embedded !== undefined && 
         itemObj._embedded !== null && 
         typeof itemObj._embedded === 'object';
}

/**
 * Transform a single TVMaze schedule item to our domain model
 * This function handles both network shows (/schedule endpoint) and
 * streaming shows (/schedule/web endpoint) based on their structure.
 * 
 * @param item TVMaze schedule item (either network or streaming format)
 * @returns Show object or null if transformation fails
 */
export function transformScheduleItem(item: unknown): Show | null {
  if (item === null || item === undefined || typeof item !== 'object') {
    return null;
  }

  try {
    // Cast item to a record to access properties
    const itemObj = item as Record<string, unknown>;
    
    // Extract show data based on the structure
    let showData: unknown;
    
    // Check if this is a web/streaming item (has _embedded.show)
    if (isWebScheduleItem(item)) {
      const embedded = itemObj._embedded as Record<string, unknown>;
      if (embedded?.show !== undefined && embedded?.show !== null) {
        showData = embedded.show;
      }
    }
    
    // If not found in _embedded.show, check if it's a network item (has direct show property)
    if (showData === undefined && itemObj.show !== undefined && itemObj.show !== null) {
      showData = itemObj.show;
    }
    
    // If we couldn't find show data, return null
    if (showData === undefined || showData === null || typeof showData !== 'object') {
      return null;
    }

    // Extract show fields
    const show = showData as Record<string, unknown>;

    // Extract episode data from the item (for airtime, season, number)
    const episode = item as {
      airtime?: string | null;
      season?: number | string;
      number?: number | string;
    };

    // Convert season/number to numbers regardless of input type
    let seasonNum = 0;
    if (typeof episode.season === 'string') {
      const trimmedSeason = getStringOrDefault(episode.season, '');
      if (trimmedSeason) {
        seasonNum = parseInt(trimmedSeason, 10);
        if (isNaN(seasonNum)) {
          seasonNum = 0;
        }
      }
    } else if (typeof episode.season === 'number') {
      seasonNum = episode.season;
    }
    
    let episodeNum = 0;
    if (typeof episode.number === 'string') {
      const trimmedNumber = getStringOrDefault(episode.number, '');
      if (trimmedNumber) {
        episodeNum = parseInt(trimmedNumber, 10);
        if (isNaN(episodeNum)) {
          episodeNum = 0;
        }
      }
    } else if (typeof episode.number === 'number') {
      episodeNum = episode.number;
    }

    // Get show properties
    const name = typeof show.name === 'string' ? show.name : 'Unknown Show';
    const type = typeof show.type === 'string' ? show.type : 'unknown';
    const language = show.language !== undefined ? show.language as string | null : null;
    const genres = Array.isArray(show.genres) ? show.genres as string[] : [];
    const summary = show.summary !== undefined ? show.summary as string | null : null;
    const id = typeof show.id === 'number' ? show.id : 0;

    // Get network information
    let networkName = 'Unknown Network';
    
    // Check for network property
    const network = show.network;
    const webChannel = show.webChannel;
    
    if (network !== null && 
        network !== undefined && 
        typeof network === 'object') {
      // It's a network show
      const networkObj = network as Record<string, unknown>;
      if (networkObj.name !== undefined && 
          networkObj.name !== null && 
          typeof networkObj.name === 'string') {
        networkName = networkObj.name;
        
        // Append country code if available
        if (networkObj.country !== undefined && 
            networkObj.country !== null && 
            typeof networkObj.country === 'object') {
          const countryObj = networkObj.country as Record<string, unknown>;
          if (countryObj.code !== undefined && 
              countryObj.code !== null && 
              typeof countryObj.code === 'string') {
            networkName += ` (${countryObj.code})`;
          }
        }
      }
    } else if (webChannel !== null && 
              webChannel !== undefined && 
              typeof webChannel === 'object') {
      // It's a streaming show
      const webChannelObj = webChannel as Record<string, unknown>;
      if (webChannelObj.name !== undefined && 
          webChannelObj.name !== null && 
          typeof webChannelObj.name === 'string') {
        networkName = webChannelObj.name;
      }
    }

    return {
      id,
      name,
      type,
      language,
      genres,
      network: networkName,
      summary,
      airtime: episode.airtime ?? null,
      season: seasonNum,
      number: episodeNum
    };
  } catch (error) {
    // Only log errors in production environments
    if (process.env.NODE_ENV === 'production') {
      console.error('Error transforming schedule item:', error);
    }
    return null;
  }
}

/**
 * Type Definitions (derived from Zod schemas)
 */

// API Response Types
export type NetworkScheduleItem = z.infer<typeof networkScheduleItemSchema>;
export type WebScheduleItem = z.infer<typeof webScheduleItemSchema>;
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
export type ShowDetails = z.infer<typeof showDetailsSchema>;
export type Network = z.infer<typeof networkSchema>;

/**
 * Transformation Functions
 */

/**
 * Transform TVMaze API schedule data into our domain model
 * @param data Raw TVMaze API schedule data
 * @returns Array of transformed Show objects
 */
export function transformSchedule(data: unknown[]): Show[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => transformScheduleItem(item))
    .filter((show): show is Show => show !== null);
}

/**
 * Domain Model Types
 */

// Our simplified domain model for a show
export const showSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string().default('unknown'),
  language: nullableString.default(null),
  genres: z.array(z.string()).default([]),
  network: z.string(),
  summary: nullableString.default(null),
  airtime: nullableString.default(null),
  season: z.number().default(0),
  number: z.number().default(0)
});

// Episode schema for our domain model
export const episodeSchema = z.object({
  id: z.number(),
  name: z.string(),
  season: z.number(),
  number: z.number(),
  airtime: nullableString,
  airdate: z.string().optional(),
  runtime: z.number().optional(),
  summary: z.string().nullable().optional(),
  type: z.string().optional()
});
