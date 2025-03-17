# What's On TV - Technical Specification

## Project Overview

What's On TV is a TypeScript-based CLI application and Slack notification service that helps users track TV show schedules. It integrates with the TVMaze API to fetch show information and can be used either as a command-line tool for immediate queries or as a scheduled service that sends daily notifications to Slack.

## Goals and Objectives

### Primary Goals
1. Provide real-time access to TV show schedules through a CLI interface
2. Deliver automated daily show notifications via Slack
3. Support flexible filtering of shows based on user preferences
4. Maintain high code quality and type safety through TypeScript

### Non-Goals
1. Providing a web interface
2. Supporting multiple notification platforms (focused on Slack)
3. Storing historical show data
4. User authentication/authorization

## Architecture

### System Components

1. **CLI Interface** (`src/cli.ts`)
   - Handles command-line argument parsing using `yargs`
   - Provides immediate feedback for show queries
   - Supports various filtering options

2. **Slack Notifier** (`src/slack.ts`)
   - Manages scheduled notifications using `node-schedule`
   - Formats and sends messages to Slack
   - Handles retry logic and error reporting

3. **TV Show Service** (`src/services/tvShowService.ts`)
   - Core business logic for fetching and processing show data
   - Implements filtering and sorting functionality
   - Handles API communication with TVMaze

4. **Configuration Management** (`src/config.ts`)
   - Manages user preferences and settings
   - Supports both default and user-override configurations
   - Handles environment variables for sensitive data

### Data Flow

```mermaid
graph TD
    A[CLI/Slack Entry Points] --> B[TV Show Service]
    B --> C[TVMaze API]
    C --> B
    B --> D[Data Processing]
    D --> E[Output Formatting]
    E --> F[CLI Output/Slack Message]
```

## Technical Decisions

### Language Choice
- **TypeScript**: Chosen for type safety, better developer experience, and improved maintainability
- **ESM Modules**: Modern JavaScript module system for better tree-shaking and future compatibility

### External Dependencies
1. **API Communication**
   - `axios`: Robust HTTP client with TypeScript support
   - No API key required for TVMaze

2. **CLI Interface**
   - `yargs`: Feature-rich command-line argument parser
   - `chalk`: Terminal string styling

3. **Slack Integration**
   - `@slack/web-api`: Official Slack client
   - `node-schedule`: Cron-like job scheduler

### Type System

1. **Show Types** (`src/types/tvmaze.ts`)
   - Comprehensive type definitions for TVMaze API responses
   - Custom types for internal show representation
   - Strong typing for filtering options

2. **Configuration Types** (`src/types/config.ts`)
   - Type-safe configuration options
   - Environment variable definitions
   - Slack configuration types

## Testing Strategy

1. **Unit Tests**
   - Jest as the testing framework
   - Focus on business logic in services
   - Mocked external dependencies

2. **Integration Tests**
   - API integration tests with TVMaze
   - Slack message delivery verification
   - Configuration loading tests

3. **Test Coverage**
   - Aim for high coverage of core business logic
   - Mock console output in tests
   - Error handling verification

## Error Handling

1. **API Errors**
   - Graceful handling of TVMaze API failures
   - Retry logic for transient failures
   - Clear error messages for users

2. **Configuration Errors**
   - Validation of user configuration
   - Sensible defaults for missing options
   - Environment variable checking

3. **Runtime Errors**
   - Graceful degradation on failures
   - Detailed error logging
   - User-friendly error messages

## Future Considerations

### Potential Enhancements
1. Support for additional TV data sources
2. More notification platforms (Discord, Email)
3. Personal watch list management
4. Show recommendations based on preferences
5. Integration with streaming service availability

### Technical Debt
1. Regular dependency updates
2. Monitoring of TVMaze API changes
3. Performance optimization for large result sets
4. Enhanced error reporting

## Development Workflow

1. **Version Control**
   - Git for source control
   - Feature branches for development
   - Pull request workflow

2. **Code Quality**
   - ESLint for code style
   - Prettier for formatting
   - TypeScript strict mode

3. **Deployment**
   - npm scripts for common tasks
   - Build process using `tsc`
   - Clean build directory management

## Documentation

1. **Code Documentation**
   - TSDoc comments for public APIs
   - Clear function and type documentation
   - Examples in comments for complex logic

2. **Project Documentation**
   - README.md for user guide
   - TechSpec.md for technical documentation
   - Inline comments for implementation details

## Maintenance

1. **Dependency Management**
   - Regular updates of dependencies
   - Security vulnerability monitoring
   - Compatibility testing

2. **Monitoring**
   - Error logging
   - Usage statistics
   - API response times

3. **Updates**
   - Regular review of TVMaze API changes
   - TypeScript and Node.js version updates
   - Security patches
