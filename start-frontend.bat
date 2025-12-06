@echo off
cd /d "c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-\frontend-web"
REM Instalar http-server globalmente si no está disponible
npm list -g http-server >nul 2>&1
if errorlevel 1 (
    echo Instalando http-server...
    npm install -g http-server
)
REM Arrancar servidor estático en puerto 5500
http-server ./public -p 5500 -c-1
