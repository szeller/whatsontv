/**
 * Test fixtures index
 *
 * Exports all test fixtures from a single entry point
 */
import {
  getNetworkShows,
  getStreamingShows,
  getCableShows,
  getAllShows,
  getEpisodeSequence,
  getMixedAirtimeShows
} from './domain/shows.js';
import {
  getNetworkGroups,
  getMixedAirtimeNetworkGroups,
  getMultiEpisodeNetworkGroups
} from './domain/networks.js';
import {
  getSchedule,
  getNetworkSchedule,
  getWebSchedule,
  getCombinedSchedule,
  getScheduleString,
  loadNetworkShows,
  loadWebShows,
  loadCombinedShows
} from './tvmaze/models.js';
import {
  loadFixture,
  loadFixtureString,
  getFixturePath,
  loadValidatedFixture,
  loadValidatedArrayFixture
} from '../helpers/fixtureHelper.js';

/**
 * Consolidated test fixtures for the application
 */
export const Fixtures = {
  /**
   * Core fixture loading utilities
   */
  utils: {
    loadFixture,
    loadFixtureString,
    getFixturePath,
    loadValidatedFixture,
    loadValidatedArrayFixture
  },

  /**
   * Domain model test fixtures
   */
  domain: {
    getNetworkShows,
    getStreamingShows,
    getCableShows,
    getAllShows,
    getEpisodeSequence,
    getMixedAirtimeShows,
    getNetworkGroups,
    getMixedAirtimeNetworkGroups,
    getMultiEpisodeNetworkGroups
  },

  /**
   * TVMaze API test fixtures
   */
  tvMaze: {
    getSchedule,
    getNetworkSchedule,
    getWebSchedule,
    getCombinedSchedule,
    getScheduleString,
    loadNetworkShows,
    loadWebShows,
    loadCombinedShows
  }
};

// Export individual modules for direct imports


// Export types for convenience
export type { Show, NetworkGroups } from '../../schemas/domain.js';
