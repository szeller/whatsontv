# CLI Testing Strategy Refactor and Lambda Handler Testing

**Document Version:** 2.0  
**Date:** 2025-07-27  
**Author:** Development Team  
**Status:** Draft - Revised Approach  

## Executive Summary

This technical specification addresses critical dependency injection complexity in the current CLI testing strategy (GitHub Issue #88) and establishes comprehensive testing for the Lambda handler implementation. The current approach suffers from brittle dependency injection patterns that make tests hard to maintain and debug. This refactor will implement clean dependency injection while preserving the valuable fixture-based testing approach, adding robust Lambda handler test coverage with both fixture-based and integration testing strategies.

## Problem Statement

### Current CLI Testing Issues

1. **Complex Dependency Injection**: `cliTestRunner.ts` performs brittle container manipulation with complex cleanup logic
2. **Global Container State Mutation**: Tests mutate shared container state, creating potential race conditions and debugging difficulties
3. **Fragile Service Resolution**: Complex try/catch logic for service resolution with manual restoration in finally blocks
4. **Limited Testing Strategies**: Current approach doesn't support both fixture-based and real API integration testing

### Dependency Injection Complexity Example

```typescript
// Current brittle approach
const originalConsoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
container.register('ConsoleOutput', { useValue: mockConsoleOutput });

let originalConfigService: ConfigService | null = null;
try {
  originalConfigService = container.resolve<ConfigService>('ConfigService');
} catch (_) {
  originalConfigService = null;
}
container.register('ConfigService', { useValue: mockConfigService });

// Complex cleanup in finally block
finally {
  container.register('ConsoleOutput', { useValue: originalConsoleOutput });
  if (originalConfigService !== null) {
    container.register('ConfigService', { useValue: originalConfigService });
  }
}
```

### Lambda Handler Testing Gap

- No tests for `src/lambda/handlers/slackHandler.ts` which reuses CLI architecture
- Missing coverage for AWS Lambda event/context handling
- No validation of error scenarios in serverless environment
- Lack of integration tests for CDK deployment model

## Goals and Objectives

### Primary Goals

1. **Simplify Dependency Injection**: Eliminate complex container manipulation in integration tests
2. **Preserve Fixture Value**: Keep fixture-based testing for regression and edge cases while enabling real API testing
3. **Lambda Handler Coverage**: Comprehensive testing for serverless execution context
4. **Test Isolation**: Ensure tests don't interfere with each other through shared container state
5. **Maintainable Architecture**: Clean, understandable test patterns with clear dependency management

### Success Criteria

- [ ] CLI tests use clean dependency injection without global container mutation
- [ ] Both fixture-based and real API integration testing are supported
- [ ] Lambda handler tests cover success and error scenarios
- [ ] Test coverage maintains current levels (>90% statements, >89% branches)
- [ ] All existing functionality continues to work
- [ ] Tests are maintainable and easy to understand
- [ ] No race conditions or shared state issues between tests

## Technical Architecture

### Current State Analysis

```typescript
// Current problematic dependency injection in cliTestRunner.ts
const originalConsoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
container.register('ConsoleOutput', { useValue: mockConsoleOutput });

let originalConfigService: ConfigService | null = null;
try {
  originalConfigService = container.resolve<ConfigService>('ConfigService');
} catch (_) {
  originalConfigService = null; // Complex error handling
}
container.register('ConfigService', { useValue: mockConfigService });

// Brittle cleanup logic
finally {
  container.register('ConsoleOutput', { useValue: originalConsoleOutput });
  if (originalConfigService !== null) {
    container.register('ConfigService', { useValue: originalConfigService });
  }
}
```

### Proposed Architecture

#### 1. Test-Scoped Dependency Injection

```typescript
// Option 1: Test-scoped containers (if tsyringe supports child containers)
class CliTestRunner {
  async runCliWithTestContainer(args: CliArgs): Promise<TestResult> {
    const testContainer = container.createChildContainer();
    
    // Register test-specific services in isolated container
    testContainer.register('ConsoleOutput', { useValue: mockConsoleOutput });
    testContainer.register('ConfigService', { useValue: mockConfigService });
    
    const cliApp = createCliAppWithContainer(testContainer);
    return await cliApp.run();
    
    // No cleanup needed - container is scoped to this test
  }
}
```

#### 2. Explicit Dependency Injection

```typescript
// Option 2: Pass dependencies explicitly
interface TestDependencies {
  consoleOutput: ConsoleOutput;
  configService: ConfigService;
  tvShowService: TvShowService;
  httpClient: HttpClient;
}

class CliTestRunner {
  async runCliWithDependencies(
    args: CliArgs,
    dependencies: TestDependencies
  ): Promise<TestResult> {
    // Create CLI app with explicit dependencies - no global container
    const cliApp = new ConsoleCliApp(dependencies);
    return await cliApp.run();
  }
}
```

#### 3. Hybrid Testing Strategy

```typescript
// Support both fixture-based and real API testing
class FlexibleTestRunner {
  // Fixture-based testing for regression and edge cases
  async runWithFixtures(args: CliArgs, fixtures: TestFixtures): Promise<TestResult> {
    const mockTvShowService = createMockTvShowService(fixtures);
    return this.runWithDependencies(args, { tvShowService: mockTvShowService });
  }
  
  // Real API testing for integration validation
  async runWithRealApi(args: CliArgs): Promise<TestResult> {
    const realHttpClient = createMockHttpClientWithRealResponses();
    const realTvShowService = new TvMazeServiceImpl(realHttpClient);
    return this.runWithDependencies(args, { tvShowService: realTvShowService });
  }
}
```

#### 2. Lambda Handler Testing Framework

```typescript
// Lambda-specific test utilities
interface LambdaTestEvent {
  source?: string;
  detail?: unknown;
}

interface LambdaTestContext {
  awsRequestId: string;
  functionName: string;
  remainingTimeInMillis: number;
}

class LambdaTestRunner {
  async invokeLambdaHandler(
    event: LambdaTestEvent,
    context: LambdaTestContext
  ): Promise<LambdaResponse> {
    // Test Lambda handler with realistic AWS context
  }
}
```

#### 3. Shared Testing Infrastructure

```typescript
// Reusable utilities for both CLI and Lambda testing
export class TestDataBuilder {
  static createRealisticTvMazeResponse(): TvMazeApiResponse {
    // Create realistic API responses based on actual TVMaze data
  }
  
  static createErrorResponse(statusCode: number): HttpErrorResponse {
    // Create realistic error scenarios
  }
}

export class TestAssertions {
  static assertShowDataFormatted(output: string[], expectedShows: Show[]): void {
    // Verify actual data transformation and formatting
  }
  
  static assertSlackMessageFormat(message: string): void {
    // Verify Slack-specific formatting requirements
  }
}
```

## Implementation Plan

### Phase 1: Dependency Injection Refactor (Week 1)

#### 1.1 Evaluate DI Container Options
- **Research**: Investigate if tsyringe supports child containers or scoped containers
- **Alternative**: Design explicit dependency injection pattern if child containers not available
- **Decision**: Choose between test-scoped containers vs explicit DI approach

#### 1.2 Create Test Infrastructure
- **New File**: `src/tests/utils/testDependencyBuilder.ts`
- **Purpose**: Builder pattern for creating test dependencies
- **Features**: Support both fixture-based and real API configurations

#### 1.3 Refactor cliTestRunner.ts
- **File**: `src/tests/integration/cli/cliTestRunner.ts`
- **Changes**: Replace complex container manipulation with clean DI approach
- **Preserve**: Keep fixture injection capability for regression tests
- **Add**: Support for real API testing alongside fixture testing

### Phase 2: Lambda Handler Testing (Week 2)

#### 2.1 Lambda Handler Unit Tests
- **New File**: `src/tests/lambda/handlers/slackHandler.test.ts`
- **Approach**: Use same clean DI pattern as CLI tests
- **Coverage**: 
  - Successful execution with valid Slack configuration (fixture-based)
  - Error handling for missing environment variables
  - AWS Lambda context handling
  - Response format validation

#### 2.2 Lambda Integration Tests
- **New File**: `src/tests/integration/lambda/lambdaIntegration.test.ts`
- **Approach**: Both fixture-based and mock AWS service integration
- **Coverage**:
  - End-to-end Lambda execution with fixtures
  - Error recovery and logging
  - CloudWatch integration testing

#### 2.3 Lambda Test Infrastructure
- **New File**: `src/tests/utils/lambdaTestBuilder.ts`
- **Purpose**: Builder pattern for Lambda test dependencies
- **Features**: Mock AWS context, environment variables, and services

### Phase 3: Enhanced Testing Capabilities (Week 3)

#### 3.1 Selective Real API Testing
- **New File**: `src/tests/integration/api/contractTests.ts`
- **Purpose**: Validate TVMaze API contract assumptions
- **Approach**: Small number of tests that hit real API to ensure contract compliance
- **Frequency**: Run separately from main test suite (e.g., nightly)

#### 3.2 Test Strategy Documentation
- **New File**: `docs/development/testing-strategy.md`
- **Content**: When to use fixtures vs real API testing
- **Guidelines**: Best practices for new test development

#### 3.3 Performance and Reliability
- **Enhancement**: Add test execution time monitoring
- **Goal**: Ensure fixture-based tests remain fast (<3 seconds total)
- **Monitoring**: Track test reliability and flakiness

## Risk Assessment

### High Risk
- **Breaking Changes**: Refactoring core test infrastructure may break existing tests
- **Mitigation**: Incremental rollout, maintain backward compatibility during transition

### Medium Risk
- **Test Coverage Regression**: Removing fixture injection might reduce apparent coverage
- **Mitigation**: Implement comprehensive real-flow testing before removing fixtures

### Low Risk
- **Lambda Handler Complexity**: New testing patterns for serverless environment
- **Mitigation**: Start with simple test cases, build complexity gradually

## Testing Strategy

### Unit Tests
- Individual component testing with mocked dependencies
- Focus on business logic validation
- Target: 95% statement coverage

### Integration Tests
- End-to-end CLI execution with mocked HTTP responses
- Lambda handler with realistic AWS context
- Target: 90% branch coverage

### Contract Tests
- Validate API response format assumptions
- Ensure TVMaze API contract compliance
- Target: 100% API endpoint coverage

## Performance Considerations

### Test Execution Time
- **Current**: ~3 seconds for full test suite
- **Target**: Maintain <5 seconds after refactor
- **Strategy**: Parallel test execution, efficient mocking

### Memory Usage
- **Concern**: Large fixture files may impact memory
- **Solution**: Lazy loading, fixture cleanup after tests

### CI/CD Impact
- **Current**: Tests run in ~2-3 minutes in CI
- **Target**: Maintain current CI execution time
- **Strategy**: Optimize test parallelization

## Security Considerations

### Test Data
- **Requirement**: No real API keys or sensitive data in test fixtures
- **Implementation**: Mock all external service credentials
- **Validation**: Security scan of test files

### Lambda Testing
- **Requirement**: Test with realistic but non-production AWS context
- **Implementation**: Mock AWS services, validate IAM permissions
- **Validation**: Ensure tests don't make real AWS API calls

## Monitoring and Observability

### Test Metrics
- **Coverage Reports**: Statement, branch, function, line coverage
- **Performance Metrics**: Test execution time, memory usage
- **Quality Metrics**: Test reliability, flakiness detection

### CI/CD Integration
- **Failure Alerting**: Immediate notification on test failures
- **Trend Analysis**: Coverage and performance trends over time
- **Regression Detection**: Automated detection of performance regressions

## Documentation Updates

### Developer Documentation
- **File**: `docs/development/testing-guide.md`
- **Content**: Updated testing patterns, best practices
- **Examples**: Code samples for CLI and Lambda testing

### API Documentation
- **File**: `docs/api/testing-utilities.md`
- **Content**: Test utility API reference
- **Usage**: Integration examples for new tests

## Migration Strategy

### Backward Compatibility
- **Phase 1**: Run both old and new tests in parallel
- **Phase 2**: Gradually migrate tests to new patterns
- **Phase 3**: Remove old fixture injection approach

### Rollback Plan
- **Git Strategy**: Feature branch with incremental commits
- **Testing**: Comprehensive validation at each step
- **Rollback**: Immediate revert capability if issues arise

## Success Metrics

### Quantitative Metrics
- Test coverage: Maintain >90% statement coverage
- Test execution time: <5 seconds for full suite
- Test reliability: <1% flaky test rate
- Lambda handler coverage: >95% statement coverage

### Qualitative Metrics
- Developer confidence in test results
- Ease of adding new tests
- Maintainability of test codebase
- Clarity of test failure messages

## Conclusion

This refactor addresses fundamental issues in the current testing strategy while establishing robust Lambda handler testing. The approach prioritizes real application behavior validation over fixture injection, creating a more reliable and maintainable test suite that supports both CLI and serverless execution contexts.

The incremental implementation plan minimizes risk while ensuring comprehensive coverage of both existing and new functionality. Success will be measured through improved test reliability, maintainability, and developer confidence in the test results.
