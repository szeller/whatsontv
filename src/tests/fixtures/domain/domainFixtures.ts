/**
 * Domain model test fixtures utility
 * 
 * Provides easy access to domain model test fixtures for use in tests
 */
import { Show, NetworkGroups } from '../../../types/tvShowModel.js';

/**
 * Domain model test fixtures
 */
export class DomainFixtures {
  /**
   * Get sample network shows for testing
   * @returns Array of network shows in domain model format
   */
  static getNetworkShows(): Show[] {
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
  }

  /**
   * Get sample streaming shows for testing
   * @returns Array of streaming shows in domain model format
   */
  static getStreamingShows(): Show[] {
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
  }

  /**
   * Get sample network groups for testing
   * @returns Network groups object for testing
   */
  static getNetworkGroups(): NetworkGroups {
    return {
      broadcast: [
        DomainFixtures.getNetworkShows()[0],
        DomainFixtures.getNetworkShows()[1]
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
        DomainFixtures.getStreamingShows()[0],
        DomainFixtures.getStreamingShows()[1]
      ]
    };
  }
}
