#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { WhatsOnTvStack } from './infrastructure/whatsontv-stack.js';

const app = new cdk.App();

// Create stacks for different environments
new WhatsOnTvStack(app, 'WhatsOnTvDev', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  stage: 'dev',
});

new WhatsOnTvStack(app, 'WhatsOnTvProd', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'us-west-2',
  },
  stage: 'prod',
});
