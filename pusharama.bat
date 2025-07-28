@echo off
setlocal enabledelayedexpansion

echo ========================================
echo  Push a nueva rama "deploy" con Token
echo ========================================

set /p GIT_USER=Ingresá tu nombre de usuario de GitHub:
set /p GIT_TOKEN=Pegá tu token personal (PAT):

set GIT_URL=https://%GIT_USER%:%GIT_TOKEN%@github.com/MarceloSiles/backend-asistente-husky.git

git config --global credential.helper manager
git remote set-url origin !GIT_URL!

git checkout -b deploy
git add .
git commit -m "Primer push a rama deploy"
git push -u origin deploy

git remote set-url origin https://github.com/MarceloSiles/backend-asistente-husky.git

echo.
echo ----------------------------------------
echo Push realizado a la rama deploy.
echo Ingresá a GitHub para crear el pull request o configurarla como rama principal.
echo.
pause
