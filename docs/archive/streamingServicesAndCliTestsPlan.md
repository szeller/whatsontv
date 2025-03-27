# Development Plan: Streaming Services Support and CLI Integration Tests

## Overview

This document outlines the development plan for addressing two related issues:
- **Issue #45**: Fix network filtering for streaming services like Prime Video
- **Issue #50**: Implement Integration Tests for CLI
- **Issue #52**: Standardize test fixtures and mock data

By addressing these issues together, we can ensure that the streaming services support is properly tested through the CLI integration tests, while also improving the maintainability of our test suite.

## Issue Analysis

### Issue #45: Fix network filtering for streaming services

**Root Cause Analysis:**
1. The TVMaze API represents streaming services in a different endpoint (`/schedule/web`) than traditional networks (`/schedule`).
2. Our current implementation only fetches from the `/schedule` endpoint, which doesn't include streaming services.
3. The transformation logic correctly handles both network and web schedule items, but we're not fetching the web channel data.

**Current Implementation:**
- `TvMazeServiceImpl.getShowsByDate` only fetches from `/schedule?date={date}&country=US`
- Transformation logic in `tvmazeModel.ts` already handles both network and web schedule items
- Network filtering in `showUtils.ts` only checks the `channel` property

### Issue #50: Implement Integration Tests for CLI

**Current Status:**
- The CLI functionality is tested indirectly through unit tests of individual components
- No end-to-end tests that verify the CLI works correctly with different arguments
- No tests that verify the output format and content

### Issue #52: Standardize test fixtures and mock data

**Current Status:**
- We have well-structured domain fixtures in `src/tests/fixtures/domain/domainFixtures.ts` that aren't being used
- Many tests use one-off mock data defined inline, leading to inconsistencies
- TVMaze API fixtures are used consistently, but domain model fixtures are not
- No clear separation between API fixtures and domain model fixtures in tests
- Redundant mock data creation across multiple test files
- Duplicate type definitions in test files instead of reusing existing types from the main codebase

## Implementation Plan

### 1. Fix Streaming Services Support (Issue #45)

#### 1.1 Update TvMazeServiceImpl

1. Refactor `getShowsByDate` to fetch from both endpoints:
   - `/schedule?date={date}&country=US` (traditional networks)
   - `/schedule/web?date={date}` (streaming services)
2. Implement private methods for each endpoint:
   - `getNetworkSchedule(date: string): Promise<unknown[]>`
   - `getWebSchedule(date: string): Promise<unknown[]>`
3. Use `Promise.all` to fetch from both endpoints in parallel
4. Combine the results before transformation
5. Update error handling to handle failures from either endpoint

#### 1.2 Update Network Filtering

1. Ensure `filterByNetwork` in `showUtils.ts` works correctly with streaming services
2. Update the CLI to display streaming services in the debug output

#### 1.3 Add Unit Tests

1. Update existing tests for `TvMazeServiceImpl` to verify both endpoints are called
2. Add tests for the combined results
3. Add tests for network filtering with streaming services
4. Use the existing fixtures:
   - `network-schedule.json`
   - `web-schedule.json`
   - `combined-schedule.json`

### 2. Implement CLI Integration Tests (Issue #50)

#### 2.1 Create Test Infrastructure

1. Create a dedicated directory for integration tests: `src/tests/integration/cli`
2. Implement a CLI test runner utility:
   ```typescript
   // src/tests/integration/cli/cliTestRunner.ts
   export async function runCli(args: string[]): Promise<{
     stdout: string;
     stderr: string;
     exitCode: number;
   }>
   ```
3. Implement a mock HTTP client for testing:
   ```typescript
   // src/tests/integration/cli/mockHttpClient.ts
   export class MockHttpClient implements HttpClient {
     // Mock implementation
   }
   ```
4. Set up test fixtures for different scenarios

#### 2.2 Basic Functionality Tests

1. Test CLI with default options
2. Test CLI with date parameter
3. Test CLI with country parameter
4. Test CLI with debug flag

#### 2.3 Filtering Tests

1. Test network filtering (including streaming services)
2. Test type filtering
3. Test genre filtering
4. Test language filtering

