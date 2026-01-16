#!/bin/bash
# Deploy to Bastion Instance
# Usage: ./deploy-bastion.sh

INSTANCE_TAG="EC2-Bastion"
AWS_REGION="us-east-1"
IMAGE="bastion-host:latest"

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
        'docker stop bastion-host || true',
        'docker rm bastion-host || true',
        'echo \"Starting new container...\",
        'docker run -d --name bastion-host -p 22:22 --restart always $IMAGE',
        'echo \"Verifying deployment...\",
        'docker ps | grep bastion-host'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
