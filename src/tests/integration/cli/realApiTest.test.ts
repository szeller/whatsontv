/**
 * Real API Integration Test
 * 
 * This test uses the real TVMaze API to verify that the application can
 * correctly process actual API responses through the CLI interface.
 * It keeps console output mocked for stability and test isolation.
 */
import { container } from '../../../container.js';
import { FetchHttpClientImpl } from '../../../implementations/fetchHttpClientImpl.js';
import { TvMazeServiceImpl } from '../../../implementations/tvMazeServiceImpl.js';
import type { HttpClient } from '../../../interfaces/httpClient.js';
import type { TvShowService } from '../../../interfaces/tvShowService.js';
import { getTodayDate } from '../../../utils/dateUtils.js';
import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';
import { runCli } from './cliTestRunner.js';

describe('Real API CLI Integration Test', () => {
  // Original services
  let originalHttpClient: HttpClient;
  let originalTvShowService: TvShowService;
  
  // Real HTTP client for API calls
  let realHttpClient: FetchHttpClientImpl;
  
  beforeEach(() => {
    // Save original services
    originalHttpClient = container.resolve<HttpClient>('HttpClient');
    originalTvShowService = container.resolve<TvShowService>('TvShowService');
    
    // Create real HTTP client
    realHttpClient = new FetchHttpClientImpl();
    
    // Create real TV show service that uses the real HTTP client
    const realTvShowService = new TvMazeServiceImpl(realHttpClient);
    
    // Register services in the container
    container.register('HttpClient', { useValue: realHttpClient });
    container.register('TvShowService', { useValue: realTvShowService });
  });
  
  afterEach(() => {
    // Restore original services
    container.register('HttpClient', { useValue: originalHttpClient });
    container.register('TvShowService', { useValue: originalTvShowService });
  });
  
  test('should fetch and display network schedule from real TVMaze API', async () => {
    // Get today's date for the test
    const today = getTodayDate();
    
    // Run CLI with network schedule
    const result = await runCli({
      date: today,
      country: 'US',
      fetch: 'network',
      types: ['Scripted', 'Reality'],
      networks: ['Netflix', 'HBO', 'CBS'],
      languages: ['English']
    });
    
    // Verify that the CLI executed successfully
    expect(result.exitCode).toBe(0);
    
    // Verify that we got some output
    expect(result.stdout.length).toBeGreaterThan(0);
    
    // Check for expected content in the output
    const outputText = result.stdout.join('\n');
    expect(outputText).toContain('WhatsOnTV v1.0.0');
    expect(outputText).toContain('Data provided by TVMaze API');
    
    // Check that we got at least one show (should be failing if no shows are found)
    expect(outputText).not.toContain('No shows found for the specified criteria');
    
    // Verify specific networks are present
    expect(outputText).toContain('CBS (US):');
    
    // Verify some basic formatting elements
    expect(outputText).toContain('20:00');  // Check for a time format
    expect(outputText).toContain('Scripted');  // Check for show type
    expect(outputText).toContain('S');  // Check for season indicator
    
    // Check for error messages
    expect(result.stderr.length).toBe(0);
  }, 30000); // Increase timeout for API call
  
  test('should fetch and display web schedule from real TVMaze API', async () => {
    // Get today's date for the test
    const today = getTodayDate();
    
    // Run CLI with web schedule
    const result = await runCli({
      date: today,
      fetch: 'web',
      types: ['Scripted', 'Reality'],
      languages: ['English']
    });
    
    // Verify that the CLI executed successfully
    expect(result.exitCode).toBe(0);
    
    // Verify that we got some output
    expect(result.stdout.length).toBeGreaterThan(0);
    
    // Check for expected content in the output
    const outputText = result.stdout.join('\n');
    expect(outputText).toContain('WhatsOnTV v1.0.0');
    expect(outputText).toContain('Data provided by TVMaze API');
    
    // Check that we got at least one show (should be failing if no shows are found)
    expect(outputText).not.toContain('No shows found for the specified criteria');
    
    // Verify at least one streaming service is present
    const streamingServices = [
      'Netflix', 
      'Hulu', 
      'Prime Video', 
      'Disney+', 
      'Apple TV+', 
      'Paramount+', 
      'HBO Max'
    ];
    const hasStreamingService = streamingServices.some(service => outputText.includes(service));
    expect(hasStreamingService).toBe(true);
    
    // Verify web shows have N/A for time
    expect(outputText).toContain('N/A');
    
    // Check for error messages
    expect(result.stderr.length).toBe(0);
  }, 30000); // Increase timeout for API call
  
  test('should fetch and display all shows with filtering', async () => {
    // Get today's date for the test
    const today = getTodayDate();
    
    // Run CLI with all shows and filtering - using less restrictive filters
    const result = await runCli({
      date: today,
      country: 'US',
      fetch: 'all',
      types: ['Scripted', 'Reality'],  // Include more types
      networks: [],                    // Don't filter by network
      languages: ['English']
    });
    
    // Verify that the CLI executed successfully
    expect(result.exitCode).toBe(0);
    
    // Verify that we got some output
    expect(result.stdout.length).toBeGreaterThan(0);
    
    // Check for expected content in the output
    const outputText = result.stdout.join('\n');
    expect(outputText).toContain('WhatsOnTV v1.0.0');
    expect(outputText).toContain('Data provided by TVMaze API');
    
    // Check that we got at least one show (should be failing if no shows are found)
    expect(outputText).not.toContain('No shows found for the specified criteria');
    
    // Verify that we have both network and web shows
    // Network shows have times (check for some common hour values)
    expect(outputText).toMatch(/20:00|21:00|22:00/);
    // Web shows have N/A for time
    expect(outputText).toContain('N/A');
    
    // Verify we have multiple networks/platforms
    // The network headings end with a colon and are followed by a line of dashes
    const networkHeadings = outputText.split('\n').filter(line => 
      line.includes(':') && 
      !line.includes('WhatsOnTV') && 
      !line.includes('Data provided')
    );
    expect(networkHeadings.length).toBeGreaterThan(1);
    
    // Check for error messages
    expect(result.stderr.length).toBe(0);
  }, 30000); // Increase timeout for API call
});
