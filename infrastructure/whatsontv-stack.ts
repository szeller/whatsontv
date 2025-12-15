import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as events from 'aws-cdk-lib/aws-events';
import * as targets from 'aws-cdk-lib/aws-events-targets';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as subscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface WhatsOnTvStackProps extends cdk.StackProps {
  stage: 'dev' | 'prod';
}

export class WhatsOnTvStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: WhatsOnTvStackProps) {
    super(scope, id, props);

    const { stage } = props;

    // Environment variables based on stage
    const environment = {
      NODE_ENV: stage,
      SLACK_TOKEN: this.getSlackToken(stage),
      SLACK_CHANNEL: this.getSlackChannel(stage),
      SLACK_USERNAME: 'WhatsOnTV Bot',
      SLACK_ICON_EMOJI: ':tv:',
    };

    // Lambda function for daily show updates
    const dailyShowUpdatesFunction = new lambda.Function(this, 'DailyShowUpdatesFunction', {
      runtime: lambda.Runtime.NODEJS_22_X,
      handler: 'lambda/handlers/slackHandler.handler',
      code: lambda.Code.fromAsset('dist/lambda'),
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
      environment,
      logRetention: logs.RetentionDays.TWO_WEEKS,
      description: `WhatsOnTV daily show updates for ${stage} environment`,
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

    // Subscribe email to SNS topic if OPERATIONS_EMAIL is set
    const operationsEmail = process.env.OPERATIONS_EMAIL;
    if (operationsEmail !== undefined && operationsEmail !== null && operationsEmail.trim() !== '') {
      operationsNotificationTopic.addSubscription(
        new subscriptions.EmailSubscription(operationsEmail)
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

  private getSlackToken(stage: 'dev' | 'prod'): string {
    const envVar = stage === 'prod' ? 'PROD_SLACK_TOKEN' : 'DEV_SLACK_TOKEN';
    const token = process.env[envVar];
    if (!token) {
      throw new Error(`Environment variable ${envVar} is required`);
    }
    return token;
  }

  private getSlackChannel(stage: 'dev' | 'prod'): string {
    const envVar = stage === 'prod' ? 'PROD_SLACK_CHANNEL' : 'DEV_SLACK_CHANNEL';
    const channel = process.env[envVar];
    if (!channel) {
      throw new Error(`Environment variable ${envVar} is required`);
    }
    return channel;
  }
}
