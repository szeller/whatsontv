# Utility Refactoring Plan - Issue #63

## Overview

This document outlines the plan for implementing GitHub issue #63, which involves moving utility functions from console-specific implementations to shared utility modules. The goal is to improve code reusability and maintainability, especially as we anticipate adding additional interfaces beyond the console (e.g., Slack, web interface) in the future.

## Current State Analysis

After reviewing the codebase, I've identified several utility functions in console implementations that are not console-specific and could be moved to shared utility modules. These functions are currently located in:

1. `src/implementations/console/consoleFormatterImpl.ts`
2. `src/implementations/console/consoleOutputServiceImpl.ts`

The existing utility modules include:

1. `src/utils/showUtils.ts` - Utilities for working with TV show data
2. `src/utils/dateUtils.ts` - Date and time formatting utilities
3. `src/utils/stringUtils.ts` - String manipulation utilities
4. `src/utils/tvMazeUtils.ts` - TVMaze API-specific utilities

## Functions to Refactor

### 1. Time Formatting Functions

#### Current Implementation

In `consoleOutputServiceImpl.ts`, there's a time conversion function embedded within `sortShowsByTime`:

```typescript
const getTimeInMinutes = (timeStr: string): number => {
  // Normalize the time format
  let hours = 0;
  let minutes = 0;
  
  // Handle various time formats
  if (timeStr.includes(':')) {
    // Format: "HH:MM" or "H:MM" with optional AM/PM
    const timeParts = timeStr.split(':');
    hours = parseInt(timeParts[0], 10);
    
    // Extract minutes, removing any AM/PM suffix
    const minutesPart = timeParts[1].replace(/\s*[APap][Mm].*$/, '');
    minutes = parseInt(minutesPart, 10);
    
    // Handle AM/PM if present
    const isPM = /\s*[Pp][Mm]/.test(timeStr);
    const isAM = /\s*[Aa][Mm]/.test(timeStr);
    
    if (isPM && hours < 12) {
      hours += 12;
    } else if (isAM && hours === 12) {
      hours = 0;
    }
  } else {
    // Format without colon, assume it's just hours
    hours = parseInt(timeStr, 10);
  }
  
  return hours * 60 + minutes;
};
```

#### Proposed Solution

This functionality largely overlaps with the existing `convertTimeToMinutes` function in `dateUtils.ts`. The console implementation should be updated to use the shared utility function instead.

### 2. String Formatting and Validation Functions

#### Current Implementation

In `consoleFormatterImpl.ts` and `consoleOutputServiceImpl.ts`, there are multiple instances of string validation:

```typescript
const network = show.network !== null && show.network !== '' ? show.network : 'Unknown';
const type = show.type !== null && show.type !== '' ? show.type : 'Unknown';
const showName = show.name !== null && show.name !== '' ? show.name : 'Unknown';
```

#### Proposed Solution

Create a new utility function in `stringUtils.ts`:

```typescript
/**
 * Get a string value or a default if empty/null/undefined
 * This is an enhanced version of getStringOrDefault that handles more cases
 * @param value - The string to check
 * @param defaultValue - The default value to use
 * @returns The input value if valid, or the default value
 */
export function getStringValue(value: string | null | undefined, defaultValue: string): string {
  if (value === undefined || value === null || value === '') {
    return defaultValue;
  }
  return value;
}
```

### 3. Show Sorting and Grouping Functions

#### Current Implementation

The `sortShowsByTime` function in `consoleOutputServiceImpl.ts` duplicates functionality that's already in `showUtils.ts`. However, the implementation in `consoleOutputServiceImpl.ts` has some additional logic for handling AM/PM time formats.

#### Proposed Solution

The console implementation should be updated to use the shared `sortShowsByTime` function from `showUtils.ts`, which already uses the `convertTimeToMinutes` function from `dateUtils.ts`.

### 4. Output Formatting Functions

#### Current Implementation

In `consoleFormatterImpl.ts`, there are several formatting functions that could be generalized:

```typescript
public formatTimedShow(show: Show): string {
  // Extract show information
  const time = show.airtime !== null && show.airtime !== '' ? show.airtime : this.NO_AIRTIME;
  const network = show.network !== null && show.network !== '' ? show.network : 'N/A';
  const type = show.type !== null && show.type !== '' ? show.type : 'N/A';
  const showName = show.name !== null && show.name !== '' ? show.name : 'Unknown';
  const episodeInfo = `S${show.season}E${show.number}`;
  
  // Format each component with consistent padding
  const timeStr: string = time.padEnd(this.PAD_LENGTHS.time);
  const networkStr: string = this.styleService.boldCyan(
    network.padEnd(this.PAD_LENGTHS.network)
  );
  const typeStr: string = this.styleService.magenta(type.padEnd(this.PAD_LENGTHS.type));
  const showNameStr: string = this.styleService.green(
    showName.padEnd(this.PAD_LENGTHS.showName)
  );
  const episodeInfoStr: string = this.styleService.yellow(
    episodeInfo.padEnd(this.PAD_LENGTHS.episodeInfo)
  );
  
  // Combine all components with consistent spacing
  const headerLine = `${timeStr} ${networkStr} ${typeStr} ${showNameStr} ${episodeInfoStr}`;
  return headerLine;
}
```

