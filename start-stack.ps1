# start-stack.ps1
# Starts Docker Desktop (if installed), waits for the daemon, builds and starts compose stack,
# then tails logs and writes a log file to .\docker-startup.log

$dockerExe = 'C:\Program Files\Docker\Docker\Docker Desktop.exe'
$logFile = Join-Path $PSScriptRoot 'docker-startup.log'

Write-Host "1) Checking Docker CLI availability..."
$maxWait = 120
$waited = 0
function DockerOk {
    try {
        docker version > $null 2>&1
        return $true
    } catch {
        return $false
    }
}

if (-not (DockerOk)) {
    if (Test-Path $dockerExe) {
        Write-Host "Docker CLI not responding; attempting to start Docker Desktop..."
        Start-Process -FilePath $dockerExe
        Start-Sleep -Seconds 3
    } else {
        Write-Host "Docker Desktop executable not found at $dockerExe."
        Write-Host "Please start Docker Desktop manually and then re-run this script."
        exit 1
    }
}

# Wait for docker to respond
Write-Host "Waiting for Docker daemon (timeout ${maxWait}s)..."
while (-not (DockerOk) -and ($waited -lt $maxWait)) {
    Start-Sleep -Seconds 2
    $waited += 2
    Write-Host -NoNewline "."
}
Write-Host ""

if (-not (DockerOk)) {
    Write-Host "Docker daemon did not become available within $maxWait seconds. Please check Docker Desktop and try again."
    exit 2
}

Write-Host "Docker available. Validating compose file..."
docker compose config | Out-Host

Write-Host "Building and starting stack (detach)..."
docker compose up --build -d | Tee-Object -FilePath $logFile

Write-Host "Listing running services:"
docker compose ps --services --filter "status=running" | Tee-Object -FilePath $logFile -Append

Write-Host "Tailing logs (first 200 lines per service). Logs also saved to $logFile."
docker compose logs -f --tail 200 | Tee-Object -FilePath $logFile -Append
