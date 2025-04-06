/**
 * Interface for formatting TV show information
 */
import type { Show, NetworkGroups } from '../schemas/domain.js';

/**
 * Generic interface for formatting TV show information
 * Uses generics to allow for different output formats (text, Slack blocks, etc.)
 * TOutput: The output type for a single show or episode
 * TGroupOutput: The output type for a group of shows (defaults to TOutput[])
 */
export interface ShowFormatter<TOutput, TGroupOutput = TOutput[]> {
  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show representation
   */
  formatTimedShow(show: Show): TOutput;
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show representation
   */
  formatUntimedShow(show: Show): TOutput;
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show representations
   */
  formatMultipleEpisodes(shows: Show[]): TOutput[];
  
  /**
   * Format a single network and its shows
   * @param network Network name
   * @param shows Shows in the network
   * @returns Formatted output for the network and its shows
   */
  formatNetwork(network: string, shows: Show[]): TOutput[];
  
  /**
   * Format a group of shows by network
   * @param networkGroups Shows grouped by network
   * @returns Formatted output for the network groups
   */
  formatNetworkGroups(networkGroups: NetworkGroups): TGroupOutput;
}

/**
 * Text-specific implementation of ShowFormatter
 * Used for console and other text-based outputs
 */
export type TextShowFormatter = ShowFormatter<string, string[]>;
