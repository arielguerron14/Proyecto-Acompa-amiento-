#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Quick entry point para Deploy & Validate Suite

.DESCRIPTION
    Menú interactivo rápido para seleccionar qué hacer:
    1. Deploy nueva instancia
    2. Monitorear instancia
    3. Diagnosticar problema
    4. Ver documentación
    5. Deploy múltiples instancias

.EXAMPLE
    .\suite.ps1
#>

$ErrorActionPreference = "Stop"

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

function Show-Banner {
    Write-Host ""
    Write-Host "${MAGENTA}╔═════════════════════════════════════════════════════════════╗${RESET}"
    Write-Host "${MAGENTA}║${RESET}    🚀 DEPLOY & VALIDATE SUITE"
    Write-Host "${MAGENTA}║${RESET}"
    Write-Host "${MAGENTA}║${RESET}    Deploy, Monitor & Debug EC2 Instances"
    Write-Host "${MAGENTA}╚═════════════════════════════════════════════════════════════╝${RESET}"
    Write-Host ""
}

function Show-Menu {
    Write-Host ""
    Write-Color "┌─ SELECCIONA UNA OPCIÓN ─────────────────────────────────────┐" $BLUE
    Write-Host ""
    Write-Color "  1" $CYAN + " 🚀 DEPLOY NUEVA INSTANCIA"
    Write-Color "     Despliega instancia con rebuild Docker y validación completa" $YELLOW
    Write-Host ""
    Write-Color "  2" $CYAN + " 📊 MONITOREAR INSTANCIA"
    Write-Color "     Ver logs en tiempo real y probar endpoints" $YELLOW
    Write-Host ""
    Write-Color "  3" $CYAN + " 🔧 DIAGNOSTICAR PROBLEMA"
    Write-Color "     Ejecutar diagnóstico completo para troubleshooting" $YELLOW
    Write-Host ""
    Write-Color "  4" $CYAN + " 📖 VER DOCUMENTACIÓN"
    Write-Color "     Abrir guía completa y ejemplos" $YELLOW
    Write-Host ""
    Write-Color "  5" $CYAN + " 🔄 DEPLOY MÚLTIPLES INSTANCIAS"
    Write-Color "     Desplegar 2 o más instancias en secuencia" $YELLOW
    Write-Host ""
    Write-Color "  6" $CYAN + " ⚡ VALIDAR CENTRALIZACIÓN"
    Write-Color "     Verificar que todas las instancias están centralizadas" $YELLOW
    Write-Host ""
    Write-Color "  7" $CYAN + " 📋 LISTAR INSTANCIAS"
    Write-Color "     Ver todas las instancias disponibles" $YELLOW
    Write-Host ""
    Write-Color "  0" $CYAN + " ❌ SALIR"
    Write-Host ""
    Write-Color "└───────────────────────────────────────────────────────────────┘" $BLUE
    Write-Host ""
}

function Select-Instance {
    param([string]$Prompt = "Selecciona instancia")
    
    $instances = @(
        "EC2_CORE", "EC2_DB", "EC2_API_GATEWAY", "EC2_AUTH",
        "EC2_ESTUDIANTES", "EC2_MAESTROS", "EC2_MESSAGING",
        "EC2_NOTIFICACIONES", "EC2_REPORTES", "EC2_SOAP_BRIDGE",
        "EC2_MONITORING", "EC2_KAFKA"
    )
    
    Write-Host ""
    Write-Color $Prompt $CYAN
    Write-Host ""
    
    for ($i = 0; $i -lt $instances.Count; $i++) {
        Write-Host "  $($i+1)) $($instances[$i])"
    }
    
    Write-Host ""
    $selection = Read-Host "Opción (1-$($instances.Count))"
    
    if ([int]::TryParse($selection, [ref]$null)) {
        $index = [int]$selection - 1
        if ($index -ge 0 -and $index -lt $instances.Count) {
            return $instances[$index]
        }
    }
    
    Write-Color "Selección inválida" $RED
    return $null
}

