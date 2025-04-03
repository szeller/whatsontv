# Application Class Refactoring Specification

## Overview

This document outlines the technical approach for refactoring the WhatsOnTV application to use an Application class pattern for better separation of concerns, improved testability, and enhanced maintainability. This refactoring addresses GitHub issue #69.

## Current Implementation Analysis

The current implementation has several limitations:

1. **Tightly Coupled Components**: The `cli.ts` file directly resolves services from the container, making testing difficult.
2. **Mixed Concerns**: Error handling, initialization, and execution logic are intermingled.
3. **Limited Reusability**: The current structure makes it challenging to reuse code for different execution contexts (CLI, Slack, etc.).
4. **Testing Complexity**: Integration tests require complex setup with mocked services.
5. **Optional Interface Methods**: The `OutputService` interface has optional methods, creating inconsistency.

## Proposed Architecture

### Core Components

1. **Application Class**: A central class that encapsulates the application lifecycle and dependencies.
2. **ApplicationConfig**: Simple configuration object for customizing application behavior.
3. **Direct Container Integration**: Use the container directly but in a controlled way.

### Application Class Design

```typescript
/**
 * Core application class that encapsulates the application lifecycle
 */
export class Application {
  private readonly services: AppServices;
  private readonly config: ApplicationConfig;
  private initialized = false;

  constructor(services: AppServices, config: ApplicationConfig) {
    this.services = services;
    this.config = config;
  }

  /**
   * Initialize the application
   * Validates services and configuration
   */
  public initialize(): boolean {
    try {
      // Validate required services
      this.validateServices();
      
      // Set up global error handlers if configured
      if (this.config.setupGlobalErrorHandlers) {
        this.setupGlobalErrorHandlers();
      }
      
      // Check if OutputService is initialized
      if (!this.services.outputService.isInitialized()) {
        throw new Error('OutputService failed to initialize');
      }
      
      this.initialized = true;
      return true;
    } catch (error) {
      this.handleError(error);
      return false;
    }
  }

  /**
   * Run the application
   * Executes the main application logic
   */
  public async run(): Promise<void> {
    if (!this.initialized) {
      this.services.consoleOutput.error('Application not initialized. Call initialize() first.');
      return;
    }

    try {
      // Display header
      this.services.outputService.displayHeader();
      
      // Process command (help, version, or show listing)
      await this.processCommand();
      
      // Display footer
      this.services.outputService.displayFooter();
    } catch (error) {
      this.handleError(error);
    }
  }

  /**
   * Process the requested command based on configuration
   */
  private async processCommand(): Promise<void> {
    const cliOptions = this.services.configService.getCliOptions();
    
    // Handle help request
    if (cliOptions.help) {
      const helpText = this.services.configService.getHelpText();
      this.services.outputService.displayHelp(helpText);
      return;
    }
    
    // Handle version request
    if (cliOptions.version) {
      const version = this.services.configService.getVersion();
      this.services.outputService.displayVersion(version);
      return;
    }
    
    // Default: fetch and display shows
    const showOptions = this.services.configService.getShowOptions();
    const shows = await this.services.tvShowService.fetchShows(showOptions);
    
    // Debug information if enabled
    if (cliOptions.debug && !this.config.testMode) {
      this.outputDebugInfo(shows);
    }
    
    // Display shows (always sort by time, allow toggling network grouping)
    const groupByNetwork = cliOptions.groupByNetwork ?? true;
    await this.services.outputService.displayShows(shows, groupByNetwork);
  }

  /**
   * Output debug information about shows
   */
  private outputDebugInfo(shows: Show[]): void {
    const uniqueNetworks = new Set<string>();
    
    for (const show of shows) {
      if (show.network) {
        uniqueNetworks.add(show.network);
      }
    }
    
    this.services.consoleOutput.log('\nAvailable Networks:');
    this.services.consoleOutput.log([...uniqueNetworks].sort().join(', '));
    this.services.consoleOutput.log(`\nTotal Shows: ${shows.length}`);
  }

  /**
   * Set up global error handlers
   */
  private setupGlobalErrorHandlers(): void {
    process.on('uncaughtException', (error) => this.handleError(error));
    process.on('unhandledRejection', (reason) => this.handleError(reason));
  }

  /**
   * Validate that all required services are available
   */
  private validateServices(): void {
    const requiredServices: Array<keyof AppServices> = [
      'outputService',
      'tvShowService',
      'configService',
      'consoleOutput'
    ];
    
    for (const service of requiredServices) {
      if (!this.services[service]) {
        throw new Error(`Required service '${service}' is missing`);
      }
    }
  }

  /**
   * Handle errors consistently throughout the application
   */
  private handleError(error: unknown): void {
    const output = this.services.consoleOutput;
    
    if (error === null || error === undefined) {
      output.error('Unknown error occurred');
      return;
    }
    
    if (error instanceof Error) {
      output.error(`Error: ${error.name}: ${error.message}`);
      if (error.stack && this.config.verbose) {
        output.error(error.stack);
      }
    } else {
      output.error(`Error: ${String(error)}`);
    }
  }

  /**
   * Create an Application instance from the container
   */
  public static createFromContainer(config: Partial<ApplicationConfig> = {}): Application {
    const defaultConfig: ApplicationConfig = {
      setupGlobalErrorHandlers: true,
      testMode: process.env.NODE_ENV === 'test',
      verbose: process.env.DEBUG === 'true',
    };
    
    const mergedConfig = { ...defaultConfig, ...config };
    
    // Resolve services directly from container
    const services: AppServices = {
      outputService: container.resolve<OutputService>('OutputService'),
      tvShowService: container.resolve<TvShowService>('TvShowService'),
      configService: container.resolve<ConfigService>('ConfigService'),
      consoleOutput: container.resolve<ConsoleOutput>('ConsoleOutput')
    };
    
    return new Application(services, mergedConfig);
  }

  /**
   * Create an Application instance with custom services (for testing)
   * This maintains compatibility with existing test approaches
   */
  public static createWithServices(
    services: AppServices,
    config: Partial<ApplicationConfig> = {}
  ): Application {
    const defaultConfig: ApplicationConfig = {
      setupGlobalErrorHandlers: false,
      testMode: true,
      verbose: false,
    };
    
    const mergedConfig = { ...defaultConfig, ...config };
    return new Application(services, mergedConfig);
  }
}
```

