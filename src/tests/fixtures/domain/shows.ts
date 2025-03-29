/**
 * Domain model show fixtures
 * 
 * Provides test fixtures for domain model Show objects
 */
import { loadValidatedArrayFixture } from '../../helpers/fixtureHelper.js';
import { showSchema } from '../../../schemas/domain.js';
import type { Show } from '../../../schemas/domain.js';

/**
 * Get sample network shows for testing
 * @returns Array of network shows in domain model format
 */
export function getNetworkShows(): Show[] {
  return loadValidatedArrayFixture(showSchema, 'domain/network-shows.json');
}

/**
 * Get sample streaming shows for testing
 * @returns Array of streaming shows in domain model format
 */
export function getStreamingShows(): Show[] {
  return loadValidatedArrayFixture(showSchema, 'domain/streaming-shows.json');
}

/**
 * Get sample cable shows for testing
 * @returns Array of cable shows in domain model format
 */
export function getCableShows(): Show[] {
  return loadValidatedArrayFixture(showSchema, 'domain/cable-shows.json');
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
  const episodes: Show[] = [];
  
  for (let i = 0; i < count; i++) {
    episodes.push({
      id: 100 + i,
      name: `Episode ${startNumber + i}`,
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: `Test episode ${startNumber + i} for season ${season}`,
      airtime: '20:00',
      season,
      number: startNumber + i
    });
  }
  
  return episodes;
}

/**
 * Get sample shows with mixed airtime values
 * @returns Array of shows with and without airtimes
 */
export function getMixedAirtimeShows(): Show[] {
  return [
    {
      id: 201,
      name: 'Show with airtime',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: 'Show with a valid airtime',
      airtime: '20:00',
      season: 1,
      number: 1
    },
    {
      id: 202,
      name: 'Show without airtime',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: 'Show with an empty airtime',
      airtime: '',
      season: 1,
      number: 2
    },
    {
      id: 203,
      name: 'Show with null airtime',
      type: 'scripted',
      language: 'English',
      genres: ['Drama'],
      network: 'Test Network',
      summary: 'Show with a null airtime',
      airtime: null,
      season: 1,
      number: 3
    }
  ];
}
