#!/bin/bash
# Script para diagnosticar los contenedores en EC2

MESSAGING_IP="44.221.50.177"
MONITORING_IP="54.198.235.28"
SSH_USER="ec2-user"
SSH_KEY="$HOME/.ssh/key-acompanamiento.pem"

# Función para conectar via SSH
ssh_exec() {
    local host=$1
    local cmd=$2
    echo "=== Conectando a $host ==="
    if [ -f "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$SSH_USER@$host" "$cmd" 2>&1 || echo "Error al conectar"
    else
        echo "Clave SSH no encontrada: $SSH_KEY"
        echo "Buscando claves disponibles..."
        ls -la ~/.ssh/ 2>&1 | head -20
    fi
}

echo "=========================================="
echo "DIAGNÓSTICO DE SERVICIOS EN EC2"
echo "=========================================="
echo ""

# Verificar Zookeeper
echo "[1] Verificando Kafka en EC2_MESSAGING..."
ssh_exec "$MESSAGING_IP" "docker ps -a | grep -E 'kafka|zookeeper' && docker logs proyecto-kafka 2>&1 | tail -20"

echo ""
echo "[2] Verificando Prometheus en EC2_MONITORING..."
ssh_exec "$MONITORING_IP" "docker ps -a | grep -E 'prometheus|grafana' && docker logs proyecto-prometheus 2>&1 | tail -20"

echo ""
echo "=========================================="
echo "Fin del diagnóstico"
echo "=========================================="
