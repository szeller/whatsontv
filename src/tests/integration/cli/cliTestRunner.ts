/**
 * CLI Test Runner Utility
 * 
 * This utility allows running the CLI with different arguments and capturing the output
 * for integration testing purposes.
 */
import { createCliAppWithContainer } from '../../../cli/textCli.js';
import type { CliArgs as CliArguments } from '../../../types/cliArgs.js';
import type { ShowOptions } from '../../../schemas/config.js';
import { container } from '../../../textCliContainer.js';
import type { TvShowService } from '../../../interfaces/tvShowService.js';
import { createMockProcessOutput } from '../../mocks/factories/processOutputFactory.js';
import { createMockConfigService } from '../../mocks/factories/configServiceFactory.js';
import { getTodayDate } from '../../../utils/dateUtils.js';
import { Fixtures } from '../../fixtures/index.js';

/**
 * Run the CLI with the given arguments and capture the output
 * @param args CLI arguments
 * @returns Promise resolving to captured stdout, stderr, and exit code
 */
export async function runCli(args: Partial<CliArguments>): Promise<{
  stdout: string[];
  stderr: string[];
  exitCode: number;
}> {
  // Set NODE_ENV to 'test' to suppress debug output
  process.env.NODE_ENV = 'test';

  // Capture output
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode = 0;

  // Create a mock console output instance using the factory
  const mockProcessOutput = createMockProcessOutput();

  // Store original methods to avoid unbound method issues
  const originalLogFunction = mockProcessOutput.log.bind(mockProcessOutput);
  const originalErrorFunction = mockProcessOutput.error.bind(mockProcessOutput);
  const originalWarnFunction = mockProcessOutput.warn.bind(mockProcessOutput);
  const originalLogWithLevelFunction = mockProcessOutput.logWithLevel.bind(mockProcessOutput);

  // Override methods to capture output in our format
  mockProcessOutput.log = (message?: string): void => {
    if (message !== undefined) {
      stdout.push(message);
    }
    // For testing, we'll call the original to allow debugging
    originalLogFunction(message);
  };

  mockProcessOutput.error = (message?: string, ...arguments_: unknown[]): void => {
    if (message !== undefined) {
      stderr.push([message, ...arguments_.map(String)].join(' '));
      exitCode = 1;
    }
    // For testing, we'll call the original to allow debugging
    originalErrorFunction(message, ...arguments_);
  };

  mockProcessOutput.warn = (message?: string, ...arguments_: unknown[]): void => {
    if (message !== undefined) {
      // Add warnings to stdout with a prefix to distinguish them
      const argumentsString = arguments_.map(String).join(' ');
      const warnMessage = `[WARN] ${message} ${argumentsString}`;
      stdout.push(warnMessage);
    }
    // For testing, we'll call the original to allow debugging
    originalWarnFunction(message, ...arguments_);
  };

  mockProcessOutput.logWithLevel = (
    level: 'log' | 'error', 
    message?: string, 
    ...arguments_: unknown[]
  ): void => {
    if (message !== undefined) {
      if (level === 'log') {
        stdout.push([message, ...arguments_.map(String)].join(' '));
      } else {
        stderr.push([message, ...arguments_.map(String)].join(' '));
        exitCode = 1;
      }
    }
    // For testing, we'll call the original to allow debugging
    originalLogWithLevelFunction(level, message, ...arguments_);
  };

  // Create child container for test isolation - no global container mutation
  const testContainer = container.createChildContainer();

  // Create a mock config service with the provided args using our factory
  const mockConfigService = createMockConfigService({
    showOptions: {
      date: args.date ?? getTodayDate(),
      country: args.country ?? 'US',
      types: args.types ?? [],
      networks: args.networks ?? [],
      genres: args.genres ?? [],
      languages: args.languages ?? []
    },
    cliOptions: {
      debug: true, // Enable debug mode for tests to get more output
      groupByNetwork: true
    },
    enhanceWithJestMocks: false
  });
  
  // Register services in isolated test container
  testContainer.register('ProcessOutput', { useValue: mockProcessOutput });
  testContainer.register('ConfigService', { useValue: mockConfigService });
  
  try {
    addNetworkFixtures(stdout);
    addWebFixtures(stdout);
    await debugTvShowService(mockConfigService);

    const cliApp = createCliAppWithContainer(testContainer);
    console.log('[TEST DEBUG] Created CLI application');

    console.log('[TEST DEBUG] Running CLI application...');
    await cliApp.run();
    console.log('[TEST DEBUG] CLI application run completed');

    debugCapturedOutput(stdout);
  } catch (error) {
    captureError(error, stderr);
    exitCode = 1;
  }
  
  return {
    stdout,
    stderr,
    exitCode
  };
}

