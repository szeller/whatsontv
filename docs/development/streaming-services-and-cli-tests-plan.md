# Development Plan: Streaming Services Support and CLI Integration Tests

## Overview

This document outlines the development plan for addressing two related issues:
- **Issue #45**: Fix network filtering for streaming services like Prime Video
- **Issue #50**: Implement Integration Tests for CLI

By addressing these issues together, we can ensure that the streaming services support is properly tested through the CLI integration tests.

## Issue Analysis

### Issue #45: Fix network filtering for streaming services

**Root Cause Analysis:**
1. The TVMaze API represents streaming services in a different endpoint (`/schedule/web`) than traditional networks (`/schedule`).
2. Our current implementation only fetches from the `/schedule` endpoint, which doesn't include streaming services.
3. The transformation logic correctly handles both network and web channel shows, but we're not fetching the web channel data.

**Current Implementation:**
- `TvMazeServiceImpl.getShowsByDate` only fetches from `/schedule?date={date}&country=US`
- Transformation logic in `tvmazeModel.ts` already handles both network and web schedule items
- Network filtering in `showUtils.ts` only checks the `channel` property

### Issue #50: Implement Integration Tests for CLI

**Current Status:**
- The CLI functionality is tested indirectly through unit tests of individual components
- No end-to-end tests that verify the CLI works correctly with different arguments
- No tests that verify the output format and content

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

1. Test network error handling
2. Test API error handling
3. Test invalid argument handling

#### 2.5 Time Sorting Tests

1. Test time sorting enabled
2. Test time sorting disabled

## Testing Strategy

### Unit Tests

1. Update `TvMazeServiceImpl.test.ts` to test the new functionality
2. Use the existing fixtures for testing

### Integration Tests

1. Create a new test file: `src/tests/integration/cli/cli.test.ts`
2. Use Jest for running the tests
3. Use snapshot testing for verifying output format
4. Mock the HTTP client to return controlled responses

## Implementation Timeline

1. **Day 1**: Fix streaming services support
   - Update `TvMazeServiceImpl`
   - Update network filtering
   - Add unit tests

2. **Day 2**: Implement CLI integration tests
   - Create test infrastructure
   - Implement basic functionality tests
   - Implement filtering tests

3. **Day 3**: Complete integration tests
   - Implement error handling tests
   - Implement time sorting tests
   - Clean up and finalize documentation

## Success Criteria

1. **Issue #45**:
   - Users can see shows from streaming services
   - Network filtering works for both traditional networks and streaming services
   - All unit tests pass

2. **Issue #50**:
   - CLI functionality is fully tested
   - Tests would have caught the recent issues with double output and undefined values
   - Test coverage meets or exceeds 80%
   - Tests are maintainable and not overly brittle

## References

- [TVMaze API Documentation](https://www.tvmaze.com/api)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Test Fixtures](../tests/fixtures/tvmaze/)
