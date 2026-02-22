/**
 * Utility functions for configuration handling
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { CliArgs } from '../types/cliArgs.js';
import { AppConfig } from '../types/configTypes.js';
import { ShowOptions } from '../types/tvShowOptions.js';
import { getTodayDate } from './dateUtils.js';
import { getStringValue } from './stringUtils.js';

/**
 * Safely convert a string, comma-separated value, or array to a string array
 * @param value The value to convert (can be string, array, or undefined)
 * @param separator The separator to use for splitting strings (default: ',')
 * @returns A string array
 */
export function toStringArray(
  value: string | string[] | undefined | null,
  separator = ','
): string[] {
  // Handle undefined/null
  if (value === undefined || value === null) {
    return [];
  }

  // Handle already an array - convert items to strings
  if (Array.isArray(value)) {
    return value.map((item) => typeof item === 'string' ? item : String(item));
  }

  // Handle string
  if (typeof value === 'string') {
    if (value.trim() === '') {
      return [];
    }
    return value.split(separator).map(item => item.trim());
  }

  // Handle other types by converting to string
  return [String(value)];
}

/**
 * Safely merge arrays with priority
 * @param primary Primary array (takes precedence if not empty)
 * @param fallback Fallback array (used if primary is empty)
 * @returns Merged array
 */
export function mergeArraysWithPriority<T>(
  primary: T[] | undefined | null,
  fallback: T[] | undefined | null
): T[] {
  const primaryArray = Array.isArray(primary) ? primary : [];
  const fallbackArray = Array.isArray(fallback) ? fallback : [];

  return primaryArray.length > 0 ? primaryArray : fallbackArray;
}

/**
 * Get directory path from import.meta.url
 * @param importMetaUrl The import.meta.url value
 * @returns The directory path
 */
export function getDirPathFromImportMeta(importMetaUrl: string): string {
  const filePath = fileURLToPath(importMetaUrl);
  return path.dirname(filePath);
}

/**
 * Resolve a path relative to a base directory
 * @param baseDir The base directory
 * @param relativePath The relative path
 * @returns The resolved absolute path
 */
export function resolveRelativePath(baseDir: string, relativePath: string): string {
  return path.resolve(baseDir, relativePath);
}

/**
 * Get the default application configuration
 * @returns Default AppConfig object
 */
export function getDefaultConfig(): AppConfig {
  return {
    country: 'US',
    timezone: 'America/Los_Angeles', // IANA timezone for date calculations
    types: [], // e.g., ['Reality', 'Scripted']
    networks: [], // e.g., ['Discovery', 'CBS']
    genres: [], // e.g., ['Drama', 'Comedy']
    languages: [], // e.g., ['English']
    minAirtime: '18:00', // Default to primetime shows
    notificationTime: '09:00', // 24-hour format
    slack: {
      token: '',
      channelId: '',
      username: 'WhatsOnTV'
    }
  };
}

/**
 * Merge CLI arguments with app configuration to create show options
 * @param cliArgs CLI arguments
 * @param appConfig Application configuration
 * @returns Merged ShowOptions object
 * @protected
 */
export function mergeShowOptions(
  cliArgs: CliArgs,
  appConfig: AppConfig
): ShowOptions {
  // Start with base options or empty object
  const base: ShowOptions = {};

  const cliDate = cliArgs.date;
  const cliCountry = cliArgs.country;
  const cliMinAirtime = cliArgs.minAirtime;

  // Safely handle base options
  const baseDate = base.date ?? getTodayDate(appConfig.timezone);
  const baseCountry = base.country ?? appConfig.country;
  const baseMinAirtime = base.minAirtime ?? appConfig.minAirtime;

  return {
    // Use base options as fallback if provided
    date: getStringValue(
      cliDate,
      baseDate
    ),
    country: getStringValue(
      cliCountry,
      baseCountry
    ),
    // Use utility functions for array handling
    types: mergeArraysWithPriority(
      toStringArray(cliArgs.types),
      base.types ?? toStringArray(appConfig.types)
    ),
    networks: mergeArraysWithPriority(
      toStringArray(cliArgs.networks),
      base.networks ?? toStringArray(appConfig.networks)
    ),
    genres: mergeArraysWithPriority(
      toStringArray(cliArgs.genres),
      base.genres ?? toStringArray(appConfig.genres)
    ),
    languages: mergeArraysWithPriority(
      toStringArray(cliArgs.languages),
      base.languages ?? toStringArray(appConfig.languages)
    ),
    // Handle minimum airtime
    minAirtime: getStringValue(
      cliMinAirtime,
      baseMinAirtime
    ),
    // Include show name exclusion patterns from config
    excludeShowNames: appConfig.showNameFilter ?? []
  };
}
