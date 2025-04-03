# Mock Implementation Audit & Refactoring Plan

## Introduction

This document outlines our plan to address GitHub issues #83 "Standardize and Refactor Mock Implementations into a Centralized Structure" and #82 "Improve Mock Implementation in Tests with Reusable Fixtures". It contains an audit of implementation classes not used in the standard CLI flow, test files with inline interface implementations, and a reorganization plan for test implementations, mocks, and utilities.

## Current State Analysis

### Implementation Classes Not Used in Standard CLI Flow

| Implementation Class | Interface | Use Case | Location |
|----------------------|-----------|----------|----------|
| `PlainStyleServiceImpl` | `StyleService` | Used for testing to provide a non-chalk styling service | `/src/implementations/test/plainStyleServiceImpl.ts` |
| `TestConfigServiceImpl` | `ConfigService` | Used for tests to provide controlled configuration | `/src/implementations/test/testConfigServiceImpl.ts` |
| `MockConsoleOutputImpl` | `ConsoleOutput` | Used for tests to capture console output | `/src/tests/mocks/implementations/mockConsoleOutput.ts` |

### Inline Interface Implementations in Test Files

| Test File | Interface | Implementation Type | Purpose |
|-----------|-----------|---------------------|---------|
| `consoleOutputServiceImpl.test.ts` | `ConsoleOutput` | Inline mock | Mocks console output for testing |
| `consoleOutputServiceImpl.test.ts` | `ShowFormatter` | Inline mock | Mocks formatter for testing console output service |
| `consoleOutputServiceImpl.test.ts` | `ConfigService` | Inline mock | Mocks config service for testing |
| `tvShowService.test.ts` | `TvShowService` | Modified method | Creates a mock implementation of `fetchShows` |
| `cli.test.ts` | (Multiple) | Inline functions | Various helper functions for testing CLI |
| `httpClient.test.ts` | (Test only) | Test utilities | Various helper functions for HTTP client testing |

### Reusable Implementations Analysis

| Current Implementation | Potential Reusable Implementation | Recommendation |
|-----------------------|----------------------------------|----------------|
| Inline `ConsoleOutput` mock in tests | `MockConsoleOutputImpl` | Replace with existing implementation and add factory function |
| Inline `ConfigService` mock in tests | `TestConfigServiceImpl` | Extend existing implementation to cover all test cases or create a new mock factory |
| Inline `ShowFormatter` mock | No existing reusable implementation | Create a dedicated mock implementation and factory |
| Ad-hoc HTTP request mocks | `MockHttpClient` | Standardize usage of existing implementation |
| Inline `TvShowService` mock | No existing reusable implementation | Create a dedicated mock implementation and factory |

## Revised Directory Structure

The current structure mixes test utilities, mock implementations, and test files. We need to more clearly separate:

1. Test implementations of interfaces (mocks)
2. Test utility functions and helpers
3. Test files for implementation classes

```
src/
├── implementations/        # Production implementations
│   ├── console/           # Console interface implementations
│   ├── test/              # Real alternative implementations that are part of source
│   │   ├── plainStyleServiceImpl.ts     # Non-chalk styling (real alternative implementation)
│   │   └── testConfigServiceImpl.ts     # Config service with controlled values
│   └── ...
└── tests/                 # Test files and test-only utilities
    ├── fixtures/          # Test data fixtures (no change)
    ├── implementations/   # Tests for implementation classes (no change)
    ├── mocks/             # Test-only mock implementations and factories
    │   ├── implementations/   # Mock implementations for testing
    │   │   ├── mockConsoleOutput.ts
    │   │   ├── mockFormatter.ts
    │   │   ├── mockTvShowService.ts
    │   │   └── ...
    │   └── factories/     # Factory functions for creating mocks
    │       ├── consoleOutputFactory.ts
    │       ├── formatterFactory.ts
    │       ├── httpClientFactory.ts
    │       └── ...
    ├── testutils/         # Test utilities that aren't implementation mocks
    │   ├── mockHttpClient.ts # HTTP client mock implementation
    │   ├── jestHelpers.ts # Jest-specific utilities
    │   └── testRunner.ts  # Test runner utilities
    └── ...
```

