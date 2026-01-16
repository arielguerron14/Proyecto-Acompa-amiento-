#!/bin/bash
# Deploy to CORE Instance (multiple microservices)
# Usage: ./deploy-core.sh

INSTANCE_TAG="EC2-CORE"
AWS_REGION="us-east-1"

echo "🚀 Deploying microservices to $INSTANCE_TAG..."

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
        'docker pull micro-auth:latest',
        'docker pull micro-estudiantes:latest',
        'docker pull micro-maestros:latest',
        'docker pull micro-core:latest',
        'echo \"Stopping and removing old containers...\",
        'docker stop micro-auth micro-estudiantes micro-maestros micro-core || true',
        'docker rm micro-auth micro-estudiantes micro-maestros micro-core || true',
        'echo \"Starting new containers...\",
        'docker run -d --name micro-auth -p 3001:3000 --restart always micro-auth:latest',
        'docker run -d --name micro-estudiantes -p 3002:3000 --restart always micro-estudiantes:latest',
        'docker run -d --name micro-maestros -p 3003:3000 --restart always micro-maestros:latest',
        'docker run -d --name micro-core -p 3004:3000 --restart always micro-core:latest',
        'echo \"Verifying deployment...\",
        'docker ps | grep micro-'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
