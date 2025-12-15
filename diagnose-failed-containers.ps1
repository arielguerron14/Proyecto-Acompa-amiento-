# diagnose-failed-containers.ps1
# Run from the repository root. This script collects diagnostics for any compose services
# that exited or failed and writes them to the `container-diagnostics` folder.

$diagDir = Join-Path $PSScriptRoot 'container-diagnostics'
New-Item -ItemType Directory -Force -Path $diagDir | Out-Null

Write-Host "Saving `docker compose ps` to $diagDir\compose-ps.txt"
docker compose ps | Out-File (Join-Path $diagDir 'compose-ps.txt') -Encoding utf8

$failed = docker compose ps --services --filter "status=exited"
if ($failed) {
  Write-Host "Found exited services: $failed"
  foreach ($svc in $failed) {
    Write-Host "Collecting logs for service: $svc"
    docker compose logs --no-color --tail 500 $svc 2>&1 | Out-File (Join-Path $diagDir "$($svc)-logs.txt") -Encoding utf8
    $cid = docker compose ps -q $svc
    if ($cid) {
      docker inspect $cid 2>&1 | Out-File (Join-Path $diagDir "$($svc)-inspect.json") -Encoding utf8
      docker logs --tail 500 $cid 2>&1 | Out-File (Join-Path $diagDir "$($svc)-container-logs.txt") -Encoding utf8
    }
  }
} else {
  Write-Host "No exited services found by compose. Checking for unhealthy or restarting units..."
  $unhealthy = docker compose ps --services --filter "status=running" | Out-String
  Write-Host "Running services (short list):"
  docker compose ps --services --filter "status=running" | Out-Host
}

Write-Host "Diagnostics saved to $diagDir"
Write-Host "Please attach the files in $diagDir or paste the failing service logs here and I will analyze them."