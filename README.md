# What's On TV

[![CI Status](https://github.com/szeller/whatsontv/actions/workflows/ci.yml/badge.svg)](https://github.com/szeller/whatsontv/actions)
[![Dependabot Status](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg)](https://github.com/szeller/whatsontv/blob/main/.github/dependabot.yml)
[![Coverage Status](https://img.shields.io/badge/Coverage-87%25-green.svg)](https://github.com/szeller/whatsontv/actions)

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
   npm start
   
   # Or with specific options
   npm start -- --date 2023-01-15 --country US
   
   # Run as a Slack notification service
   npm run slack
   ```

## Features

- **TV Show Listings**: Fetch and display TV shows airing today
- **Filtering**: Filter shows by type, network, genre, and language
- **Date Selection**: View shows for any specific date
- **Country Selection**: View shows for different countries
- **Slack Integration**: Send formatted show listings to Slack
- **Scheduled Notifications**: Set up daily notifications at a specific time
- **Colorized Output**: Enhanced terminal output with colors and formatting

## CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `--date`, `-d` | Date in YYYY-MM-DD format | Today |
| `--country`, `-c` | Country code (e.g., US, GB) | From config |
| `--config`, `-f` | Path to config file | `./config.json` |
| `--help`, `-h` | Show help | |
| `--version`, `-v` | Show version number | |

## Configuration

The `config.json` file supports the following options:

| Option | Type | Description |
|--------|------|-------------|
| `country` | string | Country code for TV listings |
| `types` | string[] | Show types to include (e.g., "Reality", "Scripted") |
| `networks` | string[] | Networks to include |
| `genres` | string[] | Genres to include |
| `languages` | string[] | Languages to include |
| `notificationTime` | string | Time to send daily notifications (HH:MM) |
| `slack.enabled` | boolean | Whether to enable Slack notifications |
| `slack.channel` | string | Slack channel for notifications |

## Architecture

The application follows clean architecture principles with a strong emphasis on type safety and validation:

### Key Components

- **Domain Layer**: Core business logic and entities
- **Interface Layer**: Abstract contracts for services
- **Implementation Layer**: Concrete implementations of interfaces
- **Schema System**: Zod schemas for validation and type safety
- **Dependency Injection**: Using TSyringe for inversion of control

### Schema System

The application uses [Zod](https://zod.dev/) for runtime validation and type safety:

- **Domain Schemas**: Define the core business entities
- **API Schemas**: Validate external API responses
- **Runtime Validation**: Ensure data integrity beyond compile-time checks
- **Type Inference**: Generate TypeScript types from schemas

For more details, see the [schema documentation](./src/schemas/README.md).

## Project Structure

```
src/
├── interfaces/            # Interface definitions
├── implementations/       # Interface implementations
│   ├── console/           # Console-specific implementations
│   └── slack/             # Slack-specific implementations
├── schemas/               # Zod schemas for validation and types
│   ├── common.ts          # Common utility schemas
│   ├── domain.ts          # Domain model schemas
│   └── tvmaze.ts          # TVMaze API schemas
├── utils/                 # Utility functions and helpers
├── cli.ts                 # CLI entry point
└── slack.ts               # Slack entry point
```

## Development

### Building

```bash
npm run build
```

### Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run tests in watch mode
npm run test:watch
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- [TVMaze API](https://www.tvmaze.com/api) for providing TV show data
- [Zod](https://zod.dev/) for schema validation and type safety
- [TSyringe](https://github.com/microsoft/tsyringe) for dependency injection
