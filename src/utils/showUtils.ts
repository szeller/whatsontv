/**
 * Utility functions for working with TV show data
 * These functions are independent of the API used to fetch the shows
 */

import type { NetworkGroups } from '../types/app.js';
import type { Show, TVMazeShow, ShowDetails } from '../types/tvmaze.js';

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
 * Group shows by their network
 * @param shows - Array of shows to group
 * @returns Object with network names as keys and arrays of shows as values
 */
export function groupShowsByNetwork(shows: Show[]): NetworkGroups {
  const groups: NetworkGroups = {};
  
  for (const show of shows) {
    // Explicitly handle null/undefined/empty cases for network and webChannel names
    const networkName = 
      (show.show.network?.name !== undefined && 
       show.show.network?.name !== null && 
       show.show.network?.name !== '') ? show.show.network.name : 
        ((show.show.webChannel?.name !== undefined && 
       show.show.webChannel?.name !== null && 
       show.show.webChannel?.name !== '') ? show.show.webChannel.name : 
          'Unknown Network');
    
    if (!Object.prototype.hasOwnProperty.call(groups, networkName)) {
      groups[networkName] = [];
    }
    
    if (Object.prototype.hasOwnProperty.call(groups, networkName)) {
      groups[networkName].push(show);
    }
  }
  
  return groups;
}

/**
 * Sort shows by their airtime
 * @param shows - Array of shows to sort
 * @returns Sorted array of shows
 */
export function sortShowsByTime(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    // Handle undefined or null airtimes
    if (!a.airtime && !b.airtime) return 0;
    if (!a.airtime) return 1;
    if (!b.airtime) return -1;
    
    // Parse time strings into comparable values
    const [aHours, aMinutes] = a.airtime.split(':').map(Number);
    const [bHours, bMinutes] = b.airtime.split(':').map(Number);
    
    // Compare hours first, then minutes
    if (aHours !== bHours) {
      return aHours - bHours;
    }
    return aMinutes - bMinutes;
  });
}

/**
 * Format time string to 12-hour format
 * @param time - Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string | undefined): string {
  // Explicitly handle null, undefined, and empty string cases
  if (time === undefined || time === null || time === '') {
    return 'TBA';
  }
  
  const match = time.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return 'TBA';
  
  const [_, hourStr, minute] = match;
  const hour = parseInt(hourStr, 10);
  
  if (hour === 0) {
    return `12:${minute} AM`;
  } else if (hour < 12) {
    return `${hour}:${minute} AM`;
  } else if (hour === 12) {
    return `12:${minute} PM`;
  } else {
    return `${hour - 12}:${minute} PM`;
  }
}

/**
 * Filter shows by type
 * @param shows - Shows to filter
 * @param types - Types to include
 * @returns Filtered shows
 */
export function filterByType(shows: Show[], types: string[]): Show[] {
  if (!types.length) {
    return shows;
  }
  
  return shows.filter(show => {
    const showType = show.show.type;
    return showType !== undefined && showType !== null && types.includes(showType);
  });
}

/**
 * Filter shows by network
 * @param shows - Shows to filter
 * @param networks - Networks to include
 * @returns Filtered shows
 */
export function filterByNetwork(shows: Show[], networks: string[]): Show[] {
  if (!networks.length) {
    return shows;
  }
  
  return shows.filter(show => {
    const networkName = show.show.network?.name;
    const webChannelName = show.show.webChannel?.name;
    
    // Check if either the network name or web channel name matches any of the specified networks
    return (
      (networkName !== undefined && networkName !== null && networks.includes(networkName)) ||
      (webChannelName !== undefined && webChannelName !== null && networks.includes(webChannelName))
    );
  });
}

/**
 * Filter shows by genre
 * @param shows - Shows to filter
 * @param genres - Genres to include
 * @returns Filtered shows
 */
export function filterByGenre(shows: Show[], genres: string[]): Show[] {
  if (!genres.length) {
    return shows;
  }
  
  return shows.filter(show => {
    const showGenres = show.show.genres;
    return showGenres !== undefined && showGenres !== null && 
      showGenres.some(genre => genres.includes(genre));
  });
}

/**
 * Filter shows by language
 * @param shows - Shows to filter
 * @param languages - Languages to include
 * @returns Filtered shows
 */
export function filterByLanguage(shows: Show[], languages: string[]): Show[] {
  if (!languages.length) {
    return shows;
  }
  
  return shows.filter(show => {
    const language = show.show.language;
    return language !== undefined && language !== null && languages.includes(language);
  });
}

/**
 * Normalize TVMaze show data to our internal Show format
 * @param tvMazeData - Raw TVMaze show data
 * @returns Normalized Show object
 */
export function normalizeShowData(tvMazeData: TVMazeShow | { show: TVMazeShow }): Show {
  // Determine if we're dealing with a direct show object or one with a show property
  const rawData = ('show' in tvMazeData ? tvMazeData.show : tvMazeData) as TVMazeShow;

  // Create a default show object for cases where data is missing
  const defaultShow: Show = {
    airtime: '',
    name: '',
    season: 0,
    number: 0,
    show: {
      id: 0,
      name: '',
      type: '',
      language: '',
      genres: [],
      network: null,
      webChannel: null,
      image: null,
      summary: ''
    }
  };

  // Handle the case where rawData might be undefined or null
  if (rawData === null || rawData === undefined) {
    return defaultShow;
  }

  // Extract the show details - either from the show property or from the raw data itself
  const showDetails: ShowDetails = {
    id: typeof rawData.id === 'number' 
      ? rawData.id 
      : (typeof rawData.id === 'string' && rawData.id !== '' 
        ? parseInt(rawData.id, 10) 
        : 0),
    name: rawData.name !== undefined && rawData.name !== null && 
      rawData.name !== '' 
      ? String(rawData.name) 
      : '',
    type: rawData.type !== undefined && rawData.type !== null &&
      rawData.type !== ''
      ? String(rawData.type)
      : '',
    language: rawData.language !== undefined && rawData.language !== null
      ? rawData.language
      : '',
    genres: Array.isArray(rawData.genres) ? rawData.genres : [],
    network: rawData.network !== undefined && rawData.network !== null
      ? rawData.network
      : null,
    webChannel: rawData.webChannel !== undefined && rawData.webChannel !== null
      ? rawData.webChannel
      : null,
    image: rawData.image !== undefined && rawData.image !== null
      ? rawData.image
      : null,
    summary: rawData.summary !== undefined &&
      rawData.summary !== null && rawData.summary !== ''
      ? rawData.summary.replace(/<\/?[^>]+(>|$)/g, '') // Strip HTML tags
      : ''
  };

  // Create a normalized copy of the show data
  const normalizedShow: Show = {
    // Ensure required string properties are never undefined
    airtime: rawData.airtime !== undefined && rawData.airtime !== null && 
      rawData.airtime !== '' 
      ? String(rawData.airtime) 
      : '',
    name: rawData.name !== undefined && rawData.name !== null && 
      rawData.name !== '' 
      ? String(rawData.name) 
      : '',
    season: typeof rawData.season === 'number' 
      ? rawData.season 
      : (typeof rawData.season === 'string' && rawData.season !== '' 
        ? parseInt(rawData.season, 10) 
        : 0),
    number: typeof rawData.number === 'number' 
      ? rawData.number 
      : (typeof rawData.number === 'string' && rawData.number !== '' 
        ? parseInt(rawData.number, 10) 
        : 0),
    show: showDetails
  };

  return normalizedShow;
}
