# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
```bash
npm start                  # Run CLI tool (console output)
npm run slack             # Run Slack notification service
npm run shows             # Alias for npm start
```

### Building
```bash
npm run build             # Build declarations only (main tsconfig)
npm run build:lambda      # Build Lambda function with JS output (tsconfig.lambda.json)
npm run typecheck         # Run TypeScript compiler without emitting files
```

### Testing
```bash
npm test                  # Run tests with coverage (text, lcov, json-summary)
npm run test:no-coverage  # Run tests without coverage
```

Coverage thresholds enforced: 75% for branches, functions, lines, and statements.

### Linting
```bash
npm run lint              # Run ESLint on all TypeScript files
npm run lint:fix          # Run ESLint with auto-fix
```

### CI/CD
```bash
npm run ci                # Run full CI pipeline (lint + typecheck + test)
npm run precommit         # Pre-commit hook (lint + typecheck + test without coverage)
```

### AWS Lambda Deployment
```bash
npm run cdk:deploy        # Deploy to default stack (builds Lambda first)
npm run cdk:deploy:dev    # Deploy to dev environment
npm run cdk:deploy:prod   # Deploy to prod environment
npm run cdk:diff          # Preview infrastructure changes
npm run cdk:synth         # Synthesize CloudFormation template
```

Required environment variables for CDK deployment:
- `DEV_SLACK_TOKEN` and `DEV_SLACK_CHANNEL` for dev environment
- `PROD_SLACK_TOKEN` and `PROD_SLACK_CHANNEL` for prod environment
- `OPERATIONS_EMAIL` (optional) for CloudWatch alarm notifications

## Dependency Management

### Updating npm Dependencies

When updating dependencies (e.g., when Dependabot PRs accumulate), follow this process:

**1. Create feature branch**
```bash
git checkout -b chore/dependency-updates-$(date +%Y%m%d)
```

**2. Initial clean install and validation**
```bash
# Remove existing dependencies
rm -rf node_modules package-lock.json

# Fresh install
npm install

# Run full CI
npm run ci
```

**3. First commit (regenerated lockfile)**
```bash
git add package-lock.json
git commit --no-verify -m "chore(deps): regenerate lockfile with fresh npm install"
```

**4. Check for outdated packages**
```bash
npm outdated
```

**5. Update package.json versions**
- Update version numbers for outdated packages
- Prefer minor/patch updates; evaluate major updates carefully

**6. Repeat clean install cycle**
```bash
# Remove and reinstall
rm -rf node_modules package-lock.json
npm install

# Validate
npm run ci
```

**7. Second commit (updated versions)**
```bash
git add package.json package-lock.json
git commit --no-verify -m "chore(deps): update [package names]

Updates:
- package1: x.y.z → a.b.c
- package2: x.y.z → a.b.c

All tests passing with updated dependencies"
```

**8. Repeat steps 4-7 until `npm outdated` shows no updates**

**9. Create PR**
```bash
git push -u origin HEAD
gh pr create --title "chore(deps): update dependencies to latest versions" --body "..."
```

**Important Notes**:
- `FORCE_COLOR=3` is built into the test scripts (forces Chalk to emit ANSI codes even without TTY)
- Use `--no-verify` flag on commits to skip pre-commit hooks (avoids TTY issues during automation)
- Test coverage must remain above 75% threshold
- All 595 tests must pass before committing

## Architecture

### Clean Architecture Layers

The codebase follows clean architecture principles with clear separation of concerns:

**Interfaces Layer** (`src/interfaces/`): Abstract contracts defining behavior
- `TvShowService`: Fetch TV show data
- `OutputService`: Display/send show data
- `ShowFormatter`: Format show data for output
- `HttpClient`: HTTP requests
- `ConfigService`: Configuration management
- `SlackClient`: Slack API interactions
- `ConsoleOutput`: Console I/O operations
- `StyleService`: Terminal styling
- `LoggerService`: Structured logging

**Implementations Layer** (`src/implementations/`):
- `console/`: Console-specific implementations (ChalkStyleService, ConsoleOutput, TextShowFormatter, etc.)
- `slack/`: Slack-specific implementations (SlackClient, SlackShowFormatter, SlackOutputService)
- `test/`: Test-only implementations (PlainStyleService, TestConfigService, MockLoggerService)
- Root-level: Shared implementations (TvMazeService, FetchHttpClient, BaseShowFormatter)

**Domain Layer** (`src/schemas/domain.ts`): Core business entities (Show, Network, etc.)

### Dependency Injection with TSyringe

The application uses TSyringe for IoC with separate container configurations:

**Console Container** (`src/container.ts`): Used by `src/cli/consoleCli.ts`
- Registers console-specific services (ChalkStyleService, ConsoleOutput, TextShowFormatter)
- Platform type: 'console'

**Slack Container** (`src/slackContainer.ts`): Used by `src/cli/slackCli.ts` and Lambda handler
- Registers Slack-specific services (SlackClient, SlackShowFormatter, SlackOutputService)
- Platform type: 'slack'
- Includes WebClientFactory for creating Slack WebClient instances

