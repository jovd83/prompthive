# PowerShell Script to Render Mermaid Diagrams
# Usage: .\docs\render_diagrams.ps1

$ErrorActionPreference = "Stop"

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

    $TempFile = "docs/diagrams/src/temp_render.mmd"

    # Create temporary file with Frontmatter Title
    $Content = @"
---
title: $PageTitle | v$Version | $CurrentDate
---
"@
    Set-Content -Path $TempFile -Value $Content
    Add-Content -Path $TempFile -Value (Get-Content -Path $InputFile -Raw)

    Write-Host "Rendering $PageTitle..." -ForegroundColor Cyan

    # Run mmdc via npx (cmd /c is needed because npx is a batch file usually)
    cmd /c npx -y @mermaid-js/mermaid-cli -i "$TempFile" -o "$OutputFile" --backgroundColor white --scale 3

    # Cleanup
    if (Test-Path $TempFile) {
        Remove-Item $TempFile
    }
}

# 1. Architecture
Render-Diagram "docs/diagrams/src/architecture.mmd" "docs/diagrams/img/architecture.png" "PromptHive Architecture"

# 2. Schema
# Check if schema exists first, if not skip (it was mentioned in valid files list earlier?)
if (Test-Path "docs/diagrams/src/schema.mmd") {
    Render-Diagram "docs/diagrams/src/schema.mmd" "docs/diagrams/img/schema.png" "PromptHive Data Schema"
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
    # Title Case (optional, keeping it simple)
    $Title = "Wireframe: $TitleClean"
    
    Render-Diagram $File.FullName "$WireframeOutputDir/$Name.png" $Title
}

Write-Host "✅ All Diagrams rendered to docs/diagrams/img/" -ForegroundColor Green
Write-Host "✅ All Wireframes rendered to docs/wireframes/previews/" -ForegroundColor Green
