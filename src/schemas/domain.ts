/**
 * Domain model schemas for TV shows
 * 
 * Contains schemas and types for the internal domain model,
 * independent of any particular API
 */
import { z } from 'zod';

/**
 * Schema for a TV show with its associated metadata
 */
export const showSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  language: z.string().nullable(),
  genres: z.array(z.string()),
  network: z.string(),
  summary: z.string().nullable(),
  airtime: z.string().nullable(),
  season: z.number(),
  number: z.number()
});

/**
 * Type alias for the Show schema
 */
export type Show = z.infer<typeof showSchema>;

/**
 * Groups of shows organized by network
 */
export type NetworkGroups = Record<string, Show[]>;
