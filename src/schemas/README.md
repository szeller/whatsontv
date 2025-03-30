# Schema System Documentation

## Overview

This directory contains the Zod schemas used throughout the WhatsOnTV application for both type safety and runtime validation. The schema system provides a single source of truth for data structures, ensuring consistency between validation and types.

## Schema Files

### `common.ts`

Contains common utility schemas and transformers that are reused across the application:

- Utility transformers for handling mixed types
- Reusable validation patterns
- Common data formats (dates, nullable strings, etc.)

### `domain.ts`

Contains schemas for the internal domain model, independent of any particular API:

- `showSchema` - Core TV show schema with all required properties
- `Show` type - TypeScript type inferred from the show schema
- `NetworkGroups` type - Record structure for organizing shows by network

### `tvmaze.ts`

Contains schemas for TVMaze API responses and transformations:

- `networkSchema` - Schema for TV networks
- `baseShowSchema` - Base schema for show information
- `showDetailsSchema` - Extended schema for detailed show information
- `networkScheduleItemSchema` - Schema for items from the network schedule endpoint
- `webScheduleItemSchema` - Schema for items from the web schedule endpoint
- `scheduleItemSchema` - Union schema that handles both network and web schedule items
- `networkScheduleToShowSchema` - Transform schema that converts network schedule items to domain model
- `webScheduleToShowSchema` - Transform schema that converts web schedule items to domain model

## Usage Guidelines

### Validation and Transformation

Zod schemas are used for both validation and transformation. There are two main approaches:

#### 1. Using Utility Functions

```typescript
import { validateData, validateDataOrNull } from '../utils/validationUtils.js';
import { showSchema } from '../schemas/domain.js';

// Throws an error if validation fails
const validatedShow = validateData(showSchema, inputData);

// Returns null if validation fails
const maybeShow = validateDataOrNull(showSchema, inputData);
```

#### 2. Using Zod's Transform Capabilities (Preferred)

```typescript
import { networkScheduleToShowSchema } from '../schemas/tvmaze.js';

// Safe parsing with error handling
const result = networkScheduleToShowSchema.safeParse(inputData);
if (result.success) {
  // Use the transformed data
  const show = result.data;
} else {
  // Handle validation error
  console.error('Validation failed:', result.error);
}

// Direct parsing (throws on error)
try {
  const show = networkScheduleToShowSchema.parse(inputData);
  // Use the transformed data
} catch (error) {
  // Handle validation error
  console.error('Validation failed:', error);
}
```

### Type Inference

Leverage Zod's type inference to ensure type consistency:

```typescript
import { z } from 'zod';
import { showSchema } from '../schemas/domain.js';
import type { Show } from '../schemas/domain.js';

// The Show type is inferred from the schema
// type Show = z.infer<typeof showSchema>;

// Use the type in function signatures
function processShow(show: Show): void {
  // ...
}
```

### Schema Extension

When extending schemas, use Zod's composition features:

```typescript
import { z } from 'zod';
import { showSchema } from '../schemas/domain.js';

// Extend an existing schema
const extendedShowSchema = showSchema.extend({
  additionalField: z.string()
});
```

## Best Practices

1. **Single Source of Truth**: Define schemas once and reuse them
2. **Validation at Boundaries**: Always validate external data
3. **Declarative Transformations**: Use Zod's transform capabilities for data conversions
4. **Null Handling**: Always handle null and undefined values explicitly in schemas
5. **Default Values**: Provide sensible defaults for optional fields
6. **Error Handling**: Use try/catch blocks with schema validation
7. **Performance**: Consider caching validation results for frequently used data
8. **Testing**: Test both valid and invalid data scenarios

## Implementation Notes

### Transformation Schemas

The transformation schemas in `tvmaze.ts` follow these principles:

1. **Defensive Programming**: All transformations handle null/undefined values gracefully
2. **Type Safety**: Strong typing throughout the transformation pipeline
3. **Default Values**: Sensible defaults for missing or invalid data
4. **Centralized Logic**: Transformation logic is defined in the schema, not scattered in utility functions

Example of a transformation schema:

```typescript
export const networkScheduleToShowSchema = networkScheduleItemSchema.transform((item) => ({
  id: item.show.id ?? 0,
  name: item.show.name ?? 'Unknown Show',
  // Additional transformations...
}));
```

## Future Improvements

See [GitHub Issue #66](https://github.com/szeller/whatsontv/issues/66) for planned improvements to the schema system, including:

- Refactoring type transformations to use Zod's transform capabilities
- Eliminating manual type conversions
- Adding schema validation for configuration types
