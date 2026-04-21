/**
 * Tests for TVMaze schema transformations
 */
import {
  networkScheduleToShowSchema,
  webScheduleToShowSchema
} from '../../schemas/tvmaze.js';
const EPISODE_TITLE = 'Episode Title';
const COUNTRY_US = 'United States';
const NY_TIMEZONE = 'America/New_York';
const SHOW_SUMMARY = 'Show summary';
const SHOW_NAME = 'Show Name';
const SHOW_TYPE = 'Scripted';

describe('TVMaze Schema Transformations', () => {
  describe('networkScheduleToShowSchema', () => {
    it('should transform a valid network schedule item to a Show object', () => {
      // Arrange
      const networkScheduleItem = {
        id: 123,
        name: EPISODE_TITLE,
        season: 5,
        number: 10,
        airtime: '20:00',
        summary: 'Episode summary',
        show: {
          id: 456,
          name: SHOW_NAME,
          type: SHOW_TYPE,
          language: 'English',
          genres: ['Drama', 'Thriller'],
          network: {
            id: 1,
            name: 'ABC',
            country: {
              name: COUNTRY_US,
              code: 'US',
              timezone: NY_TIMEZONE
            }
          },
          summary: SHOW_SUMMARY
        }
      };

      // Act
      const result = networkScheduleToShowSchema.parse(networkScheduleItem);

      // Assert
      expect(result).toEqual({
        id: 456,
        name: SHOW_NAME,
        type: SHOW_TYPE,
        language: 'English',
        genres: ['Drama', 'Thriller'],
        network: 'ABC (US)',
        summary: SHOW_SUMMARY,
        airtime: '20:00',
        season: 5,
        number: 10
      });
    });

    it('should handle missing or null values with defaults', () => {
      // Arrange
      const networkScheduleItem = {
        id: 123,
        show: {
          id: null,
          genres: null
        }
      };

      // Act
      const result = networkScheduleToShowSchema.parse(networkScheduleItem);

      // Assert
      expect(result).toEqual({
        id: 0,
        name: 'Unknown Show',
        type: 'unknown',
        language: null,
        genres: [],
        network: 'Unknown Network',
        summary: null,
        airtime: null,
        season: 0,
        number: 0
      });
    });

    it('should handle web channel instead of network', () => {
      // Arrange
      const networkScheduleItem = {
        id: 123,
        name: EPISODE_TITLE,
        season: 5,
        number: 10,
        airtime: '20:00',
        show: {
          id: 456,
          name: SHOW_NAME,
          type: SHOW_TYPE,
          language: 'English',
          genres: ['Drama', 'Thriller'],
          network: null,
          webChannel: {
            id: 2,
            name: 'Netflix',
            country: {
              name: COUNTRY_US,
              code: 'US',
              timezone: NY_TIMEZONE
            }
          },
          summary: SHOW_SUMMARY
        }
      };

      // Act
      const result = networkScheduleToShowSchema.parse(networkScheduleItem);

      // Assert
      expect(result.network).toBe('Netflix (US)');
    });
  });

  describe('webScheduleToShowSchema', () => {
    it('should transform a valid web schedule item to a Show object', () => {
      // Arrange
      const webScheduleItem = {
        id: 123,
        name: EPISODE_TITLE,
        season: 5,
        number: 10,
        airtime: '20:00',
        summary: 'Episode summary',
        _embedded: {
          show: {
            id: 456,
            name: SHOW_NAME,
            type: SHOW_TYPE,
            language: 'English',
            genres: ['Drama', 'Thriller'],
            webChannel: {
              id: 2,
              name: 'Netflix',
              country: {
                name: COUNTRY_US,
                code: 'US',
                timezone: NY_TIMEZONE
              }
            },
            summary: SHOW_SUMMARY
          }
        }
      };

      // Act
      const result = webScheduleToShowSchema.parse(webScheduleItem);

      // Assert
      expect(result).toEqual({
        id: 456,
        name: SHOW_NAME,
        type: SHOW_TYPE,
        language: 'English',
        genres: ['Drama', 'Thriller'],
        network: 'Netflix (US)',
        summary: SHOW_SUMMARY,
        airtime: '20:00',
        season: 5,
        number: 10
      });
    });

    it('should handle missing or null values with defaults', () => {
      // Arrange
      const webScheduleItem = {
        id: 123,
        _embedded: {
          show: {
            id: null
          }
        }
      };

      // Act
      const result = webScheduleToShowSchema.parse(webScheduleItem);

      // Assert
      expect(result).toEqual({
        id: 0,
        name: 'Unknown Show',
        type: 'unknown',
        language: null,
        genres: [],
        network: 'Unknown Network',
        summary: null,
        airtime: null,
        season: 0,
        number: 0
      });
    });
  });
});
