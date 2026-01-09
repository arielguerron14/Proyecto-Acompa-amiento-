#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Script integrador para deploy completo, monitoreo y debugging

.DESCRIPTION
    Ejecuta en secuencia:
    1. deploy-complete.ps1 - Deploy con rebuild de imagen Docker
    2. post-deploy-monitor.ps1 - Monitoreo y prueba de endpoints
    3. debug-post-deployment.ps1 - Diagnóstico completo
    
    Todo en un solo comando interactivo

.PARAMETER InstanceName
    Nombre de la instancia (EC2_CORE, EC2_DB, etc.)

.PARAMETER AutoContinue
    Continuar automáticamente entre fases sin esperar input

.EXAMPLE
    .\deploy-and-validate.ps1 -InstanceName "EC2_CORE"
    .\deploy-and-validate.ps1 -InstanceName "EC2_CORE" -AutoContinue
#>

param(
    [Parameter(Mandatory=$true)]
    [string]$InstanceName,
    
    [switch]$AutoContinue = $false,
    [switch]$SkipDeploy = $false,
    [switch]$SkipDebug = $false
)

# Colores
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$RED = "`e[31m"
$BLUE = "`e[34m"
$CYAN = "`e[36m"
$MAGENTA = "`e[35m"
$RESET = "`e[0m"

function Write-Color {
    param([string]$Message, [string]$Color = $RESET)
    Write-Host "$Color$Message$RESET"
}

function Write-Section {
    param([string]$Title)
    Write-Host ""
    Write-Host "${CYAN}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
    Write-Host "${CYAN}║${RESET}  $Title"
    Write-Host "${CYAN}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
    Write-Host ""
}

function Pause-Menu {
    param([string]$Message = "Presiona Enter para continuar...")
    if (-not $AutoContinue) {
        Write-Host ""
        Write-Color $Message $YELLOW
        Read-Host "" > $null
    } else {
        Start-Sleep -Seconds 2
    }
}

# Validar instancia
$validInstances = @(
    "EC2_CORE", "EC2_DB", "EC2_API_GATEWAY", "EC2_AUTH",
    "EC2_ESTUDIANTES", "EC2_MAESTROS", "EC2_MESSAGING",
    "EC2_NOTIFICACIONES", "EC2_REPORTES", "EC2_SOAP_BRIDGE",
    "EC2_MONITORING", "EC2_KAFKA"
)

if ($InstanceName -notin $validInstances) {
    Write-Color "❌ Instancia inválida: $InstanceName" $RED
    Write-Color "Instancias válidas: $($validInstances -join ', ')" $YELLOW
    exit 1
}

# Inicio
Write-Host ""
Write-Host "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${MAGENTA}║${RESET}  🚀 DEPLOY & VALIDATE - SUITE COMPLETA"
Write-Host "${MAGENTA}║${RESET}  Instancia: $InstanceName"
Write-Host "${MAGENTA}║${RESET}  Modo: $(if ($AutoContinue) { 'AUTO' } else { 'INTERACTIVO' })"
Write-Host "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""

# Registrar tiempo
$startTime = Get-Date
$phases = @()

# FASE 1: DEPLOY
if (-not $SkipDeploy) {
    Write-Section "FASE 1️⃣  - DEPLOYMENT COMPLETO"
    Write-Color "Desplegando $InstanceName con rebuild de imagen Docker..." $CYAN
    Write-Host ""
    
    $deployStart = Get-Date
    
    try {
        # Ejecutar deploy-complete.ps1
        $deployParams = @{
            InstanceName = $InstanceName
            Environment = "prod"
            SkipImageBuild = $false
        }
        
        & ".\deploy-complete.ps1" @deployParams
        
        $deployEnd = Get-Date
        $deployDuration = ($deployEnd - $deployStart).TotalSeconds
        
        Write-Color "✅ Deployment completado en $([Math]::Round($deployDuration, 2)) segundos" $GREEN
        $phases += @{
            name = "Deployment"
            status = "SUCCESS"
            duration = $deployDuration
        }
        
    } catch {
        Write-Color "❌ Error en deployment: $_" $RED
        $phases += @{
            name = "Deployment"
            status = "FAILED"
            error = $_
        }
        
        Write-Color "¿Continuar con debug? (S/N)" $YELLOW
        $response = Read-Host
        if ($response -ne "S" -and $response -ne "s") {
            exit 1
        }
    }
    
    Pause-Menu "Deploy completado. Esperando 10 segundos para que el servicio se inicialice..."
    Start-Sleep -Seconds 10
}

# FASE 2: MONITOREO
Write-Section "FASE 2️⃣  - MONITOREO Y PRUEBA DE ENDPOINTS"
Write-Color "Monitoreando $InstanceName..." $CYAN
Write-Host ""

