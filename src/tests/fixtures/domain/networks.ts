/**
 * Domain model network fixtures
 * 
 * Provides test fixtures for domain model NetworkGroups
 */
import type { NetworkGroups } from '../../../types/tvShowModel.js';
import { 
  getNetworkShows, 
  getStreamingShows, 
  getCableShows, 
  getEpisodeSequence, 
  getMixedAirtimeShows 
} from './shows.js';

/**
 * Get sample network groups for testing
 * @returns Network groups object for testing
 */
export function getNetworkGroups(): NetworkGroups {
  return {
    broadcast: getNetworkShows(),
    cable: getCableShows(),
    streaming: getStreamingShows()
  };
}

/**
 * Get network groups with mixed airtime shows
 * @returns Network groups with shows having mixed airtime values
 */
export function getMixedAirtimeNetworkGroups(): NetworkGroups {
  const mixedShows = getMixedAirtimeShows();
  return {
    'ABC': mixedShows.filter(show => show.network === 'ABC'),
    'NBC': [
      {
        id: 103,
        name: 'NBC Show with time',
        type: 'scripted',
        language: 'English',
        genres: ['Comedy'],
        network: 'NBC',
        summary: 'An NBC show with airtime',
        airtime: '21:00',
        season: 1,
        number: 1
      },
      {
        id: 104,
        name: 'NBC Show without time',
        type: 'scripted',
        language: 'English',
        genres: ['Comedy'],
        network: 'NBC',
        summary: 'An NBC show without airtime',
        airtime: '',
        season: 1,
        number: 2
      }
    ]
  };
}

/**
 * Get network groups with multiple episodes
 * @returns Network groups with multiple episodes for some shows
 */
export function getMultiEpisodeNetworkGroups(): NetworkGroups {
  return {
    'ABC': getEpisodeSequence(3, 1, 1).map(show => ({
      ...show,
      name: 'Show with multiple episodes',
      network: 'ABC'
    })),
    'NBC': [
      {
        id: 201,
        name: 'Single episode show',
        type: 'scripted',
        language: 'English',
        genres: ['Comedy'],
        network: 'NBC',
        summary: 'A single episode show',
        airtime: '21:00',
        season: 1,
        number: 1
      }
    ]
  };
}
