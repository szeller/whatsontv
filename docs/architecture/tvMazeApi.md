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

## API Response Examples

### TV Schedule Response
```json
{
  "id": 1234,
  "airdate": "2025-03-16",
  "airtime": "20:00",
  "airstamp": "2025-03-17T03:00:00+00:00",
  "runtime": 60,
  "name": "Episode Title",
  "season": 2,
  "number": 5,
  "show": {
    "id": 5678,
    "name": "Show Name",
    "type": "Scripted",
    "language": "English",
    "genres": ["Drama", "Thriller"],
    "network": {
      "id": 3,
      "name": "CBS",
      "country": {
        "name": "United States",
        "code": "US",
        "timezone": "America/New_York"
      }
    },
    "webChannel": null,
    "image": {
      "medium": "https://static.tvmaze.com/medium.jpg",
      "original": "https://static.tvmaze.com/original.jpg"
    },
    "summary": "Show description goes here"
  }
}
```

### Web Schedule Response
```json
{
  "id": 5678,
  "airdate": "2025-03-16",
  "airtime": "00:00",
  "airstamp": "2025-03-16T07:00:00+00:00",
  "runtime": null,
  "name": "Season 1 Episode 1",
  "season": 1,
  "number": 1,
  "show": {
    "id": 9012,
    "name": "Streaming Show",
    "type": "Reality",
    "language": "English",
    "genres": ["Reality"],
    "network": null,
    "webChannel": {
      "id": 1,
      "name": "Netflix",
      "country": null
    },
    "image": {
      "medium": "https://static.tvmaze.com/medium.jpg",
      "original": "https://static.tvmaze.com/original.jpg"
    },
    "summary": "Streaming show description"
  }
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

## Troubleshooting Guide

### Common Issues

1. **Missing Air Times**
   ```typescript
   // API Response
   { "airtime": null }
   // Our Code
   const displayTime = show.airtime || 'TBA';
   ```
   - Shows without air times display as 'TBA'
   - Sorted to end of time-sorted lists

2. **Network vs Web Channel**
   ```typescript
   // Traditional TV Show
   network = show.show.network?.name || 'N/A';  // "CBS"
   // Streaming Show
   network = show.show.webChannel?.name || 'N/A';  // "Netflix"
   ```
   - Always check both network and webChannel
   - Use normalizeNetworkName() for consistent display

3. **Country Code Handling**
   ```typescript
   // US Network
   "CBS" // No country code needed
   // International Network
   "BBC (GB)" // Country code appended
   // US Streaming Platform
   "Netflix" // No country code needed even if show is international
   ```
   - Use isUSPlatform() to determine if country code is needed

4. **Error Recovery**
   ```typescript
   try {
     const shows = await fetchTvShows();
   } catch (error) {
     console.error('Error:', error.message);
     return []; // Return empty array on error
   }
   ```
   - API errors return empty arrays to prevent app crashes
   - Invalid dates return empty results
   - Network errors are logged but don't crash the app

### Rate Limit Handling
```typescript
// Response Headers
X-RateLimit-Limit: 20
X-RateLimit-Remaining: 19
```
- Monitor X-RateLimit headers
- Implement exponential backoff if needed
- Consider caching frequently accessed data

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
