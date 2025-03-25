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
   * Get fixture data as a parsed JSON object
   * @param name Base name of the fixture file (without .json extension)
   * @returns Parsed JSON data from the fixture
   */
  static getSchedule(
    name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
  ): Record<string, unknown>[] {
    return loadFixture<Record<string, unknown>[]>(`${name}.json`);
  }

  /**
   * Get raw fixture content as a string
   * @param name Base name of the fixture file (without .json extension)
   * @returns Raw fixture content as a string
   */
  static getScheduleString(
    name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
  ): string {
    return loadFixtureString(`${name}.json`);
  }

  /**
   * Get the fixture file path
   * @param filename The filename in the tvmaze fixtures directory
   * @returns The full path to the fixture file
   */
  static getFixturePath(filename: string): string {
    return getFixturePath(filename);
  }

  // Convenience methods that use the new generic methods
  static getNetworkSchedule(): Record<string, unknown>[] {
    return this.getSchedule('network-schedule');
  }

  static getWebSchedule(): Record<string, unknown>[] {
    return this.getSchedule('web-schedule');
  }

  static getCombinedSchedule(): Record<string, unknown>[] {
    return this.getSchedule('combined-schedule');
  }

  static getNetworkScheduleString(): string {
    return this.getScheduleString('network-schedule');
  }

  static getWebScheduleString(): string {
    return this.getScheduleString('web-schedule');
  }

  static getCombinedScheduleString(): string {
    return this.getScheduleString('combined-schedule');
  }
}
