/**
 * Lambda handler for WhatsOnTV
 * Sends TV show information to Slack on a scheduled basis
 */

import 'reflect-metadata';
import type { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { createSlackApp } from '../../cli/slackCli.js';
import { container, initializeSlackContainer } from '../../slackContainer.js';
import type { ConsoleOutput } from '../../interfaces/consoleOutput.js';
import { registerGlobalErrorHandler, formatError } from '../../utils/errorHandling.js';

// Initialize the Slack container at the module level
// This ensures it only runs once during cold starts
initializeSlackContainer();

// Get ConsoleOutput service for error handling
const consoleOutput = container.resolve<ConsoleOutput>('ConsoleOutput');

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
  
  // Log execution with request ID and remaining time
  consoleOutput.log(`Lambda execution started - Request ID: ${typedContext.awsRequestId}`);
  consoleOutput.log(`Remaining time: ${typedContext.getRemainingTimeInMillis()}ms`);
  
  try {
    // Create the Slack application using the existing factory
    const app = createSlackApp();
    
    // Run the application
    await app.run();
    
    // Return success response
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'TV shows successfully processed and sent to Slack',
        requestId: typedContext.awsRequestId
      })
    };
  } catch (error) {
    // Log the error
    consoleOutput.error(`Error processing TV shows: ${formatError(error)}`);
    
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
