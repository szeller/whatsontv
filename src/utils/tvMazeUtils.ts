/**
 * Utility functions for TVMaze API operations
 */
import { getStringOrDefault } from './stringUtils.js';
import type { Show } from '../types/tvShowModel.js';

/**
 * Base URL for TVMaze API
 */
const TV_MAZE_BASE_URL = 'https://api.tvmaze.com';

/**
 * Generate URL for network schedule endpoint
 * @param date Date in YYYY-MM-DD format
 * @param country Optional country code (e.g., 'US')
 * @returns Full URL for network schedule endpoint
 */
export function getNetworkScheduleUrl(date: string, country?: string): string {
  const baseUrl = `${TV_MAZE_BASE_URL}/schedule`;
  const params = new URLSearchParams();
  
  const trimmedDate = getStringOrDefault(date, '');
  if (trimmedDate) {
    params.append('date', trimmedDate);
  }
  
  const trimmedCountry = getStringOrDefault(country, '');
  if (trimmedCountry) {
    params.append('country', trimmedCountry);
  }
  
  const queryString = params.toString();
  return queryString ? `${baseUrl}?${queryString}` : baseUrl;
}

/**
 * Generate URL for web schedule endpoint
 * @param date Date in YYYY-MM-DD format
 * @returns Full URL for web schedule endpoint
 */
export function getWebScheduleUrl(date: string): string {
  const trimmedDate = getStringOrDefault(date, '');
  return `${TV_MAZE_BASE_URL}/schedule/web${trimmedDate ? `?date=${trimmedDate}` : ''}`;
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
         typeof itemObj._embedded === 'object' &&
         (itemObj._embedded as Record<string, unknown>).show !== undefined;
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
