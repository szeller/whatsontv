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
    // Handle shows with no airtime
    if (!a.airtime && !b.airtime) return 0;
    if (!a.airtime) return 1;
    if (!b.airtime) return -1;
    
    // Convert airtime to minutes for comparison
    const getMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    return getMinutes(a.airtime) - getMinutes(b.airtime);
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
 * Normalize show data to a consistent format
 * @param show - Show data to normalize
 * @returns Normalized show data
 */
export function normalizeShowData(show: Partial<TVMazeShow>): Show {
  // If the show already has a complete structure, preserve it
  if (
    show.name !== undefined && 
    show.season !== undefined && 
    show.number !== undefined && 
    show.airtime !== undefined && 
    show.show !== undefined
  ) {
    return show as Show;
  }

  // Otherwise, fill in missing data with defaults
  return {
    name: show.name !== undefined && show.name !== null ? show.name : '',
    season: show.season !== undefined && show.season !== null ? Number(show.season) : 0,
    number: show.number !== undefined && show.number !== null ? Number(show.number) : 0,
    airtime: show.airtime !== undefined && show.airtime !== null ? show.airtime : '',
    show: show.show !== undefined && show.show !== null ? show.show : {
      name: show.name !== undefined && show.name !== null ? show.name : '',
      type: show.type !== undefined && show.type !== null ? show.type : '',
      language: show.language !== undefined && show.language !== null ? show.language : '',
      genres: show.genres !== undefined && show.genres !== null ? show.genres : [],
      network: show.network !== undefined && show.network !== null ? show.network : null,
      webChannel: 
        show.webChannel !== undefined && show.webChannel !== null ? 
          show.webChannel : null,
      image: show.image !== undefined && show.image !== null ? show.image : null,
      summary: show.summary !== undefined && show.summary !== null ? show.summary : ''
    }
  };
}
