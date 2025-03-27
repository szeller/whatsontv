/**
 * Test fixtures index
 * 
 * Exports all test fixtures from a single entry point
 */
import * as domainShows from './domain/shows.js';
import * as domainNetworks from './domain/networks.js';
import * as tvmazeModels from './tvmaze/models.js';
import { loadFixture, loadFixtureString, getFixturePath } from '../helpers/fixtureLoader.js';

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
    getFixturePath
  },

  /**
   * Domain model test fixtures
   */
  domain: {
    ...domainShows,
    ...domainNetworks
  },

  /**
   * TVMaze API test fixtures
   */
  tvMaze: {
    ...tvmazeModels
  }
};

// Export individual modules for direct imports
export { domainShows, domainNetworks, tvmazeModels };

// Export types for convenience
export type { Show, NetworkGroups } from '../../types/tvShowModel.js';

// Legacy compatibility exports
/**
 * @deprecated Use Fixtures.domain instead
 */
export class DomainFixtures {
  static getNetworkShows = domainShows.getNetworkShows;
  static getStreamingShows = domainShows.getStreamingShows;
  static getNetworkGroups = domainNetworks.getNetworkGroups;
}

/**
 * @deprecated Use Fixtures.tvMaze instead
 */
export class TvMazeFixtures {
  static getSchedule = tvmazeModels.getSchedule;
  static getScheduleString = tvmazeModels.getScheduleString;
  static getNetworkSchedule = tvmazeModels.getNetworkSchedule;
  static getWebSchedule = tvmazeModels.getWebSchedule;
  static getCombinedSchedule = tvmazeModels.getCombinedSchedule;
  static loadNetworkShows = tvmazeModels.loadNetworkShows;
  static loadWebShows = tvmazeModels.loadWebShows;
  static loadCombinedShows = tvmazeModels.loadCombinedShows;
}
