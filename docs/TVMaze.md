# TVMaze API Documentation

This document outlines the TVMaze API endpoints and data structures used in the What's On TV project.

## API Endpoints

Our application uses the following TVMaze API endpoints:

### Base URL
```
https://api.tvmaze.com
```

### Schedule Endpoints

1. **TV Schedule** (`/schedule`)
   - Returns all TV shows airing during a specific date
   - Parameters:
     - `date`: YYYY-MM-DD format (e.g., 2025-03-16)
     - `country`: Two-letter country code (e.g., 'US')
   - Example: `https://api.tvmaze.com/schedule?country=US&date=2025-03-16`

2. **Web Schedule** (`/schedule/web`)
   - Returns all web/streaming shows airing during a specific date
   - Parameters:
     - `date`: YYYY-MM-DD format
   - Example: `https://api.tvmaze.com/schedule/web?date=2025-03-16`

## Data Structures

### Show Object
```typescript
interface Show {
  airtime: string;        // Show's airtime in HH:MM format
  name: string;           // Episode name
  season: string|number;  // Season number
  number: string|number;  // Episode number
  show: ShowDetails;      // Detailed show information
}
```

### Show Details
```typescript
interface ShowDetails {
  id: number|string;
  name: string;           // Show name
  type: string;          // e.g., 'Scripted', 'Reality', etc.
  language: string|null;
  genres: string[];
  network: Network|null;  // Traditional TV network
  webChannel: Network|null; // Streaming platform
  image: Image|null;
  summary: string;
}
```

### Network/Web Channel
```typescript
interface Network {
  id: number;
  name: string;          // Network/Platform name
  country: Country|null;
}
```

### Country
```typescript
interface Country {
  name: string;    // Full country name
  code: string;    // Two-letter country code
  timezone: string; // e.g., 'America/New_York'
}
```

### Image
```typescript
interface Image {
  medium: string;   // URL to medium-size image
  original: string; // URL to original-size image
}
```

## Supported Platforms

### US Available Platforms
The following streaming platforms are recognized as US-based:
- Netflix
- Paramount+ (also recognized as "Paramount Plus" or "Paramount")
- Hulu
- Prime Video
- Apple TV+ (also recognized as "Apple TV Plus")
- Disney+
- HBO Max
- Peacock
- Discovery+
- AMC+

## Additional Resources

- [TVMaze API Documentation](https://www.tvmaze.com/api)
- [Schedule API Documentation](https://www.tvmaze.com/api#schedule)
- [Show Endpoint Documentation](https://www.tvmaze.com/api#shows)

## Rate Limiting

TVMaze API has the following rate limits:
- No authentication required for up to 20 calls every 10 seconds
- Authentication available for higher rate limits (not currently used in this project)

## Error Handling

Our application handles API errors gracefully:
- Network errors return an empty array
- Invalid date formats are caught and logged
- Missing show data fields are handled with reasonable defaults
- Country mismatches are filtered out at the application level

## Best Practices

1. **Date Formatting**
   - Always use YYYY-MM-DD format for date parameters
   - Use the `getTodayDate()` utility function for consistency

2. **Network Names**
   - Use `normalizeNetworkName()` to handle network name variations
   - Check platform availability with `isUSPlatform()`

3. **Show Filtering**
   - Filter shows by type, network, genre, and language
   - Use country-specific filtering for regional content
   - Handle both traditional TV and web/streaming content
