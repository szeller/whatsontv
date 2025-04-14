# Refactoring: Data Normalization Logic Extraction

## Overview

This document outlines a revised refactoring plan to address GitHub issue #97, which calls for extracting common data normalization logic from multiple implementation classes into more reusable components. The goal is to reduce code duplication, improve maintainability, and increase test coverage.

## Current Architecture Analysis

### ShowFormatter Interface and Implementations

The current implementation follows this pattern:

```
ShowFormatter (Interface)
  ↓
BaseShowFormatterImpl (Abstract)
  ↓
TextShowFormatterImpl  SlackShowFormatterImpl
```

#### Areas of Duplication

After analyzing the code, we've identified these key areas of duplication:

1. **Episode Information Formatting**
   - Both `TextShowFormatterImpl` and `SlackShowFormatterImpl` implement similar logic for episode formatting (S01E01)
   - Similar null/undefined handling logic
   - Episode range calculation (`formatEpisodeRange`, `formatMultipleEpisodes`)

2. **Show Data Normalization**
   - Multiple checks for null/undefined values
   - Default values for show properties (name, airtime, network, type)
   - Time formatting with different implementations

3. **Show Grouping Logic**
   - Similar approaches to grouping and processing shows
   - Sorting shows by time, season, and episode number
   - Consolidation of multiple episodes

4. **Component Preparation**
   - Text preparation in `prepareShowRowComponents`
   - Slack block preparation logic

### OutputService Interface and Implementations

The current implementation follows this pattern:

```
OutputService (Interface)
  ↓
BaseOutputServiceImpl (Abstract)
  ↓
ConsoleOutputServiceImpl  SlackOutputServiceImpl
```

#### Areas of Duplication

1. **Header/Footer Rendering**
   - Similar patterns for formatting date headers
   - Similar footer content

2. **Error Handling**
   - Similar error detection logic
   - Redundant error message formatting

3. **Debug Information**
   - Similar logic for collecting and displaying network statistics
   - Date formatting

4. **Responsibility Allocation**
   - The boundary between OutputService and ShowFormatter is unclear in some areas
   - Some normalization logic that should be in ShowFormatter exists in OutputService

## Existing Utility Assessment

The codebase already has several utility files that handle parts of the functionality we need to enhance:

### 1. `consoleFormatUtils.ts`
- `formatEpisodeInfo()` - Episodes formatting
- `formatNetworkHeader()` - Network header formatting
- `groupShowsByShowId()` - Grouping related shows
- `prepareShowRowComponents()` - Component preparation
- `hasAirtime()` and `allShowsHaveNoAirtime()` - Airtime checks

### 2. `showUtils.ts`
- `groupShowsByNetwork()` - Network grouping
- `compareEpisodes()` - Episode sorting
- `sortShowsByTime()` - Show sorting by time
- `formatEpisodeRanges()` - Episode range formatting
- Various filter functions (by type, network, genre, etc.)

### 3. `dateUtils.ts`
- `formatDate()` - Date formatting
- `formatTimeWithPeriod()` - Time formatting
- `convertTimeToMinutes()` - Time conversion for sorting

### 4. `stringUtils.ts`
- `getStringValue()` - Null/undefined handling for strings
- `padString()` - String padding functionality 
- `truncateString()` - String length management
- `formatListWithSeparator()` - List formatting
- `wrapText()` - Text wrapping for display

### 5. Additional utilities
- `errorHandling.ts` - Recently added for centralized error handling
- `cliBase.ts` - Base CLI application logic

## Proposed Refactoring

Instead of creating new utility classes, we'll enhance the existing utilities and reorganize them for better coherence.

### 1. Enhance Existing Utilities

#### `consoleFormatUtils.ts` → Rename to `formatUtils.ts`
- Make it output-format agnostic
- Improve episode formatting functions to handle more edge cases
- Add type-safe handling of nulls/undefineds

```typescript
// Currently in consoleFormatUtils.ts, move to formatUtils.ts
export function formatEpisodeInfo(episodeInfo: Show): string { /* ... */ }
export function formatShowComponents(show: Show, options: FormattingOptions): ShowComponents { /* ... */ }
```

#### `showUtils.ts`
- Enhance `formatEpisodeRanges()` to handle more patterns
- Improve episode consolidation logic
- Strengthen sorting functions with better type handling

