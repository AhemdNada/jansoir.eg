<# 
  run-disk-cleanup.ps1

  Safely cleans up unused files from the build output folder (`dist`).
  - Moves unused files into `frontend_backup_disk` (nothing is deleted).
  - Leaves all JS bundles, .gz, .br files, and other critical assets untouched.

  Assumption: The requested "disk" folder is the Vite build output folder `dist`.
#>

$ErrorActionPreference = "Stop"
$root   = $PSScriptRoot
$dist   = Join-Path $root "dist"
$backup = Join-Path $root "frontend_backup_disk"

if (-not (Test-Path $dist)) {
    Write-Host "dist folder not found at: $dist"
    Write-Host "Nothing to clean. Build first with: npm run build"
    exit 0
}

if (-not (Test-Path $backup)) {
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Write-Host "Created backup folder: $backup"
}

function Move-ToDiskBackup {
    param([string]$relativePath)

    $src  = Join-Path $root $relativePath
    $dest = Join-Path $backup $relativePath

    if (Test-Path $src) {
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) {
            New-Item -ItemType Directory -Path $destDir -Force | Out-Null
        }
        Move-Item -Path $src -Destination $dest -Force
        Write-Host "  Moved: $relativePath"
    } else {
        Write-Host "  Skip (not found): $relativePath"
    }
}

Write-Host "`n--- dist root: unused favicon ---"
# Vite's default favicon – not referenced in index.html (favicon uses icon-title-64.png)
Move-ToDiskBackup "dist\vite.svg"

Write-Host "`n--- dist/images: unused images ---"
# PNG banner duplicates (only .webp variants are used by the app)
@(
    "dist\images\b-1.png",
    "dist\images\b-2.png",
    "dist\images\b-3.png",
    "dist\images\b-4.png"
) | ForEach-Object { Move-ToDiskBackup $_ }

# JPG hero variants and extra hero images (only .webp variants are used)
@(
    "dist\images\hero-section-1.jpg",
    "dist\images\hero-section-2.jpg",
    "dist\images\hero-section-3.jpg",
    "dist\images\hero-section-3-gg.jpg",
    "dist\images\hero-section-gg.jpg"
) | ForEach-Object { Move-ToDiskBackup $_ }

# Optimized icon that is not referenced (app uses icon-title.png and icon-title-64.png)
Move-ToDiskBackup "dist\images\icon-title-opt.png"

# Image with spaces in the name
$chatGptRel = "dist\images\ChatGPT Image Jan 30, 2026, 09_23_19 PM.png"
Move-ToDiskBackup $chatGptRel

# Entire "New folder" directory – contains unused hero/icon variants
$newFolder = Join-Path $root "dist\images\New folder"
if (Test-Path $newFolder) {
    $destFolder = Join-Path $backup "dist\images\New folder"
    $destParent = Split-Path $destFolder -Parent
    if (-not (Test-Path $destParent)) {
        New-Item -ItemType Directory -Path $destParent -Force | Out-Null
    }
    Move-Item -Path $newFolder -Destination $destFolder -Force
    Write-Host "  Moved: dist\images\New folder\ (entire folder)"
} else {
    Write-Host "  Skip (not found): dist\images\New folder\"
}

Write-Host "`nDone. Unused dist files are now under: $backup"
Write-Host "You can restore any file by moving it back from frontend_backup_disk to dist."

