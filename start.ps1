#!/usr/bin/env pwsh
# Quick start script for Proyecto Acompañamiento

param(
    [switch]$messaging = $false,
    [switch]$full = $false,
    [switch]$clean = $false
)

$ErrorActionPreference = "Stop"

# Colors
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Reset = "`e[0m"

Write-Host "${Blue}╔════════════════════════════════════════════╗${Reset}"
Write-Host "${Blue}║  Proyecto Acompañamiento - Quick Start    ║${Reset}"
Write-Host "${Blue}╚════════════════════════════════════════════╝${Reset}"
Write-Host ""

if ($clean) {
    Write-Host "${Yellow}Limpiando contenedores y volúmenes...${Reset}"
    
    # Messaging services
    Write-Host "  Limpiando messaging..."
    Push-Location messaging
    docker-compose down -v 2>$null | Out-Null
    Pop-Location
    
    # Main services
    Write-Host "  Limpiando servicios principales..."
    docker-compose down -v 2>$null | Out-Null
    
    Write-Host "${Green}✓ Limpieza completada${Reset}"
    Write-Host ""
    exit 0
}

# Start messaging services if requested
if ($messaging -or $full) {
    Write-Host "${Yellow}Iniciando servicios de mensajería...${Reset}"
    Push-Location messaging
    
    Write-Host "  • Construyendo imágenes..."
    docker-compose build --quiet
    
    Write-Host "  • Iniciando contenedores..."
    docker-compose up -d
    
    Write-Host "  • Esperando a que los servicios se levanten..."
    Start-Sleep -Seconds 5
    
    Write-Host "${Green}✓ Servicios de mensajería iniciados${Reset}"
    Write-Host "    • Kafka:      localhost:9092"
    Write-Host "    • RabbitMQ:   localhost:5672 / Management: localhost:15672"
    Write-Host "    • Zookeeper:  localhost:2181"
    Write-Host "    • Kafka UI:   localhost:8081"
    Write-Host ""
    
    Pop-Location
}

# Start main services if not just messaging
if (-not $messaging -or $full) {
    Write-Host "${Yellow}Iniciando servicios principales...${Reset}"
    
    Write-Host "  • Construyendo imágenes..."
    docker-compose build --quiet
    
    Write-Host "  • Iniciando contenedores..."
    docker-compose up -d
    
    Write-Host "  • Esperando a que los servicios se levanten..."
    Start-Sleep -Seconds 8
    
    Write-Host "${Green}✓ Servicios principales iniciados${Reset}"
    Write-Host ""
}

# Show status
Write-Host "${Blue}Estado de los servicios:${Reset}"
Write-Host ""

if ($messaging -or $full) {
    Write-Host "  ${Yellow}Messaging:${Reset}"
    Push-Location messaging
    docker-compose ps --format "table {{.Names}}\t{{.Status}}" | ForEach-Object { Write-Host "    $_" }
    Pop-Location
    Write-Host ""
}

if (-not $messaging -or $full) {
    Write-Host "  ${Yellow}Principales:${Reset}"
    docker-compose ps --format "table {{.Names}}\t{{.Status}}" | ForEach-Object { Write-Host "    $_" }
    Write-Host ""
}

Write-Host "${Green}✓ Sistema listo!${Reset}"
Write-Host ""
Write-Host "Acceso a servicios:"
Write-Host "  • Frontend:       http://localhost:5500"
Write-Host "  • API Gateway:    http://localhost:8080"
Write-Host "  • Grafana:        http://localhost:3001 (admin/admin)"
Write-Host "  • Prometheus:     http://localhost:9090"
Write-Host ""
Write-Host "Para ver logs:"
Write-Host "  docker-compose logs -f [servicio]"
Write-Host ""
Write-Host "Para detener:"
Write-Host "  docker-compose down"
Write-Host ""
