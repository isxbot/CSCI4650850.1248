import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { AutoScalingGroup } from 'aws-cdk-lib/aws-autoscaling';
import {
  AmazonLinuxImage,
  Instance,
  InstanceClass,
  InstanceType,
  InstanceSize,
  KeyPair,
  LaunchTemplate,
  Peer,
  Port,
  SecurityGroup,
  Vpc } from 'aws-cdk-lib/aws-ec2';

export class Csci46508501248Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'default-vpc', {
      isDefault: true,
    });
    const instanceType = InstanceType.of(InstanceClass.T3, InstanceSize.NANO);
    const machineImage = new AmazonLinuxImage;
    const keyPair = new KeyPair(this, 'bastion', {});
    const securityGroup = new SecurityGroup(this, 'ec2-security-group', {
      vpc,
      allowAllOutbound: true,
      securityGroupName: 'ec2-security-group',
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(22), 'SSH');

    const launchTemplate = new LaunchTemplate(this, 'launch-template', {
      instanceType,
      machineImage,
      keyPair,
      securityGroup,
    });

    const asg = new AutoScalingGroup(this, 'asg', {
      vpc,
      desiredCapacity: 3,
      minCapacity: 2,
      maxCapacity: 3,
      launchTemplate,
    });
  }
}
