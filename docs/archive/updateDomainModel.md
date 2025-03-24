# TV Show Domain Model Update Proposal

## 1. Current Type System Analysis

### 1.1 Current Type Definitions

The current type system in `tvmaze.ts` has several issues that make it difficult to work with the TVMaze API responses. Let's analyze the existing types:

```typescript
export interface Country {
  name: string;
  code: string;
  timezone: string;
}

export interface Network {
  id: number;
  name: string;
  country: Country | null;
}

export interface Image {
  medium: string;
  original: string;
}

export interface ShowDetails {
  id?: number | string;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  network: Network | null;
  webChannel: Network | null;
  image: Image | null;
  summary: string;
}

export interface Show {
  airtime: string;
  name: string;
  season: string | number;
  number: string | number;
  show: ShowDetails;
}

export interface TVMazeShow {
  airdate?: string;
  airtime: string;
  name?: string;
  season?: string | number;
  number?: string | number;
  id?: number | string;
  type?: string;
  language?: string | null;
  genres?: string[];
  network?: Network | null;
  webChannel?: Network | null;
  image?: Image | null;
  summary?: string;
  show?: ShowDetails;
  _embedded?: {
    show?: ShowDetails;
  };
}
```

### 1.2 Key Issues with Current Types

1. **Inconsistent Structure**: The TVMaze API returns different structures for traditional networks (`/schedule`) and web channels (`/schedule/web`):
   - Traditional networks have `show` at the top level
   - Web channels have `show` nested inside `_embedded`

2. **Type Ambiguity**: The `TVMazeShow` interface tries to represent both episode data and show data, leading to many optional properties.

3. **Numeric Fields as Strings**: Fields like `season` and `number` are typed as `string | number`, requiring type checking and conversion.

4. **Missing Properties**: Several fields from the API responses are missing from the type definitions.

5. **Unclear Domain Model**: The current types don't clearly represent the domain concepts (shows, episodes, airings).

## 2. Selected Approach: Streamlined Domain Model with Zod

After evaluating different options and considering the code usage patterns, we've decided to implement a streamlined domain model with Zod for runtime validation. This approach:

- Creates a clear separation between API responses and our domain model
- Adds runtime validation to catch API inconsistencies early
- Simplifies the model based on actual usage patterns
- Provides consistent types throughout the application

### 2.1 Key Improvements

1. **Simplified Channel Representation**: Instead of complex Network/WebChannel objects, we'll use a simple string for the channel name with an `isStreaming` flag to indicate the source.

2. **Removed Image Type**: The `Image` type and related properties will be removed as they're not essential for the application's functionality.

3. **Explicit Nullable Airtime**: The `airtime` property will be explicitly typed as `string | null` since streaming shows often have empty airtime values.

4. **Consistent Numeric Types**: All numeric fields like `season` and `number` will be consistently typed as numbers, with automatic conversion from strings.

5. **Discriminated Union for API Responses**: Clear distinction between network and streaming show structures using a discriminated union.

### 2.2 New Type Definitions

```typescript
import { z } from 'zod';

// Helper for converting string|number to number
const numberFromMixed = z.union([
  z.number(),
  z.string().transform(val => parseInt(val, 10) || 0),
  z.null().transform(() => 0),
  z.undefined().transform(() => 0)
]);

// API response schemas
const ShowDetailsSchema = z.object({
  id: numberFromMixed.optional(),
  name: z.string(),
  type: z.string(),
  language: z.string().nullable(),
  genres: z.array(z.string()).default([]),
  network: z.object({
    id: numberFromMixed,
    name: z.string(),
    country: z.object({
      name: z.string(),
      code: z.string(),
      timezone: z.string()
    }).nullable()
  }).nullable(),
  webChannel: z.object({
    id: numberFromMixed,
    name: z.string(),
    country: z.object({
      name: z.string(),
      code: z.string(),
      timezone: z.string()
    }).nullable()
  }).nullable(),
  summary: z.string().nullable().default('')
});

// Network show schema (show at top level)
const NetworkShowSchema = z.object({
  id: numberFromMixed.optional(),
  airdate: z.string().optional(),
  airtime: z.string().nullable().default(null),
  name: z.string().optional(),
  season: numberFromMixed.optional(),
  number: numberFromMixed.optional(),
  show: ShowDetailsSchema
}).transform(data => ({
  ...data,
  source: 'network' as const
}));

// Streaming show schema (show in _embedded)
const StreamingShowSchema = z.object({
  id: numberFromMixed.optional(),
  airdate: z.string().optional(),
  airtime: z.string().nullable().default(null),
  name: z.string().optional(),
  season: numberFromMixed.optional(),
  number: numberFromMixed.optional(),
  _embedded: z.object({
    show: ShowDetailsSchema
  })
}).transform(data => ({
  ...data,
  source: 'streaming' as const
}));

// Combined API response schema
export const TVMazeApiResponseSchema = z.union([
  NetworkShowSchema,
  StreamingShowSchema
]);

// Inferred type from the schema
export type TVMazeApiResponse = z.infer<typeof TVMazeApiResponseSchema>;

// Our domain model
export interface Episode {
  id: number;
  name: string;
  season: number;
  number: number;
  airdate: string;
  airtime: string | null; 
  show: Show;
}

export interface Show {
  id: number;
  name: string;
  type: string;
  language: string | null;
  genres: string[];
  channel: string; 
  isStreaming: boolean; 
  summary: string | null;
}

// Schema for transforming API response to our domain model
export const EpisodeSchema = TVMazeApiResponseSchema.transform((apiResponse): Episode => {
  const showDetails = apiResponse.source === 'streaming' 
    ? apiResponse._embedded.show 
    : apiResponse.show;
    
  const channelName = showDetails.network?.name ?? 
                      showDetails.webChannel?.name ?? 
                      'Unknown';
  
  const show: Show = {
    id: showDetails.id ?? 0,
    name: showDetails.name,
    type: showDetails.type,
    language: showDetails.language,
    genres: showDetails.genres,
    channel: channelName,
    isStreaming: apiResponse.source === 'streaming',
    summary: showDetails.summary
  };
  
  return {
    id: apiResponse.id ?? 0,
    name: apiResponse.name ?? '',
    season: apiResponse.season ?? 0,
    number: apiResponse.number ?? 0,
    airdate: apiResponse.airdate ?? '',
    airtime: apiResponse.airtime, 
    show
  };
});
```

