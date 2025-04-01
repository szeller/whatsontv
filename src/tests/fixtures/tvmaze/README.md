# TVMaze API Test Fixtures

This directory contains sample API responses from the TVMaze API for testing purposes, along with fixture builders for creating test data.

## Static Fixtures

- `network-schedule.json`: Sample response from the `/schedule` endpoint (traditional TV networks)
- `web-schedule.json`: Sample response from the `/schedule/web` endpoint (streaming services)
- `combined-schedule.json`: A combined dataset with both network and streaming shows for testing unified handling

## Fixture Builders

In addition to static JSON fixtures, we provide TypeScript builder classes for creating customized test data:

### NetworkBuilder

Creates network objects for TVMaze API responses:

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

### TvMazeShowBuilder

Creates show objects in TVMaze API format:

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

### TvMazeScheduleItemBuilder

Creates schedule items for TVMaze API responses:

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

## Data Structure

### Network Shows (`/schedule`)
Network shows have the show data directly at the top level in the `show` property:

```json
{
  "airtime": "19:00",
  "name": "March 17, 2024",
  "season": 56,
  "number": 26,
  "show": {
    "id": 3777,
    "name": "60 Minutes",
    // ...
  }
}
```

### Streaming Shows (`/schedule/web`)
Streaming shows have the show data nested inside the `_embedded.show` property:

```json
{
  "airtime": "",
  "name": "Episode 5",
  "season": 2,
  "number": 5,
  "_embedded": {
    "show": {
      "id": 65789,
      "name": "The Reluctant Traveler with Eugene Levy",
      // ...
    }
  }
}
```

## Key Differences

1. **Show Location**: Network shows have `show` at the top level, streaming shows have it in `_embedded.show`
2. **Airtime Format**: Network shows typically have an airtime (e.g., "19:00"), streaming shows often have empty airtime
3. **Data Types**: Some fields like `season` and `number` may be numbers or strings
4. **Optional Fields**: Many fields are optional or may be null

## Best Practices for Using Fixture Builders

1. **Prefer Builders Over Static Fixtures**:
   - Use the builder classes for creating test data whenever possible
   - This provides type safety and makes tests more maintainable

2. **Use Static Methods for Common Patterns**:
   - The static methods on builders encapsulate common test data patterns
   - For example, use `createNetworkScheduleItems()` instead of manually creating multiple items

3. **Customize Only What's Necessary**:
   - Only specify the properties that are relevant to your test
   - Let the builders provide sensible defaults for other properties

4. **Handle Nullable Fields Correctly**:
   - Some fields like `runtime` and `averageRuntime` can be null
   - The builders handle these cases correctly, but be aware when accessing these fields

5. **Test Both Network and Web Formats**:
   - Use `createMixedScheduleItems()` to test handling of both formats
   - This ensures your code correctly handles the different data structures

## Example: Testing TVMaze Service

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

it('fetches both network and web shows', async () => {
  // Create mixed test data
  const todayDate = getTodayDate();
  const mixedItems = TvMazeScheduleItemBuilder.createMixedScheduleItems(
    2, // network items
    2, // web items
    { airdate: todayDate }
  );
  
  // Mock HTTP client responses
  mockHttpClient.mockGet(
    getNetworkScheduleUrl(todayDate, 'US'),
    {
      data: mixedItems.networkItems,
      status: 200,
      headers: {}
    }
  );
  
  mockHttpClient.mockGet(
    getWebScheduleUrl(todayDate),
    {
      data: mixedItems.webItems,
      status: 200,
      headers: {}
    }
  );
  
  // Call the method under test
  const shows = await tvMazeService.fetchShows({ fetchSource: 'all' });
  
  // Verify the result
  expect(shows.length).toBe(4);
});
```

## Usage

These fixtures and builders can be used for:

1. Unit testing the TVMaze service implementation
2. Testing Zod schema validation
3. Verifying type conversion logic
4. Ensuring proper handling of both network and streaming show formats

## Maintenance

These fixtures and builders were updated in March 2025. If the TVMaze API changes its response format, both the static fixtures and the builder classes should be updated accordingly.
