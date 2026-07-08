# Genera el ZIP de publicación para Chrome Web Store.
# Uso: .\store\build-zip.ps1  (desde la raíz del proyecto)
# Incluye solo los ficheros que la extensión necesita en producción.

$ErrorActionPreference = 'Stop'

$root = Split-Path -Parent $PSScriptRoot
$manifest = Get-Content (Join-Path $root 'manifest.json') -Raw | ConvertFrom-Json
$version = $manifest.version
$zipName = "breathy-v$version.zip"
$zipPath = Join-Path $root $zipName
$staging = Join-Path $env:TEMP "breathy-zip-staging"

if (Test-Path $staging) { Remove-Item $staging -Recurse -Force }
New-Item -ItemType Directory -Force $staging | Out-Null

# Ficheros raíz
foreach ($f in 'manifest.json', 'background.js', 'content_script.js', 'popup.html', 'popup.js') {
    Copy-Item (Join-Path $root $f) $staging
}

# Carpetas completas
foreach ($d in 'modules', 'styles', '_locales') {
    Copy-Item (Join-Path $root $d) $staging -Recurse
}

# Assets: solo los referenciados por la extensión (logo.png queda fuera)
New-Item -ItemType Directory -Force (Join-Path $staging 'assets') | Out-Null
foreach ($a in 'happy.webm', 'tired.webm', 'angry.webm', 'breath.webm', 'breathy.png', 'tutorial.png') {
    Copy-Item (Join-Path $root "assets\$a") (Join-Path $staging 'assets')
}
Copy-Item (Join-Path $root 'assets\icons') (Join-Path $staging 'assets') -Recurse

if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
# Entradas construidas a mano con separador "/" : las herramientas de PowerShell 5.1
# emiten "\", que viola la especificación ZIP y puede provocar rechazos en la Web Store
Add-Type -AssemblyName System.IO.Compression
Add-Type -AssemblyName System.IO.Compression.FileSystem
$stream = [System.IO.File]::Open($zipPath, [System.IO.FileMode]::CreateNew)
$archive = New-Object System.IO.Compression.ZipArchive($stream, [System.IO.Compression.ZipArchiveMode]::Create)
Get-ChildItem $staging -Recurse -File | ForEach-Object {
    $entryName = $_.FullName.Substring($staging.Length + 1).Replace('\', '/')
    [System.IO.Compression.ZipFileExtensions]::CreateEntryFromFile($archive, $_.FullName, $entryName) | Out-Null
}
$archive.Dispose()
$stream.Dispose()
Remove-Item $staging -Recurse -Force

$sizeKB = [math]::Round((Get-Item $zipPath).Length / 1KB)
Write-Output "Creado: $zipName ($sizeKB KB)"
