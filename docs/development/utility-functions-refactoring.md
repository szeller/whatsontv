# Utility Functions Refactoring Plan (Issue #63)

## Overview

This document provides a detailed plan for refactoring utility functions from console-specific implementations to shared utility modules. This refactoring will improve code reusability, maintainability, and facilitate the implementation of additional interfaces beyond the console.

## Utility Functions to Refactor

### Time Handling Utilities (`dateUtils.ts`)

| Function Name | Current Location | Proposed Signature | Functionality |
|---------------|------------------|-------------------|---------------|
| `parseTimeString` | `consoleOutputServiceImpl.ts` (inside `sortShowsByTime`) | `parseTimeString(timeStr: string): { hours: number; minutes: number }` | Parses a time string in various formats (HH:MM, H:MM AM/PM) to hours and minutes |
| `getTimeInMinutes` | `consoleOutputServiceImpl.ts` (inside `sortShowsByTime`) | `getTimeInMinutes(timeStr: string): number` | Converts a time string to minutes since midnight for comparison |
| `formatTimeWithPeriod` | `consoleFormatterImpl.ts` (implicit in `formatTimedShow`) | `formatTimeWithPeriod(time: string): string` | Formats a time string to a standardized format with AM/PM indicator |
| `isValidTime` | N/A (new utility) | `isValidTime(time: string): boolean` | Validates if a string is a valid time format |
| `normalizeTimeFormat` | N/A (new utility) | `normalizeTimeFormat(time: string): string` | Standardizes time format for consistent display |

### Show Data Manipulation Utilities (`showUtils.ts`)

| Function Name | Current Location | Proposed Signature | Functionality |
|---------------|------------------|-------------------|---------------|
| `sortShowsByTime` | `consoleOutputServiceImpl.ts` | `sortShowsByTime(shows: Show[]): Show[]` | Sorts shows by airtime (existing in `showUtils.ts` but implementation in `consoleOutputServiceImpl.ts` has more features) |
| `getNetworkName` | `consoleOutputServiceImpl.ts` (inside `groupShowsByNetwork`) | `getNetworkName(show: Show): string` | Extracts network name with fallback to "Unknown Network" |
| `buildShowKey` | N/A (new utility) | `buildShowKey(show: Show): string` | Creates a unique key for a show (useful for deduplication) |
| `categorizeShowsByType` | N/A (new utility) | `categorizeShowsByType(shows: Show[]): Record<string, Show[]>` | Groups shows by their type (scripted, reality, etc.) |
| `filterShowsByAttributes` | N/A (new utility) | `filterShowsByAttributes(shows: Show[], options: FilterOptions): Show[]` | Combined filter for multiple attributes (language, genre, etc.) |

### Text Formatting Utilities (`formatUtils.ts`)

| Function Name | Current Location | Proposed Signature | Functionality |
|---------------|------------------|-------------------|---------------|
| `padString` | `consoleFormatterImpl.ts` (implicit) | `padString(str: string, length: number, padChar: string = ' '): string` | Pads a string to a specific length with fallback handling |
| `truncateString` | `consoleFormatterImpl.ts` (implicit) | `truncateString(str: string, maxLength: number, suffix: string = '...'): string` | Truncates a string to a maximum length with suffix |
| `formatNetworkName` | `consoleFormatterImpl.ts` (implicit in formatting) | `formatNetworkName(network: string): string` | Formats network name consistently with fallbacks |
| `formatShowType` | `consoleFormatterImpl.ts` (implicit in formatting) | `formatShowType(type: string): string` | Formats show type consistently with fallbacks |
| `formatEpisodeInfo` | `consoleFormatterImpl.ts` (implicit in formatting) | `formatEpisodeInfo(season: number, episode: number): string` | Formats episode information (S01E01 format) |

### Output Formatting Utilities (`outputUtils.ts`)

| Function Name | Current Location | Proposed Signature | Functionality |
|---------------|------------------|-------------------|---------------|
| `formatTableRow` | N/A (new utility) | `formatTableRow(columns: string[], widths: number[]): string` | Creates a formatted table row with proper spacing |
| `createTableHeader` | N/A (new utility) | `createTableHeader(headers: string[], widths: number[]): string[]` | Creates a table header with optional separator line |
| `formatListWithSeparator` | N/A (new utility) | `formatListWithSeparator(items: string[], separator: string = ', '): string` | Joins list items with a separator and handles edge cases |
| `wrapText` | N/A (new utility) | `wrapText(text: string, maxWidth: number): string[]` | Wraps text to fit within a specified width |
| `createBulletList` | N/A (new utility) | `createBulletList(items: string[], bulletChar: string = '• '): string[]` | Creates a bullet list from an array of items |

