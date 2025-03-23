# TVMaze API Test Fixtures

This directory contains sample API responses from the TVMaze API for testing purposes.

## Files

- `network-schedule.json`: Sample response from the `/schedule` endpoint (traditional TV networks)
- `web-schedule.json`: Sample response from the `/schedule/web` endpoint (streaming services)
- `combined-schedule.json`: A combined dataset with both network and streaming shows for testing unified handling

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

## Usage

These fixtures can be used for:

1. Unit testing the TVMaze service implementation
2. Testing Zod schema validation
3. Verifying type conversion logic
4. Ensuring proper handling of both network and streaming show formats

## Maintenance

These fixtures were created on March 23, 2025, and represent a subset of the actual API responses. If the TVMaze API changes its response format, these fixtures should be updated accordingly.
