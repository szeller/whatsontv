# TVMaze API Documentation

This document provides comprehensive information about the TVMaze API, including endpoints, data structures, and integration patterns used in the What's On TV project. This documentation should be sufficient for developing a new TVMaze API integration.

## API Overview

TVMaze is a free, community-driven TV show database with a public API that provides information about TV shows, episodes, cast, crew, and schedules. The API does not require authentication for most endpoints, making it easy to integrate.

## Base URL

```bash
https://api.tvmaze.com
```

## Core Endpoints

### Schedule Endpoints

1. **TV Network Schedule** (`/schedule`)
   - Returns all traditional TV network shows airing during a specific date
   - Parameters:
     - `date`: YYYY-MM-DD format (e.g., 2025-03-25)
     - `country`: Two-letter country code (e.g., 'US')
   - Example: `https://api.tvmaze.com/schedule?country=US&date=2025-03-25`
   - Response: Array of schedule items with show data at the top level

2. **Web/Streaming Schedule** (`/schedule/web`)
   - Returns all web/streaming shows airing during a specific date
   - Parameters:
     - `date`: YYYY-MM-DD format
   - Example: `https://api.tvmaze.com/schedule/web?date=2025-03-25`
   - Response: Array of schedule items with show data nested in `_embedded.show`

### Show Endpoints

1. **Show Information** (`/shows/{id}`)
   - Returns detailed information about a specific show
   - Example: `https://api.tvmaze.com/shows/1`

2. **Show Episodes** (`/shows/{id}/episodes`)
   - Returns all episodes for a specific show
   - Example: `https://api.tvmaze.com/shows/1/episodes`

3. **Show Cast** (`/shows/{id}/cast`)
   - Returns cast information for a specific show
   - Example: `https://api.tvmaze.com/shows/1/cast`

4. **Show Search** (`/search/shows`)
   - Searches for shows by name
   - Parameters:
     - `q`: Search query
   - Example: `https://api.tvmaze.com/search/shows?q=game%20of%20thrones`

## Data Structures

### Important Structural Differences

The TVMaze API has different response structures for network shows and streaming shows, which is a critical aspect to understand for correct integration:

#### Network Schedule Item (`/schedule`)

Network shows have the show data at the top level of the response:

```typescript
interface NetworkScheduleItem {
  id: number;              // Episode ID
  url: string;             // TVMaze URL for the episode
  name: string;            // Episode name
  season: number | string; // Season number (can be a string in some responses)
  number: number | string; // Episode number (can be a string in some responses)
  type: string;            // Episode type (regular, special, etc.)
  airdate: string;         // YYYY-MM-DD format
  airtime: string | null;  // Show's airtime in HH:MM format (can be empty string or null)
  airstamp: string;        // ISO 8601 timestamp
  runtime: number | null;  // Duration in minutes
  rating: {
    average: number | null;
  };
  image: {
    medium: string;
    original: string;
  } | null;
  summary: string | null;  // Episode summary in HTML format
  show: {                  // Show is at the top level
    id: number;
    url: string;
    name: string;
    type: string;          // Show type (Scripted, Reality, etc.)
    language: string | null;
    genres: string[];
    status: string;        // Running, Ended, etc.
    runtime: number | null;
    averageRuntime: number | null;
    premiered: string | null;
    ended: string | null;
    officialSite: string | null;
    schedule: {
      time: string;
      days: string[];
    };
    rating: {
      average: number | null;
    };
    weight: number;
    network: {            // Traditional TV network
      id: number;
      name: string;
      country: {
        name: string;
        code: string;     // Two-letter country code
        timezone: string; // e.g., 'America/New_York'
      };
      officialSite: string | null;
    } | null;
    webChannel: null;     // Typically null for network shows
    dvdCountry: null | {
      name: string;
      code: string;
      timezone: string;
    };
    externals: {
      tvrage: number | null;
      thetvdb: number | null;
      imdb: string | null;
    };
    image: {
      medium: string;
      original: string;
    } | null;
    summary: string | null; // Show summary in HTML format
    updated: number;       // Unix timestamp
    _links: {
      self: { href: string };
      previousepisode?: { href: string };
      nextepisode?: { href: string };
    };
  };
  _links: {
    self: { href: string };
    show: { href: string };
  };
}
```

