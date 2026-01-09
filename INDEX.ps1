#!/usr/bin/env pwsh

<#
.SYNOPSIS
    INDEX.ps1 - Punto de entrada central para Deploy & Validate Suite
    
.DESCRIPTION
    Carga información de todos los scripts disponibles y proporciona
    acceso rápido a cualquier funcionalidad.
    
    Este es el archivo principal a ejecutar para acceder a la suite.

.EXAMPLE
    .\INDEX.ps1
#>

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════════╗"
Write-Host "║  🚀 DEPLOY & VALIDATE SUITE - INDEX CENTRAL                   ║"
Write-Host "╚════════════════════════════════════════════════════════════════╝"
Write-Host ""

# Verificar que estamos en el directorio correcto
$requiredFiles = @(
    "infrastructure.config.js",
    "deploy-complete.ps1",
    "post-deploy-monitor.ps1",
    "debug-post-deployment.ps1",
    "deploy-and-validate.ps1",
    "suite.ps1"
)

$missing = $requiredFiles | Where-Object { -not (Test-Path $_) }

if ($missing) {
    Write-Host "`e[31m❌ Archivos faltantes:`e[0m"
    $missing | ForEach-Object { Write-Host "   - $_" }
    Write-Host ""
    Write-Host "❌ Este script debe ejecutarse desde el directorio raíz del proyecto"
    exit 1
}

Write-Host "`e[32m✅ Todos los archivos necesarios encontrados`e[0m"
Write-Host ""

# Opciones
Write-Host "┌─ SELECCIONA CÓMO ACCEDER ──────────────────────────────────────┐"
Write-Host ""
Write-Host "  A) 🎯 MENÚ INTERACTIVO (Recomendado)"
Write-Host "     Interfaz completa con todas las opciones"
Write-Host ""
Write-Host "  B) 📚 VER DOCUMENTACIÓN"
Write-Host "     Guías y referencias"
Write-Host ""
Write-Host "  C) 🚀 DEPLOY RÁPIDO"
Write-Host "     Deploy directo sin menú"
Write-Host ""
Write-Host "  D) 📖 VER RESUMEN"
Write-Host "     Leer resumen de la suite"
Write-Host ""
Write-Host "└────────────────────────────────────────────────────────────────┘"
Write-Host ""

$choice = Read-Host "Opción (A/B/C/D)"

switch ($choice.ToUpper()) {
    "A" {
        Write-Host ""
        Write-Host "`e[36mAbriendo menú interactivo...`e[0m"
        Write-Host ""
        & ".\suite.ps1"
    }
    "B" {
        Write-Host ""
        Write-Host "`e[36mDocumentación disponible:`e[0m"
        Write-Host ""
        Write-Host "  1) DEPLOY_AND_VALIDATE_SUITE.md"
        Write-Host "     → Guía completa (500+ líneas)"
        Write-Host ""
        Write-Host "  2) DEPLOY_VALIDATE_SUMMARY.md"
        Write-Host "     → Resumen ejecutivo"
        Write-Host ""
        Write-Host "  3) QUICK_START.md"
        Write-Host "     → Inicio rápido"
        Write-Host ""
        Write-Host "  4) README.md"
        Write-Host "     → Documentación del proyecto"
        Write-Host ""
        
        $doc = Read-Host "Selecciona (1-4)"
        
        $files = @("DEPLOY_AND_VALIDATE_SUITE.md", "DEPLOY_VALIDATE_SUMMARY.md", "QUICK_START.md", "README.md")
        
        if ($doc -ge 1 -and $doc -le 4) {
            $file = $files[$doc - 1]
            if (Test-Path $file) {
                Write-Host ""
                & notepad $file
            } else {
                Write-Host "`e[31m❌ Archivo no encontrado: $file`e[0m"
            }
        } else {
            Write-Host "`e[31m❌ Opción inválida`e[0m"
        }
    }
    "C" {
        Write-Host ""
        Write-Host "`e[36mDeploy Rápido:`e[0m"
        Write-Host ""
        
        $instances = @("EC2_CORE", "EC2_DB", "EC2_API_GATEWAY", "EC2_AUTH", "EC2_ESTUDIANTES", "EC2_MAESTROS", "EC2_MESSAGING", "EC2_NOTIFICACIONES", "EC2_REPORTES", "EC2_SOAP_BRIDGE", "EC2_MONITORING", "EC2_KAFKA")
        
        Write-Host "Instancias disponibles:"
        Write-Host ""
        
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
                Write-Host "`e[32mIniciando deploy de $instance...`e[0m"
                Write-Host ""
                & ".\deploy-and-validate.ps1" -InstanceName $instance -AutoContinue
            } else {
                Write-Host "`e[31m❌ Selección inválida`e[0m"
            }
        } else {
            Write-Host "`e[31m❌ Input inválido`e[0m"
        }
    }
    "D" {
        Write-Host ""
        if (Test-Path "DEPLOY_VALIDATE_SUMMARY.md") {
            Get-Content "DEPLOY_VALIDATE_SUMMARY.md" | more
        } else {
            Write-Host "`e[31m❌ Archivo no encontrado: DEPLOY_VALIDATE_SUMMARY.md`e[0m"
        }
    }
    default {
        Write-Host ""
        Write-Host "`e[31m❌ Opción no válida`e[0m"
    }
}

Write-Host ""
Write-Host "`e[36m✅ Gracias por usar Deploy & Validate Suite`e[0m"
Write-Host ""
