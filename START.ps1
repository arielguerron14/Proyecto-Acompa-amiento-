#!/usr/bin/env pwsh

<#
.SYNOPSIS
    🚀 DEPLOY & VALIDATE SUITE - COMIENZA AQUÍ
    
.DESCRIPTION
    Este es tu punto de entrada. Ejecuta este archivo para:
    - Abrir menú interactivo
    - Desplegar una instancia
    - Ver documentación
    - Diagnosticar problemas
    
.EXAMPLE
    .\START.ps1
#>

# Limpiar pantalla
Clear-Host

# Colores
$CYAN = "`e[36m"
$GREEN = "`e[32m"
$YELLOW = "`e[33m"
$MAGENTA = "`e[35m"
$RESET = "`e[0m"

# Banner de bienvenida
Write-Host ""
Write-Host "$MAGENTA"
Write-Host "╔════════════════════════════════════════════════════════════════════╗"
Write-Host "║                                                                    ║"
Write-Host "║  🚀  DEPLOY & VALIDATE SUITE - BIENVENIDO                         ║"
Write-Host "║                                                                    ║"
Write-Host "║  Herramienta profesional para:                                    ║"
Write-Host "║  • Desplegar instancias EC2 con Docker                            ║"
Write-Host "║  • Monitorear en tiempo real                                      ║"
Write-Host "║  • Diagnosticar problemas automáticamente                         ║"
Write-Host "║                                                                    ║"
Write-Host "╚════════════════════════════════════════════════════════════════════╝"
Write-Host "$RESET"

# Verificar archivos
Write-Host ""
Write-Host "$YELLOW⏳ Verificando archivos necesarios...$RESET"
Write-Host ""

$requiredFiles = @(
    @{ name = "infrastructure.config.js"; type = "Configuración" },
    @{ name = "deploy-complete.ps1"; type = "Script" },
    @{ name = "post-deploy-monitor.ps1"; type = "Script" },
    @{ name = "debug-post-deployment.ps1"; type = "Script" },
    @{ name = "suite.ps1"; type = "Script" }
)

$allFound = $true
foreach ($file in $requiredFiles) {
    $exists = Test-Path $file.name
    $status = if ($exists) { "✅" } else { "❌" }
    Write-Host "  $status $($file.type): $($file.name)"
    if (-not $exists) { $allFound = $false }
}

if (-not $allFound) {
    Write-Host ""
    Write-Host "$RED❌ Error: Archivos faltantes. Ejecuta desde el directorio raíz del proyecto.$RESET"
    exit 1
}

Write-Host ""
Write-Host "$GREEN✅ Todos los archivos encontrados$RESET"
Write-Host ""

# Menú de opciones
Write-Host "$CYAN┌─ ¿QUÉ QUIERES HACER? ──────────────────────────────────────────┐$RESET"
Write-Host ""
Write-Host "  1️⃣  $GREEN DEPLOY UNA INSTANCIA$RESET"
Write-Host "     Selecciona instancia → Deploy automático → Validación completa"
Write-Host "     ⏱️  Tiempo: 8-20 minutos"
Write-Host ""
Write-Host "  2️⃣  $GREEN MONITOREAR INSTANCIA$RESET"
Write-Host "     Ver logs en tiempo real → Probar endpoints"
Write-Host "     ⏱️  Tiempo: 1-2 minutos"
Write-Host ""
Write-Host "  3️⃣  $GREEN DIAGNOSTICAR PROBLEMA$RESET"
Write-Host "     Análisis completo → Generar reporte → Recomendaciones"
Write-Host "     ⏱️  Tiempo: 2-3 minutos"
Write-Host ""
Write-Host "  4️⃣  $GREEN ABRIR MENÚ COMPLETO$RESET"
Write-Host "     Acceso a todas las opciones y configuraciones"
Write-Host ""
Write-Host "  5️⃣  $GREEN VER DOCUMENTACIÓN$RESET"
Write-Host "     Guías, ejemplos y referencia técnica"
Write-Host ""
Write-Host "  0️⃣  $YELLOW SALIR$RESET"
Write-Host ""
Write-Host "$CYAN└────────────────────────────────────────────────────────────────┘$RESET"
Write-Host ""

$choice = Read-Host "Selecciona (0-5)"

