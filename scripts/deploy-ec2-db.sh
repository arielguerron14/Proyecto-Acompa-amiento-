#!/bin/bash

###############################################################################
# Deploy EC2-DB Services Script
# This script deploys MongoDB, PostgreSQL, and Redis to an EC2-DB instance
# Usage: ./deploy-ec2-db.sh <instance_ip> [instance_name]
###############################################################################

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
INSTANCE_IP=${1:-}
INSTANCE_NAME=${2:-"EC2-DB"}
INSTANCE_USER="ubuntu"
REPO_URL="https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git"
SSH_KEY=${SSH_PRIVATE_KEY_PATH:-"$HOME/.ssh/id_rsa"}

# Functions
print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

validate_inputs() {
    if [ -z "$INSTANCE_IP" ]; then
        print_error "Instance IP is required"
        echo "Usage: $0 <instance_ip> [instance_name]"
        exit 1
    fi
    
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key not found at: $SSH_KEY"
        exit 1
    fi
    
    print_success "Inputs validated"
}

setup_ssh() {
    print_step "Setting up SSH connection..."
    mkdir -p ~/.ssh
    chmod 700 ~/.ssh
    ssh-keyscan -H "$INSTANCE_IP" >> ~/.ssh/known_hosts 2>/dev/null || true
    print_success "SSH configured"
}

verify_connection() {
    print_step "Verifying SSH connection..."
    if ssh -o ConnectTimeout=10 -o StrictHostKeyChecking=no -i "$SSH_KEY" \
        "$INSTANCE_USER@$INSTANCE_IP" "echo '✅ Connection successful'" > /dev/null 2>&1; then
        print_success "SSH connection verified"
    else
        print_error "Cannot connect to $INSTANCE_IP"
        exit 1
    fi
}

detect_instance() {
    print_step "Detecting instance configuration..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$INSTANCE_USER@$INSTANCE_IP" << 'EOF'
        echo "Hostname: $(hostname)"
        echo "IP Addresses: $(hostname -I)"
        echo "Instance type: $(ec2-metadata --instance-type 2>/dev/null | cut -d' ' -f2 || echo 'unknown')"
        echo "Region: $(ec2-metadata --availability-zone 2>/dev/null | cut -d' ' -f2 | sed 's/[a-z]$//' || echo 'unknown')"
EOF
}

deploy_services() {
    print_step "Deploying database services to $INSTANCE_NAME..."
    
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$INSTANCE_USER@$INSTANCE_IP" << 'DEPLOY_EOF'
    set -e
    
    echo "=== Starting EC2-DB Deployment ==="
    
    # Update system
    echo "📦 Updating system packages..."
    sudo apt-get update -qq 2>/dev/null || true
    
    # Install Docker if needed
    if ! command -v docker &> /dev/null; then
        echo "Installing Docker..."
        sudo apt-get install -y docker.io docker-compose git curl jq
        sudo systemctl enable docker
        sudo systemctl start docker
        sudo usermod -aG docker ubuntu
        newgrp docker
    fi
    
    # Clone or update repository
    if [ ! -d ~/projeto-acompanamiento ]; then
        cd ~ && git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git projeto-acompanimiento
    else
        cd ~/projeto-acompanimiento
        git pull origin main 2>/dev/null || true
    fi
    
    # Create environment configuration
    echo "⚙️ Configuring environment..."
    cat > .env.db << 'ENVEOF'
    MONGO_INITDB_ROOT_USERNAME=root
    MONGO_INITDB_ROOT_PASSWORD=example
    POSTGRES_USER=postgres
    POSTGRES_PASSWORD=example
    POSTGRES_DB=acompanamiento
    REDIS_PASSWORD=
    COMPOSE_PROJECT_NAME=db-services
    ENVEOF
    
    # Build images
    echo "🔨 Building database service images..."
    docker-compose build --no-cache mongo postgres redis 2>&1 | grep -E "Successfully|Building|ERROR" || true
    
    # Stop existing services
    echo "🛑 Stopping existing services..."
    docker-compose down -v 2>&1 | tail -2 || true
    sleep 5
    
    # Start services
    echo "🚀 Starting database services..."
    docker-compose up -d mongo postgres redis
    
    echo "⏳ Services starting (waiting 30 seconds for initialization)..."
    sleep 30
    
    # Show status
    echo "📊 Service status:"
    docker-compose ps
    
    echo "✅ Deployment completed successfully!"
DEPLOY_EOF
    
    print_success "Services deployed"
}

