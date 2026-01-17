# Deploy services via SSH to all EC2 instances
param(
    [Parameter(Mandatory=$false)]
    [string[]]$Services = @(),
    
    [Parameter(Mandatory=$false)]
    [string]$SshKeyPath = "vockey.pem"
)

$ErrorActionPreference = "Stop"

# Instance mapping
$Instances = @{
    "frontend"       = "44.220.126.89"
    "api-gateway"    = "35.168.216.132"
    "core"           = "13.222.63.75"
    "db"             = "100.31.104.252"
    "messaging"      = "98.93.37.132"
    "notificaciones" = "3.236.139.55"
    "reportes"       = "52.200.32.56"
    "monitoring"     = "98.88.93.98"
}

# Docker compose files mapping
$ComposeFiles = @{
    "frontend"       = "docker-compose.frontend.yml"
    "api-gateway"    = "docker-compose.api-gateway.yml"
    "core"           = "docker-compose.core.yml"
    "db"             = "docker-compose.infrastructure.yml"
    "messaging"      = "docker-compose.messaging.yml"
    "notificaciones" = "docker-compose.notificaciones.yml"
    "reportes"       = "docker-compose.notificaciones.yml"
    "monitoring"     = "docker-compose.prod.yml"
}

# Function to deploy to a single instance
function Deploy-Instance {
    param(
        [string]$Service,
        [string]$SshKeyPath
    )
    
    $IP = $Instances[$Service]
    $ComposeFile = $ComposeFiles[$Service]
    
    if (-not $IP) {
        Write-Host "❌ Unknown service: $Service" -ForegroundColor Red
        return $false
    }
    
    Write-Host ""
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "🚀 Deploying $Service to $IP" -ForegroundColor Green
    Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
    
    $Script = @"
set -e
echo "📦 Preparing deployment..."
cd /home/ubuntu

# Clone or pull repo
if [ -d "Proyecto-Acompa-amiento-" ]; then
    echo "📂 Updating repository..."
    cd Proyecto-Acompa-amiento-
    git pull origin main
else
    echo "📂 Cloning repository..."
    git clone https://github.com/arielguerron14/Proyecto-Acompa-amiento-.git
    cd Proyecto-Acompa-amiento-
fi

# Start services
echo "🐳 Starting Docker services with $ComposeFile..."
docker-compose -f "$ComposeFile" up -d

# Show running containers
echo "✅ Containers running:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

echo "✅ $Service deployment complete!"
"@
    
    try {
        $Script | ssh -i $SshKeyPath -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null "ubuntu@$IP"
        Write-Host "✅ Successfully deployed $Service" -ForegroundColor Green
        return $true
    }
    catch {
        Write-Host "❌ Failed to deploy $Service" -ForegroundColor Red
        Write-Host $_.Exception.Message
        return $false
    }
}

# Main execution
if ($Services.Count -eq 0) {
    Write-Host "Usage: .\deploy-services.ps1 -Services <service1>,<service2>,... -SshKeyPath <path>" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Available services:" -ForegroundColor Cyan
    foreach ($service in $Instances.Keys) {
        Write-Host "  - $service ($($Instances[$service]))" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "Example:" -ForegroundColor Yellow
    Write-Host "  .\deploy-services.ps1 -Services frontend,api-gateway" -ForegroundColor Gray
    Write-Host "  .\deploy-services.ps1 -Services all -SshKeyPath ./vockey.pem" -ForegroundColor Gray
    exit 1
}

$ServicesToDeploy = @()

if ($Services -contains "all") {
    $ServicesToDeploy = $Instances.Keys
}
else {
    $ServicesToDeploy = $Services
}

foreach ($service in $ServicesToDeploy) {
    Deploy-Instance -Service $service -SshKeyPath $SshKeyPath
}

Write-Host ""
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "✅ ALL DEPLOYMENTS COMPLETE" -ForegroundColor Green
Write-Host "════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
Write-Host "Services available at:" -ForegroundColor Green
Write-Host "🌐 Frontend:        http://44.220.126.89" -ForegroundColor Cyan
Write-Host "🔌 API Gateway:     http://35.168.216.132:8080" -ForegroundColor Cyan
Write-Host "🔐 Core Services:   http://13.222.63.75:3000" -ForegroundColor Cyan
Write-Host "💾 Database:        postgresql://100.31.104.252:5432" -ForegroundColor Cyan
Write-Host "📢 Messaging:       98.93.37.132:5672" -ForegroundColor Cyan
Write-Host "📧 Notificaciones:  http://3.236.139.55:5006" -ForegroundColor Cyan
Write-Host "📊 Reportes:        http://52.200.32.56:5003" -ForegroundColor Cyan
Write-Host "📈 Monitoring:      http://98.88.93.98:9090" -ForegroundColor Cyan
