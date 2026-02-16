/**
 * TVMaze API schemas
 * @see https://www.tvmaze.com/api
 * 
 * Provides schemas and types for TVMaze API responses
 */
import { z } from 'zod';
import { numberFromMixed, nullableString } from './common.js';

/**
 * Network schema (for TV networks and web channels)
 */
export const networkSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.object({
    name: z.string(),
    code: z.string(),
    timezone: z.string()
  }).nullable()
});

/**
 * Base show schema for common properties
 */
export const baseShowSchema = z.object({
  id: z.number().optional().nullable(),
  url: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  language: nullableString.optional(),
  genres: z.array(z.string()).optional().nullable().default([]),
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

/**
 * Show details schema with network information
 */
export const showDetailsSchema = baseShowSchema.extend({
  network: networkSchema.nullable().optional(),
  webChannel: networkSchema.nullable().optional()
});

/**
 * Network schedule item schema (traditional TV networks)
 */
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

/**
 * Web schedule item schema (streaming services)
 */
export const webScheduleItemSchema = networkScheduleItemSchema.extend({
  show: z.undefined().optional(),
  _embedded: z.object({
    show: showDetailsSchema
  })
});

/**
 * Combined schedule item schema (union of network and web formats)
 */
export const scheduleItemSchema = z.union([
  networkScheduleItemSchema,
  webScheduleItemSchema
]);

/**
 * Type aliases for Zod schema inferred types
 */
export type NetworkScheduleItem = z.infer<typeof networkScheduleItemSchema>;
export type WebScheduleItem = z.infer<typeof webScheduleItemSchema>;
export type Network = z.infer<typeof networkSchema>;
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;

/**
 * TVMaze API interfaces
 * These are the raw data structures returned by the TVMaze API
 */

/**
 * TVMaze API show
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
  network: Network | null;
  webChannel: Network | null;
  dvdCountry: unknown;
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
 * TVMaze API schedule item
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
  image: unknown;
  summary: string | null;
  show?: TvMazeShow;
  _embedded?: { show: TvMazeShow };
}

/**
 * TVMaze API search result
 */
export interface TvMazeSearchResult {
  score: number;
  show: TvMazeShow;
}

/**
 * Helper function to format network name with country code if available
 * @param network Network or web channel object
 * @param webChannel Optional web channel object
 * @returns Formatted network name
 */
function formatNetworkName(
  network: z.infer<typeof networkSchema> | null | undefined,
  webChannel: z.infer<typeof networkSchema> | null | undefined
): string {
  let networkName = 'Unknown Network';
  
  // First try to use network
  if (network !== null && network !== undefined) {
    networkName = network.name;
    
    // Add country code if available
    if (network.country !== null) {
      networkName = `${networkName} (${network.country.code})`;
    }
  } 
  // If no network, try web channel
  else if (webChannel !== null && webChannel !== undefined) {
    networkName = webChannel.name;
    
    // Add country code if available
    if (webChannel.country !== null) {
      networkName = `${networkName} (${webChannel.country.code})`;
    }
  }
  
  return networkName;
}

/**
 * Transform schema for network schedule items to domain Show model
 */
export const networkScheduleToShowSchema = networkScheduleItemSchema.transform((item) => {
  // Extract show data with safe defaults
  const show = item.show;
  const id = typeof show.id === 'number' ? show.id : 0;
  const name = typeof show.name === 'string' && show.name.length > 0 ? show.name : 'Unknown Show';
  const type = typeof show.type === 'string' && show.type.length > 0 ? show.type : 'unknown';
  const language = 
      typeof show.language === 'string' && show.language.length > 0 
        ? show.language 
        : null;
  const genres = Array.isArray(show.genres) ? show.genres : [];
  const summary = typeof show.summary === 'string' && show.summary.length > 0 ? show.summary : null;
  
  // Extract episode data with safe defaults
  const airtime = typeof item.airtime === 'string' && item.airtime.length > 0 ? item.airtime : null;
  const season = typeof item.season === 'number' ? item.season : 0;
  const number = typeof item.number === 'number' ? item.number : 0;
  
  return {
    id,
    name,
    type,
    language,
    genres,
    network: formatNetworkName(show.network, show.webChannel),
    summary,
    airtime,
    season,
    number
  };
});

/**
 * Transform schema for web schedule items to domain Show model
 */
export const webScheduleToShowSchema = webScheduleItemSchema.transform((item) => {
  // Extract embedded show data with safe defaults
  const embedded = item._embedded;
  const show = embedded.show;
  const id = typeof show.id === 'number' ? show.id : 0;
  const name = typeof show.name === 'string' && show.name.length > 0 ? show.name : 'Unknown Show';
  const type = typeof show.type === 'string' && show.type.length > 0 ? show.type : 'unknown';
  const language = 
      typeof show.language === 'string' && show.language.length > 0 
        ? show.language 
        : null;
  const genres = Array.isArray(show.genres) ? show.genres : [];
  const summary = typeof show.summary === 'string' && show.summary.length > 0 ? show.summary : null;
  
  // Extract episode data with safe defaults
  const airtime = typeof item.airtime === 'string' && item.airtime.length > 0 ? item.airtime : null;
  const season = typeof item.season === 'number' ? item.season : 0;
  const number = typeof item.number === 'number' ? item.number : 0;
  
  return {
    id,
    name,
    type,
    language,
    genres,
    network: formatNetworkName(show.network, show.webChannel),
    summary,
    airtime,
    season,
    number
  };
});
