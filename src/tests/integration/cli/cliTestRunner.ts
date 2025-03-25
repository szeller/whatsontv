/**
 * CLI Test Runner Utility
 * 
 * This utility allows running the CLI with different arguments and capturing the output
 * for integration testing purposes.
 */
import { main } from '../../../cli.js';
import type { CliArgs } from '../../../types/cliArgs.js';
import { container } from '../../../container.js';
import type { ConsoleOutput } from '../../../interfaces/consoleOutput.js';
import type { ConfigService } from '../../../interfaces/configService.js';
import { TestConfigServiceImpl } from '../../../implementations/test/testConfigServiceImpl.js';
import { MockConsoleOutputImpl } from '../../../implementations/test/mockConsoleOutputImpl.js';
import { getTodayDate } from '../../../utils/dateUtils.js';
import util from 'util';

/**
 * Run the CLI with the given arguments and capture the output
 * @param args CLI arguments
 * @returns Promise resolving to captured stdout, stderr, and exit code
 */
export async function runCli(args: Partial<CliArgs>): Promise<{
  stdout: string[];
  stderr: string[];
  exitCode: number;
}> {
  // Capture output
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode = 0;

  // Create a MockConsoleOutputImpl instance
  const mockConsoleOutput = new MockConsoleOutputImpl();

  // Store original methods to avoid unbound method issues
  const originalLogFn = mockConsoleOutput.log.bind(mockConsoleOutput);
  const originalErrorFn = mockConsoleOutput.error.bind(mockConsoleOutput);
  const originalWarnFn = mockConsoleOutput.warn.bind(mockConsoleOutput);
  const originalLogWithLevelFn = mockConsoleOutput.logWithLevel.bind(mockConsoleOutput);

  // Override methods to capture output in our format
  mockConsoleOutput.log = (message?: string): void => {
    if (message !== undefined) {
      stdout.push(message);
    }
    originalLogFn(message);
  };

  mockConsoleOutput.error = (message?: string, ...args: unknown[]): void => {
    if (message !== undefined) {
      stderr.push([message, ...args.map(a => String(a))].join(' '));
      exitCode = 1;
    }
    originalErrorFn(message, ...args);
  };

  mockConsoleOutput.warn = (message?: string, ...args: unknown[]): void => {
    if (message !== undefined) {
      // Add warnings to stdout with a prefix to distinguish them
      const argsStr = args.map(a => String(a)).join(' ');
      const warnMsg = `[WARN] ${message} ${argsStr}`;
      stdout.push(warnMsg);
    }
    originalWarnFn(message, ...args);
  };

  mockConsoleOutput.logWithLevel = (
    level: 'log' | 'error',
    message?: string,
    ...args: unknown[]
  ): void => {
    if (message !== undefined) {
      const formattedMessage = [message, ...args.map(a => String(a))].join(' ');
      if (level === 'log') {
        stdout.push(formattedMessage);
      } else {
        stderr.push(formattedMessage);
        exitCode = 1;
      }
    }
    originalLogWithLevelFn(level, message, ...args);
  };

  // Register mock ConsoleOutput
  const originalConsoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
  container.register('ConsoleOutput', { useValue: mockConsoleOutput });

  // Register mock ConfigService
  const originalConfigService = container.resolve<ConfigService>('ConfigService');

  // Create a test config service with the CLI args
  const testConfigService = new TestConfigServiceImpl(
    {
      date: args.date ?? getTodayDate(),
      country: args.country ?? 'US',
      types: args.types ?? [],
      networks: args.networks ?? [],
      genres: args.genres ?? [],
      languages: args.languages ?? [],
      webOnly: args.webOnly ?? false,
      showAll: args.showAll ?? false
    },
    {
      debug: args.debug ?? false,
      timeSort: args.timeSort ?? false,
      slack: args.slack ?? false,
      help: args.help ?? false,
      version: args.version ?? false,
      limit: args.limit ?? 0
    },
    {
      appName: 'WhatsOnTV-Test',
      version: '1.0.0-test',
      apiUrl: 'https://api.tvmaze.com',
      country: 'US',
      types: [],
      networks: [],
      genres: [],
      languages: ['English'],
      notificationTime: '9:00',
      slack: {
        enabled: false,
        botToken: undefined,
        channel: undefined
      }
    }
  );

  // Register the test config service
  container.register('ConfigService', { useValue: testConfigService });

  try {
    // Debug: Log the test configuration
    console.warn(
      'Test Configuration:',
      util.inspect(
        {
          showOptions: testConfigService.getShowOptions(),
          cliOptions: testConfigService.getCliOptions()
        },
        { depth: null, colors: true }
      )
    );

    // Run the CLI with the configured test services
    await main();
  } catch (error) {
    exitCode = 1;
    stderr.push(`Uncaught exception: ${String(error)}`);
  } finally {
    // Restore original services
    container.register('ConsoleOutput', { useValue: originalConsoleOutput });
    container.register('ConfigService', { useValue: originalConfigService });
  }

  return {
    stdout,
    stderr,
    exitCode
  };
}
