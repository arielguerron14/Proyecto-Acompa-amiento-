#!/usr/bin/env python3
"""
Register running EC2 instances to ALB target group
"""
import boto3
import json
import sys

# Create clients
ec2_client = boto3.client('ec2', region_name='us-east-1')
elbv2_client = boto3.client('elbv2', region_name='us-east-1')

try:
    # Get all running instances with Project tag
    print("🔍 Obteniendo instancias en ejecución...")
    response = ec2_client.describe_instances(
        Filters=[
            {'Name': 'tag:Project', 'Values': ['proyecto-acompanamiento']},
            {'Name': 'instance-state-name', 'Values': ['running']}
        ]
    )
    
    instance_ids = []
    for reservation in response['Reservations']:
        for instance in reservation['Instances']:
            instance_ids.append(instance['InstanceId'])
    
    print(f"✅ {len(instance_ids)} instancias en ejecución encontradas:")
    for iid in instance_ids:
        print(f"   - {iid}")
    
    # Get target group
    print("\n🔍 Buscando target group...")
    tg_response = elbv2_client.describe_target_groups(
        Names=['tg-acompanamiento']
    )
    
    if not tg_response['TargetGroups']:
        print("❌ Target group no encontrado!")
        sys.exit(1)
    
    target_group_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
    print(f"✅ Target group encontrado: {target_group_arn}")
    
    # Register targets
    print(f"\n📝 Registrando {len(instance_ids)} instancias en el target group...")
    targets = [{'Id': iid, 'Port': 80} for iid in instance_ids]
    
    register_response = elbv2_client.register_targets(
        TargetGroupArn=target_group_arn,
        Targets=targets
    )
    
    print("✅ Instancias registradas exitosamente!")
    print(f"   Respuesta: {json.dumps(register_response, indent=2, default=str)}")
    
    # Check health
    print("\n🏥 Esperando health checks...")
    import time
    time.sleep(5)
    
    health_response = elbv2_client.describe_target_health(
        TargetGroupArn=target_group_arn
    )
    
    print("\n📊 Estado de salud de los targets:")
    for target in health_response['TargetHealthDescriptions']:
        target_id = target['Target']['Id']
        state = target['TargetHealth']['State']
        description = target['TargetHealth'].get('Description', 'N/A')
        status_icon = "✅" if state == "healthy" else "⏳" if state == "initial" else "❌"
        print(f"   {status_icon} {target_id}: {state} ({description})")
    
    print("\n✨ Registración completada!")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    sys.exit(1)
