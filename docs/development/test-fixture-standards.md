# Test Fixture Standards

This document outlines the standardized approach to test fixtures in the WhatsOnTV project, ensuring consistency, maintainability, and readability across all test files.

## Fixture Creation Approaches

The WhatsOnTV project uses two primary approaches for creating test fixtures:

1. **JSON Fixtures**: Static data stored in JSON files for consistent test scenarios
2. **Builder Pattern**: Dynamic creation of test objects using builder classes

## When to Use Each Approach

### JSON Fixtures

Use JSON fixtures when:

- You need consistent, reusable test data across multiple test files
- The test data represents real-world examples (e.g., API responses)
- The data structure is complex and would be verbose to create programmatically
- You want to simulate specific edge cases consistently

JSON fixtures are located in `src/tests/fixtures/domain/` and can be loaded using the `Fixtures` helper.

### Builder Pattern

Use the builder pattern (e.g., `ShowBuilder`) when:

- You need to create variations of objects with specific properties
- You need to create objects dynamically during test execution
- You need to create multiple similar objects with slight variations
- You want to improve test readability by focusing on the properties relevant to the test

## Using ShowBuilder

The `ShowBuilder` class provides a fluent interface for creating `Show` objects:

```typescript
import { ShowBuilder } from '../fixtures/helpers/showFixtureBuilder.js';

// Create a basic show
const basicShow = new ShowBuilder()
  .withId(1)
  .withName('Test Show')
  .withNetwork('Test Network')
  .build();

// Create a show with an episode
const episodeShow = new ShowBuilder()
  .withId(2)
  .withName('Episode Show')
  .withEpisode(1, 5) // Season 1, Episode 5
  .build();
```

## Best Practices

1. **Use Helper Functions**: Create helper functions for common test data patterns to avoid duplication:

   ```typescript
   function createTestEpisode(season: number, number: number): Show {
     return new ShowBuilder()
       .withId(1)
       .withName('Test Show')
       .withEpisode(season, number)
       .build();
   }
   ```

2. **Minimal Test Data**: Only set the properties that are relevant to your test:

   ```typescript
   // Good - only sets properties needed for the test
   const show = new ShowBuilder()
     .withNetwork('CBS')
     .build();

   // Avoid - sets unnecessary properties
   const show = new ShowBuilder()
     .withId(1)
     .withName('Test Show')
     .withNetwork('CBS')
     .withLanguage('English')
     .withType('Scripted')
     .withGenres(['Drama'])
     .withSummary('Test summary')
     .withAirtime('20:00')
     .withEpisode(1, 1)
     .build();
   ```

3. **Consistent Naming**: Use consistent naming conventions for test data:

   ```typescript
   // Descriptive names that indicate the purpose
   const showWithNoAirtime = new ShowBuilder().withAirtime(null).build();
   const englishShow = new ShowBuilder().withLanguage('English').build();
   ```

4. **Array Creation Helpers**: Use the helper functions in `showFixtureHelpers.ts` for creating arrays of shows:

   ```typescript
   import { createShowArrayWithSequentialIds } from '../fixtures/helpers/showFixtureHelpers.js';

   // Create 5 shows with IDs 1-5
   const shows = createShowArrayWithSequentialIds(5);
   ```

## Dependency Injection in Tests

When testing components that have dependencies, ensure proper dependency injection:

```typescript
// Reset container for each test
container.clearInstances();

// Register mock dependencies
const mockTvShowService = createMockTvShowService();
container.registerInstance('TvShowService', mockTvShowService);

// Register real implementations when needed
container.registerInstance<StyleService>('StyleService', new ChalkStyleServiceImpl());

// Resolve the component under test
const component = container.resolve(ComponentUnderTest);
```

## Migration Strategy

As part of our ongoing refactoring efforts, we are gradually migrating all tests to use the ShowBuilder pattern where appropriate. When refactoring existing tests:

1. Identify direct object creation (`{ id: 1, name: '...' }`)
2. Replace with equivalent ShowBuilder calls
3. Extract common patterns into helper functions
4. Ensure tests remain readable and focused on their intent

By following these standards, we ensure our tests remain maintainable, readable, and consistent as the project evolves.
