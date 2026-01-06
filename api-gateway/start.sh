#!/bin/sh
echo "Container started at $(date)" > /tmp/startup.log
echo "User: $(id)" >> /tmp/startup.log
echo "Working dir: $(pwd)" >> /tmp/startup.log
echo "Files: $(ls -la)" >> /tmp/startup.log
node --version >> /tmp/startup.log 2>&1
npm list express >> /tmp/startup.log 2>&1
echo "Starting server..." >> /tmp/startup.log
node simple-server.js >> /tmp/startup.log 2>&1 &
SERVER_PID=$!
echo "Server started with PID $SERVER_PID" >> /tmp/startup.log
wait $SERVER_PID
echo "Server exited with code $?" >> /tmp/startup.log
