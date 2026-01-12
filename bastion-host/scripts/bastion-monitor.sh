#!/bin/bash

# Bastion Monitor - Monitorea la salud y actividad del Bastion Host

# Recolectar métricas del sistema
HOSTNAME=$(hostname)
UPTIME=$(uptime -p)
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}')
MEMORY_USAGE=$(free | awk 'NR==2 {printf("%.1f%%", $3/$2 * 100)}')
CPU_LOAD=$(uptime | awk -F'load average:' '{ print $2 }')
SSH_CONNECTIONS=$(netstat -tnp 2>/dev/null | grep ':22' | wc -l)
SSH_AUTH_LOGS=$(tail -100 /var/log/auth.log 2>/dev/null | grep -i "accepted\|failed" | wc -l)

# Crear timestamp
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Log a archivo
LOG_FILE="/var/log/bastion/monitor.log"
mkdir -p $(dirname $LOG_FILE)

cat >> $LOG_FILE << EOF
[$TIMESTAMP] Bastion Host Status
  - Hostname: $HOSTNAME
  - Uptime: $UPTIME
  - Disk: $DISK_USAGE
  - Memory: $MEMORY_USAGE
  - CPU Load: $CPU_LOAD
  - SSH Connections: $SSH_CONNECTIONS
  - Auth Events: $SSH_AUTH_LOGS

EOF

# Enviar a CloudWatch si está disponible
# (Aquí se puede agregar lógica de CloudWatch si es necesario)

echo "[MONITOR] $(date '+%Y-%m-%d %H:%M:%S') - Métricas recolectadas"
