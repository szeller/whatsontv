# What's On TV

[![CI Status](https://github.com/szeller/whatsontv/actions/workflows/ci.yml/badge.svg)](https://github.com/szeller/whatsontv/actions)
[![Dependabot Status](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg)](https://github.com/szeller/whatsontv/blob/main/.github/dependabot.yml)
[![Coverage Status](https://img.shields.io/badge/Coverage-65%25-yellow.svg)](https://github.com/szeller/whatsontv/actions)

## Overview
A TypeScript application that fetches TV shows for the current day and sends notifications to a specified Slack channel using the TVMaze API. It supports filtering shows by type, network, genre, and language. It can be used both as a CLI tool and a Slack notification service.

## Prerequisites
- Node.js 18.18.0+
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
       "genres": ["Drama", "Comedy"],
       "languages": ["English"],
       "notificationTime": "9:00",
       "slack": {
           "enabled": true,
           "channel": "#tv-shows"
       }
   }
   ```

5. Build and run the application:
   ```bash
   # Build TypeScript files
   npm run build

   # Run as CLI tool
   npm run shows

   # Run as Slack notifier
   npm run slack
   ```

## Configuration

### Config File (config.json)
- `country`: Default country code for TV listings (e.g., "US", "GB")
- `types`: Default show types to filter by (e.g., ["Reality", "Scripted"])
- `networks`: Default networks to filter by (e.g., ["Discovery", "CBS"])
- `genres`: Default genres to filter by (e.g., ["Drama", "Comedy"])
- `languages`: Default languages to filter by (e.g., ["English"])
- `notificationTime`: When to send daily Slack notifications (24-hour format)
- `slack.enabled`: Whether to enable Slack notifications
- `slack.channel`: Default Slack channel for notifications

### CLI Options
- `--date, -d`: Date to fetch shows for (YYYY-MM-DD)
- `--country, -c`: Country code (e.g., US, GB)
- `--types, -t`: Show types to filter by
- `--networks, -n`: Networks to filter by
- `--genres, -g`: Genres to filter by
- `--languages, -l`: Languages to filter by
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
npm run shows

# Show Reality shows on Discovery
npm run shows -- --types Reality --networks Discovery

# Show English Drama shows on CBS and NBC
npm run shows -- --types Scripted --networks CBS NBC --genres Drama --languages English

# Show tomorrow's schedule
npm run shows -- --date 2025-02-22

# Show help
npm run shows -- --help
```

## Features
- Written in TypeScript for improved type safety and developer experience
- Uses TVMaze API to fetch TV show data (no API key required)
- Filter shows by:
  - Type (e.g., Reality, Scripted)
  - Network (e.g., CBS, Netflix)
  - Genre (e.g., Drama, Comedy)
  - Language (e.g., English, Spanish)
- Sort by time or group by network
- Command-line interface for quick lookups
- Configurable daily Slack notifications with:
  - Show name and type
  - Episode name
  - Season and episode number
  - Network and air time
- Customizable through config file
- Automatic daily notifications at configurable time

## Documentation

### Project Documentation
- `README.md`: User guide and quick start
- `docs/TechSpec.md`: Technical documentation including:
  - Architecture and design decisions
  - Development workflow
  - Testing strategy
  - Version constraints
  - Code style guidelines
- `docs/TVMaze.md`: Complete TVMaze API reference including:
  - API endpoints and parameters
  - Data structures and types
  - Supported platforms and regions
  - Error handling and best practices
  - Rate limiting and authentication

### Code Documentation
- TSDoc comments for public APIs
- Clear function and type documentation
- Examples in comments for complex logic

## Development
- Written in TypeScript 5.8.2 with strict mode enabled
- Uses Jest for testing with coverage requirements:
  - Target: 80% coverage across all metrics
  - Current coverage:
    - Statements: 56.15%
    - Branches: 51.78%
    - Functions: 52.27%
    - Lines: 56.70%
- ESM modules for better tree-shaking
- Follows modern TypeScript best practices
- Code style enforced via ESLint v9 with TypeScript-ESLint v8:
  - Single source of truth for code quality and formatting
  - Strict boolean expressions with no implicit conversions
  - No floating promises allowed
  - Explicit function return types required
  - Single quotes for strings
  - Required semicolons
  - No trailing commas
  - 2-space indentation
  - 100 character line width

### Development Workflow
1. Create a feature branch for your changes
2. Make changes following the code style guidelines
3. Ensure tests pass and meet coverage thresholds:
   ```bash
   # Run tests with coverage
   npm test
   ```
4. Create a pull request for review

### Dependency Maintenance
This project uses Dependabot to automate dependency updates with the following strategy:

#### Automated Updates
- **Weekly npm dependency checks** - PRs created for minor and patch updates
- **Monthly GitHub Actions checks** - Keeps CI workflows up to date
- **Intelligent dependency grouping**:
  - ESLint ecosystem (eslint, @eslint/*, @typescript-eslint/*, plugins)
  - TypeScript ecosystem (typescript, ts-*, @types/*)
  - Testing tools (jest, @jest/*, nock, supertest)
  - HTTP clients (got, axios, node-fetch)
  - Production dependencies (grouped separately)

#### Handling Updates
1. **Automated PRs**: Dependabot creates PRs for compatible updates
2. **Review Process**:
   - Check that all tests pass in the PR
   - Verify ESLint configuration still works
   - Look for peer dependency warnings (expected for TypeScript-ESLint with ESLint v9)
3. **Version Constraints**:
   - Major version updates require manual review
   - TypeScript and ESLint ecosystem have special compatibility requirements
   - Always update related packages together (e.g., parser and plugin)

#### Special Considerations
- **ESLint Ecosystem**: Maintain single source of truth for code quality and formatting
- **Peer Dependencies**: Some expected warnings from TypeScript-ESLint are normal
- **Documentation**: Version constraints are documented in `docs/TechSpec.md#version-constraints-and-dependencies`.

For detailed information about dependency constraints and compatibility, see the [Technical Specification](docs/TechSpec.md#version-constraints-and-dependencies).

### Running Tests
```bash
# Run all tests
npm test

# Run type checking
npm run type-check

# Run linting
npm run lint

# Run linting with auto-fix
npm run lint:fix

# Run CI checks (type checking, tests, and linting)
npm run ci

# Run tests in watch mode during development
npm run test:watch

# Run tests only on changed files (used by pre-commit hooks)
npm run test:changed
```

### Development Mode
Watch for changes during development:
```bash
npm run dev
