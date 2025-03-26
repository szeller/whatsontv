# Config System Refactoring Plan

## Overview

This document outlines the plan for refactoring the configuration system to improve organization, testability, and maintainability. The current configuration system has several issues:

1. Confusing naming (both the type and interface are called `Config`)
2. Root-level `config.ts` file that's hard to mock in tests
3. Mixing of concerns (loading config and defining structure)
4. CLI tests failing because they can't properly mock the configuration

## Refactoring Goals

- Separate data structures from service interfaces
- Use clearer naming to avoid confusion
- Move config loading to the implementation where it belongs
- Make testing easier by allowing proper mocking
- Fix CLI tests by providing better control over configuration

## Structure Mapping

### Old Structure to New Structure

* **src/config.ts** (Old)
  * Removed in new structure
  * Config loading functionality moved to implementation class
  * No more root-level config file

* **src/types/config.ts** (Old)
  * Becomes **src/types/configTypes.ts** (New)
  * Contains data structures: AppConfig, SlackConfig, CliOptions

* **Config type** (Old)
  * Becomes **AppConfig type** (New)
  * Same structure, just renamed for clarity

* **src/interfaces/config.ts** (Old)
  * Becomes **src/interfaces/configService.ts** (New)
  * Defines service interface methods

* **Config interface** (Old)
  * Becomes **ConfigService interface** (New)
  * Name clarifies it's a service interface

* **src/implementations/console/consoleConfigImpl.ts** (Old)
  * Becomes **src/implementations/console/consoleConfigServiceImpl.ts** (New)
  * Implements ConfigService interface
  * Handles loading config from file (moved from src/config.ts)

* **src/implementations/test/testConfigImpl.ts** (Old)
  * Becomes **src/implementations/test/testConfigServiceImpl.ts** (New)
  * Implements ConfigService interface
  * Provides controlled config values for testing

## Implementation Steps

1. Create new type definitions in `src/types/configTypes.ts`
2. Create new service interface in `src/interfaces/configService.ts`
3. Implement console config service in `src/implementations/console/consoleConfigServiceImpl.ts`
4. Implement test config service in `src/implementations/test/testConfigServiceImpl.ts`
5. Update container.ts to register the new services
6. Update imports in all files referencing the old config system
7. Remove the old config.ts file
8. Update tests to use the new config system

## Benefits

- Clearer separation of concerns
- Better testability through proper mocking
- Consistent naming conventions
- Follows clean architecture principles with interfaces and implementations
- Fixes CLI test issues by providing better control over configuration

## Related Issues

This refactoring addresses issues with CLI tests that were failing due to the inability to properly mock the configuration system.
