#!/bin/bash

# Bastion Audit Log - Registra todas las conexiones y actividades

# Variables
AUDIT_LOG="/var/log/bastion/audit.log"
AUTH_LOG="/var/log/auth.log"
mkdir -p $(dirname $AUDIT_LOG)

# Filtrar eventos de autenticación SSH
echo "=== Bastion SSH Audit Log ===" >> $AUDIT_LOG
echo "Reporte generado: $(date '+%Y-%m-%d %H:%M:%S')" >> $AUDIT_LOG
echo "" >> $AUDIT_LOG

# Conexiones aceptadas
echo "--- Conexiones Aceptadas ---" >> $AUDIT_LOG
grep -i "Accepted" $AUTH_LOG 2>/dev/null | tail -20 >> $AUDIT_LOG || echo "No connections found" >> $AUDIT_LOG

# Intentos fallidos
echo "" >> $AUDIT_LOG
echo "--- Intentos Fallidos ---" >> $AUDIT_LOG
grep -i "Failed\|Invalid" $AUTH_LOG 2>/dev/null | tail -20 >> $AUDIT_LOG || echo "No failed attempts" >> $AUDIT_LOG

# Usuarios nuevos
echo "" >> $AUDIT_LOG
echo "--- Actividad de Usuarios ---" >> $AUDIT_LOG
grep -i "session opened\|session closed" $AUTH_LOG 2>/dev/null | tail -20 >> $AUDIT_LOG || echo "No session data" >> $AUDIT_LOG

echo "=== Fin del Reporte ===" >> $AUDIT_LOG
echo "" >> $AUDIT_LOG

echo "[AUDIT] $(date '+%Y-%m-%d %H:%M:%S') - Auditoría completada"
