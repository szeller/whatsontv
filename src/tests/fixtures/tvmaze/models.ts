/**
 * TVMaze API model fixtures
 * 
 * Provides test fixtures for TVMaze API models and transformations
 */
import { transformSchedule } from '../../../utils/tvMazeUtils.js';
import type { Show } from '../../../types/tvShowModel.js';
import { loadFixture } from '../../helpers/fixtureLoader.js';

/**
 * Get TVMaze schedule fixture data as a parsed JSON object
 * @param name Base name of the fixture file (without .json extension)
 * @returns Parsed JSON data from the fixture
 */
export function getSchedule(
  name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
): Record<string, unknown>[] {
  return loadFixture<Record<string, unknown>[]>(`tvmaze/${name}.json`);
}

/**
 * Get network schedule fixture data
 * @returns Network schedule fixture data
 */
export function getNetworkSchedule(): Record<string, unknown>[] {
  return getSchedule('network-schedule');
}

/**
 * Get web schedule fixture data
 * @returns Web schedule fixture data
 */
export function getWebSchedule(): Record<string, unknown>[] {
  return getSchedule('web-schedule');
}

/**
 * Get combined schedule fixture data
 * @returns Combined schedule fixture data
 */
export function getCombinedSchedule(): Record<string, unknown>[] {
  return getSchedule('combined-schedule');
}

/**
 * Get raw TVMaze schedule fixture content as a string
 * @param name Base name of the fixture file (without .json extension)
 * @returns Raw fixture content as a string
 */
export function getScheduleString(
  name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
): string {
  return loadFixture<string>(`tvmaze/${name}.json`);
}

/**
 * Load network schedule fixture and transform to domain model
 * @returns Array of transformed Show objects
 */
export function loadNetworkShows(): Show[] {
  const data = getSchedule('network-schedule');
  return transformSchedule(data);
}

/**
 * Load web schedule fixture and transform to domain model
 * @returns Array of transformed Show objects
 */
export function loadWebShows(): Show[] {
  const data = getSchedule('web-schedule');
  return transformSchedule(data);
}

/**
 * Load combined schedule fixture and transform to domain model
 * @returns Array of transformed Show objects
 */
export function loadCombinedShows(): Show[] {
  const data = getSchedule('combined-schedule');
  return transformSchedule(data);
}