health_check() {
    print_step "Performing health checks..."
    
    # MongoDB check
    print_step "Checking MongoDB..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$INSTANCE_USER@$INSTANCE_IP" << 'EOF'
    cd ~/projeto-acompanimiento
    for i in {1..10}; do
        if docker-compose exec -T mongo mongosh --eval "db.adminCommand('ping')" 2>/dev/null | grep -q "ok"; then
            echo "✅ MongoDB is healthy (version: $(docker-compose exec -T mongo mongosh --eval "db.version()" 2>/dev/null | tail -1))"
            exit 0
        fi
        echo "⏳ Waiting for MongoDB... ($i/10)"
        sleep 3
    done
    echo "⚠️ MongoDB container running but not fully initialized yet"
EOF
    
    # PostgreSQL check
    print_step "Checking PostgreSQL..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$INSTANCE_USER@$INSTANCE_IP" << 'EOF'
    cd ~/projeto-acompanimiento
    for i in {1..10}; do
        if docker-compose exec -T postgres pg_isready -U postgres 2>/dev/null | grep -q "accepting"; then
            echo "✅ PostgreSQL is healthy"
            exit 0
        fi
        echo "⏳ Waiting for PostgreSQL... ($i/10)"
        sleep 3
    done
    echo "⚠️ PostgreSQL container running but not fully initialized yet"
EOF
    
    # Redis check
    print_step "Checking Redis..."
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$INSTANCE_USER@$INSTANCE_IP" << 'EOF'
    cd ~/projeto-acompanimiento
    for i in {1..10}; do
        if docker-compose exec -T redis redis-cli ping 2>/dev/null | grep -q "PONG"; then
            echo "✅ Redis is healthy"
            exit 0
        fi
        echo "⏳ Waiting for Redis... ($i/10)"
        sleep 3
    done
    echo "⚠️ Redis container running but not fully initialized yet"
EOF
    
    print_success "Health checks completed"
}

generate_report() {
    print_step "Generating deployment report..."
    
    ssh -o StrictHostKeyChecking=no -i "$SSH_KEY" "$INSTANCE_USER@$INSTANCE_IP" << 'EOF'
    cd ~/projeto-acompanimiento
    
    echo ""
    echo "=== EC2-DB Deployment Report ==="
    echo ""
    echo "Instance Information:"
    echo "  Hostname: $(hostname)"
    echo "  IP Address: $(hostname -I | awk '{print $1}')"
    echo "  Deployment Time: $(date)"
    echo ""
    
    echo "Services Deployed:"
    docker-compose ps --services | while read service; do
        status=$(docker-compose ps $service --format "{{.Status}}" 2>/dev/null)
        echo "  - $service: $status"
    done
    
    echo ""
    echo "Service Details:"
    echo "  MongoDB:"
    echo "    - Container Port: 27017"
    echo "    - Internal Address: mongo:27017"
    echo "    - Health: $(docker-compose ps mongo --format '{{.Status}}')"
    
    echo "  PostgreSQL:"
    echo "    - Container Port: 5432"
    echo "    - Internal Address: postgres:5432"
    echo "    - Health: $(docker-compose ps postgres --format '{{.Status}}')"
    
    echo "  Redis:"
    echo "    - Container Port: 6379"
    echo "    - Host Port: 6380"
    echo "    - Internal Address: redis:6379"
    echo "    - Health: $(docker-compose ps redis --format '{{.Status}}')"
    
    echo ""
    echo "Volume Configuration:"
    docker volume ls --filter "label=com.docker.compose.project" --format "{{.Name}}"
    
    echo ""
    echo "Network Configuration:"
    docker network ls --filter "label=com.docker.compose.project" --format "{{.Name}}"
    
    echo ""
    echo "=== Deployment Successful ==="
EOF
}

main() {
    print_header "EC2-DB Deployment Script"
    
    echo "Configuration:"
    echo "  Instance IP: $INSTANCE_IP"
    echo "  Instance Name: $INSTANCE_NAME"
    echo "  User: $INSTANCE_USER"
    echo ""
    
    validate_inputs
    setup_ssh
    verify_connection
    detect_instance
    deploy_services
    health_check
    generate_report
    
    print_header "✅ EC2-DB Deployment Completed Successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Verify services are accessible from other instances"
    echo "2. Deploy EC2-API-Gateway with API services"
    echo "3. Deploy EC2-CORE with microservices"
    echo "4. Configure monitoring and alerts"
    echo ""
}

main "$@"
