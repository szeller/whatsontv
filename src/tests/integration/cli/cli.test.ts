/**
 * CLI Integration Tests
 * 
 * These tests verify that the CLI works correctly with different arguments
 * and produces the expected output.
 */
import { container } from '../../../container.js';
import { runCli } from './cliTestRunner.js';
import { MockHttpClient } from '../../testutils/mockHttpClient.js';
import type { HttpClient } from '../../../interfaces/httpClient.js';
import { getTodayDate } from '../../../utils/dateUtils.js';
import { 
  getNetworkScheduleUrl, 
  getWebScheduleUrl, 
  setupTvMazeMocks 
} from '../../testutils/tvMazeTestUtils.js';
import { Fixtures } from '../../fixtures/index.js';
import { PlainStyleServiceImpl } from '../../../implementations/test/plainStyleServiceImpl.js';
import type { StyleService } from '../../../interfaces/styleService.js';
import { describe, expect, test, beforeEach, afterEach, jest } from '@jest/globals';

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

describe('CLI Integration Tests', () => {
  // Mock console.log, console.error, and console.warn to suppress output during tests
  let originalConsoleLog: typeof console.log;
  let originalConsoleError: typeof console.error;
  let originalConsoleWarn: typeof console.warn;

  // Mock HTTP client
  let mockHttpClient: MockHttpClient;
  
  // Original HTTP client and style service
  let originalHttpClient: HttpClient;
  let originalStyleService: StyleService;
  
  // Today's date for testing
  const today = getTodayDate();
  
  // API endpoints - used for test setup only
  const _networkEndpoint = getNetworkScheduleUrl(today);
  const _webEndpoint = getWebScheduleUrl(today);
  
  beforeEach(() => {
    // Save original console methods
    originalConsoleLog = console.log;
    originalConsoleError = console.error;
    originalConsoleWarn = console.warn;
    
    // Mock console methods to suppress output
    console.log = jest.fn();
    console.error = jest.fn();
    console.warn = jest.fn();
    
    // Save original services
    originalHttpClient = container.resolve<HttpClient>('HttpClient');
    originalStyleService = container.resolve<StyleService>('StyleService');
    
    // Create mock HTTP client and plain style service
    mockHttpClient = new MockHttpClient();
    const plainStyleService = new PlainStyleServiceImpl();
    
    // Register mock services
    container.register('HttpClient', { useValue: mockHttpClient });
    container.register('StyleService', { useValue: plainStyleService });
  });
  
  afterEach(() => {
    // Restore original console methods
    console.log = originalConsoleLog;
    console.error = originalConsoleError;
    console.warn = originalConsoleWarn;
    
    // Restore original services
    container.register('HttpClient', { useValue: originalHttpClient });
    container.register('StyleService', { useValue: originalStyleService });
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
      
      // Verify that the output contains expected show information
      const networkData = Fixtures.tvMaze.getSchedule('network-schedule') as 
        TvMazeNetworkScheduleItem[];
      
      // Get all show names from the fixture
      const showNames = networkData
        .map(item => item.show?.name)
        .filter((name): name is string => name !== undefined && name !== null);
      
      // Verify that at least one show from the fixture appears in the output
      const foundShow = showNames.some(name => 
        result.stdout.some(line => line.includes(name))
      );
      
      expect(foundShow).toBe(true);
    });
    
    test('should display web shows when --fetch=web flag is used', async () => {
      // Run CLI with web fetch option
      const result = await runCli({ fetch: 'web' });
      
      // Load web schedule fixture
      const webData = Fixtures.tvMaze.getSchedule('web-schedule') as 
        TvMazeWebScheduleItem[];
      
      // Get all show names from the fixture
      const showNames = webData
        .map(item => item._embedded?.show?.name)
        .filter((name): name is string => name !== undefined && name !== null);
      
      // Get all network/webChannel names from the fixture
      const networkNames = webData
        .map(item => item._embedded?.show?.webChannel?.name)
        .filter((name): name is string => name !== undefined && name !== null);
      
      // Verify the output contains at least one streaming service name
      expect(
        result.stdout.some(line => 
          networkNames.some(name => line.includes(name))
        )
      ).toBe(true);
      
      // Verify at least one show from the fixture appears in the output
      expect(
        result.stdout.some(line => 
          showNames.some(name => line.includes(name))
        )
      ).toBe(true);
    });
    
    test('should display both network and web shows when --fetch=all flag is used', async () => {
      // Run CLI with all fetch option
      const result = await runCli({ fetch: 'all' });
      
      // Verify that the output contains shows from both sources
      const networkData = Fixtures.tvMaze.getSchedule('network-schedule') as 
        TvMazeNetworkScheduleItem[];
      const webData = Fixtures.tvMaze.getSchedule('web-schedule') as 
        TvMazeWebScheduleItem[];
      
      // Check for network shows
      const networkShowNames = networkData
        .map(show => show.show?.name)
        .filter((name): name is string => name !== undefined && name !== null);
      
      // Check for web shows
      const webShowNames = webData
        .map(show => show._embedded?.show?.name)
        .filter((name): name is string => name !== undefined && name !== null);
      
      // Verify that at least one show from each source appears in the output
      const foundNetworkShow = networkShowNames.some(name => 
        result.stdout.some(line => line.includes(name))
      );
      
      const foundWebShow = webShowNames.some(name => 
        result.stdout.some(line => line.includes(name))
      );
      
      expect(foundNetworkShow).toBe(true);
      expect(foundWebShow).toBe(true);
    });
  });
  
  describe('Error handling', () => {
    test('should handle malformed API responses gracefully', async () => {
      // Reset the mock HTTP client
      mockHttpClient.reset();
      
      // Set up a malformed response for the network schedule endpoint
      const networkUrl = getNetworkScheduleUrl(today);
      mockHttpClient.mockGet(networkUrl, {
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: '{ "malformed": "json", missing closing bracket and quotes'
      });
      
      // Set up a malformed response for the web schedule endpoint
      const webUrl = getWebScheduleUrl(today);
      mockHttpClient.mockGet(webUrl, {
        status: 200,
        headers: { 'content-type': 'application/json' },
        data: '{ "also": "malformed", ]'
      });
      
      // Run CLI with all fetch option to try both endpoints
      const result = await runCli({ fetch: 'all' });
      
      // The application handles errors gracefully without exiting with an error code
      expect(result.exitCode).toBe(0);
      
      // Verify that the application still displays the header
      expect(result.stdout.some(line => line.includes('WhatsOnTV'))).toBe(true);
      
      // Verify that the application still displays the footer
      expect(result.stdout.some(line => line.includes('Data provided by TVMaze API'))).toBe(true);
      
      // The application is handling malformed responses gracefully by continuing to display
      // what data it can, which is good behavior. We don't need to verify specific error messages.
    });
  });
});
