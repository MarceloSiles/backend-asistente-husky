@echo off
setlocal

echo.
echo ============================================
echo   PUSH AUTOMÁTICO A GITHUB - PUBLIC RELEASE
echo ============================================
echo.

REM Configura los datos de GitHub
set GITHUB_USER=MarceloSiles
set GITHUB_TOKEN=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
set REPO_NAME=backend-asistente-husky
set BRANCH=public-release
set REMOTE=https://%GITHUB_USER%:%GITHUB_TOKEN%@github.com/%GITHUB_USER%/%REPO_NAME%.git

REM Inicializa el repositorio si no existe
if not exist ".git" (
    echo Inicializando repositorio Git...
    git init
    git remote add origin %REMOTE%
) else (
    echo Repositorio Git ya inicializado.
)

REM Crea y cambia a la nueva rama
git checkout -B %BRANCH%

REM Agrega todos los archivos y hace commit
git add .
git commit -m "Versión pública del asistente Husky"

REM Push a GitHub (rama no protegida)
git push -u origin %BRANCH%

echo.
echo ✅ PUSH COMPLETADO A: %BRANCH%
pause
