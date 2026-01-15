#!/usr/bin/env python3
"""
Restart Core Docker Services via SSH
Intenta conectarse a EC2-Core via Bastion y reinicia docker-compose
"""

import subprocess
import sys
import time

def run_ssh_command(bastion_ip, core_ip, ssh_key_path, command, timeout=30):
    """Ejecuta comando SSH via Bastion"""
    
    try:
        print(f"\n🔄 Intentando conectarse a {core_ip} via {bastion_ip}...")
        
        # Comando SSH con ProxyJump
        ssh_cmd = [
            'ssh',
            '-i', ssh_key_path,
            '-o', 'StrictHostKeyChecking=no',
            '-o', 'ConnectTimeout=' + str(timeout),
            '-o', f'ProxyCommand=ssh -i {ssh_key_path} -W %h:%p -o StrictHostKeyChecking=no -o ConnectTimeout=15 ubuntu@{bastion_ip}',
            f'ubuntu@{core_ip}',
            command
        ]
        
        print(f"  Ejecutando: {' '.join(ssh_cmd[:3])} ... {command[:50]}...")
        
        result = subprocess.run(
            ssh_cmd,
            capture_output=True,
            text=True,
            timeout=timeout
        )
        
        if result.returncode == 0:
            print("✅ Comando ejecutado exitosamente")
            print("\nOutput:")
            print(result.stdout)
            return True
        else:
            print(f"❌ Error (exit code {result.returncode}):")
            print(result.stderr)
            return False
            
    except subprocess.TimeoutExpired:
        print(f"❌ Timeout después de {timeout}s")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def restart_core_services():
    """Reinicia servicios en EC2-Core"""
    
    bastion_ip = "34.235.224.202"
    core_ip = "172.31.79.241"
    ssh_key = "ssh-key-ec2.pem"
    
    # Script a ejecutar en EC2-Core
    script = """
    set -e
    cd ~/Proyecto-Acompa-amiento- || exit 1
    echo "📋 Docker Containers Before:"
    docker ps -a --format "table {{.Names}}\\t{{.Status}}" || echo "Docker unavailable"
    echo ""
    echo "🔄 Stopping services..."
    sudo docker-compose -f docker-compose.core.yml down 2>/dev/null || docker-compose -f docker-compose.core.yml down
    sleep 3
    echo ""
    echo "🔄 Starting services..."
    sudo docker-compose -f docker-compose.core.yml up -d 2>/dev/null || docker-compose -f docker-compose.core.yml up -d
    sleep 15
    echo ""
    echo "📋 Docker Containers After:"
    docker ps -a --format "table {{.Names}}\\t{{.Status}}"
    """
    
    print("\n" + "="*60)
    print("RESTARTING CORE DOCKER SERVICES")
    print("="*60)
    print(f"Bastion: {bastion_ip}")
    print(f"Core: {core_ip}")
    
    return run_ssh_command(bastion_ip, core_ip, ssh_key, script, timeout=60)

def verify_services():
    """Verifica que los servicios estén respondiendo"""
    
    print("\n" + "="*60)
    print("VERIFYING SERVICES")
    print("="*60)
    
    endpoints = [
        ("Health", "http://52.7.168.4:8080/health"),
        ("Horarios", "http://52.7.168.4:8080/horarios"),
        ("Estudiantes", "http://52.7.168.4:8080/estudiantes/reservas/estudiante/1"),
    ]
    
    for name, url in endpoints:
        print(f"\n  Testing {name}: {url}")
        try:
            result = subprocess.run(
                ['curl', '-s', '-m', '3', url],
                capture_output=True,
                text=True
            )
            
            if "error" in result.stdout.lower():
                print(f"    ❌ {result.stdout[:80]}")
            elif result.returncode == 0:
                print(f"    ✅ Response received")
                print(f"      {result.stdout[:100]}")
            else:
                print(f"    ⚠️  Timeout or error")
                
        except Exception as e:
            print(f"    ❌ Error: {e}")

if __name__ == "__main__":
    try:
        # Intenta reiniciar servicios
        success = restart_core_services()
        
        if success:
            print("\n⏳ Esperando que los servicios se estabilicen...")
            time.sleep(10)
            
            # Verifica servicios
            verify_services()
            
            print("\n" + "="*60)
            print("✅ RESTART COMPLETED")
            print("="*60)
            sys.exit(0)
        else:
            print("\n" + "="*60)
            print("❌ RESTART FAILED")
            print("="*60)
            sys.exit(1)
            
    except KeyboardInterrupt:
        print("\n\n❌ Interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n\n❌ Unexpected error: {e}")
        sys.exit(1)
