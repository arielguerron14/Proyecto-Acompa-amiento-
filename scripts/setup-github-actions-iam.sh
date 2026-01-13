#!/bin/bash

# Script para configurar IAM roles para GitHub Actions
# Este script crea los roles necesarios para que GitHub Actions pueda:
# - Ejecutar Terraform con acceso a AWS
# - Ejecutar comandos en EC2 vía SSM Session Manager

set -e

AWS_REGION="${1:-us-east-1}"
GITHUB_ORG="${2:-arielguerron14}"
GITHUB_REPO="${3:-Proyecto-Acompa-amiento-}"
AWS_ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

echo "📋 Configurando GitHub Actions roles para AWS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Cuenta AWS: $AWS_ACCOUNT_ID"
echo "Región: $AWS_REGION"
echo "Repo: $GITHUB_ORG/$GITHUB_REPO"
echo ""

# 1. Crear OIDC Provider si no existe
echo "1️⃣  Configurando OIDC Provider..."

OIDC_ARN=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(OpenIDConnectProviderArn, 'token.actions.githubusercontent.com')] | [0].OpenIDConnectProviderArn" --output text 2>/dev/null || echo "NOT_FOUND")

if [ "$OIDC_ARN" = "NOT_FOUND" ] || [ -z "$OIDC_ARN" ]; then
    echo "   ℹ️  Creando OIDC Provider para GitHub Actions..."
    
    THUMBPRINT=$(curl -s https://token.actions.githubusercontent.com/.well-known/openid-configuration | \
        jq -r '.jwks_uri' | sed 's|https://||' | cut -d'/' -f1 | \
        xargs -I {} openssl s_client -showcerts -connect {}:443 < /dev/null 2>/dev/null | \
        openssl x509 -fingerprint -noout | sed 's/://g' | awk '{print $NF}')
    
    aws iam create-open-id-connect-provider \
        --url "https://token.actions.githubusercontent.com" \
        --client-id-list "sts.amazonaws.com" \
        --thumbprint-list "$THUMBPRINT" \
        --region "$AWS_REGION" || echo "   ⚠️  OIDC Provider ya existe"
    
    OIDC_ARN=$(aws iam list-open-id-connect-providers --query "OpenIDConnectProviderList[?contains(OpenIDConnectProviderArn, 'token.actions.githubusercontent.com')] | [0].OpenIDConnectProviderArn" --output text)
else
    echo "   ✅ OIDC Provider ya existe: $OIDC_ARN"
fi

# 2. Crear Terraform Role
echo ""
echo "2️⃣  Creando Terraform Role..."

TERRAFORM_ROLE_NAME="github-actions-terraform-role"

# Policy document
cat > /tmp/terraform-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "$OIDC_ARN"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$GITHUB_ORG/$GITHUB_REPO:*"
        }
      }
    }
  ]
}
EOF

# Crear role
aws iam create-role \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --assume-role-policy-document file:///tmp/terraform-trust-policy.json \
    --region "$AWS_REGION" 2>/dev/null || echo "   ℹ️  Role $TERRAFORM_ROLE_NAME ya existe"

# Attach policies
echo "   Asignando permisos..."

aws iam attach-role-policy \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonEC2FullAccess" \
    --region "$AWS_REGION" || true

aws iam attach-role-policy \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/ElasticLoadBalancingFullAccess" \
    --region "$AWS_REGION" || true

aws iam attach-role-policy \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" \
    --region "$AWS_REGION" || true

aws iam attach-role-policy \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess" \
    --region "$AWS_REGION" || true

aws iam attach-role-policy \
    --role-name "$TERRAFORM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonVPCFullAccess" \
    --region "$AWS_REGION" || true

TERRAFORM_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/$TERRAFORM_ROLE_NAME"
echo "   ✅ Role creado: $TERRAFORM_ROLE_ARN"

# 3. Crear SSM Role
echo ""
echo "3️⃣  Creando SSM Role..."

SSM_ROLE_NAME="github-actions-ssm-role"

# Policy document
cat > /tmp/ssm-trust-policy.json <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "$OIDC_ARN"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:$GITHUB_ORG/$GITHUB_REPO:*"
        }
      }
    }
  ]
}
EOF

# Crear role
aws iam create-role \
    --role-name "$SSM_ROLE_NAME" \
    --assume-role-policy-document file:///tmp/ssm-trust-policy.json \
    --region "$AWS_REGION" 2>/dev/null || echo "   ℹ️  Role $SSM_ROLE_NAME ya existe"

echo "   Asignando permisos..."

aws iam attach-role-policy \
    --role-name "$SSM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore" \
    --region "$AWS_REGION" || true

aws iam attach-role-policy \
    --role-name "$SSM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonEC2ReadOnlyAccess" \
    --region "$AWS_REGION" || true

aws iam attach-role-policy \
    --role-name "$SSM_ROLE_NAME" \
    --policy-arn "arn:aws:iam::aws:policy/AmazonS3FullAccess" \
    --region "$AWS_REGION" || true

SSM_ROLE_ARN="arn:aws:iam::$AWS_ACCOUNT_ID:role/$SSM_ROLE_NAME"
echo "   ✅ Role creado: $SSM_ROLE_ARN"

# 4. Crear archivo de configuración para GitHub Secrets
echo ""
echo "4️⃣  Generando configuración para GitHub Secrets..."

cat > /tmp/github-secrets.env <<EOF
AWS_ACCOUNT_ID=$AWS_ACCOUNT_ID
AWS_REGION=$AWS_REGION
TERRAFORM_ROLE_ARN=$TERRAFORM_ROLE_ARN
SSM_ROLE_ARN=$SSM_ROLE_ARN
EOF

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Configuración completada!"
echo ""
echo "📋 Configura estos valores en GitHub:"
echo ""
echo "1. Ve a: https://github.com/$GITHUB_ORG/$GITHUB_REPO/settings/secrets/actions"
echo ""
echo "2. Crea/Actualiza los siguientes secretos:"
echo ""
cat /tmp/github-secrets.env | while read line; do
    echo "   • $line"
done
echo ""
echo "3. Usa estos valores en los workflows:"
echo "   - role-to-assume: $TERRAFORM_ROLE_ARN"
echo ""
echo "4. Verifica que las instancias EC2 tengan el IAM role correcto:"
echo "   aws iam list-instance-profiles --query 'InstanceProfiles[].InstanceProfileName'"
echo ""
echo "5. Si necesitas agregar permisos adicionales:"
echo "   aws iam attach-role-policy --role-name $TERRAFORM_ROLE_NAME --policy-arn arn:aws:iam::aws:policy/POLICY_NAME"
echo ""
echo "Limpieza de archivos temporales..."
rm -f /tmp/terraform-trust-policy.json /tmp/ssm-trust-policy.json /tmp/github-secrets.env

echo "✅ Listo!"
