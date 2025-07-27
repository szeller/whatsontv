# AWS CDK Migration Guide

## Overview

This document outlines the migration from Serverless Framework to AWS CDK for the WhatsOnTV Lambda deployment. The CDK approach provides better TypeScript integration and prepares the project for future AWS service integrations like Bedrock.

## Migration Completed

### 1. CDK Infrastructure Setup
- **CDK App**: `cdk.ts` - Entry point for CDK application
- **Stack Implementation**: `infrastructure/whatsontv-stack.ts` - Main infrastructure stack
- **Configuration**: `cdk.json` - CDK configuration with TypeScript support

### 2. Lambda Function Configuration
- **Handler**: Preserved existing `src/lambda/handlers/slackHandler.ts` from serverless implementation
- **Build Process**: TypeScript compilation creates proper Lambda deployment structure
- **Environment Variables**: Stage-specific configuration (dev/prod)

### 3. Infrastructure Features
- **Scheduled Execution**: CloudWatch Events rule for daily execution at noon UTC
- **Monitoring**: CloudWatch alarms for errors and duration
- **Notifications**: SNS topic for operational alerts
- **Log Retention**: 2-week log retention policy
- **Multi-Stage**: Separate dev and prod stacks

### 4. Build and Deployment Scripts
```json
{
  "build:lambda": "tsc",
  "cdk": "cdk",
  "cdk:deploy": "npm run build:lambda && cdk deploy",
  "cdk:deploy:dev": "npm run build:lambda && cdk deploy WhatsOnTvDev",
  "cdk:deploy:prod": "npm run build:lambda && cdk deploy WhatsOnTvProd",
  "cdk:diff": "npm run build:lambda && cdk diff",
  "cdk:synth": "npm run build:lambda && cdk synth"
}
```

## Environment Configuration

### Required Environment Variables
Create a `.env.cdk` file based on `.env.cdk.example`:

```bash
# Development Environment
DEV_SLACK_TOKEN=xoxb-your-dev-slack-token-here
DEV_SLACK_CHANNEL=#whatsontv-dev

# Production Environment  
PROD_SLACK_TOKEN=xoxb-your-prod-slack-token-here
PROD_SLACK_CHANNEL=#whatsontv

# Optional AWS Configuration
CDK_DEFAULT_ACCOUNT=123456789012
CDK_DEFAULT_REGION=us-west-2
```

## Deployment Process

### 1. First-Time Setup
```bash
# Install CDK CLI globally (if not already installed)
npm install -g aws-cdk

# Bootstrap CDK in your AWS account (one-time setup)
cdk bootstrap

# Set up environment variables
cp .env.cdk.example .env.cdk
# Edit .env.cdk with your actual values
```

### 2. Deploy to Development
```bash
# Load environment variables
source .env.cdk

# Deploy to dev environment
npm run cdk:deploy:dev
```

### 3. Deploy to Production
```bash
# Deploy to prod environment
npm run cdk:deploy:prod
```

### 4. View Changes Before Deployment
```bash
# See what will change
npm run cdk:diff
```

## Architecture Comparison

### Before (Serverless Framework)
- `serverless.yml` configuration
- Serverless CLI for deployment
- Framework-specific patterns

### After (AWS CDK)
- TypeScript infrastructure code
- Native AWS service integration
- Type-safe configuration
- Better IDE support

## Benefits of CDK Migration

1. **TypeScript Integration**: Infrastructure code in the same language as application code
2. **Type Safety**: Compile-time checking for AWS resource configurations
3. **AWS-Native**: Always up-to-date with latest AWS services
4. **Future-Ready**: Easy integration with services like Bedrock, SageMaker
5. **IDE Support**: IntelliSense, refactoring, debugging for infrastructure code

## Preserved Features

All functionality from the Serverless Framework implementation has been preserved:
- Daily scheduled execution (noon UTC)
- Environment-specific configuration
- CloudWatch monitoring and alarms
- Proper error handling and logging
- Integration with existing Slack CLI architecture

## Next Steps

1. **Test Deployment**: Deploy to dev environment and verify functionality
2. **Set Up CI/CD**: Create GitHub Actions workflow for automated CDK deployments
3. **Add Monitoring**: Set up operational dashboards and alerting
4. **Future Enhancements**: Plan integration with additional AWS services

## Rollback Plan

If needed, the original Serverless Framework implementation is preserved in the backup:
- `/tmp/whatsontv-serverless-backup/serverless.yml`
- `/tmp/whatsontv-serverless-backup/lambda/`

The `feature/serverless-integration` branch also contains the original implementation.

## Troubleshooting

### Common Issues

1. **Missing Environment Variables**: Ensure `.env.cdk` is properly configured
2. **AWS Credentials**: Verify AWS CLI is configured with appropriate permissions
3. **CDK Bootstrap**: Run `cdk bootstrap` if deploying for the first time

### Required AWS Permissions
- Lambda function creation and management
- CloudWatch Events/EventBridge rules
- CloudWatch Logs and Alarms
- SNS topics
- IAM roles and policies
