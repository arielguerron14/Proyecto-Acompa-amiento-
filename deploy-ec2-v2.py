#!/usr/bin/env python3
"""
Deploy 8 EC2 instances using boto3 with proper wait logic.
Uses environment variables for AWS credentials (set via GitHub Actions secrets).
"""

import boto3
import time
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
AMI_ID = 'ami-0c02fb55956c7d316'
INSTANCE_TYPE = 't3.medium'

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

def create_instances(ec2_client):
    """Create 8 EC2 instances"""
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
                        {'Key': 'Environment', 'Value': 'production'}
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
            'subnet': subnet_id,
            'state': 'pending'
        })
        print(f"✓ Instance created: {instance_name} ({instance_id})")
    
    return instances

def wait_for_instances(ec2_client, instances, max_wait=300):
    """Wait for instances to reach 'running' state"""
    instance_ids = [inst['id'] for inst in instances]
    start_time = time.time()
    
    print(f"\nWaiting for instances to reach 'running' state...")
    
    while time.time() - start_time < max_wait:
        response = ec2_client.describe_instances(InstanceIds=instance_ids)
        
        all_running = True
        for reservation in response['Reservations']:
            for instance in reservation['Instances']:
                state = instance['State']['Name']
                instance_id = instance['InstanceId']
                
                # Find and update the instance in our list
                for inst in instances:
                    if inst['id'] == instance_id:
                        inst['state'] = state
                        inst['private_ip'] = instance.get('PrivateIpAddress', 'N/A')
                        inst['public_ip'] = instance.get('PublicIpAddress', 'N/A')
                
                if state != 'running':
                    all_running = False
        
        # Print status
        elapsed = int(time.time() - start_time)
        running_count = sum(1 for inst in instances if inst['state'] == 'running')
        print(f"  [{elapsed}s] {running_count}/{len(instances)} instances running", end='\r')
        
        if all_running:
            print(f"\n✓ All instances are running!")
            return True
        
        time.sleep(5)
    
    print(f"\n✗ Timeout waiting for instances (waited {max_wait}s)")
    return False

def create_load_balancer(elb_client, instances):
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
        print(f"\n✓ ALB created: {alb_dns}")
        
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
    print(f"Region: {REGION}, VPC: {VPC_ID}\n")
    
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
        
        # Create instances
        print("Creating EC2 instances...")
        instances = create_instances(ec2_client)
        
        # Wait for instances to be running
        if not wait_for_instances(ec2_client, instances):
            print("✗ Failed to wait for instances")
            return
        
        # Create ALB
        print("\nCreating Application Load Balancer...")
        alb_info = create_load_balancer(elb_client, instances)
        
        # Save outputs
        outputs = {
            'instances': instances,
            'load_balancer': alb_info,
            'timestamp': datetime.now().isoformat()
        }
        
        with open('deployment-outputs.json', 'w') as f:
            json.dump(outputs, f, indent=2)
        
        print(f"\n✓✓✓ Deployment completed successfully!")
        print(f"✓ ALB DNS: {alb_info['alb_dns']}")
        print(f"✓ {len(instances)} instances deployed")
        print(f"✓ Outputs saved to deployment-outputs.json")
        
    except Exception as e:
        print(f"✗ Error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    main()
