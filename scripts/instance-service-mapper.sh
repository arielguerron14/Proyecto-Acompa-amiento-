#!/bin/bash

###############################################################################
# Instance Service Mapper
# Identifies AWS EC2 instances and maps services to deploy on each
# This script queries AWS to find instances and determines what services each needs
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

# Service mapping configuration
declare -A INSTANCE_SERVICES=(
    ["EC2-DB"]="mongo postgres redis"
    ["EC2-API"]="api-gateway"
    ["EC2-CORE"]="micro-auth micro-estudiantes micro-maestros micro-core micro-soap-bridge"
    ["EC2-ANALYTICS"]="micro-analytics micro-reportes-estudiantes micro-reportes-maestros"
    ["EC2-MESSAGING"]="micro-messaging micro-notificaciones"
    ["EC2-MONITORING"]="prometheus grafana"
)

# Service port mappings
declare -A SERVICE_PORTS=(
    ["mongo"]="27017"
    ["postgres"]="5432"
    ["redis"]="6379:6380"
    ["api-gateway"]="3000"
    ["micro-auth"]="5000"
    ["micro-estudiantes"]="5001"
    ["micro-maestros"]="5002"
    ["micro-core"]="5003"
    ["micro-soap-bridge"]="5004"
    ["micro-analytics"]="5007"
    ["micro-reportes-estudiantes"]="5008"
    ["micro-reportes-maestros"]="5009"
    ["micro-messaging"]="5005"
    ["micro-notificaciones"]="5006"
    ["prometheus"]="9090"
    ["grafana"]="3001"
)

# Service network addresses (internal Docker network)
declare -A SERVICE_ADDRESSES=(
    ["mongo"]="mongo:27017"
    ["postgres"]="postgres:5432"
    ["redis"]="redis:6379"
    ["api-gateway"]="api-gateway:3000"
    ["micro-auth"]="micro-auth:5000"
    ["micro-estudiantes"]="micro-estudiantes:5001"
    ["micro-maestros"]="micro-maestros:5002"
    ["micro-core"]="micro-core:5003"
    ["micro-soap-bridge"]="micro-soap-bridge:5004"
    ["micro-analytics"]="micro-analytics:5007"
    ["micro-reportes-estudiantes"]="micro-reportes-estudiantes:5008"
    ["micro-reportes-maestros"]="micro-reportes-maestros:5009"
    ["micro-messaging"]="micro-messaging:5005"
    ["micro-notificaciones"]="micro-notificaciones:5006"
    ["prometheus"]="prometheus:9090"
    ["grafana"]="grafana:3001"
)

print_header() {
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}════════════════════════════════════════════════════════════${NC}"
}

print_step() {
    echo -e "${GREEN}▶${NC} $1"
}

