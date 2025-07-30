@echo off
cls
echo ============================================
echo Inicializando nuevo repositorio limpio
cd /d C:\Temporal
rd /s /q .git >nul 2>&1

echo === Inicializando Git ===
git init

echo === Creando rama 'main' ===
git checkout -b main

echo === Agregando repositorio remoto ===
git remote add origin https://github.com/MarceloSiles/backend-asistente-husky.git


echo === Agregando todos los archivos ===
git add .


echo === Commit inicial ===
git commit -m "Commit inicial sin subrepositorio embebido"


echo === Haciendo push a la rama 'main' ===
git push -u origin main

echo ============================================
echo Proceso finalizado. Si aparece un error de 'secrets', desbloquealo en:
echo https://github.com/MarceloSiles/backend-asistente-husky/security/secret-scanning
pause