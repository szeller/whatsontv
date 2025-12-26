# Type Organization

This document explains the type/interface/schema organization in the codebase.

## Directory Structure

### `src/types/` - Configuration & CLI Types
TypeScript type definitions for application configuration:
- `configTypes.ts` - AppConfig, SlackConfig, CliOptions
- `tvShowOptions.ts` - ShowOptions for filtering
- `cliArgs.ts` - CLI argument types

### `src/schemas/` - Zod Schemas & Domain Types
Runtime validation schemas and domain model types:
- `domain.ts` - Core domain types (Show, NetworkGroups)
- `tvmaze.ts` - TVMaze API response schemas with transformations
- `common.ts` - Shared schema utilities
- `http.ts` - HTTP request/response validation schemas

### `src/interfaces/` - Service Contracts
Abstract service interfaces for dependency injection:
- `httpClient.ts` - HTTP client contract + HttpResponse<T>, RequestOptions
- `configService.ts` - Configuration service contract
- `outputService.ts` - Output rendering contract
- `showFormatter.ts` - Show formatting contract
- `slackClient.ts` - Slack API contract + SlackMessagePayload, SlackBlock types

## Key Principles

1. **Interfaces define contracts** - Service interfaces in `interfaces/` define what implementations must provide

2. **Schemas validate at boundaries** - Zod schemas in `schemas/` validate external data (API responses)

3. **Types configure behavior** - Types in `types/` define configuration and options

4. **Domain types are canonical** - `schemas/domain.ts` exports the canonical `Show` type used throughout

## Import Guidelines

- Import service interfaces from `interfaces/`
- Import domain types (Show, NetworkGroups) from `schemas/domain.ts`
- Import config types from `types/configTypes.ts`
- Import validation schemas from `schemas/` for runtime validation
