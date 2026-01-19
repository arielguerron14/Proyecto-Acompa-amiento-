#!/bin/bash

# Fix Frontend Deployment - Direct Docker Commands via SSM

AWS_REGION="us-east-1"

echo "🔍 Obteniendo Instance ID de EC2-Frontend..."
INSTANCE_ID=$(aws ec2 describe-instances \
  --filters "Name=tag:Name,Values=EC2-Frontend" \
  --region $AWS_REGION \
  --query 'Reservations[0].Instances[0].InstanceId' \
  --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
  echo "❌ Error: No se encontró EC2-Frontend"
  exit 1
fi

echo "✅ Instance ID encontrado: $INSTANCE_ID"
echo ""
echo "🚀 Desplegando Frontend..."

# Send commands to fix and deploy frontend
COMMAND_ID=$(aws ssm send-command \
  --instance-ids "$INSTANCE_ID" \
  --document-name "AWS-RunShellScript" \
  --region $AWS_REGION \
  --parameters 'commands=[
    "echo Deteniendo contenedor anterior...",
    "docker stop frontend 2>/dev/null || true",
    "docker rm frontend 2>/dev/null || true",
    "echo Limpiando images...",
    "docker rmi frontend-web:latest 2>/dev/null || true",
    "echo Verificando acceso a Docker...",
    "docker ps",
    "echo Corriendo nuevo contenedor de Frontend...",
    "docker run -d --name frontend -p 3000:3000 --restart unless-stopped frontend-web:latest",
    "echo Verificando que el contenedor esté corriendo...",
    "sleep 2",
    "docker ps | grep frontend",
    "echo Verificando logs...",
    "docker logs frontend 2>&1 | tail -15"
  ]' \
  --query 'Command.CommandId' \
  --output text)

echo "📤 Comando enviado: $COMMAND_ID"
echo ""
echo "⏳ Esperando resultado (máximo 2 minutos)..."

# Wait for command to complete
for i in {1..60}; do
  STATUS=$(aws ssm get-command-invocation \
    --command-id "$COMMAND_ID" \
    --instance-id "$INSTANCE_ID" \
    --region $AWS_REGION \
    --query 'Status' \
    --output text 2>/dev/null || echo "Pending")
  
  printf "\r  Estado: $STATUS (Intento $i/60)"
  
  if [ "$STATUS" = "Success" ] || [ "$STATUS" = "Failed" ]; then
    echo ""
    echo ""
    
    # Get output
    OUTPUT=$(aws ssm get-command-invocation \
      --command-id "$COMMAND_ID" \
      --instance-id "$INSTANCE_ID" \
      --region $AWS_REGION \
      --query 'StandardOutputContent' \
      --output text)
    
    echo "📋 Output:"
    echo "---"
    echo "$OUTPUT"
    echo "---"
    echo ""
    
    if [ "$STATUS" = "Success" ]; then
      echo "✅ Frontend deployment exitoso!"
      echo ""
      echo "🌐 Frontend disponible en: http://52.72.57.10:3000"
    else
      echo "❌ El comando falló"
      exit 1
    fi
    
    break
  fi
  
  sleep 2
done

echo ""
echo "✅ Proceso completado"
