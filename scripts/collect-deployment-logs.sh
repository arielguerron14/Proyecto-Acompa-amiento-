#!/bin/bash
# Centralized logging and monitoring script for deployed services
# Collects logs from all running services

INSTANCES_FILE="discovered-instances.json"
LOGS_DIR="deployment-logs-$(date +%Y%m%d-%H%M%S)"
SUMMARY_FILE="$LOGS_DIR/SUMMARY.md"

if [ ! -f "$INSTANCES_FILE" ]; then
  echo "Error: $INSTANCES_FILE not found"
  exit 1
fi

mkdir -p "$LOGS_DIR"

echo "# Deployment Logs Summary" > "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"
echo "**Generated**: $(date)" >> "$SUMMARY_FILE"
echo "**Logs Directory**: $LOGS_DIR" >> "$SUMMARY_FILE"
echo "" >> "$SUMMARY_FILE"

echo "Collecting logs from all instances..."
echo "Logs will be saved to: $LOGS_DIR"
echo ""

jq -r 'to_entries[] | "\(.key)|\(.value.private_ip)|\(.value.public_ip)"' "$INSTANCES_FILE" | while IFS='|' read INSTANCE_NAME PRIVATE_IP PUBLIC_IP; do
  
  if [ -z "$INSTANCE_NAME" ]; then continue; fi
  
  echo "Collecting logs from $INSTANCE_NAME..."
  
  INSTANCE_LOG_DIR="$LOGS_DIR/$INSTANCE_NAME"
  mkdir -p "$INSTANCE_LOG_DIR"
  
  # Try to collect Docker logs
  ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$PUBLIC_IP \
    "docker ps -a --format 'table {{.Names}}\t{{.Status}}' > containers.txt 2>&1; \
     docker logs --tail=100 \$(docker ps -q) > service-logs.txt 2>&1; \
     cat /var/log/syslog | tail -100 > system.log 2>&1; \
     cat /var/log/dmesg | tail -50 > kernel.log 2>&1; \
     df -h > disk-usage.txt 2>&1; \
     free -h > memory.txt 2>&1; \
     netstat -tuln | head -30 > network.txt 2>&1" \
    2>/dev/null || echo "Could not collect remote logs from $INSTANCE_NAME"
  
  # Copy logs back
  scp -o StrictHostKeyChecking=no -o ConnectTimeout=5 \
    ubuntu@$PUBLIC_IP:{containers.txt,service-logs.txt,system.log,kernel.log,disk-usage.txt,memory.txt,network.txt} \
    "$INSTANCE_LOG_DIR/" 2>/dev/null || echo "Could not copy logs from $INSTANCE_NAME"
  
  # Add to summary
  echo "" >> "$SUMMARY_FILE"
  echo "## $INSTANCE_NAME" >> "$SUMMARY_FILE"
  echo "" >> "$SUMMARY_FILE"
  echo "### Container Status" >> "$SUMMARY_FILE"
  echo '```' >> "$SUMMARY_FILE"
  if [ -f "$INSTANCE_LOG_DIR/containers.txt" ]; then
    head -20 "$INSTANCE_LOG_DIR/containers.txt" >> "$SUMMARY_FILE"
  else
    echo "No container data available" >> "$SUMMARY_FILE"
  fi
  echo '```' >> "$SUMMARY_FILE"
  echo "" >> "$SUMMARY_FILE"
  
  echo "### Service Logs (last 50 lines)" >> "$SUMMARY_FILE"
  echo '```' >> "$SUMMARY_FILE"
  if [ -f "$INSTANCE_LOG_DIR/service-logs.txt" ]; then
    tail -50 "$INSTANCE_LOG_DIR/service-logs.txt" >> "$SUMMARY_FILE"
  else
    echo "No service logs available" >> "$SUMMARY_FILE"
  fi
  echo '```' >> "$SUMMARY_FILE"
  echo "" >> "$SUMMARY_FILE"
  
  echo "### System Resources" >> "$SUMMARY_FILE"
  echo '```' >> "$SUMMARY_FILE"
  echo "**Disk Usage:**" >> "$SUMMARY_FILE"
  if [ -f "$INSTANCE_LOG_DIR/disk-usage.txt" ]; then
    cat "$INSTANCE_LOG_DIR/disk-usage.txt" >> "$SUMMARY_FILE"
  fi
  echo "" >> "$SUMMARY_FILE"
  echo "**Memory:**" >> "$SUMMARY_FILE"
  if [ -f "$INSTANCE_LOG_DIR/memory.txt" ]; then
    cat "$INSTANCE_LOG_DIR/memory.txt" >> "$SUMMARY_FILE"
  fi
  echo '```' >> "$SUMMARY_FILE"
  
done

echo ""
echo "✓ Log collection completed"
echo "Logs saved to: $LOGS_DIR"
echo ""
echo "Summary:"
ls -lah "$LOGS_DIR"
echo ""
echo "View the summary: cat $SUMMARY_FILE"
