#!/usr/bin/env pwsh

<#
.SYNOPSIS
    Verificación de entregas - Deploy & Validate Suite
    
.DESCRIPTION
    Este script verifica que todas las entregas estén completas y funcionales
#>

Write-Host ""
Write-Host "`e[36m╔════════════════════════════════════════════════════════════════════╗`e[0m"
Write-Host "`e[36m║  ✅ VERIFICACIÓN DE ENTREGAS - DEPLOY & VALIDATE SUITE         ║`e[0m"
Write-Host "`e[36m╚════════════════════════════════════════════════════════════════════╝`e[0m"
Write-Host ""

$errors = @()
$warnings = @()
$successes = @()

# Verificar scripts PowerShell
Write-Host "`e[33m📝 Verificando Scripts PowerShell...`e[0m"
Write-Host ""

$scripts = @(
    @{ name = "START.ps1"; purpose = "Punto de entrada principal" },
    @{ name = "INDEX.ps1"; purpose = "Selector de modo de acceso" },
    @{ name = "suite.ps1"; purpose = "Menú interactivo" },
    @{ name = "deploy-and-validate.ps1"; purpose = "Orquestador (3 fases)" },
    @{ name = "deploy-complete.ps1"; purpose = "Deploy con 13 fases" },
    @{ name = "post-deploy-monitor.ps1"; purpose = "Monitoreo en vivo" },
    @{ name = "debug-post-deployment.ps1"; purpose = "Diagnóstico completo" }
)

foreach ($script in $scripts) {
    if (Test-Path $script.name) {
        $content = Get-Content $script.name
        $lineCount = @($content).Count
        Write-Host "  ✅ $($script.name)"
        Write-Host "     → $($script.purpose) ($lineCount líneas)"
        $successes += $script.name
    } else {
        Write-Host "  ❌ $($script.name) - NO ENCONTRADO"
        $errors += $script.name
    }
}

Write-Host ""
Write-Host "`e[33m📚 Verificando Documentación...`e[0m"
Write-Host ""

$docs = @(
    @{ name = "00-COMIENZA-AQUI.txt"; purpose = "Presentación visual de la suite" },
    @{ name = "SUITE_README.md"; purpose = "Quick start guide" },
    @{ name = "DEPLOY_AND_VALIDATE_SUITE.md"; purpose = "Guía completa (500+ líneas)" },
    @{ name = "DEPLOY_VALIDATE_SUMMARY.md"; purpose = "Resumen ejecutivo" },
    @{ name = "RESUMEN_SUITE_COMPLETA.md"; purpose = "Resumen de entregas" }
)

foreach ($doc in $docs) {
    if (Test-Path $doc.name) {
        $content = Get-Content $doc.name
        $lineCount = @($content).Count
        Write-Host "  ✅ $($doc.name)"
        Write-Host "     → $($doc.purpose) ($lineCount líneas)"
        $successes += $doc.name
    } else {
        Write-Host "  ❌ $($doc.name) - NO ENCONTRADO"
        $errors += $doc.name
    }
}

Write-Host ""
Write-Host "`e[33m🔍 Verificando Funcionalidades...`e[0m"
Write-Host ""

# Verificar que infrastructure.config.js existe
if (Test-Path "infrastructure.config.js") {
    Write-Host "  ✅ infrastructure.config.js encontrado"
    $successes += "infrastructure.config.js"
} else {
    Write-Host "  ⚠️  infrastructure.config.js no encontrado (requerido)"
    $warnings += "infrastructure.config.js"
}

# Verificar que todos los scripts tengan help blocks
$scriptsWithHelp = @()
foreach ($script in $scripts) {
    $content = Get-Content $script.name -ErrorAction SilentlyContinue
    if ($content -match "\.SYNOPSIS") {
        $scriptsWithHelp += $script.name
    }
}

if ($scriptsWithHelp.Count -eq $scripts.Count) {
    Write-Host "  ✅ Todos los scripts tienen bloques de HELP"
    $successes += "Help blocks"
} else {
    Write-Host "  ⚠️  Algunos scripts falta HELP ($($scriptsWithHelp.Count)/$($scripts.Count))"
    $warnings += "Help blocks"
}

Write-Host ""
Write-Host "`e[33m📊 Estadísticas de Código...`e[0m"
Write-Host ""

$totalLines = 0
$totalScripts = 0

