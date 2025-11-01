# AWS CDK Deployment Guide

## Current Status

The WhatsOnTV Lambda deployment infrastructure is **partially complete** and requires fixes before it can be deployed.

### ✅ Completed
- CDK infrastructure code (`infrastructure/whatsontv-stack.ts`)
- Lambda handler implementation (`src/lambda/handlers/slackHandler.ts`)
- CloudWatch Events scheduling (daily at noon UTC)
- Monitoring with CloudWatch alarms
- SNS topic for operational notifications
- Multi-stage support (dev/prod)
- Test coverage for Lambda handler

### 🔴 Critical Issues
1. **Build Process Broken**: TypeScript compilation only generates `.d.ts` files, not executable `.js` files
2. **Lambda Runtime Outdated**: Using Node.js 18 (should be Node.js 24)
3. **Handler Path Incorrect**: Stack expects wrong path due to build issue
4. **Missing Environment Config**: No `.env.cdk` file exists

### 🟡 Missing Features
- CI/CD pipeline for automated deployments
- Email subscription to SNS alarms
- CloudWatch Dashboard for operational visibility
- Custom business metrics

---

## Quick Start (After Fixes)

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 24.x installed
- Global CDK CLI: `npm install -g aws-cdk`

### Setup Steps
```bash
# 1. Bootstrap CDK in your AWS account (one-time)
cdk bootstrap

# 2. Create environment configuration
cp .env.cdk.example .env.cdk
# Edit .env.cdk with actual Slack tokens and channels

# 3. Build Lambda function
npm run build:lambda

# 4. Deploy to dev
source .env.cdk
npm run cdk:deploy:dev

# 5. Test the deployment
aws lambda invoke \
  --function-name <function-name-from-output> \
  --payload '{}' \
  response.json
```

---

## Fixing the Build Process

### Problem
The current `tsconfig.json` has `emitDeclarationOnly: true`, which only creates `.d.ts` type definition files. Lambda needs `.js` files to execute.

### Solution
Create a Lambda-specific TypeScript configuration:

**File: `tsconfig.lambda.json`**
```json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": false,
    "emitDeclarationOnly": false,
    "noEmit": false,
    "sourceMap": true,
    "esModuleInterop": true,
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts", "src/tests/**/*"]
}
```

**Update `package.json`:**
```json
{
  "build:lambda": "tsc --project tsconfig.lambda.json"
}
```

**Verify:**
```bash
npm run build:lambda
ls -la dist/lambda/handlers/
# Should show: slackHandler.js and slackHandler.js.map
```

---

## Updating Lambda Configuration

### Update Runtime Version
**File: `infrastructure/whatsontv-stack.ts`**
```typescript
// Line 32 - Change from NODEJS_18_X to NODEJS_24_X
runtime: lambda.Runtime.NODEJS_24_X,
```

### Fix Handler Path
**File: `infrastructure/whatsontv-stack.ts`**
```typescript
// Line 33 - Update handler path
handler: 'lambda/handlers/slackHandler.handler',
```

### Add Email Notifications (Optional)
**File: `infrastructure/whatsontv-stack.ts`**
```typescript
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

// After creating operationsNotificationTopic (around line 61)
const operationsEmail = process.env.OPERATIONS_EMAIL;
if (operationsEmail) {
  operationsNotificationTopic.addSubscription(
    new subscriptions.EmailSubscription(operationsEmail)
  );
}
```

---

## Environment Configuration

### Required Variables
Create `.env.cdk` with the following:

```bash
# Development Environment
DEV_SLACK_TOKEN=xoxb-your-dev-slack-token-here
DEV_SLACK_CHANNEL=#whatsontv-dev

# Production Environment  
PROD_SLACK_TOKEN=xoxb-your-prod-slack-token-here
PROD_SLACK_CHANNEL=#whatsontv

# Optional: Email for CloudWatch Alarms
OPERATIONS_EMAIL=your-email@example.com

# Optional: AWS Configuration (uses default profile if not set)
# CDK_DEFAULT_ACCOUNT=123456789012
# CDK_DEFAULT_REGION=us-west-2
```

