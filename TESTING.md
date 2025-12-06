# 🧪 Guía de Testing - Proyecto Acompañamiento

Documentación completa para testing manual y automatizado del sistema.

---

## 📋 Testing Manual - Casos de Uso

### 1. Login Exitoso

**Pasos:**
1. Abre http://localhost:5500/login.html
2. Haz clic en "Iniciar Sesión"
3. Email: `admin@sistema.com`
4. Contraseña: `admin123`
5. Haz clic en "Entrar"

**Resultado esperado:**
✅ Redirige a `index.html`  
✅ Muestra nombre de usuario en header  
✅ Token guardado en localStorage

**Para verificar:**
```javascript
// En consola del navegador (F12)
localStorage.getItem('token')    // Debe retornar JWT
localStorage.getItem('user')     // Debe retornar JSON con user data
```

---

### 2. Login Fallido - Credenciales Inválidas

**Pasos:**
1. Abre http://localhost:5500/login.html
2. Haz clic en "Iniciar Sesión"
3. Email: `admin@sistema.com`
4. Contraseña: `wrongpassword`
5. Haz clic en "Entrar"

**Resultado esperado:**
✅ Muestra error: "Credenciales inválidas"  
✅ NO redirige  
✅ NO guarda token

---

### 3. Registro Exitoso

**Pasos:**
1. Abre http://localhost:5500/login.html
2. Haz clic en "Registro"
3. Nombre: `Juan Pérez`
4. Email: `juan@ejemplo.com`
5. Contraseña: `password123`
6. Confirmar: `password123`
7. Rol: Estudiante
8. Haz clic en "Crear Cuenta"

**Resultado esperado:**
✅ Muestra: "✓ Cuenta creada exitosamente! Redirigiendo..."  
✅ Redirige a `estudiante.html` (porque eligió "estudiante")  
✅ Token guardado en localStorage

---

### 4. Registro Fallido - Contraseña Corta

**Pasos:**
1. Abre http://localhost:5500/login.html
2. Haz clic en "Registro"
3. Nombre: `Juan`
4. Email: `juan2@ejemplo.com`
5. Contraseña: `pass` (menos de 6 caracteres)
6. Confirmar: `pass`
7. Haz clic en "Crear Cuenta"

**Resultado esperado:**
✅ Muestra error: "La contraseña debe tener al menos 6 caracteres"  
✅ NO redirige

---

### 5. Registro Fallido - Email Duplicado

**Pasos:**
1. Registra con `test1@ejemplo.com`
2. Intenta registrar nuevamente con `test1@ejemplo.com`

**Resultado esperado:**
✅ Muestra error: "El email ya está registrado"  
✅ NO redirige

---

### 6. Logout

**Pasos:**
1. Inicia sesión exitosamente
2. Verás botón "Cerrar Sesión" en header
3. Haz clic en "Cerrar Sesión"

**Resultado esperado:**
✅ Redirige a `login.html`  
✅ localStorage vacío (tokens removidos)

**Para verificar:**
```javascript
localStorage.getItem('token')    // Debe ser null
localStorage.getItem('user')     // Debe ser null
```

---

### 7. Acceso a Panel sin Autenticación

**Pasos:**
1. Intenta acceder directamente a: http://localhost:5500/index.html
2. Sin estar logueado

**Resultado esperado:**
✅ Redirige automáticamente a `login.html`

---

## 🔌 Testing de API - Con Curl o Postman

### 1. Login via API

**Comando:**
```bash
curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@sistema.com",
    "password": "admin123"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresIn": "15m",
  "user": {
    "userId": "admin-001",
    "email": "admin@sistema.com",
    "role": "admin"
  }
}
```

---

### 2. Registro via API

**Comando:**
```bash
curl -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@ejemplo.com",
    "password": "password123",
    "name": "New User",
    "role": "estudiante"
  }'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": "15m",
  "user": {
    "userId": "est-1234567890",
    "email": "newuser@ejemplo.com",
    "role": "estudiante",
    "name": "New User"
  }
}
```

---

### 3. Verificar Token

