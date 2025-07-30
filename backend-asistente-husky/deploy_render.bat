@echo off
echo ============================================
echo   Deploy del backend Husky en Render
echo ============================================

:: Verificar Git instalado
git --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Git no está instalado o no está en el PATH.
    pause
    exit /b 1
)

:: Preguntar por la URL del repositorio en Render (GitHub)
set /p REPOURL=Introduce la URL del repositorio (GitHub) para Render:

:: Asegurar que estamos en la rama dev
git checkout dev

:: Push de los últimos cambios
git add .
git commit -m "Actualización para Render"
git push -u origin dev

echo ============================================
echo   Ahora ve a https://dashboard.render.com/
echo   1) Crea un nuevo servicio web
echo   2) Conecta tu repositorio con la rama dev
echo   3) Render detectará automáticamente el proyecto
echo ============================================
pause
