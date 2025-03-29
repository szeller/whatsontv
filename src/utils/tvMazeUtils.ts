/**
 * Utility functions for TVMaze API operations
 */
import { getStringOrDefault } from './stringUtils.js';
import { validateDataOrNull } from './validationUtils.js';
import { 
  networkScheduleItemSchema, 
  webScheduleItemSchema 
} from '../schemas/tvmaze.js';
import type { Show } from '../schemas/domain.js';

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
export function getNetworkScheduleUrl(
  date: string, 
  country?: string
): string {
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
  return queryString 
    ? `${baseUrl}?${queryString}` 
    : baseUrl;
}

/**
 * Generate URL for web schedule endpoint
 * @param date Date in YYYY-MM-DD format
 * @returns Full URL for web schedule endpoint
 */
export function getWebScheduleUrl(
  date: string
): string {
  const trimmedDate = getStringOrDefault(date, '');
  return `${TV_MAZE_BASE_URL}/schedule/web` + 
    (trimmedDate ? `?date=${trimmedDate}` : '');
}

/**
 * Check if an item is a web schedule item (from /schedule/web endpoint)
 * 
 * @param item Item to check
 * @returns True if the item is a web schedule item, false otherwise
 */
export function isWebScheduleItem(item: unknown): boolean {
  if (item === null || item === undefined || typeof item !== 'object') {
    return false;
  }
  
  const itemObj = item as Record<string, unknown>;
  
  // Web schedule items have an _embedded property with a show property
  return (
    '_embedded' in itemObj && 
    itemObj._embedded !== null && 
    typeof itemObj._embedded === 'object' &&
    (itemObj._embedded as Record<string, unknown>).show !== undefined
  );
}

/**
 * Format network name with country code if available
 * 
 * @param show Show data containing network or webChannel information
 * @returns Formatted network name
 */
function formatNetworkName(
  show: Record<string, unknown>
): string {
  let networkName = 'Unknown Network';
  
  if (show.network !== undefined && 
      show.network !== null && 
      typeof show.network === 'object') {
    const network = show.network as Record<string, unknown>;
    if (network.name !== undefined && 
        typeof network.name === 'string') {
      networkName = network.name;
      
      const hasCountry = network.country !== undefined && 
                         network.country !== null && 
                         typeof network.country === 'object';
      
      if (hasCountry) {
        const country = network.country as Record<string, unknown>;
        if (country.code !== undefined && 
            typeof country.code === 'string') {
          networkName += ` (${country.code})`;
        }
      }
    }
  } else if (show.webChannel !== undefined && 
             show.webChannel !== null && 
             typeof show.webChannel === 'object') {
    const webChannel = show.webChannel as Record<string, unknown>;
    if (webChannel.name !== undefined && 
        typeof webChannel.name === 'string') {
      networkName = webChannel.name;
    }
  }
  
  return networkName;
}

/**
 * Transform a single TVMaze schedule item to our domain model
 * This function handles both network shows (/schedule endpoint) and
 * streaming shows (/schedule/web endpoint) based on their structure.
 * 
 * @param item TVMaze schedule item (either network or streaming format)
 * @returns Show object or null if transformation fails
 */
export function transformScheduleItem(
  item: unknown
): Show | null {
  try {
    // First determine if this is a web schedule item
    const isWeb = isWebScheduleItem(item);
    
    if (isWeb) {
      // Only try to parse as a web schedule item
      const webItem = validateDataOrNull(
        webScheduleItemSchema, 
        item
      );
      if (webItem !== null && 
          webItem._embedded?.show !== undefined) {
        return {
          id: webItem._embedded.show.id ?? 0,
          name: webItem._embedded.show.name ?? 'Unknown Show',
          type: webItem._embedded.show.type ?? 'unknown',
          language: webItem._embedded.show.language ?? null,
          genres: webItem._embedded.show.genres ?? [],
          network: formatNetworkName(
            webItem._embedded.show as Record<string, unknown>
          ),
          summary: webItem._embedded.show.summary ?? null,
          airtime: webItem.airtime ?? null,
          season: webItem.season ?? 0,
          number: webItem.number ?? 0
        };
      }
    } else {
      // Only try to parse as a network schedule item
      const networkItem = validateDataOrNull(
        networkScheduleItemSchema, 
        item
      );
      if (networkItem !== null) {
        return {
          id: networkItem.show.id ?? 0,
          name: networkItem.show.name ?? 'Unknown Show',
          type: networkItem.show.type ?? 'unknown',
          language: networkItem.show.language ?? null,
          genres: networkItem.show.genres ?? [],
          network: formatNetworkName(
            networkItem.show as Record<string, unknown>
          ),
          summary: networkItem.show.summary ?? null,
          airtime: networkItem.airtime ?? null,
          season: networkItem.season ?? 0,
          number: networkItem.number ?? 0
        };
      }
    }
    
    return null;
  } catch (error) {
    console.error('Error transforming schedule item:', error);
    return null;
  }
}

/**
 * Transform TVMaze API schedule data into our domain model
 * @param data Raw TVMaze API schedule data
 * @returns Array of transformed Show objects
 */
export function transformSchedule(
  data: unknown[]
): Show[] {
  if (!Array.isArray(data)) {
    return [];
  }

  return data.map(item => transformScheduleItem(item))
    .filter((show): show is Show => show !== null);
}