This structure maintains a clear distinction between:

- Implementation files that are part of the source but meant for testing (`src/implementations/test/`) - these are real alternative implementations that could be used in production
- Mock implementations for testing (`src/tests/mocks/implementations/`) - these are simplified fake versions not meant for production use
- Factory functions for creating mocks (`src/tests/mocks/factories/`) - these provide a consistent interface for creating configured mocks
- Test utilities that aren't implementation mocks (`src/tests/testutils/`) - these are helper functions for tests
- Actual test files (`src/tests/implementations/`, etc.) - these test the real implementations

## Implementation Plan

### Phase 1: Refactor Directory Structure ✅ COMPLETED

1. Create standardized directory structure: ✅ COMPLETED
   - Create `src/tests/mocks/factories/` directory with index.ts barrel file 
   - Create `src/tests/utils/` directory if not already present 
   - Move MockConsoleOutputImpl to `src/tests/mocks/implementations/mockConsoleOutput.ts`

2. Develop core factory interfaces with TypeScript types: ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/types.ts
   export interface MockOptions<T> {
     defaultReturn?: T;
     implementation?: Partial<Record<keyof T, jest.Mock>>;
   }
   
   export interface MockFactoryResult<T> {
     mock: jest.Mocked<T>;
     calls: Record<keyof T, unknown[][]>;
     reset: () => void;
   }
   ```

4. Create Jest integration helpers: ✅ COMPLETED
   ```typescript
   // src/tests/utils/jestHelpers.ts
   export function createTypedMock<T>(): jest.Mocked<T> { /* ... */ }
   ```

### Phase 2: Implement Core Mock Factories

1. Implement `HttpClientFactory` (highest priority): ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/httpClientFactory.ts
   import type { HttpClient, HttpResponse } from '../../../interfaces/httpClient.js';
   import { MockOptions } from './types.js';
   
   export interface HttpClientOptions extends MockOptions<HttpClient> {
     defaultResponse?: HttpResponse<unknown>;
     defaultError?: Error;
     getResponses?: Record<string, HttpResponse<unknown>>;
     getErrors?: Record<string, Error>;
     postResponses?: Record<string, HttpResponse<unknown>>;
     postErrors?: Record<string, Error>;
     fixtures?: Record<string, { path: string; status?: number }>;
   }
   
   export function createMockHttpClient(options: HttpClientOptions = {}): MockHttpClient {
     // Implementation that configures responses, errors, and fixtures
   }
   ```

2. Implement `ConfigServiceFactory` (second priority): ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/configServiceFactory.ts
   import type { ConfigService } from '../../../interfaces/configService.js';
   import type { ShowOptions } from '../../../types/tvShowOptions.js';
   import type { CliOptions, AppConfig, SlackConfig } from '../../../types/configTypes.js';
   import { MockOptions } from './types.js';
   
   export interface ConfigServiceOptions extends MockOptions<ConfigService> {
     showOptions?: Partial<ShowOptions>;
     cliOptions?: Partial<CliOptions>;
     appConfig?: Partial<AppConfig>;
     slackConfig?: Partial<SlackConfig>;
   }
   
   export function createMockConfigService(options: ConfigServiceOptions = {}): TestConfigServiceImpl {
     // Implementation that configures show options, CLI options, and app config
   }
   ```

3. Implement `FormatterFactory` (third priority): ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/formatterFactory.ts
   import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
   import type { Show } from '../../../schemas/domain.js';
   import { MockOptions } from './types.js';
   
   export interface FormatterOptions extends MockOptions<ShowFormatter> {
     networkFormatter?: (network: string) => string;
     showFormatter?: (show: Show) => string;
     episodeFormatter?: (episode: string) => string;
     showRangeFormatter?: (range: string) => string;
     showFormatters?: Record<number, string>;
   }
   
   export function createMockFormatter(options: FormatterOptions = {}): jest.Mocked<ShowFormatter> {
     // Implementation that configures formatted outputs for shows and networks
   }
   ```

