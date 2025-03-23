# WhatsOnTV Refactoring Plan (Updated)

## Overview

This document outlines a comprehensive plan for refactoring the WhatsOnTV application to improve its architecture, maintainability, and testability. The refactoring focuses on creating a consistent class-based approach with proper dependency injection for both console and Slack output mechanisms.

## Goals

1. Implement consistent naming conventions to distinguish interfaces from implementations
2. Eliminate code duplication across the codebase
3. Improve separation of concerns for better testability
4. Remove unused or redundant code
5. Streamline test utilities
6. Prepare the codebase for Slack integration with maximum code reuse

## Key Principles

1. **Naming Clarity**: Implementation files should be named with an `*Impl.ts` suffix to clearly distinguish them from interfaces
2. **Single Responsibility**: Each class and function should have a clear, single responsibility
3. **Deterministic Functions**: Pure, deterministic functions should be separated from non-deterministic operations for better testability
4. **Code Reuse**: Maximize code sharing between console and Slack implementations
5. **Dependency Injection**: Use tsyringe for consistent dependency injection throughout the application

## Architecture

### Interfaces

```
src/
  interfaces/
    consoleOutput.ts     # Interface for low-level console operations
    httpClient.ts        # Interface for HTTP client operations
    outputService.ts     # Common interface for output services
    showFormatter.ts     # Common interface for formatters
    tvShowService.ts     # Interface for TV show data retrieval
```

### Implementations

```
src/
  implementations/
    gotHttpClientImpl.ts         # HTTP client implementation using got
    styleServiceImpl.ts          # Styling service implementation
    tvMazeServiceImpl.ts         # TVMaze API implementation of TvShowService
    
    console/                     # Console-specific implementations
      consoleOutputImpl.ts       # Implementation of low-level console operations
      consoleFormatterImpl.ts    # Console-specific formatting implementation
      consoleOutputServiceImpl.ts # Console output service implementation
    
    slack/                       # Slack-specific implementations
      slackFormatterImpl.ts      # Slack-specific formatting implementation
      slackOutputServiceImpl.ts  # Slack output service implementation
```

### Utilities

```
src/
  utils/
    dateUtils.ts         # Date-related utility functions
    formatting.ts        # General text formatting utilities
    ids.ts               # ID generation utilities
    showUtils.ts         # Show data manipulation functions
    styleUtils.ts        # Styling utility functions
```

## Complete File Structure

```
src/
│
├── cli.ts                                  # Command-line interface entry point
├── config.ts                               # Application configuration
├── container.ts                            # Dependency injection container setup
├── slack.ts                                # Slack integration entry point
│
├── interfaces/                             # All interface definitions
│   ├── consoleOutput.ts                    # Interface for low-level console operations
│   ├── httpClient.ts                       # Interface for HTTP client operations
│   ├── outputService.ts                    # Common interface for output services
│   ├── showFormatter.ts                    # Interface for formatting show data
│   └── tvShowService.ts                    # Interface for TV show data retrieval
│
├── implementations/                        # All concrete implementations
│   ├── gotHttpClientImpl.ts                # HTTP client implementation using got
│   ├── styleServiceImpl.ts                 # Styling service implementation
│   ├── tvMazeServiceImpl.ts                # TVMaze API implementation
│   │
│   ├── console/                            # Console-specific implementations
│   │   ├── consoleFormatterImpl.ts         # Console-specific formatting
│   │   ├── consoleOutputImpl.ts            # Low-level console operations
│   │   └── consoleOutputServiceImpl.ts     # Console output service
│   │
│   └── slack/                              # Slack-specific implementations
│       ├── slackFormatterImpl.ts           # Slack-specific formatting
│       └── slackOutputServiceImpl.ts       # Slack output service
│
├── utils/                                  # Utility functions and helpers
│   ├── dateUtils.ts                        # Date-related utility functions
│   ├── formatting.ts                       # General text formatting utilities
│   ├── ids.ts                              # ID generation utilities
│   ├── showUtils.ts                        # Show data manipulation functions
│   └── styleUtils.ts                       # Styling utility functions
│
├── types/                                  # Type definitions
│   ├── app.ts                              # Application-specific types
│   ├── config.ts                           # Configuration types
│   └── tvmaze.ts                           # TVMaze API types
│
└── tests/                                  # Test files
    ├── config.test.ts                      # Tests for configuration
    ├── setup.ts                            # Test setup
    │
    ├── interfaces/                         # Tests for interfaces
    │   └── httpClient.test.ts              # Tests for HTTP client interface
    │
    ├── implementations/                    # Tests for implementations
    │   ├── gotHttpClientImpl.test.ts       # Tests for got HTTP client
    │   ├── tvMazeServiceImpl.test.ts       # Tests for TVMaze service
    │   │
    │   └── console/                        # Tests for console implementations
    │       ├── consoleFormatterImpl.test.ts # Tests for console formatter
    │       ├── consoleOutputImpl.test.ts    # Tests for console output
    │       └── consoleOutputServiceImpl.test.ts # Tests for console output service
    │
    ├── utils/                              # Tests for utilities
    │   ├── dateUtils.test.ts               # Tests for date utilities
    │   ├── formatting.test.ts              # Tests for formatting utilities
    │   ├── showUtils.test.ts               # Tests for show utilities
    │   ├── styleUtils.test.ts              # Tests for style utilities
    │   ├── testDiContainer.ts              # Test dependency injection container
    │   └── testHelpers.ts                  # Test helper functions
    │
    └── helpers/                            # Test helpers
        └── yargsHelper.ts                  # Yargs test helpers
```

