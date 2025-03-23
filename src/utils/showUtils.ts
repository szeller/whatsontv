/**
 * Utility functions for working with TV show data
 * These functions are independent of the API used to fetch the shows
 */

import type { NetworkGroups } from '../types/app.js';
import type { Show, TVMazeShow } from '../types/tvmaze.js';

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
 * @param tvMazeShow - Raw TVMaze show data
 * @returns Normalized Show object
 */
export function normalizeShowData(tvMazeShow: TVMazeShow): Show {
  // Ensure show property exists
  if (!tvMazeShow.show) {
    throw new Error('Invalid TVMaze show data: show property is missing');
  }

  // Create a normalized copy of the show data
  const normalizedShow: Show = {
    // Ensure required string properties are never undefined
    airtime: tvMazeShow.airtime !== undefined && tvMazeShow.airtime !== null && 
      tvMazeShow.airtime !== '' 
      ? tvMazeShow.airtime 
      : '',
    name: tvMazeShow.name !== undefined && tvMazeShow.name !== null && 
      tvMazeShow.name !== '' 
      ? tvMazeShow.name 
      : '',
    season: typeof tvMazeShow.season === 'number' 
      ? tvMazeShow.season 
      : (typeof tvMazeShow.season === 'string' && tvMazeShow.season !== '' 
        ? parseInt(tvMazeShow.season, 10) 
        : 0),
    number: typeof tvMazeShow.number === 'number' 
      ? tvMazeShow.number 
      : (typeof tvMazeShow.number === 'string' && tvMazeShow.number !== '' 
        ? parseInt(tvMazeShow.number, 10) 
        : 0),
    show: {
      ...tvMazeShow.show,
      // Ensure consistent data structure even when fields are missing
      network: tvMazeShow.show.network !== undefined && tvMazeShow.show.network !== null 
        ? tvMazeShow.show.network 
        : null,
      webChannel: tvMazeShow.show.webChannel !== undefined && 
        tvMazeShow.show.webChannel !== null 
        ? tvMazeShow.show.webChannel 
        : null,
      type: tvMazeShow.show.type !== undefined && tvMazeShow.show.type !== null && 
        tvMazeShow.show.type !== '' 
        ? tvMazeShow.show.type 
        : 'Unknown',
      name: tvMazeShow.show.name !== undefined && tvMazeShow.show.name !== null && 
        tvMazeShow.show.name !== '' 
        ? tvMazeShow.show.name 
        : 'Unknown Show',
      // Ensure language is either a string or null, not undefined
      language: tvMazeShow.show.language !== undefined && tvMazeShow.show.language !== null 
        ? tvMazeShow.show.language 
        : null,
      // Ensure other required properties are never undefined
      genres: Array.isArray(tvMazeShow.show.genres) ? tvMazeShow.show.genres : [],
      image: tvMazeShow.show.image !== undefined && tvMazeShow.show.image !== null 
        ? tvMazeShow.show.image 
        : null,
      summary: tvMazeShow.show.summary !== undefined && 
        tvMazeShow.show.summary !== null && tvMazeShow.show.summary !== '' 
        ? tvMazeShow.show.summary 
        : ''
    }
  };

  return normalizedShow;
}
