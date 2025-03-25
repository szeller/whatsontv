/**
 * Utility functions for TVMaze API operations
 */

/**
 * Base URL for TVMaze API
 */
export const TV_MAZE_BASE_URL = 'https://api.tvmaze.com';

/**
 * Generate URL for network schedule endpoint
 * @param date Date in YYYY-MM-DD format
 * @param country Optional country code (e.g., 'US')
 * @returns Full URL for network schedule endpoint
 */
export function getNetworkScheduleUrl(date: string, country?: string): string {
  const baseUrl = `${TV_MAZE_BASE_URL}/schedule`;
  const params = new URLSearchParams();
  
  if (date && date.trim() !== '') {
    params.append('date', date);
  }
  
  if (country !== undefined && country !== null && country.trim() !== '') {
    params.append('country', country);
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
  return `${TV_MAZE_BASE_URL}/schedule/web${date && date.trim() !== '' ? `?date=${date}` : ''}`;
}

/**
 * Determine if a schedule item is from a streaming service based on its structure
 * @param item Schedule item from TVMaze API
 * @returns True if the item is from a streaming service
 */
export function isStreamingItem(item: unknown): boolean {
  return item !== null && 
         typeof item === 'object' && 
         '_embedded' in item && 
         item._embedded !== null && 
         typeof item._embedded === 'object' && 
         'show' in item._embedded;
}
