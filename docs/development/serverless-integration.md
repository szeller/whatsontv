# Serverless Framework Integration Plan

## Overview

This document outlines the implementation plan for integrating Serverless Framework v4 with whatsontv to enable scheduled Lambda executions that post TV show updates to Slack. This implementation addresses GitHub issue #8.

## Objectives

1. Configure Serverless Framework v4 for the whatsontv application
2. Create a daily scheduled Lambda function that fetches TV show data
3. Integrate with the existing Slack implementation
4. Deploy to AWS with appropriate IAM permissions
5. Implement monitoring and logging

## Serverless Framework v4 Features to Leverage

### 1. TypeScript Support

Serverless Framework v4 now includes native TypeScript support with ESBuild integration, which aligns perfectly with our TypeScript-based project:

- Automatic TypeScript compilation during deployment
- Sourcemap support for easier debugging
- Optimized bundle size with tree-shaking and minification

### 2. Scheduled Events

We'll use CloudWatch Events (EventBridge) for scheduling the daily job:

```yaml
functions:
  dailyShowUpdates:
    handler: src/handlers/dailyShowUpdates.handler
    events:
      - schedule: cron(0 12 * * ? *) # Run at 12:00 PM UTC daily
```

### 3. Multi-stage Deployment

Using the new stages property for environment-specific configurations:

```yaml
stages:
  prod:
    params:
      SLACK_TOKEN: ${env:PROD_SLACK_TOKEN}
      SLACK_CHANNEL: ${env:PROD_SLACK_CHANNEL}
  dev:
    params:
      SLACK_TOKEN: ${env:DEV_SLACK_TOKEN}
      SLACK_CHANNEL: ${env:DEV_SLACK_CHANNEL}
```

### 4. Enhanced Logging

Implementing structured JSON logging for better observability:

```yaml
provider:
  name: aws
  logs:
    lambda:
      logFormat: JSON
      applicationLogLevel: INFO
```

## Implementation Steps

### Phase 1: Basic Serverless Setup

1. Install Serverless Framework v4
   ```bash
   npm install -g serverless@latest
   ```

2. Create serverless.yml configuration
   ```yaml
   service: whatsontv
   
   frameworkVersion: '4'
   
   provider:
     name: aws
     runtime: nodejs18.x
     region: us-west-2
     memorySize: 256
     timeout: 30
     logRetentionInDays: 14
     environment:
       NODE_ENV: ${opt:stage, 'dev'}
   
   functions:
     dailyShowUpdates:
       handler: src/handlers/dailyShowUpdates.handler
       events:
         - schedule: cron(0 12 * * ? *) # Noon UTC daily
       environment:
         SLACK_TOKEN: ${param:SLACK_TOKEN}
         SLACK_CHANNEL: ${param:SLACK_CHANNEL}
         SLACK_USERNAME: "WhatsOnTV Bot"
         SLACK_ICON_EMOJI: ":tv:"
   
   stages:
     prod:
       params:
         SLACK_TOKEN: ${env:PROD_SLACK_TOKEN}
         SLACK_CHANNEL: ${env:PROD_SLACK_CHANNEL}
     dev:
       params:
         SLACK_TOKEN: ${env:DEV_SLACK_TOKEN}
         SLACK_CHANNEL: ${env:DEV_SLACK_CHANNEL}
   
   build:
     esbuild:
       bundle: true
       minify: false
       sourcemap: true
       exclude:
         - aws-sdk
       external:
         - '@aws-sdk/*'
   ```

3. Create Lambda handler adapter
   - Create a new Lambda handler that interfaces with our existing architecture
   - Adapt the dependency injection container for serverless context

### Phase 2: Lambda Adaptation

1. Create Lambda-specific entry point for the application
   - Create `src/handlers/dailyShowUpdates.ts` to serve as the Lambda entry point
   - Reuse existing code by adapting the output to go to Slack instead of console

2. Create serverless-specific config service implementation
   - Extend or adapt `ConsoleConfigServiceImpl` to work in a Lambda environment
   - Handle environment variables appropriately

3. Create Lambda context service
   - Implement logging with Lambda context
   - Ensure proper error handling and reporting

### Phase 3: Deployment and Testing

1. Set up local testing of the Lambda function
   - Use `serverless invoke local` for testing
   - Create test events for local invocation

2. Configure CI/CD pipeline
   - Create a new GitHub Actions workflow file `.github/workflows/deploy.yml`
   - Define the workflow to trigger on push events to the main branch
   - Use the `actions/checkout` action to check out the repository code
   - Use the `actions/setup-node` action to set up the Node.js environment
   - Install dependencies using `npm install`
   - Deploy to AWS using `serverless deploy --stage dev`
   - Use the `actions/upload-artifact` action to upload the deployment logs as an artifact

```yml
name: Deploy WhatsOnTV

on:
  push:
    branches:
      - main

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Run tests
        run: npm test

      - name: Install Serverless Framework
        run: npm install -g serverless@latest

      - name: Deploy to AWS (Dev)
        if: success() && github.ref == 'refs/heads/main'
        run: serverless deploy --stage dev
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          DEV_SLACK_TOKEN: ${{ secrets.DEV_SLACK_TOKEN }}
          DEV_SLACK_CHANNEL: ${{ secrets.DEV_SLACK_CHANNEL }}

      - name: Verify Dev Deployment
        if: success()
        run: |
          # Invoke the function and verify it works
          serverless invoke --function dailyShowUpdates --stage dev

      - name: Deploy to AWS (Prod)
        if: success()
        run: serverless deploy --stage prod
        env:
          AWS_ACCESS_KEY_ID: ${{ secrets.AWS_ACCESS_KEY_ID }}
          AWS_SECRET_ACCESS_KEY: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          PROD_SLACK_TOKEN: ${{ secrets.PROD_SLACK_TOKEN }}
          PROD_SLACK_CHANNEL: ${{ secrets.PROD_SLACK_CHANNEL }}
```

