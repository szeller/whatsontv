/**
 * Utility functions for formatting TV show data for console output
 */
import type { Show } from '../schemas/domain.js';
import { 
  getStringValue, padString, truncateString 
} from './stringUtils.js';
import { formatTimeWithPeriod } from './dateUtils.js';

/**
 * Options for formatting show information
 */
export interface FormatOptions {
  /** Maximum width for the show name */
  nameWidth?: number;
  /** Maximum width for the network name */
  networkWidth?: number;
  /** Maximum width for the show type */
  typeWidth?: number;
  /** Whether to include episode information */
  includeEpisode?: boolean;
  /** Whether to include time information */
  includeTime?: boolean;
  /** Whether to include network information */
  includeNetwork?: boolean;
  /** Whether to pad season and episode numbers with leading zeros */
  padEpisodeNumbers?: boolean;
}

/**
 * Format a network name consistently for console display
 * @param network - Network name to format
 * @returns Formatted network name
 */
export function formatNetworkName(network: string | null | undefined): string {
  return getStringValue(network, 'Unknown Network');
}

/**
 * Format a show type consistently for console display
 * @param type - Show type to format
 * @returns Formatted show type
 */
export function formatShowType(type: string | null | undefined): string {
  return getStringValue(type, 'Unknown');
}

/**
 * Format episode information in S01E01 format (with leading zeros by default)
 * @param show - Show object containing season and episode information
 * @param padWithZeros - Whether to pad with leading zeros (default: true)
 * @returns Formatted episode information
 */
export function formatEpisodeInfo(
  show: Show | { season?: number | null, number?: number | null },
  padWithZeros = true
): string {
  const season = show.season;
  const episode = show.number;
  
  if (season === null || season === undefined || episode === null || episode === undefined) {
    return '';
  }
  
  if (padWithZeros) {
    // Format as S01E01 (with leading zeros)
    const seasonStr = season.toString().padStart(2, '0');
    const episodeStr = episode.toString().padStart(2, '0');
    return `S${seasonStr}E${episodeStr}`;
  } else {
    // Format as S1E1 (without leading zeros)
    return `S${season}E${episode}`;
  }
}

/**
 * Format a show for console display
 * @param show - Show to format
 * @param options - Formatting options
 * @returns Formatted show string
 */
export function formatShowForConsole(show: Show, options: FormatOptions = {}): string {
  const {
    nameWidth = 30,
    networkWidth = 15,
    typeWidth = 10,
    includeEpisode = true,
    includeTime = true,
    includeNetwork = true,
    padEpisodeNumbers = true
  } = options;
  
  // Format show name (truncate if necessary)
  const name = truncateString(show.name, nameWidth);
  
  // Format parts array to build the output
  const parts: string[] = [padString(name, nameWidth)];
  
  // Add time if requested
  if (includeTime) {
    // Properly handle null/undefined/empty airtime
    const airtime = getStringValue(show.airtime, '');
    const time = airtime !== '' ? formatTimeWithPeriod(airtime) : 'TBA';
    parts.push(padString(time, 10));
  }
  
  // Add network if requested
  if (includeNetwork) {
    const network = formatNetworkName(show.network);
    parts.push(padString(truncateString(network, networkWidth), networkWidth));
  }
  
  // Add show type
  const type = formatShowType(show.type);
  parts.push(padString(truncateString(type, typeWidth), typeWidth));
  
  // Add episode information if requested
  if (includeEpisode && show.season !== undefined && show.number !== undefined) {
    const episodeInfo = formatEpisodeInfo(show, padEpisodeNumbers);
    parts.push(episodeInfo);
  }
  
  // Join all parts with spaces
  return parts.join(' ');
}

/**
 * Format a table row with proper spacing
 * @param columns - Column values
 * @param widths - Column widths
 * @returns Formatted table row
 */
export function formatTableRow(columns: (string | null | undefined)[], widths: number[]): string {
  // Ensure columns and widths arrays have the same length
  const length = Math.min(columns.length, widths.length);
  
  // Format each column with proper padding
  const formattedColumns = [];
  for (let i = 0; i < length; i++) {
    const value = getStringValue(columns[i], '');
    formattedColumns.push(padString(value, widths[i]));
  }
  
  // Join columns with spaces
  return formattedColumns.join(' ');
}

/**
 * Create a table header with optional separator line
 * @param headers - Header values
 * @param widths - Column widths
 * @param includeSeparator - Whether to include a separator line
 * @returns Array of header lines
 */
export function createTableHeader(
  headers: string[],
  widths: number[],
  includeSeparator: boolean = true
): string[] {
  const result: string[] = [];
  
  // Add header row
  result.push(formatTableRow(headers, widths));
  
  // Add separator line if requested
  if (includeSeparator) {
    const separators = widths.map(width => '-'.repeat(width));
    result.push(formatTableRow(separators, widths));
  }
  
  return result;
}

/**
 * Create a bullet list for console display
 * @param items - List items
 * @param bulletChar - Bullet character
 * @param indent - Indentation for wrapped lines
 * @returns Array of formatted lines
 */
export function createBulletList(
  items: string[],
  bulletChar: string = '• ',
  indent: number = bulletChar.length
): string[] {
  if (items.length === 0) {
    return [];
  }
  
  const result: string[] = [];
  const indentStr = ' '.repeat(indent);
  
  for (const item of items) {
    // Split item into lines if it contains newlines
    const lines = item.split('\n');
    
    // Add first line with bullet
    result.push(`${bulletChar}${lines[0]}`);
    
    // Add remaining lines with indentation
    for (let i = 1; i < lines.length; i++) {
      result.push(`${indentStr}${lines[i]}`);
    }
  }
  
  return result;
}
