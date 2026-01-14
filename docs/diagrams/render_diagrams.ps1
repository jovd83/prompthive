# PowerShell Script to Render Mermaid Diagrams
# Usage: .\docs\render_diagrams.ps1

# $ErrorActionPreference = "Stop"

# Ensure output directory exists
$OutputDir = "docs/diagrams/img"
if (-not (Test-Path -Path $OutputDir)) {
    New-Item -ItemType Directory -Path $OutputDir | Out-Null
    Write-Host "Created directory $OutputDir"
}

$Version = "1.0.0"
$CurrentDate = Get-Date -Format "yyyy-MM-dd HH:mm"

function Render-Diagram {
    param (
        [string]$InputFile,
        [string]$OutputFile,
        [string]$PageTitle
    )

    $TempFile = "docs/diagrams/temp_render.mmd"

    # Create temporary file (Copy input to temp to avoid modifying original or injecting frontmatter if needed)
    # We copy simply to avoid locking the source or just to have a standard temp file
    Copy-Item -Path $InputFile -Destination $TempFile -Force

    Write-Host "Rendering $PageTitle..." -ForegroundColor Cyan

    # Run mmdc via npx
    # Using specific mermaid-cli version or local install if available
    cmd /c npx -y @mermaid-js/mermaid-cli -i "$TempFile" -o "$OutputFile" --backgroundColor white --scale 3

    # Cleanup
    if (Test-Path $TempFile) {
        Remove-Item $TempFile
    }
}

# 1. Architecture
Render-Diagram "docs/diagrams/architecture.mmd" "docs/diagrams/img/architecture.png" "PromptHive Architecture"

# 2. Schema
if (Test-Path "docs/diagrams/schema.mmd") {
    Render-Diagram "docs/diagrams/schema.mmd" "docs/diagrams/img/schema.png" "PromptHive Data Schema"
}

# 3. Wireframes
Write-Host "Rendering Wireframes..." -ForegroundColor Green
$WireframeOutputDir = "docs/wireframes/previews"
if (-not (Test-Path -Path $WireframeOutputDir)) {
    New-Item -ItemType Directory -Path $WireframeOutputDir | Out-Null
    Write-Host "Created directory $WireframeOutputDir"
}

$Wireframes = Get-ChildItem "docs/wireframes/*.mmd"

foreach ($File in $Wireframes) {
    $Name = $File.BaseName
    # Replace underscores with spaces for title
    $TitleClean = $Name -replace "_", " "
    $Title = "Wireframe: $TitleClean"
    
    Render-Diagram $File.FullName "$WireframeOutputDir/$Name.png" $Title
}

Write-Host "✅ All Diagrams rendered to docs/diagrams/img/" -ForegroundColor Green
Write-Host "✅ All Wireframes rendered to docs/wireframes/previews/" -ForegroundColor Green
