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
  // Set NODE_ENV to 'test' to suppress debug output
  process.env.NODE_ENV = 'test';

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
    // For testing, we'll call the original to allow debugging
    originalLogFn(message);
  };

  mockConsoleOutput.error = (message?: string, ...args: unknown[]): void => {
    if (message !== undefined) {
      stderr.push([message, ...args.map(a => String(a))].join(' '));
      exitCode = 1;
    }
    // For testing, we'll call the original to allow debugging
    originalErrorFn(message, ...args);
  };

  mockConsoleOutput.warn = (message?: string, ...args: unknown[]): void => {
    if (message !== undefined) {
      // Add warnings to stdout with a prefix to distinguish them
      const argsStr = args.map(a => String(a)).join(' ');
      const warnMsg = `[WARN] ${message} ${argsStr}`;
      stdout.push(warnMsg);
    }
    // For testing, we'll call the original to allow debugging
    originalWarnFn(message, ...args);
  };

  mockConsoleOutput.logWithLevel = (
    level: 'log' | 'error', 
    message?: string, 
    ...args: unknown[]
  ): void => {
    if (message !== undefined) {
      if (level === 'log') {
        stdout.push([message, ...args.map(a => String(a))].join(' '));
      } else {
        stderr.push([message, ...args.map(a => String(a))].join(' '));
        exitCode = 1;
      }
    }
    // For testing, we'll call the original to allow debugging
    originalLogWithLevelFn(level, message, ...args);
  };

  // Register mock ConsoleOutput
  const originalConsoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
  container.register('ConsoleOutput', { useValue: mockConsoleOutput });

  // Create a test config service with the provided args
  const testConfigService = new TestConfigServiceImpl(
    {
      date: args.date ?? getTodayDate(),
      country: args.country ?? 'US',
      types: args.types ?? [],
      networks: args.networks ?? [],
      genres: args.genres ?? [],
      languages: args.languages ?? [],
      fetchSource: args.fetch ?? 'network'
    },
    {
      debug: args.debug ?? false,
      help: args.help ?? false
    }
  );
  
  // Register test config service
  const originalConfigService = container.resolve<ConfigService>('ConfigService');
  container.register('ConfigService', { useValue: testConfigService });
  
  try {
    // Run the CLI
    await main();
  } catch (error) {
    // Capture any errors
    if (error instanceof Error) {
      const errorMessage = error.message || 'Unknown error';
      stderr.push(`Error: ${errorMessage}`);
      const errorStack = error.stack ?? '';
      if (errorStack !== '') {
        stderr.push(errorStack);
      }
    } else {
      stderr.push(`Error: ${String(error)}`);
    }
    exitCode = 1;
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
