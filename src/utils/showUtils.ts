/**
 * Utility functions for working with TV show data
 * These functions are independent of the API used to fetch the shows
 */

import type { Show } from '../types/tvShowModel.js';
import { convertTimeToMinutes } from './dateUtils.js';

/**
 * Type for grouping shows by network
 */
export type NetworkGroups = Record<string, Show[]>;

/**
 * Group shows by their network
 * @param shows - Array of shows to group
 * @returns Object with network names as keys and arrays of shows as values
 */
export function groupShowsByNetwork(shows: Show[]): NetworkGroups {
  const groups: NetworkGroups = {};
  
  for (const show of shows) {
    // Get the network name from our simplified model
    const networkName = show.network ?? 'Unknown Network';
    
    if (!Object.prototype.hasOwnProperty.call(groups, networkName)) {
      groups[networkName] = [];
    }
    
    groups[networkName].push(show);
  }
  
  return groups;
}

/**
 * Sort episodes by season and episode number
 * @param a - First episode
 * @param b - Second episode
 * @returns Comparison result (-1, 0, or 1)
 */
export function compareEpisodes(a: Show, b: Show): number {
  // Sort by season first
  if (a.season !== b.season) {
    return a.season - b.season;
  }
  // Then by episode number
  return a.number - b.number;
}

/**
 * Sort shows by their airtime
 * @param shows - Array of shows to sort
 * @returns Sorted array of shows
 */
export function sortShowsByTime(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    // Handle null/undefined airtimes
    const aTime = a.airtime !== null && a.airtime !== '' ? a.airtime : '';
    const bTime = b.airtime !== null && b.airtime !== '' ? b.airtime : '';
    
    // If both shows have airtimes, sort by time
    if (aTime !== '' && bTime !== '') {
      // Convert times to minutes for comparison
      const aMinutes = convertTimeToMinutes(aTime);
      const bMinutes = convertTimeToMinutes(bTime);
      
      // If times are different, sort by time
      if (aMinutes !== bMinutes) {
        return aMinutes - bMinutes;
      }
      
      // If times are the same, sort by name, then by episode
      if (a.name === b.name) {
        // Use the episode comparison function
        return compareEpisodes(a, b);
      }
      return a.name.localeCompare(b.name);
    }
    
    // If only one show has an airtime, prioritize it
    if (aTime !== '' && bTime === '') return -1;
    if (aTime === '' && bTime !== '') return 1;
    
    // If neither show has an airtime, sort by name, then by episode
    if (a.name === b.name) {
      // Use the episode comparison function
      return compareEpisodes(a, b);
    }
    return a.name.localeCompare(b.name);
  });
}

/**
 * Format time string to 12-hour format
 * @param time - Time string in HH:MM format
 * @returns Formatted time string
 */
export function formatTime(time: string | null): string {
  if (time === null || time === '') {
    return 'N/A';
  }
  
  // Parse hours and minutes
  const [hoursStr, minutesStr] = time.split(':');
  
  if (hoursStr === undefined || minutesStr === undefined) {
    return 'N/A';
  }
  
  const hours = parseInt(hoursStr, 10);
  const minutes = minutesStr;
  
  // Convert to 12-hour format
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12; // Convert 0 to 12 for 12 AM
  
  return `${hours12}:${minutes} ${period}`;
}

/**
 * Format episodes into a compact representation with ranges
 * @param episodes - Array of episodes to format
 * @returns Formatted episode string with ranges (e.g., "S1E1-3, S1E5, S2E1-2")
 */