#### Web Schedule Item (`/schedule/web`)

Streaming shows have the show data nested in the `_embedded` property:

```typescript
interface WebScheduleItem {
  id: number;              // Episode ID
  url: string;             // TVMaze URL for the episode
  name: string;            // Episode name
  season: number | string; // Season number
  number: number | string; // Episode number
  type: string;            // Episode type (regular, special, etc.)
  airdate: string;         // YYYY-MM-DD format
  airtime: string | null;  // Show's airtime in HH:MM format (often empty for streaming)
  airstamp: string;        // ISO 8601 timestamp
  runtime: number | null;  // Duration in minutes
  rating: {
    average: number | null;
  };
  image: {
    medium: string;
    original: string;
  } | null;
  summary: string | null;  // Episode summary in HTML format
  _embedded: {             // Show is nested in _embedded
    show: {
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
      rating: {
        average: number | null;
      };
      weight: number;
      network: null;      // Typically null for web shows
      webChannel: {       // Streaming service
        id: number;
        name: string;
        country: {
          name: string;
          code: string;
          timezone: string;
        } | null;         // Note: country can be null for global streaming services
        officialSite: string | null;
      } | null;
      dvdCountry: null | {
        name: string;
        code: string;
        timezone: string;
      };
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
    };
  };
  _links: {
    self: { href: string };
    show: { href: string };
  };
}
```

## Data Transformation

The application uses Zod schemas to transform TVMaze API data into our internal domain model. This approach provides type safety, validation, and consistent error handling.

### Transformation Process

1. **Schema Definition**: We define Zod schemas that match the TVMaze API response structure
2. **Schema Transformation**: We use Zod's transform capabilities to convert API data to our domain model
3. **Error Handling**: We handle validation errors gracefully, returning null for invalid data

### Implementation

The transformation logic is implemented in two key locations:

1. **Schema Transformations** (`src/schemas/tvmaze.ts`):
   - `networkScheduleToShowSchema`: Transforms network schedule items to our domain model
   - `webScheduleToShowSchema`: Transforms web schedule items to our domain model

2. **Utility Functions** (`src/utils/tvMazeUtils.ts`):
   - `transformScheduleItem`: Determines the type of schedule item and applies the appropriate schema transformation
   - `transformSchedule`: Processes an array of schedule items, filtering out any null results

### Example: Network Schedule Transformation

```typescript
// Schema definition with transformation
export const networkScheduleToShowSchema = networkScheduleItemSchema.transform((item) => {
  // Extract show data with safe defaults
  const show = item.show ?? {};
  const id = typeof show.id === 'number' ? show.id : 0;
  const name = typeof show.name === 'string' && show.name.length > 0 ? show.name : 'Unknown Show';
  
  return {
    id,
    name,
    // Additional properties...
  };
});
```

```typescript
// Usage in utility function
export function transformScheduleItem(item: unknown): Show | null {
  try {
    const isWeb = isWebScheduleItem(item);
    
    if (isWeb) {
      return webScheduleToShowSchema.safeParse(item).success 
        ? webScheduleToShowSchema.parse(item)
        : null;
    } else {
      return networkScheduleToShowSchema.safeParse(item).success
        ? networkScheduleToShowSchema.parse(item)
        : null;
    }
  } catch (error) {
    console.error('Error transforming schedule item:', error);
    return null;
  }
}
```

### Benefits of This Approach

1. **Type Safety**: The transformation process is fully typed
2. **Validation**: Input data is validated against the schema
3. **Default Values**: Missing or null fields are handled with sensible defaults
4. **Centralized Logic**: Transformation logic is defined in one place
5. **Testability**: Schema transformations are easy to test in isolation

