# What's On TV

[![CI Status](https://github.com/szeller/whatsontv/actions/workflows/ci.yml/badge.svg)](https://github.com/szeller/whatsontv/actions)

A TypeScript CLI tool that fetches TV show schedules from the [TVMaze API](https://www.tvmaze.com/api) and displays them in the terminal or sends them to Slack. Supports filtering by network, type, genre, and language.

## Features

- Fetch TV shows airing on any date from both broadcast networks and streaming services
- Filter by network, show type, genre, and language
- Colorized terminal output grouped by network
- Slack integration with Block Kit formatting
- AWS Lambda deployment for scheduled daily notifications

## Quick Start

```bash
# Clone and install
git clone https://github.com/szeller/whatsontv.git
cd whatsontv
npm install

# Copy and customize config
cp config.json.example config.json

# Run CLI
npm start
```

## Commands

```bash
npm start                  # Show today's TV schedule
npm start -- --date 2025-01-15  # Show schedule for specific date
npm start -- --country GB  # Show schedule for different country
npm run slack              # Send schedule to Slack
```

## Configuration

Create `config.json` from the example:

```json
{
  "country": "US",
  "types": ["Reality", "Scripted"],
  "networks": ["CBS", "Netflix", "Paramount+"],
  "languages": ["English"],
  "slack": {
    "token": "xoxb-your-token",
    "channelId": "C01234ABCDE",
    "username": "WhatsOnTV",
    "icon_emoji": ":tv:"
  }
}
```

| Option | Description |
|--------|-------------|
| `country` | Country code for TV listings (US, GB, etc.) |
| `types` | Show types to include (Scripted, Reality, etc.) |
| `networks` | Networks/streaming services to include |
| `languages` | Languages to filter by |
| `slack.*` | Slack bot configuration (see below) |

## Slack Setup

1. Create a Slack App at [api.slack.com/apps](https://api.slack.com/apps)
2. Add Bot Token Scopes: `chat:write`, `chat:write.public`
3. Install to workspace and copy the Bot User OAuth Token (`xoxb-...`)
4. Get your channel ID from the channel URL (`/archives/C01234ABCDE`)
5. Add credentials to `config.json`

## AWS Lambda Deployment

Deploy as a scheduled Lambda function using AWS CDK:

```bash
# Bootstrap CDK (one-time)
cdk bootstrap

# Deploy to dev
npm run cdk:deploy:dev

# Deploy to prod
npm run cdk:deploy:prod
```

The Lambda runs daily at noon UTC via CloudWatch Events.

## Development

```bash
npm test              # Run tests with coverage
npm run lint          # Run ESLint
npm run ci            # Full CI pipeline (lint + typecheck + test)
```

## Project Structure

```
src/
├── cli/                    # CLI entry points (textCli, slackCli)
├── implementations/        # Service implementations
│   ├── text/               # Console output (Chalk styling)
│   ├── slack/              # Slack output (Block Kit)
│   ├── lambda/             # Lambda-specific config
│   └── pino/               # Structured logging
├── interfaces/             # Service contracts
├── schemas/                # Zod schemas for validation
├── lambda/handlers/        # AWS Lambda handler
├── utils/                  # Utility functions
└── tests/                  # Test suites and fixtures
infrastructure/             # AWS CDK stack
```

## Architecture

- **Clean Architecture**: Interfaces define contracts, implementations are swappable
- **Dependency Injection**: TSyringe containers for console vs Slack modes
- **Schema Validation**: Zod schemas validate API responses and transform to domain models
- **Structured Logging**: Pino logger for Lambda with CloudWatch integration

## License

MIT
