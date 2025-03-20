import type { Show, TVMazeShow, Network, Image } from '../types/tvmaze.js';
import { GotHttpClient } from '../utils/gotHttpClient.js';
import { HttpClient } from '../utils/httpClient.js';
import { generateId } from '../utils/ids.js';

export const TVMAZE_API = {
  BASE_URL: 'https://api.tvmaze.com',
  TV_SCHEDULE: '/schedule',
  WEB_SCHEDULE: '/schedule/web'
} as const;

// Create HTTP client with base URL
let apiClient: HttpClient = new GotHttpClient({
  baseUrl: TVMAZE_API.BASE_URL
});

/**
 * Get the API client instance
 * @returns The current HTTP client
 */
export function _getApiClient(): HttpClient {
  return apiClient;
}

/**
 * Set the API client instance (for testing)
 * @param client The client to use
 */
export function setApiClient(client: HttpClient): void {
  apiClient = client;
}

/**
 * Get today's date in YYYY-MM-DD format
 * @returns Today's date string
 */
export function getTodayDate(): string {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Type guard to check if a string has valid content
 * @param value The string value to check
 * @returns True if the string is defined and non-empty
 */
export function isValidString(value: string | undefined | null): value is string {
  return value !== undefined && value !== null && value !== '';
}

/**
 * Type guard to check if an object exists
 * @param value The object to check
 * @returns True if the object is defined and not null
 */
export function isValidObject<T>(value: T | undefined | null): value is T {
  return value !== undefined && value !== null;
}

/**
 * Safely get a string value with a fallback
 * @param value The string value to check
 * @param fallback The fallback value to use if the string is invalid
 * @returns The original string if valid, otherwise the fallback
 */
export function safeString(
  value: string | number | undefined | null,
  fallback: string = ''
): string {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }
  return String(value);
}

/**
 * Format time to 12-hour format
 * @param time Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string | undefined): string {
  if (!isValidString(time)) {
    return 'TBA';
  }
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours, 10);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const hour12 = hour % 12 || 12;
  return `${hour12}:${minutes} ${ampm}`;
}

/**
 * Check if a given network is a major US platform
 * @param channel Network to check
 * @returns True if the channel is a major US platform
 */
export function isUSPlatform(channel: Network | null): boolean {
  if (!isValidObject(channel)) {
    return false;
  }

  const majorPlatforms: string[] = [
    'Netflix',
    'Amazon',
    'Hulu',
    'HBO',
    'Disney+',
    'Apple TV+',
    'Peacock',
    'Paramount+'
  ];

  const platformName = safeString(channel.name, '').toLowerCase();
  return (
    channel.country?.code === 'US' ||
    majorPlatforms.some(platform => platformName.includes(platform.toLowerCase()))
  );
}

/**
 * Type guard to check if an object is a valid TVMazeShow
 * @param show The object to check
 * @returns True if the object has the required TVMazeShow properties
 */
export function isTVMazeShow(show: unknown): show is TVMazeShow {
  return (
    isValidObject(show) && 
    (
      // Check for embedded show structure
      (isValidObject((show as TVMazeShow)._embedded?.show) || 
      // Check for direct show property
      isValidObject((show as TVMazeShow).show) ||
      // Check for direct show properties
      isValidString((show as TVMazeShow).name))
    )
  );
}

/**
 * Extract ID from various show data structures
 * @param show Show data from TVMaze API
 * @returns ID from the show or a generated ID
 */
function extractShowId(show: TVMazeShow): string | number {
  if (isValidObject(show._embedded?.show) && show._embedded.show.id !== undefined) {
    return show._embedded.show.id;
  }
  
  if (isValidObject(show.show) && show.show.id !== undefined) {
    return show.show.id;
  }
  
  if (show.id !== undefined) {
    return show.id;
  }
  
  return generateId();
}

/**
 * Extract name from various show data structures
 * @param show Show data from TVMaze API
 * @returns Name from the show or empty string
 */
function extractShowName(show: TVMazeShow): string {
  if (isValidObject(show._embedded?.show) && isValidString(show._embedded.show.name)) {
    return show._embedded.show.name;
  }
  
  if (isValidObject(show.show) && isValidString(show.show.name)) {
    return show.show.name;
  }
  
  return safeString(show.name);
}

/**
 * Extract type from various show data structures
 * @param show Show data from TVMaze API
 * @returns Type from the show or empty string
 */
