/**
 * Type definitions for the TVMaze API
 * @see https://www.tvmaze.com/api
 * 
 * It provides a clear separation between API responses and our internal domain model.
 */
import { z } from 'zod';
// Only import the Show type since that's what we use in this file
import { Show } from './tvShowModel.js';

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
 * Determines if an item is a network schedule item or a web schedule item
 * @param item The item to check
 * @returns True if it's a web schedule item, false if it's a network schedule item
 */
function isWebScheduleItem(item: unknown): boolean {
  // Check if it has _embedded.show structure (streaming) vs direct show property (network)
  if (typeof item !== 'object' || item === null) {
    return false;
  }
  
  const obj = item as Record<string, unknown>;
  
  // If it has a direct show property, it's a network item
  if ('show' in obj && obj.show !== null && typeof obj.show === 'object') {
    return false;
  }
  
  // If it has _embedded.show, it's a web item
  if ('_embedded' in obj && 
      obj._embedded !== null && 
      typeof obj._embedded === 'object') {
    const embedded = obj._embedded as Record<string, unknown>;
    return 'show' in embedded && embedded.show !== null;
  }
  
  // Default to network item if we can't determine
  return false;
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
  channel: z.string(),
  isStreaming: z.boolean().default(false),
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
 * Transform a TVMaze schedule item to our domain model
 * @param item TVMaze schedule item
 * @returns Show object
 */
export function transformScheduleItem(item: unknown): Show {
  try {
    // Determine if it's a web schedule item or network schedule item
    if (isWebScheduleItem(item)) {
      return transformWebScheduleItem(item);
    }
    
    // Parse and validate the input as a network schedule item
    const parsed = networkScheduleItemSchema.parse(item);
    
    // Extract show data
    const { show } = parsed;
    
    if (show === undefined || show === null) {
      throw new Error('Show data is missing from schedule item');
    }
    
    // Create a Show object from the parsed data
    return {
      id: show.id ?? 0,
      name: show.name ?? '',
      type: show.type ?? '',
      language: show.language ?? null,
      genres: show.genres ?? [],
      channel: (show.network?.name !== null && show.network?.name !== undefined) 
        ? show.network.name 
        : (show.webChannel?.name !== null && show.webChannel?.name !== undefined)
          ? show.webChannel.name 
          : 'Unknown Network',
      isStreaming: show.webChannel !== null,
      summary: show.summary ?? null,
      airtime: parsed.airtime ?? null,
      season: parsed.season ?? 0,
      number: parsed.number ?? 0
    };
  } catch (error) {
    console.error('Error transforming schedule item:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to transform schedule item: ${errorMsg}`);
  }
}

/**
 * Transform a TVMaze web schedule item to our domain model
 * @param item TVMaze web schedule item
 * @returns Show object
 */
export function transformWebScheduleItem(item: unknown): Show {
  try {
    // Parse and validate the input
    const parsed = webScheduleItemSchema.parse(item);
    
    // Extract show data
    const embedded = parsed._embedded;
    
    // Check if embedded exists and has a show property
    if (
      embedded === undefined || 
      embedded === null || 
      !('show' in embedded) || 
      embedded.show === null
    ) {
      throw new Error('Show data is missing from web schedule item');
    }
    
    const { show } = embedded;
    
    // Create a Show object from the parsed data
    return {
      id: show.id ?? 0,
      name: show.name ?? '',
      type: show.type ?? '',
      language: show.language ?? null,
      genres: show.genres ?? [],
      channel: (show.network?.name !== null && show.network?.name !== undefined) 
        ? show.network.name 
        : (show.webChannel?.name !== null && show.webChannel?.name !== undefined)
          ? show.webChannel.name 
          : 'Unknown Network',
      isStreaming: true,
      summary: show.summary ?? null,
      airtime: parsed.airtime ?? null,
      season: parsed.season ?? 0,
      number: parsed.number ?? 0
    };
  } catch (error) {
    console.error('Error transforming web schedule item:', error);
    const errorMsg = error instanceof Error ? error.message : String(error);
    throw new Error(`Failed to transform web schedule item: ${errorMsg}`);
  }
}

/**
 * Transform an array of TVMaze schedule items to our domain model
 */
export function transformSchedule(items: unknown[]): Show[] {
  return items.map(item => transformScheduleItem(item));
}
