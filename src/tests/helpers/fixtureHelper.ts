/**
 * Test fixture helper utilities
 * 
 * Provides easy access to test fixtures for use in tests
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import type { Show, NetworkGroups } from '../../types/tvShowModel.js';
import { transformSchedule } from '../../utils/tvMazeUtils.js';

// Get the directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Path to the fixtures directory
const fixturesDir = path.resolve(__dirname, '../fixtures');

/**
 * Get the path to a fixture file
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @returns The full path to the fixture file
 */
export function getFixturePath(relativePath: string): string {
  return path.join(fixturesDir, relativePath);
}

/**
 * Load a fixture file
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @returns The parsed JSON content of the fixture file
 */
export function loadFixture<T>(relativePath: string): T {
  const fullPath = getFixturePath(relativePath);
  const fileContent = fs.readFileSync(fullPath, 'utf-8');
  return JSON.parse(fileContent) as T;
}

/**
 * Load raw fixture content as a string
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @returns The raw file content as a string
 */
export function loadFixtureString(relativePath: string): string {
  const fullPath = getFixturePath(relativePath);
  return fs.readFileSync(fullPath, 'utf-8');
}

/**
 * Consolidated test fixtures for the application
 * Combines TVMaze API fixtures and domain model fixtures
 */
export class Fixtures {
  /**
   * TVMaze API test fixtures
   */
  static tvMaze = {
    /**
     * Get schedule fixture data as a parsed JSON object
     * @param name Base name of the fixture file (without .json extension)
     * @returns Parsed JSON data from the fixture
     */
    getSchedule(
      name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
    ): Record<string, unknown>[] {
      return loadFixture<Record<string, unknown>[]>(`tvmaze/${name}.json`);
    },

    /**
     * Get raw schedule fixture content as a string
     * @param name Base name of the fixture file (without .json extension)
     * @returns Raw fixture content as a string
     */
    getScheduleString(
      name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
    ): string {
      return loadFixtureString(`tvmaze/${name}.json`);
    },

    /**
     * Load network schedule fixture and transform to domain model
     * @returns Array of transformed Show objects
     */
    loadNetworkShows(): Show[] {
      const data = this.getSchedule('network-schedule');
      return transformSchedule(data);
    },

    /**
     * Load web schedule fixture and transform to domain model
     * @returns Array of transformed Show objects
     */
    loadWebShows(): Show[] {
      const data = this.getSchedule('web-schedule');
      return transformSchedule(data);
    },

    /**
     * Load combined schedule fixture and transform to domain model
     * @returns Array of transformed Show objects
     */
    loadCombinedShows(): Show[] {
      const data = this.getSchedule('combined-schedule');
      return transformSchedule(data);
    }
  };

  /**
   * Domain model test fixtures
   */
  static domain = {
    /**
     * Get sample network shows for testing
     * @returns Array of network shows in domain model format
     */
    getNetworkShows(): Show[] {
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
    },

    /**
     * Get sample streaming shows for testing
     * @returns Array of streaming shows in domain model format
     */
    getStreamingShows(): Show[] {
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
    },

    /**
     * Get sample network groups for testing
     * @returns Network groups object for testing
     */
    getNetworkGroups(): NetworkGroups {
      return {
        broadcast: [
          this.getNetworkShows()[0],
          this.getNetworkShows()[1]
        ],
        cable: [
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
        ],
        streaming: [
          this.getStreamingShows()[0],
          this.getStreamingShows()[1]
        ]
      };
    }
  };
}
