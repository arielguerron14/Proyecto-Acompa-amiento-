#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Core Services immediately to EC2_CORE

.DESCRIPTION
    Triggers the deploy.yml workflow for EC2_CORE with:
    - All core services (api-gateway, micro-auth, micro-estudiantes, micro-maestros)
    - Docker rebuild enabled
    - Production environment

.EXAMPLE
    .\deploy-core-now.ps1
#>

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI is not installed" -ForegroundColor Red
    Write-Host "Install from: https://cli.github.com/" -ForegroundColor Yellow
    exit 1
}

Write-Host "`n"
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  🚀 Deploy Core Services to EC2_CORE                      ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host "`n"

Write-Host "📋 Deployment Configuration:" -ForegroundColor Cyan
Write-Host "  • Instance: EC2_CORE"
Write-Host "  • Services: api-gateway, micro-auth, micro-estudiantes, micro-maestros"
Write-Host "  • Docker Rebuild: Yes"
Write-Host "  • Environment: prod"
Write-Host "  • Duration: ~15 minutes"
Write-Host ""

$confirm = Read-Host "Continue with deployment? (y/n)"
if ($confirm -ne 'y' -and $confirm -ne 'Y') {
    Write-Host "❌ Cancelled" -ForegroundColor Yellow
    exit 0
}

Write-Host "`n▶️  Triggering workflow..." -ForegroundColor Cyan

# Trigger workflow
$result = gh workflow run deploy.yml `
    -f instance="EC2_CORE" `
    -f services="all" `
    -f rebuild_docker="true" `
    -f environment="prod" `
    2>&1

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Workflow triggered successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Monitor Progress:" -ForegroundColor Cyan
    Write-Host "  1. Go to: GitHub repo → Actions tab"
    Write-Host "  2. Select: 'Deploy Services' workflow"
    Write-Host "  3. Watch the latest run"
    Write-Host ""
    Write-Host "⏱️  Estimated time: 15 minutes" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "What to expect:" -ForegroundColor Cyan
    Write-Host "  ✓ Docker images built (4 services)"
    Write-Host "  ✓ Images transferred to EC2_CORE"
    Write-Host "  ✓ Containers started"
    Write-Host "  ✓ Endpoints tested (3000-3003)"
    Write-Host "  ✓ Logs validated"
    Write-Host "  ✓ Report generated"
    Write-Host ""
} else {
    Write-Host "❌ Error triggering workflow" -ForegroundColor Red
    Write-Host $result -ForegroundColor Red
    exit 1
}
