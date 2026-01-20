#!/bin/bash
# Start script that tries main server.js first, falls back to simple-server.js

echo "🚀 Starting API Gateway..."
echo "Current working directory: $(pwd)"
cd /usr/src/app
echo "Changed to: $(pwd)"
echo "Files in current directory:"
ls -la

# Try to run server.js first
if [ -f "server.js" ]; then
  echo "Found server.js, attempting to start..."
  node server.js
else
  echo "server.js not found, checking for simple-server.js..."
  if [ -f "simple-server.js" ]; then
    echo "Found simple-server.js, starting as fallback..."
    node simple-server.js
  else
    echo "ERROR: Neither server.js nor simple-server.js found!"
    ls -la
    exit 1
  fi
fi
