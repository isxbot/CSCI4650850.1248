#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { Csci46508501248Stack } from '../lib/csci4650850.1248-stack';

const app = new cdk.App();
new Csci46508501248Stack(app, 'Csci46508501248Stack', {
  env: {
    account: '418295722595',
    region: 'us-west-1'
  },
});