### Load Before Deployment
```bash
source .env.cdk
```

---

## Deployment Commands

```bash
# View what will change (dry run)
npm run cdk:diff

# Deploy to development
npm run cdk:deploy:dev

# Deploy to production
npm run cdk:deploy:prod

# Deploy both environments
npm run cdk:deploy

# Synthesize CloudFormation templates
npm run cdk:synth
```

---

## Testing the Deployment

### Manual Invocation
```bash
# Get the function name from stack outputs
aws lambda invoke \
  --function-name WhatsOnTvDev-DailyShowUpdatesFunction-XXXXX \
  --payload '{}' \
  response.json

# Check the response
cat response.json
```

### View Logs
```bash
# Find the log group
aws logs describe-log-groups --log-group-name-prefix /aws/lambda/WhatsOnTvDev

# Tail logs
aws logs tail /aws/lambda/WhatsOnTvDev-DailyShowUpdatesFunction-XXXXX --follow
```

### Test Schedule
The Lambda runs automatically at 12:00 UTC daily via CloudWatch Events rule.

---

## Architecture Overview

### Infrastructure Components
- **Lambda Function**: Executes Slack CLI to fetch and post TV shows
- **CloudWatch Events Rule**: Triggers Lambda daily at noon UTC
- **CloudWatch Logs**: 2-week retention for Lambda execution logs
- **CloudWatch Alarms**: Monitor errors and execution duration
- **SNS Topic**: Sends alarm notifications (optional email subscription)
- **IAM Roles**: Automatically created with minimal required permissions

### Execution Flow
1. CloudWatch Events triggers Lambda at 12:00 UTC
2. Lambda initializes Slack container with DI
3. Handler calls `createSlackApp()` from existing CLI
4. App fetches shows from TVMaze API
5. App formats and sends to Slack channel
6. Structured logs written to CloudWatch
7. Alarms trigger if errors occur

---

## Next Steps

### Immediate (Required for Deployment)
1. Fix build process (create `tsconfig.lambda.json`)
2. Update Lambda runtime to Node.js 24
3. Create `.env.cdk` with actual credentials
4. Test build: `npm run build:lambda`
5. Deploy to dev and verify

### Short-term (Operational Excellence)
1. Add CI/CD pipeline (GitHub Actions)
2. Set up CloudWatch Dashboard
3. Subscribe email to SNS topic
4. Add custom business metrics
5. Document actual deployment experience

### Long-term (Enhancements)
1. Add DynamoDB table for show tracking
2. Integrate AWS Bedrock for AI summaries
3. Add API Gateway for manual triggers
4. Multi-region deployment
5. Cost optimization review

---

## Required AWS Permissions

The deploying IAM user/role needs:
- `lambda:*` - Function creation and management
- `events:*` - CloudWatch Events/EventBridge rules
- `logs:*` - CloudWatch Logs and log groups
- `cloudwatch:*` - CloudWatch alarms and metrics
- `sns:*` - SNS topics and subscriptions
- `iam:*` - IAM roles and policies for Lambda
- `cloudformation:*` - CDK uses CloudFormation
- `s3:*` - CDK asset bucket

---

## Troubleshooting

### Build Issues
**Problem**: `dist/lambda/handlers/` only has `.d.ts` files
**Solution**: Create `tsconfig.lambda.json` and update build script

### Deployment Fails
**Problem**: Missing environment variables
**Solution**: Ensure `.env.cdk` exists and is sourced: `source .env.cdk`

**Problem**: CDK bootstrap not done
**Solution**: Run `cdk bootstrap` once per AWS account/region

### Lambda Execution Fails
**Problem**: Module not found errors
**Solution**: Verify handler path is correct and `.js` files exist in deployment package

**Problem**: Slack API errors
**Solution**: Verify Slack token and channel ID are correct in environment variables

### No Slack Messages
**Problem**: Lambda runs but nothing posts to Slack
**Solution**: Check CloudWatch Logs for errors, verify Slack permissions
