import * as CDK from 'aws-cdk-lib';
import { AmazonLinuxImage, Instance, InstanceClass, InstanceSize, InstanceType, KeyPair, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export class Csci46508501248Stack extends CDK.Stack {
  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

    const vpc = Vpc.fromLookup(this, 'vpc', {
      isDefault: true,
      region: 'us-west-1',
      vpcId: 'vpc-0df91f85549331198',
    });

    // Database
    const databaseSecurityGroup = new SecurityGroup(this, 'database-security-group', {
      vpc,
      allowAllOutbound: true,
      description: 'RDS Security Group',
      securityGroupName: 'rds'
    });

    databaseSecurityGroup.addIngressRule(
      Peer.ipv4('47.7.49.59/32'),
      Port.tcp(3306),
    );

    const instanceIdentifier = 'mysql1'
    const secretName = `/${id}/rds/creds/${instanceIdentifier}`.toLowerCase()
    const credentials = new DatabaseSecret(this, 'mysql-rds-credentials', {
      secretName,
      username: 'admin',
    });

    const database = new DatabaseInstance(this, 'mysql-rds-database', {
      vpc,
      vpcSubnets: {
        onePerAz: true,
        subnetType: SubnetType.PUBLIC,
      },
      securityGroups: [ databaseSecurityGroup ],
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_39,
      }),
      port: 3306,
      instanceIdentifier,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(credentials),
    });

    // EC2
    const instanceSecurityGroup = new SecurityGroup(this, 'ec2-security-group', {
      vpc,
      allowAllOutbound: true,
      description: 'EC2 security group',
      securityGroupName: 'ec2',
    });
    instanceSecurityGroup.addIngressRule(
      Peer.ipv4('47.7.49.59/32'),
      Port.tcp(22),
    );
    instanceSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(3000),
    );

    const instanceType = InstanceType.of(InstanceClass.T3, InstanceSize.MICRO);
    const machineImage = new AmazonLinuxImage;
    const keyPair = new KeyPair(this, 'bastion', {});

    const instance = new Instance(this, 'ec2-instance', {
      vpc,
      instanceType,
      keyPair,
      machineImage,
      securityGroup: instanceSecurityGroup,
    });

    database.connections.allowFrom(instance, Port.tcp(3306));
  }
}
