@echo off
echo.
echo  Creando nueva rama 'dev' y subiendo al repositorio remoto
echo ===========================================================
git init
git checkout -b dev
git add .
git commit -m "Deploy inicial en rama dev"
git remote remove origin 2>nul
git remote add origin https://github.com/MarceloSiles/backend-asistente-husky.git
git push -u origin dev
echo.
echo Proceso finalizado. Si hay errores, informalos por acá.
pause
