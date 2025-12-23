# Push images script for Proyecto-Acompa-amiento
# Usage (PowerShell):
#   $env:DOCKERHUB_USERNAME='your-user'; $env:DOCKERHUB_TOKEN='your-token'; pwsh ./scripts/push-images.ps1

param(
    [string[]]$Services = @('micro-auth','api-gateway','frontend-web','micro-core','micro-reportes','micro-notificaciones','messaging','monitoring','databases'),
    [string]$RepoPrefix = 'proyecto-acomp-'
)

$user = $env:DOCKERHUB_USERNAME
$sha = (git rev-parse --short HEAD)

# If DOCKERHUB_USERNAME and DOCKERHUB_TOKEN are set, perform a scripted login.
# Otherwise, assume the user has already run `docker login` locally (Docker Desktop) and proceed.
if ($env:DOCKERHUB_USERNAME -and $env:DOCKERHUB_TOKEN) {
    Write-Host "Logging in to Docker Hub as $env:DOCKERHUB_USERNAME via provided token"
    $loginProc = docker login --username $env:DOCKERHUB_USERNAME --password-stdin < <(echo $env:DOCKERHUB_TOKEN) 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Error "Docker login failed"
        exit 2
    }
} else {
    Write-Host "No DOCKERHUB_TOKEN provided — assuming you are already logged into Docker on this machine (Docker Desktop)"
}

foreach ($s in $Services) {
    $context = Join-Path -Path $PWD -ChildPath $s
    if (Test-Path $context) {
        Write-Host "Building $s..."
        docker build -t "$s:local" "$context"
        $imgSha = "$user/$RepoPrefix$s:$sha"
        $imgLatest = "$user/$RepoPrefix$s:latest"
        docker tag "$s:local" $imgSha
        docker tag "$s:local" $imgLatest
        Write-Host "Pushing $imgSha ..."
        docker push $imgSha
        Write-Host "Pushing $imgLatest ..."
        docker push $imgLatest
    }
    else {
        Write-Host "Skipping $s (no folder $context)"
    }
}

Write-Host "Done. Verify images on Docker Hub: https://hub.docker.com/u/$user"