# PowerShell deployment script for EC2 instances
# Usage: .\Deploy-EC2-Services.ps1 -InstanceIP "44.221.50.177" -InstanceType "messaging" -Rebuild $true

param(
    [Parameter(Mandatory=$true)]
    [string]$InstanceIP,
    
    [Parameter(Mandatory=$true)]
    [ValidateSet("messaging", "monitoring")]
    [string]$InstanceType,
    
    [Parameter(Mandatory=$false)]
    [bool]$Rebuild = $true,
    
    [Parameter(Mandatory=$false)]
    [string]$SSHKey = "~/.ssh/id_rsa"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "EC2 Deployment via PowerShell" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Instance IP: $InstanceIP" -ForegroundColor Yellow
Write-Host "Instance Type: $InstanceType" -ForegroundColor Yellow
Write-Host "Rebuild Images: $Rebuild" -ForegroundColor Yellow
Write-Host ""

# Determine docker-compose file
$ComposeFile = switch($InstanceType) {
    "messaging" { "messaging/docker-compose.yml" }
    "monitoring" { "monitoring/docker-compose.yml" }
}

Write-Host "Compose file: $ComposeFile" -ForegroundColor Green
Write-Host ""

# Test SSH
Write-Host "[1/4] Testing SSH connection to $InstanceIP..." -ForegroundColor Cyan
try {
    $sshTest = ssh -o StrictHostKeyChecking=no -o ConnectTimeout=5 ubuntu@$InstanceIP "echo OK" 2>&1
    if ($sshTest -like "*OK*") {
        Write-Host "✓ SSH connection successful" -ForegroundColor Green
    } else {
        throw "SSH test failed"
    }
} catch {
    Write-Host "✗ SSH connection failed: $_" -ForegroundColor Red
    exit 1
}

# Transfer docker-compose
Write-Host "[2/4] Transferring docker-compose.yml..." -ForegroundColor Cyan
try {
    $scpCmd = "scp -o StrictHostKeyChecking=no '$ComposeFile' ubuntu@${InstanceIP}:~/app/docker-compose.yml"
    Invoke-Expression $scpCmd 2>&1 | Out-Null
    Write-Host "✓ File transferred" -ForegroundColor Green
} catch {
    Write-Host "✗ Transfer failed: $_" -ForegroundColor Red
    exit 1
}

# Deploy
Write-Host "[3/4] Deploying services..." -ForegroundColor Cyan
$deployScript = @'
set -e
echo "Stopping old containers..."
docker-compose -f ~/app/docker-compose.yml down 2>/dev/null || true

if [ "$REBUILD" = "true" ]; then
  echo "Removing old images..."
  docker image prune -f || true
fi

echo "Starting services..."
cd ~/app
docker-compose up -d

sleep 5
echo "Status:"
docker-compose ps
'@

$sshDeploy = ssh -o StrictHostKeyChecking=no ubuntu@$InstanceIP "bash -s $Rebuild" <<< $deployScript 2>&1
Write-Host $sshDeploy -ForegroundColor Cyan

Write-Host "[4/4] Deployment complete!" -ForegroundColor Cyan
Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: python check-ec2-services.py" -ForegroundColor White
Write-Host "2. Wait 30-60 seconds for services to fully start" -ForegroundColor White
Write-Host "========================================" -ForegroundColor Cyan
