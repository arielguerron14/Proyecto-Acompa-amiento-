#!/usr/bin/env pwsh
<#
.SYNOPSIS
  Starts micro-auth and api-gateway services in background, waits for them to be ready,
  and runs the integration test (logout_verify_test.js).
.DESCRIPTION
  This script:
  1. Kills any existing node processes on ports 5005 and 8080
  2. Starts micro-auth in background (logs to micro-auth.log)
  3. Starts api-gateway in background (logs to api-gateway.log)
  4. Waits for both services to be ready (max 30 seconds)
  5. Runs the integration test script logout_verify_test.js
  6. Reports the results
#>

$ErrorActionPreference = 'Continue'
$root = 'c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-'
$microAuthDir = Join-Path $root 'micro-auth'
$apiGatewayDir = Join-Path $root 'api-gateway'

Write-Output "=========================================="
Write-Output "Starting services and running integration test"
Write-Output "=========================================="

# Step 1: Kill existing processes on ports 5005 and 8080
Write-Output "`n[Step 1] Checking and stopping listeners on ports 5005 and 8080..."
$matches = netstat -ano | Select-String ':5005|:8080'
if ($matches) {
  $matches | ForEach-Object {
    $parts = ($_ -split '\s+')
    $pid = $parts[-1]
    if ($pid -match '^\d+$') {
      Write-Output "  -> Stopping PID $pid"
      Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
  }
} else {
  Write-Output "  -> No existing listeners found"
}
Start-Sleep -Milliseconds 300

# Step 2: Start micro-auth in background
Write-Output "`n[Step 2] Starting micro-auth (port 5005)..."
$microAuthProcess = Start-Process -FilePath 'node' -ArgumentList 'src/app.js' `
  -WorkingDirectory $microAuthDir -PassThru -NoNewWindow `
  -RedirectStandardOutput (Join-Path $microAuthDir 'micro-auth.log') `
  -RedirectStandardError (Join-Path $microAuthDir 'micro-auth-error.log')
Write-Output "  -> PID: $($microAuthProcess.Id)"
Start-Sleep -Milliseconds 500

# Step 3: Start api-gateway in background
Write-Output "`n[Step 3] Starting api-gateway (port 8080)..."
$apiGatewayProcess = Start-Process -FilePath 'node' -ArgumentList 'server.js' `
  -WorkingDirectory $apiGatewayDir -PassThru -NoNewWindow `
  -RedirectStandardOutput (Join-Path $apiGatewayDir 'api-gateway.log') `
  -RedirectStandardError (Join-Path $apiGatewayDir 'api-gateway-error.log')
Write-Output "  -> PID: $($apiGatewayProcess.Id)"
Start-Sleep -Milliseconds 500

# Step 4: Wait for services to be ready (probe ports)
Write-Output "`n[Step 4] Waiting for services to be ready (max 30 seconds)..."
$maxWait = 30
$elapsed = 0
$microAuthReady = $false
$apiGatewayReady = $false

while ($elapsed -lt $maxWait -and (-not $microAuthReady -or -not $apiGatewayReady)) {
  if (-not $microAuthReady) {
    try {
      $null = Test-NetConnection -ComputerName localhost -Port 5005 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
      if ($?) {
        Write-Output "  -> micro-auth is ready (port 5005)"
        $microAuthReady = $true
      }
    } catch {}
  }
  
  if (-not $apiGatewayReady) {
    try {
      $null = Test-NetConnection -ComputerName localhost -Port 8080 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
      if ($?) {
        Write-Output "  -> api-gateway is ready (port 8080)"
        $apiGatewayReady = $true
      }
    } catch {}
  }
  
  if (-not $microAuthReady -or -not $apiGatewayReady) {
    Start-Sleep -Seconds 1
    $elapsed += 1
  }
}

if (-not $microAuthReady -or -not $apiGatewayReady) {
  Write-Output "  WARNING: Not all services are ready yet, but proceeding anyway..."
}
Start-Sleep -Seconds 2

# Step 5: Show listening ports
Write-Output "`n[Step 5] Current listening ports:"
netstat -ano | Select-String ':5005|:8080'

# Step 6: Run integration test
Write-Output "`n[Step 6] Running integration test (logout_verify_test.js)..."
Write-Output "=========================================="
cd $microAuthDir
& node scripts/logout_verify_test.js
$testExitCode = $LASTEXITCODE

# Step 7: Report results
Write-Output "`n=========================================="
Write-Output "Integration test completed with exit code: $testExitCode"
Write-Output "=========================================="
Write-Output "`nLogs:"
Write-Output "  micro-auth log: $microAuthDir\micro-auth.log"
Write-Output "  api-gateway log: $apiGatewayDir\api-gateway.log"
Write-Output "`nTo view logs:"
Write-Output "  Get-Content '$microAuthDir\micro-auth.log' -Tail 50"
Write-Output "  Get-Content '$apiGatewayDir\api-gateway.log' -Tail 50"

# Keep processes alive for a moment so user can see output
Write-Output "`nServices are running in background. Press Ctrl+C to stop."
Start-Sleep -Seconds 5

# Optional: keep services running or kill them
Write-Output "`n[Step 7] Stopping services..."
Stop-Process -Id $microAuthProcess.Id -Force -ErrorAction SilentlyContinue
Stop-Process -Id $apiGatewayProcess.Id -Force -ErrorAction SilentlyContinue
Write-Output "Done."
