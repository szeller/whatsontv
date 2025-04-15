/**
 * Format utility functions for handling show data across different output formats
 */

import { Show } from '../schemas/domain.js';
import { getStringValue } from './stringUtils.js';
import { formatTimeWithPeriod, isValidTime } from './dateUtils.js';

/**
 * Format network name with fallback for null/undefined values
 * @param networkName - The network name to format
 * @param unknownLabel - The label to use when network name is unknown
 * @returns Formatted network name
 */
export function formatNetworkName(
  networkName: string | null | undefined, 
  unknownLabel = 'Unknown Network'
): string {
  return getStringValue(networkName, unknownLabel);
}

/**
 * Format show type with fallback for null/undefined values
 * @param type - The show type to format
 * @param unknownLabel - The label to use when type is unknown
 * @returns Formatted show type
 */
export function formatShowType(
  type: string | null | undefined, 
  unknownLabel = 'Unknown Type'
): string {
  return getStringValue(type, unknownLabel);
}

/**
 * Format episode information from a show
 * @param show - The show object containing episode information
 * @returns Formatted episode string (e.g., "S01E01")
 */
export function formatEpisodeInfo(show: Show | null | undefined): string {
  // Handle null/undefined values
  if (!show) {
    return '';
  }
  
  // Check if season and episode are present and non-zero
  const hasSeason = typeof show.season === 'number' && show.season > 0;
  const hasEpisode = typeof show.number === 'number' && show.number > 0;
  
  // Return empty string if neither season nor episode is present
  if (!hasSeason && !hasEpisode) {
    return '';
  }
  
  // Format season/episode
  let result = '';
  
  if (hasSeason) {
    result += `S${String(show.season).padStart(2, '0')}`;
  }
  
  if (hasEpisode) {
    result += `E${String(show.number).padStart(2, '0')}`;
  }
  
  return result;
}

/**
 * Check if a show has a valid airtime
 * @param show - The show to check
 * @returns True if the show has a valid airtime
 */
export function hasAirtime(show: Show | null | undefined): boolean {
  if (!show) {
    return false;
  }
  return isValidTime(show.airtime);
}

/**
 * Check if all shows in an array have no airtime
 * @param shows - Array of shows to check
 * @returns True if all shows have no airtime
 */
export function allShowsHaveNoAirtime(shows: Show[] | null | undefined): boolean {
  if (!Array.isArray(shows) || shows.length === 0) {
    return true;
  }
  
  return shows.every(show => !hasAirtime(show));
}

/**
 * Prepare common show components used for display
 * @param show - The show to prepare components for
 * @returns Object with prepared components
 */
export interface ShowComponents {
  name: string;
  network: string;
  type: string;
  airtime: string;
  episode: string;
}

/**
 * Interface for show formatting options
 */
export interface FormattingOptions {
  includeAirtime: boolean;
  networkUnknownLabel?: string;
  typeUnknownLabel?: string;
}

/**
 * Prepare show components for display
 * @param show - The show to prepare components for
 * @param options - Formatting options
 * @returns Prepared components object
 */
export function prepareShowComponents(
  show: Show, 
  options: FormattingOptions
): ShowComponents {
  const networkLabel = options.networkUnknownLabel ?? 'Unknown Network';
  const typeLabel = options.typeUnknownLabel ?? 'Unknown Type';
  
  // Use nullish coalescing to handle null/undefined values
  const name = getStringValue(show?.name ?? '', 'Untitled Show');
  const network = formatNetworkName(show?.network ?? '', networkLabel);
  const type = formatShowType(show?.type ?? '', typeLabel);
  const episode = formatEpisodeInfo(show);
  
  let airtime = 'No airtime';
  if (options.includeAirtime && hasAirtime(show)) {
    airtime = formatTimeWithPeriod(show.airtime);
  }
  
  return {
    name,
    network,
    type,
    airtime,
    episode
  };
}

/**
 * Group shows by their showId property
 * @param shows - The shows to group
 * @returns Object with showId as key and array of shows as value
 */
export function groupShowsByShowId(shows: Show[] | null | undefined): Record<string, Show[]> {
  const groups: Record<string, Show[]> = {};
  
  // Check if shows is an array before processing
  if (shows === null || shows === undefined || shows.length === 0) {
    return groups;
  }
  
  shows.forEach(show => {
    // Use optional chaining and nullish coalescing for safe property access
    const showId = show?.id?.toString() ?? '';
    if (showId !== '') {
      if (groups[showId] === undefined) {
        groups[showId] = [];
      }
      groups[showId].push(show);
    }
  });
  
  return groups;
}

/**
 * Format a network header and generate a separator line
 * @param networkName - Network name to format
 * @param unknownLabel - Label to use for unknown network
 * @returns Array with header and separator
 */
export function formatNetworkHeader(
  networkName: string | null | undefined, 
  unknownLabel = 'Unknown Network'
): [string, string] {
  const formattedName = formatNetworkName(networkName, unknownLabel);
  const header = `${formattedName}:`;
  const separator = '-'.repeat(header.length);
  return [header, separator];
}
