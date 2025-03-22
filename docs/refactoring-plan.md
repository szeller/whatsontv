# WhatsOnTV Refactoring Plan

## Overview

This document outlines a comprehensive plan for refactoring the WhatsOnTV application to improve its architecture, maintainability, and testability. The refactoring focuses on creating a consistent class-based approach for both console and Slack output mechanisms.

## Goals

1. Create a consistent interface between console and Slack implementations
2. Improve testability without relying on excessive mocking
3. Handle different TV show display cases consistently
4. Reduce code duplication
5. Improve separation of concerns

## Architecture

### Interfaces

```
src/
  interfaces/
    outputService.ts     # Common interface for output services
    showFormatter.ts     # Common interface for formatters
    consoleOutput.ts     # Interface for low-level console operations
```

### Formatters

```
src/
  formatters/
    consoleFormatter.ts  # Console-specific formatting
    slackFormatter.ts    # Slack-specific formatting
```

### Services

```
src/
  services/
    consoleOutputService.ts     # Console output service
    slackOutputService.ts       # Slack output service
```

### Utilities

```
src/
  utils/
    consoleOutput.ts     # Implementation of low-level console operations
```

## Interface Definitions

### OutputService Interface

```typescript
// src/interfaces/outputService.ts
import type { Show } from '../types/tvmaze.js';

/**
 * Interface for output services that display TV show information
 */
export interface OutputService {
  /**
   * Display TV shows using this output service
   * @param shows Array of TV shows to display
   * @param timeSort Whether to sort shows by time
   * @returns Promise that resolves when shows are displayed
   */
  displayShows(shows: Show[], timeSort?: boolean): Promise<void>;
  
  /**
   * Check if the output service is properly initialized
   * @returns True if the service is ready to use
   */
  isInitialized(): boolean;
}
```

### ShowFormatter Interface

```typescript
// src/interfaces/showFormatter.ts
import type { Show } from '../types/tvmaze.js';

/**
 * Interface for formatters that format TV show information
 */
export interface ShowFormatter {
  /**
   * Format a single show for display
   * @param show Show to format
   * @returns Formatted show string
   */
  formatShow(show: Show): string;
  
  /**
   * Format a show with a specific airtime
   * @param show Show with a specific airtime
   * @returns Formatted show string
   */
  formatTimedShow(show: Show): string;
  
  /**
   * Format a show with no specific airtime (TBA)
   * @param show Show with no specific airtime
   * @returns Formatted show string
   */
  formatUntimedShow(show: Show): string;
  
  /**
   * Format multiple episodes of the same show with no specific airtime
   * @param shows Multiple episodes of the same show
   * @returns Formatted show string
   */
  formatMultipleEpisodes(shows: Show[]): string;
  
  /**
   * Format a group of shows by network
   * @param networkGroups Shows grouped by network
   * @param timeSort Whether to sort shows by time
   * @returns Formatted output (implementation-specific)
   */
  formatNetworkGroups(networkGroups: Record<string, Show[]>, timeSort?: boolean): unknown;
}
```

### ConsoleOutput Interface

```typescript
// src/interfaces/consoleOutput.ts
/**
 * Interface for low-level console operations
 * Provides a wrapper around console functions for better testability
 */
export interface ConsoleOutput {
  /**
   * Log a message to the console
   * @param message Message to log
   */
  log: (message?: string) => void;
  
  /**
   * Log an error message to the console
   * @param message Error message
   * @param args Additional arguments
   */
  error: (message?: string, ...args: unknown[]) => void;
  
  /**
   * Log a message with a specific level
   * @param level Log level (log or error)
   * @param message Message to log
   * @param args Additional arguments
   */
  logWithLevel: (level: 'log' | 'error', message?: string, ...args: unknown[]) => void;
}
```

## TV Show Display Cases

The formatters will handle three distinct display cases:

1. **Shows with specific airtimes**: One or more episodes of the same show on a given day where each has a specific time
   ```
   20:00  ABC  Scripted  9-1-1  S8E11  Holy Mother of God
   ```

