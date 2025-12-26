# What's On TV

[![CI Status](https://github.com/szeller/whatsontv/actions/workflows/ci.yml/badge.svg)](https://github.com/szeller/whatsontv/actions)
[![Dependabot Status](https://img.shields.io/badge/Dependabot-enabled-brightgreen.svg)](https://github.com/szeller/whatsontv/blob/main/.github/dependabot.yml)


## Overview

A TypeScript application that fetches TV shows for the current day and sends notifications to a specified Slack channel using the TVMaze API. It supports filtering shows by type, network, genre, and language. It can be used both as a CLI tool and a Slack notification service.

## 🚀 Quick Start with GitHub Codespaces + AI

**Get productive in 2 minutes with Claude CLI + GitHub Copilot!**

[![Open in GitHub Codespaces](https://github.com/codespaces/badge.svg)](https://codespaces.new/szeller/whatsontv)

✨ **Optimized AI Workflow**:
- 🧠 **Claude CLI** for vibe coding (exploration, architecture, debugging)
- ✏️ **GitHub Copilot** for manual editing (implementation, completions)
- ⚡ **Automatic setup** - everything configured in 3 minutes

📖 **Quick Reference**: See [`CODESPACES-QUICKSTART.md`](CODESPACES-QUICKSTART.md) for instant productivity tips!

---

## Prerequisites

- Node.js 18.18.0+
- Slack Bot Token (optional, only needed for Slack notifications)


## Setup

1. Clone the repository

```bash
git clone https://github.com/szeller/whatsontv.git
cd whatsontv
```

2. Install dependencies:

```bash
npm install
```

3. Create a `.env` file with the following variables (only needed for Slack notifications):

```bash
SLACK_TOKEN=xoxb-your-slack-bot-token
SLACK_CHANNEL=C01234ABCDE
SLACK_USERNAME=WhatsOnTV
```

4. Copy the example config file and customize it:

```bash
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
        "token": "xoxb-your-token-here",
        "channelId": "C01234ABCDE",
        "username": "WhatsOnTV",
        "icon_emoji": ":tv:",
        "dateFormat": "dddd, MMMM D, YYYY"
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

## Slack Integration Setup

To use the Slack integration, you'll need to create a Slack App and obtain the necessary credentials:

### 1. Create a Slack App

1. Go to [https://api.slack.com/apps](https://api.slack.com/apps)
2. Click "Create New App"
3. Choose "From scratch"
4. Name your app (e.g., "WhatsOnTV") and select your workspace
5. Click "Create App"

### 2. Configure Bot Permissions

1. In the left sidebar, click on "OAuth & Permissions"
2. Scroll down to "Bot Token Scopes" and add the following permissions:
   - `chat:write` (to send messages)
   - `chat:write.public` (to send messages to channels the bot isn't in)
   - `channels:read` (to see channel information)

### 3. Install the App to Your Workspace

1. Scroll up to the top of the "OAuth & Permissions" page
2. Click "Install to Workspace"
3. Review the permissions and click "Allow"

### 4. Get Your Bot Token

1. After installation, you'll be redirected to the "OAuth & Permissions" page
2. Copy the "Bot User OAuth Token" that starts with `xoxb-`
3. This is your `SLACK_TOKEN` value for the `.env` file

### 5. Get Your Channel ID

1. Open Slack in your browser or desktop app
2. Right-click on the channel you want to send messages to
3. Select "Copy link" 
4. The link will look like `https://yourworkspace.slack.com/archives/C01234ABCDE`
5. The part after the last `/` is your channel ID (e.g., `C01234ABCDE`)
6. This is your `SLACK_CHANNEL` value for the `.env` file

### 6. Configure Your Application

Add these credentials to your `.env` file as shown in the Setup section:

```
SLACK_TOKEN=xoxb-your-token-here
SLACK_CHANNEL=your-channel-id
SLACK_USERNAME=WhatsOnTV
```

### 7. Run the Slack Integration

```bash
npm run slack
```

### Security Considerations

- **Never commit your Slack token to version control**
- Use environment variables or a secure configuration management system
- Consider using a `.env.example` file to show the required variables without actual values
- If you accidentally expose your token, regenerate it immediately in the Slack API dashboard

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
| `slack.token` | string | Slack bot token (starts with xoxb-) |
| `slack.channelId` | string | Slack channel ID (e.g., "C01234ABCDE") |
| `slack.username` | string | Name to display for bot messages |
| `slack.icon_emoji` | string | Emoji to use as bot icon (e.g., ":tv:") |
| `slack.dateFormat` | string | Format for dates in messages |


## Architecture

The application follows clean architecture principles with a strong emphasis on type safety and validation:

### Key Components

- **Domain Layer**: Core business logic and entities
- **Interface Layer**: Abstract contracts for services
- **Implementation Layer**: Concrete implementations of interfaces
- **Schema System**: Zod schemas for validation, transformation, and type safety
- **Dependency Injection**: Using TSyringe for inversion of control
- **Data Transformation**: Declarative transformation of external API data to domain models


### Schema System

The application uses [Zod](https://zod.dev/) for runtime validation, transformation, and type safety:

- **Domain Schemas**: Define the core business entities
- **API Schemas**: Validate external API responses
- **Transformation Schemas**: Convert API data to domain models
- **Runtime Validation**: Ensure data integrity beyond compile-time checks
- **Type Inference**: Generate TypeScript types from schemas
- **Default Values**: Handle missing or null data gracefully

For more details, see the [schema documentation](./src/schemas/README.md).


## Project Structure

```typescript
src/
├── interfaces/            # Interface definitions
├── implementations/       # Interface implementations
│   ├── console/           # Console-specific implementations
│   └── slack/             # Slack-specific implementations
├── schemas/               # Zod schemas for validation and types
│   ├── common.ts          # Common utility schemas
│   ├── domain.ts          # Domain model schemas
│   └── tvmaze.ts          # TVMaze API schemas and transformations
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

# Run linting
npm run lint

# Run type checking
npm run typecheck
```

### Testing Strategy

The project follows a comprehensive testing strategy with a focus on high code coverage:

- **Unit Testing**: All core components and utilities are unit tested
- **Test Coverage**: Aiming for 80% coverage across statements, branches, functions, and lines
- **Pure Function Testing**: Direct testing of pure functions without complex mocking
- **Pragmatic Mocking**: Using Jest's spyOn for mocking when necessary
- **Edge Case Testing**: Comprehensive testing of error handling and edge cases

Recent improvements include achieving 100% test coverage for the `fileUtils.ts` module by implementing focused tests for pure functions and edge cases.

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
