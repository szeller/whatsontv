# Zod Improvement Plan for WhatsOnTV

## Overview

This document outlines the implementation plan for issue #56: "Refactor: improve Zod usage for better validation and type safety". The goal is to enhance the application's type safety by leveraging Zod's validation capabilities more effectively, particularly for API responses and data transformations.

## Current State Analysis

### Strengths

1. Zod schemas are already defined for TVMaze API responses in `tvMazeModel.ts`
2. Type inference is used to generate TypeScript types from Zod schemas
3. Basic validation is implemented in test files using `safeParse`

### Areas for Improvement

1. **Limited Runtime Validation**: The application primarily relies on TypeScript's static type checking rather than runtime validation
2. **Manual Type Casting**: The `transformScheduleItem` function uses type assertions (`as Record<string, unknown>`) instead of schema validation
3. **Complex Parsing Logic**: Manual parsing of fields like `season` and `number` instead of using Zod transformers
4. **No Centralized Schema Organization**: Schemas are defined alongside interfaces rather than in a dedicated location
5. **Inconsistent Error Handling**: No standardized approach for handling validation failures
6. **No Schema Reuse**: Duplicate validation logic across the codebase

## Implementation Plan

### 1. Create a Simplified Schema Structure

Start with a flatter, more maintainable directory structure:

```
src/
  schemas/
    common.ts       # Common utility schemas and transformers
    tvmaze.ts       # TVMaze API schemas
    domain.ts       # Internal domain model schemas
```

This simpler structure reduces cognitive load while still providing organization.

### 2. Refactor Common Schema Utilities

Move and enhance the existing utility schemas:

```typescript
// src/schemas/common.ts
import { z } from 'zod';

/**
 * Converts mixed input (string, number, null, undefined) to a number
 * with proper error handling and validation
 */
export const numberFromMixed = z.union([
  z.number(),
  z.string().transform((val, ctx) => {
    const parsed = parseInt(val, 10);
    if (isNaN(parsed)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `Could not parse "${val}" as a number`
      });
      return z.NEVER;
    }
    return parsed;
  }),
  z.null().transform(() => 0),
  z.undefined().transform(() => 0)
]);

/**
 * Handles nullable string values with proper transformation
 */
export const nullableString = z.union([
  z.string(),
  z.null(),
  z.undefined().transform(() => null)
]);

/**
 * Date string in YYYY-MM-DD format with validation
 */
export const dateString = z.string().regex(
  /^\d{4}-\d{2}-\d{2}$/,
  'Invalid date format. Expected YYYY-MM-DD'
);
```

### 3. Implement Validation Utilities

Create simple, reusable validation utilities:

```typescript
// src/utils/validationUtils.ts
import { z } from 'zod';

/**
 * Safely parses data with a Zod schema and handles errors consistently
 * 
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @param errorMessage Custom error message
 * @returns Validated and typed data
 * @throws Error with formatted validation issues if validation fails
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown,
  errorMessage = 'Validation error'
): z.infer<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // Format error for logging
    console.error('Validation error:', result.error.format());
    
    // Throw error with details
    throw new Error(`${errorMessage}: ${result.error.message}`);
  }
  
  return result.data;
}

/**
 * Attempts to validate data but returns null instead of throwing
 * 
 * @param schema Zod schema to validate against
 * @param data Data to validate
 * @returns Validated data or null if validation fails
 */
export function validateDataOrNull<T extends z.ZodType>(
  schema: T,
  data: unknown
): z.infer<T> | null {
  try {
    return validateData(schema, data, 'Validation error');
  } catch (error) {
    return null;
  }
}
```

### 4. Migrate TVMaze API Schemas

Move the schemas from `tvMazeModel.ts` to the new structure:

