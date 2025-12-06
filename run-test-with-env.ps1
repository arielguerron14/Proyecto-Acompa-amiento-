#!/usr/bin/env pwsh
# Test script with environment variables set

$root = 'c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-'

# Set environment variables for testing
$env:JWT_SECRET = 'test-jwt-secret-12345'
$env:REFRESH_SECRET = 'test-refresh-secret-12345'
$env:NODE_ENV = 'test'
$env:LOG_LEVEL = 'info'

Write-Output "=========================================="
Write-Output "Testing with Environment Variables"
Write-Output "=========================================="
Write-Output "JWT_SECRET: $($env:JWT_SECRET)"
Write-Output "REFRESH_SECRET: $($env:REFRESH_SECRET)"
Write-Output "NODE_ENV: $($env:NODE_ENV)"
Write-Output "=========================================="

Write-Output "Killing node processes on ports 5005 and 8080..."
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 1

Write-Output "Starting micro-auth..."
cd "$root\micro-auth"
Start-Process node -ArgumentList "src/app.js" -NoNewWindow

Start-Sleep -Seconds 2

Write-Output "Starting api-gateway..."
cd "$root\api-gateway"
Start-Process node -ArgumentList "server.js" -NoNewWindow

Start-Sleep -Seconds 2

Write-Output "Running integration test..."
cd "$root\micro-auth"
node scripts/logout_verify_test.js

Write-Output "Test completed. Cleaning up..."
Start-Sleep -Seconds 2
Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
