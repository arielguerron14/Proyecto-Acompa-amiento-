#!/usr/bin/env pwsh
<#
.SYNOPSIS
    GitHub Actions Workflow Executor - Deploy instances easily from PowerShell

.DESCRIPTION
    Execute GitHub Actions workflows for deploying services to EC2 instances
    directly from PowerShell without needing to go to GitHub web interface.

.EXAMPLE
    .\run-workflows.ps1
    # Shows interactive menu to select workflow

.NOTES
    Requires: GitHub CLI (gh) installed and authenticated
    Setup: gh auth login
#>

param(
    [ValidateSet("deploy-core", "deploy-instance", "list")]
    [string]$Action = "menu"
)

# Colors for output
$Colors = @{
    Success = 'Green'
    Error   = 'Red'
    Warning = 'Yellow'
    Info    = 'Cyan'
    Section = 'Magenta'
}

function Write-Banner {
    Write-Host "`n"
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "║  🚀 GitHub Actions Workflow Executor                       ║" -ForegroundColor Magenta
    Write-Host "║  Deploy services to EC2 instances from PowerShell          ║" -ForegroundColor Magenta
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host "`n"
}

function Test-Prerequisites {
    Write-Host "Checking prerequisites..." -ForegroundColor $Colors.Info
    
    # Check if GitHub CLI is installed
    if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
        Write-Host "❌ GitHub CLI is not installed" -ForegroundColor $Colors.Error
        Write-Host "Install from: https://cli.github.com/" -ForegroundColor $Colors.Warning
        exit 1
    }
    
    # Check if authenticated
    $auth = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ GitHub CLI is not authenticated" -ForegroundColor $Colors.Error
        Write-Host "Run: gh auth login" -ForegroundColor $Colors.Warning
        exit 1
    }
    
    Write-Host "✅ Prerequisites OK`n" -ForegroundColor $Colors.Success
}

function Show-MainMenu {
    Write-Host "Select action:" -ForegroundColor $Colors.Section
    Write-Host ""
    Write-Host "  1️⃣  Deploy Services" -ForegroundColor $Colors.Info
    Write-Host "      → Any instance (12 available)"
    Write-Host "      → Optional Docker rebuild"
    Write-Host "      → Select environment (dev/staging/prod)"
    Write-Host ""
    Write-Host "  2️⃣  List Recent Workflow Runs" -ForegroundColor $Colors.Info
    Write-Host "      → Shows last 5 executions"
    Write-Host ""
    Write-Host "  3️⃣  Get Workflow Status" -ForegroundColor $Colors.Info
    Write-Host "      → Check running workflows"
    Write-Host ""
    Write-Host "  0️⃣  Exit" -ForegroundColor $Colors.Warning
    Write-Host ""
    
    $choice = Read-Host "Enter choice (0-3)"
    return $choice
}