```typescript
// Add/enhance in showUtils.ts
export function areSequentialEpisodes(episodes: Show[]): boolean { /* ... */ }
export function consolidateEpisodes(episodes: Show[]): EpisodeGroup[] { /* ... */ }
```

#### `dateUtils.ts`
- Standardize time formatting across the application
- Add more robust error handling

### 2. Extract Duplicate Logic from Implementations

#### BaseShowFormatterImpl
- Move duplicate logic from concrete implementations to the base class
- Create protected template methods for format-specific differences
- Use the enhanced utilities

```typescript
// In BaseShowFormatterImpl
protected processEpisodes(shows: Show[]): ProcessedEpisodes {
  // Use showUtils.consolidateEpisodes() here
}
```

#### BaseOutputServiceImpl
- Clarify responsibilities vs. ShowFormatter
- Standardize error handling
- Use the enhanced utilities

### 3. Define Clear Interfaces

Create clearer interfaces for improved separation of concerns:

```typescript
// New interfaces to better define responsibilities
export interface ShowComponentsGenerator {
  generateComponents(show: Show): ShowComponents;
}

export interface EpisodeFormatter {
  formatEpisode(show: Show): string;
  formatEpisodeRange(shows: Show[]): string;
}
```

## Implementation Plan

### Phase 1: Utility Enhancement

1. **Rename and Enhance `consoleFormatUtils.ts` → `formatUtils.ts`**
   - Make it format-agnostic
   - Leverage `stringUtils.ts` for common string operations
   - Add comprehensive tests
   - Extract specific console styling to the text formatter

2. **Enhance `showUtils.ts`**
   - Improve episode consolidation logic
   - Add missing utility functions
   - Ensure strong typing and error handling
   - Add comprehensive tests
   - Leverage `stringUtils.ts` for string manipulation tasks

3. **Ensure Proper Utility Separation**
   - Audit all utilities to ensure clear responsibility boundaries
   - Move string-specific operations to `stringUtils.ts`
   - Move date/time operations to `dateUtils.ts`
   - Move show-specific operations to `showUtils.ts` or the new `formatUtils.ts`
   - Leverage `errorHandling.ts` for consistent error handling

### Phase 2: Base Class Refactoring

1. **Refactor `BaseShowFormatterImpl`**
   - Move duplicate logic to the base class
   - Use the enhanced utilities
   - Create template methods for format-specific implementations
   - Incorporate proper error handling using `errorHandling.ts`
   - Add comprehensive tests

2. **Refactor `BaseOutputServiceImpl`**
   - Clarify responsibilities vs. ShowFormatter
   - Standardize error handling
   - Use the enhanced utilities
   - Ensure compatibility with `cliBase.ts` for CLI implementations
   - Add comprehensive tests

### Phase 3: Implementation Updates

1. **Update `TextShowFormatterImpl` and `SlackShowFormatterImpl`**
   - Leverage base class functionality
   - Remove duplicated code
   - Update tests
   - Ensure consistent output formatting using shared utilities

2. **Update `ConsoleOutputServiceImpl` and `SlackOutputServiceImpl`**
   - Leverage base class functionality
   - Use `cliBase.ts` patterns for the console implementation
   - Remove duplicated code
   - Focus on I/O specific to each platform instead of formatting logic
   - Update tests

### Phase 4: Integration and Testing

1. **Integration Testing**
   - Ensure all components work together correctly
   - Test different show scenarios
   - Verify edge cases

2. **Documentation**
   - Update documentation
   - Add examples

## Benefits

The proposed refactoring will:

1. **Reduce code duplication** - By enhancing and using existing utilities
2. **Improve maintainability** - With clearer boundaries and responsibilities
3. **Enhance testability** - Through smaller, more focused functions
4. **Simplify adding new output formats** - Clear extension points
5. **Increase consistency** - Standard handling of null/undefined values, time formatting, etc.

## Potential Risks

1. **Regression** - Mitigated by comprehensive testing
2. **Over-abstraction** - Addressed by focusing on concrete, common patterns
3. **Learning curve** - Minimized by using existing patterns and utilities

## Conclusion

This refactoring approach leverages the existing utility structure while addressing the duplication issues identified. It maintains the clean architecture principles while enhancing test coverage and code organization.
