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
    // Act
    const result = await runCli({
      date: getTodayDate(),
      country: 'US',
      fetch: 'network',
      types: ['Scripted', 'Reality'],
      networks: [],
      languages: ['English']
    });
    const outputText = result.stdout.join('\n');
    
    // Assert
    // Check for error messages
    expect(result.stderr.length).toBe(0);
    
    // Verify that we have the header and footer
    expect(outputText).toContain('WhatsOnTV v1.0.0');
    expect(outputText).toContain('Data provided by TVMaze API');
  }, 30000); // Increase timeout for API call
  
  test('should fetch and display web schedule from real TVMaze API', async () => {
    // Act
    const result = await runCli({
      date: getTodayDate(),
      fetch: 'web',
      types: ['Scripted', 'Reality'],
      languages: ['English']
    });
    const outputText = result.stdout.join('\n');
    
    // Assert
    // Check for error messages
    expect(result.stderr.length).toBe(0);
    
    // Verify that we have the header and footer
    expect(outputText).toContain('WhatsOnTV v1.0.0');
    expect(outputText).toContain('Data provided by TVMaze API');
  }, 30000); // Increase timeout for API call
  
  test('should fetch and display all shows with filtering', async () => {
    // Act
    const result = await runCli({
      date: getTodayDate(),
      country: 'US',
      fetch: 'all',
      types: ['Scripted', 'Reality'],  // Include more types
      networks: [],  // No network filtering
      languages: ['English']
    });
    const outputText = result.stdout.join('\n');
    
    // Assert
    // Check for error messages
    expect(result.stderr.length).toBe(0);
    
    // Verify that we have the header and footer
    expect(outputText).toContain('WhatsOnTV v1.0.0');
    expect(outputText).toContain('Data provided by TVMaze API');
  }, 30000); // Increase timeout for API call
});

/**
 * Run the CLI with the given arguments
 * @param args CLI arguments
 * @returns CLI execution result
 */
async function runCli(args: Record<string, unknown>): Promise<{
  stdout: string[];
  stderr: string[];
  exitCode: number;
}> {
  return runCliCommand([
    ...Object.entries(args).flatMap(([key, value]) => {
      if (Array.isArray(value)) {
        if (value.length === 0) return [];
        return [`--${key}=${value.join(',')}`];
      }
      return [`--${key}=${String(value)}`];
    })
  ]);
}

/**
 * Run the CLI with the given command arguments
 * @param args Command line arguments
 * @returns CLI execution result
 */
async function runCliCommand(args: string[]): Promise<{
  stdout: string[];
  stderr: string[];
  exitCode: number;
}> {
  const { execSync } = await import('child_process');
  const result = {
    stdout: [] as string[],
    stderr: [] as string[],
    exitCode: 0
  };
  
  try {
    // Run the CLI command and capture output
    const output = execSync(
      `node --import ./src/register.mjs src/cli.ts ${args.join(' ')}`,
      { encoding: 'utf8' }
    );
    result.stdout = output.split('\n');
  } catch (error) {
    if (error !== null && typeof error === 'object' && 'stderr' in error) {
      result.stderr = String(error.stderr).split('\n');
      if ('status' in error && typeof error.status === 'number') {
        result.exitCode = error.status;
      }
    }
  }
  
  return result;
}