function Deploy-CoreServices {
    Write-Host "`n" 
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Section
    Write-Host "🚀 Deploy Services" -ForegroundColor $Colors.Section
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Section
    Write-Host ""
    
    Write-Host "Select instance to deploy:" -ForegroundColor $Colors.Info
    $instances = @(
        "EC2_CORE",
        "EC2_DB",
        "EC2_API_GATEWAY",
        "EC2_AUTH",
        "EC2_ESTUDIANTES",
        "EC2_MAESTROS",
        "EC2_MESSAGING",
        "EC2_NOTIFICACIONES",
        "EC2_REPORTES",
        "EC2_SOAP_BRIDGE",
        "EC2_MONITORING",
        "EC2_KAFKA"
    )
    
    for ($i = 0; $i -lt $instances.Count; $i++) {
        Write-Host "  $($i+1)) $($instances[$i])" -ForegroundColor $Colors.Info
    }
    Write-Host ""
    
    $instChoice = Read-Host "Enter instance number (1-12)"
    $instanceIndex = [int]$instChoice - 1
    
    if ($instanceIndex -lt 0 -or $instanceIndex -ge $instances.Count) {
        Write-Host "❌ Invalid selection" -ForegroundColor $Colors.Error
        return
    }
    
    $selectedInstance = $instances[$instanceIndex]
    
    Write-Host ""
    Write-Host "Rebuild Docker images?" -ForegroundColor $Colors.Info
    Write-Host "  1) Yes (full deployment, ~12-15 min)"
    Write-Host "  2) No (fast deployment, ~2-3 min)"
    Write-Host ""
    
    $rebuildChoice = Read-Host "Enter choice (1-2, default=1)"
    $rebuildDocker = if ($rebuildChoice -eq "2") { "false" } else { "true" }
    
    Write-Host ""
    Write-Host "Select environment:" -ForegroundColor $Colors.Info
    Write-Host "  1) dev"
    Write-Host "  2) staging"
    Write-Host "  3) prod (recommended)"
    Write-Host ""
    
    $envChoice = Read-Host "Enter environment (1-3, default=3)"
    $environment = switch ($envChoice) {
        "1" { "dev" }
        "2" { "staging" }
        default { "prod" }
    }
    
    Write-Host ""
    Write-Host "Select services (or press Enter for all):" -ForegroundColor $Colors.Info
    $services = Read-Host "Services (comma-separated or 'all')"
    if ([string]::IsNullOrWhiteSpace($services)) {
        $services = "all"
    }
    
    Write-Host ""
    Write-Host "📋 Summary:" -ForegroundColor $Colors.Info
    Write-Host "  • Workflow: deploy.yml"
    Write-Host "  • Instance: $selectedInstance"
    Write-Host "  • Environment: $environment"
    Write-Host "  • Rebuild: $(if ($rebuildDocker -eq 'true') { 'Yes' } else { 'No' })"
    Write-Host "  • Services: $services"
    Write-Host ""
    
    $confirm = Read-Host "Continue? (y/n)"
    if ($confirm -ne 'y' -and $confirm -ne 'Y') {
        Write-Host "❌ Cancelled" -ForegroundColor $Colors.Warning
        return
    }
    
    Write-Host "`n▶️  Starting workflow..." -ForegroundColor $Colors.Info
    
    # Trigger workflow
    $result = gh workflow run deploy.yml `
        -f instance=$selectedInstance `
        -f services=$services `
        -f rebuild_docker=$rebuildDocker `
        -f environment=$environment `
        2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Workflow triggered successfully!" -ForegroundColor $Colors.Success
        Write-Host ""
        Write-Host "📊 Check progress:" -ForegroundColor $Colors.Info
        Write-Host "  → GitHub Actions → Deploy Services"
        Write-Host ""
    } else {
        Write-Host "❌ Error triggering workflow" -ForegroundColor $Colors.Error
        Write-Host $result -ForegroundColor $Colors.Error
    }
}

function Show-RecentRuns {
    Write-Host "`n"
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Section
    Write-Host "📊 Recent Workflow Runs (Last 5)" -ForegroundColor $Colors.Section
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Section
    Write-Host ""
    
    $runs = gh run list --limit 5 --json status,conclusion,name,createdAt,updatedAt 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Error retrieving runs" -ForegroundColor $Colors.Error
        return
    }
    
    Write-Host $runs
    Write-Host ""
}

function Show-WorkflowStatus {
    Write-Host "`n"
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Section
    Write-Host "🔄 Workflow Status" -ForegroundColor $Colors.Section
    Write-Host "════════════════════════════════════════════════════════════" -ForegroundColor $Colors.Section
    Write-Host ""
    
    $status = gh run list --status in_progress --json status,name,createdAt 2>&1
    
    if ($LASTEXITCODE -eq 0 -and $status) {
        Write-Host "🟡 Running Workflows:" -ForegroundColor $Colors.Warning
        Write-Host $status
    } else {
        Write-Host "✅ No workflows currently running" -ForegroundColor $Colors.Success
    }
    Write-Host ""
}

# Main execution
function Main {
    Write-Banner
    Test-Prerequisites
    
    while ($true) {
        $choice = Show-MainMenu
        
        switch ($choice) {
            "1" { Deploy-CoreServices }
            "2" { Show-RecentRuns }
            "3" { Show-WorkflowStatus }
            "0" { 
                Write-Host "👋 Goodbye!" -ForegroundColor $Colors.Info
                exit 0 
            }
            default { 
                Write-Host "❌ Invalid choice" -ForegroundColor $Colors.Error
            }
        }
        
        Read-Host "`nPress Enter to continue"
    }
}

# Run main
Main
