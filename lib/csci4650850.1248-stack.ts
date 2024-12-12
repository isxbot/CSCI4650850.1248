import * as CDK from 'aws-cdk-lib';
import { Duration, RemovalPolicy } from 'aws-cdk-lib';
import { InstanceClass, InstanceSize, InstanceType, Peer, Port, SecurityGroup, SubnetType, Vpc } from 'aws-cdk-lib/aws-ec2';
import { Repository } from 'aws-cdk-lib/aws-ecr';
import { Cluster, Compatibility, ContainerImage, FargateService, ListenerConfig, LogDriver, Protocol, Secret, TaskDefinition } from 'aws-cdk-lib/aws-ecs';
import { ApplicationLoadBalancer, ApplicationProtocol } from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Credentials, DatabaseInstance, DatabaseInstanceEngine, DatabaseSecret, MysqlEngineVersion } from 'aws-cdk-lib/aws-rds';
import { Construct } from 'constructs';

export class Csci46508501248Stack extends CDK.Stack {
  constructor(scope: Construct, id: string, props?: CDK.StackProps) {
    super(scope, id, props);

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

    // Database
    const instanceIdentifier = 'mysql';
    const secretName = `/${id}/rds/creds/${instanceIdentifier}`.toLowerCase();
    const credentials = new DatabaseSecret(this, 'mysql-credentials', {
      secretName,
      username: 'admin',
    });

    const database = new DatabaseInstance(this, 'mysql-database', {
      vpc,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS,
      },
      engine: DatabaseInstanceEngine.mysql({
        version: MysqlEngineVersion.VER_8_0_39,
      }),
      port: 3306,
      instanceIdentifier,
      instanceType: InstanceType.of(InstanceClass.T3, InstanceSize.MICRO),
      credentials: Credentials.fromSecret(credentials),
      databaseName: 'fgp',
    });

    // Container
    const repository = new Repository(this, 'repository', {
      repositoryName: 'fgp',
      emptyOnDelete: true,
      removalPolicy: RemovalPolicy.DESTROY,
    });

    const taskDefinition = new TaskDefinition(this, 'task', {
      compatibility: Compatibility.FARGATE,
      cpu: '1024',
      memoryMiB: '2048',
    });

    const container = taskDefinition.addContainer('fgp', {
      image: ContainerImage.fromEcrRepository(repository),
      logging: LogDriver.awsLogs({
        streamPrefix: 'fgp',
      }),
      secrets: {
        DATABASE_USER: Secret.fromSecretsManager(credentials, 'username'),
        DATABASE_PASSWORD: Secret.fromSecretsManager(credentials, 'password'),
        DATABASE_HOST: Secret.fromSecretsManager(credentials, 'host'),
        DATABASE_PORT: Secret.fromSecretsManager(credentials, 'port'),
      }
    });

    container.addPortMappings({
      containerPort: 3000,
      protocol: Protocol.TCP,
    });

    const cluster = new Cluster(this, 'cluster', {
      clusterName: 'fgp',
      vpc,
    });

    // Load Balancer Resources
    const securityGroup = new SecurityGroup(this, 'security-group', {
      vpc,
    });
    securityGroup.addIngressRule(Peer.anyIpv4(), Port.tcp(3000));

    const service = new FargateService(this, 'service', {
      cluster,
      taskDefinition,
      vpcSubnets: {
        subnetType: SubnetType.PRIVATE_WITH_EGRESS, 
      },
      serviceName: 'fgp',
      securityGroups: [
        securityGroup,
      ],
    });

    database.connections.allowFrom(service, Port.tcp(3306));

    const loadBalancerSecurityGroup = new SecurityGroup(this, 'load-balancer-security-group', {
      vpc,
    });
    loadBalancerSecurityGroup.addEgressRule(Peer.anyIpv4(), Port.tcp(80));

    const loadBalancer = new ApplicationLoadBalancer(this, 'load-balancer', {
        vpc,
        internetFacing: true,
        securityGroup: loadBalancerSecurityGroup,
    });

    const httpListener = loadBalancer.addListener('http-listener', {
        protocol: ApplicationProtocol.HTTP,
        open: true,
    });

    service.registerLoadBalancerTargets({
        containerName: container.containerName,
        containerPort: 3000,
        newTargetGroupId: 'fgp',
        listener: ListenerConfig.applicationListener(httpListener, {
            protocol: ApplicationProtocol.HTTP,
            healthCheck: {
                healthyHttpCodes: '200',
                interval: Duration.seconds(90),
                timeout: Duration.seconds(60),
                path: '/',
                port: '3000',
            },
        }),
    });
  
  }
}
