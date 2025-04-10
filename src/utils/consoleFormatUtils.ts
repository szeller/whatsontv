/**
 * Utility functions for formatting console output
 */
import type { Show } from '../schemas/domain.js';
import { getStringValue } from './stringUtils.js';

/**
 * Format a network name consistently for console display
 * @param networkName - Network name to format
 * @param unknownLabel - Label to use for unknown network
 * @returns Formatted network name
 */
export function formatNetworkName(
  networkName: string | null | undefined, 
  unknownLabel = 'Unknown Network'
): string {
  return getStringValue(networkName, unknownLabel);
}

/**
 * Format a show type consistently for console display
 * @param type - Show type to format
 * @param unknownLabel - Label to use for unknown show type
 * @returns Formatted show type
 */
export function formatShowType(
  type: string | null | undefined, 
  unknownLabel = 'Unknown'
): string {
  return getStringValue(type, unknownLabel);
}

/**
 * Format episode information consistently for console display
 * @param episodeInfo - Episode information object or Show object
 * @returns Formatted episode information (e.g., "S01E05") or empty string if not available
 */
export function formatEpisodeInfo(
  episodeInfo: { season: number | null; number: number | null } | null | undefined
): string {
  if (episodeInfo === null || episodeInfo === undefined) {
    return '';
  }
  
  const { season, number } = episodeInfo;
  
  if (season === null || season === undefined || number === null || number === undefined) {
    return '';
  }
  
  const paddedSeason = season.toString().padStart(2, '0');
  const paddedEpisode = number.toString().padStart(2, '0');
  
  return `S${paddedSeason}E${paddedEpisode}`;
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

/**
 * Group shows by show ID
 * @param shows - Shows to group
 * @returns Record with show IDs as keys and arrays of shows as values
 */
export function groupShowsByShowId(shows: Show[]): Record<string, Show[]> {
  const showGroups: Record<string, Show[]> = {};
  
  for (const show of shows) {
    const showId = show.id.toString();
    
    if (!Object.prototype.hasOwnProperty.call(showGroups, showId)) {
      showGroups[showId] = [];
    }
    
    showGroups[showId].push(show);
  }
  
  return showGroups;
}

/**
 * Prepare components for a show row without applying any styling
 * @param show - Show to format
 * @param options - Options for formatting
 * @returns Object with formatted components
 */
export function prepareShowRowComponents(
  show: Show,
  options: {
    noAirtime?: string;
    noNetwork?: string;
    unknownShow?: string;
    unknownType?: string;
  } = {}
): {
  time: string;
  network: string;
  type: string;
  showName: string;
  episodeInfo: string;
} {
  const {
    noAirtime = 'N/A',
    noNetwork = 'Unknown Network',
    unknownShow = 'Unknown Show',
    unknownType = 'Unknown'
  } = options;
  
  // Format time
  const time = getStringValue(show.airtime, noAirtime);
  
  // Format network
  const network = show.network !== null && show.network !== undefined && show.network !== '' 
    ? formatNetworkName(show.network) 
    : noNetwork;
  
  // Format type
  const type = formatShowType(show.type || '', unknownType);
  
  // Format show name
  const showName = getStringValue(show.name, unknownShow);
  
  // Format episode info
  const episodeInfo = formatEpisodeInfo(show);
  
  return {
    time,
    network,
    type,
    showName,
    episodeInfo
  };
}

/**
 * Check if a show has an airtime
 * @param show - Show to check
 * @returns True if the show has an airtime, false otherwise
 */
export function hasAirtime(show: Show): boolean {
  return show.airtime !== null && 
         show.airtime !== undefined && 
         show.airtime.trim() !== '';
}

/**
 * Check if all shows in an array have no airtime
 * @param shows - Shows to check
 * @returns True if all shows have no airtime, false otherwise
 */
export function allShowsHaveNoAirtime(shows: Show[]): boolean {
  if (shows === null || shows === undefined || shows.length === 0) {
    return true;
  }
  
  return shows.every(show => !hasAirtime(show));
}
