#!/usr/bin/env python3
"""
Create ALB listener to forward traffic to target group
"""
import boto3

elbv2_client = boto3.client('elbv2', region_name='us-east-1')

try:
    # Get ALB
    print("🔍 Obteniendo ALB...")
    albs = elbv2_client.describe_load_balancers(Names=['proyecto-acompanamiento-alb'])
    alb_arn = albs['LoadBalancers'][0]['LoadBalancerArn']
    print(f"✅ ALB encontrado: {alb_arn}")
    
    # Get target group
    print("\n🔍 Obteniendo target group...")
    tg_response = elbv2_client.describe_target_groups(Names=['tg-acompanamiento'])
    tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
    print(f"✅ Target group encontrado: {tg_arn}")
    
    # Check if listener exists
    print("\n🔍 Verificando listeners...")
    listeners = elbv2_client.describe_listeners(LoadBalancerArn=alb_arn)
    
    if listeners['Listeners']:
        print(f"✅ {len(listeners['Listeners'])} listener(s) encontrado(s)")
        for listener in listeners['Listeners']:
            print(f"   - Puerto {listener['Port']}, Protocolo: {listener['Protocol']}")
    else:
        print("❌ No hay listeners, creando uno...")
        response = elbv2_client.create_listener(
            LoadBalancerArn=alb_arn,
            Protocol='HTTP',
            Port=80,
            DefaultActions=[{
                'Type': 'forward',
                'TargetGroupArn': tg_arn
            }]
        )
        print(f"✅ Listener creado: {response['Listeners'][0]['ListenerArn']}")
    
    print("\n✨ ¡Configuración completada!")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
