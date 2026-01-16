#!/bin/bash
# Deploy to Messaging Instance (Kafka, RabbitMQ, Zookeeper)
# Usage: ./deploy-messaging.sh

INSTANCE_TAG="EC2-Messaging"
AWS_REGION="us-east-1"

echo "🚀 Deploying messaging stack to $INSTANCE_TAG..."

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
        'docker pull proyecto-zookeeper:1.0',
        'docker pull proyecto-kafka:1.0',
        'docker pull proyecto-rabbitmq:1.0',
        'echo \"Stopping and removing old containers...\",
        'docker stop zookeeper kafka rabbitmq || true',
        'docker rm zookeeper kafka rabbitmq || true',
        'echo \"Starting Zookeeper...\",
        'docker run -d --name zookeeper -p 2181:2181 --restart always proyecto-zookeeper:1.0',
        'sleep 5',
        'echo \"Starting Kafka...\",
        'docker run -d --name kafka -p 9092:9092 -e ZOOKEEPER_HOST=zookeeper:2181 --restart always proyecto-kafka:1.0',
        'echo \"Starting RabbitMQ...\",
        'docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 --restart always proyecto-rabbitmq:1.0',
        'echo \"Verifying messaging services...\",
        'docker ps | grep -E \"zookeeper|kafka|rabbitmq\"'
    ]"

echo "✅ Deployment command sent. Check AWS Systems Manager for execution details."