3. Secrets Management
   - Store all sensitive information (API keys, tokens) in GitHub Secrets
   - Configure AWS IAM with least privilege permissions for deployment
   - Create an AWS IAM user specifically for CI/CD deployment with:
     - `CloudFormationFullAccess`
     - `IAMFullAccess`
     - `LambdaFullAccess`
     - `CloudWatchLogsFullAccess`
     - `S3FullAccess`
     - `APIGatewayAdministrator` (if adding API endpoints later)

4. Enable Rollback Configuration
   - Update `serverless.yml` to include rollback configuration:

```yaml
provider:
  name: aws
  deploymentMethod: direct
  rollbackConfiguration:
    rollbackEnabled: true
    monitoringTime: 60
```

### Phase 4: Monitoring and Maintenance

1. Set up CloudWatch alarms
   - Create alarms for Lambda failures
   - Monitor execution duration and memory usage
   - Set up alerts for error rate thresholds
   - Add the following to `serverless.yml`:

```yaml
resources:
  Resources:
    LambdaErrorsAlarm:
      Type: AWS::CloudWatch::Alarm
      Properties:
        AlarmName: ${self:service}-${opt:stage, 'dev'}-lambda-errors
        AlarmDescription: "Lambda function errors > 0"
        MetricName: Errors
        Namespace: AWS/Lambda
        Dimensions:
          - Name: FunctionName
            Value: ${self:service}-${opt:stage, 'dev'}-dailyShowUpdates
        Statistic: Sum
        Period: 300
        EvaluationPeriods: 1
        Threshold: 0
        ComparisonOperator: GreaterThanThreshold
        TreatMissingData: notBreaching
        ActionsEnabled: true
        AlarmActions:
          - !Ref OperationsNotificationTopic
    
    OperationsNotificationTopic:
      Type: AWS::SNS::Topic
      Properties:
        TopicName: ${self:service}-${opt:stage, 'dev'}-operations
        DisplayName: WhatsOnTV Operations
        Subscription:
          - Protocol: email
            Endpoint: ${param:OPERATIONS_EMAIL}
```

2. Log Retention and Analysis
   - Configure log retention periods to control costs
   - Set up CloudWatch Logs Insights queries for troubleshooting
   - Example query for error analysis:

```
fields @timestamp, @message
| filter level = "error"
| sort @timestamp desc
| limit 100
```

3. Implement Health Checks
   - Add an optional health check endpoint to verify service status
   - Configure CloudWatch synthetics canary to periodically invoke the function
   - Add the following to your Lambda handler to support health checks:

```typescript
// Health check handling
if (event?.requestContext?.http?.path === '/health') {
  return {
    statusCode: 200,
    body: JSON.stringify({ status: 'healthy' })
  };
}
```

4. Document operational procedures
   - Deployment process with rollback instructions
   - Log analysis procedures for common issues
   - Create runbooks for incident response
   - Update README.md with operational guidelines

## Architecture Adjustments

The current architecture will need minimal changes to support serverless execution:

1. Create a Lambda-specific container setup:
   ```typescript
   // src/handlers/container.ts
   import { container } from '../container';
   import { SlackOutputService } from '../interfaces/slackOutputService';
   
   // Configure container with Lambda-specific implementations
   export function setupLambdaContainer(): void {
     // Override any necessary services for Lambda environment
     container.register('ConfigService', { useClass: LambdaConfigServiceImpl });
     container.register('OutputService', { useClass: SlackOutputServiceImpl });
   }
   ```

2. Lambda handler implementation:
   ```typescript
   // src/handlers/dailyShowUpdates.ts
   import { APIGatewayProxyHandler } from 'aws-lambda';
   import { container } from '../container';
   import { setupLambdaContainer } from './container';
   import { TvShowService } from '../interfaces/tvShowService';
   import { OutputService } from '../interfaces/outputService';
   import { ConfigService } from '../interfaces/configService';
   
   // Set up the container with Lambda-specific configurations
   setupLambdaContainer();
   
   export const handler: APIGatewayProxyHandler = async (event, context) => {
     try {
       // Get services from container
       const tvShowService = container.resolve<TvShowService>('TvShowService');
       const configService = container.resolve<ConfigService>('ConfigService');
       const outputService = container.resolve<OutputService>('OutputService');
       
       // Get configuration options
       const showOptions = configService.getShowOptions();
       
       // Fetch shows
       const shows = await tvShowService.getShows(showOptions);
       
       // Output to Slack
       await outputService.renderOutput(shows);
       
       return {
         statusCode: 200,
         body: JSON.stringify({ message: 'Shows successfully processed and sent to Slack' }),
       };
     } catch (error) {
       console.error('Error processing shows:', error);
       return {
         statusCode: 500,
         body: JSON.stringify({ error: 'Failed to process shows' }),
       };
     }
   };
   ```

## Timeline

- **Week 1**: Basic serverless configuration and Lambda handler setup
- **Week 2**: Testing and integration with existing code
- **Week 3**: Deployment pipeline and monitoring setup
- **Week 4**: Production deployment and documentation

## Resources

- [Serverless Framework v4 Documentation](https://www.serverless.com/framework/docs/)
- [AWS Lambda Best Practices](https://docs.aws.amazon.com/lambda/latest/dg/best-practices.html)
- [Serverless TypeScript Setup](https://www.serverless.com/framework/docs/providers/aws/guide/typescript/)
- [Scheduled Events in AWS Lambda](https://www.serverless.com/framework/docs/providers/aws/events/schedule/)
