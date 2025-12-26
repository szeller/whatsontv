# AWS CDK Deployment Guide

## Current Status

The WhatsOnTV Lambda deployment infrastructure is **ready for deployment** with all critical issues resolved.

### ✅ Phase 1 & 2 Complete
- ✅ CDK infrastructure code (`infrastructure/whatsontv-stack.ts`)
- ✅ Lambda handler implementation (`src/lambda/handlers/slackHandler.ts`)
- ✅ CloudWatch Events scheduling (daily at noon UTC)
- ✅ Monitoring with CloudWatch alarms
- ✅ SNS topic for operational notifications
- ✅ Email notification support (optional)
- ✅ Multi-stage support (dev/prod)
- ✅ Test coverage for Lambda handler
- ✅ **Build process fixed**: `tsconfig.lambda.json` emits executable `.js` files
- ✅ **Lambda runtime updated**: Using Node.js 22 (latest available)
- ✅ **Handler path corrected**: `lambda/handlers/slackHandler.handler`
- ✅ **Local bundle validation**: Test script verifies compiled code

### 🟡 Remaining Before First Deployment
1. **Create `.env.cdk`**: Copy from `.env.cdk.example` and add real credentials
2. **Bootstrap CDK**: Run `cdk bootstrap` once per AWS account
3. **Deploy to dev**: Run `npm run cdk:deploy:dev`

### 🔵 Future Enhancements (Separate PRs)
- CI/CD pipeline for automated deployments
- CloudWatch Dashboard for operational visibility
- Custom business metrics
- Lambda optimization (layers, bundle size)
- CDK snapshot tests

---

## Quick Start (After Fixes)

### Prerequisites
- AWS CLI configured with appropriate credentials
- Node.js 20.x or later installed
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

## Build Process (COMPLETED)

### Problem (Fixed)
The main `tsconfig.json` has `emitDeclarationOnly: true`, which only creates `.d.ts` type definition files. Lambda needs `.js` files to execute.

### Solution (Implemented)
Created a Lambda-specific TypeScript configuration:

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

## Lambda Configuration (COMPLETED)

### Runtime Version (Updated)
**File: `infrastructure/whatsontv-stack.ts`**
```typescript
// Line 33 - Updated to Node.js 22 (latest available in AWS Lambda)
runtime: lambda.Runtime.NODEJS_22_X,
```

**Note:** Node.js 24 is not yet available in AWS Lambda. Node.js 22 is the latest supported runtime.

### Handler Path (Fixed)
**File: `infrastructure/whatsontv-stack.ts`**
```typescript
// Line 34 - Corrected to match compiled bundle structure
handler: 'lambda/handlers/slackHandler.handler',
```

### Email Notifications (Implemented)
**File: `infrastructure/whatsontv-stack.ts`**
```typescript
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';

// After creating operationsNotificationTopic (line 64-70)
const operationsEmail = process.env.OPERATIONS_EMAIL;
if (operationsEmail !== undefined && operationsEmail !== null && operationsEmail.trim() !== '') {
  operationsNotificationTopic.addSubscription(
    new subscriptions.EmailSubscription(operationsEmail)
  );
}
```

Set `OPERATIONS_EMAIL` in `.env.cdk` to receive CloudWatch alarm notifications.

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

### Phase 3: Initial Deployment (Ready to Execute)
1. ✅ ~~Fix build process~~ - COMPLETE
2. ✅ ~~Update Lambda configuration~~ - COMPLETE
3. **Create `.env.cdk`** with actual Slack credentials
   ```bash
   cp .env.cdk.example .env.cdk
   # Edit .env.cdk with real tokens and channels
   ```
4. **Bootstrap CDK** (one-time per AWS account)
   ```bash
   cdk bootstrap
   ```
5. **Test local build**
   ```bash
   npm run build:lambda:test
   ```
6. **Deploy to dev environment**
   ```bash
   source .env.cdk
   npm run cdk:deploy:dev
   ```
7. **Verify deployment**
   - Check CloudFormation stack
   - Manually invoke Lambda
   - Review CloudWatch logs
   - Wait for scheduled execution (noon UTC)

### Future Improvements

See [GitHub Issue #264](https://github.com/szeller/whatsontv/issues/264) for planned CI/CD and monitoring improvements.

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
