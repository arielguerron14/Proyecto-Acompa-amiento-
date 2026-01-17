#!/bin/bash
# Deploy to API Gateway Instance
# Usage: ./deploy-api-gateway.sh

INSTANCE_TAG="EC2-API-Gateway"
AWS_REGION="us-east-1"
IMAGE="api-gateway:latest"
PORT="8080"
CORE_HOST="172.31.65.0"  # EC2-CORE private IP within VPC

echo "🚀 Deploying $IMAGE to $INSTANCE_TAG..."

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
        'echo \"Pulling Docker image...\",
        'docker pull $IMAGE',
        'echo \"Stopping and removing old container...\",
        'docker stop api-gateway || true',
        'docker rm api-gateway || true',
        'echo \"Starting new container...\",
        'docker run -d --name api-gateway -p $PORT:8080 -e CORE_HOST=$CORE_HOST -e NODE_ENV=production --restart always $IMAGE',
