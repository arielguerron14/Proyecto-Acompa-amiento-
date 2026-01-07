#!/bin/bash
set -e

echo "🧹 Cleaning old MongoDB volume..."
docker volume rm mongo_data_8686 2>/dev/null || true

echo "✓ MongoDB volume cleaned - container will use fresh volume on next start"
echo "MongoDB will start fresh WITHOUT any authentication"
