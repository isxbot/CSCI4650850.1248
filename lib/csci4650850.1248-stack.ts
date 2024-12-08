import * as CDK from 'aws-cdk-lib';
import { RemovalPolicy } from 'aws-cdk-lib';
import { AttributeType, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Subnet, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Cluster, Compatibility, ContainerImage, FargateService, Protocol, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { Construct } from 'constructs';

export class Csci46508501248Stack extends CDK.Stack {
  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

    // Networking
    const vpc = new Vpc(this, 'vpc', {
      subnetConfiguration: [
        {
          cidrMask: 28,
          name: 'private',
          subnetType: SubnetType.PRIVATE_WITH_EGRESS,
        },
        {
          cidrMask: 28,
          name: 'public',
          subnetType: SubnetType.PUBLIC,
        },
      ],
    });

    // Container Resources
    const repository = new Repository(this, 'repository', {
      repositoryName: 'fgp',
      emptyOnDelete: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });


    // TODO: Configure RDS instance
    // TODO: Configure Prisma Schema to connect to database instance.


    // const taskDefinition = new TaskDefinition(this, 'task', {
    //   compatibility: Compatibility.FARGATE,
    //   cpu: '1024',
    //   memoryMiB: '2048',
    // });

    // const container = taskDefinition.addContainer('fgp', {
    //   image: ContainerImage.fromEcrRepository(repository),
    // });

    // container.addPortMappings({
    //   containerPort: 3000,
    //   protocol: Protocol.TCP,
    // });

    // const cluster = new Cluster(this, 'cluster', {
    //   clusterName: 'fgp',
    //   vpc,
    // });

    // const service = new FargateService(this, 'service', {
    //   cluster,
    //   taskDefinition,
    //   vpcSubnets: {
    //     subnetType: SubnetType.PRIVATE_WITH_EGRESS, 
    //   },
    //   serviceName: 'fgp',
    // });
  
  }
}
