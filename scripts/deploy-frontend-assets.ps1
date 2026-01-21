<#
Deploy frontend public assets to EC2 via Bastion.

Usage examples:

  pwsh scripts/deploy-frontend-assets.ps1 \
    -BastionHost 3.87.155.74 -BastionPort 2222 -BastionKeyPath C:\keys\bastion-key.pem \
    -WebUser ec2-user -WebPrivateIp 10.0.1.25 -WebKeyPath C:\keys\web-ec2-key.pem \
    -AlbDnsName lab-alb-1495517459.us-east-1.elb.amazonaws.com

This will:
  - Zip apps/frontend-web/public -> artifacts/frontend-public.zip
  - Copy zip to bastion
  - Copy zip to web EC2 (via ProxyJump through bastion)
  - Unzip to /var/www/html and restart simple-http
  - Verify favicon and index via ALB
#>

param(
  [Parameter(Mandatory=$true)] [string] $BastionHost,
  [Parameter()] [int] $BastionPort = 2222,
  [Parameter()] [string] $BastionUser = 'ubuntu',
  [Parameter(Mandatory=$true)] [string] $BastionKeyPath,
  [Parameter()] [string] $WebUser = 'ec2-user',
  [Parameter(Mandatory=$true)] [string] $WebPrivateIp,
  [Parameter(Mandatory=$true)] [string] $WebKeyPath,
  [Parameter()] [string] $AlbDnsName
)

$ErrorActionPreference = 'Stop'

function Require-Command([string]$name) {
  if (-not (Get-Command $name -ErrorAction SilentlyContinue)) {
    throw "Required command '$name' not found in PATH. Please install OpenSSH client."
  }
}

function Ensure-File([string]$path) {
  if (-not (Test-Path -LiteralPath $path)) {
    throw "Required file not found: $path"
  }
}

Write-Host "🚀 Starting frontend asset deployment..." -ForegroundColor Cyan

# Validate prerequisites
Require-Command 'ssh'
Require-Command 'scp'
Ensure-File $BastionKeyPath
Ensure-File $WebKeyPath

# Resolve repo paths
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $repoRoot  # scripts -> repo root
$publicDir = Join-Path $repoRoot 'apps' 'frontend-web' 'public'
$zipPath = Join-Path $repoRoot 'artifacts' 'frontend-public.zip'

if (-not (Test-Path -LiteralPath $publicDir)) {
  throw "Frontend public directory not found: $publicDir"
}

# Create artifacts directory
$artifactsDir = Split-Path -Parent $zipPath
if (-not (Test-Path -LiteralPath $artifactsDir)) {
  New-Item -ItemType Directory -Path $artifactsDir | Out-Null
}

Write-Host "📦 Zipping assets from $publicDir -> $zipPath" -ForegroundColor Yellow
Compress-Archive -Path (Join-Path $publicDir '*') -DestinationPath $zipPath -Force

Write-Host "📤 Uploading zip to bastion ${BastionHost}:${BastionPort}" -ForegroundColor Yellow
scp -P $BastionPort -i $BastionKeyPath $zipPath "$BastionUser@${BastionHost}:/tmp/frontend-public.zip"

Write-Host "🔗 Transferring zip to web EC2 ($WebUser@$WebPrivateIp) via ProxyJump" -ForegroundColor Yellow
$proxyJump = "$BastionUser@${BastionHost}:${BastionPort}"
scp -o "ProxyJump=$proxyJump" -i $WebKeyPath $zipPath "$WebUser@${WebPrivateIp}:/tmp/frontend-public.zip"

Write-Host "🛠️ Deploying assets on web EC2 and restarting simple-http" -ForegroundColor Yellow
$remoteCmd = @'
set -e
sudo mkdir -p /var/www/html

# Install unzip if missing (Amazon Linux / Ubuntu)
if ! command -v unzip >/dev/null 2>&1; then
  if command -v yum >/dev/null 2>&1; then
    sudo yum install -y unzip
  elif command -v apt-get >/dev/null 2>&1; then
    sudo apt-get update -y && sudo apt-get install -y unzip
  fi
fi

sudo unzip -o /tmp/frontend-public.zip -d /var/www/html
sudo systemctl restart simple-http || true
'@

ssh -o "ProxyJump=$proxyJump" -i $WebKeyPath "$WebUser@$WebPrivateIp" "$remoteCmd"

if ($AlbDnsName) {
  Write-Host "🔍 Verifying via ALB: http://$AlbDnsName/ and /favicon.ico" -ForegroundColor Yellow
  try {
    $indexStatus = (curl -s -I "http://$AlbDnsName/" | Select-String -Pattern '^HTTP').ToString()
    $icoStatus = (curl -s -I "http://$AlbDnsName/favicon.ico" | Select-String -Pattern '^HTTP').ToString()
    Write-Host "✅ Index: $indexStatus" -ForegroundColor Green
    Write-Host "✅ Favicon: $icoStatus" -ForegroundColor Green
  } catch {
    Write-Host "ℹ️ Verification curl failed; please open in browser: http://$AlbDnsName/" -ForegroundColor DarkYellow
  }
} else {
  Write-Host "ℹ️ Skipping ALB verification (AlbDnsName not provided)." -ForegroundColor DarkYellow
}

Write-Host "🎉 Frontend assets deployed. If favicon still 404, clear browser cache and retry." -ForegroundColor Cyan
