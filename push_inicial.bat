@echo off
echo --- Configurando rama principal como main ---
git branch -M main

echo --- Enviando al repositorio remoto en GitHub ---
git push -u origin main

pause
