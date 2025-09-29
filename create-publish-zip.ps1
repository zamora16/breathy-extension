# 🚀 Script para crear ZIP limpio de Chrome Web Store
# Ejecutar desde la carpeta del proyecto

Write-Host "🚀 Creando ZIP para Chrome Web Store..." -ForegroundColor Green

# Definir archivos y carpetas a incluir
$essentialFiles = @(
    "manifest.json",
    "background.js", 
    "content_script.js",
    "popup.html",
    "popup.js"
)

$essentialFolders = @(
    "modules",
    "styles", 
    "assets",
    "_locales"
)

# Crear directorio temporal
$tempDir = "breathy-extension-publish"
if (Test-Path $tempDir) {
    Remove-Item $tempDir -Recurse -Force
}
New-Item -ItemType Directory -Path $tempDir | Out-Null

# Copiar archivos esenciales
Write-Host "✅ Copiando archivos esenciales..." -ForegroundColor Cyan
foreach ($file in $essentialFiles) {
    if (Test-Path $file) {
        Copy-Item $file -Destination $tempDir
        Write-Host "   • $file" -ForegroundColor Gray
    } else {
        Write-Warning "   ⚠️  Archivo no encontrado: $file"
    }
}

# Copiar carpetas esenciales
Write-Host "✅ Copiando carpetas..." -ForegroundColor Cyan
foreach ($folder in $essentialFolders) {
    if (Test-Path $folder) {
        Copy-Item $folder -Destination $tempDir -Recurse
        $itemCount = (Get-ChildItem -Path "$tempDir\$folder" -Recurse).Count
        Write-Host "   • $folder ($itemCount archivos)" -ForegroundColor Gray
    } else {
        Write-Warning "   ⚠️  Carpeta no encontrada: $folder"
    }
}

# Crear ZIP
$zipName = "breathy-extension-v1.0.0.zip"
Write-Host "📦 Creando $zipName..." -ForegroundColor Yellow

if (Test-Path $zipName) {
    Remove-Item $zipName -Force
}

Compress-Archive -Path "$tempDir\*" -DestinationPath $zipName

# Verificar tamaño
$zipSize = (Get-Item $zipName).Length / 1MB
Write-Host "📏 Tamaño del ZIP: $([math]::Round($zipSize, 2)) MB" -ForegroundColor Magenta

if ($zipSize -gt 128) {
    Write-Warning "⚠️  ADVERTENCIA: El ZIP supera los 128MB (límite de Chrome Web Store)"
} else {
    Write-Host "✅ Tamaño correcto para Chrome Web Store" -ForegroundColor Green
}

# Limpiar directorio temporal
Remove-Item $tempDir -Recurse -Force

# Mostrar contenido del ZIP
Write-Host "📋 Contenido del ZIP:" -ForegroundColor Cyan
$zip = [System.IO.Compression.ZipFile]::OpenRead((Resolve-Path $zipName))
$zip.Entries | ForEach-Object { 
    Write-Host "   • $($_.FullName)" -ForegroundColor Gray 
}
$zip.Dispose()

Write-Host ""
Write-Host "🎉 ¡ZIP listo para Chrome Web Store!" -ForegroundColor Green
Write-Host "📁 Archivo: $zipName" -ForegroundColor White
Write-Host ""
Write-Host "📋 Próximos pasos:" -ForegroundColor Yellow
Write-Host "   1. Ve a https://chrome.google.com/webstore/devconsole" -ForegroundColor Gray
Write-Host "   2. Sube $zipName" -ForegroundColor Gray
Write-Host "   3. Completa la información de la extensión" -ForegroundColor Gray
Write-Host "   4. Envía para revisión" -ForegroundColor Gray

Read-Host "Presiona Enter para continuar"