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
  // Capture output
  const stdout: string[] = [];
  const stderr: string[] = [];
  let exitCode = 0;
  
  // Mock ConsoleOutput service
  const mockConsoleOutput: ConsoleOutput = {
    log: (message?: string): void => {
      if (message !== undefined) {
        stdout.push(message);
      }
    },
    error: (message?: string, ...args: unknown[]): void => {
      if (message !== undefined) {
        stderr.push([message, ...args.map(a => String(a))].join(' '));
        exitCode = 1;
      }
    },
    warn: (message?: string, ...args: unknown[]): void => {
      if (message !== undefined) {
        // Add warnings to stdout with a prefix to distinguish them
        stdout.push(`[WARN] ${[message, ...args.map(a => String(a))].join(' ')}`);
      }
    },
    logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]): void => {
      if (message !== undefined) {
        const formattedMessage = [message, ...args.map(a => String(a))].join(' ');
        if (level === 'log') {
          stdout.push(formattedMessage);
        } else {
          stderr.push(formattedMessage);
          exitCode = 1;
        }
      }
    }
  };
  
  // Register mock ConsoleOutput
  const originalConsoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
  container.register('ConsoleOutput', { useValue: mockConsoleOutput });
  
  try {
    // Run the CLI with the provided args
    // Cast to CliArgs with default values for required properties
    const fullArgs: CliArgs = {
      date: args.date ?? getTodayDate(),
      country: args.country ?? 'US',
      types: args.types ?? [],
      networks: args.networks ?? [],
      genres: args.genres ?? [],
      languages: args.languages ?? [],
      timeSort: args.timeSort ?? false,
      debug: args.debug ?? false,
      query: args.query ?? '',
      slack: args.slack ?? false,
      help: args.help ?? false,
      version: args.version ?? false,
      limit: args.limit ?? 0
    };
    
    await main(fullArgs);
  } catch (error) {
    exitCode = 1;
    stderr.push(`Uncaught exception: ${String(error)}`);
  } finally {
    // Restore original ConsoleOutput
    container.register('ConsoleOutput', { useValue: originalConsoleOutput });
  }
  
  return {
    stdout,
    stderr,
    exitCode
  };
}