function Show-Instances {
    Write-Host ""
    Write-Color "INSTANCIAS DISPONIBLES:" $BLUE
    Write-Host ""
    
    $instances = @(
        @{ name = "EC2_CORE"; desc = "Servidor central de la aplicación"; emoji = "🖥️" },
        @{ name = "EC2_DB"; desc = "Bases de datos (MongoDB, PostgreSQL, Redis)"; emoji = "💾" },
        @{ name = "EC2_API_GATEWAY"; desc = "API Gateway (enrutamiento)"; emoji = "🚪" },
        @{ name = "EC2_AUTH"; desc = "Servicio de autenticación"; emoji = "🔐" },
        @{ name = "EC2_ESTUDIANTES"; desc = "Microservicio de estudiantes"; emoji = "👨‍🎓" },
        @{ name = "EC2_MAESTROS"; desc = "Microservicio de maestros"; emoji = "👨‍🏫" },
        @{ name = "EC2_MESSAGING"; desc = "Sistema de mensajería (Kafka)"; emoji = "📧" },
        @{ name = "EC2_NOTIFICACIONES"; desc = "Sistema de notificaciones"; emoji = "🔔" },
        @{ name = "EC2_REPORTES"; desc = "Sistema de reportes"; emoji = "📊" },
        @{ name = "EC2_SOAP_BRIDGE"; desc = "Puente SOAP para integraciones"; emoji = "🌉" },
        @{ name = "EC2_MONITORING"; desc = "Sistema de monitoreo"; emoji = "📈" },
        @{ name = "EC2_KAFKA"; desc = "Broker Kafka (si está separado)"; emoji = "📨" }
    )
    
    foreach ($i in $instances) {
        Write-Host "  $($i.emoji) $($i.name)"
        Write-Host "     → $($i.desc)"
    }
    
    Write-Host ""
}

function Deploy-Instance {
    $instance = Select-Instance "¿Cuál instancia quieres desplegar?"
    
    if (-not $instance) {
        return
    }
    
    Write-Host ""
    Write-Color "Opciones de deploy:" $YELLOW
    Write-Host "  1) Normal (con rebuild Docker)"
    Write-Host "  2) Rápido (sin rebuild Docker)"
    Write-Host "  3) Cancelar"
    Write-Host ""
    
    $choice = Read-Host "Opción (1-3)"
    
    switch ($choice) {
        "1" {
            Write-Color "Iniciando deploy de $instance (modo normal)..." $GREEN
            & ".\deploy-and-validate.ps1" -InstanceName $instance
        }
        "2" {
            Write-Color "Iniciando deploy de $instance (modo rápido)..." $GREEN
            & ".\deploy-complete.ps1" -InstanceName $instance -SkipImageBuild $true
        }
        "3" {
            Write-Color "Cancelado" $YELLOW
        }
        default {
            Write-Color "Opción inválida" $RED
        }
    }
}