function extractShowType(show: TVMazeShow): string {
  if (isValidObject(show._embedded?.show) && isValidString(show._embedded.show.type)) {
    return show._embedded.show.type;
  }
  
  if (isValidObject(show.show) && isValidString(show.show.type)) {
    return show.show.type;
  }
  
  return safeString(show.type);
}

/**
 * Extract language from various show data structures
 * @param show Show data from TVMaze API
 * @returns Language from the show or null
 */
function extractShowLanguage(show: TVMazeShow): string | null {
  if (isValidObject(show._embedded?.show) && show._embedded.show.language !== undefined) {
    return show._embedded.show.language;
  }
  
  if (isValidObject(show.show) && show.show.language !== undefined) {
    return show.show.language;
  }
  
  return show.language !== undefined ? show.language : null;
}

/**
 * Extract genres from various show data structures
 * @param show Show data from TVMaze API
 * @returns Genres from the show or empty array
 */
function extractShowGenres(show: TVMazeShow): string[] {
  if (isValidObject(show._embedded?.show) && Array.isArray(show._embedded.show.genres)) {
    return show._embedded.show.genres;
  }
  
  if (isValidObject(show.show) && Array.isArray(show.show.genres)) {
    return show.show.genres;
  }
  
  return Array.isArray(show.genres) ? show.genres : [];
}

/**
 * Extract network from various show data structures
 * @param show Show data from TVMaze API
 * @returns Network from the show or null
 */
function extractShowNetwork(show: TVMazeShow): Network | null {
  if (isValidObject(show._embedded?.show?.network)) {
    return show._embedded.show.network;
  }
  
  if (isValidObject(show.show?.network)) {
    return show.show.network;
  }
  
  return isValidObject(show.network) ? show.network : null;
}

/**
 * Extract web channel from various show data structures
 * @param show Show data from TVMaze API
 * @returns Web channel from the show or null
 */
function extractShowWebChannel(show: TVMazeShow): Network | null {
  if (isValidObject(show._embedded?.show?.webChannel)) {
    return show._embedded.show.webChannel;
  }
  
  if (isValidObject(show.show?.webChannel)) {
    return show.show.webChannel;
  }
  
  return isValidObject(show.webChannel) ? show.webChannel : null;
}

/**
 * Extract image from various show data structures
 * @param show Show data from TVMaze API
 * @returns Image from the show or null
 */
function extractShowImage(show: TVMazeShow): Image | null {
  if (isValidObject(show._embedded?.show?.image)) {
    return show._embedded.show.image;
  }
  
  if (isValidObject(show.show?.image)) {
    return show.show.image;
  }
  
  return isValidObject(show.image) ? show.image : null;
}

/**
 * Extract summary from various show data structures
 * @param show Show data from TVMaze API
 * @returns Summary from the show or empty string
 */
function extractShowSummary(show: TVMazeShow): string {
  if (isValidObject(show._embedded?.show) && isValidString(show._embedded.show.summary)) {
    return show._embedded.show.summary;
  }
  
  if (isValidObject(show.show) && isValidString(show.show.summary)) {
    return show.show.summary;
  }
  
  return safeString(show.summary);
}

/**
 * Normalize show data to a consistent format
 * @param show Raw show data from TVMaze API
 * @returns Normalized show data or null if invalid
 */
export function normalizeShowData(show: TVMazeShow | null): Show | null {
  if (!isValidObject(show)) {
    return null;
  }

  // Extract show details using helper functions
  const showDetails: ShowDetails = {
    id: extractShowId(show),
    name: extractShowName(show),
    type: extractShowType(show),
    language: extractShowLanguage(show),
    genres: extractShowGenres(show),
    network: extractShowNetwork(show),
    webChannel: extractShowWebChannel(show),
    image: extractShowImage(show),
    summary: extractShowSummary(show)
  };

  if (showDetails.name === '') {
    return null;
  }

  return {
    airtime: safeString(show.airtime),
    name: safeString(show.name),
    season: safeString(show.season),
    number: safeString(show.number),
    show: showDetails
  };
}

interface ShowDetails {
  id?: string | number;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  network: Network | null;
  webChannel: Network | null;
  image: Image | null;
  summary: string;
}

/**
 * Apply filters to shows based on user preferences
 * @param shows List of shows to filter
 * @param filters Filter criteria
 * @returns Filtered list of shows
 */
