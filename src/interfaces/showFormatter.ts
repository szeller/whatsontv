import type { NetworkGroups, Show } from '../types/tvShowModel.js';

/**
 * Interface for formatters that format TV show information
 */
export interface ShowFormatter {
  /**
   * Format a single show for display
   * @param show Show to format
   * @returns Formatted show string
   */
  formatShow(show: Show): string;
  
  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show string
   */
  formatTimedShow(show: Show): string;
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show string
   */
  formatUntimedShow(show: Show): string;
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show string
   */
  formatMultipleEpisodes(shows: Show[]): string[];
  
  /**
   * Format a group of shows by network
   * @param networkGroups Shows grouped by network
   * @param timeSort Whether to sort shows by time
   * @returns Formatted output as an array of strings
   */
  formatNetworkGroups(networkGroups: NetworkGroups, timeSort?: boolean): string[];
}
