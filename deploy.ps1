#!/usr/bin/env pwsh

<#
.SYNOPSIS
Script para ejecutar el deploy maestro desde la línea de comandos.

.DESCRIPTION
Este script verifica requisitos y puede desplegar en AWS usando GitHub CLI.

.EXAMPLE
.\deploy.ps1 -Action "check"
.\deploy.ps1 -Action "deploy"
.\deploy.ps1 -Action "status"

.NOTES
Requisitos:
- GitHub CLI (gh) instalado
- Acceso a GitHub (gh auth login)
- AWS_EC2_DB_SSH_PRIVATE_KEY secret en GitHub
#>

param(
    [ValidateSet("check", "deploy", "status", "logs")]
    [string]$Action = "check"
)

$ErrorActionPreference = "Stop"

# Colors
$Green = "`e[32m"
$Red = "`e[31m"
$Yellow = "`e[33m"
$Cyan = "`e[36m"
$Reset = "`e[0m"

function Write-Success { Write-Host "$Green✅ $args $Reset" }
function Write-Error_ { Write-Host "$Red❌ $args $Reset" }
function Write-Warning_ { Write-Host "$Yellow⚠️  $args $Reset" }
function Write-Info { Write-Host "$Cyan ℹ️  $args $Reset" }

function Check-Requirements {
    Write-Info "Verificando requisitos..."
    
    # Check gh CLI
    try {
        $ghVersion = gh --version
        Write-Success "GitHub CLI instalado: $($ghVersion.Split(' ')[2])"
    }
    catch {
        Write-Error_ "GitHub CLI no instalado. Instala con: winget install github.cli"
        return $false
    }
    
    # Check authentication
    try {
        gh auth status --show-token | Out-Null
        Write-Success "GitHub CLI autenticado"
    }
    catch {
        Write-Error_ "No autenticado con GitHub. Ejecuta: gh auth login"
        return $false
    }
    
    # Check SSH key in GitHub
    Write-Info "Verificando AWS_EC2_DB_SSH_PRIVATE_KEY secret..."
    try {
        $secret = gh secret list --repo arielguerron14/Proyecto-Acompa-amiento- | grep AWS_EC2_DB_SSH_PRIVATE_KEY
        if ($secret) {
            Write-Success "Secret AWS_EC2_DB_SSH_PRIVATE_KEY encontrado"
        }
        else {
            Write-Error_ "Secret AWS_EC2_DB_SSH_PRIVATE_KEY NO encontrado en GitHub"
            Write-Warning_ "Ve a Settings → Secrets and variables → Actions"
            Write-Warning_ "Crea nuevo secret: AWS_EC2_DB_SSH_PRIVATE_KEY"
            return $false
        }
    }
    catch {
        Write-Error_ "No se pudo verificar secrets: $_"
        return $false
    }
    
    return $true
}

function Deploy-AllServices {
    Write-Info "Ejecutando Deploy All Services..."
    
    try {
        Write-Host ""
        Write-Host "╔════════════════════════════════════════════════════╗"
        Write-Host "║  🚀 Iniciando Full Stack Deployment                ║"
        Write-Host "╚════════════════════════════════════════════════════╝"
        Write-Host ""
        
        # Trigger workflow
        gh workflow run deploy-all-services.yml `
            --repo arielguerron14/Proyecto-Acompa-amiento- `
            -f skip_db=false `
            -f skip_messaging=false
        
        Write-Success "Workflow ejecutado exitosamente"
        Write-Info "Ve a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
        Write-Host ""
        Write-Warning_ "⏱️  Tiempo estimado: 45 minutos"
        Write-Host ""
        
    }
    catch {
        Write-Error_ "Error ejecutando workflow: $_"
        return $false
    }
    
    return $true
}

function Get-DeploymentStatus {
    Write-Info "Obteniendo estado del deployment..."
    
    try {
        $runs = gh run list `
            --repo arielguerron14/Proyecto-Acompa-amiento- `
            --workflow deploy-all-services.yml `
            --limit 1 `
            --json status,displayTitle,updatedAt,conclusion
        
        Write-Host ""
        Write-Host $runs | ConvertFrom-Json | Format-Table -AutoSize
        
    }
    catch {
        Write-Error_ "Error obteniendo estado: $_"
        return $false
    }
    
    return $true
}

function Get-WorkflowLogs {
    Write-Info "Abriendo logs en el navegador..."
    
    try {
        Start-Process "https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
        Write-Success "Abriendo GitHub Actions en navegador..."
        
    }
    catch {
        Write-Error_ "Error abriendo navegador: $_"
        Write-Info "Ve manualmente a: https://github.com/arielguerron14/Proyecto-Acompa-amiento-/actions"
        return $false
    }
    
    return $true
}

# Main
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗"
Write-Host "║                  🚀 DEPLOYMENT SCRIPT                      ║"
Write-Host "║         Proyecto Acompañamiento - AWS EC2 Deploy           ║"
Write-Host "╚════════════════════════════════════════════════════════════╝"
Write-Host ""

switch ($Action) {
    "check" {
        Write-Info "Ejecutando verificaciones..."
        Write-Host ""
        
        if (Check-Requirements) {
            Write-Host ""
            Write-Success "✅ Todos los requisitos están OK"
            Write-Info "Puedes ejecutar: .\deploy.ps1 -Action 'deploy'"
            Write-Host ""
        }
        else {
            Write-Host ""
            Write-Error_ "❌ No se pueden cumplir los requisitos"
            Write-Info "Soluciona los problemas anteriores e intenta de nuevo"
            Write-Host ""
            exit 1
        }
    }
    
    "deploy" {
        if (Check-Requirements) {
            Write-Host ""
            Write-Warning_ "⚠️  Iniciando deployment de TODOS los servicios (45 min aprox)"
            Write-Host ""
            
            $confirm = Read-Host "¿Continuar? (s/n)"
            if ($confirm -ne 's' -and $confirm -ne 'S') {
                Write-Info "Cancelado"
                exit 0
            }
            
            Write-Host ""
            if (Deploy-AllServices) {
                Write-Host ""
                Write-Success "✅ Deployment iniciado"
                Write-Info "Monitorea el progreso en GitHub Actions"
                Write-Host ""
            }
            else {
                exit 1
            }
        }
        else {
            exit 1
        }
    }
    
    "status" {
        Write-Host ""
        if (Get-DeploymentStatus) {
            Write-Host ""
            Write-Success "✅ Status obtenido"
        }
        else {
            exit 1
        }
    }
    
    "logs" {
        Write-Host ""
        if (Get-WorkflowLogs) {
            Write-Host ""
            Write-Success "✅ Abriendo logs"
        }
        else {
            exit 1
        }
    }
}

Write-Host ""
