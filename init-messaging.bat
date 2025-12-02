@echo off
REM Script de inicialización del sistema de mensajería para Windows
REM Uso: init-messaging.bat

setlocal enabledelayedexpansion

echo.
echo ========================================
echo  Inicializando Sistema de Mensajería Global
echo ========================================
echo.

REM Verificar Docker
docker --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Docker no encontrado. Por favor instala Docker Desktop.
  exit /b 1
)
echo [OK] Docker encontrado

REM Verificar Docker Compose
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Docker Compose no encontrado.
  exit /b 1
)
echo [OK] Docker Compose encontrado

REM Verificar Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
  echo [ERROR] Node.js no encontrado.
  exit /b 1
)
echo [OK] Node.js encontrado

echo.
echo ========================================
echo  Iniciando contenedores
echo ========================================
echo.

docker-compose up -d kafka zookeeper rabbitmq mqtt kafka-ui

echo.
echo ========================================
echo  Esperando a que servicios se inicien
echo ========================================
echo.

echo Esperando 10 segundos...
timeout /t 10 /nobreak

echo.
echo ========================================
echo  Creando tópicos en Kafka
echo ========================================
echo.

setlocal
for %%T in (reservas horarios usuarios reportes notificaciones errores) do (
  echo Creando tópico: %%T
  docker exec proyecto-kafka kafka-topics.sh ^
    --create ^
    --topic %%T ^
    --bootstrap-server localhost:9092 ^
    --partitions 3 ^
    --replication-factor 1 ^
    --if-not-exists 2>nul
)
endlocal

echo.
echo ========================================
echo  Instalando dependencias
echo ========================================
echo.

cd message-broker
call npm install
cd ..

echo.
echo ========================================
echo  INFORMACIÓN DE ACCESO
echo ========================================
echo.

echo [KAFKA]
echo   Broker: kafka:9092
echo   Dashboard: http://localhost:8081
echo.

echo [RABBITMQ]
echo   AMQP: amqp://guest:guest@localhost:5672
echo   Management: http://localhost:15672
echo   Usuario: guest
echo   Contraseña: guest
echo.

echo [MQTT]
echo   Broker: mqtt://localhost:1883
echo   WebSocket: ws://localhost:9001
echo.

echo.
echo ========================================
echo  INICIALIZACIÓN COMPLETADA
echo ========================================
echo.

echo El sistema de mensajería está listo para usar.
echo.
echo Próximos pasos:
echo 1. Agregar dependencia a los microservicios:
echo    npm install ../message-broker
echo.
echo 2. Configurar .env en cada microservicio
echo.
echo 3. Inicializar messaging en app.js
echo.
echo 4. Ver documentación:
echo    - MESSAGE_BROKER_SUMMARY.md
echo    - MESSAGE_BROKER_INTEGRATION.md
echo    - message-broker/README.md
echo.
echo Para detener los servicios:
echo    docker-compose down
echo.

pause
