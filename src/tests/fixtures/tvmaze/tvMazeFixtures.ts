/**
 * TVMaze API test fixtures utility
 * 
 * Provides easy access to TVMaze API test fixtures for use in tests
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Get the path to a fixture file
 * @param filename The filename in the tvmaze fixtures directory
 * @returns The full path to the fixture file
 */
function getFixturePath(filename: string): string {
  return join(process.cwd(), 'src/tests/fixtures/tvmaze', filename);
}

/**
 * Load fixture data from a JSON file
 * @param filename The filename to load from the tvmaze fixtures directory
 * @returns The parsed JSON data
 */
function loadFixture<T>(filename: string): T {
  const filePath = getFixturePath(filename);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
}

/**
 * Load raw fixture content as a string
 * @param filename The filename to load from the tvmaze fixtures directory
 * @returns The raw file content as a string
 */
function loadFixtureString(filename: string): string {
  const filePath = getFixturePath(filename);
  return readFileSync(filePath, 'utf-8');
}

/**
 * TVMaze API test fixtures
 */
export class TvMazeFixtures {
  /**
   * Get network schedule items from fixture data
   * @returns Array of network schedule items
   */
  static getNetworkSchedule(): Record<string, unknown>[] {
    return loadFixture<Record<string, unknown>[]>('network-schedule.json');
  }

  /**
   * Get web schedule items from fixture data
   * @returns Array of web schedule items
   */
  static getWebSchedule(): Record<string, unknown>[] {
    return loadFixture<Record<string, unknown>[]>('web-schedule.json');
  }

  /**
   * Get combined schedule items from fixture data
   * @returns Array of combined schedule items
   */
  static getCombinedSchedule(): Record<string, unknown>[] {
    return loadFixture<Record<string, unknown>[]>('combined-schedule.json');
  }
  
  /**
   * Get raw network schedule fixture content as a string
   * @returns The raw network schedule fixture content
   */
  static getNetworkScheduleString(): string {
    return loadFixtureString('network-schedule.json');
  }
  
  /**
   * Get raw web schedule fixture content as a string
   * @returns The raw web schedule fixture content
   */
  static getWebScheduleString(): string {
    return loadFixtureString('web-schedule.json');
  }
  
  /**
   * Get raw combined schedule fixture content as a string
   * @returns The raw combined schedule fixture content
   */
  static getCombinedScheduleString(): string {
    return loadFixtureString('combined-schedule.json');
  }
  
  /**
   * Get the fixture file path
   * @param filename The filename in the tvmaze fixtures directory
   * @returns The full path to the fixture file
   */
  static getFixturePath(filename: string): string {
    return getFixturePath(filename);
  }
}