## Improving Dependency Injection

To improve dependency injection throughout the application, the following steps will be taken:

1. **Refactor Slack Integration**: Create a proper SlackOutputService class that implements OutputService, and register it in the container.
2. **Update Container Registration**: Update container.ts to use the new implementation paths and ensure all services are properly registered.
3. **Standardize Service Resolution**: Use container.resolve consistently throughout the application, and avoid direct instantiation of services.
4. **Ensure Proper Injection**: Verify that all dependencies are properly injected into each service, and that there are no circular dependencies.

### Slack Integration Dependency Injection

The current slack.ts file contains functions that should be moved to a proper service class:

```typescript
// Current approach in slack.ts
function sendTvShowNotifications(timeSort = false): Promise<void> {
  // Direct usage of TvShowService without proper DI
  const tvShowService = container.resolve<TvShowService>('TvShowService');
  // Functions like groupShowsByNetwork and formatShowDetails are defined here
  // instead of being injected or using utility functions
}
```

This should be refactored to use proper dependency injection:

```typescript
// Proper implementation with DI
@injectable()
export class SlackOutputServiceImpl implements OutputService {
  constructor(
    @inject('TvShowService') private tvShowService: TvShowService,
    @inject('ShowFormatter') private formatter: SlackFormatterImpl
  ) {}

  async displayShows(options: OutputOptions): Promise<void> {
    const shows = await this.tvShowService.getShows(options);
    const formattedContent = this.formatter.formatShowsWithAirtime(shows);
    await this.sendToSlack(formattedContent);
  }
  
  // Other methods implementing the OutputService interface
}

// Register in container
container.registerSingleton<OutputService>('SlackOutputService', SlackOutputServiceImpl);
```

The slack.ts file would then be simplified to:

```typescript
import 'reflect-metadata';
import { container } from './container.js';
import type { OutputService } from './interfaces/outputService.js';

// Initialize the service
const slackService = container.resolve<OutputService>('SlackOutputService');

// Start the notification service
slackService.startNotificationService();

// For testing
if (process.argv.includes('--test')) {
  void slackService.displayShows({ date: 'today' }).then(() => process.exit(0));
}
```

## Detailed Implementation Plan

### Phase 1: Consolidate and Rename Files

1. **Consolidate TV Show Services**:
   - Keep `tvMazeServiceImpl.ts` as the primary implementation of the TvShowService interface
   - Remove `tvShowService.ts` and update all references
   - Update container.ts to register TvMazeServiceImpl for the TvShowService interface