```typescript
// src/schemas/tvmaze.ts
import { z } from 'zod';
import { numberFromMixed, nullableString } from './common.js';

// Network schema
export const networkSchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.object({
    name: z.string(),
    code: z.string(),
    timezone: z.string()
  }).nullable()
});

// Base show schema
export const baseShowSchema = z.object({
  id: z.number().optional(),
  url: z.string().optional(),
  name: z.string().optional(),
  type: z.string().optional(),
  language: nullableString.optional(),
  genres: z.array(z.string()).optional().default([]),
  status: z.string().optional(),
  runtime: z.number().nullable().optional(),
  premiered: z.string().optional(),
  ended: z.string().nullable().optional(),
  officialSite: z.string().nullable().optional(),
  schedule: z.object({
    time: z.string().optional(),
    days: z.array(z.string()).optional()
  }).optional(),
  rating: z.object({
    average: z.number().nullable().optional()
  }).optional(),
  weight: z.number().optional(),
  summary: z.string().nullable().optional(),
  updated: z.number().optional()
});

// Show details schema
export const showDetailsSchema = baseShowSchema.extend({
  network: networkSchema.nullable().optional(),
  webChannel: networkSchema.nullable().optional()
});

// Network schedule item schema
export const networkScheduleItemSchema = z.object({
  id: z.number(),
  url: z.string().optional(),
  name: z.string().optional(),
  season: numberFromMixed.optional(),
  number: numberFromMixed.optional(),
  type: z.string().optional(),
  airdate: z.string().optional(),
  airtime: nullableString.default(''),
  airstamp: z.string().optional(),
  runtime: z.number().nullable().optional(),
  rating: z.object({
    average: z.number().nullable().optional()
  }).optional(),
  summary: z.string().nullable().optional(),
  show: showDetailsSchema
});

// Web schedule item schema
export const webScheduleItemSchema = networkScheduleItemSchema.extend({
  show: z.undefined().optional(),
  _embedded: z.object({
    show: showDetailsSchema
  })
});

// Combined schedule item schema
export const scheduleItemSchema = z.union([
  networkScheduleItemSchema,
  webScheduleItemSchema
]);

// Export type aliases for all schemas
export type NetworkScheduleItem = z.infer<typeof networkScheduleItemSchema>;
export type WebScheduleItem = z.infer<typeof webScheduleItemSchema>;
export type ShowDetails = z.infer<typeof showDetailsSchema>;
export type Network = z.infer<typeof networkSchema>;
export type ScheduleItem = z.infer<typeof scheduleItemSchema>;

// Export interfaces for TVMaze API types that don't have schemas yet
export interface TvMazeShow {
  id: number;
  url: string;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  status: string;
  runtime: number | null;
  averageRuntime: number | null;
  premiered: string | null;
  ended: string | null;
  officialSite: string | null;
  schedule: {
    time: string;
    days: string[];
  };
  rating: { average: number | null };
  weight: number;
  network: Network | null;
  webChannel: Network | null;
  dvdCountry: unknown | null;
  externals: {
    tvrage: number | null;
    thetvdb: number | null;
    imdb: string | null;
  };
  image: {
    medium: string;
    original: string;
  } | null;
  summary: string | null;
  updated: number;
  _links: {
    self: { href: string };
    previousepisode?: { href: string };
    nextepisode?: { href: string };
  };
}

export interface TvMazeScheduleItem {
  id: number;
  url: string;
  name: string;
  season: number | string;
  number: number | string;
  type: string;
  airdate: string;
  airtime: string | null;
  airstamp: string;
  runtime: number | null;
  rating: { average: number | null };
  image: unknown | null;
  summary: string | null;
  show?: TvMazeShow;
  _embedded?: { show: TvMazeShow };
}

export interface TvMazeSearchResult {
  score: number;
  show: TvMazeShow;
}
```

### 5. Migrate Domain Model Schemas

Move the domain model from `tvShowModel.ts` to the new structure:

```typescript
// src/schemas/domain.ts
import { z } from 'zod';

export const showSchema = z.object({
  id: z.number(),
  name: z.string(),
  type: z.string(),
  language: z.string().nullable(),
  genres: z.array(z.string()),
  network: z.string(),
  summary: z.string().nullable(),
  airtime: z.string().nullable(),
  season: z.number(),
  number: z.number()
});

export type Show = z.infer<typeof showSchema>;

export type NetworkGroups = Record<string, Show[]>;
```

### 6. Update Import References

Update all files that import from the old model files to reference the new schema files:

