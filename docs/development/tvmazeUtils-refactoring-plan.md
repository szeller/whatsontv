# TVMaze Utils Refactoring Plan

## Overview

This document outlines the plan for implementing GitHub issue #64, which involves moving utility functions from `tvmazeModel.ts` to `tvMazeUtils.ts` without changing their implementations.

## Background

Currently, the `tvmazeModel.ts` file contains both type definitions and utility functions. According to the project's architecture standards for separation of concerns, utility functions should be moved to a dedicated utility file. The following functions need to be moved:

1. `isWebScheduleItem`
2. `transformScheduleItem`
3. `transformSchedule`

## Implementation Plan

### Phase 1: Preparation and Analysis

1. **Identify dependencies**:
   - Examine the functions to be moved and identify any dependencies they have
   - Note any imports that need to be added to `tvMazeUtils.ts`
   - Identify files that import these functions from `tvmazeModel.ts`

2. **Create test baseline**:
   - Run the existing test suite to ensure all tests are passing before making changes
   - Note any test coverage for the functions being moved

### Phase 2: Code Migration

1. **Move functions to `tvMazeUtils.ts`**:
   - Copy the functions exactly as they are from `tvmazeModel.ts` to `tvMazeUtils.ts`
   - Add any necessary imports to `tvMazeUtils.ts`
   - Ensure JSDoc comments are preserved
   - Do not modify the function implementations in any way

2. **Update imports in `tvMazeUtils.ts`**:
   - Add any necessary imports from `tvmazeModel.ts` for type definitions
   - Ensure all dependencies are properly imported

3. **Remove functions from `tvmazeModel.ts`**:
   - Remove the functions from `tvmazeModel.ts` after they have been successfully moved
   - Do not remove any type definitions or schemas that the functions depend on

### Phase 3: Update References

1. **Identify and update imports across the codebase**:
   - Update all files that import these functions to import from `tvMazeUtils.ts` instead of `tvmazeModel.ts`
   - Ensure that any files that need both types from `tvmazeModel.ts` and functions from `tvMazeUtils.ts` have both imports

### Phase 4: Testing and Validation

1. **Run tests**:
   - Run the test suite to ensure all tests still pass
   - Fix any issues that arise without changing the function implementations

2. **Verify functionality**:
   - Ensure the behavior of the application remains unchanged
   - Verify that the functions work exactly as they did before

### Phase 5: Finalization

1. **Code review**:
   - Ensure all changes adhere to the project's code style guidelines
   - Verify that no implementation details were changed

2. **Documentation**:
   - Update any documentation that references these functions

## Files to Modify

1. **Primary files**:
   - `/Users/szeller/dev/whatsontv/src/types/tvmazeModel.ts` - Remove functions
   - `/Users/szeller/dev/whatsontv/src/utils/tvMazeUtils.ts` - Add functions

2. **Files that import these functions**:
   - Any file that imports these functions from `tvmazeModel.ts` will need to be updated

## Risks and Mitigations

- **Risk**: Breaking changes due to missing imports
  - **Mitigation**: Carefully analyze all dependencies and ensure they are properly imported

- **Risk**: Test failures due to changed import paths
  - **Mitigation**: Update all import paths in test files and verify tests pass

- **Risk**: Subtle behavior changes
  - **Mitigation**: Do not modify function implementations in any way, only move them

## Success Criteria

- All functions are moved from `tvmazeModel.ts` to `tvMazeUtils.ts` without changing their implementations
- All imports across the codebase are updated to reference the new location
- All tests pass after the refactoring
- The behavior of the application remains unchanged

## Timeline

This refactoring should be completed in a single focused effort to minimize the risk of partial implementation causing issues.
