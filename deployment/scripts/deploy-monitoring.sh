#!/bin/bash
# Deploy to Monitoring Instance (Prometheus, Grafana)
# Usage: ./deploy-monitoring.sh

INSTANCE_TAG="EC2-Monitoring"
AWS_REGION="us-east-1"

echo "🚀 Deploying monitoring stack to $INSTANCE_TAG..."

# Get instance ID
INSTANCE_ID=$(aws ec2 describe-instances \
    --region "$AWS_REGION" \
    --filters "Name=tag:Name,Values=$INSTANCE_TAG" "Name=instance-state-name,Values=running" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text)

if [ -z "$INSTANCE_ID" ] || [ "$INSTANCE_ID" = "None" ]; then
    echo "❌ No running instance found with tag: $INSTANCE_TAG"
    exit 1
fi

echo "📍 Found instance: $INSTANCE_ID"

# Deploy via SSM
aws ssm send-command \
    --document-name "AWS-RunShellScript" \
    --instance-ids "$INSTANCE_ID" \
    --region "$AWS_REGION" \
    --parameters "commands=[
        'echo \"Creating Docker volumes...\",
        'docker volume create prometheus_data || true',
        'docker volume create grafana_data || true',
        'echo \"Pulling Docker images...\",
        'docker pull proyecto-prometheus:1.0',
        'docker pull proyecto-grafana:1.0',
        'echo \"Stopping and removing old containers...\",
        'docker stop prometheus grafana || true',
        'docker rm prometheus grafana || true',
        'echo \"Starting Prometheus...\",
        'docker run -d --name prometheus -p 9090:9090 -v prometheus_data:/prometheus --restart always proyecto-prometheus:1.0',
        'echo \"Starting Grafana...\",
        'docker run -d --name grafana -p 3000:3000 -v grafana_data:/var/lib/grafana --restart always proyecto-grafana:1.0',
        'echo \"Verifying monitoring services...\",
        'docker ps | grep -E \"prometheus|grafana\"'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
