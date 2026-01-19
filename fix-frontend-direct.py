#!/usr/bin/env python3
"""
Direct Frontend Fix - Conecta directamente a EC2-Frontend y redeploya
Usa AWS CLI directamente sin necesidad de secrets (usa credenciales del sistema)
"""

import subprocess
import sys
import json
import time

AWS_REGION = "us-east-1"

def run_command(cmd, shell=True):
    """Run a command and return output"""
    try:
        result = subprocess.run(
            cmd, 
            shell=shell, 
            capture_output=True, 
            text=True,
            timeout=30
        )
        return result.stdout.strip(), result.stderr.strip(), result.returncode
    except subprocess.TimeoutExpired:
        return "", "Command timeout", -1

def main():
    print("🔍 Buscando EC2-Frontend...")
    
    # Get instance ID
    cmd = f"""aws ec2 describe-instances \
        --filters "Name=tag:Name,Values=EC2-Frontend" "Name=instance-state-name,Values=running" \
        --region {AWS_REGION} \
        --query "Reservations[0].Instances[0].InstanceId" \
        --output text"""
    
    instance_id, err, code = run_command(cmd)
    
    if code != 0 or not instance_id or instance_id == "None":
        print(f"❌ Error: {err}")
        print("💡 Asegúrate de que AWS credentials están configuradas:")
        print("   export AWS_ACCESS_KEY_ID='...'")
        print("   export AWS_SECRET_ACCESS_KEY='...'")
        sys.exit(1)
    
    print(f"✅ Encontrado: {instance_id}")
    print("")
    print("📤 Enviando comando via SSM...")
    
    # Build the deployment command
    commands = [
        "cd /tmp",
        "docker stop frontend 2>/dev/null || true",
        "docker rm frontend 2>/dev/null || true",
        "docker rmi frontend-web:latest 2>/dev/null || true",
        "curl -s https://raw.githubusercontent.com/arielguerron14/Proyecto-Acompa-amiento-/main/docker-compose.ec2-frontend.yml > docker-compose.yml",
        "echo '✅ docker-compose.yml descargado'",
        "grep -A2 'ports:' docker-compose.yml",
        "echo '📊 Levantando contenedor...'",
        "docker-compose up -d --no-build",
        "sleep 3",
        "echo '🔍 Verificando...'",
        "docker ps | grep frontend",
        "docker logs frontend 2>&1 | tail -5"
    ]
    
    # Send via SSM
    commands_json = json.dumps(commands)
    send_cmd = f"""aws ssm send-command \
        --instance-ids {instance_id} \
        --document-name "AWS-RunShellScript" \
        --region {AWS_REGION} \
        --parameters 'commands={commands_json}' \
        --query 'Command.CommandId' \
        --output text"""
    
    cmd_id, err, code = run_command(send_cmd)
    
    if code != 0:
        print(f"❌ Error enviando comando: {err}")
        sys.exit(1)
    
    print(f"Command ID: {cmd_id}")
    print("")
    print("⏳ Esperando resultado (máximo 2 minutos)...")
    
    # Wait for command
    for attempt in range(60):
        status_cmd = f"""aws ssm get-command-invocation \
            --command-id {cmd_id} \
            --instance-id {instance_id} \
            --region {AWS_REGION} \
            --query 'Status' \
            --output text"""
        
        status, err, code = run_command(status_cmd)
        print(f"\r  Intento {attempt+1}/60 - Status: {status}", end='', flush=True)
        
        if status in ['Success', 'Failed']:
            print("\n")
            
            # Get output
            output_cmd = f"""aws ssm get-command-invocation \
                --command-id {cmd_id} \
                --instance-id {instance_id} \
                --region {AWS_REGION} \
                --query 'StandardOutputContent' \
                --output text"""
            
            output, _, _ = run_command(output_cmd)
            
            print("📋 Output:")
            print("---")
            print(output)
            print("---")
            
            if status == 'Success':
                print("")
                print("✅ ¡Frontend redeploy exitoso!")
                print("")
                print("🌐 Accede en: http://52.72.57.10:3000")
                return 0
            else:
                print("")
                print("❌ El comando falló")
                return 1
        
        time.sleep(2)
    
    print("\n❌ Timeout esperando resultado")
    return 1

if __name__ == "__main__":
    sys.exit(main())