## Detailed Function Specifications

### Time Handling Utilities

#### `parseTimeString(timeStr: string): { hours: number; minutes: number }`

**Current Location**: Inside `sortShowsByTime` in `consoleOutputServiceImpl.ts`  
**Description**: Parses a time string to extract hours and minutes, handling various formats including AM/PM notation.

```typescript
export function parseTimeString(timeStr: string): { hours: number; minutes: number } {
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
  
  return { hours, minutes };
}
```

#### `getTimeInMinutes(timeStr: string): number`

**Current Location**: Inside `sortShowsByTime` in `consoleOutputServiceImpl.ts`  
**Description**: Converts a time string to minutes since midnight for easier comparison.

```typescript
export function getTimeInMinutes(timeStr: string): number {
  const { hours, minutes } = parseTimeString(timeStr);
  return hours * 60 + minutes;
}
```

### Show Data Manipulation Utilities

#### `sortShowsByTime(shows: Show[]): Show[]`

**Current Location**: `consoleOutputServiceImpl.ts` (more advanced version than in `showUtils.ts`)  
**Description**: Sorts shows by their airtime, handling null/undefined values.

```typescript
export function sortShowsByTime(shows: Show[]): Show[] {
  return [...shows].sort((a, b) => {
    // Handle shows without airtime
    if (a.airtime === undefined || a.airtime === null || a.airtime === '') {
      return 1;
    }
    if (b.airtime === undefined || b.airtime === null || b.airtime === '') {
      return -1;
    }
    
    // Convert airtime strings to minutes for comparison
    const aMinutes = getTimeInMinutes(a.airtime);
    const bMinutes = getTimeInMinutes(b.airtime);
    
    return aMinutes - bMinutes;
  });
}
```

#### `getNetworkName(show: Show): string`

**Current Location**: Embedded in `groupShowsByNetwork` in both console implementations  
**Description**: Extracts the network name from a show with proper fallback.

```typescript
export function getNetworkName(show: Show): string {
  return show.network ?? 'Unknown Network';
}
```

### Text Formatting Utilities

#### `padString(str: string, length: number, padChar: string = ' '): string`

**Current Location**: Implicit in `consoleFormatterImpl.ts`  
**Description**: Pads a string to a specific length with proper null/undefined handling.

```typescript
export function padString(str: string | null | undefined, length: number, padChar: string = ' '): string {
  const value = str !== null && str !== undefined ? String(str) : '';
  return value.padEnd(length, padChar);
}
```

#### `truncateString(str: string, maxLength: number, suffix: string = '...'): string`

**Current Location**: Not explicit but needed for consistent formatting  
**Description**: Truncates a string to a maximum length and adds a suffix if needed.

```typescript
export function truncateString(str: string | null | undefined, maxLength: number, suffix: string = '...'): string {
  const value = str !== null && str !== undefined ? String(str) : '';
  
  if (value.length <= maxLength) {
    return value;
  }
  
  // Ensure there's room for the suffix
  const truncatedLength = maxLength - suffix.length;
  if (truncatedLength <= 0) {
    return suffix.substring(0, maxLength);
  }
  
  return value.substring(0, truncatedLength) + suffix;
}
```

## Migration Strategy

1. **Create New Functions**: Implement all utility functions in their appropriate files
2. **Unit Testing**: Add comprehensive tests for each utility function
3. **Refactor Implementations**: Update console implementations to use the shared utilities
4. **Validate Behavior**: Ensure all existing tests continue to pass with the refactored code
5. **Documentation**: Update JSDoc for all utility functions with examples

## Impact on Application Class Refactoring

This utility function refactoring will support the Application class refactoring by:

1. **Simplifying Services**: Moving utility functions out of service implementations will make them cleaner
2. **Improved Testability**: Utilities can be tested independently of services
3. **Enhanced Reusability**: Shared utilities will facilitate implementing the Slack interface

## Next Steps

1. Implement new utility files and functions
2. Add comprehensive test coverage for all utilities
3. Refactor console implementations to use shared utilities
4. Validate behavior matches existing functionality
5. Proceed with Application class refactoring (Issue #69)
