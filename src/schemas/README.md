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

Contains schemas for TVMaze API responses:

- `networkSchema` - Schema for TV networks
- `baseShowSchema` - Base schema for show information
- `showDetailsSchema` - Extended schema for detailed show information
- `networkScheduleItemSchema` - Schema for items from the network schedule endpoint
- `webScheduleItemSchema` - Schema for items from the web schedule endpoint
- `scheduleItemSchema` - Union schema that handles both network and web schedule items

## Usage Guidelines

### Validation

Use the utility functions in `src/utils/validationUtils.ts` to validate data against schemas:

```typescript
import { validateData, validateDataOrNull } from '../utils/validationUtils.js';
import { showSchema } from '../schemas/domain.js';

// Throws an error if validation fails
const validatedShow = validateData(showSchema, inputData);

// Returns null if validation fails
const maybeShow = validateDataOrNull(showSchema, inputData);
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
3. **Error Handling**: Use try/catch blocks with schema validation
4. **Performance**: Consider caching validation results for frequently used data
5. **Testing**: Test both valid and invalid data scenarios

## Future Improvements

See [GitHub Issue #66](https://github.com/szeller/whatsontv/issues/66) for planned improvements to the schema system, including:

- Refactoring type transformations to use Zod's transform capabilities
- Eliminating manual type conversions
- Adding schema validation for configuration types
