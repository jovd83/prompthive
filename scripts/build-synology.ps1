# Build Synology Deployment Tarball

$ErrorActionPreference = "Stop"

$ImageName = "prompthive-prod-debian"
$TarName = "synology/prompthive-prod-debian.tar"

Write-Host "Building Docker image: $ImageName..."
docker build -t $ImageName .

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker build failed."
}

Write-Host "Saving Docker image to $TarName..."
docker save -o $TarName $ImageName

if ($LASTEXITCODE -ne 0) {
    Write-Error "Docker save failed."
}

if (Test-Path $TarName) {
    $size = (Get-Item $TarName).Length / 1MB
    Write-Host "Successfully created $TarName ($([math]::Round($size, 2)) MB)"
}
else {
    Write-Error "Failed to create $TarName"
}