export function formatEpisodeRanges(episodes: Show[]): string {
  if (episodes.length === 0) {
    return '';
  }
  
  // Sort episodes by season and episode number
  const sortedEpisodes = [...episodes].sort(compareEpisodes);
  
  // Group episodes by season
  const seasonGroups: Record<number, number[]> = {};
  
  for (const episode of sortedEpisodes) {
    if (!Object.prototype.hasOwnProperty.call(seasonGroups, episode.season)) {
      seasonGroups[episode.season] = [];
    }
    seasonGroups[episode.season].push(episode.number);
  }
  
  // Format each season's episodes with ranges
  const formattedSeasons: string[] = [];
  
  for (const season of Object.keys(seasonGroups).map(Number).sort((a, b) => a - b)) {
    const episodeNumbers = seasonGroups[season];
    const ranges: string[] = [];
    
    let rangeStart = episodeNumbers[0];
    let rangeEnd = rangeStart;
    
    // Detect ranges using a sliding window approach
    for (let i = 1; i < episodeNumbers.length; i++) {
      const current = episodeNumbers[i];
      const previous = episodeNumbers[i - 1];
      
      // If current episode follows the previous one sequentially
      if (current === previous + 1) {
        rangeEnd = current;
      } else {
        // End of a range, add it to the result
        ranges.push(formatRange(season, rangeStart, rangeEnd));
        // Start a new range
        rangeStart = current;
        rangeEnd = current;
      }
    }
    
    // Add the last range
    ranges.push(formatRange(season, rangeStart, rangeEnd));
    
    // Join all ranges for this season
    formattedSeasons.push(ranges.join(', '));
  }
  
  // Join all seasons
  return formattedSeasons.join(', ');
}

/**
 * Format a single episode range
 * @param season - Season number
 * @param start - Starting episode number
 * @param end - Ending episode number
 * @returns Formatted range string
 */
function formatRange(season: number, start: number, end: number): string {
  if (start === end) {
    // Single episode
    return `S${season}E${start}`;
  } else {
    // Episode range
    return `S${season}E${start}-${end}`;
  }
}

/**
 * Filter shows by type
 * @param shows - Shows to filter
 * @param types - Types to include
 * @returns Filtered shows
 */
export function filterByType(shows: Show[], types: string[]): Show[] {
  if (types === undefined || types === null || types.length === 0) {
    return shows;
  }
  
  return shows.filter(show => {
    const showType = show.type.toLowerCase();
    return types.some(type => showType === type.toLowerCase());
  });
}

/**
 * Filter shows by network
 * @param shows - Shows to filter
 * @param networks - Networks to include
 * @returns Filtered shows
 */
export function filterByNetwork(shows: Show[], networks: string[]): Show[] {
  if (networks === undefined || networks === null || networks.length === 0) {
    return shows;
  }
  
  return shows.filter(show => {
    // In our new model, network is a string
    const networkName = show.network !== null ? show.network : '';
    
    // If network name is empty, this show won't match any network filter
    if (networkName === '') {
      return false;
    }
    
    // Check if the network name matches any of the networks
    // This works for both traditional networks and streaming services
    return networks.some(network => 
      networkName.toLowerCase().includes(network.toLowerCase())
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
  if (genres === undefined || genres === null || genres.length === 0) {
    return shows;
  }
  
  return shows.filter(show => {
    const showGenres = show.genres !== undefined && show.genres !== null 
      ? show.genres 
      : [];
    
    return genres.some(genre => 
      showGenres.some(showGenre => 
        showGenre.toLowerCase() === genre.toLowerCase()
      )
    );
  });
}

/**
 * Filter shows by language
 * @param shows - Shows to filter
 * @param languages - Languages to include
 * @returns Filtered shows
 */
export function filterByLanguage(shows: Show[], languages: string[]): Show[] {
  // If no languages are specified, return all shows
  if (languages === undefined || languages === null || languages.length === 0) {
    return shows;
  }
  
  // Convert languages to lowercase for case-insensitive comparison
  const lowercaseLanguages = languages.map(lang => lang.toLowerCase());
  
  return shows.filter(show => {
    // If show has no language, skip it
    if (show.language === null || show.language === undefined || show.language === '') {
      return false;
    }
    
    // Check if the show's language is in the list of languages to include
    return lowercaseLanguages.includes(show.language.toLowerCase());
  });
}

/**
 * Filter shows by country (based on network country)
 * @param shows - Shows to filter
 * @param _country - Country code to filter by
 * @returns Filtered shows
 */
export function filterByCountry(shows: Show[], _country: string): Show[] {
  // This is a placeholder implementation that would need to be updated
  // when country information is added to the Show model
  // For now, we don't filter by country since we don't have that data
  return shows;
}
