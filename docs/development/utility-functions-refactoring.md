# Utility Functions Refactoring Plan (Issue #63)

## Overview

This document provides a detailed plan for refactoring utility functions from console-specific implementations to shared utility modules. This refactoring will improve code reusability, maintainability, and facilitate the implementation of additional interfaces beyond the console.

## Key Principles

1. **Focus on Current Use Cases**: This refactoring targets only functionality currently used in the application, not speculative future needs
2. **Clear Separation of Concerns**: Separate generic utilities from domain-specific and UI-specific ones
3. **Maintain Testability**: Ensure all utilities are easily testable in isolation
4. **Preserve Behavior**: Existing functionality should remain unchanged after refactoring

## Implemented Utility Functions

### Time Handling Utilities (`dateUtils.ts`)

| Function Name | Description | Signature |
|---------------|-------------|-----------|
| `parseTimeString` | Parses a time string in various formats (HH:MM, H:MM AM/PM) | `parseTimeString(timeStr: string): { hours: number; minutes: number }` |
| `getTimeInMinutes` | Converts a time string to minutes since midnight for comparison | `getTimeInMinutes(timeStr: string): number` |
| `formatTimeWithPeriod` | Formats a time string with AM/PM indicator | `formatTimeWithPeriod(time: string): string` |
| `isValidTime` | Validates if a string is a valid time format | `isValidTime(time: string): boolean` |
| `getTodayDate` | Returns the current date | `getTodayDate(): Date` |
| `formatDate` | Formats a date string | `formatDate(date: Date): string` |

### String Utilities (`stringUtils.ts`)

| Function Name | Description | Signature |
|---------------|-------------|-----------|
| `padString` | Pads a string to a specific length with fallback handling | `padString(str: string, length: number, padChar: string = ' '): string` |
| `truncateString` | Truncates a string to a maximum length with suffix | `truncateString(str: string, maxLength: number, suffix: string = '...'): string` |
| `formatListWithSeparator` | Joins list items with a separator and handles edge cases | `formatListWithSeparator(items: string[], separator: string = ', '): string` |
| `wrapText` | Wraps text to fit within a specified width | `wrapText(text: string, maxWidth: number): string[]` |
| `getStringValue` | Provides safe access to string values with fallbacks | `getStringValue(str: string | null | undefined, fallback: string = ''): string` |

### Show Data Manipulation Utilities (`showUtils.ts`)

| Function Name | Description | Signature |
|---------------|-------------|-----------|
| `sortShowsByTime` | Sorts shows by airtime (existing in `showUtils.ts` but implementation in `consoleOutputServiceImpl.ts` has more features) | `sortShowsByTime(shows: Show[]): Show[]` |
| `getNetworkName` | Extracts network name with fallback to "Unknown Network" | `getNetworkName(show: Show): string` |
| `groupShowsByNetwork` | Groups shows by network | `groupShowsByNetwork(shows: Show[]): { [network: string]: Show[] }` |
| `compareEpisodes` | Compares episodes for sorting | `compareEpisodes(episode1: Episode, episode2: Episode): number` |
| `formatEpisodeRanges` | Formats episodes into compact ranges (e.g., "S01E01-03, S01E05") | `formatEpisodeRanges(episodes: Episode[]): string` |
| `filterByType` | Filters shows by their type | `filterByType(shows: Show[], type: string): Show[]` |

### Console Formatting Utilities (`consoleFormatUtils.ts`)

| Function Name | Description | Signature |
|---------------|-------------|-----------|
| `formatNetworkName` | Formats network name consistently with fallbacks for console display | `formatNetworkName(network: string): string` |
| `formatShowType` | Formats show type consistently with fallbacks for console display | `formatShowType(type: string): string` |
| `formatEpisodeInfo` | Formats episode information (S01E01 format) | `formatEpisodeInfo(season: number, episode: number): string` |
| `formatShowForConsole` | Master function for consistent show formatting in console | `formatShowForConsole(show: Show, options?: FormatOptions): string` |
| `formatTableRow` | Creates a formatted table row with proper spacing for console output | `formatTableRow(columns: string[], widths: number[]): string` |
| `createTableHeader` | Creates a console table header with optional separator line | `createTableHeader(headers: string[], widths: number[]): string[]` |
| `createBulletList` | Creates a bullet list format suitable for console display | `createBulletList(items: string[], bulletChar: string = '• '): string[]` |

