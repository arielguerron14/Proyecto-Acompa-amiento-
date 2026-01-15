#!/usr/bin/env powershell

<#
.SYNOPSIS
    Update CORE_HOST - Single Point to Update All Service Routes

.DESCRIPTION
    This script updates the CORE_HOST environment variable that controls
    where all microservices are located. When you run this, all services
    automatically start using the new IP without code changes.

.PARAMETER CoreHost
    The new IP address or URL for EC2-CORE
    Examples: 3.236.51.29, http://172.31.79.241, ec2-3-236-51-29.compute-1.amazonaws.com

.EXAMPLE
    .\update-core-host.ps1 3.236.51.29
    .\update-core-host.ps1 http://172.31.79.241
    .\update-core-host.ps1 ec2-3-236-51-29.compute-1.amazonaws.com
#>

param(
    [Parameter(Mandatory=$true, Position=0)]
    [string]$CoreHost
)

$ErrorActionPreference = "Stop"

# Ensure it has protocol
if (-not ($CoreHost -match "^http")) {
    $CoreHost = "http://$CoreHost"
}

Write-Host "🔄 Updating CORE_HOST to: $CoreHost" -ForegroundColor Cyan
Write-Host ""

# Update .env if it exists
if (Test-Path ".env") {
    Write-Host "📝 Updating .env..." -ForegroundColor Yellow
    $envContent = Get-Content ".env" -Raw
    
    if ($envContent -match "CORE_HOST=") {
        $envContent = $envContent -replace "CORE_HOST=.*", "CORE_HOST=$CoreHost"
    } else {
        $envContent += "`nCORE_HOST=$CoreHost"
    }
    
    Set-Content ".env" -Value $envContent -Encoding UTF8
    Write-Host "✅ .env updated" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env not found, creating it..." -ForegroundColor Yellow
    Set-Content ".env" -Value "CORE_HOST=$CoreHost" -Encoding UTF8
    Write-Host "✅ .env created" -ForegroundColor Green
}

# Update docker-compose.yml if it exists
if (Test-Path "docker-compose.yml") {
    Write-Host "📝 Updating docker-compose.yml..." -ForegroundColor Yellow
    Write-Host "⚠️  Note: Manually update CORE_HOST environment variable in docker-compose.yml if needed" -ForegroundColor Yellow
}

# Update docker-compose.api-gateway.yml if it exists
if (Test-Path "docker-compose.api-gateway.yml") {
    Write-Host "📝 Updating docker-compose.api-gateway.yml..." -ForegroundColor Yellow
    $composeContent = Get-Content "docker-compose.api-gateway.yml" -Raw
    $composeContent = $composeContent -replace 'CORE_HOST:\s*["\']?[^"\'' + "`n" + ']+', "CORE_HOST: `"$CoreHost`""
    Set-Content "docker-compose.api-gateway.yml" -Value $composeContent -Encoding UTF8
    Write-Host "✅ docker-compose.api-gateway.yml updated" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ CORE_HOST updated!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "  1. Rebuild & restart: docker-compose up -d api-gateway"
Write-Host "  2. Verify: curl http://localhost:8080/health"
Write-Host "  3. Check config: curl http://localhost:8080/config"
Write-Host ""
Write-Host "💡 All services will automatically use the new IP:" -ForegroundColor Cyan
Write-Host "   - /auth/* → $CoreHost`:3000"
Write-Host "   - /estudiantes/* → $CoreHost`:3001"
Write-Host "   - /maestros/* → $CoreHost`:3002"
Write-Host "   - /reportes/* → $CoreHost`:5003"