```typescript
// Before
import { NetworkScheduleItem, TvMazeShow } from '../types/tvMazeModel.js';
import { Show, NetworkGroups } from '../types/tvShowModel.js';

// After
import { NetworkScheduleItem, TvMazeShow } from '../schemas/tvmaze.js';
import { Show, NetworkGroups } from '../schemas/domain.js';
```

### 7. Refactor the TVMaze Utilities

Update the transformation functions to use Zod validation:

```typescript
// src/utils/tvMazeUtils.ts
import { validateDataOrNull } from './validationUtils.js';
import { networkScheduleItemSchema, webScheduleItemSchema } from '../schemas/tvmaze.js';
import type { Show } from '../schemas/domain.js';

/**
 * Transform a single TVMaze schedule item to our domain model
 * 
 * @param item TVMaze schedule item (either network or streaming format)
 * @returns Show object or null if transformation fails
 */
export function transformScheduleItem(item: unknown): Show | null {
  try {
    // Try to parse as a network schedule item
    const networkItem = validateDataOrNull(networkScheduleItemSchema, item);
    if (networkItem) {
      return {
        id: networkItem.id,
        name: networkItem.show.name ?? 'Unknown Show',
        type: networkItem.show.type ?? 'unknown',
        language: networkItem.show.language ?? null,
        genres: networkItem.show.genres ?? [],
        network: formatNetworkName(networkItem.show),
        summary: networkItem.show.summary ?? null,
        airtime: networkItem.airtime ?? null,
        season: networkItem.season ?? 0,
        number: networkItem.number ?? 0
      };
    }
    
    // If not a network item, try as a web schedule item
    const webItem = validateDataOrNull(webScheduleItemSchema, item);
    if (webItem && webItem._embedded?.show) {
      return {
        id: webItem._embedded.show.id ?? 0,
        name: webItem._embedded.show.name ?? 'Unknown Show',
        type: webItem._embedded.show.type ?? 'unknown',
        language: webItem._embedded.show.language ?? null,
        genres: webItem._embedded.show.genres ?? [],
        network: formatNetworkName(webItem._embedded.show),
        summary: webItem._embedded.show.summary ?? null,
        airtime: webItem.airtime ?? null,
        season: webItem.season ?? 0,
        number: webItem.number ?? 0
      };
    }
    
    return null;
  } catch (error) {
    console.error('Error transforming schedule item:', error);
    return null;
  }
}

/**
 * Helper function to format network name
 */
function formatNetworkName(show: any): string {
  let networkName = 'Unknown Network';
  
  if (show.network) {
    networkName = show.network.name;
    if (show.network.country?.code) {
      networkName += ` (${show.network.country.code})`;
    }
  } else if (show.webChannel) {
    networkName = show.webChannel.name;
  }
  
  return networkName;
}
```

### 8. Update HTTP Client to Use Schema Validation

Enhance the HTTP client to validate responses:

```typescript
// src/implementations/gotHttpClientImpl.ts
import { validateData } from '../utils/validationUtils.js';

// Inside the request method
async request<T>(url: string, options?: RequestOptions, schema?: z.ZodType): Promise<T> {
  try {
    const response = await got(url, this.buildOptions(options));
    const data = JSON.parse(response.body);
    
    // If a schema is provided, validate the response
    if (schema) {
      return validateData(schema, data, `Invalid response from ${url}`);
    }
    
    return data as T;
  } catch (error) {
    // Error handling...
  }
}
```

### 9. Remove Original Model Files

After all references have been updated, remove the original model files:

- Delete `src/types/tvMazeModel.ts`
- Delete `src/types/tvShowModel.ts`

## Implementation Phases

### Phase 1: Schema Structure and Utilities (1 day)
- Create the schema directory structure
- Implement the common schema utilities
- Create validation utility functions
- Add unit tests for the utilities

### Phase 2: Schema Migration (1-2 days)
- Create the new schema files (`tvmaze.ts` and `domain.ts`)
- Move all schemas and types from the original model files
- Ensure all types and interfaces are properly exported
- Add tests for the schemas