### Application Configuration

```typescript
/**
 * Configuration options for the Application
 * Kept simple to avoid unnecessary complexity
 */
export interface ApplicationConfig {
  /**
   * Whether to set up global error handlers (uncaughtException, unhandledRejection)
   */
  setupGlobalErrorHandlers: boolean;
  
  /**
   * Whether the application is running in test mode
   */
  testMode: boolean;
  
  /**
   * Whether to output verbose information (stack traces, etc.)
   */
  verbose: boolean;
}
```

### Application Services

```typescript
/**
 * Services required by the Application
 * This matches the existing CliServices interface for compatibility
 */
export interface AppServices {
  outputService: OutputService;
  tvShowService: TvShowService;
  configService: ConfigService;
  consoleOutput: ConsoleOutput;
}
```

## OutputService Interface Updates

The current `OutputService` interface has an optional `displayHelp` method. We'll update it to make all methods required:

```typescript
export interface OutputService {
  /**
   * Display TV shows to the user
   * @param shows List of shows to display
   * @param groupByNetwork Whether to group shows by network (default: true)
   */
  displayShows(shows: Show[], groupByNetwork?: boolean): Promise<void>;
  
  /**
   * Check if the service is properly initialized
   * @returns True if initialized, false otherwise
   */
  isInitialized(): boolean;
  
  /**
   * Display application header
   */
  displayHeader(): void;
  
  /**
   * Display application footer
   */
  displayFooter(): void;
  
  /**
   * Display help information to the user
   * @param helpText The help text to display
   */
  displayHelp(helpText: string): void;
  
  /**
   * Display version information to the user
   * @param version The version information to display
   */
  displayVersion(version: string): void;
}
```

## ConfigService Interface Updates

We'll add a method to get the version information:

```typescript
export interface ConfigService {
  /**
   * Get show options from configuration
   */
  getShowOptions(): ShowOptions;
  
  /**
   * Get CLI options from configuration
   */
  getCliOptions(): CliOptions;
  
  /**
   * Get help text for the application
   */
  getHelpText(): string;
  
  /**
   * Get version information for the application
   */
  getVersion(): string;
}
```

## CLI Implementation

The `cli.ts` file will be simplified to use the Application class:

```typescript
#!/usr/bin/env node

import 'reflect-metadata';
import { Application } from './core/application.js';

/**
 * Main function that creates and runs the CLI application
 */
export async function main(): Promise<void> {
  const app = Application.createFromContainer();
  
  if (!app.initialize()) {
    process.exit(1);
  }
  
  return app.run();
}

// Run the main function if this file is executed directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === import.meta.url.slice(7)) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
```

## Slack Implementation

The Slack implementation will follow a similar pattern:

```typescript
#!/usr/bin/env node

import 'reflect-metadata';
import { Application } from './core/application.js';
import { container } from './slackContainer.js'; // Slack-specific container

/**
 * Main function that creates and runs the Slack application
 */
export async function main(): Promise<void> {
  const app = Application.createFromContainer({
    setupGlobalErrorHandlers: true
  });
  
  if (!app.initialize()) {
    process.exit(1);
  }
  
  return app.run();
}

// Run the main function if this file is executed directly
if (import.meta.url.startsWith('file:') && 
    process.argv[1] === import.meta.url.slice(7)) {
  main().catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
```

