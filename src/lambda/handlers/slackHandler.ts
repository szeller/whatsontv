/**
 * Lambda handler for WhatsOnTV
 * Sends TV show information to Slack on a scheduled basis
 */

import 'reflect-metadata';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createSlackApp } from '../../cli/slackCli.js';
import { container, initializeSlackContainer } from '../../slackContainer.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import type { LoggerService } from '../../interfaces/loggerService.js';
import { registerGlobalErrorHandler, formatError } from '../../utils/errorHandling.js';

// Initialize the Slack container at the module level
// This ensures it only runs once during cold starts
initializeSlackContainer();

// Get services for logging and error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');
const logger = container.resolve<LoggerService>('LoggerService');

// Register global error handler
registerGlobalErrorHandler(consoleOutput);

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
      headers: event.headers !== null && event.headers !== undefined ?
        Object.keys(event.headers).length : 0
    }
  }, 'Lambda execution started');
  
  try {
    // Create the Slack application using the existing factory
    // This will validate environment variables through ConfigService
    const startTime = Date.now();
    requestLogger.info('Creating Slack application with environment validation');
    const app = createSlackApp();
    
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
    
    // Also log to console for backwards compatibility
    consoleOutput.error(`Error processing TV shows: ${errorMessage}`);
    
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
