/**
 * CLI Integration Tests
 * 
 * These tests verify that the CLI works correctly with different arguments
 * and produces the expected output.
 */
import { container } from '../../../container.js';
import { runCli } from './cliTestRunner.js';
import { MockHttpClient } from '../../utils/mockHttpClient.js';
import type { HttpClient } from '../../../interfaces/httpClient.js';
import { getTodayDate } from '../../../utils/dateUtils.js';
import { 
  getNetworkScheduleUrl, 
  getWebScheduleUrl, 
  setupTvMazeMocks 
} from '../../utils/tvMazeTestUtils.js';
import { TvMazeFixtures } from '../../fixtures/tvmaze/tvMazeFixtures.js';
import type { CliArgs } from '../../../types/cliArgs.js';

// Define types for TVMaze API responses
interface TvMazeShow {
  name?: string;
  network?: {
    name?: string;
  };
  webChannel?: {
    name?: string;
  };
  genres?: string[];
}

interface TvMazeNetworkScheduleItem {
  show?: TvMazeShow;
}

interface TvMazeWebScheduleItem {
  _embedded?: {
    show?: TvMazeShow;
  };
}

describe.skip('CLI Integration Tests', () => {
  // Mock HTTP client
  let mockHttpClient: MockHttpClient;
  
  // Original HTTP client
  let originalHttpClient: HttpClient;
  
  // Today's date for testing
  const today = getTodayDate();
  
  // API endpoints
  const networkEndpoint = getNetworkScheduleUrl(today);
  const webEndpoint = getWebScheduleUrl(today);
  
  beforeAll(() => {
    // Save original HTTP client
    originalHttpClient = container.resolve<HttpClient>('HttpClient');
    
    // Create mock HTTP client
    mockHttpClient = new MockHttpClient();
    
    // Register mock HTTP client
    container.register('HttpClient', { useValue: mockHttpClient });
  });
  
  afterAll(() => {
    // Restore original HTTP client
    container.register('HttpClient', { useValue: originalHttpClient });
  });
  
  beforeEach(() => {
    // Reset mock HTTP client
    mockHttpClient.reset();
    
    // Set up TVMaze API mocks with today's date
    setupTvMazeMocks(mockHttpClient, today);
  });
  
  describe('Basic functionality', () => {
    test('should display network shows by default', async () => {
      // Run CLI with default options
      const result = await runCli({});
      
      // Verify that the mock HTTP client was called with the correct URL
      expect(mockHttpClient.getCallCount(networkEndpoint)).toBe(1);
      
      // Verify that the output contains expected show information
      const networkData = TvMazeFixtures.getNetworkSchedule() as TvMazeNetworkScheduleItem[];
      
      // Check for at least one show name in the output
      if (Array.isArray(networkData) && networkData.length > 0) {
        const firstShow = networkData[0] as TvMazeNetworkScheduleItem;
        const showName = firstShow.show?.name;
        
        if (showName) {
          expect(result.stdout.some(line => line.includes(showName))).toBe(true);
        }
      }
    });
    
    test('should display web shows when --web flag is used', async () => {
      // Run CLI with web flag
      const result = await runCli({ webOnly: true } as Partial<CliArgs>);
      
      // Verify that the mock HTTP client was called with the correct URL
      expect(mockHttpClient.getCallCount(webEndpoint)).toBe(1);
      
      // Verify that the output contains expected show information
      const webData = TvMazeFixtures.getWebSchedule() as TvMazeWebScheduleItem[];
      
      // Check for at least one show name in the output
      if (Array.isArray(webData) && webData.length > 0) {
        const firstShow = webData[0] as TvMazeWebScheduleItem;
        const showName = firstShow._embedded?.show?.name;
        
        if (showName) {
          expect(result.stdout.some(line => line.includes(showName))).toBe(true);
        }
      }
    });
    
    test('should display both network and web shows when --all flag is used', async () => {
      // Run CLI with all flag
      const result = await runCli({ showAll: true } as Partial<CliArgs>);
      
      // Verify that both endpoints were called
      expect(mockHttpClient.getCallCount(networkEndpoint)).toBe(1);
      expect(mockHttpClient.getCallCount(webEndpoint)).toBe(1);
      
      // Verify that the output contains shows from both sources
      const networkData = TvMazeFixtures.getNetworkSchedule() as TvMazeNetworkScheduleItem[];
      const webData = TvMazeFixtures.getWebSchedule() as TvMazeWebScheduleItem[];
      
      // Check for at least one network show
      if (Array.isArray(networkData) && networkData.length > 0) {
        const networkShow = networkData[0] as TvMazeNetworkScheduleItem;
        const networkShowName = networkShow.show?.name;
        
        if (networkShowName) {
          expect(result.stdout.some(line => line.includes(networkShowName))).toBe(true);
        }
      }
      
      // Check for at least one web show
      if (Array.isArray(webData) && webData.length > 0) {
        const webShow = webData[0] as TvMazeWebScheduleItem;
        const webShowName = webShow._embedded?.show?.name;
        
        if (webShowName) {
          expect(result.stdout.some(line => line.includes(webShowName))).toBe(true);
        }
      }
    });
  });
  
  describe('Debug mode', () => {
    test('should display debug information when --debug flag is used', async () => {
      // Run CLI with debug flag
      const result = await runCli({ debug: true } as Partial<CliArgs>);
      
      // Verify debug information is included in the output
      expect(result.stdout.some(line => line.includes('Debug'))).toBe(true);
      expect(result.stdout.some(line => line.includes('API URL'))).toBe(true);
      expect(result.stdout.some(line => line.includes(networkEndpoint))).toBe(true);
    });
  });
  
  describe('Filtering', () => {
    test('should filter shows by network', async () => {
      // Run CLI with network filter for CBS (which is in our network fixture)
      const result = await runCli({ networks: ['CBS'] } as Partial<CliArgs>);
      
      // Verify that the network endpoint was called
      expect(mockHttpClient.getCallCount(networkEndpoint)).toBe(1);
      
      // Get all shows from the network fixture
      const networkData = TvMazeFixtures.getNetworkSchedule() as TvMazeNetworkScheduleItem[];
      
      // Find CBS shows in the fixture
      const cbsShows = networkData.filter(item => 
        item.show?.network?.name === 'CBS' ||
        item.show?.webChannel?.name === 'CBS'
      );
      
      // Verify that CBS shows are in the output
      if (cbsShows.length > 0) {
        const cbsShowName = cbsShows[0].show?.name;
        if (cbsShowName) {
          expect(result.stdout.some(line => line.includes(cbsShowName))).toBe(true);
        }
      }
      
      // Find non-CBS shows in the fixture
      const nonCbsShows = networkData.filter(item => 
        item.show?.network?.name !== 'CBS' &&
        item.show?.webChannel?.name !== 'CBS'
      );
      
      // Verify that non-CBS shows are NOT in the output
      if (nonCbsShows.length > 0) {
        const nonCbsShowName = nonCbsShows[0].show?.name;
        if (nonCbsShowName) {
          const hasNonCbs = result.stdout.some(line => line.includes(nonCbsShowName));
          expect(hasNonCbs).toBe(false);
        }
      }
    });
    
    test('should filter shows by genre', async () => {
      // Run CLI with genre filter for Drama (which is in our fixture)
      const result = await runCli({ genres: ['Drama'] } as Partial<CliArgs>);
      
      // Verify that the network endpoint was called
      expect(mockHttpClient.getCallCount(networkEndpoint)).toBe(1);
      
      // Get all shows from the network fixture
      const networkData = TvMazeFixtures.getNetworkSchedule() as TvMazeNetworkScheduleItem[];
      
      // Find Drama shows in the fixture
      const dramaShows = networkData.filter(item => 
        Array.isArray(item.show?.genres) &&
        item.show.genres.includes('Drama')
      );
      
      // Verify that Drama shows are in the output
      if (dramaShows.length > 0) {
        const dramaShowName = dramaShows[0].show?.name;
        if (dramaShowName) {
          expect(result.stdout.some(line => line.includes(dramaShowName))).toBe(true);
        }
      }
    });
  });
  
  describe('Time Sorting', () => {
    test('should sort shows by time when timeSort is enabled', async () => {
      // Run CLI with time sorting
      const result = await runCli({ timeSort: true } as Partial<CliArgs>);
      
      // Verify that the output mentions time sorting
      expect(result.stdout.some(line => line.includes('sorted by time'))).toBe(true);
      
      // The actual sorting logic is tested in unit tests, so we just verify
      // that the CLI passes the flag correctly to the underlying implementation
    });
  });
});
