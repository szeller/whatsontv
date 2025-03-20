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
 * Format time to 12-hour format
 * @param time Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string | undefined): string {
  if (time === undefined || time === '') {
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
  if (!channel) {
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

  const platformName = channel.name?.toLowerCase() || '';
  return (
    channel.country?.code === 'US' ||
    majorPlatforms.some(platform => platformName.includes(platform.toLowerCase()))
  );
}

/**
 * Normalize show data to a consistent format
 * @param show Raw show data from TVMaze API
 * @returns Normalized show data or null if invalid
 */
export function normalizeShowData(show: TVMazeShow | null): Show | null {
  if (!show) {
    return null;
  }

  // Handle both regular schedule and web schedule data structures
  const showDetails: ShowDetails = {
    id: show._embedded?.show?.id !== undefined ? show._embedded.show.id : 
      (show.show?.id !== undefined ? show.show.id : 
        (show.id !== undefined ? show.id : generateId())),
    name: show._embedded?.show?.name !== undefined && show._embedded.show.name !== '' 
      ? show._embedded.show.name 
      : (show.show?.name !== undefined && show.show.name !== '' 
        ? show.show.name 
        : (show.name !== undefined && show.name !== '' ? show.name : '')),
    type: show._embedded?.show?.type !== undefined && show._embedded.show.type !== '' 
      ? show._embedded.show.type 
      : (show.show?.type !== undefined && show.show.type !== '' 
        ? show.show.type 
        : (show.type !== undefined && show.type !== '' ? show.type : '')),
    language: show._embedded?.show?.language !== undefined ? show._embedded.show.language : 
      (show.show?.language !== undefined ? show.show.language : 
        (show.language !== undefined ? show.language : null)),
    genres: show._embedded?.show?.genres !== undefined ? show._embedded.show.genres : 
      (show.show?.genres !== undefined ? show.show.genres : 
        (show.genres !== undefined ? show.genres : [])),
    network: show._embedded?.show?.network !== undefined ? show._embedded.show.network : 
      (show.show?.network !== undefined ? show.show.network : 
        (show.network !== undefined ? show.network : null)),
    webChannel: show._embedded?.show?.webChannel !== undefined 
      ? show._embedded.show.webChannel 
      : (show.show?.webChannel !== undefined ? show.show.webChannel : null),
    image: show._embedded?.show?.image !== undefined ? show._embedded.show.image : 
      (show.show?.image !== undefined ? show.show.image : 
        (show.image !== undefined ? show.image : null)),
    summary: show._embedded?.show?.summary !== undefined && show._embedded.show.summary !== '' 
      ? show._embedded.show.summary 
      : (show.show?.summary !== undefined && show.show.summary !== '' 
        ? show.show.summary 
        : (show.summary !== undefined && show.summary !== '' ? show.summary : ''))
  };

  if (showDetails.name === '') {
    return null;
  }

  return {
    airtime: show.airtime !== undefined && show.airtime !== '' ? show.airtime : '',
    name: show.name !== undefined && show.name !== '' ? show.name : '',
    season: show.season !== undefined && show.season !== '' ? show.season : '',
    number: show.number !== undefined && show.number !== '' ? show.number : '',
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
function applyShowFilters(
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
    const showType = show.show.type !== undefined && show.show.type !== '' ? show.show.type : '';
    const showGenres = show.show.genres !== undefined ? show.show.genres : [];
    const showLanguage = show.show.language !== null && show.show.language !== undefined 
      ? show.show.language 
      : '';
    const showNetwork = show.show.network?.name !== undefined && show.show.network.name !== '' 
      ? show.show.network.name 
      : '';
    const showWebChannel = show.show.webChannel?.name !== undefined 
      && show.show.webChannel.name !== '' 
      ? show.show.webChannel.name 
      : '';

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
  if (name === undefined || name === '') {
    return 'Unknown';
  }
  return name.toLowerCase().trim();
}

/**
 * Sort shows by airtime
 * @param shows Shows to sort
 * @returns Sorted shows array
 */
export function sortShowsByTime(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    // Handle empty airtimes
    if (!a.airtime && !b.airtime) return 0;
    if (!a.airtime) return 1;
    if (!b.airtime) return -1;

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
  return shows.reduce((groups: Record<string, Show[]>, show: Show) => {
    const network = show.show.network?.name;
    const webChannel = show.show.webChannel?.name;
    
    // Use the original network name for the group key, not the normalized version
    const networkName = (network !== undefined && network !== '') 
      ? network 
      : (webChannel !== undefined && webChannel !== '') 
        ? webChannel 
        : 'Unknown';

    if (groups[networkName] === undefined) {
      groups[networkName] = [];
    }
    groups[networkName].push(show);
    return groups;
  }, {});
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
export async function fetchTvShows(options: FetchOptions = {}): Promise<Show[]> {
  try {
    const date = options.date !== undefined && options.date !== '' 
      ? options.date 
      : getTodayDate();
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
