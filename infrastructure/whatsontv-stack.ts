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

    // Read configuration from config.json
    const config = this.loadConfig();

    // Environment variables for Lambda
    const environment = {
      NODE_ENV: stage,
      SLACK_TOKEN: config.slack.token,
      SLACK_CHANNEL: config.slack.channelId,
      SLACK_USERNAME: config.slack.username ?? 'WhatsOnTV Bot',
      SLACK_ICON_EMOJI: config.slack.icon_emoji ?? ':tv:',
      CONFIG_FILE: '/var/task/config.lambda.json',
    };

    // Lambda function for daily show updates (bundled with esbuild)
    const dailyShowUpdatesFunction = new lambdaNodejs.NodejsFunction(this, 'DailyShowUpdatesFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      entry: 'src/lambda/handlers/slackHandler.ts',
      handler: 'handler',
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      description: `WhatsOnTV daily show updates for ${stage} environment`,
      bundling: {
        minify: false,
        sourceMap: true,
        target: 'node22',
        format: lambdaNodejs.OutputFormat.ESM,
        banner:
          'import { createRequire as _createRequire } from "module";' +
          'import { fileURLToPath as _fileURLToPath } from "url";' +
          'import { dirname as _dirname } from "path";' +
          'const require = _createRequire(import.meta.url);' +
          'const __filename = _fileURLToPath(import.meta.url);' +
          'const __dirname = _dirname(__filename);',
        commandHooks: {
          beforeBundling(): string[] {
            return [];
          },
          beforeInstall(): string[] {
            return [];
          },
          afterBundling(inputDir: string, outputDir: string): string[] {
            return [`cp ${inputDir}/config.lambda.json ${outputDir}/config.lambda.json`];
          },
        },
      },
    });

    // CloudWatch Events rule for daily scheduling (noon UTC)
    const dailyScheduleRule = new events.Rule(this, 'DailyScheduleRule', {
      description: 'Trigger WhatsOnTV daily show updates',
      schedule: events.Schedule.cron({
        minute: '0',
        hour: '12',
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
}
