# WhatsOnTV Refactoring: Next Steps

This document outlines the current status of refactoring efforts for the WhatsOnTV application and provides recommendations for future work. It's based on a review of existing GitHub issues and the current state of the codebase as of March 23, 2025.

## Issues Status Overview

### Completed Issues

#### Issue #43: Refactor: implement class-based architecture for console output
- **Status**: ✅ Completed
- **What was done**: Implemented the class-based architecture with proper interfaces and implementations in the `implementations/console` directory.
- **Next steps**: Closed as part of PR #52.

#### Issue #39: Refactor: implement structured dependency injection
- **Status**: ✅ Completed
- **What was done**: Implemented dependency injection using tsyringe throughout the application, with proper container registration and injection.
- **Next steps**: Closed as part of PR #52.

#### Issue #48: Suppress console error output during test runs
- **Status**: ✅ Completed
- **What was done**: Modified the test environment to properly suppress console output during test runs. Verification confirms no console errors are displayed when running tests.
- **Next steps**: No further action needed.

### Partially Addressed Issues

#### Issue #47: Standardize mocking approach for dependency injection in tests
- **Status**: 🔶 Partially addressed
- **What was done**: Improved some test implementations, but haven't standardized the approach across all tests.
- **Recommendation**: Create helper utilities for mocking injected dependencies consistently:

```typescript
// Example test helper for DI mocking
export function createMockContainer() {
  const container = new Container();
  
  // Register mock services
  container.register('HttpClient', { useValue: createMockHttpClient() });
  container.register('ConsoleOutput', { useValue: createMockConsoleOutput() });
  
  return container;
}

// Usage in tests
const mockContainer = createMockContainer();
const service = mockContainer.resolve(ServiceUnderTest);
```

#### Issue #46: Refactor ConsoleOutputService test implementation
- **Status**: 🔶 Partially addressed
- **What was done**: Improved the implementation but still have some subclass-based testing.
- **Recommendation**: Complete the refactoring to use proper dependency injection in tests instead of subclassing:

```typescript
// Instead of subclassing
const mockFormatter = { formatShow: jest.fn() };
container.register('ShowFormatter', { useValue: mockFormatter });
const service = container.resolve(ConsoleOutputService);
```

### Not Yet Addressed Issues

#### Issue #42: Refactor: reduce duplication in tvShowService extract functions
- **Status**: ❌ Not addressed
- **Recommendation**: Implement the generic property extractor function as described in the issue to reduce code duplication:

```typescript
function extractProperty<T, K extends keyof T, V>(
  obj: T,
  key: K,
  validator: (value: unknown) => value is V,
  defaultValue: V
): V {
  const value = obj[key];
  return validator(value) ? value : defaultValue;
}
```

#### Issue #41: Refactor: break down tvShowService into smaller modules
- **Status**: ❌ Not addressed
- **Recommendation**: Split the tvShowService into smaller, focused modules:
  - `validators.ts` - Type validation functions
  - `extractors.ts` - Property extraction functions
  - `filters.ts` - Show filtering functions
  - `formatters.ts` - Data formatting functions
  - `tvShowService.ts` - Core service using the above modules

## New Issues

### Issue #50: Implement Integration Tests for CLI
- **Status**: 📝 Created
- **Description**: Created a new issue to implement integration tests that would have caught the CLI output issues we encountered.
- **Recommendation**: Implement integration tests that capture and verify console output, test CLI arguments, and verify error handling.

## Priority Recommendations

1. **Immediate priorities** (Next sprint):
   - **Issue #42**: Implement generic property extractor to reduce duplication in tvShowService
   - **Issue #47**: Standardize mocking approach for dependency injection in tests
   - **Issue #46**: Refactor ConsoleOutputService test implementation to use proper DI

2. **Medium-term work** (Next 2-3 sprints):
   - Address issue #41 to break down tvShowService into smaller modules
   - Implement the integration tests proposed in issue #50 to prevent future CLI issues

3. **Long-term improvement** (Future planning):
   - Consider adding property-based testing for complex functions
   - Explore opportunities for further modularization

## Test Coverage Strategy

Current test coverage has exceeded the 80% target for all metrics:

| Metric      | Current | Target | Status    |
|-------------|---------|--------|-----------|
| Statements  | 90.7%   | 80%    | ✅ Exceeded |
| Branches    | 84.33%  | 80%    | ✅ Exceeded |
| Functions   | 92%     | 80%    | ✅ Exceeded |
| Lines       | 91.6%   | 80%    | ✅ Exceeded |

While the coverage targets have been met, there are still opportunities to improve test quality:

1. Standardize the testing approach for dependency injection (Issue #47)
2. Improve test maintainability by refactoring ConsoleOutputService tests (Issue #46)
3. Implement integration tests for the CLI (Issue #50)

## Conclusion

The WhatsOnTV application has undergone significant refactoring to implement a clean architecture with proper dependency injection. The codebase now has a solid foundation with good test coverage and a clear separation of concerns.

The next phase of refactoring should focus on reducing code duplication, standardizing testing approaches, and further improving the modularity of the application. By addressing issues #42, #47, and #46 in that order, we can continue to evolve the codebase toward a more maintainable, testable, and robust application.