#### 2.4 Error Handling Tests

1. Test invalid date format
2. Test network not found
3. Test API error handling

### 3. Standardize Test Fixtures and Mock Data (Issue #52)

#### 3.1 Enhance Domain Fixtures

1. Update `domainFixtures.ts` to include more comprehensive test data:
   - Add more network shows with different properties
   - Add more streaming shows with different properties
   - Ensure fixtures cover all edge cases (null values, missing properties, etc.)
   - Add fixtures for different genres, languages, and types
   - Create fixtures that match the TVMaze API fixtures for consistent testing

2. Create specialized fixtures for specific test scenarios:
   - Shows with missing airtime
   - Shows with very long names or descriptions
   - Shows with special characters
   - Shows with empty or null properties

#### 3.2 Create Fixture Utility Functions

1. Add utility functions to `domainFixtures.ts`:
   ```typescript
   // Get a show with specific properties
   static getShowWithProps(props: Partial<Show>): Show
   
   // Get a random show from the fixtures
   static getRandomShow(): Show
   
   // Get shows filtered by property
   static getShowsByGenre(genre: string): Show[]
   static getShowsByType(type: string): Show[]
   static getShowsByLanguage(language: string): Show[]
   static getShowsByChannel(channel: string): Show[]
   ```

#### 3.3 Refactor Existing Tests

1. Replace inline mock data in tests with imports from `domainFixtures.ts`:
   - Update `consoleFormatterImpl.test.ts` (22 instances)
   - Update `consoleOutputServiceImpl.test.ts` (3 instances)
   - Update `slackOutputServiceImpl.test.ts` (if applicable)
   - Update `showUtils.test.ts` (if applicable)
   - Update any other test files with inline mock data

2. Create a mapping between TVMaze API fixtures and domain fixtures:
   ```typescript
   // src/tests/utils/fixtureUtils.ts
   export function mapTvMazeFixtureToDomain(tvMazeShow: unknown): Show
   ```

3. Update test helper functions to use domain fixtures:
   ```typescript
   // src/tests/utils/testHelpers.ts
   export function createMockTvShowService(shows?: Show[]): TvShowService {
     return {
       getShowsByDate: jest.fn().mockResolvedValue(
         shows ?? DomainFixtures.getNetworkShows()
       ),
       // ...
     };
   }
   ```

4. **Note:** When taking a final pass at mock data cleanup, also clean up duplicate type definitions in test files by reusing existing types from the main codebase.

#### 3.4 Standardize Test Setup

1. Create standard test setup functions for common test scenarios:
   ```typescript
   // src/tests/utils/testSetup.ts
   export function setupFormatterTest(): {
     formatter: ShowFormatter;
     mockShow: Show;
     // ...
   }
   
   export function setupOutputServiceTest(): {
     outputService: OutputService;
     mockShows: Show[];
     // ...
   }
   ```

2. Update tests to use these standard setup functions

## Success Criteria

### 1. Streaming Services Support

1. **Issue #45**:
   - Users can filter shows by streaming service name
   - Streaming services are displayed correctly in the output
   - Network filtering works for both traditional networks and streaming services
   - All tests pass with the new implementation

### 2. CLI Integration Tests

1. **Issue #50**:
   - CLI functionality is fully tested
   - Tests would have caught the recent issues with double output and undefined values
   - Test coverage meets or exceeds 80%
   - Tests are maintainable and not overly brittle

### 3. Test Fixtures Standardization

1. **Issue #52**:
   - All tests use consistent domain fixtures from `domainFixtures.ts`
   - No inline mock data in tests (except for very specific edge cases)
   - Clear separation between API fixtures and domain fixtures
   - Reduced code duplication in test setup
   - Improved test maintainability and readability

## Timeline

1. **Week 1**:
   - Fix streaming services support
   - Create basic CLI integration tests
   - Update domain fixtures

2. **Week 2**:
   - Implement remaining CLI tests
   - Refactor existing tests to use domain fixtures
   - Create test utility functions

3. **Week 3**:
   - Final testing and bug fixes
   - Documentation updates
   - Code review and merge