4. Implement `TvShowServiceFactory` (fourth priority): ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/tvShowServiceFactory.ts
   import type { TvShowService } from '../../../interfaces/tvShowService.js';
   import type { Show } from '../../../schemas/domain.js';
   import type { ShowOptions } from '../../../types/tvShowOptions.js';
   import { MockOptions } from './types.js';
   
   export interface TvShowServiceOptions extends MockOptions<TvShowService> {
     shows?: Show[];
     defaultShow?: Show;
     defaultError?: Error;
   }
   
   export function createMockTvShowService(options: TvShowServiceOptions = {}): MockTvShowService {
     // Implementation that configures shows, errors, and fixtures
   }
   ```

5. Implement `StyleServiceFactory` (fifth priority): ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/styleServiceFactory.ts
   import type { StyleService } from '../../../interfaces/styleService.js';
   import { MockOptions } from './types.js';
   
   export interface StyleServiceOptions extends MockOptions<StyleService> {
     error?: (text: string) => string;
     warning?: (text: string) => string;
     info?: (text: string) => string;
     success?: (text: string) => string;
     title?: (text: string) => string;
     bold?: (text: string) => string;
     // Other style methods...
   }
   
   export function createMockStyleService(
     options: StyleServiceOptions = {}
   ): jest.Mocked<StyleService> {
     // Implementation that configures styling behavior
   }
   ```

6. Implement `OutputServiceFactory` (sixth priority): ✅ COMPLETED
   ```typescript
   // src/tests/mocks/factories/outputServiceFactory.ts
   import type { OutputService } from '../../../interfaces/outputService.js';
   import type { RenderOptions } from '../../../types/showOutputOptions.js';
   import type { Show } from '../../../schemas/domain.js';
   import { MockOptions } from './types.js';
   
   export interface OutputServiceOptions extends MockOptions<OutputService> {
     renderResult?: string;
     renderShowsImplementation?: (shows: Show[], options?: RenderOptions) => Promise<string>;
   }
   
   export function createMockOutputService(
     options: OutputServiceOptions = {}
   ): jest.Mocked<OutputService> {
     // Implementation that configures output behavior
   }
   ```

### Phase 3: Migration of Existing Tests

1. **Incremental Migration**: We'll migrate tests in stages, prioritizing:
   - First: HTTP client-related tests (most widespread usage) - ✅ PARTIALLY COMPLETED
   - Second: Core utility and service tests - ⏳ IN PROGRESS
   - Third: CLI and integration tests - 🔲 NOT STARTED
   - Fourth: Remaining unit tests - 🔲 NOT STARTED

2. **Example of Migrated Test**: ✅ COMPLETED
   
   **Before:**
   ```typescript
   describe('TvMazeServiceImpl', () => {
     it('should fetch shows', async () => {
       // Set up HTTP client manually
       const httpClient = {
         get: jest.fn().mockResolvedValue({
           data: [{ show: { id: 1, name: 'Test Show' }}],
           status: 200
         })
       };
       
       const tvMazeService = new TvMazeServiceImpl(httpClient);
       const shows = await tvMazeService.fetchShows();
       expect(shows[0].name).toBe('Test Show');
     });
   });
   ```
   
   **After:**
   ```typescript
   import { createMockHttpClient } from '../mocks/factories/httpClientFactory.js';
   
   describe('TvMazeServiceImpl', () => {
     let httpClient: MockHttpClient;
     let tvMazeService: TvMazeServiceImpl;
     
     beforeEach(() => {
       // Create mock HTTP client using factory
       httpClient = createMockHttpClient();
       
       // Mock the response
       jest.spyOn(httpClient, 'get').mockResolvedValue({
         data: sampleShowResponse,
         status: 200
       });
       
       tvMazeService = new TvMazeServiceImpl(httpClient);
     });
     
     it('should fetch shows correctly', async () => {
       const shows = await tvMazeService.fetchShows();
       expectValidShow(shows[0]);
       expect(shows[0].name).toBe('Test Show');
     });
   });
   ```

