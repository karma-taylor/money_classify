# Clears stuck WeChat DevTools base-library downloads (EPERM on *.wxvpkg rename).
# Run AFTER fully closing 微信开发者工具 (including tray icon).

$ErrorActionPreference = 'Stop'
$root = Join-Path $env:LOCALAPPDATA '微信开发者工具'
if (-not (Test-Path -LiteralPath $root)) {
    Write-Host "Not found: $root"
    exit 1
}

$targets = Get-ChildItem -LiteralPath $root -Recurse -Filter '*.wxvpkg' -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match '^(\d+\.){2}\d+\.wxvpkg$' }

$dirs = @{}
foreach ($f in $targets) {
    $dirs[$f.DirectoryName] = $true
}

if ($dirs.Count -eq 0) {
    Write-Host "No versioned .wxvpkg files found under $root (nothing to clean)."
    exit 0
}

Write-Host "The following folders contain SDK packages (often safe to delete if DevTools is closed):"
$dirs.Keys | Sort-Object | ForEach-Object { Write-Host "  $_" }

$answer = Read-Host "Delete these folders? [y/N]"
if ($answer -ne 'y' -and $answer -ne 'Y') {
    Write-Host "Aborted."
    exit 0
}

foreach ($d in ($dirs.Keys | Sort-Object)) {
    try {
        Remove-Item -LiteralPath $d -Recurse -Force
        Write-Host "Removed: $d"
    } catch {
        Write-Warning "Failed: $d — $($_.Exception.Message)"
    }
}

Write-Host "Done. Reopen 微信开发者工具 and pick a base library version in project settings."
