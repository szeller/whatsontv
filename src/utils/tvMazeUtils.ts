/**
 * Utility functions for TVMaze API operations
 */
import { getStringOrDefault } from './stringUtils.js';

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
