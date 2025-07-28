# Structured Logging Standards

This document outlines the structured logging standards and practices for the WhatsOnTV project.

## Overview

The WhatsOnTV project uses structured logging with [Pino](https://getpino.io/) to provide consistent, searchable, and contextual logging across all service components. This improves observability, debugging, and monitoring capabilities, especially in Lambda deployments.

## Architecture

### LoggerService Interface

All logging is done through the `LoggerService` interface, which provides:

- `error(context, message)` - Error-level logging
- `warn(context, message)` - Warning-level logging  
- `info(context, message)` - Informational logging
- `debug(context, message)` - Debug-level logging
- `child(context)` - Create child logger with additional context

### Implementations

- **PinoLoggerServiceImpl**: Production implementation using Pino logger
- **MockLoggerServiceImpl**: Test implementation for verification and isolation

## Configuration

### Environment Variables

- `LOG_LEVEL`: Controls log verbosity (`error`, `warn`, `info`, `debug`, `silent`)
- `NODE_ENV`: Determines logging behavior and format

### Environment-Specific Behavior

| Environment | Default Level | Format | Output |
|-------------|---------------|--------|--------|
| `production` | `info` | JSON | Structured logs for monitoring |
| `development` | `debug` | Pretty | Human-readable for debugging |
| `test` | `silent` | JSON | Minimal output during tests |
| Lambda | `info` | JSON | CloudWatch-optimized |

## Usage Guidelines

### When to Use Structured Logging

✅ **Use structured logging for:**
- Service layer error handling
- API request/response tracking
- Lambda function execution
- Background processes
- Production monitoring

❌ **Keep console output for:**
- CLI user interfaces
- Interactive prompts
- Development scripts
- User-facing error messages

### Log Levels

- **ERROR**: System errors, API failures, exceptions
- **WARN**: Recoverable issues, deprecated usage, performance concerns
- **INFO**: Successful operations, key business events, API calls
- **DEBUG**: Detailed execution flow, variable states, development info

### Context Standards

Always include relevant context in log messages:

```typescript
// Good: Structured context
logger.error({
  error: String(error),
  url: 'https://api.example.com/data',
  method: 'GET',
  duration: 1250,
  statusCode: 500,
  stack: error.stack
}, 'API request failed');

// Bad: Unstructured message
logger.error('API failed: ' + error.message);
```

### Required Context Fields

#### For API Calls
- `url`: The endpoint being called
- `method`: HTTP method (GET, POST, etc.)
- `duration`: Request duration in milliseconds
- `statusCode`: HTTP response status
- `error`: Error message (for failures)
- `stack`: Error stack trace (for exceptions)

#### For Business Operations
- `module`: Component/service name
- `operation`: Specific operation being performed
- `duration`: Operation duration
- `resultCount`: Number of items processed
- `filters`: Applied filters or parameters

#### For Lambda Functions
- `requestId`: AWS request ID
- `functionName`: Lambda function name
- `environment`: Deployment environment
- `duration`: Execution time
- `memoryUsed`: Memory consumption

## Implementation Examples

### Service Layer Logging

```typescript
@injectable()
export class MyServiceImpl implements MyService {
  private readonly logger: LoggerService;

  constructor(@inject('LoggerService') logger?: LoggerService) {
    this.logger = logger?.child({ module: 'MyService' }) ?? mockLogger;
  }

  async processData(options: ProcessOptions): Promise<Result[]> {
    const startTime = Date.now();
    
    try {
      const result = await this.externalApi.fetch(options);
      
      // Success logging
      this.logger.info({
        operation: 'processData',
        duration: Date.now() - startTime,
        resultCount: result.length,
        filters: options
      }, 'Successfully processed data');
      
      return result;
    } catch (error) {
      // Error logging
      this.logger.error({
        error: String(error),
        operation: 'processData',
        duration: Date.now() - startTime,
        options,
        stack: error instanceof Error ? error.stack : undefined
      }, 'Failed to process data');
      
      throw error;
    }
  }
}
```

### Lambda Handler Logging

```typescript
export const handler = async (event: APIGatewayEvent): Promise<APIGatewayResponse> => {
  const logger = container.resolve<LoggerService>('LoggerService');
  const requestLogger = logger.child({ 
    requestId: event.requestContext.requestId,
    functionName: process.env.AWS_LAMBDA_FUNCTION_NAME 
  });
  
  const startTime = Date.now();
  
  try {
    requestLogger.info({ event }, 'Lambda execution started');
    
    const result = await processRequest(event);
    
    requestLogger.info({
      duration: Date.now() - startTime,
      statusCode: 200,
      resultSize: JSON.stringify(result).length
    }, 'Lambda execution completed successfully');
    
    return {
      statusCode: 200,
      body: JSON.stringify(result)
    };
  } catch (error) {
    requestLogger.error({
      error: String(error),
      duration: Date.now() - startTime,
      stack: error instanceof Error ? error.stack : undefined
    }, 'Lambda execution failed');
    
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};
```

### HTTP Client Logging

```typescript
// Automatic logging in HTTP client hooks
afterResponse: [
  (request, options, response) => {
    if (response.ok) {
      logger.debug({
        status: response.status,
        url: response.url,
        method: request.method,
        contentLength: response.headers.get('content-length')
      }, 'HTTP request completed successfully');
    } else {
      logger.error({
        status: response.status,
        url: response.url,
        method: request.method,
        headers: Object.fromEntries(response.headers.entries())
      }, 'HTTP request returned error response');
    }
  }
]
```

## Testing

### Mock Logger Usage

```typescript
import { MockLoggerServiceImpl } from '../implementations/test/mockLoggerServiceImpl.js';

describe('MyService', () => {
  let mockLogger: MockLoggerServiceImpl;
  let service: MyService;

  beforeEach(() => {
    mockLogger = new MockLoggerServiceImpl();
    container.registerInstance<LoggerService>('LoggerService', mockLogger);
    service = container.resolve(MyServiceImpl);
  });

  it('should log errors appropriately', async () => {
    // Trigger error condition
    await expect(service.failingOperation()).rejects.toThrow();
    
    // Verify error was logged
    const errorLogs = mockLogger.getLogsByLevel('error');
    expect(errorLogs).toHaveLength(1);
    expect(errorLogs[0].message).toBe('Operation failed');
    expect(errorLogs[0].context).toMatchObject({
      operation: 'failingOperation',
      error: expect.any(String)
    });
  });
});
```

## Monitoring and Observability

### CloudWatch Integration

In AWS Lambda, structured logs automatically integrate with CloudWatch:

```json
{
  "level": "error",
  "time": "2023-12-01T10:30:00.000Z",
  "msg": "API request failed",
  "requestId": "abc-123-def",
  "module": "TvMazeService",
  "error": "Network timeout",
  "url": "https://api.tvmaze.com/schedule",
  "duration": 5000,
  "statusCode": 500
}
```

### Log Queries

Use CloudWatch Insights to query structured logs:

```sql
-- Find all API errors in the last hour
fields @timestamp, msg, error, url, duration
| filter level = "error" and msg like /API/
| sort @timestamp desc
| limit 100

-- Monitor API performance
fields @timestamp, url, duration
| filter level = "info" and msg like /Successfully/
| stats avg(duration), max(duration), count() by url
```

### Alerting

Set up CloudWatch alarms based on structured log data:

- Error rate thresholds
- API response time monitoring  
- Failed Lambda execution alerts
- External service availability

## Best Practices

### Do's
- ✅ Always include timing information (`duration`)
- ✅ Use child loggers for contextual information
- ✅ Log both success and failure cases
- ✅ Include relevant business context
- ✅ Use consistent field names across services
- ✅ Mask sensitive information (tokens, passwords)

### Don'ts
- ❌ Don't log sensitive data (API keys, user passwords)
- ❌ Don't use console.log/error in service layers
- ❌ Don't log at debug level in production
- ❌ Don't include large payloads in logs
- ❌ Don't use string concatenation for log messages

### Performance Considerations

- Use appropriate log levels to control verbosity
- Avoid logging large objects or arrays
- Use lazy evaluation for expensive context computation
- Consider log sampling for high-volume operations

## Migration Guide

### From Console Logging

```typescript
// Before
console.error('API failed:', error);

// After  
logger.error({
  error: String(error),
  operation: 'apiCall',
  stack: error.stack
}, 'API request failed');
```

### Adding to Existing Services

1. Inject `LoggerService` in constructor
2. Create child logger with module context
3. Replace console calls with structured logging
4. Add timing and context information
5. Update tests to use `MockLoggerServiceImpl`

## Troubleshooting

### Common Issues

**Logs not appearing in CloudWatch:**
- Check `LOG_LEVEL` environment variable
- Verify logger is properly injected
- Ensure Lambda has CloudWatch permissions

**Performance impact:**
- Use appropriate log levels
- Avoid logging in tight loops
- Consider async logging for high-volume scenarios

**Test failures:**
- Register `MockLoggerServiceImpl` in test containers
- Update test expectations from console to logger
- Use logger verification methods in tests

## References

- [Pino Documentation](https://getpino.io/)
- [AWS CloudWatch Logs](https://docs.aws.amazon.com/AmazonCloudWatch/latest/logs/)
- [Node.js Logging Best Practices](https://blog.appsignal.com/2021/09/01/best-practices-for-logging-in-nodejs.html)
- [Structured Logging Guide](https://stackify.com/what-is-structured-logging-and-why-developers-need-it/)