print_info() {
    echo -e "${CYAN}ℹ${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

# Query AWS EC2 instances
query_instances() {
    print_step "Querying AWS EC2 instances..."
    
    # Check if AWS CLI is available
    if ! command -v aws &> /dev/null; then
        print_warning "AWS CLI not found. Please install it to query instances automatically."
        echo "Skipping AWS query. Please provide instances manually."
        return 1
    fi
    
    # Query instances with tag or name filtering
    echo "Available EC2 instances:"
    aws ec2 describe-instances \
        --query 'Reservations[].Instances[].[InstanceId, InstanceType, State.Name, PrivateIpAddress, PublicIpAddress, [Tags[?Key==`Name`].Value][0][0]]' \
        --output table 2>/dev/null || echo "Could not connect to AWS"
}

# Map services to instances based on naming convention
map_services_to_instances() {
    print_header "Service Deployment Mapping"
    
    echo ""
    echo -e "${CYAN}Deployment Configuration:${NC}"
    echo ""
    
    for instance_name in "${!INSTANCE_SERVICES[@]}"; do
        services="${INSTANCE_SERVICES[$instance_name]}"
        echo -e "${YELLOW}$instance_name${NC}"
        echo "  Services:"
        for service in $services; do
            port="${SERVICE_PORTS[$service]}"
            addr="${SERVICE_ADDRESSES[$service]}"
            echo "    - $service (Port: $port, Address: $addr)"
        done
        echo ""
    done
}

# Generate deployment plan
generate_deployment_plan() {
    print_header "Deployment Plan"
    
    cat > /tmp/deployment-plan.md << 'EOF'
# EC2 Deployment Plan

## Phase 1: Database Services (EC2-DB)
**Status:** Ready for deployment
- MongoDB (27017)
  - Purpose: User data, sessions, general NoSQL storage
  - Replication: Configure for HA if multiple DB instances
  - Backup: Enable automated backups
  
- PostgreSQL (5432)
  - Purpose: Relational data, structured records
  - Schema: Auto-create on first run
  - Backup: Enable automated backups
  
- Redis (6379/6380)
  - Purpose: Caching, sessions, real-time data
  - Persistence: RDB + AOF enabled
  - Replication: Configure master-slave for HA

**GitHub Action:** `deploy-ec2-db.yml`
**Environment Variables Needed:**
- MONGO_INITDB_ROOT_USERNAME=root
- MONGO_INITDB_ROOT_PASSWORD=example
- POSTGRES_USER=postgres
- POSTGRES_PASSWORD=example
- POSTGRES_DB=acompanamiento

---

## Phase 2: API Gateway (EC2-API)
**Status:** Pending
- api-gateway (3000)
  - Purpose: Request routing, authentication, rate limiting
  - Dependencies: All microservices
  - External Port: 80/443 via ALB

**Communication:**
- Connects to: All microservices
- Database: mongo:27017, postgres:5432

---

## Phase 3: Core Services (EC2-CORE)
**Status:** Pending
- micro-auth (5000)
  - Purpose: Authentication and authorization
  - Database: PostgreSQL (users, roles)
  
- micro-estudiantes (5001)
  - Purpose: Student data management
  - Database: MongoDB/PostgreSQL
  
- micro-maestros (5002)
  - Purpose: Teacher data management
  - Database: MongoDB/PostgreSQL
  
- micro-core (5003)
  - Purpose: Core business logic
  - Database: MongoDB/PostgreSQL
  
- micro-soap-bridge (5004)
  - Purpose: SOAP integration layer
  - Dependencies: External SOAP services

**Communication:**
- Connect via: api-gateway
- Databases: mongo:27017, postgres:5432
- Message Queue: RabbitMQ/Kafka

---

## Phase 4: Analytics Services (EC2-ANALYTICS)
**Status:** Pending
- micro-analytics (5007)
  - Purpose: Data analytics and metrics
  - Database: MongoDB
  
- micro-reportes-estudiantes (5008)
  - Purpose: Student reports
  - Database: MongoDB/PostgreSQL
  
- micro-reportes-maestros (5009)
  - Purpose: Teacher reports
  - Database: MongoDB/PostgreSQL

**Communication:**
- Consume: Events from message queue
- Databases: mongo:27017, postgres:5432
- Access: Via api-gateway

---

## Phase 5: Messaging Services (EC2-MESSAGING)
**Status:** Pending
- micro-messaging (5005)
  - Purpose: Internal message handling
  - Message Queue: RabbitMQ
  
- micro-notificaciones (5006)
  - Purpose: Notification delivery
  - Message Queue: RabbitMQ
  - External: Email/SMS services

**Communication:**
- Broker: RabbitMQ
- Databases: mongo:27017, postgres:5432

---

## Phase 6: Monitoring (EC2-MONITORING)
**Status:** Pending
- Prometheus (9090)
  - Purpose: Metrics collection and alerting
  
- Grafana (3001)
  - Purpose: Metrics visualization
  - Data Source: Prometheus

**Communication:**
- Scrapes: All services on /metrics endpoint
- Storage: Time-series database

---

## Network Communication Summary

### EC2-DB (Primary Database Services)
```
Incoming:
  - All other instances connect to:
    - mongo:27017
    - postgres:5432
    - redis:6379
```

### EC2-API (Gateway)
```
Incoming:
  - External: ALB:80/443
  - Internal: All microservices
Outgoing:
  - All microservices (5000-5009)
  - Databases (mongo, postgres, redis)
```

### EC2-CORE (Application Services)
```
Incoming:
  - API Gateway (3000)
  - Other services (internal communication)
Outgoing:
  - Databases (mongo, postgres, redis)
  - Message brokers (RabbitMQ)
  - External SOAP services (for soap-bridge)
```

### EC2-ANALYTICS
```
Incoming:
  - API Gateway
  - Message queue consumers
Outgoing:
  - Databases (mongo, postgres)
  - Message brokers
```

### EC2-MESSAGING
```
Incoming:
  - All services publish events
Outgoing:
  - RabbitMQ/Kafka
  - External services (Email, SMS)
  - Notification channels
```

### EC2-MONITORING
```
Incoming:
  - All services expose /metrics
Outgoing:
  - Pull metrics from services
  - Store in Prometheus
  - Visualize in Grafana
```

---

## Environment Configuration Per Instance

### EC2-DB
```bash
# Services to start
docker-compose up -d mongo postgres redis

# Connection string for other services
MONGODB_URI=mongodb://root:example@mongo:27017
POSTGRES_URI=postgresql://postgres:example@postgres:5432/acompanamiento
REDIS_URL=redis://redis:6379
```

### EC2-API
```bash
# Services to start
docker-compose up -d api-gateway

# Environment
DATABASE_URL=mongodb://root:example@mongo:27017
POSTGRES_URL=postgresql://postgres:example@postgres:5432/acompanamiento
REDIS_URL=redis://redis:6379
SERVICE_REGISTRY=consul:8500  # Or similar service discovery
```

### EC2-CORE
```bash
# Services to start
docker-compose up -d micro-auth micro-estudiantes micro-maestros micro-core micro-soap-bridge

# Environment
DATABASE_URL=mongodb://root:example@mongo:27017
POSTGRES_URL=postgresql://postgres:example@postgres:5432/acompanimiento
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### EC2-ANALYTICS
```bash
# Services to start
docker-compose up -d micro-analytics micro-reportes-estudiantes micro-reportes-maestros

# Environment
DATABASE_URL=mongodb://root:example@mongo:27017
POSTGRES_URL=postgresql://postgres:example@postgres:5432/acompanimiento
REDIS_URL=redis://redis:6379
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
```

### EC2-MESSAGING
```bash
# Services to start
docker-compose up -d micro-messaging micro-notificaciones

# Environment
RABBITMQ_URL=amqp://guest:guest@rabbitmq:5672
DATABASE_URL=mongodb://root:example@mongo:27017
SENDGRID_API_KEY=your-sendgrid-key  # For email notifications
TWILIO_ACCOUNT_SID=your-twilio-sid  # For SMS
TWILIO_AUTH_TOKEN=your-twilio-token
```

---

## Deployment Workflow

1. **Identify Instances** (Terraform output)
   - Get EC2-DB public IP
   - Get EC2-API public IP
   - Get EC2-CORE private IP (behind ALB)
   - etc.

2. **Deploy in Order**
   - Phase 1: EC2-DB (blocking step - all others depend on it)
   - Phase 2: EC2-API (blocks: Phases 3-6)
   - Phase 3: EC2-CORE (blocks: Phases 4-6)
   - Phase 4: EC2-ANALYTICS (parallel with Phase 5)
   - Phase 5: EC2-MESSAGING (parallel with Phase 4)
   - Phase 6: EC2-MONITORING (depends on all)

3. **Health Checks**
   - Verify each service starts
   - Test internal connectivity
   - Verify external connectivity (ALB)

4. **Post-Deployment**
   - Configure monitoring
   - Setup backup strategies
   - Enable auto-scaling if needed

---

## GitHub Actions Workflows to Create

- [ ] `deploy-ec2-db.yml` - Database services
- [ ] `deploy-ec2-api.yml` - API Gateway
- [ ] `deploy-ec2-core.yml` - Core microservices
- [ ] `deploy-ec2-analytics.yml` - Analytics services
- [ ] `deploy-ec2-messaging.yml` - Messaging services
- [ ] `deploy-ec2-monitoring.yml` - Monitoring stack
- [ ] `verify-all-services.yml` - Post-deployment validation

EOF
    
    cat /tmp/deployment-plan.md
    print_success "Deployment plan generated"
}

# Generate environment configuration files
generate_env_configs() {
    print_header "Generating Environment Configurations"
    
    mkdir -p /tmp/env-configs
    
    # EC2-DB environment
    cat > /tmp/env-configs/.env.db << 'EOF'
# Database Services Environment (EC2-DB)
MONGO_INITDB_ROOT_USERNAME=root
MONGO_INITDB_ROOT_PASSWORD=example
MONGO_PORT=27017
MONGO_SERVICE_NAME=mongo

POSTGRES_USER=postgres
POSTGRES_PASSWORD=example
POSTGRES_DB=acompanamiento
POSTGRES_PORT=5432
POSTGRES_SERVICE_NAME=postgres

REDIS_PASSWORD=
REDIS_PORT=6379
REDIS_HOST_PORT=6380
REDIS_SERVICE_NAME=redis

# Docker
DOCKER_NETWORK=core-net
COMPOSE_PROJECT_NAME=db-services
EOF
    
    # EC2-API environment
    cat > /tmp/env-configs/.env.api << 'EOF'
# API Gateway Environment (EC2-API)
API_PORT=3000
API_HOST=0.0.0.0

# Database connections
MONGODB_URI=mongodb://root:example@mongo:27017
MONGODB_DIRECT_URI=mongodb://root:example@${EC2_DB_PRIVATE_IP}:27017
POSTGRES_URI=postgresql://postgres:example@postgres:5432/acompanamiento
POSTGRES_DIRECT_URI=postgresql://postgres:example@${EC2_DB_PRIVATE_IP}:5432/acompanamiento
REDIS_URL=redis://redis:6379
REDIS_DIRECT_URL=redis://${EC2_DB_PRIVATE_IP}:6380

# Service registry
SERVICE_REGISTRY_URL=consul:8500

# Environment
NODE_ENV=production
DEBUG=api-gateway:*

# Logging
LOG_LEVEL=info
EOF
    
    # EC2-CORE environment
    cat > /tmp/env-configs/.env.core << 'EOF'
# Core Services Environment (EC2-CORE)
# Database connections
MONGODB_URI=mongodb://root:example@mongo:27017
MONGODB_DIRECT_URI=mongodb://root:example@${EC2_DB_PRIVATE_IP}:27017
POSTGRES_URI=postgresql://postgres:example@postgres:5432/acompanamiento
POSTGRES_DIRECT_URI=postgresql://postgres:example@${EC2_DB_PRIVATE_IP}:5432/acompanamiento
REDIS_URL=redis://redis:6379
REDIS_DIRECT_URL=redis://${EC2_DB_PRIVATE_IP}:6380

# Message broker
RABBITMQ_URL=amqp://guest:guest@${EC2_MESSAGING_PRIVATE_IP}:5672
KAFKA_BROKERS=${EC2_MESSAGING_PRIVATE_IP}:9092

# API Gateway
API_GATEWAY_URL=http://api-gateway:3000
API_GATEWAY_EXTERNAL_URL=http://${ALB_DNS}

# Environment
NODE_ENV=production
DEBUG=*:*

# SOAP Bridge
SOAP_SERVICE_URL=http://external-soap-service.com/service
EOF
    
    print_success "Environment configurations generated in /tmp/env-configs/"
    ls -la /tmp/env-configs/
}

# Create service communication matrix
generate_communication_matrix() {
    print_header "Service Communication Matrix"
    
    cat > /tmp/service-communication.txt << 'EOF'
┌─────────────────────────────────────────────────────────────────────────────┐
│ SERVICE COMMUNICATION MATRIX                                                │
└─────────────────────────────────────────────────────────────────────────────┘

FROM\TO          mongo  postgres redis  api-gw  auth  estud maestr core  soap  analyt msging notif prom  graf
────────────────────────────────────────────────────────────────────────────
mongo            -      -       -      -       -     -     -      -     -     -      -      -     -     -
postgres         -      -       -      -       -     -     -      -     -     -      -      -     -     -
redis            -      -       -      -       -     -     -      -     -     -      -      -     -     -
api-gateway      R      R       R      -       W     W     W      W     W     W      W      W     -     -
micro-auth       W      W       W      -       -     -     -      -     -     W      -      -     M     -
micro-estud      R      R       R      -       R     -     -      R     -     R      -      -     M     -
micro-maestr     R      R       R      -       R     -     -      R     -     R      -      -     M     -
micro-core       R      R       R      -       R     R     R      -     R     R      -      -     M     -
micro-soap       -      -       -      -       -     -     -      -     -     X      -      -     M     -
micro-analyt     R      R       R      -       -     R     R      -     -     -      -      -     M     -
micro-messa      R      R       R      -       W     W     W      W     W     W      -      W     M     -
micro-notif      W      W       W      -       -     -     -      -     -     -      R      -     M     -
prometheus       M      M       M      M       M     M     M      M     M     M      M      M     -     -
grafana          R      R       R      -       -     -     -      -     -     -      -      -     R     -

Legend:
  R = Read
  W = Write
  M = Metrics (prometheus format)
  X = External API call
  - = No communication

External Communications:
  - micro-soap: Calls external SOAP service
  - micro-notif: Calls SendGrid (email), Twilio (SMS)
  - prometheus: Pulls /metrics from all services
  - grafana: Reads from prometheus

EOF
    
    cat /tmp/service-communication.txt
}

# Main function
main() {
    print_header "AWS EC2 Instance Service Mapper"
    
    # Query instances (optional)
    if command -v aws &> /dev/null; then
        query_instances
        echo ""
    fi
    
    # Display service mapping
    map_services_to_instances
    
    # Generate deployment plan
    echo ""
    generate_deployment_plan
    
    # Generate environment configs
    echo ""
    generate_env_configs
    
    # Service communication matrix
    echo ""
    generate_communication_matrix
    
    echo ""
    print_header "✅ Service Mapping Complete"
    
    echo ""
    echo "Generated files:"
    echo "  - Deployment Plan: /tmp/deployment-plan.md"
    echo "  - Environment Configs: /tmp/env-configs/"
    echo "  - Communication Matrix: /tmp/service-communication.txt"
    echo ""
    echo "Next steps:"
    echo "  1. Review the deployment plan"
    echo "  2. Get EC2 instance IPs from AWS console or Terraform output"
    echo "  3. Run: ./deploy-ec2-db.sh <EC2-DB-IP>"
    echo ""
}

main "$@"
