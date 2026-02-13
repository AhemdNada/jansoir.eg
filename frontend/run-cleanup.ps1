# Frontend Cleanup Script
# Moves unused files into frontend_backup_unused (nothing deleted permanently).
# Run from: c:\coding\jansoir\frontend
# Usage: .\run-cleanup.ps1

$ErrorActionPreference = "Stop"
$root = $PSScriptRoot
$backup = Join-Path $root "frontend_backup_unused"

if (-not (Test-Path $backup)) {
    New-Item -ItemType Directory -Path $backup -Force | Out-Null
    Write-Host "Created backup folder: $backup"
}

function Move-ToBackup {
    param([string]$relativePath)
    $src = Join-Path $root $relativePath
    $dest = Join-Path $backup $relativePath
    if (Test-Path $src) {
        $destDir = Split-Path $dest -Parent
        if (-not (Test-Path $destDir)) { New-Item -ItemType Directory -Path $destDir -Force | Out-Null }
        Move-Item -Path $src -Destination $dest -Force
        Write-Host "  Moved: $relativePath"
    } else {
        Write-Host "  Skip (not found): $relativePath"
    }
}

Write-Host "`n--- Root: debug/Lighthouse artifacts ---"
@(
    "cls-debug.mjs",
    "inject-cls-debug.mjs",
    "remove-shell.mjs",
    "lh-cls-fix.json", "lh-desktop.json", "lh-font-fix.json", "lh-m3.json", "lh-mobile.json",
    "lh-nodefer.json", "lh-nodefer2.json", "lh-noshell.json",
    "lh-result-0.devtoolslog.json", "lh-result-0.trace.json", "lh-result.json", "lh-run.json", "lh-trace-0.devtoolslog.json",
    "lighthouse-desktop.json", "lighthouse-mobile.json", "lighthouse-mobile2.json",
    "lighthouse.after.full.json", "lighthouse.after.json", "lighthouse.after2.full.json", "lighthouse.after3.full.json",
    "lighthouse.after4.full.json", "lighthouse.after5.full.json", "lighthouse.after6.full.json",
    "lighthouse.after7.full.json", "lighthouse.after8.full.json", "lighthouse.after9.full.json",
    "lighthouse.final.full.json",
    "lighthouse.home.deferheavy.json", "lighthouse.home.eagerhome.json", "lighthouse.home.final.json",
    "lighthouse.home.final2.json", "lighthouse.home.optimized.json", "lighthouse.home.optimized2.json", "lighthouse.home.shell.json"
) | ForEach-Object { Move-ToBackup $_ }

Write-Host "`n--- Unused components ---"
@(
    "src\components\common\Carousel.jsx",
    "src\components\common\ProductCardSlider.jsx",
    "src\components\common\ProtectedRoute.jsx"
) | ForEach-Object { Move-ToBackup $_ }

Write-Host "`n--- Unused public assets ---"
Move-ToBackup "public\vite.svg"
@(
    "public\images\b-1.png", "public\images\b-2.png", "public\images\b-3.png", "public\images\b-4.png",
    "public\images\hero-section-1.jpg", "public\images\hero-section-2.jpg", "public\images\hero-section-3.jpg",
    "public\images\hero-section-3-gg.jpg", "public\images\hero-section-gg.jpg",
    "public\images\icon-title-opt.png"
) | ForEach-Object { Move-ToBackup $_ }
# Image with space in name
$chatgpt = Join-Path $root "public\images\ChatGPT Image Jan 30, 2026, 09_23_19 PM.png"
if (Test-Path $chatgpt) {
    $dest = Join-Path $backup "public\images\ChatGPT Image Jan 30, 2026, 09_23_19 PM.png"
    New-Item -ItemType Directory -Path (Join-Path $backup "public\images") -Force | Out-Null
    Move-Item -Path $chatgpt -Destination $dest -Force
    Write-Host "  Moved: public\images\ChatGPT Image Jan 30, 2026, 09_23_19 PM.png"
}
# New folder (entire folder)
$newFolder = Join-Path $root "public\images\New folder"
if (Test-Path $newFolder) {
    $destFolder = Join-Path $backup "public\images\New folder"
    New-Item -ItemType Directory -Path (Split-Path $destFolder -Parent) -Force | Out-Null
    Move-Item -Path $newFolder -Destination $destFolder -Force
    Write-Host "  Moved: public\images\New folder\ (entire folder)"
}

Write-Host "`nCleanup complete. Backup location: $backup"
Write-Host "See CLEANUP_REPORT.md for full summary."
