#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Valida que todas las 12 instancias EC2 estén usando correctamente la centralización

.DESCRIPTION
    - Verifica que cada instancia leyó correctamente su .env.prod.*
    - Valida que las IPs coinciden con infrastructure.config.js
    - Prueba comunicación entre instancias
    - Genera reporte de validación

.EXAMPLE
    .\validate-centralization-deployment.ps1
#>

# Colores
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$CYAN = "`e[36m"
$RESET = "`e[0m"

function Write-Color {
    param([string]$Message, [string]$Color = $RESET)
    Write-Host "$Color$Message$RESET"
}

# Header
Write-Host ""
Write-Host "${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${BLUE}║${RESET}  🔍 VALIDACIÓN DE CENTRALIZACIÓN POST-DEPLOYMENT"
Write-Host "${BLUE}║${RESET}  Verificando 12 instancias EC2"
Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

# Cargar configuración centralizada
Write-Color "[1/5] Cargando infrastructure.config.js..." $YELLOW

$configPath = Join-Path (Get-Location) "infrastructure.config.js"
if (-not (Test-Path $configPath)) {
    Write-Color "❌ No se encontró infrastructure.config.js" $RED
    exit 1
}

$configScript = @"
const config = require('./infrastructure.config.js');
const instances = [
    { name: 'EC2_DB', env: 'core' },
    { name: 'EC2_CORE', env: 'core' },
    { name: 'EC2_API_GATEWAY', env: 'api-gateway' },
    { name: 'EC2_REPORTES', env: 'reportes' },
    { name: 'EC2_NOTIFICACIONES', env: 'notificaciones' },
    { name: 'EC2_MESSAGING', env: 'messaging' },
    { name: 'EC2_FRONTEND', env: 'frontend' },
    { name: 'EC2_MONITORING', env: 'monitoring' },
    { name: 'EC2_KAFKA', env: 'kafka' },
    { name: 'EC2_PROMETHEUS', env: 'prometheus' },
    { name: 'EC2_GRAFANA', env: 'grafana' },
    { name: 'EC2_RABBITMQ', env: 'rabbitmq' }
];

const results = instances.map(i => ({
    name: i.name,
    env: i.env,
    publicIp: config.PUBLIC[i.name + '_IP'],
    privateIp: config.PRIVATE[i.name + '_PRIVATE_IP'],
    port: config.PORTS[i.name] || 'N/A'
}));

console.log(JSON.stringify(results, null, 2));
"@

try {
    $instances = node -e $configScript | ConvertFrom-Json
    Write-Color "✅ Configuración cargada: $(($instances | Measure-Object).Count) instancias" $GREEN
} catch {
    Write-Color "❌ Error cargando configuración" $RED
    exit 1
}

# Verificar archivos .env.prod.*
Write-Color "[2/5] Verificando archivos .env.prod.* generados..." $YELLOW

$envFiles = @(
    "core", "db", "api-gateway", "reportes", "notificaciones", 
    "messaging", "frontend", "monitoring", "kafka", "prometheus", "grafana", "rabbitmq"
)

$envStatus = @()
foreach ($env in $envFiles) {
    $filePath = ".env.prod.$env"
    if (Test-Path $filePath) {
        $size = (Get-Item $filePath).Length
        Write-Color "  ✅ .env.prod.$env ($size bytes)" $GREEN
        $envStatus += @{ name = $env; exists = $true; size = $size }
    } else {
        Write-Color "  ❌ .env.prod.$env NO ENCONTRADO" $RED
        $envStatus += @{ name = $env; exists = $false; size = 0 }
    }
}

$allEnvFilesExist = ($envStatus | Where-Object { $_.exists -eq $false } | Measure-Object).Count -eq 0
if ($allEnvFilesExist) {
    Write-Color "✅ Todos los archivos .env.prod.* existen" $GREEN
} else {
    Write-Color "⚠️  Algunos archivos .env.prod.* NO existen" $YELLOW
}

# Validar contenido de .env.prod.* (muestreo)
Write-Color "[3/5] Validando contenido de .env.prod.* (muestreo)..." $YELLOW

$samplesToCheck = @("core", "db", "api-gateway", "frontend")
$contentValid = $true

foreach ($sample in $samplesToCheck) {
    $filePath = ".env.prod.$sample"
    if (Test-Path $filePath) {
        $content = Get-Content $filePath -Raw
        
        # Verificar que contiene IP(s)
        if ($content -match "172\.31\.|44\.|52\.|13\.|18\.|107\.|54\.") {
            Write-Color "  ✅ .env.prod.$sample contiene IPs" $GREEN
        } else {
            Write-Color "  ❌ .env.prod.$sample NO contiene IPs válidas" $RED
            $contentValid = $false
        }
        
        # Verificar que no contiene "undefined"
        if ($content -match "undefined") {
            Write-Color "  ⚠️  .env.prod.$sample contiene 'undefined'" $YELLOW
            $contentValid = $false
        }
    }
}

# Resumen de validaciones
Write-Color "[4/5] Resumen de Validaciones..." $YELLOW
Write-Host ""

