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
    │   └── factories/     # Factory functions for creating test instances
    │       ├── index.ts                # Barrel file re-exporting all factories
    │       ├── configServiceFactory.ts
    │       ├── consoleOutputFactory.ts
    │       ├── formatterFactory.ts
    │       ├── httpClientFactory.ts
    │       ├── styleServiceFactory.ts ✅ COMPLETED
    │       ├── outputServiceFactory.ts ✅ COMPLETED
    │       └── tvShowServiceFactory.ts
    ├── utils/             # General test utilities
    │   ├── assertions.ts  # Custom test assertions
    │   ├── jestHelpers.ts # Jest-specific utilities
    │   └── testRunner.ts  # Test runner utilities
    └── ...
```

This structure maintains a clear distinction between:
- Implementation files that are part of the source but meant for testing (`src/implementations/test/`) - these are real alternative implementations that could be used in production
- Test-only mocks that don't belong in production code (`src/tests/mocks/implementations/`)
- Factory functions that create test instances (`src/tests/mocks/factories/`)
- General test utilities (`src/tests/utils/`)

The factory functions will be organized as individual files with a barrel index for easy importing:

```typescript
// src/tests/mocks/factories/index.ts
export * from './httpClientFactory.js';
export * from './configServiceFactory.js';
export * from './styleServiceFactory.js'; ✅ COMPLETED
export * from './outputServiceFactory.js'; ✅ COMPLETED
// etc.
```

This allows for:
1. Modular development in separate files
2. Simple imports via the barrel file (import { createMockHttpClient } from '../mocks/factories')
3. Ability to import only what's needed when desired

## Implementation Plan

### Phase 1: Create Basic Structure and Foundation 

1. Establish the directory structure:
   - Create `src/tests/mocks/implementations/` directory 
   - Create `src/tests/mocks/factories/` directory with index.ts barrel file 
   - Create `src/tests/utils/` directory if not already present 
   - Move MockConsoleOutputImpl to `src/tests/mocks/implementations/mockConsoleOutput.ts`

2. Develop core factory interfaces with TypeScript types:
   ```typescript
   // src/tests/mocks/factories/types.ts
   export interface MockOptions<T> {
     defaultReturn?: T;
     implementation?: Partial<Record<keyof T, jest.Mock>>;
     throwError?: boolean | Error;
   }
   ```

3. Create base test assertion utilities:
   ```typescript
   // src/tests/utils/assertions.ts
   export function expectValidShow(show: any): void { /* ... */ }
   ```

4. Create Jest integration helpers:
   ```typescript
   // src/tests/utils/jestHelpers.ts
   export function createTypedMock<T>(): jest.Mocked<T> { /* ... */ }
   ```

### Phase 2: Implement Core Mock Factories

1. Implement `HttpClientFactory` (highest priority): 
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

2. Implement `ConfigServiceFactory` (second priority): 
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

3. Implement `FormatterFactory` (third priority): 
   ```typescript
   // src/tests/mocks/factories/formatterFactory.ts
   import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
   import type { NetworkGroups, Show } from '../../../schemas/domain.js';
   import { MockOptions } from './types.js';
   
   export interface FormatterOptions extends MockOptions<ShowFormatter> {
     defaultFormattedShow?: string;
     defaultFormattedTimedShow?: string;
     defaultFormattedUntimedShow?: string;
     defaultFormattedMultipleEpisodes?: string[];
     defaultFormattedNetworkGroups?: string[];
     showFormatters?: Record<number, string>;
   }
   
   export function createMockFormatter(options: FormatterOptions = {}): jest.Mocked<ShowFormatter> {
     // Implementation that configures formatted outputs for shows and networks
   }
   ```

4. Implement `TvShowServiceFactory` (fourth priority): 
   ```typescript
   // src/tests/mocks/factories/tvShowServiceFactory.ts
   import type { TvShowService } from '../../../interfaces/tvShowService.js';
   import type { Show } from '../../../schemas/domain.js';
   import { MockOptions } from './types.js';
   
   export interface TvShowServiceOptions extends MockOptions<TvShowService> {
     defaultShows?: Show[];
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
     /** Whether to return styled text (true) or plain text (false) */
     styled?: boolean;
     
     /** Custom style transformations for specific methods */
     customStyles?: {
       bold?: (text: string) => string;
       // Other style methods...
     };
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
   import type { Show } from '../../../schemas/domain.js';
   import { MockOptions } from './types.js';

   export interface OutputServiceOptions extends MockOptions<OutputService> {
     /** Error to throw when renderOutput is called */
     renderError?: Error;
     
     /** Custom callback to execute when renderOutput is called */
     onRenderOutput?: (shows: Show[]) => void;
   }
   
   export function createMockOutputService(
     options: OutputServiceOptions = {}
   ): jest.Mocked<OutputService> {
     // Implementation that configures output behavior
   }
   ```

### Phase 3: Standardize Existing Tests (Migration Strategy)

1. **Incremental Migration**: We'll migrate tests in stages, prioritizing:
   - First: HTTP client-related tests (most widespread usage)
   - Second: Core utility and service tests
   - Third: CLI and integration tests
   - Fourth: Remaining unit tests

2. **Migration Guide**: For each test file, follow these steps:
   - Identify inline mocks and direct dependencies
   - Add factory imports from barrel file: `import { createMockHttpClient } from '../../mocks/factories/index.js';`
   - Replace inline implementations with factory calls
   - Update test assertions to use utilities from `src/tests/utils/assertions.js`
   - Verify test coverage remains consistent

3. **Container Integration**: Update cliTestRunner.ts to:
   - Use factory functions instead of direct implementation classes
   - Provide container registration helpers for test scenarios
   - Add TypeScript generics for better type safety

### Phase 4: Documentation and Best Practices

1. Document factory functions and mock implementations
2. Create usage examples for common test scenarios
3. Update test templates and examples
4. Document validation metrics and success criteria

## Technical Implementation Details

### TypeScript Type Safety

All mocks and factories will enforce strict type safety:

```typescript
// Example of type-safe factory function in src/tests/mocks/factories/configServiceFactory.ts
import type { ConfigService } from '../../../interfaces/configService.js';
import type { ShowOptions } from '../../../types/tvShowOptions.js';
import type { CliOptions, AppConfig, SlackConfig } from '../../../types/configTypes.js';
import { MockOptions } from './types.js';

// Specific options extending the generic interface
export interface ConfigServiceOptions extends MockOptions<ConfigService> {
  showOptions?: Partial<ShowOptions>;
  cliOptions?: Partial<CliOptions>;
  appConfig?: Partial<AppConfig>;
  slackConfig?: Partial<SlackConfig>;
}

// Type-safe factory function
export function createMockConfigService(
  options: ConfigServiceOptions = {}
): TestConfigServiceImpl {
  // Implementation...
}
```

### Container Integration

For better integration with the tsyringe DI container:

```typescript
// Container test utilities
export function registerMockInContainer<T>(
  token: string,
  mockFactory: () => T,
  options: { singleton?: boolean } = {}
): T {
  const instance = mockFactory();
  
  if (options.singleton) {
    container.registerInstance(token, instance);
  } else {
    container.register(token, { useValue: instance });
  }
  
  return instance;
}

// Example usage for cliTestRunner
const mockConsoleOutput = registerMockInContainer(
  'ConsoleOutput',
  () => createMockConsoleOutput({ captureOutput: true }),
  { singleton: true }
);
```

### Test Coverage Impact

This refactoring is expected to:

1. **Maintain or improve coverage**: By standardizing mocks, we'll reduce the risk of missed test cases
2. **Improve coverage quality**: Better mocks lead to more thorough testing of edge cases
3. **Impact measurement**: We'll track coverage before and after each migration:
   - Statement coverage (target: maintain 80%+)
   - Branch coverage (target: maintain 80%+)
   - Function coverage (target: maintain 80%+)
   - Line coverage (target: maintain 80%+)

Coverage will be measured using Jest's coverage reports, and we'll ensure no regression during the migration.

### Jest Integration

We'll create utilities to simplify working with Jest mocks while maintaining type safety:

```typescript
// src/tests/utils/jestHelpers.ts
export function createTypedMock<T>(): jest.Mocked<T> {
  return jest.fn() as unknown as jest.Mocked<T>;
}

export function createTypedSpy<T extends object>(
  obj: T,
  method: keyof T
): jest.SpyInstance {
  return jest.spyOn(obj, method);
}

export function createMockImplementation<T>(
  implementation: Partial<Record<keyof T, any>> = {}
): jest.Mocked<T> {
  const mockedMethods = Object.entries(implementation).reduce(
    (acc, [key, value]) => {
      acc[key as keyof T] = typeof value === 'function' 
        ? jest.fn(value) 
        : jest.fn(() => value);
      return acc;
    },
    {} as Record<keyof T, jest.Mock>
  );
  
  return mockedMethods as unknown as jest.Mocked<T>;
}
```

To provide type safety with the container, we'll create a `registerMockInContainer` utility:

```typescript
// src/tests/utils/containerHelpers.ts
import { container } from '../../container.js';
import type { DependencyContainer } from 'tsyringe';

export function registerMockInContainer<T>(
  token: string | symbol,
  mockInstance: T,
  customContainer: DependencyContainer = container
): void {
  customContainer.registerInstance(token, mockInstance);
}
```

### ShowFormatter Mock Implementation

```typescript
// src/tests/mocks/implementations/mockFormatter.ts
import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
import type { Show, Network } from '../../../types/tvMazeTypes.js';

export class MockFormatter implements ShowFormatter {
  formatShow(show: Show): string {
    return `Mock Formatted Show: ${show.name}`;
  }
  
  formatNetworkGroups(networkGroups: Record<Network['name'], Show[]>): string {
    return `Mock Formatted Network Groups: ${Object.keys(networkGroups).length} networks`;
  }
  
  // Test helper methods
  mockFormatShow(show: Show, customFormat: string): void {
    this.formatShow = jest.fn().mockReturnValue(customFormat);
  }
  
  mockFormatNetworkGroups(networkGroups: Record<Network['name'], Show[]>, customFormat: string): void {
    this.formatNetworkGroups = jest.fn().mockReturnValue(customFormat);
  }
}

// src/tests/mocks/factories/formatterFactory.ts
import { MockFormatter } from '../implementations/mockFormatter.js';
import type { ShowFormatter } from '../../../interfaces/showFormatter.js';
import { MockOptions } from './types.js';

export interface FormatterOptions extends MockOptions<ShowFormatter> {
  showFormat?: string;
  networkGroupsFormat?: string;
}

export function createMockFormatter(options: FormatterOptions = {}): MockFormatter {
  const formatter = new MockFormatter();
  
  if (options.showFormat) {
    formatter.mockFormatShow = jest.fn().mockReturnValue(options.showFormat);
  }
  
  if (options.networkGroupsFormat) {
    formatter.mockFormatNetworkGroups = jest.fn().mockReturnValue(options.networkGroupsFormat);
  }
  
  return formatter;
}
```

### Test Assertion Utilities

```typescript
// src/tests/utils/assertions.ts
import type { Show, Network } from '../../types/tvMazeTypes.js';

export function expectValidShow(show: any): void {
  expect(show).toBeDefined();
  expect(show.id).toBeDefined();
  expect(typeof show.name).toBe('string');
  
  // Add more validation as needed
}

export function expectValidNetworkGroups(networkGroups: Record<Network['name'], Show[]>): void {
  expect(networkGroups).toBeDefined();
  
  // Validate structure
  Object.entries(networkGroups).forEach(([network, shows]) => {
    expect(typeof network).toBe('string');
    expect(Array.isArray(shows)).toBe(true);
    
    if (shows.length > 0) {
      expectValidShow(shows[0]);
    }
  });
}
```

## Usage Examples

#### Basic Mock Creation

```typescript
// Using the HttpClient factory
import { createMockHttpClient } from '../mocks/factories/index.js';

const httpClient = createMockHttpClient();
httpClient.mockGet('/api/shows', { data: [], status: 200 });

// Using the more complex ConfigService factory
import { createMockConfigService } from '../mocks/factories/index.js';

const configService = createMockConfigService({
  showOptions: { date: '2023-04-01', country: 'US' }
});
```

#### Container Integration

```typescript
// Using factories with the container
import { container } from '../../container.js';
import { createMockHttpClient } from '../mocks/factories/index.js';
import { registerMockInContainer } from '../utils/jestHelpers.js';

const httpClient = createMockHttpClient();
registerMockInContainer('HttpClient', httpClient);

// Now container.resolve('HttpClient') will return our mock
```

#### Before and After Examples

**Before:**
```typescript
// Before refactoring
const mockHttpClient = {
  get: jest.fn().mockResolvedValue({
    data: sampleShowResponse,
    status: 200
  })
};

const tvMazeService = new TvMazeServiceImpl(mockHttpClient);
const shows = await tvMazeService.fetchShows();
expect(shows[0].name).toBe('Test Show');
```

**After:**
```typescript
// After refactoring
import { createMockHttpClient } from '../../mocks/factories/index.js';
import { expectValidShow } from '../../utils/assertions.js';

describe('TvMazeServiceImpl', () => {
  let tvMazeService: TvMazeServiceImpl;
  let httpClient: ReturnType<typeof createMockHttpClient>;
  
  beforeEach(() => {
    httpClient = createMockHttpClient();
    httpClient.mockGet('/api/shows/1', {
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
