/**
 * Type definitions for the TVMaze API
 * @see https://www.tvmaze.com/api
 * 
 * It provides a clear separation between API responses and our internal domain model.
 */
import { z } from 'zod';

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
 * Type Definitions (derived from Zod schemas)
 */

// API Response Types
export type NetworkScheduleItem = z.infer<typeof networkScheduleItemSchema>;
export type WebScheduleItem = z.infer<typeof webScheduleItemSchema>;
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;
export type ShowDetails = z.infer<typeof showDetailsSchema>;
export type Network = z.infer<typeof networkSchema>;
