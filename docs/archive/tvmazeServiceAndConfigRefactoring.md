# TVMaze Service and Config Refactoring Plan

## Overview

This document outlines a comprehensive refactoring plan for the TVMaze service implementation and configuration system. The goal is to improve code organization, reduce duplication, enhance testability, and create a more coherent type system throughout the application.

## Objectives

1. Reduce code duplication in `tvMazeServiceImpl.ts`
2. Create a proper abstraction for configuration management
3. Unify types between CLI arguments and service options
4. Improve testability by isolating tests from external configuration
5. Simplify the `TvShowService` interface

## Implementation Plan

### Phase 1: Create New Types and Interfaces

- [x] Create `ShowOptions` type
- [x] Update `TvShowService` interface
- [x] Create `Config` interface
- [x] Create `tvMazeUtils.ts` module

### Phase 2: Implement Core Refactorings

- [ ] Refactor `TvMazeServiceImpl` to use the new utility functions
- [ ] Implement `ConsoleConfigImpl` and `TestConfigImpl`
- [ ] Update container registrations

### Phase 3: Update CLI and Tests

- [ ] Update CLI entry point to use the new Config interface
- [ ] Update test runner to use TestConfigImpl
- [ ] Fix integration tests to use the new approach

### Phase 4: Cleanup and Documentation

- [ ] Remove deprecated code and functions
- [ ] Update documentation
- [ ] Add JSDoc comments to all new functions and classes

## Detailed Changes

### 1. New Types and Interfaces

#### `ShowOptions` Type

```typescript
// src/types/tvShowOptions.ts
export interface ShowOptions {
  date?: string;
  country?: string;
  types?: string[];
  networks?: string[];
  genres?: string[];
  languages?: string[];
  webOnly?: boolean;
  showAll?: boolean;
}
```

#### Updated `TvShowService` Interface

```typescript
// src/interfaces/tvShowService.ts
export interface TvShowService {
  fetchShows(options: ShowOptions): Promise<Show[]>;
}
```

#### `Config` Interface

```typescript
// src/interfaces/config.ts
export interface Config {
  getShowOptions(): ShowOptions;
  getShowOption<K extends keyof ShowOptions>(key: K): ShowOptions[K];
  getCliOptions(): {
    debug: boolean;
    timeSort: boolean;
    slack: boolean;
    help: boolean;
    version: boolean;
    limit: number;
  };
  isFeatureEnabled(flag: 'debug' | 'timeSort' | 'slack'): boolean;
}
```

### 2. New Utility Functions

#### `tvMazeUtils.ts`

- `getNetworkScheduleUrl(date: string, country?: string): string`
- `getWebScheduleUrl(date: string): string`
- `isStreamingItem(item: unknown): boolean`

### 3. Implementation Classes

#### `TvMazeServiceImpl`

- Refactor to use utility functions
- Simplify transformation logic
- Improve error handling and logging

#### `ConsoleConfigImpl`

- Combine CLI args and config file
- Implement Config interface
- Provide clear precedence rules

#### `TestConfigImpl`

- Implement Config interface for testing
- Allow direct control of configuration values
- Isolate tests from external configuration

## Testing Strategy

1. Skip CLI integration tests initially
2. Ensure all unit tests pass with the new implementation
3. Update CLI tests to use the new approach
4. Add tests for new components (Config implementations, utils)

## Migration Strategy

1. Implement new interfaces and types
2. Create new implementations alongside existing code
3. Update core components to use new implementations
4. Update tests to use new approach
5. Remove deprecated code

## Success Criteria

- All tests pass
- No code duplication in TVMaze service
- Clear separation between configuration sources and application logic
- Improved testability of CLI components
- Consistent type system throughout the application

## References

- [Clean Architecture Principles](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [TypeScript Interface Segregation](https://www.typescriptlang.org/docs/handbook/interfaces.html)
- [Dependency Injection in TypeScript](https://www.typescriptlang.org/docs/handbook/declaration-files/dts-from-js.html)
