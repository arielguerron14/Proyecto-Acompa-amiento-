#!/bin/bash
# Deploy to Frontend Instance
# Usage: ./deploy-frontend.sh

INSTANCE_TAG="EC2-Frontend"
AWS_REGION="us-east-1"
IMAGE="frontend-web:latest"

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
        'docker stop frontend-web || true',
        'docker rm frontend-web || true',
        'echo \"Starting new container...\",
        'docker run -d --name frontend-web -p 80:3000 -p 443:3000 --restart always $IMAGE',
        'echo \"Verifying deployment...\",
        'docker ps | grep frontend'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
