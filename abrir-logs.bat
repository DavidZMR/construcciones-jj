@echo off
echo ================================================
echo Abriendo carpeta de logs de Construcciones JJ
echo ================================================
echo.

set "LOG_DIR=%APPDATA%\Construcciones JJ"

if exist "%LOG_DIR%" (
    echo Abriendo: %LOG_DIR%
    echo.
    explorer "%LOG_DIR%"
    
    if exist "%LOG_DIR%\app-debug.log" (
        echo.
        echo Archivo de log encontrado!
        echo Abriendo app-debug.log...
        notepad "%LOG_DIR%\app-debug.log"
    ) else (
        echo.
        echo ADVERTENCIA: No se encontro el archivo app-debug.log
        echo Esto significa que la aplicacion aun no se ha ejecutado
        echo o hubo un error al crear el archivo de log.
    )
) else (
    echo.
    echo ERROR: La carpeta de logs no existe
    echo Ruta esperada: %LOG_DIR%
    echo.
    echo Esto significa que la aplicacion nunca se ha ejecutado.
    echo Por favor, ejecuta la aplicacion primero.
)

echo.
pause
