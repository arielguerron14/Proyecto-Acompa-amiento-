# Push existing local images to Docker Hub using desired naming convention
# Usage:
#   pwsh ./scripts/push-existing-local-images.ps1
# Optional env vars:
#   DOCKERHUB_USERNAME  - username to use (if not set, will try to infer from image repo names)
#   REPO_PREFIX         - prefix to apply to repository names (default: Proyecto-Acompa-amiento-)

param(
    [string]$RepoPrefix = 'proyecto-acomp-'
)

# Determine Docker Hub username
if ($env:DOCKERHUB_USERNAME) {
    $user = $env:DOCKERHUB_USERNAME
} else {
    # Try to infer username from local images (first repository that contains a slash)
    $first = docker images --format '{{.Repository}}' | Where-Object { $_ -match '/' } | Select-Object -First 1
    if (-not $first) {
        Write-Error "Could not infer Docker Hub username. Set DOCKERHUB_USERNAME env var or ensure local images have 'username/repo' format."
        exit 1
    }
    $user = ($first -split '/')[0]
    Write-Host "Inferred DOCKERHUB_USERNAME='$user' from local images"
}

$sha = (git rev-parse --short HEAD) -replace '\n',''
if (-not $sha) { $sha = 'local' }

Write-Host "Using username: $user"
Write-Host "Repo prefix: $RepoPrefix"
Write-Host "Git SHA: $sha"

# Get list of local images for this user
$images = docker images --format "{{.Repository}}:{{.Tag}} {{.ID}}" | Where-Object { $_ -like "$user/*" } | ForEach-Object {
    $parts = $_ -split '\s+'; $repoTag = $parts[0]; $id = $parts[1]
    $repo = ($repoTag -split ':')[0]; $tag = ($repoTag -split ':')[1]
    [PSCustomObject]@{Repo=$repo; Tag=$tag; ID=$id}
}

if (-not $images) {
    Write-Host "No local images found for user $user"
    exit 0
}

foreach ($img in $images) {
    $service = ($img.Repo -split '/')[1]
    if (-not $service) { continue }
    $targetRepo = "$user/$RepoPrefix$service"
    $shaTag = "$targetRepo:$sha"
    $latestTag = "$targetRepo:latest"

    Write-Host "Processing local image $($img.Repo):$($img.Tag) (ID: $($img.ID))"
    # Tagging
    docker tag $img.ID $shaTag
    docker tag $img.ID $latestTag

    # Push
    Write-Host "Pushing $shaTag"
    docker push $shaTag
    Write-Host "Pushing $latestTag"
    docker push $latestTag
}

Write-Host "Done. Verify images on Docker Hub: https://hub.docker.com/u/$user"