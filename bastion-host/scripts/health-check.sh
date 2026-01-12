#!/bin/bash

# Health Check para Bastion Host
# Script que verifica que SSH está disponible y respondiendo

set -e

BASTION_PORT="${BASTION_PORT:-22}"
BASTION_HOST="localhost"

# Verificar que SSH está disponible
if [ ! -S /var/run/sshd.socket ] && [ ! -f /var/run/sshd.pid ]; then
    # Intenta conectar al puerto SSH
    if nc -z localhost $BASTION_PORT 2>/dev/null; then
        echo "[HEALTH] ✅ SSH está disponible en puerto $BASTION_PORT"
        exit 0
    else
        echo "[HEALTH] ❌ SSH no está disponible"
        exit 1
    fi
else
    echo "[HEALTH] ✅ SSHD está ejecutándose"
    exit 0
fi
