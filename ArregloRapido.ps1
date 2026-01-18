#!/usr/bin/env pwsh
<#
.SYNOPSIS
    Script para arreglar MongoDB y microservicios rápidamente
    
.DESCRIPTION
    Este script proporciona instrucciones claras paso a paso para:
    1. Arreglar MongoDB en EC2-DB
    2. Arreglar Microservicios en EC2-CORE
    3. Verificar que todo funciona
#>

Write-Host "
╔════════════════════════════════════════════════════════════════════╗
║                                                                    ║
║               🚀 ARREGLO RÁPIDO DEL PROYECTO                     ║
║                                                                    ║
║     Sigue estos pasos para que todo funcione en 15 minutos       ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
" -ForegroundColor Cyan

Write-Host "
📌 INSTRUCCIONES CLARAS
═══════════════════════════════════════════════════════════════════
" -ForegroundColor Yellow

Write-Host "
PASO 1: Abre AWS Console
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Ve a: https://console.aws.amazon.com/ec2
2. Selecciona región: us-east-1
3. Click en 'Instances' (lado izquierdo)
" -ForegroundColor Green

Write-Host "
PASO 2: Arregla MongoDB en EC2-DB
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Busca instancia: EC2-DB
2. Click en ella para seleccionar
3. Click botón 'Connect' (arriba a la derecha)
4. Selecciona tab: 'EC2 Instance Connect'
5. Click 'Connect' → Se abrirá terminal en navegador

6. COPIA Y PEGA ESTO EN LA TERMINAL:

" -ForegroundColor Green

$mongodb_commands = @'
docker stop mongo 2>/dev/null || true
docker rm mongo 2>/dev/null || true
docker volume create mongo_data 2>/dev/null || true

docker run -d --name mongo \
  -p 0.0.0.0:27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=root \
  -e MONGO_INITDB_ROOT_PASSWORD=example \
  -v mongo_data:/data/db \
  mongo:6.0 \
  --auth --bind_ip_all

sleep 15
docker ps -a -f name=mongo
'@

Write-Host $mongodb_commands -ForegroundColor Cyan
Write-Host "`n7. Presiona ENTER" -ForegroundColor Green
Write-Host "8. Espera 20 segundos" -ForegroundColor Green
Write-Host "9. Deberías ver algo como: 'mongo:6.0   Up 15 seconds'" -ForegroundColor Green

Write-Host "
PASO 3: Arregla Microservicios en EC2-CORE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Vuelve a Instances en AWS Console
2. Busca instancia: EC2-CORE
3. Click en ella para seleccionar
4. Click botón 'Connect' (arriba a la derecha)
5. Selecciona tab: 'EC2 Instance Connect'
6. Click 'Connect' → Se abrirá terminal en navegador

7. COPIA Y PEGA ESTO EN LA TERMINAL:

" -ForegroundColor Green

$microservices_commands = @'
docker network create core-net 2>/dev/null || true

docker stop micro-auth micro-estudiantes micro-maestros 2>/dev/null || true
docker rm micro-auth micro-estudiantes micro-maestros 2>/dev/null || true

docker run -d --name micro-auth --network core-net -p 3000:3000 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/auth?authSource=admin' \
  -e PORT=3000 \
  -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-auth:latest

docker run -d --name micro-estudiantes --network core-net -p 3001:3001 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/estudiantes?authSource=admin' \
  -e PORT=3001 \
  -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-estudiantes:latest

docker run -d --name micro-maestros --network core-net -p 3002:3002 \
  -e MONGODB_URI='mongodb://root:example@172.31.65.122:27017/maestros?authSource=admin' \
  -e PORT=3002 \
  -e NODE_ENV=production \
  --add-host=db-host:172.31.65.122 \
  arielguerron14/micro-maestros:latest

sleep 15
docker ps -a -f name=micro
'@

Write-Host $microservices_commands -ForegroundColor Cyan
Write-Host "`n8. Presiona ENTER" -ForegroundColor Green
Write-Host "9. Espera 20 segundos" -ForegroundColor Green
Write-Host "10. Deberías ver 3 contenedores: micro-auth, micro-estudiantes, micro-maestros" -ForegroundColor Green

Write-Host "
PASO 4: Verifica que Funciona
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Abre una terminal LOCAL (en tu PC) y ejecuta:

" -ForegroundColor Green

$test_commands = @'
# Test 1: Health checks (deberían ser instantáneos)
curl http://35.168.216.132:8080/health
curl http://35.168.216.132:8080/auth/health

# Test 2: CRÍTICO - Register endpoint
curl -X POST http://35.168.216.132:8080/auth/register `
  -H 'Content-Type: application/json' `
  -d '{
    "email":"test@example.com",
    "password":"Test123!",
    "name":"Test User"
  }'
'@

Write-Host $test_commands -ForegroundColor Cyan

Write-Host "
✅ Esperado ver respuesta JSON con datos de usuario creado
   Si ves TIMEOUT = MongoDB aún no funciona

PASO 5: Prueba en Navegador
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

1. Abre: http://3.231.12.130:5500
2. Click 'Registrar'
3. Ingresa:
   - Email: test@ejemplo.com
   - Contraseña: Test123!
   - Nombre: Test
4. Click 'Registrarse'
5. Deberías ver: '✅ Cuenta creada exitosamente'
6. Click 'Ingresar'
7. Ingresa mismas credenciales
8. Presiona 'Ingresar'
9. Deberías ver: Dashboard

" -ForegroundColor Green

Write-Host "
✅ CHECKLIST FINAL
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[ ] MongoDB arreglado en EC2-DB
[ ] Microservicios arreglados en EC2-CORE
[ ] curl /auth/register retorna JSON con usuario
[ ] Browser registro funciona
[ ] Browser login funciona
[ ] Dashboard visible

" -ForegroundColor Yellow

Write-Host "
⏱️  TIEMPO TOTAL: 15 minutos
   - Arreglo MongoDB: 3 min
   - Arreglo Microservicios: 3 min
   - Tests locales: 2 min
   - Browser: 2 min
   - Buffer: 5 min

" -ForegroundColor Cyan

Write-Host "
🎉 Si TODO funciona, el proyecto está LISTO! 🚀

Pregunta: ¿Necesitas ayuda con algún paso?
   
" -ForegroundColor Green

Write-Host "
═══════════════════════════════════════════════════════════════════
Presiona cualquier tecla para salir...
═══════════════════════════════════════════════════════════════════
" -ForegroundColor Cyan

$null = Read-Host
