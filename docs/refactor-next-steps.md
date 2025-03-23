# WhatsOnTV Refactoring: Next Steps

This document outlines the current status of refactoring efforts for the WhatsOnTV application and provides recommendations for future work. It's based on a review of existing GitHub issues and the current state of the codebase as of March 23, 2025.

## Issues Status Overview

### Completed Issues

#### Issue #43: Refactor: implement class-based architecture for console output
- **Status**: ✅ Completed
- **What was done**: Implemented the class-based architecture with proper interfaces and implementations in the `implementations/console` directory.
- **Next steps**: Close this issue as completed.

#### Issue #39: Refactor: implement structured dependency injection
- **Status**: ✅ Completed
- **What was done**: Implemented dependency injection using tsyringe throughout the application, with proper container registration and injection.
- **Next steps**: Close this issue as completed.

### Partially Addressed Issues

#### Issue #48: Suppress console error output during test runs
- **Status**: 🔶 Partially addressed
- **What was done**: Modified the `log` method in `GotHttpClientImpl` to handle undefined data parameters, which reduces some console noise.
- **Recommendation**: Complete this by implementing a proper test environment detection and console mocking strategy. Consider adding a global Jest setup file that mocks console methods during tests:

```typescript
// In jest.setup.js
beforeAll(() => {
  jest.spyOn(console, 'error').mockImplementation(() => {});
  jest.spyOn(console, 'warn').mockImplementation(() => {});
});

afterAll(() => {
  jest.restoreAllMocks();
});
```

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

1. **Immediate priorities**:
   - Fix the remaining lint errors in the codebase
   - Close issues #43 and #39 as they are completed

2. **Short-term work** (Next 1-2 sprints):
   - Complete issue #48 by implementing proper console mocking in tests
   - Standardize the mocking approach (issue #47) to improve test maintainability

3. **Medium-term work** (Next 2-3 sprints):
   - Address issues #42 and #41 to improve code organization and reduce duplication
   - Complete the refactoring of ConsoleOutputService tests (issue #46)

4. **Long-term improvement** (Future planning):
   - Implement the integration tests proposed in issue #50 to prevent future CLI issues
   - Increase test coverage to meet the 80% target

## Test Coverage Strategy

Current test coverage is around 71.91%, with a target of 80%. To reach this target:

1. Add tests for uncovered code paths in:
   - `src/implementations/gotHttpClientImpl.ts` (lines 88-191, 202-208)
   - `src/implementations/tvMazeServiceImpl.ts` (various lines)
   - `src/implementations/console/consoleOutputServiceImpl.ts` (lines 58-59, 81-197)

2. Implement integration tests for the CLI (issue #50)

3. Consider adding property-based testing for complex functions

## Conclusion

The WhatsOnTV application has undergone significant refactoring to implement a clean architecture with proper dependency injection. While many issues have been addressed, there are still opportunities for further improvement in code organization, test coverage, and developer experience.

By following the recommendations in this document, the codebase can continue to evolve toward a more maintainable, testable, and robust application.
