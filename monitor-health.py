#!/usr/bin/env python3
"""
Monitor ALB target health and wait for healthy status
"""
import boto3
import time

elbv2_client = boto3.client('elbv2', region_name='us-east-1')

try:
    # Get target group
    print("🔍 Obteniendo target group...")
    tg_response = elbv2_client.describe_target_groups(Names=['tg-acompanamiento'])
    tg_arn = tg_response['TargetGroups'][0]['TargetGroupArn']
    
    print("⏳ Esperando a que los targets pasen a 'healthy'...")
    print("   Esto puede tomar 30-60 segundos...\n")
    
    healthy_count = 0
    max_attempts = 15
    attempt = 0
    
    while attempt < max_attempts:
        attempt += 1
        
        health_response = elbv2_client.describe_target_health(TargetGroupArn=tg_arn)
        
        healthy = sum(1 for t in health_response['TargetHealthDescriptions'] 
                     if t['TargetHealth']['State'] == 'healthy')
        initial = sum(1 for t in health_response['TargetHealthDescriptions'] 
                     if t['TargetHealth']['State'] == 'initial')
        unhealthy = sum(1 for t in health_response['TargetHealthDescriptions'] 
                       if t['TargetHealth']['State'] == 'unhealthy')
        
        total = len(health_response['TargetHealthDescriptions'])
        
        print(f"[{attempt}/{max_attempts}] 🏥 Estado de salud:")
        print(f"   ✅ Healthy: {healthy}/{total}")
        print(f"   ⏳ Initial: {initial}/{total}")
        print(f"   ❌ Unhealthy: {unhealthy}/{total}")
        
        if healthy == total:
            print("\n🎉 ¡Todos los targets están HEALTHY!")
            break
        
        if attempt < max_attempts:
            time.sleep(4)
    
    # Final status
    print("\n📊 Estado final detallado:")
    for target in health_response['TargetHealthDescriptions']:
        target_id = target['Target']['Id']
        state = target['TargetHealth']['State']
        reason = target['TargetHealth'].get('Reason', 'N/A')
        description = target['TargetHealth'].get('Description', 'N/A')
        
        icon = "✅" if state == "healthy" else "⏳" if state == "initial" else "❌"
        print(f"   {icon} {target_id}")
        print(f"      Estado: {state}")
        print(f"      Razón: {reason}")
        if description != 'N/A':
            print(f"      Descripción: {description}")
    
except Exception as e:
    print(f"❌ Error: {str(e)}")
    import traceback
    traceback.print_exc()
