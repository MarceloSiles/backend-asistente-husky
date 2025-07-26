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