## Type Inconsistencies and Edge Cases

The TVMaze API has several inconsistencies and edge cases that any robust integration must handle:

1. **Type Inconsistencies:**
   - `season` and `number` fields can be either numbers or strings
   - Empty strings vs. null values for optional fields
   - Some fields might be missing entirely in certain responses

2. **Null Values:**
   - Many fields can be null, including `network`, `webChannel`, `language`, `summary`, etc.
   - Images can be null when no image is available

3. **Streaming vs. Network Shows:**
   - Network shows have `network` populated and `webChannel` null
   - Streaming shows have `webChannel` populated and `network` null
   - Some shows might have both `network` and `webChannel` populated (simulcast shows)

4. **Country Information:**
   - Global streaming services often have `null` for the country in `webChannel`
   - Country codes follow ISO 3166-1 alpha-2 standard (two letters)

5. **Time and Date Formats:**
   - Dates are in YYYY-MM-DD format
   - Times are in 24-hour HH:MM format
   - Timestamps are in ISO 8601 format
   - The `updated` field is a Unix timestamp

## Integration Best Practices

### 1. Data Transformation

When integrating with TVMaze API, it's recommended to transform the API responses into a consistent domain model:

```typescript
// Example domain model for a show
interface Show {
  id: number;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  network: string;         // Normalized network or streaming service name
  isStreaming: boolean;    // Whether the show is from a streaming service
  summary: string | null;
  airtime: string | null;
  season: number;          // Normalized to number
  number: number;          // Normalized to number
}
```

### 2. Handling Different Structures

Use a unified transformation function that can handle both network and streaming show structures:

```typescript
function transformScheduleItem(item: unknown): Show | null {
  try {
    // Determine if it's a network or streaming show
    const isFromWebSchedule = isWebScheduleItem(item);
    
    // Extract show data based on structure
    let showData;
    if (isFromWebSchedule) {
      showData = item._embedded?.show;
    } else {
      showData = item.show;
    }
    
    if (!showData) return null;
    
    // Determine if it's a streaming show based on properties
    const isStreaming = 
      (showData.webChannel !== null && showData.webChannel !== undefined) && 
      (showData.network === null || showData.network === undefined);
    
    // Transform to domain model
    return {
      id: showData.id,
      name: showData.name,
      // ... other transformations
      isStreaming: isStreaming,
      // ... additional fields
    };
  } catch (error) {
    // Handle errors
    return null;
  }
}
```

### 3. Type Validation

Use a schema validation library like Zod to ensure type safety:

```typescript
// Example Zod schema for network schedule item
const networkScheduleItemSchema = z.object({
  show: z.object({
    id: z.number(),
    name: z.string(),
    // ... other fields
  }),
  // ... episode fields
});

// Example Zod schema for web schedule item
const webScheduleItemSchema = z.object({
  _embedded: z.object({
    show: z.object({
      id: z.number(),
      name: z.string(),
      // ... other fields
    }),
  }),
  // ... episode fields
});

// Combined schema using discriminated union
const scheduleItemSchema = z.discriminatedUnion('_embedded', [
  networkScheduleItemSchema,
  webScheduleItemSchema,
]);
```

### 4. Error Handling

Implement robust error handling for API requests:

```typescript
async function getSchedule(url: string): Promise<Record<string, unknown>[]> {
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      // Handle HTTP errors
      throw new Error(`HTTP error ${response.status}: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      // Handle unexpected response format
      throw new Error('Expected array response');
    }
    
    return data;
  } catch (error) {
    // Log error and return empty array
    console.error(`Error fetching schedule from ${url}:`, error);
    return [];
  }
}
```

### 5. Caching

Implement caching to reduce API calls and improve performance:

```typescript
// Example caching mechanism
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

