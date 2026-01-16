#!/bin/bash
# Deploy to Reportes Instance
# Usage: ./deploy-reportes.sh

INSTANCE_TAG="EC2-Reportes"
AWS_REGION="us-east-1"

echo "🚀 Deploying reportes services to $INSTANCE_TAG..."

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
        'echo \"Pulling Docker images...\",
        'docker pull micro-reportes-estudiantes:latest',
        'docker pull micro-reportes-maestros:latest',
        'echo \"Stopping and removing old containers...\",
        'docker stop micro-reportes-estudiantes micro-reportes-maestros || true',
        'docker rm micro-reportes-estudiantes micro-reportes-maestros || true',
        'echo \"Starting reportes services...\",
        'docker run -d --name micro-reportes-estudiantes -p 4001:3000 --restart always micro-reportes-estudiantes:latest',
        'docker run -d --name micro-reportes-maestros -p 4002:3000 --restart always micro-reportes-maestros:latest',
        'echo \"Verifying reportes services...\",
        'docker ps | grep reportes'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