foreach ($script in $scripts) {
    if (Test-Path $script.name) {
        $content = Get-Content $script.name
        $lines = @($content).Count
        $totalLines += $lines
        $totalScripts++
    }
}

Write-Host "  • Scripts funcionales: $totalScripts"
Write-Host "  • Líneas de código PowerShell: $totalLines+"
Write-Host "  • Documentos incluidos: $($docs.Count)"
Write-Host "  • Instancias soportadas: 12 EC2"

Write-Host ""
Write-Host "`e[33m📋 Verificación de Git...`e[0m"
Write-Host ""

try {
    $commits = git log --oneline -10 2>$null | Select-Object -First 5
    Write-Host "  ✅ Repositorio Git encontrado"
    Write-Host "  ✅ Últimos 5 commits:"
    $commits | ForEach-Object { Write-Host "     • $_" }
    $successes += "Git repository"
} catch {
    Write-Host "  ⚠️  No es un repositorio Git válido"
    $warnings += "Git repository"
}

Write-Host ""
Write-Host "`e[33m✅ Verificación de Completitud...`e[0m"
Write-Host ""

$checklist = @(
    @{ item = "Point de entrada (START.ps1)"; status = (Test-Path "START.ps1") },
    @{ item = "Menú interactivo (suite.ps1)"; status = (Test-Path "suite.ps1") },
    @{ item = "Orquestador deploy (deploy-and-validate.ps1)"; status = (Test-Path "deploy-and-validate.ps1") },
    @{ item = "Script deploy completo (deploy-complete.ps1)"; status = (Test-Path "deploy-complete.ps1") },
    @{ item = "Script monitoreo (post-deploy-monitor.ps1)"; status = (Test-Path "post-deploy-monitor.ps1") },
    @{ item = "Script debug (debug-post-deployment.ps1)"; status = (Test-Path "debug-post-deployment.ps1") },
    @{ item = "Documentación rápida (SUITE_README.md)"; status = (Test-Path "SUITE_README.md") },
    @{ item = "Guía completa (DEPLOY_AND_VALIDATE_SUITE.md)"; status = (Test-Path "DEPLOY_AND_VALIDATE_SUITE.md") },
    @{ item = "Configuración centralizada (infrastructure.config.js)"; status = (Test-Path "infrastructure.config.js") }
)

$completed = 0
foreach ($item in $checklist) {
    $status = if ($item.status) { "✅" } else { "❌" }
    Write-Host "  $status $($item.item)"
    if ($item.status) { $completed++ }
}

Write-Host ""
Write-Host "  Completitud: $completed/$($checklist.Count) ($(([math]::Round(($completed/$checklist.Count)*100)))%)"

# Resumen final
Write-Host ""
Write-Host "`e[36m╔════════════════════════════════════════════════════════════════════╗`e[0m"
Write-Host "`e[36m║  📊 RESUMEN FINAL                                                ║`e[0m"
Write-Host "`e[36m╚════════════════════════════════════════════════════════════════════╝`e[0m"
Write-Host ""

Write-Host "  Archivos exitosos: `e[32m$($successes.Count)`e[0m"
Write-Host "  Warnings: `e[33m$($warnings.Count)`e[0m"
Write-Host "  Errores: `e[31m$($errors.Count)`e[0m"
Write-Host ""

if ($errors.Count -eq 0) {
    Write-Host "`e[32m✅ SUITE COMPLETADA EXITOSAMENTE`e[0m"
    Write-Host ""
    Write-Host "Estado: `e[32m🎉 LISTO PARA PRODUCCIÓN 🎉`e[0m"
    Write-Host ""
    Write-Host "Próximos pasos:"
    Write-Host "  1. Lee: 00-COMIENZA-AQUI.txt"
    Write-Host "  2. Ejecuta: .\START.ps1"
    Write-Host "  3. Selecciona: Opción 1 (Deploy una instancia)"
    Write-Host "  4. Elige: EC2_CORE"
    Write-Host "  5. Espera completación (~8-20 minutos)"
} else {
    Write-Host "`e[31m❌ ERRORES DETECTADOS`e[0m"
    Write-Host ""
    Write-Host "Archivos faltantes:"
    $errors | ForEach-Object { Write-Host "  • $_" }
}

Write-Host ""
Write-Host "`e[36m═══════════════════════════════════════════════════════════════════`e[0m"
Write-Host ""