### Container Integration Examples

**Before:**
```typescript
// Manual container setup in cliTestRunner.ts
const mockConsoleOutput = { log: jest.fn(), error: jest.fn() };
container.registerInstance('ConsoleOutput', mockConsoleOutput);

const mockConfigService = {
  getShowOptions: jest.fn().mockReturnValue({ date: '2023-01-01' }),
  getAppConfig: jest.fn().mockReturnValue({ apiKey: 'test' })
};
container.registerInstance('ConfigService', mockConfigService);
```

**After:**
```typescript
// Using factory functions in cliTestRunner.ts
import { createMockConsoleOutput } from '../mocks/factories/consoleOutputFactory.js';
import { createTestConfigService } from '../mocks/factories/configServiceFactory.js';
import { registerMockInContainer } from '../utils/jestHelpers.js';

export async function runCli(args: Partial<CliArgs>): Promise<{
  stdout: string[];
  exitCode: number;
}> {
  // Create mocks with type safety
  const consoleOutput = createMockConsoleOutput();
  const configService = createTestConfigService({
    showOptions: { date: args.date, country: args.country }
  });
  
  // Register in container
  registerMockInContainer('ConsoleOutput', consoleOutput);
  registerMockInContainer('ConfigService', configService);
  
  // Run the CLI and return captured output
  const exitCode = await runCli(args);
  return {
    stdout: consoleOutput.getStdout(),
    exitCode
  };
}
```

## Progress Tracker (Updated April 2025)

### Factory Implementation Status

| Factory | Status | Notes |
|---------|--------|-------|
| HttpClientFactory | ✅ COMPLETED | Fixed error handling precedence |
| ConfigServiceFactory | ✅ COMPLETED | Integrated with TestConfigServiceImpl |
| FormatterFactory | ✅ COMPLETED | |
| TvShowServiceFactory | ✅ COMPLETED | |
| StyleServiceFactory | ✅ COMPLETED | |
| OutputServiceFactory | ✅ COMPLETED | |

### Test Migration Status

| Test Category | Progress | Files Migrated | Files Remaining |
|---------------|----------|----------------|-----------------|
| HTTP Client Tests | 50% | • httpClientFactory.test.ts<br>• tvMazeServiceImpl.test.ts | • fetchHttpClientImpl.test.ts<br>• httpClient.test.ts |
| Core Service Tests | 20% | • tvMazeServiceImpl.test.ts | • consoleOutputServiceImpl.test.ts<br>• consoleFormatterImpl.test.ts<br>• chalkStyleServiceImpl.test.ts |
| CLI Tests | 0% | | • cli.test.ts<br>• realApiTest.test.ts |
| Integration Tests | 0% | | • cli.test.ts<br>• Various integration tests |
| Utility Tests | 0% | | • Various utility tests |

### Jest Helper Status

| Helper | Status | Notes |
|--------|--------|-------|
| createTypedMock | ✅ COMPLETED | Fixed to properly handle type constraints |
| registerMockInContainer | 🔲 NOT STARTED | Utility for registering mocks in DI container |

## Detailed Next Steps

### 1. Complete HTTP Client Test Migration (High Priority)

- [ ] 1.1. Update `fetchHttpClientImpl.test.ts` to use HttpClientFactory
  - Replace inline mock responses with factory method
  - Ensure test coverage is maintained

- [ ] 1.2. Update `httpClient.test.ts` to use HttpClientFactory
  - Replace custom mock setup with standardized approach
  - Ensure edge cases are still tested properly

### 2. Implement Container Registration Helper (High Priority)

