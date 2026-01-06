#!/bin/bash
set -e

echo "🚀 Starting microservice..."
echo "Current directory: $(pwd)"
echo "Node version: $(node --version)"
echo "npm version: $(npm --version)"

# Execute the command passed to the container
exec "$@"