### Phase 3: Import Reference Updates (1-2 days)
- Identify all files that import from the original model files
- Update import statements to reference the new schema files
- Run tests to ensure everything still works
- Fix any type errors that arise

### Phase 4: Transformation Functions (1-2 days)
- Refactor the TVMaze utility functions to use Zod validation
- Update the HTTP client to support schema validation
- Add tests for the new validation behavior
- Ensure all existing tests pass

### Phase 5: Cleanup (1 day)
- Remove the original model files
- Run final tests to ensure everything works
- Update documentation
- Create a pull request with the changes

## Testing Strategy

1. **Unit Tests for Schemas**:
   - Test validation of valid inputs
   - Test rejection of invalid inputs
   - Test transformations and default values

2. **Unit Tests for Transformers**:
   - Test transformation of network schedule items
   - Test transformation of web schedule items
   - Test handling of edge cases and invalid data

3. **Integration Tests**:
   - Test end-to-end flow with mock API responses
   - Verify error handling behavior

## Validation Strategy

### When to Validate
- **API Boundaries**: Validate all incoming API responses
- **User Input**: Validate user-provided data
- **Critical Business Logic**: Validate inputs to critical functions

### When to Skip Validation
- **Already Validated Data**: Avoid redundant validation
- **Internal Transformations**: When type safety is guaranteed

## Error Handling Strategy

- **Developer Errors**: Log detailed validation issues
- **Graceful Fallbacks**: Provide sensible defaults when validation fails

## Acceptance Criteria

- All existing tests pass
- Code coverage remains at or above current levels
- Linting passes without errors
- TypeScript compilation succeeds without errors
- Manual testing confirms correct behavior
- Original model files are completely removed
- All imports reference the new schema files directly

## Benefits

- **Stronger Type Safety**: Runtime validation ensures data matches expected types
- **Better Error Handling**: Structured error messages for validation failures
- **Reduced Boilerplate**: Centralized validation logic reduces code duplication
- **Improved Maintainability**: Clear separation of concerns between validation and business logic
- **Enhanced Developer Experience**: Better IDE support and clearer error messages
- **Cleaner Project Structure**: No redundant files or circular dependencies
- **Preparation for Future Interfaces**: Better organization supports the planned addition of interfaces beyond the console (e.g., Slack, web interface) as noted in issue #63

## Fixture Validation

### 10. Implement Fixture Validation

To ensure test fixtures conform to our schemas, we'll enhance our validation utilities and fixture helpers:

```typescript
// src/utils/validationUtils.ts (additions)
/**
 * Validates data against a schema and returns the validated data
 * Throws an error if validation fails
 * 
 * @param schema The Zod schema to validate against
 * @param data The data to validate
 * @param errorMessage Optional custom error message
 * @param includeDetails Whether to include detailed validation errors in the message
 * @returns The validated data with proper type inference
 */
export function validateData<T extends z.ZodType>(
  schema: T,
  data: unknown,
  errorMessage = 'Validation error',
  includeDetails = false
): z.infer<T> {
  const result = schema.safeParse(data);
  
  if (!result.success) {
    // Only log errors in development environments and not in tests
    if (process.env.NODE_ENV !== 'production' && !isTestEnvironment()) {
      console.error('Validation error:', result.error);
    }
    
    if (includeDetails) {
      const formattedError = JSON.stringify(result.error.format(), null, 2);
      throw new Error(`${errorMessage}\n${formattedError}`);
    } else {
      throw new Error(errorMessage);
    }
  }
  
  return result.data;
}

/**
 * Validates an array of data against a schema for each item
 * @param schema Schema for array items
 * @param data Array data to validate
 * @param errorMessage Optional custom error message
 * @param includeDetails Whether to include detailed validation errors in the message
 * @returns Validated array with proper typing
 */
export function validateArray<T extends z.ZodType>(
  schema: T,
  data: unknown[],
  errorMessage = 'Array validation error',
  includeDetails = false
): z.infer<T>[] {
  const arraySchema = z.array(schema);
  return validateData(arraySchema, data, errorMessage, includeDetails);
}
```