## 3. Implementation Plan

### Phase 1: Setup Test Fixtures (Completed)
- Create test fixtures with sample API responses
- Ensure coverage of both network and streaming shows
- Use these fixtures for validation and testing

### Phase 2: Add Zod and Create New Type Definitions (Estimated: 1 day)
- Install Zod: `npm install zod`
- Create new file `src/types/tvmazeModel.ts` with:
  - Zod schemas for API responses
  - New domain model interfaces (Show, Episode)
  - Transformation functions to convert API responses to domain model

### Phase 3: Update Service Implementation (Estimated: 1 day)
- Modify `TvMazeServiceImpl.getShowsByDate()` to:
  - Fetch from both endpoints (network and streaming)
  - Use Zod to validate and transform API responses
  - Return data in the new domain model format
- Update error handling to provide better diagnostics for validation failures

### Phase 4: Update Utility Functions (Estimated: 0.5 day)
- Update `normalizeShowData()` to work with the new domain model
- Update filtering functions to use the new types
- Ensure backward compatibility for existing code

### Phase 5: Update Tests (Estimated: 1 day)
- Add tests for the new schemas and transformation functions
- Update existing tests to work with the new domain model
- Add integration tests to verify end-to-end behavior

### Phase 6: Documentation (Estimated: 0.5 day)
- Document the new type system and validation approach
- Update code comments to reflect the new domain model
- Create examples of working with the new types

### Total Estimated Effort: 4 days

## 4. Implementation Details

### 4.1 API Response Handling

```typescript
// In tvMazeServiceImpl.ts
async getShowsByDate(date: string): Promise<Episode[]> {
  try {
    const [networkResponse, streamingResponse] = await Promise.all([
      this.httpClient.get(`${this.baseUrl}/schedule?date=${date}`),
      this.httpClient.get(`${this.baseUrl}/schedule/web?date=${date}`)
    ]);
    
    const networkShows = z.array(TVMazeApiResponseSchema).safeParse(networkResponse.data);
    const streamingShows = z.array(TVMazeApiResponseSchema).safeParse(streamingResponse.data);
    
    if (!networkShows.success) {
      console.error('Network shows validation error:', networkShows.error);
    }
    
    if (!streamingShows.success) {
      console.error('Streaming shows validation error:', streamingShows.error);
    }
    
    const validNetworkShows = networkShows.success ? networkShows.data : [];
    const validStreamingShows = streamingShows.success ? streamingShows.data : [];
    const allShows = [...validNetworkShows, ...validStreamingShows];
    
    return allShows.map(show => EpisodeSchema.parse(show));
  } catch (error) {
    console.error('Error fetching shows:', error);
    throw new Error(`Failed to fetch shows: ${error instanceof Error ? error.message : String(error)}`);
  }
}
```

### 4.2 Utility Function Updates

```typescript
// In showUtils.ts
export function groupShowsByChannel(episodes: Episode[]): Record<string, Episode[]> {
  const groups: Record<string, Episode[]> = {};
  
  for (const episode of episodes) {
    const channelName = episode.show.channel || 'Unknown Channel';
    
    if (!Object.prototype.hasOwnProperty.call(groups, channelName)) {
      groups[channelName] = [];
    }
    
    groups[channelName].push(episode);
  }
  
  return groups;
}

export function filterByChannel(episodes: Episode[], channels: string[]): Episode[] {
  if (!channels || channels.length === 0) {
    return episodes;
  }
  
  return episodes.filter(episode => {
    const channelName = episode.show.channel;
    return channels.some(n => channelName.toLowerCase().includes(n.toLowerCase()));
  });
}
```

## 5. Next Steps

1. Implement the new type definitions in `src/types/tvmazeModel.ts`
2. Update the TVMaze service implementation to use the new types
3. Update utility functions to work with the new domain model
4. Add tests for the new schemas and transformation functions
5. Document the new approach for future reference
