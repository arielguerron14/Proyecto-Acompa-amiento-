#!/bin/bash

# Script para ejecutar Terraform localmente (desarrollo)
# No recomendado para producción - usa GitHub Actions workflow

set -e

TERRAFORM_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/terraform" && pwd)"
ACTION="${1:-plan}"
AUTO_APPROVE="${2:-false}"

echo "🔧 Terraform Infrastructure Management"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Directorio: $TERRAFORM_DIR"
echo "Acción: $ACTION"
echo "Auto-Approve: $AUTO_APPROVE"
echo ""

# Verificar terraform instalado
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform no está instalado"
    echo "Descárgalo desde: https://www.terraform.io/downloads.html"
    exit 1
fi

echo "✅ Terraform version:"
terraform -version | head -1

echo ""
echo "🔐 Verificando credenciales AWS..."
AWS_ACCOUNT=$(aws sts get-caller-identity --query Account --output text)
AWS_REGION=$(aws configure get region)
echo "   Cuenta: $AWS_ACCOUNT"
echo "   Región: $AWS_REGION"

cd "$TERRAFORM_DIR"

echo ""
echo "📦 Inicializando Terraform..."
terraform init

echo ""
echo "✔️  Validando configuración..."
terraform validate

if [ "$ACTION" = "plan" ]; then
    echo ""
    echo "📋 Ejecutando Terraform Plan..."
    terraform plan \
        -lock=true \
        -out=tfplan \
        -var="environment=development" \
        | tee plan_output.txt
    
    echo ""
    echo "✅ Plan guardado en: tfplan"
    echo "💡 Siguiente paso: ./terraform-local.sh apply"

elif [ "$ACTION" = "apply" ]; then
    echo ""
    echo "🚀 Aplicando cambios..."
    
    if [ -f tfplan ]; then
        echo "📄 Usando plan guardado..."
        terraform apply tfplan
    else
        echo "⚠️  No hay plan guardado. Ejecutando apply directo..."
        
        if [ "$AUTO_APPROVE" = "true" ]; then
            terraform apply \
                -auto-approve \
                -lock=true \
                -var="environment=development"
        else
            terraform apply \
                -lock=true \
                -var="environment=development"
        fi
    fi
    
    echo ""
    echo "✅ Cambios aplicados!"
    echo ""
    echo "📊 Outputs:"
    terraform output -json | jq .

elif [ "$ACTION" = "destroy" ]; then
    echo ""
    echo "⚠️  DESTRUYENDO INFRAESTRUCTURA"
    echo ""
    read -p "¿Confirmar destrucción? (yes/no): " CONFIRM
    
    if [ "$CONFIRM" = "yes" ]; then
        if [ "$AUTO_APPROVE" = "true" ]; then
            terraform destroy -auto-approve -lock=true
        else
            terraform destroy -lock=true
        fi
        echo "✅ Infraestructura destruida"
    else
        echo "❌ Cancelado"
    fi

elif [ "$ACTION" = "output" ]; then
    echo ""
    echo "📊 Terraform Outputs:"
    terraform output -json | jq .

elif [ "$ACTION" = "refresh" ]; then
    echo ""
    echo "🔄 Refrescando estado..."
    terraform refresh -lock=true

elif [ "$ACTION" = "fmt" ]; then
    echo ""
    echo "🎨 Formateando código..."
    terraform fmt -recursive .
    echo "✅ Formateado"

else
    echo "❌ Acción desconocida: $ACTION"
    echo ""
    echo "Usos:"
    echo "  ./terraform-local.sh plan          - Ver cambios"
    echo "  ./terraform-local.sh apply         - Aplicar cambios"
    echo "  ./terraform-local.sh destroy       - Eliminar recursos"
    echo "  ./terraform-local.sh output        - Ver outputs"
    echo "  ./terraform-local.sh refresh       - Refrescar estado"
    echo "  ./terraform-local.sh fmt           - Formatear código"
    exit 1
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Completado"