## Detailed Function Specifications

### Time Handling Utilities

The `dateUtils.ts` module provides utilities for handling dates and times:

- `parseTimeString` parses time strings in various formats (12:30, 1:30 PM)
- `convertTimeToMinutes` converts a time string to minutes since midnight for comparison
- `formatTimeWithPeriod` ensures consistent time formatting with AM/PM indicator
- `isValidTime` validates time string formats
- `getTodayDate` and `formatDate` provide date formatting utilities

### String Utilities

The `stringUtils.ts` module provides generic string manipulation utilities:

- `padString` and `truncateString` handle text formatting with proper null/undefined handling
- `formatListWithSeparator` joins arrays of strings with configurable separators
- `wrapText` handles wrapping text to fit within specified widths
- `getStringValue` provides safe access to string values with fallbacks

### Show Data Manipulation

The `showUtils.ts` module provides utilities for working with Show objects:

- `sortShowsByTime` sorts shows by their airtime
- `getNetworkName` and `groupShowsByNetwork` handle network-related operations
- `compareEpisodes` provides consistent episode comparison
- `formatEpisodeRanges` formats episodes into compact ranges (e.g., "S01E01-03, S01E05")
- `filterByType` filters shows by their type

### Console Formatting

The `consoleFormatUtils.ts` module provides console-specific formatting utilities:

- `formatNetworkName` and `formatShowType` ensure consistent formatting
- `formatEpisodeInfo` handles episode information formatting (S01E01)
- `formatShowForConsole` provides a comprehensive show formatting function
- `formatTableRow` and `createTableHeader` create tabular console output
- `createBulletList` formats data as bullet lists

## Key Implementation Decisions

1. **Consistent Episode Formatting**: Episode information is formatted with leading zeros by default (S01E01 instead of S1E1) but can be configured via the `padEpisodeNumbers` parameter.

2. **Null/Undefined Handling**: All utility functions properly handle null and undefined values with appropriate defaults.

3. **Flexible Formatting Options**: Functions like `formatShowForConsole` accept options to customize the output format.

4. **Separation of Concerns**: Clear separation between generic utilities, domain-specific utilities, and UI-specific formatting.

## Module Organization

The refactoring organizes utilities as follows:

1. **Generic Utilities**: Non-domain specific utilities that could be used in any TypeScript application:
   - `stringUtils.ts`: General string manipulation functions
   - `dateUtils.ts`: Date and time manipulation functions

2. **Domain Utilities**: Utilities specific to our domain model but not to a particular UI:
   - `showUtils.ts`: Functions for manipulating and querying Show objects

3. **UI-Specific Utilities**: Utilities tied to a specific UI presentation:
   - `consoleFormatUtils.ts`: Formatting utilities specific to console output

This organization allows for:

- Clear separation between generic code and domain-specific code
- Easy reuse of domain utilities across different UIs (console, web, etc.)
- UI-specific formatting isolated to dedicated modules

## Implementation Status

All planned utility functions have been successfully implemented and integrated into the codebase. The refactoring has been completed with the following results:

1. **Console-Specific Code Reduction**: Console-specific implementations now use shared utility functions, reducing code duplication.

2. **Improved Testability**: Each utility function has dedicated tests covering various edge cases.

3. **Consistent Formatting**: Show data is now formatted consistently throughout the application.

4. **Maintainability**: The code is now more maintainable with clear separation of concerns.

## Future Enhancements

While the current refactoring meets all the requirements, some potential future enhancements include:

1. **Additional Utility Functions**: As new interfaces are implemented, additional utility functions may be needed.

2. **Performance Optimizations**: Some utility functions could be optimized for performance if needed.

3. **Extended Documentation**: More comprehensive examples in JSDoc comments could be added.

4. **Internationalization Support**: Add support for different date/time formats based on locale.

## Conclusion

The utility functions refactoring has successfully improved the codebase by centralizing common functionality, reducing duplication, and ensuring consistent behavior across the application. This provides a solid foundation for implementing additional interfaces beyond the console.
