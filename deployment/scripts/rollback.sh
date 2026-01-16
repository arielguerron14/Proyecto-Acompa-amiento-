#!/bin/bash
# Rollback Script - Revierte a versión anterior de servicios
# Uso: ./rollback.sh [INSTANCE_TAG] [IMAGE_VERSION]
# Ejemplo: ./rollback.sh EC2-CORE v1.0.0

INSTANCE_TAG=${1}
IMAGE_VERSION=${2:-latest}
AWS_REGION="us-east-1"

if [ -z "$INSTANCE_TAG" ]; then
    echo "❌ Uso: ./rollback.sh <INSTANCE_TAG> [IMAGE_VERSION]"
    echo ""
    echo "Instancias disponibles:"
    echo "  - EC2-Bastion"
    echo "  - EC2-API-Gateway"
    echo "  - EC2-CORE"
    echo "  - EC2-Reportes"
    echo "  - EC2-Notificaciones"
    echo "  - EC2-Messaging"
    echo "  - EC2-DB"
    echo "  - EC2-Analytics"
    echo "  - EC2-Monitoring"
    echo "  - EC2-Frontend"
    exit 1
fi

echo "🔄 Iniciando rollback para $INSTANCE_TAG a versión $IMAGE_VERSION..."

# Obtener ID de instancia
INSTANCE_ID=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$INSTANCE_TAG" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
    echo "❌ Instancia $INSTANCE_TAG no encontrada o no está corriendo"
    exit 1
fi

echo "📍 Instancia encontrada: $INSTANCE_ID"

# Preparar comando de rollback basado en la instancia
case "$INSTANCE_TAG" in
    "EC2-Bastion")
        commands=(
            "echo 'Deteniendo versión actual...'"
            "docker stop bastion-host || true"
            "docker pull bastion-host:$IMAGE_VERSION"
            "docker rm bastion-host || true"
            "docker run -d --name bastion-host -p 22:22 --restart always bastion-host:$IMAGE_VERSION"
            "echo 'Rollback completado'"
            "docker ps | grep bastion-host"
        )
        ;;
    "EC2-API-Gateway")
        commands=(
            "echo 'Deteniendo versión actual...'"
            "docker stop api-gateway || true"
            "docker pull api-gateway:$IMAGE_VERSION"
            "docker rm api-gateway || true"
            "docker run -d --name api-gateway -p 8080:8080 --restart always api-gateway:$IMAGE_VERSION"
            "echo 'Rollback completado'"
            "docker ps | grep api-gateway"
        )
        ;;
    "EC2-CORE")
        commands=(
            "echo 'Deteniendo versión actual de microservicios...'"
            "docker stop micro-auth micro-estudiantes micro-maestros micro-core || true"
            "docker pull micro-auth:$IMAGE_VERSION"
            "docker pull micro-estudiantes:$IMAGE_VERSION"
            "docker pull micro-maestros:$IMAGE_VERSION"
            "docker pull micro-core:$IMAGE_VERSION"
            "docker rm micro-auth micro-estudiantes micro-maestros micro-core || true"
            "docker run -d --name micro-auth -p 3001:3000 --restart always micro-auth:$IMAGE_VERSION"
            "docker run -d --name micro-estudiantes -p 3002:3000 --restart always micro-estudiantes:$IMAGE_VERSION"
            "docker run -d --name micro-maestros -p 3003:3000 --restart always micro-maestros:$IMAGE_VERSION"
            "docker run -d --name micro-core -p 3004:3000 --restart always micro-core:$IMAGE_VERSION"
            "echo 'Rollback completado'"
            "docker ps | grep micro-"
        )
        ;;
    "EC2-DB")
        commands=(
            "echo 'Advertencia: Rollback de bases de datos puede causar pérdida de datos'"
            "echo 'Deteniendo servicios de BD...'"
            "docker stop mongo postgres redis || true"
            "echo 'Tenga cuidado con rollback de datos'"
            "docker ps | grep -E 'mongo|postgres|redis'"
        )
        ;;
    *)
        echo "❌ Instancia $INSTANCE_TAG no reconocida"
        exit 1
        ;;
esac

# Enviar comando
echo "📤 Enviando comandos de rollback..."

for cmd in "${commands[@]}"; do
    aws ssm send-command \
        --region "$AWS_REGION" \
        --document-name "AWS-RunShellScript" \
        --instance-ids "$INSTANCE_ID" \
        --parameters "commands=['$cmd']" \
        > /dev/null
done

echo "✅ Comandos de rollback enviados"
echo "📊 Verifique el estado en AWS Systems Manager Console"
echo "   CommandId se mostró en la salida anterior"
