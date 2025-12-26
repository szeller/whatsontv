import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as lambdaNodejs from 'aws-cdk-lib/aws-lambda-nodejs';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Runtime configuration for Lambda (read from config.lambda.json at deploy time)
 * This is inlined as an environment variable to avoid file copy during bundling.
 */
interface LambdaRuntimeConfig {
  country?: string;
  types?: string[];
  languages?: string[];
  networks?: string[];
  genres?: string[];
  notificationTime?: string;
}

/**
 * CDK deployment configuration (read from config.json at deploy time)
 *
 * This is intentionally separate from src/types/configTypes.ts AppConfig:
 * - This type: Minimal config needed for CDK infrastructure deployment
 * - configTypes.ts: Full runtime application config (filters, timing, etc.)
 *
 * The CDK only needs Slack credentials to pass to Lambda environment variables.
 * Runtime filtering/display options are read directly by the app at runtime.
 */
interface AppConfig {
  slack: {
    token: string;
    channelId: string;
    username?: string;
    icon_emoji?: string;
  };
  operationsEmail?: string;
}

export interface WhatsOnTvStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
}

export class WhatsOnTvStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WhatsOnTvStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // Read configuration from config.json (Slack credentials)
    const config = this.loadConfig();

    // Read runtime config from config.lambda.json and inline as env var
    const runtimeConfig = this.loadLambdaRuntimeConfig();

    // Environment variables for Lambda
    const environment = {
      NODE_ENV: stage,
      SLACK_TOKEN: config.slack.token,
      SLACK_CHANNEL: config.slack.channelId,
      SLACK_USERNAME: config.slack.username ?? 'WhatsOnTV Bot',
      SLACK_ICON_EMOJI: config.slack.icon_emoji ?? ':tv:',
      // Inline the runtime config as JSON - avoids file copy during bundling
      APP_CONFIG: JSON.stringify(runtimeConfig),
    };

    // Create explicit log group (avoids deprecated logRetention property)
    const lambdaLogGroup = new logs.LogGroup(this, 'LambdaLogGroup', {
      logGroupName: `/aws/lambda/whatsontv-${stage}-daily-updates`,
      retention: logs.RetentionDays.TWO_WEEKS,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda function for daily show updates (bundled with esbuild)
    const dailyShowUpdatesFunction = new lambdaNodejs.NodejsFunction(this, 'DailyShowUpdatesFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: 'src/lambda/handlers/slackHandler.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment,
      logGroup: lambdaLogGroup,
      description: `WhatsOnTV daily show updates for ${stage} environment`,
      bundling: {
        minify: false,
        sourceMap: true,
        target: 'node22',
        format: lambdaNodejs.OutputFormat.ESM,
        // No banner needed - Lambda uses LambdaConfigServiceImpl which doesn't depend on yargs
        // No commandHooks needed - config is inlined as APP_CONFIG environment variable
      },
    });

    // CloudWatch Events rule for daily scheduling
    // 4 PM PST (UTC-8) = midnight UTC. During PDT (Mar-Nov), this runs at 5 PM Pacific.
    const dailyScheduleRule = new events.Rule(this, 'DailyScheduleRule', {
      description: 'Trigger WhatsOnTV daily show updates',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '0',
        day: '*',
        month: '*',
        year: '*',
      }),
    });

    // Add the Lambda function as a target for the scheduled event
    dailyScheduleRule.addTarget(new targets.LambdaFunction(dailyShowUpdatesFunction));

    // SNS topic for operational notifications
    const operationsNotificationTopic = new sns.Topic(this, 'OperationsNotificationTopic', {
      topicName: `whatsontv-${stage}-operations`,
      displayName: `WhatsOnTV Operations - ${stage}`,
    });

    // Subscribe email to SNS topic if operationsEmail is configured
    if (config.operationsEmail) {
      operationsNotificationTopic.addSubscription(
        new subscriptions.EmailSubscription(config.operationsEmail)
      );
    }

    // CloudWatch alarm for Lambda errors
    const lambdaErrorsAlarm = new cloudwatch.Alarm(this, 'LambdaErrorsAlarm', {
      alarmName: `whatsontv-${stage}-lambda-errors`,
      alarmDescription: 'Lambda function errors > 0',
      metric: dailyShowUpdatesFunction.metricErrors({
        period: cdk.Duration.minutes(5),
        statistic: 'Sum',
      }),
      threshold: 0,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 1,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    // Add SNS action to the alarm
    lambdaErrorsAlarm.addAlarmAction(new cloudwatchActions.SnsAction(operationsNotificationTopic));

    // CloudWatch alarm for Lambda duration
    const lambdaDurationAlarm = new cloudwatch.Alarm(this, 'LambdaDurationAlarm', {
      alarmName: `whatsontv-${stage}-lambda-duration`,
      alarmDescription: 'Lambda function duration > 25 seconds',
      metric: dailyShowUpdatesFunction.metricDuration({
        period: cdk.Duration.minutes(5),
        statistic: 'Average',
      }),
      threshold: 25000, // 25 seconds in milliseconds
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      evaluationPeriods: 2,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    lambdaDurationAlarm.addAlarmAction(new cloudwatchActions.SnsAction(operationsNotificationTopic));

    // Outputs
    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: dailyShowUpdatesFunction.functionName,
      description: 'Name of the Lambda function',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionArn', {
      value: dailyShowUpdatesFunction.functionArn,
      description: 'ARN of the Lambda function',
    });

    new cdk.CfnOutput(this, 'ScheduleRuleName', {
      value: dailyScheduleRule.ruleName,
      description: 'Name of the CloudWatch Events rule',
    });

    new cdk.CfnOutput(this, 'OperationsTopicArn', {
      value: operationsNotificationTopic.topicArn,
      description: 'ARN of the operations notification topic',
    });
  }

  private loadConfig(): AppConfig {
    const configPath = path.resolve(process.cwd(), 'config.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(
        'config.json not found. Copy config.dev.json or config.prod.json to config.json before deploying.'
      );
    }
    const configContent = fs.readFileSync(configPath, 'utf-8');
    const config = JSON.parse(configContent) as AppConfig;

    if (!config.slack?.token) {
      throw new Error('config.json must contain slack.token');
    }
    if (!config.slack?.channelId) {
      throw new Error('config.json must contain slack.channelId');
    }

    return config;
  }

  private loadLambdaRuntimeConfig(): LambdaRuntimeConfig {
    const configPath = path.resolve(process.cwd(), 'config.lambda.json');
    if (!fs.existsSync(configPath)) {
      throw new Error(
        'config.lambda.json not found. This file contains runtime filtering options for Lambda.'
      );
    }
    const configContent = fs.readFileSync(configPath, 'utf-8');
    return JSON.parse(configContent) as LambdaRuntimeConfig;
  }
}
