#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Check latest workflow run status

.EXAMPLE
    .\check-workflow-status.ps1
#>

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  🚀 Deployment Status                                     ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""

# Get the latest run
Write-Host "Fetching latest run..." -ForegroundColor Cyan
$runInfo = gh run list --workflow="deploy.yml" --limit 1 --json status,conclusion,updatedAt,name 2>&1

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Error fetching run status" -ForegroundColor Red
    Write-Host $runInfo -ForegroundColor Red
    exit 1
}

Write-Host "Latest Run:" -ForegroundColor Cyan
Write-Host $runInfo

Write-Host ""
Write-Host "📊 Full Details:" -ForegroundColor Cyan
$details = gh run view --json status,conclusion,jobs 2>&1
Write-Host $details

Write-Host ""
Write-Host "🔗 View in GitHub:" -ForegroundColor Cyan
Write-Host "   https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