$monitorStart = Get-Date

try {
    $monitorParams = @{
        InstanceName = $InstanceName
        TestEndpoints = $true
        CheckConnectivity = $true
        MaxLines = 30
    }
    
    & ".\post-deploy-monitor.ps1" @monitorParams
    
    $monitorEnd = Get-Date
    $monitorDuration = ($monitorEnd - $monitorStart).TotalSeconds
    
    Write-Color "✅ Monitoreo completado en $([Math]::Round($monitorDuration, 2)) segundos" $GREEN
    $phases += @{
        name = "Monitoring"
        status = "SUCCESS"
        duration = $monitorDuration
    }
    
} catch {
    Write-Color "❌ Error en monitoreo: $_" $RED
    $phases += @{
        name = "Monitoring"
        status = "FAILED"
        error = $_
    }
}

Pause-Menu "Monitoreo completado. Presiona Enter para continuar con debug..."

# FASE 3: DEBUG
if (-not $SkipDebug) {
    Write-Section "FASE 3️⃣  - DIAGNÓSTICO COMPLETO"
    Write-Color "Diagnosticando $InstanceName..." $CYAN
    Write-Host ""
    
    $debugStart = Get-Date
    
    try {
        & ".\debug-post-deployment.ps1" -InstanceName $InstanceName
        
        $debugEnd = Get-Date
        $debugDuration = ($debugEnd - $debugStart).TotalSeconds
        
        Write-Color "✅ Debug completado en $([Math]::Round($debugDuration, 2)) segundos" $GREEN
        $phases += @{
            name = "Debug"
            status = "SUCCESS"
            duration = $debugDuration
        }
        
    } catch {
        Write-Color "❌ Error en debug: $_" $RED
        $phases += @{
            name = "Debug"
            status = "FAILED"
            error = $_
        }
    }
}

# RESUMEN FINAL
Write-Section "📊 RESUMEN FINAL"

$endTime = Get-Date
$totalDuration = ($endTime - $startTime).TotalSeconds

Write-Color "Instancia: $InstanceName" $BLUE
Write-Color "Tiempo Total: $([Math]::Round($totalDuration, 2)) segundos" $BLUE
Write-Host ""

Write-Color "Fases Ejecutadas:" $CYAN
foreach ($phase in $phases) {
    $statusColor = if ($phase.status -eq "SUCCESS") { $GREEN } else { $RED }
    $duration = if ($phase.duration) { " ($([Math]::Round($phase.duration, 2))s)" } else { "" }
    Write-Color "  $($phase.name): $($phase.status)$duration" $statusColor
}

Write-Host ""

# Generar comando para siguientes instancias
Write-Color "Próximos Pasos:" $YELLOW
Write-Host ""

$allInstances = @(
    "EC2_DB", "EC2_API_GATEWAY", "EC2_AUTH",
    "EC2_ESTUDIANTES", "EC2_MAESTROS", "EC2_MESSAGING",
    "EC2_NOTIFICACIONES", "EC2_REPORTES", "EC2_SOAP_BRIDGE",
    "EC2_MONITORING", "EC2_KAFKA"
)

$remainingInstances = $allInstances | Where-Object { $_ -ne $InstanceName }

Write-Color "Para desplegar siguiente instancia:" $CYAN
Write-Host "  .\deploy-and-validate.ps1 -InstanceName '$($remainingInstances[0])' $(if ($AutoContinue) { '-AutoContinue' })"
Write-Host ""

Write-Color "Para desplegar todas las instancias:" $CYAN
Write-Host "  .\deploy-orchestrator.ps1"
Write-Host ""

Write-Color "Para verificar centralizacion:" $CYAN
Write-Host "  .\validate-centralization-deployment.ps1"
Write-Host ""

# Guardar reporte de ejecución
$reportPath = "deploy-validation-$InstanceName-$(Get-Date -Format 'yyyyMMdd-HHmmss').json"
@{
    InstanceName = $InstanceName
    StartTime = $startTime
    EndTime = $endTime
    TotalDurationSeconds = $totalDuration
    Phases = $phases
    Success = $phases | Where-Object { $_.status -ne "SUCCESS" } | Measure-Object | Select-Object -ExpandProperty Count -eq 0
} | ConvertTo-Json | Out-File -FilePath $reportPath

Write-Color "Reporte guardado: $reportPath" $CYAN

Write-Host ""
Write-Host "${MAGENTA}╔═══════════════════════════════════════════════════════════════════╗${RESET}"
Write-Host "${MAGENTA}║  ✅ SUITE DE DEPLOYMENT Y VALIDACIÓN COMPLETADA${RESET}"
Write-Host "${MAGENTA}╚═══════════════════════════════════════════════════════════════════╝${RESET}"
Write-Host ""