#### Proposed Solution

Create a new utility module `src/utils/formatUtils.ts` with the following functions:

```typescript
/**
 * Format episode information in standard format
 * @param season - Season number
 * @param episode - Episode number
 * @returns Formatted episode string (e.g., "S1E1")
 */
export function formatEpisodeInfo(season: number, episode: number): string {
  return `S${season}E${episode}`;
}

/**
 * Pad a string to a specified length
 * @param value - String to pad
 * @param length - Desired length
 * @param padChar - Character to use for padding (default: space)
 * @returns Padded string
 */
export function padString(value: string, length: number, padChar: string = ' '): string {
  return value.padEnd(length, padChar);
}

/**
 * Create a separator line of specified length
 * @param length - Length of separator line
 * @param char - Character to use for separator (default: '-')
 * @returns Separator line
 */
export function createSeparator(length: number, char: string = '-'): string {
  return char.repeat(length);
}
```

### 5. Command Line Argument Parsing

#### Current Implementation

In `consoleOutputServiceImpl.ts`, there's a method for parsing command line arguments:

```typescript
public parseArgs(args?: string[]): ConsoleCliArgs {
  return yargs(args || process.argv.slice(2))
    .options({
      date: {
        alias: 'd',
        describe: 'Date to show TV schedule for (YYYY-MM-DD)',
        type: 'string',
        default: getTodayDate()
      },
      // ... more options
    })
    .help()
    .alias('help', 'h')
    .parseSync() as ConsoleCliArgs;
}
```

#### Proposed Solution

Move this functionality to a dedicated utility module `src/utils/cliUtils.ts`:

```typescript
import yargs from 'yargs';
import type { Arguments } from 'yargs';
import { getTodayDate } from './dateUtils.js';

/**
 * CLI arguments interface
 */
export interface CliArgs extends Arguments {
  date: string;
  country: string;
  types: string[];
  networks: string[];
  genres: string[];
  languages: string[];
  debug: boolean;
  fetch: 'network' | 'web' | 'all';
  help: boolean;
}

/**
 * Parse command line arguments
 * @param args - Command line arguments (optional)
 * @returns Parsed command line arguments
 */
export function parseCliArgs(args?: string[]): CliArgs {
  return yargs(args || process.argv.slice(2))
    .options({
      date: {
        alias: 'd',
        describe: 'Date to show TV schedule for (YYYY-MM-DD)',
        type: 'string',
        default: getTodayDate()
      },
      // ... more options
    })
    .help()
    .alias('help', 'h')
    .parseSync() as CliArgs;
}
```

## Implementation Plan

### 1. Create New Utility Functions

1. Create `src/utils/formatUtils.ts` with the following functions:
   - `formatEpisodeInfo(season: number, episode: number): string`
   - `padString(value: string, length: number, padChar: string = ' '): string`
   - `createSeparator(length: number, char: string = '-'): string`

2. Create `src/utils/cliUtils.ts` with the following functions:
   - `parseCliArgs(args?: string[]): CliArgs`

3. Update `src/utils/stringUtils.ts` with:
   - `getStringValue(value: string | null | undefined, defaultValue: string): string`

### 2. Update Console Implementations

1. Update `src/implementations/console/consoleFormatterImpl.ts` to:
   - Import and use `formatEpisodeInfo`, `padString`, and `createSeparator` from `formatUtils.ts`
   - Import and use `getStringValue` from `stringUtils.ts`

2. Update `src/implementations/console/consoleOutputServiceImpl.ts` to:
   - Remove the embedded `getTimeInMinutes` function and use `convertTimeToMinutes` from `dateUtils.ts`
   - Use `sortShowsByTime` from `showUtils.ts` instead of the local implementation
   - Move `parseArgs` method to `cliUtils.ts` and use the shared function

### 3. Update Tests

1. Update tests to reflect the refactored code
2. Add tests for the new utility functions
3. Ensure all existing tests pass with the refactored code

## Benefits

1. **Improved Code Reusability**: Utility functions will be available to all implementations, not just console
2. **Better Separation of Concerns**: Console implementations will focus on console-specific functionality
3. **Reduced Duplication**: Eliminates duplicate code across different implementations
4. **Easier Maintenance**: Changes to utility functions will be made in one place
5. **Simplified Implementation of New Interfaces**: New interfaces can leverage existing utility functions

## Acceptance Criteria

- [ ] All identified utility functions are moved to appropriate shared modules
- [ ] Console implementations are updated to use the shared utilities
- [ ] No functionality is changed or broken
- [ ] All tests pass
- [ ] Code coverage is maintained or improved

## Potential Risks and Mitigations

1. **Risk**: Breaking changes to existing functionality
   **Mitigation**: Comprehensive test coverage and careful refactoring

2. **Risk**: Performance impact from additional function calls
   **Mitigation**: Performance testing before and after refactoring

3. **Risk**: Increased complexity from additional modules
   **Mitigation**: Clear documentation and consistent naming conventions
