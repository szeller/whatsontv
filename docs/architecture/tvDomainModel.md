# TV Domain Model

This document describes the domain model used in the What's On TV application and how it maps to the TVMaze API.

## Core Domain Objects

### Show

The `Show` interface is the primary domain object in our application. It represents a TV show airing at a specific time, combining both show-level metadata and episode-specific information.

```typescript
export interface Show {
  id: number;           // Unique identifier for the show
  name: string;         // Name of the show
  type: string;         // Type of show (e.g., 'Scripted', 'Reality', etc.)
  language: string | null; // Primary language of the show
  genres: string[];     // List of genres for the show
  network: string;      // Network or streaming service name
  isStreaming: boolean; // Whether this is a streaming show
  summary: string | null; // Show description/summary
  airtime: string | null; // Time when the show airs (format: 'HH:MM')
  season: number;       // Season number of the episode
  number: number;       // Episode number within the season
}
```

### NetworkGroups

The `NetworkGroups` type is used to organize shows by their network or streaming service:

```typescript
export type NetworkGroups = Record<string, Show[]>;
```

## Domain Model Design Decisions

### Combined Show and Episode Data

Our domain model deliberately combines show-level data (like name, type, genres) with episode-specific data (season, number, airtime) into a single `Show` object. This design decision was made because:

1. The application's primary use case is displaying what's on TV right now or on a specific date
2. Users are primarily interested in which shows are airing, not the detailed episode structure
3. Simplifies the data model for the primary use cases

### Network vs. Streaming Services

The `network` property in our `Show` interface represents either:
- A traditional TV network (e.g., "NBC", "CBS")
- A streaming service (e.g., "Netflix", "Hulu")

This allows us to group shows consistently regardless of whether they're traditional broadcast or streaming content.

## Mapping from TVMaze API

The TVMaze API has different structures for network shows and streaming shows:

### Network Shows
In the `/schedule` endpoint, each item contains:
- A `show` object with show metadata
- Episode data at the top level

### Streaming Shows
In the `/schedule/web` endpoint, each item contains:
- Episode data at the top level
- A `show` object nested inside `_embedded.show`

Our transformation functions handle these differences and produce a consistent `Show` object for both types.

## Explicit Field Mapping

Here's how we map from the TVMaze API model to our domain model:

| TVMaze API Field | Our Domain Model Field | Notes |
|------------------|------------------------|-------|
| `show.id` or `_embedded.show.id` | `id` | Show identifier |
| `show.name` or `_embedded.show.name` | `name` | Show name |
| `show.type` or `_embedded.show.type` | `type` | Show type (e.g., 'Scripted') |
| `show.language` or `_embedded.show.language` | `language` | Show language |
| `show.genres` or `_embedded.show.genres` | `genres` | Array of genre strings |
| `show.network.name` or `show.webChannel.name` or `_embedded.show.webChannel.name` | `network` | Network or streaming service name |
| Source endpoint or `show.webChannel` presence | `isStreaming` | `true` if from web schedule or has webChannel |
| `show.summary` or `_embedded.show.summary` | `summary` | Show description |
| `airtime` | `airtime` | Time when the episode airs |
| `season` | `season` | Season number |
| `number` | `number` | Episode number |

## Transformation Process

1. We extract the show data from the appropriate location based on the source
2. We extract episode data (airtime, season, number)
3. We determine if it's a streaming show
4. We extract the network name from either `network.name` or `webChannel.name`
5. We combine all this data into a single `Show` object

This transformation process is handled by the `transformSchedule` function in `tvmazeModel.ts`.
