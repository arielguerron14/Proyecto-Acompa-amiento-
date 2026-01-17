#!/usr/bin/env bash
# Script para ejecutar deployment rápido de todos los workflows
# Uso: source run-all-workflows.sh

echo "════════════════════════════════════════════════════════════════════"
echo "  🚀 GITHUB WORKFLOWS - MODO RÁPIDO"
echo "════════════════════════════════════════════════════════════════════"
echo ""

# Variables
REPO="arielguerron14/Proyecto-Acompa-amiento-"
WORKFLOWS=(
  "deploy-ec2-core.yml"
  "deploy-ec2-db.yml"
  "deploy-ec2-api-gateway.yml"
  "deploy-ec2-frontend.yml"
  "deploy-ec2-analytics.yml"
  "deploy-ec2-bastion.yml"
  "deploy-ec2-monitoring.yml"
  "deploy-ec2-notificaciones.yml"
  "deploy-ec2-messaging.yml"
)

echo "✅ Workflows disponibles para ejecutar:"
echo ""
for i in "${!WORKFLOWS[@]}"; do
  echo "  $((i+1)). ${WORKFLOWS[$i]}"
done

echo ""
echo "Selecciona workflow a ejecutar (1-9) o 'all' para todos:"
echo ""
echo "Ejemplos:"
echo "  gh workflow run deploy-ec2-core.yml --repo $REPO"
echo "  gh workflow run deploy-ec2-analytics.yml --repo $REPO"
echo ""

echo "O ejecuta todos:"
echo "  for w in deploy-ec2-{core,db,api-gateway,frontend,analytics}.yml; do"
echo "    echo \"🚀 Running \$w...\""
echo "    gh workflow run \$w --repo $REPO"
echo "    sleep 5"
echo "  done"
echo ""

echo "════════════════════════════════════════════════════════════════════"
