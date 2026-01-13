#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Deploy Terraform infrastructure for Proyecto Acompañamiento
.DESCRIPTION
    Executes terraform init, plan, and apply to create:
    - 8 EC2 instances (t3.medium)
    - Application Load Balancer
    - Target Group with auto-registration
.EXAMPLE
    .\deploy-infrastructure.ps1
#>

param(
    [ValidateSet('plan', 'apply', 'destroy')]
    [string]$Action = 'apply',
    
    [switch]$AutoApprove = $true
)

# Configuration
$TerraformDir = "C:\Users\ariel\Escritorio\distri\Proyecto-Acompa-amiento-\terraform"
$Region = "us-east-1"

Write-Host "🚀 Starting Terraform Deployment" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host "Action: $Action"
Write-Host "Region: $Region"
Write-Host "Directory: $TerraformDir"
Write-Host ""

# Change to terraform directory
Push-Location $TerraformDir

try {
    # Step 1: Initialize Terraform
    Write-Host "📦 Step 1: Initializing Terraform..." -ForegroundColor Yellow
    terraform init
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform init failed"
    }
    Write-Host "✅ Terraform initialized successfully" -ForegroundColor Green
    Write-Host ""

    # Step 2: Validate configuration
    Write-Host "✔️  Step 2: Validating Terraform configuration..." -ForegroundColor Yellow
    terraform validate
    if ($LASTEXITCODE -ne 0) {
        throw "Terraform validation failed"
    }
    Write-Host "✅ Configuration is valid" -ForegroundColor Green
    Write-Host ""

    # Step 3: Format check
    Write-Host "📐 Step 3: Checking Terraform format..." -ForegroundColor Yellow
    terraform fmt -check -recursive . | Out-Null
    Write-Host "✅ Format check passed" -ForegroundColor Green
    Write-Host ""

    # Step 4: Plan
    Write-Host "📋 Step 4: Creating Terraform plan..." -ForegroundColor Yellow
    if ($Action -eq 'plan' -or $Action -eq 'apply') {
        terraform plan -lock=false
        if ($LASTEXITCODE -ne 0) {
            throw "Terraform plan failed"
        }
        Write-Host "✅ Plan created successfully" -ForegroundColor Green
        Write-Host ""
    }

    # Step 5: Apply
    if ($Action -eq 'apply') {
        Write-Host "🔧 Step 5: Applying Terraform configuration..." -ForegroundColor Yellow
        Write-Host "This will create:" -ForegroundColor Cyan
        Write-Host "  • 8 EC2 instances (t3.medium)" -ForegroundColor Cyan
        Write-Host "  • Application Load Balancer" -ForegroundColor Cyan
        Write-Host "  • Target Group" -ForegroundColor Cyan
        Write-Host ""
        
        if ($AutoApprove) {
            terraform apply -auto-approve -lock=false
        } else {
            terraform apply -lock=false
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Terraform apply failed"
        }
        Write-Host "✅ Infrastructure deployed successfully" -ForegroundColor Green
        Write-Host ""
        
        # Step 6: Display outputs
        Write-Host "📊 Step 6: Retrieving infrastructure outputs..." -ForegroundColor Yellow
        Write-Host ""
        
        terraform output -json | ConvertFrom-Json | ForEach-Object {
            Write-Host "Load Balancer DNS: $($_.load_balancer_dns_name.value)" -ForegroundColor Cyan
            Write-Host "Load Balancer ARN: $($_.load_balancer_arn.value)" -ForegroundColor Cyan
            Write-Host ""
            Write-Host "EC2 Instances:" -ForegroundColor Cyan
            Write-Host "  IDs: $($_.ec2_instance_ids.value -join ', ')" -ForegroundColor Cyan
            Write-Host "  Private IPs: $($_.ec2_private_ips.value -join ', ')" -ForegroundColor Cyan
            Write-Host "  Public IPs: $($_.ec2_public_ips.value -join ', ')" -ForegroundColor Cyan
        }
        Write-Host ""
    }

    # Step 7: Destroy (if requested)
    if ($Action -eq 'destroy') {
        Write-Host "🗑️  Step 5: Destroying infrastructure..." -ForegroundColor Yellow
        if ($AutoApprove) {
            terraform destroy -auto-approve -lock=false
        } else {
            terraform destroy -lock=false
        }
        
        if ($LASTEXITCODE -ne 0) {
            throw "Terraform destroy failed"
        }
        Write-Host "✅ Infrastructure destroyed successfully" -ForegroundColor Green
        Write-Host ""
    }

    Write-Host "================================" -ForegroundColor Cyan
    Write-Host "✨ Deployment completed successfully!" -ForegroundColor Green
    Write-Host "================================" -ForegroundColor Cyan

} catch {
    Write-Host ""
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
} finally {
    Pop-Location
}
