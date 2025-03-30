/**
 * Utility functions for TVMaze API operations
 */
import { 
  networkScheduleToShowSchema,
  webScheduleToShowSchema
} from '../schemas/tvmaze.js';
import { getStringOrDefault } from './stringUtils.js';
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
      // Use Zod schema to transform web schedule item
      return webScheduleToShowSchema.safeParse(item).success 
        ? webScheduleToShowSchema.parse(item)
        : null;
    } else {
      // Use Zod schema to transform network schedule item
      return networkScheduleToShowSchema.safeParse(item).success
        ? networkScheduleToShowSchema.parse(item)
        : null;
    }
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
  
  // Map each item through the transform function and filter out nulls
  return data
    .map(item => transformScheduleItem(item))
    .filter((show): show is Show => show !== null);
}
