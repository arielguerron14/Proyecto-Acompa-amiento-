# 🚀 Quick Start - Proyecto Acompañamiento

Guía rápida para desarrolladores que quieren empezar en 5 minutos.

## ⏱️ 5 Minutos para Comenzar

### Paso 1: Requisitos (1 min)
```bash
# Verificar Node.js
node --version  # Debe ser 18+
npm --version   # Debe ser 9+
```

### Paso 2: Clonar Proyecto (1 min)
```bash
git clone <repo-url>
cd Proyecto-Acompa-amiento-
```

### Paso 3: Instalar Dependencias (2 min)
```bash
# Instalar API Gateway
cd api-gateway
npm install
cd ..

# Instalar shared-auth
cd shared-auth
npm install
cd ..
```

### Paso 4: Ejecutar Servicios (1 min)

**Terminal 1: API Gateway**
```bash
cd api-gateway
npm start
```

Deberías ver:
```
info: API Gateway listening on port 8080 (0.0.0.0)
```

**Terminal 2: Frontend**
```bash
# Primera vez (instalar http-server globalmente)
npm install -g http-server

cd frontend-web
http-server ./public -p 5500 -c-1
```

O si usas Windows con el script batch:
```batch
start-frontend.bat
```

### Paso 5: Acceder al Navegador (0 min)

```
http://localhost:5500/login.html
```

✅ **¡Listo!** Ya puedes probar login y registro.

---

## 🔐 Probar el Login

### Usuario de Prueba:
```
Email: admin@sistema.com
Password: admin123
```

### Prueba rápida desde Terminal:

```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"admin123"}'
```

Deberías recibir:
```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": { "userId": "admin-001", "email": "admin@sistema.com", "role": "admin" }
}
```

---

## 📚 Casos de Uso

### 1. Probar Login en el Navegador
```
1. Abre http://localhost:5500/login.html
2. Haz clic en "Iniciar Sesión"
3. Ingresa: admin@sistema.com / admin123
4. Haz clic en "Entrar"
```

### 2. Probar Registro en el Navegador
```
1. Abre http://localhost:5500/login.html
2. Haz clic en "Registro"
3. Completa el formulario
4. Haz clic en "Crear Cuenta"
```

### 3. Probar Logout
```
1. Luego de iniciar sesión, verás un botón "Cerrar Sesión"
2. Haz clic
3. Serás redirigido a login.html
```

### 4. Cambiar de Rol
En el registro, elige entre:
- **estudiante** (acceso a panel de estudiante)
- **maestro** (acceso a panel de maestro)
- **admin** (acceso completo)

---

## 🛠️ Comandos Útiles

### Reinstalar Dependencias
```bash
rm -r node_modules package-lock.json
npm install
```

### Ver Qué Está Corriendo
```bash
netstat -ano | findstr :8080    # API Gateway
netstat -ano | findstr :5500    # Frontend
```

### Matar Proceso en Puerto
```powershell
# Encontrar
netstat -ano | findstr :8080

# Matar (reemplaza 1234 con el PID)
taskkill /PID 1234 /F
```

### Limpiar Cache del Navegador
```
F12 → Application → Storage → Clear All
O presiona Ctrl+Shift+R para hard refresh
```

---

## ⚠️ Problemas Comunes

### Error: "Port 8080 already in use"
```bash
# Buscar el proceso
netstat -ano | findstr :8080

# Matar el proceso
taskkill /PID <PID> /F

# Reintentar
npm start
```

### Error: "Failed to fetch"
```
1. Verifica que ambos servidores están corriendo
2. Recarga con Ctrl+Shift+R
3. Abre DevTools (F12) → Console para ver errores
```

### Error: "CORS blocked"
```
1. Asegúrate de usar http://localhost (no 127.0.0.1)
2. Recarga el navegador
3. Verifica que el API Gateway está en http://localhost:8080
```

### Error: "handleLogout is not defined"
```
✅ Ya está arreglado en este proyecto
Si lo ves de todas formas, abre un issue
```

---

## 📖 Archivos Importantes

### Estructura Mínima para Desarrollo Local

```
api-gateway/
├── server.js               # Punto de entrada
├── src/
│   └── routes/
│       └── authRoutes.js   # Endpoints de autenticación
└── package.json

frontend-web/
├── public/
│   ├── login.html          # Página de login
│   ├── index.html          # Panel maestros
│   ├── estudiante.html     # Panel estudiantes
│   └── styles.css          # Estilos
└── package.json

shared-auth/
├── src/
│   └── services/
│       └── authService.js  # Lógica JWT
└── package.json
```

---

## 🔑 Credenciales de Prueba

```
┌─────────────────────┬────────────────────┐
│ Email               │ Password           │
├─────────────────────┼────────────────────┤
│ admin@sistema.com   │ admin123           │
│ maestro@sistema.com │ maestro123         │
│ estudiante@...com   │ estudiante123      │
│ auditor@...com      │ auditor123         │
└─────────────────────┴────────────────────┘
```

---

## 🎯 Próximos Pasos

Después de probar login y registro:

1. **Explorar Microservicios** → Leer `MICROSERVICES_GUIDE.md`
2. **Entender Autenticación** → Leer `AUTH_DOCUMENTATION.md`
3. **Ver Arquitectura** → Leer `ARCHITECTURE_DIAGRAMS.md`
4. **Iniciar Docker Compose** para ambiente completo:
   ```bash
   docker-compose up -d
   ```

---

## 📱 API Endpoints Rápidos

```bash
# Login
POST /auth/login
Body: {"email":"admin@sistema.com","password":"admin123"}

# Registro
POST /auth/register
Body: {"email":"nuevo@test.com","password":"pass123","name":"User","role":"estudiante"}

# Verificar Token
POST /auth/verify-token
Body: {"token":"<JWT>"}

# Renovar Token
POST /auth/refresh
Body: {"refreshToken":"<REFRESH_TOKEN>"}

# Cerrar Sesión
POST /auth/logout
Header: Authorization: Bearer <JWT>
```

---

## 💡 Tips Profesionales

✅ **Siempre**
- Usa `http://localhost` (no `127.0.0.1`)
- Abre DevTools (F12) para ver errores reales
- Mantén ambas terminales visibles

❌ **Nunca**
- Guardes tokens en el código
- Expongas secretos en `package.json`
- Uses `eval()` en JavaScript

🔧 **Cuando Falle**
1. Recarga el navegador (Ctrl+Shift+R)
2. Mira la consola (F12)
3. Reinicia ambos servidores
4. Abre el README.md principal

---

**¿Necesitas ayuda?** Revisa la sección de "Resolución de Problemas" en el [README.md](./README.md) principal.

**¿Listo para más?** Lee la [documentación completa](./README.md).

---

**Última actualización:** Diciembre 5, 2025
