#!/usr/bin/env pwsh

<#
.SYNOPSIS
Script para validar que el despliegue es idempotente

.DESCRIPTION
Ejecuta el despliegue dos veces y verifica que la segunda vez no hace cambios

.EXAMPLE
.\validate-idempotence.ps1 -Profile "default" -Region "us-east-1"

#>

param(
    [string]$Profile = "default",
    [string]$Region = "us-east-1"
)

$ErrorActionPreference = "Stop"

# Colors
$colors = @{
    Success = "`e[32m"
    Error = "`e[31m"
    Warning = "`e[33m"
    Info = "`e[36m"
    Debug = "`e[90m"
    Reset = "`e[0m"
}

function Write-Success { Write-Host "$($colors.Success)✅ $args$($colors.Reset)" }
function Write-Error_ { Write-Host "$($colors.Error)❌ ERROR: $args$($colors.Reset)" }
function Write-Warning_ { Write-Host "$($colors.Warning)⚠️  WARNING: $args$($colors.Reset)" }
function Write-Info { Write-Host "$($colors.Info)ℹ️  INFO: $args$($colors.Reset)" }

Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║         VALIDACIÓN DE IDEMPOTENCIA                        ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

Write-Info "Perfil AWS: $Profile"
Write-Info "Región: $Region"
Write-Host ""

# Function para obtener el plan
function Get-TerraformPlan {
    param([int]$RunNumber)
    
    Write-Info "RUN #$RunNumber - Generando plan..."
    Push-Location terraform
    
    try {
        # Clean old plan
        Remove-Item -Path tfplan -Force -ErrorAction SilentlyContinue
        
        # Init
        terraform init -upgrade -no-color 2>&1 | Out-Null
        
        # Plan
        terraform plan -lock=false -out=tfplan -no-color 2>&1 | Out-Null
        
        # Get JSON representation
        $planJson = terraform show tfplan -json 2>&1 | ConvertFrom-Json
        
        # Analyze changes
        $changes = $planJson.resource_changes | Where-Object { $_.change.actions -and $_.change.actions -ne @() }
        
        return @{
            Total = $planJson.resource_changes.Count
            Changes = $changes
            ChangeCount = $changes.Count
        }
    }
    finally {
        Pop-Location
    }
}

# RUN 1
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "PRIMER DESPLIEGUE (creación de infraestructura)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$plan1 = Get-TerraformPlan -RunNumber 1

Write-Host ""
Write-Host "Resultados de Terraform Plan #1:" -ForegroundColor Yellow
Write-Host "  • Total de recursos: $($plan1.Total)"
Write-Host "  • Cambios detectados: $($plan1.ChangeCount)"

if ($plan1.ChangeCount -gt 0) {
    Write-Warning_ "Se crearán recursos:"
    foreach ($change in $plan1.Changes) {
        $actions = $change.change.actions -join ", "
        Write-Host "    • $($change.address): $actions" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "Aplicando cambios..." -ForegroundColor Yellow

Push-Location terraform
try {
    terraform apply -auto-approve -lock=false tfplan -no-color 2>&1 | Out-Null
    Write-Success "Apply #1 completado"
}
finally {
    Pop-Location
}

Write-Info "Esperando estabilización (10 segundos)..."
Start-Sleep -Seconds 10

# RUN 2
Write-Host ""
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "SEGUNDO DESPLIEGUE (validación de idempotencia)" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$plan2 = Get-TerraformPlan -RunNumber 2

Write-Host ""
Write-Host "Resultados de Terraform Plan #2:" -ForegroundColor Yellow
Write-Host "  • Total de recursos: $($plan2.Total)"
Write-Host "  • Cambios detectados: $($plan2.ChangeCount)"

if ($plan2.ChangeCount -gt 0) {
    Write-Error_ "⚠️  IDEMPOTENCIA FALLIDA - Se detectaron cambios:"
    foreach ($change in $plan2.Changes) {
        $actions = $change.change.actions -join ", "
        Write-Host "    • $($change.address): $actions" -ForegroundColor Red
    }
}
else {
    Write-Success "IDEMPOTENCIA EXITOSA - No hay cambios"
}

# SUMMARY
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                  RESUMEN DE VALIDACIÓN                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

$isIdempotent = $plan2.ChangeCount -eq 0

Write-Host "Despliegue 1 (Creación):" -ForegroundColor Cyan
Write-Host "  • Cambios: $($plan1.ChangeCount)" -ForegroundColor Green

Write-Host ""
Write-Host "Despliegue 2 (Validación):" -ForegroundColor Cyan
Write-Host "  • Cambios: $($plan2.ChangeCount)" -ForegroundColor $(if ($isIdempotent) { "Green" } else { "Red" })

Write-Host ""
if ($isIdempotent) {
    Write-Success "✅ SISTEMA IDEMPOTENTE VALIDADO"
    Write-Host "   El despliegue puede ejecutarse múltiples veces sin crear recursos duplicados"
}
else {
    Write-Error_ "❌ SISTEMA NO IDEMPOTENTE"
    Write-Host "   El despliegue crea cambios en la segunda ejecución"
    Write-Host "   Esto indica un problema en la lógica de Terraform"
}

Write-Host ""

# Cleanup suggestion
Write-Host "Próximos pasos:" -ForegroundColor Cyan
Write-Host "  1. Los cambios ya fueron aplicados en el servidor AWS"
Write-Host "  2. Verifica el estado en AWS Console"
Write-Host "  3. Para destruir todo: .\deploy-idempotent.ps1 -Action destroy" -ForegroundColor Yellow

Write-Host ""