2. **Create New Directory Structure**:
   - Create `src/implementations` directory
   - Create `src/implementations/console` directory
   - Create `src/implementations/slack` directory

3. **Rename and Move Implementation Files**:
   - Move and rename `consoleFormatter.ts` to `implementations/console/consoleFormatterImpl.ts`
   - Move and rename `consoleOutput.ts` to `implementations/console/consoleOutputImpl.ts`
   - Move and rename `consoleOutputService.ts` to `implementations/console/consoleOutputServiceImpl.ts`
   - Move and rename `tvMazeService.ts` to `implementations/tvMazeServiceImpl.ts`
   - Move `httpClient.ts` to `interfaces/httpClient.ts`
   - Move and rename `gotHttpClient.ts` to `implementations/gotHttpClientImpl.ts`
   - Update all import statements accordingly

### Phase 2: Reorganize Utility Functions

1. **Create Specialized Utility Files**:
   - Extract date-related functions into `utils/dateUtils.ts`
   - Keep show-related functions in `utils/showUtils.ts`
   - Move style-related functions to `utils/styleUtils.ts`

2. **Remove Duplicated Functions**:
   - Remove duplicated functions from service classes
   - Ensure all utility functions are only defined once
   - Update all references to use the utility functions

### Phase 3: Refine Interfaces

1. **Clean Up TvShowService Interface**:
   - Remove methods that should be utilities (formatTime, groupShowsByNetwork, etc.)
   - Focus on data retrieval methods (getShowsByDate, searchShows, etc.)
   - Ensure the interface is focused on its core responsibility

2. **Update OutputService Interface**:
   - Ensure it's general enough for both console and Slack
   - Remove console-specific methods
   - Add methods that will be needed for Slack integration

### Phase 4: Improve Dependency Injection

1. **Refactor Slack Integration**:
   - Create a proper SlackOutputService class that implements OutputService
   - Register it in the container
   - Remove direct usage of TvShowService in slack.ts
   - Use dependency injection for all dependencies

2. **Update Container Registration**:
   - Update container.ts to use the new implementation paths
   - Ensure all services are properly registered
   - Use consistent registration patterns (registerSingleton vs register)

3. **Standardize Service Resolution**:
   - Use container.resolve consistently throughout the application
   - Avoid direct instantiation of services
   - Ensure all entry points (cli.ts, slack.ts) use dependency injection

### Phase 5: Prepare for Slack Integration

1. **Extract Common Formatting Logic**:
   - Identify formatting logic that can be shared between console and Slack
   - Move it to shared utility functions
   - Ensure the ShowFormatter interface is general enough

2. **Create Placeholder for Slack Implementation**:
   - Create `implementations/slack/slackFormatterImpl.ts`
   - Create `implementations/slack/slackOutputServiceImpl.ts`
   - Ensure they implement the same interfaces as their console counterparts

### Phase 6: Clean Up Tests

1. **Update Tests for New Structure**:
   - Update import statements in tests
   - Ensure tests are using the correct implementations
   - Remove tests of test utilities unless critical

2. **Simplify Test Setup**:
   - Use better mocking techniques
   - Consolidate duplicate test utilities
   - Focus tests on actual application functionality

## Specific Changes

### 1. TvShowService Interface Cleanup

Current interface includes utility methods that should be moved to utility files:

```typescript
export interface TvShowService {
  getShowsByDate(date: string): Promise<Show[]>;
  searchShows(query: string): Promise<Show[]>;
  getEpisodes(showId: number): Promise<Show[]>;
  getShows(options: { date?: string; search?: string; show?: number; }): Promise<Show[]>;
  groupShowsByNetwork(shows: Show[]): NetworkGroups; // Move to utility
  formatTime(time: string | undefined): string; // Move to utility
  sortShowsByTime(shows: Show[]): Show[]; // Move to utility
  fetchShowsWithOptions(options: {...}): Promise<Show[]>;
}
```

