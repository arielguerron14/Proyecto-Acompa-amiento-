#!/usr/bin/env powershell

<#
.SYNOPSIS
Quick diagnosis of EC2_CORE connectivity

.DESCRIPTION
Tests if EC2_CORE is reachable and SSH is working
#>

Write-Host "📊 EC2_CORE Diagnostic Report" -ForegroundColor Cyan
Write-Host "=" * 50
Write-Host ""

# Check the IP that was in the error
$knownIP = "3.234.198.34"

Write-Host "Testing known IP: $knownIP" -ForegroundColor Yellow
Write-Host ""

# Test port 22 (SSH)
Write-Host "1️⃣  Testing SSH (port 22)..." -ForegroundColor Cyan
$ssh = Test-NetConnection -ComputerName $knownIP -Port 22 -WarningAction SilentlyContinue
if ($ssh.TcpTestSucceeded) {
    Write-Host "   ✅ SSH is OPEN" -ForegroundColor Green
} else {
    Write-Host "   ❌ SSH is CLOSED/BLOCKED - Instance may be down" -ForegroundColor Red
}

Write-Host ""

# Test ICMP (Ping)
Write-Host "2️⃣  Testing Ping..." -ForegroundColor Cyan
$ping = Test-Connection -ComputerName $knownIP -Count 1 -ErrorAction SilentlyContinue -WarningAction SilentlyContinue
if ($ping) {
    Write-Host "   ✅ Ping SUCCESS" -ForegroundColor Green
} else {
    Write-Host "   ❌ Ping FAILED - Instance may not be running" -ForegroundColor Red
}

Write-Host ""
Write-Host "=" * 50

if (-not $ssh.TcpTestSucceeded) {
    Write-Host ""
    Write-Host "⚠️  RECOMMENDATION:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "   The instance at $knownIP is NOT responding to SSH."
    Write-Host "   This could mean:"
    Write-Host ""
    Write-Host "   1. 🛑 Instance is STOPPED/TERMINATED"
    Write-Host "   2. 🔒 Security Group blocks port 22"
    Write-Host "   3. 📡 Network issue / wrong IP"
    Write-Host ""
    Write-Host "   NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "   A) Start the instance via AWS Console:"
    Write-Host "      Go to EC2 Dashboard → Select EC2_CORE → click 'Start'"
    Write-Host ""
    Write-Host "   B) Or via AWS CLI:"
    Write-Host "      aws ec2 describe-instances --region us-east-1 --filters 'Name=tag:Name,Values=EC2_CORE'"
    Write-Host ""
}
