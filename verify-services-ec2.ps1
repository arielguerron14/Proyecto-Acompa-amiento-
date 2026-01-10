#!/usr/bin/env pwsh
<#
.SYNOPSIS
Verifica que los servicios de infraestructura estén funcionando en las instancias EC2

.DESCRIPTION
Prueba conectividad a Kafka, Zookeeper, RabbitMQ, Prometheus y Grafana en sus IPs públicas.
#>

$ErrorActionPreference = "SilentlyContinue"

# Configuración de servicios
$services = @(
    @{ Name = "ZOOKEEPER"; IP = "44.221.50.177"; Port = 2181; Type = "TCP" }
    @{ Name = "KAFKA"; IP = "44.221.50.177"; Port = 9092; Type = "TCP" }
    @{ Name = "RABBITMQ_AMQP"; IP = "44.221.50.177"; Port = 5672; Type = "TCP" }
    @{ Name = "RABBITMQ_MGMT"; IP = "44.221.50.177"; Port = 15672; Type = "HTTP" }
    @{ Name = "PROMETHEUS"; IP = "54.198.235.28"; Port = 9090; Type = "HTTP"; Path = "/api/v1/targets" }
    @{ Name = "GRAFANA"; IP = "54.198.235.28"; Port = 3000; Type = "HTTP"; Path = "/api/health" }
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "VERIFICANDO SERVICIOS EN INSTANCIAS EC2" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

$results = @()
$count = 0

foreach ($service in $services) {
    $count++
    $statusEmoji = "⏳"
    $statusColor = "Yellow"
    $statusText = "Verificando..."
    
    Write-Host "[$count/$($services.Count)] $($service.Name) ($($service.IP):$($service.Port))" -ForegroundColor White -NoNewline
    Write-Host " ... " -NoNewline
    
    try {
        if ($service.Type -eq "TCP") {
            # Test TCP connection
            $tcp = New-Object System.Net.Sockets.TcpClient
            $result = $tcp.BeginConnect($service.IP, $service.Port, $null, $null)
            $wait = $result.AsyncWaitHandle.WaitOne(2000)
            
            if ($wait -and $tcp.Connected) {
                $statusEmoji = "✅"
                $statusColor = "Green"
                $statusText = "FUNCIONANDO"
                $tcp.Close()
            } else {
                $statusEmoji = "❌"
                $statusColor = "Red"
                $statusText = "NO ACCESIBLE"
            }
        } elseif ($service.Type -eq "HTTP") {
            # Test HTTP endpoint
            $url = "http://$($service.IP):$($service.Port)$($service.Path)"
            $response = Invoke-WebRequest -Uri $url -TimeoutSec 3 -ErrorAction Stop
            
            if ($response.StatusCode -eq 200) {
                $statusEmoji = "✅"
                $statusColor = "Green"
                $statusText = "FUNCIONANDO"
            }
        }
    } catch {
        $statusEmoji = "❌"
        $statusColor = "Red"
        $statusText = "NO ACCESIBLE"
    }
    
    Write-Host "$statusEmoji $statusText" -ForegroundColor $statusColor
    
    $results += @{
        Service = $service.Name
        Status = $statusEmoji
        Text = $statusText
    }
}

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "RESUMEN" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$successCount = ($results | Where-Object { $_.Status -eq "✅" }).Count
$failCount = ($results | Where-Object { $_.Status -eq "❌" }).Count

Write-Host "`n📊 Total servicios verificados: $($results.Count)" -ForegroundColor Cyan
Write-Host "✅ Funcionando: $successCount" -ForegroundColor Green
Write-Host "❌ No accesible: $failCount" -ForegroundColor Red

if ($failCount -eq 0) {
    Write-Host "`n🎉 ¡TODOS LOS SERVICIOS ESTÁN FUNCIONANDO!" -ForegroundColor Green
} else {
    Write-Host "`n⚠️  Los siguientes servicios NO son accesibles:" -ForegroundColor Yellow
    foreach ($result in $results | Where-Object { $_.Status -eq "❌" }) {
        Write-Host "   - $($result.Service)" -ForegroundColor Yellow
    }
    Write-Host "`n💡 Posibles causas:" -ForegroundColor Yellow
    Write-Host "   - Los deployments aún están en progreso (espera 5-10 minutos)" -ForegroundColor Yellow
    Write-Host "   - Los Security Groups no permiten tráfico en esos puertos" -ForegroundColor Yellow
    Write-Host "   - Los servicios aún no están inicializados" -ForegroundColor Yellow
}

Write-Host "`n========================================`n" -ForegroundColor Cyan