```typescript
// src/tests/helpers/fixtureHelper.ts (additions)
import { validateData, validateArray } from '../../utils/validationUtils.js';
import type { z } from 'zod';

/**
 * Load and validate a fixture file against a schema
 * @param schema Zod schema to validate against
 * @param relativePath Path to the fixture file, relative to the fixtures directory
 * @param includeDetails Whether to include detailed validation errors in the message
 * @returns The validated fixture data with proper typing
 * @throws Error if validation fails
 */
export function loadValidatedFixture<T extends z.ZodType>(
  schema: T,
  relativePath: string,
  includeDetails = true
): z.infer<T> {
  const fileContent = loadFixtureString(relativePath);
  const data = JSON.parse(fileContent);
  return validateData(
    schema, 
    data, 
    `Fixture validation failed for ${relativePath}`,
    includeDetails
  );
}

/**
 * Load and validate an array fixture against a schema
 * @param schema Schema for array items
 * @param relativePath Path to the fixture file
 * @param includeDetails Whether to include detailed validation errors in the message
 * @returns Validated array with proper typing
 */
export function loadValidatedArrayFixture<T extends z.ZodType>(
  schema: T,
  relativePath: string,
  includeDetails = true
): z.infer<T>[] {
  const fileContent = loadFixtureString(relativePath);
  const data = JSON.parse(fileContent);
  
  if (!Array.isArray(data)) {
    throw new Error(`Expected array data in fixture ${relativePath}, but got ${typeof data}`);
  }
  
  return validateArray(
    schema, 
    data, 
    `Array fixture validation failed for ${relativePath}`,
    includeDetails
  );
}
```

Update the `Fixtures` class to use validated loading:

```typescript
// src/tests/helpers/fixtureHelper.ts (Fixtures class update)
export class Fixtures {
  static tvMaze = {
    /**
     * Get schedule fixture data as a parsed and validated JSON object
     * @param name Base name of the fixture file (without .json extension)
     * @returns Parsed and validated JSON data from the fixture
     */
    getSchedule(
      name: 'network-schedule' | 'web-schedule' | 'combined-schedule'
    ): z.infer<typeof scheduleItemSchema>[] {
      const fixturePath = `tvmaze/${name}.json`;
      return loadValidatedArrayFixture(scheduleItemSchema, fixturePath);
    },
    
    // Update other methods similarly...
  }
}
```

Create dedicated fixture validation tests:

```typescript
// src/tests/fixtures/fixtures.test.ts
import { describe, it, expect } from '@jest/globals';
import { loadValidatedArrayFixture } from '../helpers/fixtureHelper.js';
import {
  networkScheduleItemSchema,
  webScheduleItemSchema,
  scheduleItemSchema
} from '../../schemas/tvmaze.js';

describe('Fixture Validation', () => {
  describe('TVMaze Fixtures', () => {
    it('should validate network schedule fixture against schema', () => {
      expect(() => {
        loadValidatedArrayFixture(networkScheduleItemSchema, 'tvmaze/network-schedule.json');
      }).not.toThrow();
    });
    
    it('should validate web schedule fixture against schema', () => {
      expect(() => {
        loadValidatedArrayFixture(webScheduleItemSchema, 'tvmaze/web-schedule.json');
      }).not.toThrow();
    });
    
    it('should validate combined schedule fixture against schema', () => {
      expect(() => {
        loadValidatedArrayFixture(scheduleItemSchema, 'tvmaze/combined-schedule.json');
      }).not.toThrow();
    });
  });
});
```

## Implementation Phases

### Phase 2a: Fixture Validation (1 day)
- Enhance validation utilities to support detailed error reporting
- Add fixture validation functions to fixtureHelper.ts
- Create tests to validate all fixture data against schemas
- Update the Fixtures class to use validated loading

## Testing Strategy

4. **Fixture Validation Tests**:
   - Verify all test fixtures conform to their schemas
   - Test handling of malformed fixture data
   - Ensure detailed error messages for invalid fixtures

## Benefits

- **Test Data Integrity**: Ensures test fixtures match expected schemas
- **Documentation as Code**: Fixture validation serves as living documentation of API contracts
- **Regression Prevention**: Prevents schema changes from silently breaking compatibility with test data
