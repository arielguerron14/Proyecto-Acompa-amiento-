#!/usr/bin/env python3
"""
Fix Security Groups for microservice connectivity
"""
import json

# Instance IPs from config
with open('config/instance_ips.json', 'r') as f:
    instances = json.load(f)

core_instance = instances['EC2-CORE']
api_gw_instance = instances['EC2-API-Gateway']
db_instance = instances['EC2-DB']

print("🔒 Security Group Configuration for Cross-Instance Connectivity")
print("=" * 80)
print()

print("📋 Current Configuration:")
print(f"  EC2-CORE (Microservices)")
print(f"    Instance ID: {core_instance['InstanceId']}")
print(f"    Private IP: {core_instance['PrivateIpAddress']}")
print(f"    Ports: 3000-3002 (micro-auth, micro-estudiantes, micro-maestros)")
print()
print(f"  EC2-API-Gateway")
print(f"    Instance ID: {api_gw_instance['InstanceId']}")
print(f"    Private IP: {api_gw_instance['PrivateIpAddress']}")
print(f"    Public IP: {api_gw_instance['PublicIpAddress']}")
print()

print("=" * 80)
print()

print("📋 Required Security Group Rules:")
print()
print("On EC2-CORE security group, Inbound rules should have:")
print()
print("1. Source: EC2-API-Gateway security group (or 172.31.64.195/32)")
print("   Protocol: TCP")
print("   Port Range: 3000")
print("   Description: micro-auth from API Gateway")
print()
print("2. Source: EC2-API-Gateway security group (or 172.31.64.195/32)")
print("   Protocol: TCP")
print("   Port Range: 3001")
print("   Description: micro-estudiantes from API Gateway")
print()
print("3. Source: EC2-API-Gateway security group (or 172.31.64.195/32)")
print("   Protocol: TCP")
print("   Port Range: 3002")
print("   Description: micro-maestros from API Gateway")
print()

print("=" * 80)
print()

print("🔧 AWS CLI Command to add rules:")
print()

rules = [
    (3000, "micro-auth from API Gateway"),
    (3001, "micro-estudiantes from API Gateway"),
    (3002, "micro-maestros from API Gateway"),
]

print("# Get EC2-CORE security group ID first:")
print('SG_ID=$(aws ec2 describe-instances --instance-ids ' + core_instance['InstanceId'])
print('  --query "Reservations[0].Instances[0].SecurityGroups[0].GroupId" --output text)')
print()

for port, description in rules:
    print(f"# Rule for port {port}:")
    print(f'aws ec2 authorize-security-group-ingress \\')
    print(f'  --group-id $SG_ID \\')
    print(f'  --protocol tcp \\')
    print(f'  --port {port} \\')
    print(f'  --source-securitygroupid 172.31.64.195/32 \\')
    print(f'  --description "{description}"')
    print()

print("=" * 80)
print()
print("Or fix via AWS Console:")
print("1. Go to EC2 → Security Groups")
print("2. Find security group for EC2-CORE")
print("3. Inbound Rules → Edit Inbound Rules")
print("4. Add Rule (repeat for each port):")
print("   - Type: Custom TCP")
print("   - Port Range: 3000/3001/3002")
print("   - Source: 172.31.64.195/32 (EC2-API-Gateway)")
print("5. Save rules")
