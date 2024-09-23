import * as CDK from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as S3 from 'aws-cdk-lib/aws-s3';
import * as S3Deployment from 'aws-cdk-lib/aws-s3-deployment';

export class Csci46508501248Stack extends CDK.Stack {
  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

    const assetsBucket = new S3.Bucket(this, "assets", {
      publicReadAccess: true,
      blockPublicAccess: {
        blockPublicAcls: false,
        blockPublicPolicy: false,
        ignorePublicAcls: false,
        restrictPublicBuckets: false,
      },
      versioned: true,
      removalPolicy: CDK.RemovalPolicy.DESTROY,
    });
    
    const assetsPath = './assets';
    new S3Deployment.BucketDeployment(this, "Deployment", {
      sources: [S3Deployment.Source.asset(assetsPath)],
      destinationBucket: assetsBucket,
    });
  }
}
