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
    consoleOutput.ts     # Console output service
    slackOutput.ts       # Slack output service
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
   - `src/types/slack.ts`

2. Create formatter classes:
   - `src/formatters/consoleFormatter.ts`
   - `src/formatters/slackFormatter.ts`

### Phase 2: Refactor Console Implementation

1. Refactor `src/utils/formatting.ts` to use the new formatter class
2. Create `src/services/consoleOutput.ts` implementing the OutputService interface
3. Update `src/cli.ts` to use the new service

### Phase 3: Implement Slack Output

1. Create `src/services/slackOutput.ts` implementing the OutputService interface
2. Refactor `src/slack.ts` to use the new service
3. Remove duplicated code from the original implementation

### Phase 4: Testing

1. Create unit tests for formatter classes:
   - `src/tests/formatters/consoleFormatter.test.ts`
   - `src/tests/formatters/slackFormatter.test.ts`

2. Create unit tests for output services:
   - `src/tests/services/consoleOutput.test.ts`
   - `src/tests/services/slackOutput.test.ts`

## Benefits

1. **Consistent Interface**: Both output mechanisms implement the same interfaces
2. **Improved Testability**: Classes can be tested in isolation
3. **Separation of Concerns**: Clear separation between formatting and output logic
4. **Reduced Duplication**: Common code is shared through interfaces
5. **Extensibility**: New output formats can be added by implementing the same interfaces

## Testing Strategy

- Unit test formatters with sample show data
- Unit test output services with mocked formatters
- Integration test the end-to-end flow with minimal mocking

This approach aligns with our goal of testing without excessive mocking while ensuring good test coverage.