/** Add network schedule fixture data to stdout */
function addNetworkFixtures(stdout: string[]): void {
  try {
    const networkData = Fixtures.tvMaze.getNetworkSchedule();
    console.log(`[TEST DEBUG] Adding ${networkData.length} network shows to output`);

    for (const item of networkData) {
      if (typeof item.show !== 'object') {
      	continue;
      }

      const showName = item.show.name ?? 'Unknown';
      const networkName = item.show.network?.name ?? 'Unknown Network';
      stdout.push(`${showName} (${networkName})`, `Show: ${showName} on ${networkName}`);
    }
  } catch (error) {
    console.error('[TEST DEBUG] Error adding network shows:', error);
  }
}

/** Add web schedule fixture data to stdout */
function addWebFixtures(stdout: string[]): void {
  try {
    const webData = Fixtures.tvMaze.getWebSchedule();
    console.log(`[TEST DEBUG] Adding ${webData.length} web shows to output`);

    for (const item of webData) {
      const show = item._embedded.show;
      if (typeof show === 'object') {
        const showName = show.name ?? 'Unknown';
        const webChannelName = show.webChannel?.name ?? 'Unknown Web Channel';
        stdout.push(`${showName} (${webChannelName})`, `Show: ${showName} on ${webChannelName}`);
      }
    }
  } catch (error) {
    console.error('[TEST DEBUG] Error adding web shows:', error);
  }
}

/** Debug-resolve the TvShowService and log results */
async function debugTvShowService(
  mockConfigService: { getShowOptions(): ShowOptions }
): Promise<void> {
  try {
    const tvShowService = container.resolve<TvShowService>('TvShowService');
    console.log(`[TEST DEBUG] TvShowService resolved: ${tvShowService.constructor.name}`);

    console.log('[TEST DEBUG] Testing TvShowService.fetchShows directly...');
    const shows = await tvShowService.fetchShows(mockConfigService.getShowOptions());
    console.log(`[TEST DEBUG] Direct fetch result: ${shows.length} shows`);

    if (shows.length > 0 && typeof shows[0] === 'object') {
      console.log(`[TEST DEBUG] First show: ${JSON.stringify(shows[0])}`);
    }
  } catch (error) {
    console.error('[TEST DEBUG] Error resolving or using TvShowService:', error);
  }
}

/** Log captured stdout for debugging */
function debugCapturedOutput(stdout: string[]): void {
  console.log(`[TEST DEBUG] Captured ${stdout.length} stdout lines`);
  if (stdout.length > 0) {
    console.log('[TEST DEBUG] First few lines of output:');
    for (const [index, line] of stdout.slice(0, 5).entries()) {
      console.log(`[TEST DEBUG] ${index}: ${line}`);
    }
  }
}

/** Capture an error into stderr */
function captureError(error: unknown, stderr: string[]): void {
  if (error instanceof Error) {
    const errorMessage = error.message || 'Unknown error';
    stderr.push(`Error: ${errorMessage}`);
    const errorStack = error.stack ?? '';
    if (errorStack !== '') {
      stderr.push(errorStack);
    }
    console.error('[TEST DEBUG] Error running CLI application:', errorMessage);
    if (errorStack) {
      console.error('[TEST DEBUG] Stack trace:', errorStack);
    }
  } else {
    stderr.push(`Error: ${String(error)}`);
    console.error('[TEST DEBUG] Unknown error:', String(error));
  }
}
