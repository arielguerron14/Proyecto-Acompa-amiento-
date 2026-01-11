#!/usr/bin/env python3
"""
Check EC2 services status via paramiko SSH
"""

import socket
import sys
from time import sleep

def check_port(host, port, timeout=3):
    """Check if a port is open on a host"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def check_http(host, port, path="/", timeout=3):
    """Check HTTP endpoint"""
    try:
        import urllib.request
        url = f"http://{host}:{port}{path}"
        req = urllib.request.Request(url)
        response = urllib.request.urlopen(req, timeout=timeout)
        return response.status == 200
    except Exception as e:
        return False

# Services to check
services = [
    {"name": "ZOOKEEPER", "ip": "54.82.124.96", "port": 2181, "type": "tcp"},
    {"name": "KAFKA", "ip": "54.82.124.96", "port": 9092, "type": "tcp"},
    {"name": "RABBITMQ_AMQP", "ip": "54.82.124.96", "port": 5672, "type": "tcp"},
    {"name": "RABBITMQ_MGMT", "ip": "54.82.124.96", "port": 15672, "type": "http", "path": "/api/queues"},
    {"name": "PROMETHEUS", "ip": "34.203.175.72", "port": 9090, "type": "http", "path": "/api/v1/targets"},
    {"name": "GRAFANA", "ip": "34.203.175.72", "port": 3000, "type": "http", "path": "/api/health"},
]

print("=" * 50)
print("VERIFICANDO SERVICIOS EN EC2")
print("=" * 50)
print()

results = []
working = 0
failing = 0

for idx, service in enumerate(services, 1):
    name = service["name"]
    ip = service["ip"]
    port = service["port"]
    service_type = service["type"]
    
    status = "⏳"
    status_text = "Verificando..."
    
    try:
        if service_type == "tcp":
            if check_port(ip, port):
                status = "✅"
                status_text = "FUNCIONANDO"
                working += 1
            else:
                status = "❌"
                status_text = "NO ACCESIBLE"
                failing += 1
        elif service_type == "http":
            path = service.get("path", "/")
            if check_http(ip, port, path):
                status = "✅"
                status_text = "FUNCIONANDO"
                working += 1
            else:
                status = "❌"
                status_text = "NO ACCESIBLE"
                failing += 1
    except Exception as e:
        status = "❌"
        status_text = f"ERROR: {str(e)[:20]}"
        failing += 1
    
    print(f"[{idx}/{len(services)}] {name:20} ({ip}:{port}) ... {status} {status_text}")
    results.append({"name": name, "status": status, "text": status_text})

print()
print("=" * 50)
print(f"✅ Funcionando: {working}/{len(services)}")
print(f"❌ No accesible: {failing}/{len(services)}")
print("=" * 50)

if failing > 0:
    print("\nServicios que fallan:")
    for r in results:
        if r["status"] == "❌":
            print(f"  - {r['name']}: {r['text']}")
    print("\n💡 Próximos pasos:")
    print("  1. Espera 2-3 minutos más (los deployments pueden estar en progreso)")
    print("  2. Si persiste, revisa los logs de GitHub Actions")
    print("  3. Conecta vía SSH a las instancias EC2 para ver docker logs")
    sys.exit(1)
else:
    print("\n🎉 ¡TODOS LOS SERVICIOS ESTÁN FUNCIONANDO!")
    sys.exit(0)