## Testing Approach

The Application class design makes testing easier while maintaining compatibility with existing test approaches:

```typescript
describe('Application', () => {
  // Use the existing test helpers and mocks
  let mockOutputService: MockOutputService;
  let mockTvShowService: MockTvShowService;
  let mockConfigService: TestConfigServiceImpl;
  let mockConsoleOutput: MockConsoleOutputImpl;
  let app: Application;
  
  beforeEach(() => {
    // Create services using existing test implementations
    mockConsoleOutput = new MockConsoleOutputImpl();
    mockConfigService = new TestConfigServiceImpl({});
    mockOutputService = new MockOutputService();
    mockTvShowService = new MockTvShowService();
    
    // Create application with test services
    app = Application.createWithServices({
      outputService: mockOutputService,
      tvShowService: mockTvShowService,
      configService: mockConfigService,
      consoleOutput: mockConsoleOutput
    });
  });
  
  it('should initialize successfully', () => {
    expect(app.initialize()).toBe(true);
  });
  
  it('should display help when help option is true', async () => {
    mockConfigService.setCliOptions({ help: true });
    
    app.initialize();
    await app.run();
    
    expect(mockOutputService.helpDisplayed).toBe(true);
    expect(mockOutputService.showsDisplayed).toBe(false);
  });
  
  // Additional tests...
});
```

## CLI Test Runner Updates

The current `cliTestRunner.ts` can be simplified to use the Application class while maintaining compatibility with existing tests:

```typescript
import { Application } from '../../core/application.js';
import type { CliArgs } from '../../types/cliArgs.js';
import { TestConfigServiceImpl } from '../../implementations/test/testConfigServiceImpl.js';
import { MockConsoleOutputImpl } from '../../implementations/test/mockConsoleOutputImpl.js';
import { TestOutputServiceImpl } from '../../implementations/test/testOutputServiceImpl.js';
import { TvMazeServiceImpl } from '../../implementations/tvMazeServiceImpl.js';
import { FetchHttpClientImpl } from '../../implementations/fetchHttpClientImpl.js';

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

  // Create mock console output to capture stdout/stderr
  const mockConsoleOutput = new MockConsoleOutputImpl();
  
  // Create test config service with the provided args
  const configService = new TestConfigServiceImpl(args);
  
  // Create HTTP client and TV show service
  // This maintains compatibility with the existing test approach
  const httpClient = new FetchHttpClientImpl();
  const tvShowService = new TvMazeServiceImpl(httpClient);
  
  // Create test output service
  const outputService = new TestOutputServiceImpl();
  
  // Create application with test services
  const app = Application.createWithServices({
    outputService,
    tvShowService,
    configService,
    consoleOutput: mockConsoleOutput
  });
  
  let exitCode = 0;
  
  try {
    if (!app.initialize()) {
      exitCode = 1;
    } else {
      await app.run();
    }
  } catch (error) {
    mockConsoleOutput.error(`Test error: ${String(error)}`);
    exitCode = 1;
  }
  
  return {
    stdout: mockConsoleOutput.getStdout(),
    stderr: mockConsoleOutput.getStderr(),
    exitCode
  };
}
```

## Implementation Plan

1. **Phase 1: Create Core Components**
   - Create `Application` class in `src/core/application.ts`
   - Define `ApplicationConfig` interface

2. **Phase 2: Update Service Interfaces**
   - Update `OutputService` interface to make all methods required
   - Add `displayVersion` method to `OutputService`
   - Update `ConfigService` to add `getVersion` method
   - Update implementations of these interfaces

3. **Phase 3: Refactor CLI**
   - Update `cli.ts` to use the Application class
   - Ensure all tests pass

4. **Phase 4: Update Test Runner**
   - Refactor `cliTestRunner.ts` to use the Application class
   - Maintain compatibility with existing tests

5. **Phase 5: Documentation**
   - Update documentation to reflect the new architecture

## Benefits

1. **Improved Testability**
   - Clear separation of initialization and execution
   - Easier to test different execution paths
   - Compatible with existing test approaches

2. **Better Separation of Concerns**
   - Initialization logic separate from execution
   - Error handling centralized
   - Configuration separate from application logic

3. **Enhanced Reusability**
   - Same application core can be used for CLI and Slack
   - Consistent behavior across different execution contexts

4. **Simplified Debugging**
   - Centralized error handling
   - Clear application lifecycle

5. **Minimal Complexity**
   - Direct use of container without additional abstractions
   - Simple configuration interface
   - Maintains compatibility with existing code

## Conclusion

This revised approach to the Application class refactoring provides a pragmatic balance between improving the architecture and avoiding unnecessary complexity. It addresses the key issues with the current implementation while maintaining compatibility with existing code and test approaches. The refactoring will make the codebase more maintainable and extensible without introducing excessive abstraction or increasing reliance on mocking.
