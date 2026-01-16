#!/bin/bash
# Deploy to Database Instance
# Usage: ./deploy-database.sh

INSTANCE_TAG="EC2-DB"
AWS_REGION="us-east-1"

echo "🚀 Deploying databases to $INSTANCE_TAG..."

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
        'docker volume create mongo_data || true',
        'docker volume create postgres_data || true',
        'docker volume create redis_data || true',
        'echo \"Pulling Docker images...\",
        'docker pull mongo:latest',
        'docker pull postgres:latest',
        'docker pull redis:latest',
        'echo \"Stopping and removing old containers...\",
        'docker stop mongo postgres redis || true',
        'docker rm mongo postgres redis || true',
        'echo \"Starting databases...\",
        'docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db --restart always mongo:latest',
        'docker run -d --name postgres -p 5432:5432 -e POSTGRES_PASSWORD=postgres -v postgres_data:/var/lib/postgresql/data --restart always postgres:latest',
        'docker run -d --name redis -p 6379:6379 -v redis_data:/data --restart always redis:latest',
        'echo \"Verifying databases...\",
        'docker ps | grep -E \"mongo|postgres|redis\"'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
