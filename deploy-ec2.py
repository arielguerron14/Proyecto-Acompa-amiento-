#!/usr/bin/env python3
"""
Deploy 8 EC2 instances using boto3 directly.
Uses environment variables for AWS credentials (set via GitHub Actions secrets).
"""

import boto3
import os
import json
from datetime import datetime

# AWS credentials from environment variables (GitHub Actions will set these)
# DO NOT hardcode credentials here
session = boto3.Session(
    region_name='us-east-1'
)

ec2_client = session.client('ec2')
elbv2_client = session.client('elbv2')

# AWS resources
REGION = 'us-east-1'
VPC_ID = 'vpc-0f8670efa9e394cf3'
SUBNET_IDS = [
    'subnet-003fd1f4046a6b641',
    'subnet-00865aa51057ed7b4'
]
SECURITY_GROUP_ID = 'sg-04f3d554d6dc9e304'
AMI_ID = 'ami-0c02fb55956c7d316'  # Ubuntu 22.04 in us-east-1
INSTANCE_TYPE = 't3.medium'

# Instance names
INSTANCE_NAMES = [
    "EC2-Messaging",
    "EC2-Bastion",
    "EC2-Frontend",
    "EC2-API-Gateway",
    "EC2-Reportes",
    "EC2-CORE",
    "EC2-Notificaciones",
    "EC2-Monitoring"
]

print("✓ AWS credentials loaded from environment variables")
print(f"✓ Region: {REGION}")
print(f"✓ Using instance type: {INSTANCE_TYPE}")
print(f"✓ Target AMI: {AMI_ID}\n")

                    'IpProtocol': 'tcp',
                    'FromPort': 80,
                    'ToPort': 80,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                },
                {
                    'IpProtocol': 'tcp',
                    'FromPort': 443,
                    'ToPort': 443,
                    'IpRanges': [{'CidrIp': '0.0.0.0/0'}]
                }
            ]
        )
        return sg_id
    except ec2_client.exceptions.ClientError as e:
        if 'InvalidGroup.Duplicate' in str(e):
            # Group already exists
            groups = ec2_client.describe_security_groups(
                Filters=[{'Name': 'group-name', 'Values': ['SG-ACOMPANAMIENTO-ALL']}]
            )
            if groups['SecurityGroups']:
                return groups['SecurityGroups'][0]['GroupId']
        raise

def create_key_pair(ec2_client):
    """Create EC2 key pair"""
    try:
        response = ec2_client.create_key_pair(KeyName='key-acompanamiento')
        print(f"✓ Key pair created: {response['KeyName']}")
        return response['KeyName']
    except ec2_client.exceptions.ClientError as e:
        if 'InvalidKeyPair.Duplicate' in str(e):
            print(f"✓ Key pair already exists: key-acompanamiento")
            return 'key-acompanamiento'
        raise

def create_instances(ec2_client, elb_client):
    """Create 8 EC2 instances and register to ALB"""
    instances = []
    
    for i, instance_name in enumerate(INSTANCE_NAMES):
        subnet_id = SUBNET_IDS[i % len(SUBNET_IDS)]
        
        response = ec2_client.run_instances(
            ImageId=AMI_ID,
            InstanceType=INSTANCE_TYPE,
            KeyName='key-acompanamiento',
            SubnetId=subnet_id,
            SecurityGroupIds=[SECURITY_GROUP_ID],
            MinCount=1,
            MaxCount=1,
            TagSpecifications=[
                {
                    'ResourceType': 'instance',
                    'Tags': [
                        {'Key': 'Name', 'Value': instance_name},
                        {'Key': 'Project', 'Value': 'proyecto-acompanamiento'},
                        {'Key': 'Environment', 'Value': 'production'},
                        {'Key': 'ManagedBy', 'Value': 'Python'}
                    ]
                }
            ],
            UserData='''#!/bin/bash
apt update -y
apt install -y docker.io
systemctl enable docker
systemctl start docker
usermod -aG docker ubuntu
'''
        )
        
        instance_id = response['Instances'][0]['InstanceId']
        instances.append({
            'id': instance_id,
            'name': instance_name,
            'subnet': subnet_id
        })
        print(f"✓ Instance created: {instance_name} ({instance_id})")
    
    return instances

