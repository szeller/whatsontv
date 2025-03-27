/**
 * Domain model network fixtures
 * 
 * Provides test fixtures for domain model NetworkGroups
 */
import type { NetworkGroups } from '../../../types/tvShowModel.js';
import { getNetworkShows, getStreamingShows, getCableShows } from './shows.js';

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
