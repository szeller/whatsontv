/**
 * TVMaze API model fixtures
 * 
 * Provides test fixtures for TVMaze API models and transformations
 */
import { transformSchedule } from '../../../utils/tvMazeUtils.js';
import type { Show } from '../../../types/tvShowModel.js';
import { 
  loadFixtureString,
  loadValidatedArrayFixture 
} from '../../helpers/fixtureHelper.js';
import { 
  networkScheduleItemSchema, 
  webScheduleItemSchema, 
  scheduleItemSchema,
  NetworkScheduleItem,
  WebScheduleItem,
  ScheduleItem
} from '../../../schemas/tvmaze.js';

/**
 * Get TVMaze schedule fixture data as a parsed and validated JSON object
 * @param name Base name of the fixture file (without .json extension)
 * @returns Parsed and validated JSON data from the fixture
 */
export function getSchedule(
  name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
): NetworkScheduleItem[] | WebScheduleItem[] | ScheduleItem[] {
  const fixturePath = `tvmaze/${name}.json`;
  
  if (name === 'network-schedule') {
    return loadValidatedArrayFixture(networkScheduleItemSchema, fixturePath);
  } else if (name === 'web-schedule') {
    return loadValidatedArrayFixture(webScheduleItemSchema, fixturePath);
  } else {
    return loadValidatedArrayFixture(scheduleItemSchema, fixturePath);
  }
}

/**
 * Get network schedule fixture data
 * @returns Network schedule fixture data
 */
export function getNetworkSchedule(): NetworkScheduleItem[] {
  return getSchedule('network-schedule') as NetworkScheduleItem[];
}

/**
 * Get web schedule fixture data
 * @returns Web schedule fixture data
 */
export function getWebSchedule(): WebScheduleItem[] {
  return getSchedule('web-schedule') as WebScheduleItem[];
}

/**
 * Get combined schedule fixture data
 * @returns Combined schedule fixture data
 */
export function getCombinedSchedule(): ScheduleItem[] {
  return getSchedule('combined-schedule') as ScheduleItem[];
}

/**
 * Get raw TVMaze schedule fixture content as a string
 * @param name Base name of the fixture file (without .json extension)
 * @returns Raw fixture content as a string
 */
export function getScheduleString(
  name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
): string {
  return loadFixtureString(`tvmaze/${name}.json`);
}

/**
 * Load network schedule fixture and transform to domain model
 * @returns Array of transformed Show objects
 */
export function loadNetworkShows(): Show[] {
  const scheduleData = getNetworkSchedule();
  return transformSchedule(scheduleData);
}

/**
 * Load web schedule fixture and transform to domain model
 * @returns Array of transformed Show objects
 */
export function loadWebShows(): Show[] {
  const scheduleData = getWebSchedule();
  return transformSchedule(scheduleData);
}

/**
 * Load combined schedule fixture and transform to domain model
 * @returns Array of transformed Show objects
 */
export function loadCombinedShows(): Show[] {
  const scheduleData = getCombinedSchedule();
  return transformSchedule(scheduleData);
}
