# Test Fixtures

This directory contains test fixtures and fixture builders for the WhatsOnTV application. These fixtures are designed to provide standardized, reusable test data that aligns with the domain model.

## Overview

The fixture system follows these design principles:

1. **Separation of Concerns**: Fixtures are separated by domain area (Show, TVMaze, etc.)
2. **Builder Pattern**: Fluent builder APIs for constructing test objects
3. **Type Safety**: All fixtures are fully typed to catch errors at compile time
4. **Reusability**: Common test scenarios are encapsulated in utility methods
5. **Maintainability**: Centralized fixture creation to reduce duplication across tests

## Available Fixtures

### Show Fixtures

The `ShowFixtures` and `ShowBuilder` classes provide utilities for creating domain model `Show` objects for testing.

#### ShowBuilder

`ShowBuilder` is a fluent builder for creating individual `Show` objects with customized properties.

```typescript
// Create a show with fluent builder API
const show = new ShowBuilder()
  .withId(123)
  .withName('Breaking Bad')
  .withType('Scripted')
  .withGenres(['Drama', 'Crime'])
  .withNetwork('AMC')
  .withAirtime('21:00')
  .build();
```

#### ShowFixtures

`ShowFixtures` provides static methods for creating common show patterns and collections.

```typescript
// Create a collection of shows with different networks
const shows = ShowFixtures.createShowsWithNetworks(['ABC', 'NBC', 'CBS']);

// Create a collection of shows with different genres
const dramaShows = ShowFixtures.createShowsWithGenres(['Drama'], 3);

// Create a minimal valid show
const minimalShow = ShowFixtures.createMinimalShow();

// Create a standard test show with common properties
const testShow = ShowFixtures.createTestShow();
```

### Episode Fixtures

The `ShowBuilder` class also provides methods for creating episode sequences and ranges.

```typescript
// Create episodes with specific numbers in a season
const episodes = ShowBuilder.createEpisodeSequence(1, [1, 2, 3]);

// Create a consecutive range of episodes
const episodeRange = ShowBuilder.createEpisodeRange(1, 1, 5);

// Create episodes across multiple seasons
const multiSeasonEpisodes = ShowBuilder.createMultiSeasonEpisodes({
  1: [1, 2],
  2: [1, 2, 3]
});
```

### TVMaze Fixtures

The TVMaze fixtures provide builders for creating mock TVMaze API responses.

#### NetworkBuilder

`NetworkBuilder` creates network objects for TVMaze API responses.

```typescript
// Create a network with custom properties
const network = new NetworkBuilder()
  .withId(1)
  .withName('ABC')
  .withCountry({
    name: 'United States',
    code: 'US',
    timezone: 'America/New_York'
  })
  .build();

// Create a web channel (no country)
const webChannel = new NetworkBuilder()
  .withName('Netflix')
  .asWebChannel()
  .build();
```

#### TvMazeShowBuilder

`TvMazeShowBuilder` creates show objects in TVMaze API format.

```typescript
// Create a TVMaze show with custom properties
const tvMazeShow = new TvMazeShowBuilder()
  .withId(123)
  .withName('Breaking Bad')
  .withType('Scripted')
  .withGenres(['Drama', 'Crime'])
  .withNetwork(network)
  .build();

// Create a TVMaze show using static convenience method
const show = TvMazeShowBuilder.createShow({
  id: 123,
  name: 'Breaking Bad',
  type: 'Scripted'
});

// Create a network show
const networkShow = TvMazeShowBuilder.createNetworkShow({
  name: 'The Good Doctor'
});

// Create a web show
const webShow = TvMazeShowBuilder.createWebShow({
  name: 'Stranger Things'
});
```

#### TvMazeScheduleItemBuilder

`TvMazeScheduleItemBuilder` creates schedule items for TVMaze API responses.

```typescript
// Create a single network schedule item
const scheduleItem = TvMazeScheduleItemBuilder.createNetworkScheduleItem({
  id: 1,
  name: 'Pilot',
  season: 1,
  number: 1,
  airdate: '2023-01-01',
  airtime: '20:00',
  showId: 123,
  showName: 'Test Show'
});

// Create multiple network schedule items
const networkItems = TvMazeScheduleItemBuilder.createNetworkScheduleItems(3, {
  airdate: '2023-01-01'
});

// Create web schedule items
const webItems = TvMazeScheduleItemBuilder.createWebScheduleItems(2, {
  airdate: '2023-01-01'
});

// Create a mix of network and web schedule items
const mixedItems = TvMazeScheduleItemBuilder.createMixedScheduleItems(
  2, // network items
  2, // web items
  { airdate: '2023-01-01' }
);
```

## Best Practices

1. **Use Fixtures Instead of Direct Construction**
   - Always use fixture builders instead of directly constructing objects
   - This ensures consistent test data and makes tests more maintainable

2. **Customize Only What's Necessary**
   - Only specify the properties that are relevant to your test
   - Let the fixture builders provide sensible defaults for other properties

3. **Create Reusable Test Data Patterns**
   - If you find yourself creating the same test data pattern in multiple tests,
     consider adding a utility method to the appropriate fixture class

4. **Keep Test Intent Clear**
   - Use descriptive variable names for your fixtures
   - Add comments explaining the purpose of complex test data setups

5. **Avoid Magic Values**
   - Use constants or enums for common values
   - Document the significance of specific test values

## Extending the Fixture System

When adding new fixture types or enhancing existing ones:

1. Follow the established patterns (builder classes, static utility methods)
2. Ensure new fixtures are fully typed
3. Add comprehensive documentation
4. Include examples in this README
5. Write tests for the fixture builders themselves

## Examples

### Testing Show Filtering

```typescript
it('should filter shows by type', () => {
  // Create test shows with different types
  const shows = [
    ShowFixtures.createTestShow({ type: 'Scripted' }),
    ShowFixtures.createTestShow({ type: 'Reality' }),
    ShowFixtures.createTestShow({ type: 'Scripted' })
  ];
  
  // Filter the shows
  const filteredShows = filterShowsByType(shows, ['Scripted']);
  
  // Verify the result
  expect(filteredShows.length).toBe(2);
  expect(filteredShows.every(show => show.type === 'Scripted')).toBe(true);
});
```

### Testing TVMaze Service

```typescript
it('fetches shows for today', async () => {
  // Create test fixture data using the builder
  const todayDate = getTodayDate();
  const scheduleItems = TvMazeScheduleItemBuilder.createNetworkScheduleItems(
    2,
    { airdate: todayDate }
  );

  // Mock the HTTP client
  mockHttpClient.mockGet(
    getNetworkScheduleUrl(todayDate, 'US'),
    {
      data: scheduleItems,
      status: 200,
      headers: {}
    }
  );

  // Call the method under test
  const shows = await tvMazeService.fetchShows();

  // Verify the result
  expect(shows.length).toBe(2);
});
```
