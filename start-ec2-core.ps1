#!/usr/bin/env powershell

<#
.SYNOPSIS
Start EC2_CORE instance using AWS CLI

.DESCRIPTION
Starts the EC2_CORE instance if it's stopped and waits for it to be ready
#>

param(
    [switch]$WaitForSSH = $false,
    [int]$TimeoutSeconds = 300
)

$ErrorActionPreference = "Stop"

Write-Host "🔍 Finding EC2_CORE instance..." -ForegroundColor Cyan

try {
    # Find EC2_CORE instance using AWS CLI
    $output = aws ec2 describe-instances `
        --region us-east-1 `
        --filters "Name=tag:Name,Values=EC2_CORE" "Name=instance-state-name,Values=stopped,stopping,running" `
        --query 'Reservations[0].Instances[0].[InstanceId,State.Name,PublicIpAddress,PrivateIpAddress]' `
        --output text 2>&1
    
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to query AWS: $output" -ForegroundColor Red
        exit 1
    }
    
    if (-not $output -or $output -eq "None") {
        Write-Host "❌ EC2_CORE instance not found!" -ForegroundColor Red
        exit 1
    }
    
    $parts = $output -split '\s+' | Where-Object { $_ }
    $instanceId = $parts[0]
    $currentState = $parts[1]
    $publicIp = if ($parts[2] -ne "None") { $parts[2] } else { "N/A" }
    $privateIp = if ($parts[3] -ne "None") { $parts[3] } else { "N/A" }
    
    Write-Host "✅ Found instance: $instanceId" -ForegroundColor Green
    Write-Host "   Current State: $currentState"
    Write-Host "   Public IP: $publicIp"
    Write-Host "   Private IP: $privateIp"
    
    if ($currentState -eq "running") {
        Write-Host "✅ Instance is already running!" -ForegroundColor Green
        
        if ($WaitForSSH -and $publicIp -ne "N/A") {
            Write-Host "`n⏳ Checking SSH connectivity to $publicIp..." -ForegroundColor Yellow
            $startTime = Get-Date
            $sshReady = $false
            
            while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($TimeoutSeconds)) {
                $tcpConnection = Test-NetConnection -ComputerName $publicIp -Port 22 -WarningAction SilentlyContinue
                
                if ($tcpConnection.TcpTestSucceeded) {
                    Write-Host "✅ SSH is ready at $publicIp`:22" -ForegroundColor Green
                    $sshReady = $true
                    break
                }
                
                Start-Sleep -Seconds 2
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
            
            if (-not $sshReady) {
                Write-Host "`n⚠️  SSH connection timed out after $TimeoutSeconds seconds" -ForegroundColor Yellow
            }
        }
        
        exit 0
    }
    
    if ($currentState -eq "stopped") {
        Write-Host "`n🚀 Starting EC2_CORE instance ($instanceId)..." -ForegroundColor Cyan
        aws ec2 start-instances --instance-ids $instanceId --region us-east-1 | Out-Null
        
        # Wait for instance to start
        Write-Host "⏳ Waiting for instance to start..." -ForegroundColor Yellow
        $startTime = Get-Date
        
        while ($true) {
            $output = aws ec2 describe-instances `
                --instance-ids $instanceId `
                --region us-east-1 `
                --query 'Reservations[0].Instances[0].[State.Name,PublicIpAddress]' `
                --output text
            
            $parts = $output -split '\s+'
            $state = $parts[0]
            $publicIp = if ($parts[1] -ne "None") { $parts[1] } else { "N/A" }
            
            if ($state -eq "running") {
                Write-Host "✅ Instance is now running!" -ForegroundColor Green
                break
            }
            
            if ((Get-Date) - $startTime -gt [TimeSpan]::FromMinutes(5)) {
                Write-Host "❌ Timeout waiting for instance to start" -ForegroundColor Red
                exit 1
            }
            
            Start-Sleep -Seconds 3
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
        
        # Wait a bit more for IP assignment
        Write-Host "`n⏳ Waiting for IP assignment..." -ForegroundColor Yellow
        Start-Sleep -Seconds 5
        
        # Get updated instance info
        $output = aws ec2 describe-instances `
            --instance-ids $instanceId `
            --region us-east-1 `
            --query 'Reservations[0].Instances[0].[PublicIpAddress,PrivateIpAddress,State.Name]' `
            --output text
        
        $parts = $output -split '\s+' | Where-Object { $_ }
        $publicIp = if ($parts[0] -ne "None") { $parts[0] } else { "N/A" }
        $privateIp = if ($parts[1] -ne "None") { $parts[1] } else { "N/A" }
        $state = $parts[2]
        
        Write-Host "`n📋 Instance Details:" -ForegroundColor Cyan
        Write-Host "   ID: $instanceId"
        Write-Host "   Public IP: $publicIp"
        Write-Host "   Private IP: $privateIp"
        Write-Host "   State: $state"
        
        if ($WaitForSSH -and $publicIp -ne "N/A") {
            Write-Host "`n⏳ Checking SSH connectivity to $publicIp..." -ForegroundColor Yellow
            $startTime = Get-Date
            $sshReady = $false
            
            while ((Get-Date) - $startTime -lt [TimeSpan]::FromSeconds($TimeoutSeconds)) {
                $tcpConnection = Test-NetConnection -ComputerName $publicIp -Port 22 -WarningAction SilentlyContinue
                
                if ($tcpConnection.TcpTestSucceeded) {
                    Write-Host "✅ SSH is ready at $publicIp`:22" -ForegroundColor Green
                    $sshReady = $true
                    break
                }
                
                Start-Sleep -Seconds 2
                Write-Host "." -NoNewline -ForegroundColor Yellow
            }
            
            if (-not $sshReady) {
                Write-Host "`n⚠️  SSH connection timed out after $TimeoutSeconds seconds" -ForegroundColor Yellow
                Write-Host "   The instance is running but SSH may not be ready yet"
                Write-Host "   Try again in a few moments: Test-NetConnection -ComputerName $publicIp -Port 22"
            }
        }
        
        exit 0
    }
    
    Write-Host "❌ Instance is in unexpected state: $currentState" -ForegroundColor Red
    exit 1
    
} catch {
    Write-Host "❌ Error: $_" -ForegroundColor Red
    exit 1
}
