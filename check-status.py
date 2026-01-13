#!/usr/bin/env python3
"""
Check deployment status with new credentials
"""
import boto3
import os

# Set credentials from environment (will be set in terminal)
session = boto3.Session(
    aws_access_key_id=os.environ.get('AWS_ACCESS_KEY_ID'),
    aws_secret_access_key=os.environ.get('AWS_SECRET_ACCESS_KEY'),
    aws_session_token=os.environ.get('AWS_SESSION_TOKEN'),
    region_name='us-east-1'
)

ec2 = session.client('ec2')
elbv2 = session.client('elbv2')

print("🔍 Verificando credenciales...")
sts = session.client('sts')
try:
    identity = sts.get_caller_identity()
    print(f"✅ Cuenta: {identity['Account']}")
    print(f"✅ ARN: {identity['Arn']}\n")
except Exception as e:
    print(f"❌ Error de credenciales: {e}")
    exit(1)

print("📊 Estado de instancias EC2:")
try:
    response = ec2.describe_instances(
        Filters=[
            {'Name': 'instance-state-name', 'Values': ['running', 'pending']},
            {'Name': 'tag:Project', 'Values': ['proyecto-acompanamiento']}
        ]
    )
    
    instance_count = 0
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            name = next((t['Value'] for t in instance.get('Tags', []) if t['Key'] == 'Name'), 'Sin nombre')
            print(f"  ✅ {instance['InstanceId']} - {name} ({instance['State']['Name']})")
            instance_count += 1
    
    print(f"\n📈 Total: {instance_count} instancias corriendo\n")
except Exception as e:
    print(f"❌ Error: {e}\n")

print("🏥 Estado de targets en ALB:")
try:
    health = elbv2.describe_target_health(
        TargetGroupArn='arn:aws:elasticloadbalancing:us-east-1:497189141139:targetgroup/tg-acompanamiento/7af5bd278b554659'
    )
    
    healthy = 0
    initial = 0
    unhealthy = 0
    
    for target in health['TargetHealthDescriptions']:
        state = target['TargetHealth']['State']
        if state == 'healthy':
            healthy += 1
            print(f"  ✅ {target['Target']['Id']} - healthy")
        elif state == 'initial':
            initial += 1
            print(f"  ⏳ {target['Target']['Id']} - initial")
        else:
            unhealthy += 1
            print(f"  ❌ {target['Target']['Id']} - {state}")
    
    print(f"\n📊 Resumen: {healthy} healthy, {initial} initializing, {unhealthy} unhealthy\n")
except Exception as e:
    print(f"❌ Error: {e}\n")

print("🌐 Estado de ALB:")
try:
    albs = elbv2.describe_load_balancers(Names=['proyecto-acompanamiento-alb'])
    alb = albs['LoadBalancers'][0]
    print(f"  ✅ ALB: {alb['LoadBalancerName']}")
    print(f"  ✅ DNS: {alb['DNSName']}")
    print(f"  ✅ Estado: {alb['State']['Code']}\n")
except Exception as e:
    print(f"❌ Error: {e}\n")

print("✨ Verificación completada!")
