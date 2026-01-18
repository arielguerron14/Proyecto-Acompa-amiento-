#!/bin/bash
# Diagnóstico de conectividad SSH para despliegue

echo "================================"
echo "SSH Connectivity Diagnostic"
echo "================================"
echo ""

# Cargar IPs desde config
MESSAGING_IP="44.222.110.85"
SSH_KEY_PATH="${HOME}/.ssh/id_rsa"
SSH_USER="ubuntu"

echo "1. Verificando SSH Key..."
if [ ! -f "$SSH_KEY_PATH" ]; then
    echo "ERROR: SSH key not found at $SSH_KEY_PATH"
    exit 1
fi

echo "✓ SSH key found at $SSH_KEY_PATH"
ls -la "$SSH_KEY_PATH"
echo ""

echo "2. Verificando permisos de SSH key..."
PERMS=$(stat -c "%a" "$SSH_KEY_PATH")
if [ "$PERMS" != "600" ]; then
    echo "ERROR: SSH key has incorrect permissions: $PERMS (should be 600)"
    chmod 600 "$SSH_KEY_PATH"
    echo "✓ Fixed permissions"
else
    echo "✓ SSH key permissions are correct (600)"
fi
echo ""

echo "3. Verificando fingerprint de SSH key..."
ssh-keygen -l -f "$SSH_KEY_PATH"
echo ""

echo "4. Probando conectividad SSH a $MESSAGING_IP..."
if timeout 5 ssh -o ConnectTimeout=5 -o StrictHostKeyChecking=no -i "$SSH_KEY_PATH" "$SSH_USER@$MESSAGING_IP" "echo 'SSH Connection Successful!'" 2>&1; then
    echo "✓ SSH connection successful"
else
    echo "✗ SSH connection failed"
    echo ""
    echo "Debugging info:"
    ssh -vvv -o ConnectTimeout=5 -i "$SSH_KEY_PATH" "$SSH_USER@$MESSAGING_IP" "whoami" 2>&1 | head -30
fi
echo ""

echo "5. Verificando si docker-compose puede copiarse..."
if [ -f "docker-compose.messaging.yml" ]; then
    echo "✓ docker-compose.messaging.yml exists locally"
    
    if timeout 10 scp -i "$SSH_KEY_PATH" docker-compose.messaging.yml "$SSH_USER@$MESSAGING_IP:/tmp/" 2>&1; then
        echo "✓ SCP successful"
    else
        echo "✗ SCP failed"
    fi
else
    echo "ERROR: docker-compose.messaging.yml not found"
fi
echo ""

echo "6. Resumen:"
echo "   - SSH Key: $SSH_KEY_PATH"
echo "   - Target: $SSH_USER@$MESSAGING_IP"
echo "   - Port: 22 (default)"
echo "   - Auth Method: PublicKey"
echo ""
