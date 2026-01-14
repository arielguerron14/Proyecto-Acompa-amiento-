#!/bin/bash
# Health check and verification script for deployed services
# Usage: ./verify-deployment-health.sh

set -e

INSTANCES_FILE="discovered-instances.json"
REPORT_FILE="health-report-$(date +%Y%m%d-%H%M%S).md"

if [ ! -f "$INSTANCES_FILE" ]; then
  echo "Error: $INSTANCES_FILE not found"
  exit 1
fi

echo "# Deployment Health Verification Report" > "$REPORT_FILE"
echo "" >> "$REPORT_FILE"
echo "**Generated**: $(date)" >> "$REPORT_FILE"
echo "**Environment**: ${ENVIRONMENT:-production}" >> "$REPORT_FILE"
echo "" >> "$REPORT_FILE"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Function to check port
check_port() {
  local host=$1
  local port=$2
  local timeout=${3:-3}
  
  timeout $timeout bash -c "cat < /dev/null > /dev/tcp/$host/$port" 2>/dev/null
  return $?
}

# Function to check HTTP endpoint
check_http() {
  local url=$1
  local timeout=${2:-5}
  
  http_code=$(curl -s -m $timeout -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  echo "$http_code"
}

# Parse instances
jq -r 'to_entries[] | "\(.key)|\(.value.private_ip)|\(.value.public_ip)"' "$INSTANCES_FILE" | while IFS='|' read INSTANCE_NAME PRIVATE_IP PUBLIC_IP; do
  
  if [ -z "$INSTANCE_NAME" ]; then continue; fi
  
  echo ""
  echo -e "${YELLOW}=== Checking $INSTANCE_NAME ===${NC}"
  echo "  Private IP: $PRIVATE_IP"
  echo "  Public IP: $PUBLIC_IP"
  
  # Add to report
  echo "" >> "$REPORT_FILE"
  echo "## $INSTANCE_NAME" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "- **Private IP**: $PRIVATE_IP" >> "$REPORT_FILE"
  echo "- **Public IP**: $PUBLIC_IP" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  echo "### Port Status" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  # Check common ports
  declare -A ports=(
    [SSH]=22
    [HTTP]=80
    [HTTPS]=443
    [App]=8080
    [Database]=5432
    [MessageQueue]=5672
    [Prometheus]=9090
    [Node1]=3000
    [Node2]=5000
    [Node3]=8081
    [Node4]=8082
    [Node5]=8083
  )
  
  for port_name in "${!ports[@]}"; do
    port=${ports[$port_name]}
    if check_port "$PUBLIC_IP" "$port"; then
      echo -e "${GREEN}✓${NC} Port $port_name ($port) is open"
      echo "- $port_name ($port): ✓ Open" >> "$REPORT_FILE"
    else
      echo -e "${RED}✗${NC} Port $port_name ($port) is closed"
      echo "- $port_name ($port): ✗ Closed" >> "$REPORT_FILE"
    fi
  done
  
  # Check service-specific health endpoints
  echo "" >> "$REPORT_FILE"
  echo "### HTTP Health Endpoints" >> "$REPORT_FILE"
  echo "" >> "$REPORT_FILE"
  
  case $INSTANCE_NAME in
    "EC2-Frontend")
      echo -e "\n${YELLOW}Frontend Health Checks:${NC}"
      code=$(check_http "http://$PUBLIC_IP/" 5)
      echo "  HTTP /: $code"
      echo "- Frontend (http://): HTTP $code" >> "$REPORT_FILE"
      ;;
    "EC2-API-Gateway")
      echo -e "\n${YELLOW}API Gateway Health Checks:${NC}"
      code=$(check_http "http://$PUBLIC_IP:8080/api/health" 5)
      echo "  HTTP /api/health: $code"
      echo "- API Health (8080/api/health): HTTP $code" >> "$REPORT_FILE"
      ;;
    "EC2-CORE")
      echo -e "\n${YELLOW}CORE Service Health Checks:${NC}"
      code=$(check_http "http://$PUBLIC_IP:8081/api/status" 5)
      echo "  HTTP /api/status: $code"
      echo "- CORE Status (8081/api/status): HTTP $code" >> "$REPORT_FILE"
      ;;
    "EC2-Reportes")
      echo -e "\n${YELLOW}Reports Service Health Checks:${NC}"
      code=$(check_http "http://$PUBLIC_IP:8083/reports/health" 5)
      echo "  HTTP /reports/health: $code"
      echo "- Reports Health (8083/reports/health): HTTP $code" >> "$REPORT_FILE"
      ;;
    "EC2-Notificaciones")
      echo -e "\n${YELLOW}Notifications Service Health Checks:${NC}"
      code=$(check_http "http://$PUBLIC_IP:8082/notifications/health" 5)
      echo "  HTTP /notifications/health: $code"
      echo "- Notifications Health (8082/notifications/health): HTTP $code" >> "$REPORT_FILE"
      ;;
    "EC2-Monitoring")
      echo -e "\n${YELLOW}Monitoring Health Checks:${NC}"
      code=$(check_http "http://$PUBLIC_IP:9090/-/healthy" 5)
      echo "  HTTP /-/healthy: $code"
      echo "- Prometheus Health (9090/-/healthy): HTTP $code" >> "$REPORT_FILE"
      ;;
  esac
  
done

echo ""
echo -e "${GREEN}✓ Health check completed${NC}"
echo ""
echo "Report saved to: $REPORT_FILE"
cat "$REPORT_FILE"