2. **Single show with no specific time**: A show with no specific time and only one episode
   ```
   TBA    Prime Video  Scripted  Reacher  S3E7  L.A. Story
   ```

3. **Multiple episodes with no specific time**: A show with no specific time and multiple episodes
   ```
   TBA    Netflix  Scripted  The Residence  Multiple
          S1E1  The Fall of the House of Usher
          S1E2  Dial M for Murder
          ...
   ```

## Implementation Plan

### Phase 1: Create Base Files

1. Create interface files:
   - `src/interfaces/outputService.ts`
   - `src/interfaces/showFormatter.ts`
   - `src/interfaces/consoleOutput.ts`
   - `src/types/slack.ts`

2. Create formatter classes:
   - `src/formatters/consoleFormatter.ts`
   - `src/formatters/slackFormatter.ts`

3. Create output service classes:
   - `src/services/consoleOutputService.ts`
   - `src/services/slackOutputService.ts`

4. Create utility implementations:
   - `src/utils/consoleOutput.ts`

### Phase 2: Console Refactoring

1. Move the `ConsoleOutput` interface from `utils/console.ts` to `interfaces/consoleOutput.ts`
2. Move the implementation from `console.ts` to `utils/consoleOutput.ts`
3. Update the `ConsoleOutputService` to use the new interface
4. Migrate functionality from the old `consoleOutput.ts` to appropriate classes
5. Remove the old `console.ts` and `consoleOutput.ts` files

### Phase 3: Slack Integration

1. Implement the Slack formatter and output service
2. Add Slack-specific configuration
3. Integrate with the main application

## Console-Related Refactoring

To address naming inconsistencies in the console-related classes, we will perform the following steps:

1. Rename `consoleOutput.ts` to `consoleUtils.ts` to better reflect its utility nature.
2. Update all references to `consoleOutput.ts` to use the new name `consoleUtils.ts`.
3. Review and refactor any inconsistent naming conventions in the console-related classes.

## Benefits

1. **Consistent Architecture**: All output mechanisms follow the same pattern
2. **Improved Testability**: Classes can be tested in isolation
3. **Separation of Concerns**: Clear separation between formatting and output logic
4. **Reduced Duplication**: Common code is shared through interfaces
5. **Extensibility**: New output formats can be added by implementing the same interfaces

## Implementation Notes

### Dependency Injection

We'll use tsyringe for dependency injection to make testing easier:

```typescript
// Example DI setup
import { container } from 'tsyringe';
import { ConsoleFormatter } from './formatters/consoleFormatter.js';
import { ConsoleOutputService } from './services/consoleOutputService.js';
import { consoleOutput } from './utils/consoleOutput.js';
import { TvMazeService } from './services/tvMazeService.js';

// Register implementations
container.register('ConsoleOutput', { useValue: consoleOutput });
container.register('ShowFormatter', { useClass: ConsoleFormatter });
container.register('OutputService', { useClass: ConsoleOutputService });
container.register('TvShowService', { useClass: TvMazeService });
```

### Testing

The new architecture makes testing much easier:

```typescript
// Example test
import { ConsoleOutputService } from '../services/consoleOutputService';
import { createMockConsole } from '../utils/consoleOutput';

describe('ConsoleOutputService', () => {
  it('should display shows correctly', async () => {
    // Create mocks
    const mockConsole = createMockConsole();
    const mockFormatter = { formatNetworkGroups: jest.fn().mockReturnValue('formatted output') };
    const mockTvService = { groupShowsByNetwork: jest.fn().mockReturnValue({}) };
    
    // Create service with mocks
    const service = new ConsoleOutputService(
      mockFormatter as any,
      mockConsole as any,
      mockTvService as any
    );
    
    // Test the service
    await service.displayShows([]);
    
    // Verify output
    expect(mockConsole.getOutput()).toContain('formatted output');
  });
});
