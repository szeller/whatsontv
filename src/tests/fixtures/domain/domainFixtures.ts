/**
 * Domain model test fixtures utility
 * 
 * Provides easy access to domain model test fixtures for use in tests
 */
import { Show, Episode, NetworkGroups } from '../../../types/tvShowModel.js';

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
        channel: 'ABC',
        isStreaming: false,
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
        channel: 'NBC',
        isStreaming: false,
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
        channel: 'Netflix',
        isStreaming: true,
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
        channel: 'Hulu',
        isStreaming: true,
        summary: 'Another sample streaming show for testing',
        airtime: null,
        season: 1,
        number: 2
      }
    ];
  }

  /**
   * Get sample episodes for testing
   * @returns Array of episodes in domain model format
   */
  static getEpisodes(): Episode[] {
    return [
      {
        id: 101,
        name: 'Pilot',
        season: 1,
        number: 1,
        summary: 'The first episode',
        airdate: '2023-01-01',
        airtime: '20:00',
        runtime: 60
      },
      {
        id: 102,
        name: 'The Second One',
        season: 1,
        number: 2,
        summary: 'The second episode',
        airdate: '2023-01-08',
        airtime: '20:00',
        runtime: 60
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
          channel: 'HBO',
          isStreaming: false,
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
