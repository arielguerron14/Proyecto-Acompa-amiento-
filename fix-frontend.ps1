#!/usr/bin/env pwsh

<#
.SYNOPSIS
Fix Frontend Deployment - Direct Docker Commands via AWS SSM
.DESCRIPTION
Connects to EC2-Frontend and deploys the frontend container with correct port mapping
#>

$AWS_REGION = "us-east-1"

Write-Host "🔍 Obteniendo Instance ID de EC2-Frontend..." -ForegroundColor Cyan

$InstanceInfo = aws ec2 describe-instances `
  --filters "Name=tag:Name,Values=EC2-Frontend" `
  --region $AWS_REGION `
  --query 'Reservations[0].Instances[0]' `
  --output json | ConvertFrom-Json

if (-not $InstanceInfo -or -not $InstanceInfo.InstanceId) {
  Write-Host "❌ Error: No se encontró EC2-Frontend" -ForegroundColor Red
  exit 1
}

$INSTANCE_ID = $InstanceInfo.InstanceId
$PUBLIC_IP = $InstanceInfo.PublicIpAddress

Write-Host "✅ Instance encontrado: $INSTANCE_ID" -ForegroundColor Green
Write-Host "   IP Pública: $PUBLIC_IP" -ForegroundColor Green
Write-Host ""
Write-Host "🚀 Desplegando Frontend..." -ForegroundColor Yellow

# Build the commands
$Commands = @(
  "echo 'Deteniendo contenedor anterior...'",
  "docker stop frontend 2>/dev/null || true",
  "docker rm frontend 2>/dev/null || true",
  "echo 'Limpiando images...'",
  "docker rmi frontend-web:latest 2>/dev/null || true",
  "echo 'Verificando acceso a Docker...'",
  "docker ps",
  "echo 'Corriendo nuevo contenedor de Frontend...'",
  "docker run -d --name frontend -p 3000:3000 --restart unless-stopped frontend-web:latest",
  "echo 'Verificando que el contenedor esté corriendo...'",
  "sleep 2",
  "docker ps | grep frontend",
  "echo 'Verificando logs (últimas 15 líneas)...'",
  "docker logs frontend 2>&1 | tail -15"
)

$CommandsJson = ConvertTo-Json $Commands -AsArray

Write-Host "📤 Enviando comando a SSM..." -ForegroundColor Cyan

# Send command via SSM
$Result = aws ssm send-command `
  --instance-ids $INSTANCE_ID `
  --document-name "AWS-RunShellScript" `
  --region $AWS_REGION `
  --parameters commands=$CommandsJson `
  --output json | ConvertFrom-Json

$COMMAND_ID = $Result.Command.CommandId

Write-Host "   Command ID: $COMMAND_ID" -ForegroundColor Green
Write-Host ""
Write-Host "⏳ Esperando resultado (máximo 2 minutos)..." -ForegroundColor Yellow

# Wait for command to complete
$MaxAttempts = 60
$Attempt = 0

while ($Attempt -lt $MaxAttempts) {
  $Attempt++
  
  $Invocation = aws ssm get-command-invocation `
    --command-id $COMMAND_ID `
    --instance-id $INSTANCE_ID `
    --region $AWS_REGION `
    --output json | ConvertFrom-Json
  
  $Status = $Invocation.Status
  Write-Host "`r  Estado: $Status (Intento $Attempt/$MaxAttempts)" -NoNewline
  
  if ($Status -eq "Success" -or $Status -eq "Failed") {
    Write-Host ""
    Write-Host ""
    
    $Output = $Invocation.StandardOutputContent
    
    Write-Host "📋 Output:" -ForegroundColor Cyan
    Write-Host "---" -ForegroundColor Gray
    Write-Host $Output
    Write-Host "---" -ForegroundColor Gray
    Write-Host ""
    
    if ($Status -eq "Success") {
      Write-Host "✅ Frontend deployment exitoso!" -ForegroundColor Green
      Write-Host ""
      Write-Host "🌐 Frontend disponible en: http://$PUBLIC_IP`:3000" -ForegroundColor Green
      Write-Host ""
      Write-Host "💡 Tip: Abre en el navegador: http://$PUBLIC_IP`:3000" -ForegroundColor Cyan
    } else {
      Write-Host "❌ El comando falló" -ForegroundColor Red
      Write-Host ""
      Write-Host "Error output:" -ForegroundColor Yellow
      Write-Host $Invocation.StandardErrorContent
      exit 1
    }
    
    break
  }
  
  Start-Sleep -Seconds 2
}

Write-Host ""
Write-Host "✅ Proceso completado" -ForegroundColor Green
