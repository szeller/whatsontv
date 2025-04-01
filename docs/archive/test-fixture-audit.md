# WhatsOnTV Test Fixture Audit

## Overview

This document identifies tests that construct domain data directly rather than using existing fixtures. For each file, we identify what type of data objects are being created and the use case for that test data. This audit will help guide the implementation of issue #70 - Test Fixtures and Mocking Standardization.

## Test Files Constructing Domain Data

### 1. `src/tests/implementations/console/consoleFormatterImpl.test.ts`

**Data Objects Constructed:**
- `Show` objects with minimal required fields
- `Show` objects with missing/null fields to test edge cases

**Use Cases:**
- Testing the formatting of shows with and without airtimes
- Testing how the formatter handles incomplete show data
- Testing episode grouping and multiple episode formatting

**Sample Construction Pattern:**
```typescript
mockShow = {
  id: 1,
  name: 'Test Show',
  type: 'Scripted',
  language: 'English',
  genres: ['Drama'],
  network: 'Test Network',
  summary: 'Test summary',
  airtime: '20:00',
  season: 1,
  number: 1
};
```

### 2. `src/tests/implementations/console/consoleOutputServiceImpl.test.ts`

**Data Objects Constructed:**
- Array of `Show` objects for testing sorting, filtering, and grouping
- `Show` objects with different networks, types, genres, and airtimes

**Use Cases:**
- Testing show filtering by type, network, genre, and search term
- Testing sorting shows by time
- Testing grouping shows by network

**Sample Construction Pattern:**
```typescript
const shows: Show[] = [
  {
    id: 1,
    name: 'Show 1',
    type: 'Scripted',
    language: 'English',
    genres: ['Drama'],
    network: 'ABC',
    summary: '<p>Show 1 summary</p>',
    airtime: '20:00',
    season: 1,
    number: 1
  },
  // More shows...
];
```

### 3. `src/tests/implementations/tvMazeServiceImpl.test.ts`

**Data Objects Constructed:**
- Mock TVMaze API response objects

**Use Cases:**
- Testing data transformation from TVMaze API format to domain model
- Testing handling of empty responses or error cases

**Sample Construction Pattern:**
```typescript
const mockShow = {
  id: 1,
  name: 'Test Show',
  airdate: todayDate,
  airtime: '20:00',
  runtime: 60,
  show: {
    // TVMaze API format
  }
};
```

### 4. `src/tests/utils/showUtils.test.ts`

**Data Objects Constructed:**
- `Show` objects via helper methods like `createTestShow`, `createTestShowWithTime`, etc.

**Use Cases:**
- Testing utility functions for sorting, filtering, and grouping shows
- Testing time formatting and comparison
- Testing edge cases with missing data

**Sample Construction Pattern:**
```typescript
function createTestShow(name: string, type: string, network: string | null): Show {
  return {
    id: 0,
    name,
    type,
    language: 'English',
    genres: ['Drama'],
    network,
    summary: 'Test summary',
    airtime: '20:00',
    season: 1,
    number: 1
  };
}
```

## Recommendations

### 1. Create New Fixtures

Based on the audit, the following new fixtures should be created:

1. **Minimal Show Fixtures**
   - Basic valid show objects with minimal required fields
   - Shows with null/missing optional fields

2. **Special Case Fixtures**
   - Shows with different airtimes for sorting tests
   - Shows with various networks for grouping tests
   - Shows with different genres and types for filtering tests

3. **Episode Sequence Fixtures**
   - Fixtures for testing multiple episodes and episode ranges

### 2. Create Fixture Utility Methods

Develop the following utility methods for test fixtures:

1. **Show Customization Utilities**
   - Functions to modify specific fields of existing fixtures (e.g., `withAirtime`, `withNetwork`)
   - Functions to create show variations (e.g., `createShowVariations`)

2. **Filtering and Grouping Utilities**
   - Helper methods to create fixture sets with specific distribution of properties
   - Methods to create predictable show groups for testing

3. **TVMaze Format Conversion Utilities**
   - Methods to convert between domain models and TVMaze API formats

### 3. Refactoring Priorities

Tests should be refactored in the following order of priority:

1. `showUtils.test.ts` - Contains the most helper methods for creating test data
2. `consoleOutputServiceImpl.test.ts` - Has many directly constructed objects
3. `consoleFormatterImpl.test.ts` - Uses direct construction for formatting tests
4. `tvMazeServiceImpl.test.ts` - Creates mock TVMaze API responses

## Next Steps

1. Create the identified fixture utilities in `src/tests/fixtures/helpers/`
2. Implement the new fixture types in `src/tests/fixtures/domain/`
3. Refactor tests to use the fixtures, starting with the highest priority files
4. Document the available fixtures and their intended use cases
