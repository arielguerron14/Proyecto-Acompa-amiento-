# PowerShell script to verify SSH key and diagnose connection issues

param(
    [string]$KeyPath = "",
    [string]$EC2IP = "13.223.188.169",
    [string]$EC2User = "ec2-user"
)

Write-Host "=== SSH Key & Connection Diagnostics ===" -ForegroundColor Cyan
Write-Host ""

# Check if key path provided
if ([string]::IsNullOrEmpty($KeyPath)) {
    Write-Host "Usage: .\diagnose-ssh.ps1 -KeyPath 'C:\path\to\key.pem' -EC2IP '13.223.188.169' -EC2User 'ec2-user'" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Example: .\diagnose-ssh.ps1 -KeyPath 'C:\Users\ariel\Downloads\key-acompanamiento.pem'" -ForegroundColor Yellow
    exit 1
}

# Verify key file exists
if (-not (Test-Path $KeyPath)) {
    Write-Host "❌ Error: Key file not found at $KeyPath" -ForegroundColor Red
    exit 1
}

Write-Host "✓ Key file found: $KeyPath" -ForegroundColor Green
Write-Host ""

# Check file properties
$file = Get-Item $KeyPath
Write-Host "File size: $($file.Length) bytes"
Write-Host "Last modified: $($file.LastWriteTime)"
Write-Host ""

# Read key content
$keyContent = Get-Content $KeyPath -Raw
$keyLines = $keyContent.Split([Environment]::NewLine) | Where-Object { $_ -ne "" }

Write-Host "=== Key Format Validation ===" -ForegroundColor Cyan
$firstLine = $keyLines[0]
$lastLine = $keyLines[$keyLines.Count - 1]

Write-Host "First line: $firstLine"
if ($firstLine -like "-----BEGIN*") {
    Write-Host "✓ First line is valid" -ForegroundColor Green
} else {
    Write-Host "❌ First line is invalid" -ForegroundColor Red
}

Write-Host "Last line: $lastLine"
if ($lastLine -like "-----END*") {
    Write-Host "✓ Last line is valid" -ForegroundColor Green
} else {
    Write-Host "❌ Last line is invalid" -ForegroundColor Red
}

Write-Host "Total lines: $($keyLines.Count)"
Write-Host ""

# Try to test SSH connection
Write-Host "=== SSH Connection Test ===" -ForegroundColor Cyan
Write-Host "Target: ${EC2User}@${EC2IP}"
Write-Host "Attempting SSH connection..."
Write-Host ""

try {
    # Copy key to ~/.ssh if needed
    $sshDir = "$env:USERPROFILE\.ssh"
    if (-not (Test-Path $sshDir)) {
        New-Item -ItemType Directory -Path $sshDir -Force | Out-Null
    }
    
    $targetKeyPath = "$sshDir\aws-test.pem"
    Copy-Item $KeyPath $targetKeyPath -Force
    
    # Test connection with verbose output
    Write-Host "Running: ssh -v -i `"$targetKeyPath`" -o ConnectTimeout=10 ${EC2User}@${EC2IP} `"echo connection successful`"" -ForegroundColor Yellow
    Write-Host ""
    
    # Note: This will likely fail due to connectivity from Windows to AWS
    # But the output will help diagnose the issue
    & ssh -v -i $targetKeyPath -o ConnectTimeout=10 -o BatchMode=yes "${EC2User}@${EC2IP}" "echo connection successful" 2>&1 | Out-Host
    
} catch {
    Write-Host "SSH command failed (this may be expected from Windows): $($_)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Next Steps ===" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. VERIFY KEY MATCHES EC2 INSTANCE:"
Write-Host "   - Go to AWS Console"
Write-Host "   - EC2 → Key Pairs"
Write-Host "   - Check if 'key-acompanamiento' key pair exists"
Write-Host "   - Verify the instance EC2-DB was launched with this key pair"
Write-Host ""
Write-Host "2. VERIFY SECURITY GROUP:"
Write-Host "   - EC2 → Instances → EC2-DB"
Write-Host "   - Check Security Groups tab"
Write-Host "   - Inbound rules must allow SSH (port 22)"
Write-Host "   - Source should be 0.0.0.0/0 or GitHub Actions IP range"
Write-Host ""
Write-Host "3. ADD KEY TO GITHUB SECRETS:"
Write-Host "   - Copy entire key content:"
Write-Host "   - Get-Content -Path '$KeyPath' -Raw | Set-Clipboard"
Write-Host "   - Go to GitHub → Settings → Secrets and variables → Actions"
Write-Host "   - Create secret: AWS_EC2_DB_SSH_PRIVATE_KEY"
Write-Host "   - Paste the key content"
Write-Host ""
Write-Host "4. KEY CONTENT PREVIEW:" -ForegroundColor Yellow
Write-Host "First 2 lines:"
$keyLines[0..1] | ForEach-Object { Write-Host "  $_" }
Write-Host "Last 2 lines:"
$keyLines[($keyLines.Count - 2)..($keyLines.Count - 1)] | ForEach-Object { Write-Host "  $_" }
