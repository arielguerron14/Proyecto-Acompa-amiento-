#!/usr/bin/env pwsh

<#
.SYNOPSIS
Script de deploy idempotente que verifica instancias antes de crear

.DESCRIPTION
- Verifica si instancias ya existen en AWS
- Solo crea las que faltan
- Registra todas en el ALB

.EXAMPLE
.\deploy-idempotent.ps1 -Action "plan" -Profile "default"
.\deploy-idempotent.ps1 -Action "apply" -Profile "default"
.\deploy-idempotent.ps1 -Action "status" -Profile "default"

#>

param(
    [ValidateSet("plan", "apply", "status", "destroy")]
    [string]$Action = "plan",
    
    [string]$Profile = "default",
    
    [string]$Region = "us-east-1",
    
    [switch]$Verbose
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
function Write-Debug_ { if ($Verbose) { Write-Host "$($colors.Debug)🔍 DEBUG: $args$($colors.Reset)" } }

function Test-AWSCredentials {
    Write-Info "Verificando credenciales AWS..."
    
    try {
        $identity = aws sts get-caller-identity --region $Region --profile $Profile 2>$null | ConvertFrom-Json
        Write-Success "Autenticado como: $($identity.Arn)"
        return $true
    }
    catch {
        Write-Error_ "No se pueden obtener credenciales AWS"
        Write-Info "Configura credenciales con: aws configure --profile $Profile"
        return $false
    }
}

function Get-ExistingInstances {
    Write-Info "Buscando instancias existentes..."
    
    try {
        $instances = aws ec2 describe-instances `
            --region $Region `
            --profile $Profile `
            --filters "Name=instance-state-name,Values=running,pending,stopped" `
                      "Name=tag:Project,Values=proyecto-acompanamiento" `
            --query "Reservations[*].Instances[*].[InstanceId,Tags[?Key=='Name'].Value|[0],State.Name,PrivateIpAddress]" `
            --output json | ConvertFrom-Json
        
        $instanceList = @()
        foreach ($reservation in $instances) {
            foreach ($instance in $reservation) {
                if ($instance -and $instance.Count -ge 4) {
                    $instanceList += @{
                        Id = $instance[0]
                        Name = $instance[1]
                        State = $instance[2]
                        IP = $instance[3]
                    }
                }
            }
        }
        
        Write-Success "Encontradas $($instanceList.Count) instancias existentes"
        return $instanceList
    }
    catch {
        Write-Debug_ "Error obteniendo instancias: $_"
        return @()
    }
}

function Get-TargetGroupHealth {
    Write-Info "Verificando salud del Target Group..."
    
    try {
        $health = aws elbv2 describe-target-health `
            --target-group-arn "arn:aws:elasticloadbalancing:us-east-1:497189141139:targetgroup/tg-acompanamiento/7af5bd278b554659" `
            --region $Region `
            --profile $Profile `
            --output json | ConvertFrom-Json
        
        $healthy = ($health.TargetHealthDescriptions | Where-Object { $_.TargetHealth.State -eq "healthy" } | Measure-Object).Count
        $total = ($health.TargetHealthDescriptions | Measure-Object).Count
        
        Write-Info "Target Group Health: $healthy/$total saludables"
        return @{ Healthy = $healthy; Total = $total }
    }
    catch {
        Write-Warning_ "No se pudo obtener salud del Target Group"
        return @{ Healthy = 0; Total = 0 }
    }
}

function Show-Status {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║           STATUS DEL DEPLOYMENT                            ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    
    $instances = Get-ExistingInstances
    $health = Get-TargetGroupHealth
    
    Write-Host ""
    Write-Host "Instancias EC2:" -ForegroundColor Cyan
    if ($instances.Count -eq 0) {
        Write-Warning_ "No hay instancias creadas"
    }
    else {
        foreach ($inst in $instances) {
            $stateColor = if ($inst.State -eq "running") { "Green" } else { "Yellow" }
            Write-Host "  • $($inst.Name): $($inst.Id) [$($inst.State)] IP: $($inst.IP)" -ForegroundColor $stateColor
        }
    }
    
    Write-Host ""
    Write-Host "Load Balancer:" -ForegroundColor Cyan
    $alb = aws elbv2 describe-load-balancers `
        --region $Region `
        --profile $Profile `
        --query "LoadBalancers[?contains(LoadBalancerArn, 'proyecto-acompanamiento')].[LoadBalancerName,State.Code,DNSName]" `
        --output json | ConvertFrom-Json
    
    if ($alb) {
        Write-Host "  • Nombre: $($alb[0].LoadBalancerName)" -ForegroundColor Green
        Write-Host "  • Estado: $($alb[0].State.Code)" -ForegroundColor Green
        Write-Host "  • DNS: $($alb[0].DNSName)" -ForegroundColor Green
        Write-Host "  • URL: http://$($alb[0].DNSName)" -ForegroundColor Cyan
    }
    else {
        Write-Warning_ "No se encontró ALB"
    }
    
    Write-Host ""
    Write-Host "Target Group Health: $($health.Healthy)/$($health.Total) saludables" `
        -ForegroundColor $(if ($health.Healthy -eq $health.Total) { "Green" } else { "Yellow" })
    
    Write-Host ""
}

function Execute-TerraformPlan {
    Write-Info "Ejecutando terraform plan..."
    
    Push-Location terraform
    
    try {
        # Init
        Write-Debug_ "Inicializando Terraform..."
        terraform init -upgrade 2>&1 | ForEach-Object { Write-Debug_ $_ }
        
        # Plan
        Write-Info "Generando plan..."
        terraform plan -lock=false -out=tfplan 2>&1 | Tee-Object -Variable planOutput | ForEach-Object { Write-Debug_ $_ }
        
        # Analyze changes
        $show = terraform show tfplan -json | ConvertFrom-Json
        $resourceChanges = $show.resource_changes | Where-Object { $_.change.actions -and $_.change.actions -ne @() }
        
        Write-Host ""
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        Write-Host "CAMBIOS DETECTADOS:" -ForegroundColor Cyan
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        
        if ($resourceChanges.Count -eq 0) {
            Write-Success "No hay cambios. Todo está actualizado."
        }
        else {
            Write-Warning_ "Se detectaron $($resourceChanges.Count) cambios:"
            foreach ($change in $resourceChanges) {
                $actions = $change.change.actions -join ", "
                Write-Host "  • $($change.address): $actions" -ForegroundColor Yellow
            }
        }
        Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
        
        return $show
    }
    finally {
        Pop-Location
    }
}

function Execute-TerraformApply {
    Write-Warning_ "Ejecutando terraform apply..."
    
    Push-Location terraform
    
    try {
        # Apply
        Write-Info "Aplicando cambios..."
        terraform apply -auto-approve -lock=false tfplan 2>&1 | Tee-Object -Variable applyOutput
        
        Write-Success "Terraform apply completado"
        
        # Get outputs
        Write-Info "Obteniendo outputs..."
        $outputs = terraform output -json | ConvertFrom-Json
        
        Write-Host ""
        Write-Host "Salidas de Terraform:" -ForegroundColor Cyan
        $outputs.PSObject.Properties | ForEach-Object {
            Write-Host "  • $($_.Name): $($_.Value.value)" -ForegroundColor Green
        }
        
        return $outputs
    }
    finally {
        Pop-Location
    }
}

# Main execution
function Main {
    Write-Host ""
    Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     DEPLOY IDEMPOTENTE - Proyecto Acompañamiento           ║" -ForegroundColor Cyan
    Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "Configuración:"
    Write-Info "  Acción: $Action"
    Write-Info "  Perfil AWS: $Profile"
    Write-Info "  Región: $Region"
    Write-Host ""
    
    # Verify credentials
    if (-not (Test-AWSCredentials)) {
        throw "Credenciales AWS inválidas"
    }
    
    switch ($Action) {
        "status" {
            Show-Status
        }
        
        "plan" {
            Execute-TerraformPlan
            Write-Success "Plan completado. Revisa los cambios arriba."
        }
        
        "apply" {
            Write-Host ""
            Write-Host "ADVERTENCIA: Esto creará/modificará recursos en AWS" -ForegroundColor Red
            Write-Host "Continuar? (s/n): " -ForegroundColor Yellow -NoNewline
            $confirm = Read-Host
            
            if ($confirm -ne "s") {
                Write-Info "Aplicación cancelada"
                return
            }
            
            Execute-TerraformPlan
            Execute-TerraformApply
            
            Write-Host ""
            Write-Success "Deploy completado. Esperando estabilización..."
            Start-Sleep -Seconds 10
            
            Show-Status
        }
        
        "destroy" {
            Write-Host ""
            Write-Host "ADVERTENCIA: Esto ELIMINARÁ TODOS LOS RECURSOS" -ForegroundColor Red
            Write-Host "Tipo 'confirmar' para continuar: " -ForegroundColor Yellow -NoNewline
            $confirm = Read-Host
            
            if ($confirm -ne "confirmar") {
                Write-Info "Destrucción cancelada"
                return
            }
            
            Push-Location terraform
            terraform destroy -auto-approve -lock=false
            Pop-Location
            
            Write-Success "Destrucción completada"
        }
    }
}

Main
