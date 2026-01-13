#!/usr/bin/env python3
import boto3
import json
import sys
import time

# AWS Configuration
region = 'us-east-1'
vpc_id = 'vpc-0f8670efa9e394cf3'
security_group_id = 'sg-04f3d554d6dc9e304'
subnet_ids = ['subnet-003fd1f4046a6b641', 'subnet-00865aa51057ed7b4']
instance_type = 't3.medium'
count = 8

# Initialize EC2 client
ec2 = boto3.client('ec2', region_name=region)

# Get latest Amazon Linux 2 AMI
amis = ec2.describe_images(
    Owners=['amazon'],
    Filters=[
        {'Name': 'name', 'Values': ['amzn2-ami-hvm-*-x86_64-gp2']},
        {'Name': 'virtualization-type', 'Values': ['hvm']},
        {'Name': 'root-device-type', 'Values': ['ebs']},
        {'Name': 'state', 'Values': ['available']}
    ]
)

if not amis['Images']:
    print("ERROR: No Amazon Linux 2 AMI found")
    sys.exit(1)

ami_id = sorted(amis['Images'], key=lambda x: x['CreationDate'], reverse=True)[0]['ImageId']
print(f"Using AMI: {ami_id}")

instances_created = []

try:
    # Create 8 instances
    for i in range(count):
        subnet = subnet_ids[i % len(subnet_ids)]
        instance_name = f"proyecto-acompanamiento-instance-{i}"
        
        print(f"Creating instance {i+1}/{count}: {instance_name} in {subnet}...", end=" ")
        sys.stdout.flush()
        
        response = ec2.run_instances(
            ImageId=ami_id,
            MinCount=1,
            MaxCount=1,
            InstanceType=instance_type,
            SubnetId=subnet,
            SecurityGroupIds=[security_group_id],
            TagSpecifications=[{
                'ResourceType': 'instance',
                'Tags': [
                    {'Key': 'Name', 'Value': instance_name},
                    {'Key': 'Module', 'Value': 'ec2-instance'},
                    {'Key': 'Environment', 'Value': 'production'}
                ]
            }]
        )
        
        instance_id = response['Instances'][0]['InstanceId']
        instances_created.append({
            'id': instance_id,
            'name': instance_name,
            'subnet': subnet,
            'private_ip': response['Instances'][0].get('PrivateIpAddress', 'pending')
        })
        
        print(f"✓ {instance_id}")
        time.sleep(2)

    print(f"\n✓ Created {len(instances_created)} instances successfully!")
    print("\nInstance Details:")
    for inst in instances_created:
        print(f"  - {inst['id']}: {inst['name']} (Subnet: {inst['subnet']})")
    
    # Wait for instances to have public IPs
    print("\nWaiting for instances to get public IPs...")
    time.sleep(10)
    
    # Get instance details with public IPs
    instance_ids = [inst['id'] for inst in instances_created]
    response = ec2.describe_instances(InstanceIds=instance_ids)
    
    final_instances = []
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            final_instances.append({
                'InstanceId': instance['InstanceId'],
                'PrivateIpAddress': instance.get('PrivateIpAddress', 'N/A'),
                'PublicIpAddress': instance.get('PublicIpAddress', 'pending')
            })
    
    print(json.dumps(final_instances, indent=2))
    
except Exception as e:
    print(f"ERROR: {str(e)}")
    sys.exit(1)