def create_load_balancer(elb_client, ec2_client, instances):
    """Create ALB and register instances"""
    try:
        # Create ALB
        response = elb_client.create_load_balancer(
            Name='alb-acompanamiento',
            Subnets=list(set([inst['subnet'] for inst in instances])),
            SecurityGroups=[SECURITY_GROUP_ID],
            Scheme='internet-facing',
            Type='application'
        )
        alb_arn = response['LoadBalancers'][0]['LoadBalancerArn']
        alb_dns = response['LoadBalancers'][0]['DNSName']
        print(f"✓ ALB created: {alb_dns}")
        
        # Create target group
        tg_response = elb_client.create_target_group(
            Name='tg-acompanamiento',
            Protocol='HTTP',
            Port=80,
            VpcId=VPC_ID,
            HealthCheckEnabled=True,
            HealthCheckProtocol='HTTP',
            HealthCheckPath='/',
            HealthCheckPort='80',
            HealthCheckIntervalSeconds=30,
            HealthCheckTimeoutSeconds=5,
            HealthyThresholdCount=2,
            UnhealthyThresholdCount=2,
            Matcher={'HttpCode': '200-299'}
        )
        tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
        print(f"✓ Target Group created: {tg_arn}")
        
        # Register instances
        targets = [{'Id': inst['id'], 'Port': 80} for inst in instances]
        elb_client.register_targets(TargetGroupArn=tg_arn, Targets=targets)
        print(f"✓ Registered {len(instances)} instances to target group")
        
        # Create listener
        elb_client.create_listener(
            LoadBalancerArn=alb_arn,
            Protocol='HTTP',
            Port=80,
            DefaultActions=[
                {
                    'Type': 'forward',
                    'TargetGroupArn': tg_arn
                }
            ]
        )
        print(f"✓ Listener created")
        
        return {
            'alb_arn': alb_arn,
            'alb_dns': alb_dns,
            'target_group_arn': tg_arn
        }
    except elb_client.exceptions.ClientError as e:
        if 'DuplicateLoadBalancerName' in str(e):
            print("✓ ALB already exists")
            # Retrieve existing ALB
            response = elb_client.describe_load_balancers(Names=['alb-acompanamiento'])
            if response['LoadBalancers']:
                return {
                    'alb_arn': response['LoadBalancers'][0]['LoadBalancerArn'],
                    'alb_dns': response['LoadBalancers'][0]['DNSName'],
                    'target_group_arn': None
                }
        raise

def main():
    """Main deployment function"""
    print(f"Starting deployment at {datetime.now().isoformat()}")
    print(f"Region: {REGION}")
    print(f"VPC: {VPC_ID}")
    print(f"Subnets: {SUBNET_IDS}")
    print("")
    
    try:
        # Create boto3 clients
        ec2_client = boto3.client(
            'ec2',
            region_name=REGION,
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            aws_session_token=AWS_SESSION_TOKEN
        )
        
        elb_client = boto3.client(
            'elbv2',
            region_name=REGION,
            aws_access_key_id=AWS_ACCESS_KEY,
            aws_secret_access_key=AWS_SECRET_KEY,
            aws_session_token=AWS_SESSION_TOKEN
        )
        
        # Create key pair
        create_key_pair(ec2_client)
        
        # Create instances
        print("\nCreating EC2 instances...")
        instances = create_instances(ec2_client, elb_client)
        
        # Create ALB
        print("\nCreating Application Load Balancer...")
        alb_info = create_load_balancer(elb_client, ec2_client, instances)
        
        # Save outputs
        outputs = {
            'instances': instances,
            'load_balancer': alb_info,
            'timestamp': datetime.now().isoformat()
        }
        
        with open('deployment-outputs.json', 'w') as f:
            json.dump(outputs, f, indent=2)
        
        print(f"\n✓ Deployment completed successfully!")
        print(f"✓ ALB DNS: {alb_info['alb_dns']}")
        print(f"✓ Outputs saved to deployment-outputs.json")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        raise

if __name__ == '__main__':
    main()
