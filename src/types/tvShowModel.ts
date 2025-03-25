/**
 * Domain model for TV shows
 * Contains general types that are not specific to any particular API
 */

/**
 * Represents a TV show with its associated metadata
 */
export interface Show {
  id: number;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  network: string;
  isStreaming: boolean;
  summary: string | null;
  airtime: string | null;
  season: number;
  number: number;
}

/**
 * Groups of shows organized by network
 */
export type NetworkGroups = Record<string, Show[]>;
