#!/usr/bin/env tsx
/**
 * Test script to validate the compiled Lambda bundle locally
 * This simulates Lambda execution without deploying to AWS
 */

import type { APIGatewayProxyEvent, Context } from 'aws-lambda';

/**
 * Create a mock Lambda event
 */
function createMockEvent(): APIGatewayProxyEvent {
  return {
    body: null,
    headers: {},
    multiValueHeaders: {},
    httpMethod: 'GET',
    isBase64Encoded: false,
    path: '/',
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: '123456789012',
      apiId: 'test-api',
      protocol: 'HTTP/1.1',
      httpMethod: 'GET',
      path: '/',
      stage: 'test',
      requestId: 'test-request-id',
      requestTime: new Date().toISOString(),
      requestTimeEpoch: Date.now(),
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: '127.0.0.1',
        user: null,
        userAgent: 'test-agent',
        userArn: null,
        vpcId: null,
        vpceId: null
      },
      authorizer: null,
      domainName: 'test.execute-api.localhost',
      domainPrefix: 'test',
      resourceId: 'test-resource',
      resourcePath: '/'
    },
    resource: '/'
  };
}

/**
 * Create a mock Lambda context
 */
function createMockContext(): Context {
  return {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'test-function',
    functionVersion: '$LATEST',
    invokedFunctionArn: 'arn:aws:lambda:us-west-2:123456789012:function:test',
    memoryLimitInMB: '256',
    awsRequestId: 'test-request-' + Date.now(),
    logGroupName: '/aws/lambda/test-function',
    logStreamName: '2024/01/01/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {}
  };
}

/**
 * Test the compiled Lambda handler
 */
async function testLambdaBundle(): Promise<void> {
  console.log('🧪 Testing compiled Lambda bundle...\n');

  try {
    // Import the compiled handler from dist/
    console.log('📦 Loading compiled handler from dist/lambda/handlers/slackHandler.js');
    // @ts-expect-error - File will exist after build
    const { handler } = await import('../../dist/lambda/handlers/slackHandler.js');

    if (typeof handler !== 'function') {
      throw new Error('Handler is not a function');
    }

    console.log('✅ Handler loaded successfully\n');

    // Create mock event and context
    const event = createMockEvent();
    const context = createMockContext();

    console.log('🚀 Invoking handler...');
    console.log(`   Request ID: ${context.awsRequestId}`);
    console.log(`   Function: ${context.functionName}\n`);

    // Invoke the handler
    const startTime = Date.now();
    const result = await handler(event, context);
    const duration = Date.now() - startTime;

    console.log('\n✅ Handler execution completed');
    console.log(`   Duration: ${duration}ms`);
    console.log(`   Status Code: ${result.statusCode}`);

    // Parse and display the response
    const body = JSON.parse(result.body);
    console.log('\n📄 Response:');
    console.log(JSON.stringify(body, null, 2));

    // Check if it was successful
    if (result.statusCode === 200) {
      console.log('\n✨ Lambda bundle test PASSED');
      process.exit(0);
    } else {
      console.error('\n❌ Lambda returned non-200 status code');
      process.exit(1);
    }
  } catch (error) {
    console.error('\n❌ Lambda bundle test FAILED');
    console.error('\nError details:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (error.stack) {
        console.error('\nStack trace:');
        console.error(error.stack);
      }
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

// Run the test
testLambdaBundle();