**Comando:**
```bash
curl -X POST http://localhost:8080/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

**Respuesta esperada:**
```json
{
  "valid": true,
  "payload": {
    "userId": "admin-001",
    "role": "admin",
    "email": "admin@sistema.com",
    "iat": 1764967936,
    "exp": 1764968836
  }
}
```

---

### 4. Renovar Token

**Comando:**
```bash
curl -X POST http://localhost:8080/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{"refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."}'
```

**Respuesta esperada:**
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

## 🐛 Testing de Errores

### 1. Token Expirado

**Escenario:** Usar un token con `exp` anterior a la fecha actual

**Resultado esperado:**
```json
{
  "valid": false,
  "error": "Token expirado"
}
```

---

### 2. Token Inválido

**Escenario:** Usar string aleatorio como token

**Resultado esperado:**
```json
{
  "valid": false,
  "error": "Invalid token"
}
```

---

### 3. CORS Error

**Escenario:** Solicitud desde origen no permitido

**Resultado esperado:**
```
CORS error in console
Response blocked by browser
```

---

## ✅ Checklist de Testing Completo

```
LOGIN
□ Login exitoso con credenciales válidas
□ Login fallido con password incorrecto
□ Login fallido con email no registrado
□ Mensaje de error mostrado correctamente
□ Token almacenado en localStorage
□ Redirige al dashboard correcto

REGISTRO
□ Registro exitoso con todos los datos
□ Registro fallido - email duplicado
□ Registro fallido - contraseña muy corta
□ Registro fallido - contraseñas no coinciden
□ Mensaje de error mostrado correctamente
□ Redirige al dashboard (estudiante/maestro)

NAVEGACIÓN
□ Logout funcionando
□ localStorage limpio después de logout
□ Redirige a login sin autenticación
□ Botón "Cerrar Sesión" visible en header
□ Nombre de usuario mostrado en header

TOKENS
□ accessToken guardado
□ refreshToken guardado
□ Token incluido en requests (Authorization header)
□ Token renovable con refresh
□ Token inválido genera error 401

CORS
□ Requests desde http://localhost:5500 permitidas
□ Requests desde http://localhost:8080 funcionan
□ Métodos POST/GET/OPTIONS permitidos
□ Headers personalizados permitidos

ERRORES
□ "Credenciales inválidas" para login fallido
□ "Email ya registrado" para duplicado
□ "Contraseña muy corta" si < 6 caracteres
□ "Contraseñas no coinciden" si no match
□ "NetworkError" si server no responde
```

---

## 📊 Testing de Performance

### Medir Tiempo de Login

```bash
time curl -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"admin123"}'
```

**Resultado esperado:**
- < 100ms en desarrollo local

### Medir Tiempo de Carga de Frontend

```javascript
// En consola del navegador
performance.measure('pageLoad')
console.log(performance.getEntriesByType('measure'))
```

**Resultado esperado:**
- < 1s para cargar login.html
- < 2s para cargar index.html

---

## 🔐 Testing de Seguridad

### 1. Verificar que Password NO se guarda

```javascript
// En console del navegador
localStorage // NO debe contener password
```

**Esperado:** Solo contiene `token` y `user` (sin password)

### 2. Verificar CORS Preflight

```bash
curl -i -X OPTIONS http://localhost:8080/auth/register \
  -H "Origin: http://localhost:5500" \
  -H "Access-Control-Request-Method: POST"
```

**Esperado:**
```
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://localhost:5500
Access-Control-Allow-Methods: GET,POST,PUT,DELETE,OPTIONS,PATCH,HEAD
```

---

## 🤖 Automatización (Opcional)

### Script de Testing Automatizado

```bash
#!/bin/bash
# test.sh

echo "🧪 Testing Proyecto Acompañamiento"

# Test 1: Login
echo "✓ Test 1: Login exitoso"
curl -s -X POST http://localhost:8080/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sistema.com","password":"admin123"}' | grep -q "success"

# Test 2: Registro
echo "✓ Test 2: Registro exitoso"
curl -s -X POST http://localhost:8080/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test'$RANDOM'@test.com","password":"pass123","name":"Test","role":"estudiante"}' | grep -q "success"

echo "✅ All tests passed!"
```

---

## 📝 Reporte de Testing

### Template para Documentar Bugs

```markdown
**Descripción:** [Descripción clara del problema]

**Pasos para Reproducir:**
1. [Paso 1]
2. [Paso 2]
3. [Paso 3]

**Resultado Actual:** [Qué pasó]

**Resultado Esperado:** [Qué debería pasar]

**Evidencia:**
- Screenshot/Video
- Console error
- Network tab

**Severidad:** [Critical/High/Medium/Low]

**Ambiente:**
- Browser: Chrome 120
- OS: Windows 10
- Timestamp: 2025-12-05 20:30
```

---

## 🚀 Próximos Pasos

1. Automatizar tests con Jest o Mocha
2. Testing de E2E con Cypress o Playwright
3. Testing de performance con Lighthouse
4. Load testing con k6 o Artillery

---

**Última actualización:** Diciembre 5, 2025
