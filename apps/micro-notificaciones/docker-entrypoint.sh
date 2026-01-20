#!/bin/sh
# Note: NOT using 'set -e' so errors don't cause immediate exit - helps capture logs

echo "🚀 Starting microservice..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"
echo "User: $(whoami)"
echo "PWD: $PWD"

# Show environment variables (non-sensitive)
echo ""
echo "Environment variables:"
echo "  NODE_ENV: $NODE_ENV"
echo "  PORT: $PORT"
echo "  MONGO_URI: $MONGO_URI"
echo "  DB_HOST: $DB_HOST"
echo "  DB_PORT: $DB_PORT"
echo "  AUTH_SERVICE: $AUTH_SERVICE"

# List dependencies
echo ""
echo "Checking node_modules..."
ls -la /usr/src/app/node_modules 2>&1 | head -20

# Check if app file exists
echo ""
echo "Checking application file..."
if [ -f "/usr/src/app/src/app.js" ]; then
  echo "✓ /usr/src/app/src/app.js exists"
else
  echo "✗ /usr/src/app/src/app.js NOT FOUND"
  ls -la /usr/src/app/src/ || echo "  /usr/src/app/src/ directory not accessible"
fi

# Execute the command passed to the container with error handling
echo ""
echo "Executing: $@"
exec "$@" || {
  EXIT_CODE=$?
  echo "❌ Command exited with code: $EXIT_CODE"
  exit $EXIT_CODE
}