- [ ] 2.1. Create `registerMockInContainer` helper in `jestHelpers.ts`
  ```typescript
  // src/tests/testutils/jestHelpers.ts
  export function registerMockInContainer<T>(
    token: string | symbol,
    mock: T
  ): void {
    container.clearInstances(token);
    container.registerInstance(token, mock);
  }
  ```

### 3. Migrate Core Service Tests (Medium Priority)

- [ ] 3.1. Update `consoleOutputServiceImpl.test.ts`
  - Replace inline ConsoleOutput mock with factory function
  - Replace inline ShowFormatter mock with factory function
  - Replace inline ConfigService mock with factory function

- [ ] 3.2. Update `consoleFormatterImpl.test.ts`
  - Replace any inline mocks with factory functions

- [ ] 3.3. Update `chalkStyleServiceImpl.test.ts`
  - Ensure any mocking is done through factory functions

### 4. Migrate CLI and Integration Tests (Medium Priority)

- [ ] 4.1. Update `cli.test.ts`
  - Replace custom mock setup with factory functions
  - Ensure DI container registration is streamlined

- [ ] 4.2. Update `realApiTest.test.ts`
  - Identify where mocks can be replaced with factory functions
  - Maintain the real API integration points

### 5. Create Documentation (Medium Priority)

- [ ] 5.1. Create a mock usage guide in `docs/development/mock-usage-guide.md`
  - Document patterns for using factory functions
  - Provide examples for common test scenarios
  - Include container integration guidance

- [ ] 5.2. Update any existing documentation to reference the new approach

### 6. Standardize Remaining Tests (Lower Priority)

- [ ] 6.1. Systematically update remaining utility tests
  - Focus on tests with custom mock implementation

- [ ] 6.2. Create a pull request checklist item for new tests
  - Ensure new tests follow the factory pattern

### 7. Validate Metrics (Lower Priority)

- [ ] 7.1. Measure code duplication reduction
  - Compare lines of mock code before and after

- [ ] 7.2. Analyze test readability improvements
  - Solicit feedback from team members

- [ ] 7.3. Document findings in a brief report

## Validation Metrics

To measure the success of our refactoring effort, we'll track the following metrics:

### Quantitative Metrics

1. **Code Duplication Reduction**:
   - Measure the number of lines of mock implementation code before and after refactoring
   - Target: >90% reduction in duplicate implementations across test files
   - Method: Count lines of inline mock code vs. lines in reusable implementations

2. **Test Coverage Impact**:
   - Ensure refactoring doesn't decrease code coverage
   - Target: Maintain or improve existing coverage levels (currently ~80%)
   - Method: Compare Jest coverage reports before and after refactoring

3. **Code Size**:
   - Track changes in overall codebase size
   - Target: Test file size reduction of at least 15% due to removal of redundant code
   - Method: Compare file sizes before and after refactoring

4. **Type Safety Enforcement**:
   - Measure TypeScript errors caught during migration
   - Target: Convert 100% of untyped mocks to properly typed implementations
   - Method: Track type errors fixed during migration

### Qualitative Metrics

1. **Test Readability**:
   - Subjective assessment of test file clarity
   - Target: Improved readability scores from team reviews
   - Method: Team survey before/after refactoring

2. **Maintainability**:
   - Assessment of effort required to update tests when interfaces change
   - Target: Reduced time spent updating tests for interface changes
   - Method: Compare time needed for test updates before/after

3. **Developer Experience**:
   - Ease of creating new tests using the factory pattern
   - Target: Reduced time to create new tests with proper mocks
   - Method: Measure time to create new tests before/after

## Success Metrics

1. **Test Coverage**:
   - Maintain or improve current test coverage
   - Target: 95%+ coverage for core modules
   - Method: Jest coverage reports

2. **Maintainability**:
   - Assessment of effort required to update tests when interfaces change
   - Target: Reduced time spent updating tests for interface changes
   - Method: Compare time needed for test updates before/after

3. **Developer Experience**:
   - Ease of creating new tests using the factory pattern
   - Target: Reduced time to create new tests with proper mocks
   - Method: Measure time to create new tests before/after