Cleaned up interface:

```typescript
export interface TvShowService {
  getShowsByDate(date: string): Promise<Show[]>;
  searchShows(query: string): Promise<Show[]>;
  getEpisodes(showId: number): Promise<Show[]>;
  getShows(options: { date?: string; search?: string; show?: number; }): Promise<Show[]>;
  fetchShowsWithOptions(options: {...}): Promise<Show[]>;
}
```

### 2. Container Registration Updates

```typescript
// Current
container.register<TvShowService>('TvShowService', {
  useClass: TvShowServiceImpl
});

// Updated
container.register<TvShowService>('TvShowService', {
  useClass: TvMazeServiceImpl
});

// Updated import paths
import { TvMazeServiceImpl } from './implementations/tvMazeServiceImpl.js';
import { ConsoleFormatterImpl } from './implementations/console/consoleFormatterImpl.js';
import { ConsoleOutputServiceImpl } from './implementations/console/consoleOutputServiceImpl.js';
import { GotHttpClientImpl } from './implementations/gotHttpClientImpl.js';
```

### 3. Slack Integration Dependency Injection

Current slack.ts has functions that should be in a proper service class:

```typescript
// Current approach in slack.ts
function sendTvShowNotifications(timeSort = false): Promise<void> {
  // Direct usage of TvShowService without proper DI
  const tvShowService = container.resolve<TvShowService>('TvShowService');
  // ...
}

// Better approach with proper DI
@injectable()
class SlackOutputServiceImpl implements OutputService {
  constructor(
    @inject('TvShowService') private tvShowService: TvShowService,
    @inject('ShowFormatter') private formatter: ShowFormatter
  ) {}

  async displayShows(shows: Show[], timeSort = false): Promise<void> {
    // Implementation using injected dependencies
  }
}

// Register in container
container.registerSingleton<OutputService>('SlackOutputService', SlackOutputServiceImpl);
```

### 4. Handling of Show Display Cases

The application needs to handle three distinct TV show display cases:

1. **Shows with specific airtimes**: Regular TV schedule
2. **Single show with no specific time**: Show details
3. **Multiple episodes with no specific time**: Episode list for a show

Each formatter will need to handle these cases appropriately:

```typescript
export interface ShowFormatter {
  formatShowsWithAirtime(shows: Show[]): string;
  formatShowDetails(show: Show): string;
  formatEpisodeList(episodes: Show[]): string;
}
```

## Implementation Sequence

1. Create the new directory structure
2. Rename and move implementation files
3. Reorganize utility functions
4. Update the TvShowService interface and implementation
5. Improve dependency injection throughout the application
6. Update the container registrations
7. Update the OutputService interface and implementation
8. Update tests to match the new structure
9. Create placeholders for Slack integration
10. Validate all changes with comprehensive tests

## Benefits

1. **Improved Clarity**: Clear distinction between interfaces and implementations
2. **Reduced Duplication**: Each function defined in only one place
3. **Better Testability**: Pure functions separated from non-deterministic operations
4. **Improved Maintainability**: Code organized by responsibility
5. **Future-Proofing**: Structure supports adding Slack integration
6. **Consistency**: Naming and organization follow consistent patterns
7. **Platform Separation**: Clear separation between console and Slack implementations
8. **Proper Dependency Injection**: Consistent use of DI throughout the application
9. **Type Safety**: Strong typing across all interfaces and implementations
10. **Simplified Testing**: Better mocking and test organization

## Refactoring Status (Updated 2025-03-23)

### Completed Items

1. ✅ Created the new directory structure for source code
   - Created `src/implementations` directory with console and slack subdirectories
   - Created `src/interfaces` directory for all interfaces
   - Created `src/types` directory for type definitions

2. ✅ Renamed and moved implementation files
   - Moved and renamed implementation files to follow the `*Impl.ts` naming convention
   - Created proper implementations for console and slack

3. ✅ Updated the container registrations
   - Updated container.ts to use the new implementation paths
   - Registered both default and named implementations
   - Used consistent registration patterns

