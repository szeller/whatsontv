# TV Show Notifier

## Overview
This Node.js application fetches new TV shows for the current day and sends a notification to a specified Slack channel using the TVMaze API. It supports filtering shows by type and network, and can be used both as a CLI tool and a Slack notification service.

## Prerequisites
- Node.js 14+
- Slack Bot Token (optional, only needed for Slack notifications)

## Setup

1. Clone the repository

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file with the following variables (only needed for Slack notifications):
   ```
   SLACK_BOT_TOKEN=your_slack_bot_token
   SLACK_CHANNEL=#your_channel
   ```

4. Copy the example config file and customize it:
   ```
   cp config.json.example config.json
   ```
   Edit `config.json` to set your preferences:
   ```json
   {
       "country": "US",
       "types": ["Reality", "Scripted"],
       "networks": ["Discovery", "CBS", "Netflix"],
       "notificationTime": "9:00",
       "slack": {
           "enabled": true,
           "channel": "#tv-shows"
       }
   }
   ```

5. Run the application:
   - As a CLI tool:
     ```
     node cli.js [options]
     ```
   - As a Slack notifier:
     ```
     node index.js
     ```

## Configuration

### Config File (config.json)
- `country`: Default country code for TV listings (e.g., "US", "GB")
- `types`: Default show types to filter by (e.g., ["Reality", "Scripted"])
- `networks`: Default networks to filter by (e.g., ["Discovery", "CBS"])
- `notificationTime`: When to send daily Slack notifications (24-hour format)
- `slack.enabled`: Whether to enable Slack notifications
- `slack.channel`: Default Slack channel for notifications

### CLI Options
- `--date, -d`: Date to fetch shows for (YYYY-MM-DD)
- `--country, -c`: Country code (e.g., US, GB)
- `--types, -t`: Show types to filter by
- `--networks, -n`: Networks to filter by
- `--time-sort, -s`: Sort shows by time instead of network
- `--help`: Show help menu

### Available Show Types
- Reality
- Scripted
- News
- Talk Show
- Game Show
- Panel Show
- Sports
- Animation
- Documentary
- Variety

### Example Commands
```bash
# Show all shows for today
node cli.js

# Show Reality shows on Discovery
node cli.js --types Reality --networks Discovery

# Show News and Talk Shows on CBS and NBC
node cli.js --types News "Talk Show" --networks CBS NBC

# Show tomorrow's schedule
node cli.js --date 2025-02-22

# Show help
node cli.js --help
```

## Features
- Uses TVMaze API to fetch TV show data (no API key required)
- Filter shows by type and network
- Sort by time or group by network
- Command-line interface for quick lookups
- Configurable daily Slack notifications with:
  - Show name and type
  - Episode name
  - Season and episode number
  - Network and air time
- Customizable through config file
- Automatic daily notifications at configurable time
