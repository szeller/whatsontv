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
