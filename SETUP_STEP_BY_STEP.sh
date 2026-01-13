#!/bin/bash
# GUÍA PASO A PASO - EJECUTAR TERRAFORM WORKFLOW

## 📋 PASO 1: CONFIGURAR IAM ROLES (Ejecutar una sola vez)
## ═══════════════════════════════════════════════════════════════

echo "PASO 1: CONFIGURAR IAM ROLES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "En tu máquina local (con acceso a AWS CLI):"
echo ""
echo "1. Abre terminal y ejecuta:"
echo "   $ chmod +x scripts/setup-github-actions-iam.sh"
echo "   $ ./scripts/setup-github-actions-iam.sh"
echo ""
echo "2. El script creará:"
echo "   ✓ OIDC Provider para GitHub"
echo "   ✓ IAM Role para Terraform"
echo "   ✓ IAM Role para SSM"
echo ""
echo "3. Copia el AWS_ACCOUNT_ID que aparece en la salida"
echo ""
echo "⏱️  Tiempo: 2-3 minutos"
echo ""
read -p "¿Completaste el paso 1? (s/n): " STEP1

if [ "$STEP1" != "s" ]; then
    echo "Por favor, ejecuta el paso 1 primero"
    exit 1
fi


## 📋 PASO 2: AGREGAR GITHUB SECRET
## ═══════════════════════════════════════════════════════════════

echo ""
echo "PASO 2: AGREGAR GITHUB SECRET"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a GitHub en tu navegador:"
echo "   https://github.com/arielguerron14/Proyecto-Acompa-amiento-/settings/secrets/actions"
echo ""
echo "2. Click en 'New repository secret'"
echo ""
echo "3. Crea el secret:"
echo "   Name: AWS_ACCOUNT_ID"
echo "   Value: (pega tu AWS Account ID obtenido en paso 1)"
echo ""
echo "4. Click 'Add secret'"
echo ""
echo "✅ Secret agregado"
echo ""
echo "⏱️  Tiempo: 1 minuto"
echo ""
read -p "¿Completaste el paso 2? (s/n): " STEP2

if [ "$STEP2" != "s" ]; then
    echo "Por favor, ejecuta el paso 2 primero"
    exit 1
fi


## 📋 PASO 3: EJECUTAR WORKFLOW (PLAN)
## ═══════════════════════════════════════════════════════════════

echo ""
echo "PASO 3: EJECUTAR WORKFLOW - PLAN"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a GitHub Actions:"
echo "   https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
echo ""
echo "2. Selecciona: 'Deploy Infrastructure with Terraform'"
echo ""
echo "3. Click 'Run workflow'"
echo ""
echo "4. Configura:"
echo "   - action: 'plan'"
echo "   - auto_approve: false"
echo ""
echo "5. Click 'Run workflow'"
echo ""
echo "6. Espera a que termine (2-3 minutos)"
echo ""
echo "7. Revisa el plan en la salida del workflow"
echo ""
echo "⏱️  Tiempo: 2-3 minutos"
echo ""
read -p "¿Completaste el paso 3? (s/n): " STEP3

if [ "$STEP3" != "s" ]; then
    echo "Por favor, ejecuta el paso 3 primero"
    exit 1
fi


## 📋 PASO 4: EJECUTAR WORKFLOW (APPLY)
## ═══════════════════════════════════════════════════════════════

echo ""
echo "PASO 4: EJECUTAR WORKFLOW - APPLY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Ve a GitHub Actions:"
echo "   https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
echo ""
echo "2. Selecciona: 'Deploy Infrastructure with Terraform'"
echo ""
echo "3. Click 'Run workflow'"
echo ""
echo "4. Configura:"
echo "   - action: 'apply'"
echo "   - auto_approve: true"
echo ""
echo "5. Click 'Run workflow'"
echo ""
echo "6. ESPERA A QUE TERMINE (8-10 minutos aprox):"
echo "   - Terraform apply: 2-3 min"
echo "   - Docker deployment: 5-7 min"
echo "   - Communication verify: 1-2 min"
echo ""
echo "7. Cuando termine, busca el Load Balancer DNS en:"
echo "   - Workflow Summary"
echo "   - Artifacts → terraform-outputs"
echo ""
echo "⏱️  Tiempo: 10-15 minutos"
echo ""
read -p "¿Completaste el paso 4? (s/n): " STEP4

if [ "$STEP4" != "s" ]; then
    echo "Por favor, ejecuta el paso 4 primero"
    exit 1
fi


## 📋 PASO 5: VERIFICAR DEPLOYMENT
## ═══════════════════════════════════════════════════════════════

echo ""
echo "PASO 5: VERIFICAR DEPLOYMENT"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Verifica el Load Balancer en AWS Console:"
echo "   https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#LoadBalancers:"
echo ""
echo "2. Busca: 'proyecto-acompanamiento-alb'"
echo ""
echo "3. Copia el DNS name"
echo ""
echo "4. Prueba acceso (en 1-2 minutos después de crearse):"
echo "   $ curl http://[DNS-NAME]"
echo ""
echo "5. Verifica instancias en Target Groups:"
echo "   https://console.aws.amazon.com/ec2/v2/home?region=us-east-1#TargetGroups:"
echo ""
echo "6. Todos los 9 targets deberían estar:"
echo "   ✓ Healthy"
echo "   ✓ Con status 'draining' durante transición"
echo ""
echo "7. Verifica Docker en las instancias:"
echo "   - Ve a EC2 → Instances"
echo "   - Selecciona una instancia"
echo "   - Click 'Connect' → 'Session Manager'"
echo "   - Ejecuta: 'docker ps'"
echo ""
echo "✅ ¡Deployment completo!"
echo ""
echo "⏱️  Tiempo: 5 minutos"
echo ""


## 📋 PASO 6: PRÓXIMOS PASOS
## ═══════════════════════════════════════════════════════════════

echo ""
echo "PASO 6: PRÓXIMOS PASOS (OPCIONAL)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Para agregar HTTPS:"
echo "1. Crear ACM certificate en AWS"
echo "2. Editar terraform/modules/load_balancer/main.tf"
echo "3. Agregar listener HTTPS 443"
echo "4. Ejecutar workflow con action: 'apply'"
echo ""
echo "Para agregar CloudFront:"
echo "1. Crear nuevo módulo en terraform/modules/cloudfront/"
echo "2. Apuntar a ALB DNS"
echo "3. Ejecutar workflow con action: 'apply'"
echo ""
echo "Para agregar auto-scaling:"
echo "1. Crear ASG en Terraform"
echo "2. Registrar con Target Group"
echo "3. Ejecutar workflow con action: 'apply'"
echo ""
echo "Para destruir (si necesitas):"
echo "1. GitHub Actions → Run workflow"
echo "2. action: 'destroy'"
echo "3. auto_approve: true"
echo "4. Run workflow"
echo ""
echo "═════════════════════════════════════════════════════════════════"
echo ""
echo "✨ ¡COMPLETADO! ✨"
echo ""
echo "Tu infraestructura está desplegada con:"
echo "  ✓ Load Balancer en múltiples AZs"
echo "  ✓ Docker en 9 instancias"
echo "  ✓ Health checks activos"
echo "  ✓ Terraform management"
echo ""
echo "Próxima lectura: TERRAFORM_DEPLOYMENT_GUIDE.md"
echo ""
echo "═════════════════════════════════════════════════════════════════"