**Key Pattern**: Each CLI entry point uses its own container, resolved at startup. The Lambda handler initializes the Slack container once during cold start for optimal performance.

### Schema System (Zod)

All data validation and transformation uses Zod schemas for runtime type safety:

**Schema Files**:
- `src/schemas/common.ts`: Utility schemas and transformers
- `src/schemas/domain.ts`: Internal domain model (Show, NetworkGroups)
- `src/schemas/tvmaze.ts`: TVMaze API schemas and transformation schemas
- `src/schemas/http.ts`: HTTP-related schemas

**Transformation Pattern**: API responses are transformed to domain models using Zod's `.transform()` method:
```typescript
networkScheduleToShowSchema.parse(apiData) // Returns domain Show object
```

This eliminates manual type conversions and centralizes transformation logic in schemas. See `src/schemas/README.md` for detailed documentation.

### Multi-Platform Architecture

The application supports two execution modes with shared business logic:

**Console Mode**: Interactive CLI tool with colored terminal output
- Entry point: `src/cli/consoleCli.ts`
- Container: `src/container.ts`
- Uses: ChalkStyleService, ConsoleOutput, TextShowFormatter

**Slack Mode**: Automated Slack notifications
- Entry points: `src/cli/slackCli.ts` (local), `src/lambda/handlers/slackHandler.ts` (Lambda)
- Container: `src/slackContainer.ts`
- Uses: SlackClient, SlackShowFormatter, SlackOutputService

**Shared**: TvMazeService, schemas, utilities, and base formatters are platform-agnostic.

### Lambda Deployment

**Handler**: `src/lambda/handlers/slackHandler.ts`
- Initializes Slack container at module level (cold start optimization)
- Uses structured logging with Pino
- Includes request tracing with Lambda context

**Build Process**:
- Uses separate `tsconfig.lambda.json` that emits JavaScript to `dist/lambda/`
- Lambda excludes test files and prototypes
- Runtime: Node.js 22.x
- Handler path: `lambda/handlers/slackHandler.handler`

**Infrastructure** (`infrastructure/whatsontv-stack.ts`):
- Creates Lambda function with 30s timeout, 256MB memory
- CloudWatch Events rule for daily execution (noon UTC)
- CloudWatch alarms for errors and duration
- SNS topic for operational notifications
- Separate stacks for dev and prod environments

**CDK Entry**: `cdk.ts` creates WhatsOnTvDev and WhatsOnTvProd stacks

## Testing Infrastructure

### Test Organization

Tests follow a comprehensive structure in `src/tests/`:
- `fixtures/`: Reusable test data (domain models, TVMaze responses)
- `mocks/`: Mock implementations and factories
- `testutils/`: Test helpers and utilities
- `integration/`: Integration tests
- Individual test files co-located with tested modules (e.g., `src/utils/dateUtils.test.ts`)

### Test Utilities

**Factories** (`src/tests/mocks/factories/`): Create mock instances of services
- `httpClientFactory`, `tvShowServiceFactory`, `outputServiceFactory`, etc.
- Support configurable behavior for different test scenarios

**Fixtures** (`src/tests/fixtures/`):
- `showFixtureBuilder`: Fluent API for building test Show objects
- Pre-built fixtures for common scenarios (networks, shows)
- Validation tests ensure fixtures match schemas

**Test Helpers**:
- `containerHelpers`: DI container setup for tests
- `mockHttpClient`: HTTP request/response mocking with nock
- `consoleTestHelpers`: Capture and verify console output

### Testing Approach

- **Pure Functions**: Test directly without mocking
- **Service Testing**: Use factories to create mocks with controlled behavior
- **Edge Cases**: Comprehensive testing of error handling, null/undefined, and boundary conditions
- **Schema Validation**: Fixtures validated against Zod schemas to ensure test data integrity

## TypeScript Configuration

Three separate TypeScript configs:
- `tsconfig.json`: Main config (declarations only, excludes tests)
- `tsconfig.lambda.json`: Lambda build (emits JS, excludes tests)
- `tsconfig.test.json`: Test configuration (referenced by Jest)

All use `NodeNext` module resolution for ESM support.

## Key Implementation Notes

### ESM Modules
- All imports use `.js` extensions (required for ESM)
- `package.json` has `"type": "module"`
- Jest configured with `extensionsToTreatAsEsm` and module name mapping

### Error Handling
- Global error handler registered in CLI entry points and Lambda handler
- `formatError` utility for consistent error messages
- Structured logging with Pino in Lambda (includes request tracing)

### Configuration
- `config.json`: Application settings (filters, Slack config, etc.)
- `.env`: Environment variables for local development
- CDK stack reads environment variables for Lambda configuration

### Styling and Formatting
- Console: Chalk for colored output via ChalkStyleService
- Slack: Block Kit formatting via SlackShowFormatter
- ESLint enforces: single quotes, semicolons, 2-space indent, 100 char width, explicit function return types
