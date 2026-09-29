param([switch]$Publish)
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$root = '\\192.168.120.11\c$\ELV_Project_Acceptance'
$app = Join-Path $root 'app'
$files = @('src\app.js', 'src\modules\state.js', 'src\modules\ui.js', 'src\workspace.css', 'public\sw.js', 'dist\sw.js')
$dist = Join-Path $repo 'dist'
$html = Get-Content -LiteralPath (Join-Path $dist 'index.html') -Raw
$assets = @([regex]::Matches($html, '/assets/[^"\s]+') | ForEach-Object { $_.Value.TrimStart('/') })
if ($assets.Count -lt 2) { throw 'Build assets missing' }
foreach ($asset in $assets) {
  if ($asset -notmatch '^assets/[A-Za-z0-9_.-]+\.(js|css)$') { throw 'Unexpected asset path' }
  $files += 'dist\' + $asset.Replace('/', '\')
}
# Publish the HTML entry last; retain all old assets for active sessions and rollback.
$files += 'dist\index.html'
foreach ($file in $files) {
  if (!(Test-Path -LiteralPath (Join-Path $repo $file))) { throw "Missing source: $file" }
}
foreach ($url in @('http://192.168.120.11:8088/api/ready', 'http://192.168.120.11/')) {
  if ((Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 $url).StatusCode -ne 200) { throw "Preflight failed: $url" }
}
$configPath = Join-Path $app 'dist\web.config'
$configHash = (Get-FileHash -LiteralPath $configPath).Hash
$backendHash = (Get-FileHash -LiteralPath (Join-Path $app 'server\index.js')).Hash
if (!$Publish) { Write-Output "Preflight passed. $($files.Count) allowlisted files. Use -Publish to deploy."; exit }
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$backup = Join-Path $root "backups\ui-$stamp"
New-Item -ItemType Directory -Path $backup | Out-Null
foreach ($file in $files) {
  $old = Join-Path $app $file
  if (Test-Path -LiteralPath $old) {
    $target = Join-Path $backup $file
    New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
    Copy-Item -LiteralPath $old -Destination $target
  }
}
Copy-Item -LiteralPath $configPath -Destination (Join-Path $backup 'web.config.preserved')
try {
  foreach ($file in $files) {
    $target = Join-Path $app $file
    New-Item -ItemType Directory -Force -Path (Split-Path $target) | Out-Null
    Copy-Item -LiteralPath (Join-Path $repo $file) -Destination $target -Force
    if ((Get-FileHash -LiteralPath $target).Hash -ne (Get-FileHash -LiteralPath (Join-Path $repo $file)).Hash) { throw "Hash mismatch: $file" }
  }
  if ((Get-FileHash -LiteralPath $configPath).Hash -ne $configHash) { throw 'IIS configuration changed unexpectedly' }
  if ((Get-FileHash -LiteralPath (Join-Path $app 'server\index.js')).Hash -ne $backendHash) { throw 'Backend changed unexpectedly' }
  foreach ($url in @('http://192.168.120.11:8088/', 'http://192.168.120.11:8088/api/ready', 'http://192.168.120.11/')) {
    if ((Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 $url).StatusCode -ne 200) { throw "Postflight failed: $url" }
  }
  foreach ($asset in $assets) {
    if ((Invoke-WebRequest -UseBasicParsing -TimeoutSec 15 "http://192.168.120.11:8088/$asset").StatusCode -ne 200) { throw "Asset unreachable: $asset" }
  }
} catch {
  foreach ($file in $files) {
    $old = Join-Path $backup $file
    if (Test-Path -LiteralPath $old) { Copy-Item -LiteralPath $old -Destination (Join-Path $app $file) -Force }
  }
  throw
}
Write-Output "Published $($files.Count) files. Backup: $backup"
Write-Output 'ELV ready=200; BMS=200; web.config/backend hashes unchanged; no services restarted.'
