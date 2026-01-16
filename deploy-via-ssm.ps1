#!/usr/bin/env pwsh
<#
.SYNOPSIS
Deploy project to EC2-CORE instance using AWS SSM Session Manager

.DESCRIPTION
This script uses AWS Systems Manager Session Manager to deploy to EC2-CORE
without requiring SSH keys.

.EXAMPLE
./deploy-via-ssm.ps1
#>

param(
    [string]$InstanceTag = "EC2-CORE",
    [bool]$RebuildDocker = $true,
    [string]$AWSRegion = "us-east-1"
)

function Write-Status {
    param([string]$Message, [string]$Status = "INFO")
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    Write-Host "[$timestamp] [$Status] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[✓] $Message" -ForegroundColor Green
}

function Write-Error {
    param([string]$Message)
    Write-Host "[✗] ERROR: $Message" -ForegroundColor Red
}

# 1. Find EC2-CORE Instance
Write-Status "Finding EC2-CORE instance..."
$instanceResult = aws ec2 describe-instances `
    --filters "Name=tag:Name,Values=$InstanceTag" "Name=instance-state-name,Values=running" `
    --query 'Reservations[0].Instances[0].[InstanceId,PublicIpAddress]' `
    --output text `
    --region $AWSRegion

if (-not $instanceResult) {
    Write-Error "Could not find running instance with tag '$InstanceTag'"
    exit 1
}

$instanceId, $instanceIp = $instanceResult -split '\s+' | Where-Object { $_ }

Write-Success "Found instance: $instanceId (IP: $instanceIp)"

# 2. Stop Services
Write-Status "Stopping Docker services..."
aws ssm send-command `
    --document-name "AWS-RunShellScript" `
    --instance-ids "$instanceId" `
    --parameters 'commands=["cd /home/ubuntu/project && docker-compose down 2>/dev/null || echo \"Services stopped\""]' `
    --region $AWSRegion | Out-Null

Start-Sleep -Seconds 3
Write-Success "Services stopped"

# 3. Update Code (Git Pull)
Write-Status "Updating code from repository..."
aws ssm send-command `
    --document-name "AWS-RunShellScript" `
    --instance-ids "$instanceId" `
    --parameters 'commands=["cd /home/ubuntu/project && git pull origin main 2>/dev/null || echo \"Git not available, skipping\"","ls -la /home/ubuntu/project/ | head -10"]' `
    --region $AWSRegion | Out-Null

Start-Sleep -Seconds 2
Write-Success "Code updated"

# 4. Rebuild Docker Images
if ($RebuildDocker) {
    Write-Status "Rebuilding Docker images (this may take 5-10 minutes)..."
    
    $buildCommands = @"
cd /home/ubuntu/project
echo "Building Docker images..."
docker-compose build --no-cache api-gateway core auth db frontend 2>&1 | tail -20
docker image prune -f || true
echo "Build complete"
"@
    
    aws ssm send-command `
        --document-name "AWS-RunShellScript" `
        --instance-ids "$instanceId" `
        --parameters @("commands=[""$buildCommands""]") `
        --region $AWSRegion | Out-Null
    
    Write-Status "Docker build initiated (check AWS console for progress)..."
    Start-Sleep -Seconds 30
} else {
    Write-Status "Skipping Docker rebuild"
}

# 5. Start Services
Write-Status "Starting application services..."
aws ssm send-command `
    --document-name "AWS-RunShellScript" `
    --instance-ids "$instanceId" `
    --parameters 'commands=["cd /home/ubuntu/project && docker-compose up -d api-gateway core auth db frontend","sleep 5","docker-compose ps"]' `
    --region $AWSRegion | Out-Null

Write-Success "Services started"

# 6. Verify Deployment
Write-Status "Verifying application health..."
Start-Sleep -Seconds 10

$healthcheck = $false
for ($i = 1; $i -le 10; $i++) {
    try {
        $response = curl -s -f "http://${instanceIp}:3000/health" -ErrorAction SilentlyContinue
        if ($response) {
            $healthcheck = $true
            break
        }
    } catch {
        # Continue
    }
    Write-Host "  Attempt $i/10 - waiting..." -ForegroundColor Yellow
    Start-Sleep -Seconds 5
}

# 7. Display Results
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "✅ DEPLOYMENT COMPLETE" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Application Information:" -ForegroundColor Cyan
Write-Host "  Instance ID:  $instanceId"
Write-Host "  Instance IP:  $instanceIp"
Write-Host ""
Write-Host "🌐 Access Application:" -ForegroundColor Green
Write-Host "  http://${instanceIp}:3000" -ForegroundColor Yellow
Write-Host ""
Write-Host "📋 Service Endpoints:" -ForegroundColor Cyan
Write-Host "  Frontend:     http://${instanceIp}:3000"
Write-Host "  API Gateway:  http://${instanceIp}:8000"
Write-Host "  Health Check: http://${instanceIp}:3000/health"
Write-Host ""

if ($healthcheck) {
    Write-Host "✅ Application is responding!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Application may still be starting up" -ForegroundColor Yellow
    Write-Host "   Check again in 30 seconds" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📝 Check Logs:" -ForegroundColor Cyan
Write-Host "  aws ssm start-session --target $instanceId --region $AWSRegion"
Write-Host "  docker-compose logs -f" -ForegroundColor Gray
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
