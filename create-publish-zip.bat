@echo off
echo 🚀 Creando ZIP para Chrome Web Store...

REM Crear directorio temporal limpio
if exist "breathy-extension-publish" rmdir /s /q "breathy-extension-publish"
mkdir "breathy-extension-publish"

REM Copiar archivos esenciales
echo ✅ Copiando archivos esenciales...
copy manifest.json "breathy-extension-publish\"
copy background.js "breathy-extension-publish\"
copy content_script.js "breathy-extension-publish\"
copy popup.html "breathy-extension-publish\"
copy popup.js "breathy-extension-publish\"

REM Copiar carpetas necesarias
echo ✅ Copiando módulos...
xcopy /E /I modules "breathy-extension-publish\modules"

echo ✅ Copiando estilos...
xcopy /E /I styles "breathy-extension-publish\styles"

echo ✅ Copiando assets...
xcopy /E /I assets "breathy-extension-publish\assets"

echo ✅ Copiando localizaciones...
xcopy /E /I _locales "breathy-extension-publish\_locales"

REM Crear ZIP (requiere 7zip o PowerShell)
echo 📦 Creando ZIP...
powershell Compress-Archive -Path "breathy-extension-publish\*" -DestinationPath "breathy-extension-v1.0.0.zip" -Force

REM Limpiar directorio temporal
rmdir /s /q "breathy-extension-publish"

echo ✅ ZIP creado: breathy-extension-v1.0.0.zip
echo 📏 Verificar que pese menos de 128MB (límite Chrome Web Store)
echo 🚀 Listo para subir a Chrome Web Store!

pause