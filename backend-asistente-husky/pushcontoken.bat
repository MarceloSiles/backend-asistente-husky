@echo off
echo ============================================
echo   Push inicial a una rama nueva: dev
echo ============================================

git checkout -B dev

git add .
git commit -m "Bootstrap rama dev para sortear reglas de main"

git push -u origin dev

echo ============================================
echo   Rama dev subida correctamente
echo ============================================
pause
@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Push a GitHub con Token Personal (PAT)
echo ========================================

:: Pedir nombre de usuario
set /p GIT_USER=Ingresá tu nombre de usuario de GitHub:

:: Pedir token personal (oculto no se puede, pero se puede borrar luego)
set /p GIT_TOKEN=Pegá tu token personal (PAT):

:: Configurar URL con token embebido
set GIT_URL=https://%GIT_USER%:%GIT_TOKEN%@github.com/MarceloSiles/backend-asistente-husky.git

:: Configurar helper para recordar token
git config --global credential.helper manager

:: Setear origen con token (temporalmente)
git remote set-url origin !GIT_URL!

:: Agregar y commitear
git add .
git commit -m "Deploy desde BAT con token"

:: Push a origin
git push -u origin main

:: Restaurar URL limpia (sin token)
git remote set-url origin https://github.com/MarceloSiles/backend-asistente-husky.git

echo.
echo ----------------------------------------
echo Proceso finalizado. Revisá si hubo errores.
echo.
pause