async function getCachedSchedule(url: string): Promise<Record<string, unknown>[]> {
  const now = Date.now();
  const cacheKey = url;
  
  // Check cache
  const cachedData = cache.get(cacheKey);
  if (cachedData && (now - cachedData.timestamp) < CACHE_TTL) {
    return cachedData.data;
  }
  
  // Fetch fresh data
  const data = await getSchedule(url);
  
  // Update cache
  cache.set(cacheKey, { data, timestamp: now });
  
  return data;
}
```

## Example Integration Flow

1. **Fetch Data:**
   ```typescript
   // Get today's date in YYYY-MM-DD format
   const today = new Date().toISOString().split('T')[0];
   
   // Fetch network schedule
   const networkUrl = `https://api.tvmaze.com/schedule?date=${today}&country=US`;
   const networkSchedule = await getSchedule(networkUrl);
   
   // Fetch web schedule
   const webUrl = `https://api.tvmaze.com/schedule/web?date=${today}`;
   const webSchedule = await getSchedule(webUrl);
   
   // Combine schedules
   const combinedSchedule = [...networkSchedule, ...webSchedule];
   ```

2. **Transform Data:**
   ```typescript
   // Transform to domain model
   const shows = combinedSchedule
     .map(item => transformScheduleItem(item))
     .filter((show): show is Show => show !== null);
   ```

3. **Apply Filters:**
   ```typescript
   // Filter by user preferences
   const filteredShows = shows.filter(show => {
     // Example: Filter by genre
     if (userPreferences.genres.length > 0) {
       return show.genres.some(genre => userPreferences.genres.includes(genre));
     }
     return true;
   });
   ```

4. **Display Results:**
   ```typescript
   // Sort by airtime
   const sortedShows = filteredShows.sort((a, b) => {
     if (!a.airtime) return 1;
     if (!b.airtime) return -1;
     return a.airtime.localeCompare(b.airtime);
   });
   
   // Format and display
   sortedShows.forEach(show => {
     console.log(`${show.airtime || 'TBA'} - ${show.name} (${show.network})`);
   });
   ```

## Handling API Rate Limits

TVMaze API has rate limiting in place:

- 20 calls every 10 seconds per IP address
- If exceeded, you'll receive a 429 Too Many Requests response

Implement a rate limiter to avoid hitting these limits:

```typescript
class RateLimiter {
  private queue: Array<() => Promise<void>> = [];
  private processing = false;
  private requestsInWindow = 0;
  private windowStart = Date.now();
  private readonly MAX_REQUESTS = 20;
  private readonly WINDOW_MS = 10000; // 10 seconds
  
  async schedule<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push(async () => {
        try {
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      });
      
      if (!this.processing) {
        this.processQueue();
      }
    });
  }
  
  private async processQueue() {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }
    
    this.processing = true;
    
    // Check if we need to reset the window
    const now = Date.now();
    if (now - this.windowStart > this.WINDOW_MS) {
      this.windowStart = now;
      this.requestsInWindow = 0;
    }
    
    // Check if we can make a request
    if (this.requestsInWindow < this.MAX_REQUESTS) {
      const task = this.queue.shift();
      if (task) {
        this.requestsInWindow++;
        await task();
        
        // Process next item immediately
        this.processQueue();
      }
    } else {
      // Wait until the window resets
      const waitTime = this.WINDOW_MS - (now - this.windowStart);
      setTimeout(() => this.processQueue(), waitTime);
    }
  }
}

// Usage
const rateLimiter = new RateLimiter();
const data = await rateLimiter.schedule(() => getSchedule(url));
```

## Conclusion

This documentation provides a comprehensive overview of the TVMaze API, including its endpoints, data structures, and integration patterns. By following these guidelines and best practices, you should be able to develop a robust TVMaze API integration that handles all the edge cases and inconsistencies in the API responses.

Remember to:
1. Handle different data structures for network and streaming shows
2. Normalize data types and handle inconsistencies
3. Implement proper error handling and caching
4. Respect API rate limits
5. Transform API responses into a consistent domain model
