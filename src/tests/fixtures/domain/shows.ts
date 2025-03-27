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
      genres: ['Comedy', 'Drama'],
      network: 'Netflix',
      summary: 'A sample streaming show for testing',
      airtime: null,
      season: 1,
      number: 1
    },
    {
      id: 4,
      name: 'Sample Streaming Show 2',
      type: 'documentary',
      language: 'English',
      genres: ['Documentary'],
      network: 'Hulu',
      summary: 'Another sample streaming show for testing',
      airtime: null,
      season: 1,
      number: 2
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
      name: 'Sample Cable Show',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'HBO',
      summary: 'A sample cable show for testing',
      airtime: '21:00',
      season: 1,
      number: 1
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