switch ($choice) {
    "1" {
        Write-Host ""
        Write-Host "$GREEN🚀 Abriendo Deploy...$RESET"
        Write-Host ""
        Start-Sleep -Seconds 1
        & ".\suite.ps1" -InstanceName ""
        # Suite.ps1 manejará la selección de instancia
    }
    "2" {
        Write-Host ""
        Write-Host "$GREEN📊 Abriendo Monitoreo...$RESET"
        Write-Host ""
        
        $instances = @("EC2_CORE", "EC2_DB", "EC2_API_GATEWAY", "EC2_AUTH", "EC2_ESTUDIANTES", "EC2_MAESTROS", "EC2_MESSAGING", "EC2_NOTIFICACIONES", "EC2_REPORTES", "EC2_SOAP_BRIDGE", "EC2_MONITORING", "EC2_KAFKA")
        
        Write-Host "Instancias disponibles:"
        for ($i = 0; $i -lt $instances.Count; $i++) {
            Write-Host "  $($i+1)) $($instances[$i])"
        }
        
        Write-Host ""
        $selection = Read-Host "¿Cuál instancia? (1-$($instances.Count))"
        
        if ([int]::TryParse($selection, [ref]$null)) {
            $index = [int]$selection - 1
            if ($index -ge 0 -and $index -lt $instances.Count) {
                $instance = $instances[$index]
                Write-Host ""
                Write-Host "$GREEN Monitoreando $instance...$RESET"
                Write-Host ""
                & ".\post-deploy-monitor.ps1" -InstanceName $instance -TestEndpoints -CheckConnectivity
            }
        }
    }
    "3" {
        Write-Host ""
        Write-Host "$GREEN🔧 Abriendo Diagnóstico...$RESET"
        Write-Host ""
        
        $instances = @("EC2_CORE", "EC2_DB", "EC2_API_GATEWAY", "EC2_AUTH", "EC2_ESTUDIANTES", "EC2_MAESTROS", "EC2_MESSAGING", "EC2_NOTIFICACIONES", "EC2_REPORTES", "EC2_SOAP_BRIDGE", "EC2_MONITORING", "EC2_KAFKA")
        
        Write-Host "Instancias disponibles:"
        for ($i = 0; $i -lt $instances.Count; $i++) {
            Write-Host "  $($i+1)) $($instances[$i])"
        }
        
        Write-Host ""
        $selection = Read-Host "¿Cuál instancia? (1-$($instances.Count))"
        
        if ([int]::TryParse($selection, [ref]$null)) {
            $index = [int]$selection - 1
            if ($index -ge 0 -and $index -lt $instances.Count) {
                $instance = $instances[$index]
                Write-Host ""
                Write-Host "$GREEN Diagnosticando $instance...$RESET"
                Write-Host ""
                & ".\debug-post-deployment.ps1" -InstanceName $instance
            }
        }
    }
    "4" {
        Write-Host ""
        Write-Host "$GREEN📋 Abriendo Menú Completo...$RESET"
        Write-Host ""
        Start-Sleep -Seconds 1
        & ".\suite.ps1"
    }
    "5" {
        Write-Host ""
        Write-Host "$YELLOW📖 Documentación disponible:$RESET"
        Write-Host ""
        Write-Host "  1) SUITE_README.md"
        Write-Host "     → Guía rápida (recomendado para principiantes)"
        Write-Host ""
        Write-Host "  2) DEPLOY_AND_VALIDATE_SUITE.md"
        Write-Host "     → Guía completa (500+ líneas, ejemplos detallados)"
        Write-Host ""
        Write-Host "  3) RESUMEN_SUITE_COMPLETA.md"
        Write-Host "     → Resumen ejecutivo"
        Write-Host ""
        Write-Host "  4) Volver"
        Write-Host ""
        
        $doc = Read-Host "¿Cuál leer? (1-4)"
        
        $files = @("SUITE_README.md", "DEPLOY_AND_VALIDATE_SUITE.md", "RESUMEN_SUITE_COMPLETA.md", "")
        
        if ([int]::TryParse($doc, [ref]$null)) {
            $docIndex = [int]$doc - 1
            if ($docIndex -ge 0 -and $docIndex -lt 3) {
                $file = $files[$docIndex]
                if (Test-Path $file) {
                    Get-Content $file | more
                }
            }
        }
    }
    "0" {
        Write-Host ""
        Write-Host "$CYAN👋 ¡Hasta luego!$RESET"
        Write-Host ""
    }
    default {
        Write-Host ""
        Write-Host "$YELLOW❌ Opción no válida$RESET"
        Write-Host ""
    }
}

Write-Host ""
Write-Host "$CYAN════════════════════════════════════════════════════════════════════$RESET"
Write-Host ""