function Monitor-Instance {
    $instance = Select-Instance "¿Cuál instancia quieres monitorear?"
    
    if (-not $instance) {
        return
    }
    
    Write-Host ""
    Write-Color "Opciones de monitoreo:" $YELLOW
    Write-Host "  1) Ver logs en tiempo real"
    Write-Host "  2) Probar endpoints"
    Write-Host "  3) Verificar conectividad"
    Write-Host "  4) Todas las anteriores"
    Write-Host "  5) Cancelar"
    Write-Host ""
    
    $choice = Read-Host "Opción (1-5)"
    
    switch ($choice) {
        "1" {
            Write-Color "Monitoreo: Logs en tiempo real..." $GREEN
            & ".\post-deploy-monitor.ps1" -InstanceName $instance -FollowLogs
        }
        "2" {
            Write-Color "Monitoreo: Probando endpoints..." $GREEN
            & ".\post-deploy-monitor.ps1" -InstanceName $instance -TestEndpoints
        }
        "3" {
            Write-Color "Monitoreo: Verificando conectividad..." $GREEN
            & ".\post-deploy-monitor.ps1" -InstanceName $instance -CheckConnectivity
        }
        "4" {
            Write-Color "Monitoreo: Completo..." $GREEN
            & ".\post-deploy-monitor.ps1" -InstanceName $instance `
                -FollowLogs -TestEndpoints -CheckConnectivity
        }
        "5" {
            Write-Color "Cancelado" $YELLOW
        }
        default {
            Write-Color "Opción inválida" $RED
        }
    }
}

function Debug-Instance {
    $instance = Select-Instance "¿Cuál instancia quieres diagnosticar?"
    
    if (-not $instance) {
        return
    }
    
    Write-Color "Ejecutando diagnóstico de $instance..." $GREEN
    & ".\debug-post-deployment.ps1" -InstanceName $instance
}

function Show-Documentation {
    Write-Host ""
    Write-Color "DOCUMENTACIÓN DISPONIBLE:" $BLUE
    Write-Host ""
    Write-Host "  📖 DEPLOY_AND_VALIDATE_SUITE.md"
    Write-Host "     → Guía completa con ejemplos y casos de uso"
    Write-Host ""
    Write-Host "  📄 DEPLOY_VALIDATE_SUMMARY.md"
    Write-Host "     → Resumen de features y tiempos estimados"
    Write-Host ""
    Write-Host "  🚀 QUICK_START.md"
    Write-Host "     → Guía de inicio rápido general"
    Write-Host ""
    
    Write-Host ""
    Write-Color "¿Qué quieres ver?" $YELLOW
    Write-Host "  1) DEPLOY_AND_VALIDATE_SUITE.md"
    Write-Host "  2) DEPLOY_VALIDATE_SUMMARY.md"
    Write-Host "  3) QUICK_START.md"
    Write-Host "  4) Volver al menú"
    Write-Host ""
    
    $choice = Read-Host "Opción (1-4)"
    
    switch ($choice) {
        "1" { Get-Content "DEPLOY_AND_VALIDATE_SUITE.md" | more }
        "2" { Get-Content "DEPLOY_VALIDATE_SUMMARY.md" | more }
        "3" { Get-Content "QUICK_START.md" | more }
        "4" { }
        default { Write-Color "Opción inválida" $RED }
    }
}

function Deploy-Multiple {
    Write-Host ""
    Write-Color "DEPLOY DE MÚLTIPLES INSTANCIAS" $CYAN
    Write-Host ""
    Write-Color "Opciones:" $YELLOW
    Write-Host "  1) Desplegar todas (12 instancias)"
    Write-Host "  2) Seleccionar específicas"
    Write-Host "  3) Criticales primero (Core, DB, API Gateway)"
    Write-Host "  4) Cancelar"
    Write-Host ""
    
    $choice = Read-Host "Opción (1-4)"
    
    switch ($choice) {
        "1" {
            Write-Color "Desplegando todas las instancias..." $GREEN
            & ".\deploy-orchestrator.ps1"
        }
        "2" {
            Write-Host ""
            Write-Color "Selecciona instancias (separadas por comas):" $YELLOW
            Write-Color "Ejemplo: EC2_CORE,EC2_DB,EC2_API_GATEWAY" $YELLOW
            $selection = Read-Host
            
            $selected = $selection -split "," | ForEach-Object { $_.Trim() }
            
            foreach ($instance in $selected) {
                Write-Color "Desplegando $instance..." $GREEN
                & ".\deploy-and-validate.ps1" -InstanceName $instance -AutoContinue
                Start-Sleep -Seconds 30
            }
        }
        "3" {
            Write-Color "Desplegando instancias críticas primero..." $GREEN
            $critical = @("EC2_CORE", "EC2_DB", "EC2_API_GATEWAY")
            foreach ($instance in $critical) {
                & ".\deploy-and-validate.ps1" -InstanceName $instance -AutoContinue
                Start-Sleep -Seconds 30
            }
        }
        "4" {
            Write-Color "Cancelado" $YELLOW
        }
        default {
            Write-Color "Opción inválida" $RED
        }
    }
}

function Validate-Centralization {
    Write-Color "Validando centralización de todas las instancias..." $GREEN
    & ".\validate-centralization-deployment.ps1"
}

# MAIN LOOP
while ($true) {
    Show-Banner
    Show-Menu
    
    $choice = Read-Host "Opción"
    
    switch ($choice) {
        "1" { Deploy-Instance }
        "2" { Monitor-Instance }
        "3" { Debug-Instance }
        "4" { Show-Documentation }
        "5" { Deploy-Multiple }
        "6" { Validate-Centralization }
        "7" { Show-Instances }
        "0" {
            Write-Color "👋 ¡Hasta luego!" $CYAN
            exit 0
        }
        default {
            Write-Color "❌ Opción no válida. Intenta de nuevo." $RED
            Start-Sleep -Seconds 2
        }
    }
    
    Write-Host ""
    Write-Color "Presiona Enter para volver al menú..." $YELLOW
    Read-Host "" > $null
    Clear-Host
}
