#!/usr/bin/env python3
"""
Start EC2_CORE instance and wait for it to be ready
"""
import boto3
import time
import sys

def start_ec2_core():
    ec2 = boto3.client('ec2', region_name='us-east-1')
    
    try:
        # Find EC2_CORE instance by tag
        print("🔍 Finding EC2_CORE instance...")
        response = ec2.describe_instances(
            Filters=[
                {'Name': 'tag:Name', 'Values': ['EC2_CORE']},
                {'Name': 'instance-state-name', 'Values': ['stopped', 'stopping', 'running']}
            ]
        )
        
        if not response['Reservations']:
            print("❌ EC2_CORE instance not found!")
            return False
            
        instance = response['Reservations'][0]['Instances'][0]
        instance_id = instance['InstanceId']
        current_state = instance['State']['Name']
        public_ip = instance.get('PublicIpAddress', 'N/A')
        
        print(f"✅ Found instance: {instance_id}")
        print(f"   Current State: {current_state}")
        print(f"   Public IP: {public_ip}")
        
        if current_state == 'running':
            print("✅ Instance is already running!")
            return True
            
        if current_state in ['stopped', 'stopping']:
            print(f"\n🚀 Starting EC2_CORE instance ({instance_id})...")
            ec2.start_instances(InstanceIds=[instance_id])
            
            # Wait for instance to start
            print("⏳ Waiting for instance to start...")
            waiter = ec2.get_waiter('instance_running')
            waiter.wait(InstanceIds=[instance_id])
            print("✅ Instance is now running!")
            
            # Get updated instance info
            time.sleep(5)  # Give it a moment to assign IP
            response = ec2.describe_instances(InstanceIds=[instance_id])
            instance = response['Reservations'][0]['Instances'][0]
            
            public_ip = instance.get('PublicIpAddress', 'N/A')
            private_ip = instance.get('PrivateIpAddress', 'N/A')
            
            print(f"\n📋 Instance Details:")
            print(f"   ID: {instance_id}")
            print(f"   Public IP: {public_ip}")
            print(f"   Private IP: {private_ip}")
            print(f"   State: {instance['State']['Name']}")
            
            return True
            
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        return False

if __name__ == '__main__':
    success = start_ec2_core()
    sys.exit(0 if success else 1)
