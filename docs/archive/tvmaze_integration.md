# TVMaze API Integration

## Overview

This document details our approach to integrating with the TVMaze API, including data structures, transformation strategies, and implementation decisions.

## API Structure

The TVMaze API provides two primary endpoints for retrieving TV show schedules:

1. **Network Schedule** (`/schedule`): Traditional TV network shows
2. **Web Schedule** (`/schedule/web`): Streaming service shows

### Key Structural Differences

The two endpoints return data with different structures:

#### Network Schedule Format

```json
{
  "id": 123456,
  "name": "Episode Name",
  "season": 1,
  "number": 2,
  "show": {
    "id": 789,
    "name": "Show Name",
    "network": {
      "name": "CBS",
      "country": {
        "code": "US"
      }
    },
    "webChannel": null
  }
}
```

#### Web Schedule Format

```json
{
  "id": 123456,
  "name": "Episode Name",
  "season": 1,
  "number": 2,
  "_embedded": {
    "show": {
      "id": 789,
      "name": "Show Name",
      "network": null,
      "webChannel": {
        "name": "Netflix"
      }
    }
  }
}
```

## Data Transformation Strategy

### Domain Model

We use a simplified domain model that abstracts away the differences between network and streaming shows:

```typescript
export interface Show {
  id: number;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  network: string;
  summary: string | null;
  airtime: string | null;
  season: number;
  number: number;
}
```

### Transformation Logic

Our transformation approach focuses on normalizing the different data structures into our consistent domain model:

1. **Source Detection**: Determine if the data is from the network or web schedule based on structure
2. **Show Data Extraction**: Extract show data from either `show` (network) or `_embedded.show` (web)
3. **Network Information**: Extract network name from either `network` or `webChannel` property
4. **Type Normalization**: Convert string numbers to actual numeric values

## Implementation Decisions

### Removed `isStreaming` Flag

We previously used an `isStreaming` flag to differentiate between network and streaming shows. This has been removed for several reasons:

1. **Redundant Information**: The network name already indicates the source
2. **Simplification**: Reduces complexity in the transformation logic
3. **Consistency**: Provides a more uniform approach to handling shows regardless of source

### Handling Edge Cases

Our implementation handles several edge cases:

1. **Missing Data**: Default values are provided for missing fields
2. **Type Inconsistencies**: String numbers are converted to numeric values
3. **Null Values**: Properly handled with nullable types

## Testing Strategy

We use a comprehensive testing approach to ensure our integration works correctly:

1. **Fixture-Based Testing**: Test fixtures that represent real API responses
2. **Transformation Tests**: Validate that our transformation logic works correctly
3. **Integration Tests**: Verify end-to-end functionality with the CLI

## Future Improvements

Potential areas for enhancement:

1. **Caching**: Implement caching to reduce API calls
2. **Error Handling**: Improve error handling and recovery
3. **Additional Endpoints**: Integrate with more TVMaze API endpoints

## Implementation Action Plan

### Phase 1: Clean Up and Simplify

- [x] Remove `isStreaming` property from the `Show` interface
- [x] Update transformation logic to handle shows without the `isStreaming` property
- [x] Remove debug logging statements from transformation functions
  - [x] Keep only essential error logging for production environments
- [x] Remove unused Slack implementation files
  - [x] `slackFormatterImpl.ts`
  - [x] `slackOutputServiceImpl.ts`

### Phase 2: Enhance Testing

- [x] Enable CLI integration tests (previously skipped)
- [ ] Run CLI tests and fix any output format issues
- [x] Expand test cases in `tvmazeModel.test.ts` to cover:
  - [x] Edge cases with missing or null values
  - [x] Mixed data from both sources
  - [x] Type conversion scenarios (string to number)
  - [x] Boundary conditions
- [ ] Validate test fixtures against real API responses
  - [ ] Compare with cached responses in `test_data/api_responses`
  - [ ] Add more test cases if needed

### Phase 3: Address Coverage Gaps

- [ ] Identify areas with low test coverage
- [ ] Add tests for critical paths
- [ ] Ensure all transformation logic is thoroughly tested
- [ ] Verify output formatting for different show types

This action plan aims to improve the robustness and maintainability of our TVMaze API integration while ensuring accurate data transformation and presentation.
