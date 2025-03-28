# What's On TV

[![CI Status](https://github.com/szeller/whatsontv/actions/workflows/ci.yml/badge.svg)](https://github.com/szeller/whatsontv/actions)
[![Dependabot Status](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg)](https://github.com/szeller/whatsontv/blob/main/.github/dependabot.yml)
[![Coverage Status](https://img.shields.io/badge/Coverage-90%25-brightgreen.svg)](https://github.com/szeller/whatsontv/actions)

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

5. Run the application:
   ```bash
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

## Architecture

### Clean Architecture
The application follows a clean architecture with clear separation of interfaces and implementations:

- **Interfaces** (`src/interfaces/`): Define contracts for all services
- **Implementations** (`src/implementations/`): Concrete implementations of interfaces
  - Platform-specific code in dedicated subdirectories (console, slack)
- **Utilities** (`src/utils/`): Pure utility functions
- **Entry Points** (`src/cli.ts`, `src/slack.ts`): Application entry points

### Dependency Injection
The application uses tsyringe for dependency injection:

- All services are injectable and registered in a central container
- Dependencies are injected through constructor parameters
- Clear separation between interfaces and implementations
- Consistent use of dependency injection throughout the application

### Directory Structure
```
src/
├── interfaces/                # All interface definitions
├── implementations/           # All concrete implementations
│   ├── console/               # Console-specific implementations
│   └── slack/                 # Slack-specific implementations
├── utils/                     # Utility functions and helpers
├── cli.ts                     # CLI entry point
└── slack.ts                   # Slack entry point
```

## Documentation

The project documentation is organized into the following structure:

- [Architecture Documentation](docs/architecture/): System design, architecture decisions, and API references
- [Development Documentation](docs/development/): Development guides, standards, and processes
  - [Testing Standards](docs/development/testingStandards.md): Comprehensive testing guidelines and fixture usage
  - [Test Coverage Improvement Plan](docs/development/improveTestCoverage.md): Detailed plan for improving test coverage
- [Archive](docs/archive/): Historical documentation for completed work

## Development
- Written in TypeScript 5.8.2 with strict mode enabled
- Uses Jest for testing with coverage requirements:
  - Target: 80% coverage across all metrics
  - Current coverage:
    - Statements: 90.45%
    - Branches: 82.32%
    - Functions: 89.23%
    - Lines: 90.22%
- Comprehensive test fixtures system for consistent testing
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
   - Verify that coverage thresholds are maintained
   - Review any breaking changes or deprecation notices
3. **Merge Strategy**:
   - Minor/patch updates merged automatically if tests pass
   - Major updates require manual review and testing
   - Dependency groups updated together to maintain compatibility

## Contributing
1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License
This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments
- [TVMaze API](https://www.tvmaze.com/api) for providing the TV show data
- [tsyringe](https://github.com/microsoft/tsyringe) for dependency injection
- [got](https://github.com/sindresorhus/got) for HTTP requests
- [chalk](https://github.com/chalk/chalk) for terminal styling
- [node-schedule](https://github.com/node-schedule/node-schedule) for scheduling
- [yargs](https://github.com/yargs/yargs) for command-line argument parsing
