@echo off
echo --- Configurando Git para el backend Husky ---
git config --global user.name "Marcelo Siles"
git config --global user.email "tuemail@ejemplo.com"

echo --- Configurando URL del remoto con tu token ---
set /p TOKEN=Introduce tu token de GitHub:
git remote set-url origin https://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@github.com/MarceloSiles/backend-asistente-husky.git

echo --- Enviando cambios al repositorio ---
git add .
git commit -m "Primer commit del backend Husky"
git push -u origin main

pause