4. ✅ Implemented proper dependency injection
   - Used tsyringe for dependency injection throughout the application
   - Ensured all services are properly registered in the container
   - Implemented constructor injection for all services

5. ✅ Prepared for Slack integration
   - Created placeholder implementations for Slack
   - Ensured interfaces are general enough for both console and Slack

6. ✅ Removed unused methods from interfaces
   - Removed `getEpisodes` method from TvShowService interface
   - Removed `getShowDetails` method from TvMazeServiceImpl implementation
   - Updated tests to reflect these changes

7. ✅ Improved pre-commit workflow
   - Added a test:no-coverage script to package.json
   - Updated the precommit script to run tests without coverage checks
   - Maintained coverage thresholds in Jest configuration for CI

### Remaining Items

1. 🔄 Clean up utility methods in implementations
   - **Remove utility methods from TvMazeServiceImpl**: `formatTime` and `sortShowsByTime` methods should be removed as they're not part of the TvShowService interface and are only used in tests
   - **Update tests to use utility functions directly**: Tests should import and use utility functions from the utils directory instead of accessing them through the service

2. 🔄 Resolve utility function duplication
   - Consolidate duplicate `formatTime` functions found in both dateUtils.ts and showUtils.ts
   - Keep the implementation in showUtils.ts and remove the duplicate in dateUtils.ts
   - Update any imports to use the function from showUtils.ts

3. 🔄 Ensure method signatures match interfaces
   - Update the `getShows` method in TvMazeServiceImpl to match the interface exactly
   - Current implementation has more parameters than defined in the interface

4. 🔄 Test File Refactoring
   - Several test files still reference old file paths and need to be updated:
     - `src/tests/services/consoleOutputService.test.ts` → Move to `src/tests/implementations/console/consoleOutputServiceImpl.test.ts`
     - `src/tests/services/tvMazeService.test.ts` → Remove or merge with `tvMazeServiceImpl.test.ts`
     - `src/tests/services/tvShowService.test.ts` → Update to use new implementation paths
     - `src/tests/formatters/consoleFormatter.test.ts` → Move to `src/tests/implementations/console/consoleFormatterImpl.test.ts`
     - `src/tests/utils/console.test.ts` → Move to `src/tests/implementations/console/consoleOutputImpl.test.ts`
     - `src/tests/utils/gotHttpClient.test.ts` → Move to `src/tests/implementations/gotHttpClientImpl.test.ts`

5. 🔄 Fix Import Paths in Tests
   - Update all import statements in test files to use the new file paths
   - Ensure tests are using the correct implementations
   - Fix type errors related to mocking interfaces

6. 🔄 Clean Up Empty Directories
   - Remove empty `src/services` directory
   - Remove empty `src/formatters` directory

7. 🔄 Update CLI Entry Point
   - Ensure `cli.ts` is using the container properly
   - Remove any direct instantiation of services

8. 🔄 Update Slack Entry Point
   - Ensure `slack.ts` is using the container properly
   - Remove any direct instantiation of services

9. 🔄 Improve Test Mocking
   - Simplify mocking approach in tests
   - Use consistent patterns for mocking across all tests
   - Fix TypeScript errors in test files

### Next Steps

1. Address the utility method issues in TvMazeServiceImpl:
   - Remove `formatTime` and `sortShowsByTime` methods
   - Update tests to use utility functions directly
   - Resolve the duplicate `formatTime` function in dateUtils.ts and showUtils.ts

2. Fix the `getShows` method signature in TvMazeServiceImpl to match the interface

3. Complete the test file refactoring by moving and renaming test files to match the new structure

4. Update import paths in all test files to use the new file paths

5. Fix TypeScript errors in test files, particularly related to mocking

6. Remove empty directories that are no longer needed

7. Run the full test suite to ensure all tests pass with the new structure

8. Clean up any remaining references to old file paths or structures

This refactoring is approximately 75% complete, with the main application code structure in place but several cleanup tasks and test file updates still needed to fully align with the clean architecture principles.
