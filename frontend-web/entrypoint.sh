#!/bin/bash
# Frontend web server entrypoint

echo "🚀 Starting Frontend Web Server..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "User: $(whoami)"

echo ""
echo "Environment variables:"
echo "  NODE_ENV: ${NODE_ENV:-development}"
echo "  PORT: ${PORT:-3000}"
echo "  API_GATEWAY_URL: ${API_GATEWAY_URL:-http://localhost:8080}"

echo ""
echo "Checking application files..."
ls -la /app 2>&1 | head -15

echo ""
echo "Starting npm server..."
cd /app
exec npm start