export function applyShowFilters(
  shows: Show[],
  filters: {
    types?: string[];
    networks?: string[];
    genres?: string[];
    languages?: string[];
  }
): Show[] {
  const { types = [], networks = [], genres = [], languages = [] } = filters;

  return shows.filter((show: Show): boolean => {
    const showType = safeString(show.show.type);
    const showGenres = Array.isArray(show.show.genres) ? show.show.genres : [];
    const showLanguage = safeString(show.show.language as string);
    const showNetwork = safeString(show.show.network?.name);
    const showWebChannel = safeString(show.show.webChannel?.name);

    const typeMatch = types.length === 0 || types.includes(showType);
    const networkMatch =
      networks.length === 0 ||
      networks.some(
        network =>
          showNetwork.toLowerCase().includes(network.toLowerCase()) ||
          showWebChannel.toLowerCase().includes(network.toLowerCase())
      );
    const genreMatch =
      genres.length === 0 ||
      genres.some(genre => showGenres.map(g => g.toLowerCase()).includes(genre.toLowerCase()));
    const languageMatch = languages.length === 0 || languages.includes(showLanguage);

    return typeMatch && networkMatch && genreMatch && languageMatch;
  });
}

/**
 * Normalize network name for consistent comparison
 * @param name Network name to normalize
 * @returns Normalized network name
 */
export function normalizeNetworkName(name: string | undefined): string {
  return safeString(name, 'Unknown').toLowerCase().trim();
}

/**
 * Sort shows by airtime
 * @param shows Shows to sort
 * @returns Sorted shows array
 */
export function sortShowsByTime(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    // Handle empty airtimes
    if (!isValidString(a.airtime) && !isValidString(b.airtime)) return 0;
    if (!isValidString(a.airtime)) return 1;
    if (!isValidString(b.airtime)) return -1;

    // Convert time strings to comparable values
    const [aHour, aMinute] = a.airtime.split(':').map(Number);
    const [bHour, bMinute] = b.airtime.split(':').map(Number);

    // Compare hours first, then minutes
    if (aHour !== bHour) return aHour - bHour;
    return aMinute - bMinute;
  });
}

/**
 * Group shows by their network
 * @param shows Shows to group
 * @returns Shows grouped by network
 */
export function groupShowsByNetwork(shows: Show[]): Record<string, Show[]> {
  const showMap = shows.reduce((groups: Map<string, Show[]>, show: Show) => {
    const network = show.show.network?.name;
    const webChannel = show.show.webChannel?.name;
    
    // Use the original network name for the group key, not the normalized version
    const networkName = isValidString(network) 
      ? network 
      : (isValidString(webChannel) 
        ? webChannel 
        : 'Unknown');

    if (!groups.has(networkName)) {
      groups.set(networkName, []);
    }
    groups.get(networkName)?.push(show);
    return groups;
  }, new Map<string, Show[]>());
  
  // Convert Map back to Record to maintain the same return type
  return Object.fromEntries(showMap);
}

/**
 * Get show details in a consistent format
 * @param show Show to get details from
 * @returns Show details
 */
export function getShowDetails(show: Show): ShowDetails {
  return show.show;
}

/**
 * Fetch TV shows from TVMaze API with optional filters
 * @param options Filter options for the TV shows
 * @returns Promise resolving to filtered list of shows
 */
export async function fetchTvShows(
  options: FetchOptions = {}
): Promise<Show[]> {
  try {
    const date = isValidString(options.date) ? options.date : getTodayDate();
    const params = { date, country: 'US' };

    // Fetch shows from both TV and web schedules
    const [tvResponse, webResponse] = await Promise.all([
      _getApiClient().get<TVMazeShow[]>(TVMAZE_API.TV_SCHEDULE, params),
      _getApiClient().get<TVMazeShow[]>(TVMAZE_API.WEB_SCHEDULE, { date })
    ]);

    // Normalize and combine show data
    const tvShows = tvResponse.data.map(normalizeShowData).filter(Boolean) as Show[];
    const webShows = webResponse.data.map(normalizeShowData).filter(Boolean) as Show[];
    let shows = [...tvShows, ...webShows];

    // Apply filters if provided
    shows = applyShowFilters(shows, options);

    return shows;
  } catch (_error) {
    throw new Error('Failed to fetch TV shows');
  }
}

interface FetchOptions {
  date?: string;
  country?: string;
  types?: string[];
  networks?: string[];
  genres?: string[];
  languages?: string[];
}
