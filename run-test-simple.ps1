#!/usr/bin/env pwsh
# Simple script: kill processes, start services, run test

$root = 'c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-'

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
