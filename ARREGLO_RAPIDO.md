# 🚀 ARREGLO RÁPIDO - PASO A PASO (5 MINUTOS)

## ⚡ MÉTODO: AWS Console EC2 Instance Connect (MÁS FÁCIL)

### PASO 1: Abre AWS Console
```
1. Ve a: https://console.aws.amazon.com/ec2
2. Inicia sesión con tus credenciales
3. Selecciona región: us-east-1
```

---

## PASO 2: Arregla MongoDB en EC2-DB

### A. Conecta a EC2-DB
```
1. Click en "Instances" (lado izquierdo)
2. Busca y selecciona: EC2-DB
3. Click en botón "Connect" (arriba)
4. Selecciona tab: "EC2 Instance Connect"
5. Click "Connect" - Se abrirá terminal en el navegador
```

### B. Copia y ejecuta estos comandos:

```bash
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
```

### ✅ Esperado Ver:
```
CONTAINER ID   IMAGE       STATUS
abc123def456   mongo:6.0   Up 10 seconds (healthy)
```

**Si ves "Up" = ¡MongoDB está corriendo!** ✅

---

## PASO 3: Arregla Microservicios en EC2-CORE

### A. Conecta a EC2-CORE
```
1. Ve a Instances de nuevo
2. Selecciona: EC2-CORE
3. Click "Connect" → "EC2 Instance Connect"
4. Click "Connect"
```

### B. Copia y ejecuta estos comandos:

```bash
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
```

### ✅ Esperado Ver:
```
CONTAINER ID   IMAGE                              STATUS
abc111         arielguerron14/micro-auth:latest   Up 10 seconds
abc222         arielguerron14/micro-estudiantes   Up 10 seconds
abc333         arielguerron14/micro-maestros      Up 10 seconds
```

**Si ves 3 contenedores "Up" = ¡Microservicios están corriendo!** ✅

---

## PASO 4: Verifica que Funciona

### Abre una terminal local y ejecuta:

```bash
# Test 1: Health checks (instantáneos)
curl http://35.168.216.132:8080/health
curl http://35.168.216.132:8080/auth/health

# Test 2: CRÍTICO - Register endpoint
curl -X POST http://35.168.216.132:8080/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email":"test-'$(date +%s)'@example.com",
    "password":"Test123!",
    "name":"Test User"
  }'
```

### ✅ Esperado:
```json
{
  "success": true,
  "user": {
    "userId": "user_12345",
    "email": "test-1234567890@example.com",
    "name": "Test User",
    "role": "student"
  }
}
```

**SI VES ESTO = ¡PROYECTO ARREGLADO!** 🎉

---

## PASO 5: Prueba en Navegador

```
1. Abre: http://3.231.12.130:5500
2. Click "Registrar"
3. Ingresa:
   - Email: cualquier@ejemplo.com
   - Contraseña: Test123!
   - Nombre: Test
4. Click "Registrarse"
5. Debería mostrar: "✅ Cuenta creada exitosamente"
6. Click "Ingresar"
7. Ingresa las mismas credenciales
8. Presiona "Ingresar"
9. Deberías ver: Dashboard ✅
```

---

## 🎯 Checklist Final

- [ ] MongoDB está corriendo (Step 2 ✅)
- [ ] Microservicios están corriendo (Step 3 ✅)
- [ ] curl /auth/register retorna 201 Created (Step 4 ✅)
- [ ] Browser registro funciona (Step 5 ✅)
- [ ] Browser login funciona (Step 5 ✅)

---

## ⚠️ Si algo falla:

### MongoDB no inicia
```bash
# En EC2-DB, verifica logs
docker logs mongo | tail -20
```

### Microservicios no conectan a MongoDB
```bash
# En EC2-CORE
docker logs micro-auth | grep -i mongo | tail -10
```

### Endpoints aún hacen timeout
```bash
# Verifica que MongoDB esté realmente corriendo
docker exec mongo mongosh mongodb://root:example@localhost:27017/admin --authenticationDatabase admin --eval "db.adminCommand('ping')"
```

---

## ⏱️ Tiempo Total: ~15 minutos

- EC2-DB arreglo: 3 min
- EC2-CORE arreglo: 3 min
- Tests: 2 min
- Browser: 2 min
- **TOTAL: 10-15 minutos** ✅

---

## 🎉 ¡LISTO!

Después de completar todos los pasos, tu proyecto estará:
- ✅ Completamente funcional
- ✅ Listo para browser testing
- ✅ Listo para producción

**¡AHORA HAZLO!** 🚀
