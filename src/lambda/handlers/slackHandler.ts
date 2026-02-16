/**
 * Lambda handler for WhatsOnTV
 * Sends TV show information to Slack on a scheduled basis
 */

import 'reflect-metadata';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { BaseCliApplication } from '../../cli/cliBase.js';
import { container, initializeLambdaContainer } from '../../lambdaContainer.js';
import type { ProcessOutput } from '../../interfaces/processOutput.js';
import type { LoggerService } from '../../interfaces/loggerService.js';
import type { TvShowService } from '../../interfaces/tvShowService.js';
import type { ConfigService } from '../../interfaces/configService.js';
import type { OutputService } from '../../interfaces/outputService.js';
import { registerGlobalErrorHandler, formatError } from '../../utils/errorHandling.js';

// Initialize the Lambda container at the module level
// This ensures it only runs once during cold starts
initializeLambdaContainer();

// Get services for logging and error handling
const processOutput = container.resolve<ProcessOutput>('ProcessOutput');
const logger = container.resolve<LoggerService>('LoggerService');

// Register global error handler
registerGlobalErrorHandler(processOutput);

/**
 * Create a Lambda application instance with all required services
 * @returns A new BaseCliApplication instance configured for Lambda
 */
function createLambdaApp(): BaseCliApplication {
  const tvShowService = container.resolve<TvShowService>('TvShowService');
  const configService = container.resolve<ConfigService>('ConfigService');
  const outputService = container.resolve<OutputService>('SlackOutputService');
  const processOutputFromContainer = container.resolve<ProcessOutput>('ProcessOutput');

  return new BaseCliApplication(
    tvShowService,
    configService,
    processOutputFromContainer,
    outputService
  );
}

/**
 * Lambda handler for scheduled execution
 * @param event Lambda event
 * @param context Lambda context
 * @returns Lambda response
 */
export const handler = async (
  event: APIGatewayProxyEvent,
  context: Context
): Promise<APIGatewayProxyResult> => {
  // Use type assertion for the context object to satisfy the linter
  const typedContext = context as {
    awsRequestId: string;
    getRemainingTimeInMillis: () => number
  };

  // Create child logger with Lambda context for request tracing
  const requestLogger = logger.child({
    requestId: typedContext.awsRequestId,
    functionName: context.functionName,
    functionVersion: context.functionVersion,
    memoryLimit: context.memoryLimitInMB
  });

  // Log execution start with structured data
  requestLogger.info({
    remainingTime: typedContext.getRemainingTimeInMillis(),
    event: {
      httpMethod: event.httpMethod,
      path: event.path,
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      headers: event.headers !== undefined && event.headers !== null
        ? Object.keys(event.headers).length : 0
    }
  }, 'Lambda execution started');

  try {
    // Create the Lambda application
    // Uses LambdaConfigServiceImpl which doesn't depend on yargs
    const startTime = Date.now();
    requestLogger.info('Creating Lambda application');
    const app = createLambdaApp();

    // Run the application
    requestLogger.info('Starting TV show processing and Slack delivery');
    await app.run();
    const executionTime = Date.now() - startTime;

    requestLogger.info({
      executionTime,
      remainingTime: typedContext.getRemainingTimeInMillis()
    }, 'TV shows successfully processed and sent to Slack');

    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'TV shows successfully processed and sent to Slack',
        requestId: typedContext.awsRequestId,
        executionTime
      })
    };
  } catch (error) {
    // Log the error with structured logging
    const errorMessage = formatError(error);
    requestLogger.error({
      error: errorMessage,
      remainingTime: typedContext.getRemainingTimeInMillis(),
      stack: error instanceof Error ? error.stack : undefined
    }, 'Lambda execution failed');

    // Also log to stdout for backwards compatibility
    processOutput.error(`Error processing TV shows: ${errorMessage}`);

    // Return error response
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: formatError(error),
        message: 'Failed to process TV shows',
        requestId: typedContext.awsRequestId
      })
    };
  }
};
