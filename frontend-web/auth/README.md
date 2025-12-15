# Sistema de Autenticación - Frontend

Sistema de autenticación moderno y profesional para el proyecto de Acompañamiento Académico, desarrollado con HTML5, CSS3 y Vanilla JavaScript.

## Características

### 🎨 Diseño Moderno
- Interfaz profesional con gradientes y efectos visuales
- Diseño responsivo para todos los dispositivos
- Animaciones suaves y transiciones elegantes
- Tipografía moderna con Google Fonts (Inter)

### 🔐 Funcionalidades de Autenticación
- **Login**: Inicio de sesión con validación en tiempo real
- **Registro**: Creación de cuentas con selección de roles
- **Roles**: Soporte para estudiantes, maestros y administradores
- **JWT**: Integración completa con tokens JWT
- **Persistencia**: Almacenamiento seguro de sesiones

### ✅ Validación Avanzada
- Validación en tiempo real de campos
- Mensajes de error contextuales
- Retroalimentación visual inmediata
- Validación de contraseñas seguras

### 📱 Experiencia de Usuario
- Navegación por tabs intuitiva
- Estados de carga y feedback
- Mensajes de éxito y error
- Accesibilidad mejorada (ARIA labels)

## Estructura de Archivos

```
auth/
├── index.html          # Página principal de autenticación
├── css/
│   ├── styles.css      # Estilos principales
│   └── responsive.css  # Estilos responsivos
└── js/
    ├── validation.js   # Validaciones de formularios
    ├── api.js         # Cliente API REST
    └── auth.js        # Lógica principal de autenticación
```

## Uso

### 1. Integración con Backend
El sistema está configurado para trabajar con el microservicio de autenticación en `http://localhost:3000`.

Endpoints utilizados:
- `POST /auth/login` - Inicio de sesión
- `POST /auth/register` - Registro de usuario
- `POST /auth/logout` - Cierre de sesión
- `GET /auth/verify` - Verificación de token

### 2. Inicio del Sistema
```bash
# Abrir en navegador
start http://localhost:3000/auth/index.html
```

### 3. Flujo de Autenticación

#### Login:
1. Usuario ingresa email y contraseña
2. Validación en tiempo real
3. Envío a API y recepción de JWT
4. Almacenamiento de token y datos de usuario
5. Redirección según rol del usuario

#### Registro:
1. Usuario selecciona rol (estudiante/maestro/admin)
2. Completa formulario con validación en tiempo real
3. Envío de datos a API
4. Mensaje de éxito y cambio automático a login

### 4. Roles y Redirecciones
- **estudiante**: `/estudiante/dashboard`
- **maestro**: `/maestro/dashboard`
- **admin**: `/admin/dashboard`

## API Reference

### ApiClient
```javascript
const apiClient = new ApiClient();

// Login
await apiClient.login(email, password);

// Registro
await apiClient.register(userData);

// Logout
await apiClient.logout();

// Verificar token
await apiClient.verifyToken();

// Usuario actual
const user = apiClient.getCurrentUser();

// Verificar autenticación
const isAuth = apiClient.isAuthenticated();
```

### AuthManager
```javascript
const authManager = new AuthManager();

// Cambiar tab
authManager.switchTab('login' | 'register');

// Seleccionar rol
authManager.selectRole('estudiante' | 'maestro' | 'admin');

// Mostrar mensajes
authManager.showSuccess(message);
authManager.showError(message);
```

## Personalización

### Colores y Tema
Los colores principales se definen en CSS variables en `styles.css`:

```css
:root {
    --primary-color: #2563eb;
    --secondary-color: #64748b;
    --success-color: #10b981;
    --error-color: #ef4444;
    --background-color: #f8fafc;
}
```

### Validaciones
Las reglas de validación se pueden modificar en `validation.js`:

```javascript
window.validators = {
    email: (value) => /* lógica de validación */,
    password: (value) => /* lógica de validación */,
    // ... más validadores
};
```

### URLs de Redirección
Las rutas de redirección se configuran en `api.js`:

```javascript
redirectByRole(user) {
    const roleRoutes = {
        admin: '/admin/dashboard',
        maestro: '/maestro/dashboard',
        estudiante: '/estudiante/dashboard'
    };
    // ...
}
```

## Compatibilidad

- **Navegadores**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Dispositivos**: Desktop, Tablet, Mobile
- **Accesibilidad**: WCAG 2.1 AA compliant

## Desarrollo

### Pruebas
```bash
# Abrir en navegador para testing manual
# Usar herramientas de desarrollo para debugging
```

### Debugging
- Console logs en todas las operaciones API
- Estados visuales para debugging de validación
- Mensajes de error detallados

## Seguridad

- **No almacenamiento de contraseñas**: Solo tokens JWT
- **HTTPS recomendado**: Para producción
- **Validación del lado cliente**: Complemento a validación del servidor
- **Protección CSRF**: Implementada en el backend

## Próximos Pasos

- [ ] Integración con OAuth (Google, Microsoft)
- [ ] Recuperación de contraseña
- [ ] Verificación de email
- [ ] Autenticación de dos factores
- [ ] Temas oscuro/claro

---

**Proyecto**: Sistema de Acompañamiento Académico
**Versión**: 1.0.0
**Fecha**: Diciembre 2024</content>
<parameter name="filePath">c:\Users\caguerronp\Documents\GitHub\Proyecto-Acompa-amiento-\frontend-web\auth\README.md