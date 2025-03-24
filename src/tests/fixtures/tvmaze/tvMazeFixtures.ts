/**
 * TVMaze API test fixtures utility
 * 
 * Provides easy access to TVMaze API test fixtures for use in tests
 */
import { readFileSync } from 'fs';
import { join } from 'path';

/**
 * Load fixture data from a JSON file
 * @param filename The filename to load from the tvmaze fixtures directory
 * @returns The parsed JSON data
 */
function loadFixture<T>(filename: string): T {
  const filePath = join(process.cwd(), 'src/tests/fixtures/tvmaze', filename);
  return JSON.parse(readFileSync(filePath, 'utf-8')) as T;
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
}