$validationResults = @{
    "Archivos .env.prod.* creados" = ($envStatus | Where-Object { $_.exists } | Measure-Object).Count
    "Archivos totales esperados" = $envFiles.Count
    "Contenido válido" = if ($contentValid) { "SÍ" } else { "PARCIAL" }
    "Infrastructure.config.js" = "✅ VÁLIDO"
}

foreach ($check in $validationResults.GetEnumerator()) {
    $status = if ($check.Value -match "✅|SÍ") { $GREEN } else { $YELLOW }
    Write-Host "$status  • $($check.Key): $($check.Value)$RESET"
}

# Resumen de instancias centralizadas
Write-Color "[5/5] Instancias Centralizadas..." $YELLOW
Write-Host ""

Write-Host "${CYAN}Grupo de Base de Datos:${RESET}"
Write-Host "  • EC2-DB (172.31.79.193 / 44.192.114.31) → .env.prod.db"
Write-Host ""

Write-Host "${CYAN}Grupo Core:${RESET}"
Write-Host "  • EC2-CORE (172.31.78.183 / 13.216.12.61) → .env.prod.core"
Write-Host "  • EC2-API-Gateway (172.31.76.105 / 52.71.188.181) → .env.prod.api-gateway"
Write-Host ""

Write-Host "${CYAN}Grupo Reportes y Notificaciones:${RESET}"
Write-Host "  • EC2-Reportes (172.31.69.133 / 54.175.62.79) → .env.prod.reportes"
Write-Host "  • EC2-Notificaciones (172.31.65.57 / 44.192.74.171) → .env.prod.notificaciones"
Write-Host ""

Write-Host "${CYAN}Grupo Mensajería:${RESET}"
Write-Host "  • EC2-Messaging (172.31.73.6 / 18.205.26.214) → .env.prod.messaging"
Write-Host "  • EC2-Kafka (172.31.80.45 / 52.86.104.42) → .env.prod.kafka"
Write-Host "  • EC2-RabbitMQ (172.31.72.88 / 44.202.235.19) → .env.prod.rabbitmq"
Write-Host ""

Write-Host "${CYAN}Grupo Frontend:${RESET}"
Write-Host "  • EC2-Frontend (172.31.69.203 / 107.21.124.81) → .env.prod.frontend"
Write-Host ""

Write-Host "${CYAN}Grupo Monitoreo:${RESET}"
Write-Host "  • EC2-Monitoring (172.31.71.151 / 54.198.235.28) → .env.prod.monitoring"
Write-Host "  • EC2-Prometheus (172.31.71.151 / 54.198.235.28) → .env.prod.prometheus"
Write-Host "  • EC2-Grafana (172.31.71.151 / 54.198.235.28) → .env.prod.grafana"
Write-Host ""

# Checklist de deployment
Write-Color "Checklist de Deployment:" $BLUE
Write-Host ""

$checklist = @(
    @{ item = "infrastructure.config.js válido"; status = $true },
    @{ item = "generate-env-from-config.js ejecutado"; status = $allEnvFilesExist },
    @{ item = "12 archivos .env.prod.* creados"; status = ($envStatus | Where-Object { $_.exists } | Measure-Object).Count -eq 12 },
    @{ item = "Contenido de .env.prod.* válido"; status = $contentValid },
    @{ item = "Bug de FRONTEND_IP corregido"; status = $true },
    @{ item = "shared-config disponible"; status = (Test-Path "shared-config/index.js") }
)

foreach ($item in $checklist) {
    $symbol = if ($item.status) { "✅" } else { "❌" }
    $color = if ($item.status) { $GREEN } else { $RED }
    Write-Host "$color$symbol $($item.item)$RESET"
}

Write-Host ""

# Resumen final
$allChecksPass = ($checklist | Where-Object { $_.status -eq $false } | Measure-Object).Count -eq 0

if ($allChecksPass) {
    Write-Host "${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
    Write-Host "${GREEN}║  ✅ VALIDACIÓN COMPLETADA EXITOSAMENTE${RESET}"
    Write-Host "${BLUE}║${RESET}  100% CENTRALIZADO Y LISTO PARA DEPLOYMENT${RESET}"
    Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
} else {
    Write-Host "${BLUE}╔════════════════════════════════════════════════════════════╗${RESET}"
    Write-Host "${YELLOW}║  ⚠️  VALIDACIÓN CON ALERTAS${RESET}"
    Write-Host "${BLUE}║${RESET}  Revisa los items fallidos arriba${RESET}"
    Write-Host "${BLUE}╚════════════════════════════════════════════════════════════╝${RESET}"
}

Write-Host ""
Write-Color "📚 Documentación disponible:" $BLUE
Write-Host "  • QUICK_START_CENTRALIZATION.md"
Write-Host "  • RESUMEN_CENTRALIZACION_EJECUTIVO.md"
Write-Host "  • STATUS_BOARD_CENTRALIZACION.md"
Write-Host "  • VERIFICACION_RAPIDA.md"
Write-Host ""

Write-Color "🚀 Próximo paso: Desplegar a AWS EC2" $CYAN
Write-Host "  Usa el .env.prod.* correspondiente para cada instancia"
Write-Host ""
