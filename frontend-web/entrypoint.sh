#!/bin/bash
# Frontend web server entrypoint

set -e

echo "🚀 Starting Frontend Web Server..."
echo "Port: ${PORT:-3000}"

cd /app
exec npm start
