#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Monitor the active deployment workflow

.DESCRIPTION
    Shows real-time progress of the running deploy workflow

.EXAMPLE
    .\monitor-deployment.ps1
#>

# Check if GitHub CLI is installed
if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
    Write-Host "❌ GitHub CLI is not installed" -ForegroundColor Red
    exit 1
}

function Get-RunStatus {
    $run = gh run list --limit 1 --json status,conclusion,name,createdAt --jq '.[0]' 2>&1
    return $run | ConvertFrom-Json
}

function Show-Status {
    Write-Host "`n"
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║  📊 Deployment Status Monitor                             ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    $run = Get-RunStatus
    
    if ($null -eq $run) {
        Write-Host "❌ No workflow runs found" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
    Write-Host "Workflow: $($run.name)" -ForegroundColor Cyan
    Write-Host "Created: $($run.createdAt)" -ForegroundColor Gray
    
    $statusColor = switch ($run.status) {
        "in_progress" { "Yellow" }
        "completed" { 
            if ($run.conclusion -eq "success") { "Green" } else { "Red" }
        }
        default { "Gray" }
    }
    
    $statusSymbol = switch ($run.status) {
        "in_progress" { "🟡 IN PROGRESS" }
        "completed" { 
            if ($run.conclusion -eq "success") { "✅ SUCCESS" } else { "❌ FAILED" }
        }
        default { "⚪ $($run.status)" }
    }
    
    Write-Host "Status: $statusSymbol" -ForegroundColor $statusColor
    Write-Host "Conclusion: $($run.conclusion)" -ForegroundColor $statusColor
    
    Write-Host ""
    
    # Show job details
    Write-Host "📋 Job Details:" -ForegroundColor Cyan
    $jobs = gh run view --exit-status 2>&1 | Select-String "✓|✗|●"
    foreach ($job in $jobs) {
        Write-Host "  $job" -ForegroundColor Gray
    }
    
    Write-Host ""
    
    if ($run.status -eq "completed") {
        Write-Host "✅ Workflow completed!" -ForegroundColor Green
        if ($run.conclusion -eq "success") {
            Write-Host ""
            Write-Host "🎉 Deployment successful!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Next steps:" -ForegroundColor Cyan
            Write-Host "  1. Verify services are running on EC2_CORE"
            Write-Host "  2. Test endpoints manually if needed"
            Write-Host "  3. Proceed with next instance deployment"
        } else {
            Write-Host ""
            Write-Host "⚠️  Deployment failed. Review logs:" -ForegroundColor Red
            Write-Host "  → GitHub Actions → Deploy Services → View logs"
        }
        return $false
    }
    
    return $true
}

# Monitor loop
Write-Host "Starting monitor... Press Ctrl+C to exit" -ForegroundColor Yellow
Write-Host ""

$isRunning = $true
$refreshCount = 0

while ($isRunning) {
    $isRunning = Show-Status
    $refreshCount++
    
    if ($isRunning) {
        Write-Host "🔄 Checking in 10 seconds... (Refresh #$refreshCount)" -ForegroundColor Gray
        Start-Sleep -Seconds 10
    }
}

Write-Host ""
Write-Host "Monitor stopped." -ForegroundColor Cyan
