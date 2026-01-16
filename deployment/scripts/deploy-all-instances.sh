#!/bin/bash
# Deploy all instances orchestrator
# Uso: ./deploy-all-instances.sh [dev|staging|prod]

ENVIRONMENT=${1:-dev}
echo "🚀 Starting deployment to all instances in $ENVIRONMENT environment..."

# Function to trigger workflow
trigger_workflow() {
    local workflow=$1
    echo "📦 Triggering workflow: $workflow"
    gh workflow run "$workflow" -f environment="$ENVIRONMENT"
}

# Array de workflows
declare -a workflows=(
    "deploy-bastion.yml"
    "deploy-api-gateway.yml"
    "deploy-core.yml"
    "deploy-reportes.yml"
    "deploy-notificaciones.yml"
    "deploy-messaging.yml"
    "deploy-database.yml"
    "deploy-analytics.yml"
    "deploy-monitoring.yml"
    "deploy-frontend.yml"
)

# Trigger all workflows
for workflow in "${workflows[@]}"; do
    trigger_workflow "$workflow"
    sleep 2  # Small delay between triggers
done

echo "✅ All deployment workflows triggered!"
echo "📊 Check GitHub Actions for detailed progress..."
