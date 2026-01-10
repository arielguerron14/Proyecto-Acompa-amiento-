#!/usr/bin/env python3
import socket
import sys

def test_port(host, port, timeout=5):
    """Test if a port is open"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        result = sock.connect_ex((host, port))
        sock.close()
        return result == 0
    except Exception as e:
        return False

def test_http(host, port, timeout=5):
    """Test HTTP connectivity"""
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(timeout)
        sock.connect((host, port))
        
        # Send HTTP request
        request = b"GET / HTTP/1.1\r\nHost: {}\r\n\r\n".format(host).encode()
        sock.send(request)
        
        response = sock.recv(1024)
        sock.close()
        return response.decode('utf-8', errors='ignore')[:200]
    except Exception as e:
        return None

services = [
    ("ZOOKEEPER", "44.221.50.177", 2181, "tcp"),
    ("KAFKA", "44.221.50.177", 9092, "tcp"),
    ("RABBITMQ_AMQP", "44.221.50.177", 5672, "tcp"),
    ("RABBITMQ_MGMT", "44.221.50.177", 15672, "http"),
    ("PROMETHEUS", "54.198.235.28", 9090, "http"),
    ("GRAFANA", "54.198.235.28", 3000, "http"),
]

print("\n" + "="*60)
print("ADVANCED EC2 SERVICE DIAGNOSTICS")
print("="*60 + "\n")

for name, host, port, protocol in services:
    print(f"[{name}] {host}:{port}")
    
    # Test TCP connection
    if test_port(host, port):
        print(f"  ✅ TCP connection successful")
        
        if protocol == "http":
            response = test_http(host, port)
            if response:
                print(f"  ✅ HTTP response received:")
                print(f"     {response[:100]}...")
            else:
                print(f"  ⚠️  TCP open but no HTTP response")
    else:
        print(f"  ❌ TCP connection failed (port closed or host unreachable)")
    
    print()

print("="*60)
print("SUMMARY:")
print("- If TCP fails: Network/firewall issue or container not running")
print("- If TCP succeeds but HTTP fails: Service might be TCP-only")
print("="*60 + "\n")
