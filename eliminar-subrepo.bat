rem cd C:\Ruta\Donde\Esta\Tu\Proyecto

REM Verificá si hay un repositorio Git
if not exist ".git" (
    echo Inicializando nuevo repositorio Git...
    git init
    git remote add origin https://github.com/MarceloSiles/backend-asistente-husky.git
)

REM Ahora eliminamos el subrepo si existe
if exist "backend-asistente-husky" (
    echo Eliminando del índice el subrepo embebido...
    git rm -r -f --cached backend-asistente-husky

    echo Borrando carpeta .git interna del subrepo...
    rmdir /s /q backend-asistente-husky\.git

    echo Haciendo commit de limpieza...
    git add .
    git commit -m "Eliminado subrepositorio embebido"
    git push origin main || git push origin deploy || echo "Error al hacer push. Revisar rama activa."
) else (
    echo No se encontró la carpeta backend-asistente-husky
)

pause