/**
 * Domain model show fixtures
 * 
 * Provides test fixtures for domain model Show objects
 */
import type { Show } from '../../../types/tvShowModel.js';

/**
 * Get sample network shows for testing
 * @returns Array of network shows in domain model format
 */
export function getNetworkShows(): Show[] {
  return [
    {
      id: 1,
      name: 'Sample Network Show 1',
      type: 'scripted',
      language: 'English',
      genres: ['Drama', 'Action'],
      network: 'ABC',
      summary: 'A sample network show for testing',
      airtime: '20:00',
      season: 1,
      number: 1
    },
    {
      id: 2,
      name: 'Sample Network Show 2',
      type: 'reality',
      language: 'English',
      genres: ['Reality'],
      network: 'NBC',
      summary: 'Another sample network show for testing',
      airtime: '21:00',
      season: 2,
      number: 3
    }
  ];
}

/**
 * Get sample streaming shows for testing
 * @returns Array of streaming shows in domain model format
 */
export function getStreamingShows(): Show[] {
  return [
    {
      id: 3,
      name: 'Sample Streaming Show 1',
      type: 'scripted',
      language: 'English',
      genres: ['Drama', 'Sci-Fi'],
      network: 'Netflix',
      summary: 'A sample streaming show for testing',
      airtime: '',
      season: 1,
      number: 1
    },
    {
      id: 4,
      name: 'Sample Streaming Show 2',
      type: 'reality',
      language: 'English',
      genres: ['Reality'],
      network: 'Hulu',
      summary: 'Another sample streaming show for testing',
      airtime: '',
      season: 3,
      number: 5
    }
  ];
}

/**
 * Get sample cable shows for testing
 * @returns Array of cable shows in domain model format
 */
export function getCableShows(): Show[] {
  return [
    {
      id: 5,
      name: 'Sample Cable Show 1',
      type: 'scripted',
      language: 'English',
      genres: ['Drama', 'Crime'],
      network: 'HBO',
      summary: 'A sample cable show for testing',
      airtime: '22:00',
      season: 2,
      number: 4
    },
    {
      id: 6,
      name: 'Sample Cable Show 2',
      type: 'talk show',
      language: 'English',
      genres: ['Talk Show'],
      network: 'Showtime',
      summary: 'Another sample cable show for testing',
      airtime: '23:00',
      season: 5,
      number: 12
    }
  ];
}

/**
 * Get all sample shows for testing
 * @returns Combined array of all show types
 */
export function getAllShows(): Show[] {
  return [
    ...getNetworkShows(),
    ...getStreamingShows(),
    ...getCableShows()
  ];
}

/**
 * Get sample shows with specific episode sequences
 * @param count Number of episodes to create
 * @param season Season number
 * @param startNumber Starting episode number
 * @returns Array of sequential episode shows
 */
export function getEpisodeSequence(
  count: number,
  season = 1,
  startNumber = 1
): Show[] {
  return Array.from({ length: count }, (_, index) => ({
    id: 1000 + index,
    name: `Episode ${startNumber + index}`,
    type: 'scripted',
    language: 'English',
    genres: ['Drama'],
    network: 'ABC',
    summary: 'A test episode in a sequence',
    airtime: '',
    season,
    number: startNumber + index
  }));
}

/**
 * Get sample shows with mixed airtime values
 * @returns Array of shows with and without airtimes
 */
export function getMixedAirtimeShows(): Show[] {
  return [
    {
      id: 101,
      name: 'Show with time',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'ABC',
      summary: 'A show with airtime',
      airtime: '20:00',
      season: 1,
      number: 1
    },
    {
      id: 102,
      name: 'Show without time',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'ABC',
      summary: 'A show without airtime',
      airtime: '',
      season: 1,
      number: 2
    }
  ];
}
