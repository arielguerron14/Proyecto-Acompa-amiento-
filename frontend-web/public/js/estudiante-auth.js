// estudiante-auth.js - Gestión de autenticación y datos del usuario para estudiantes

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        this.baseURL = window.API_CONFIG ? window.API_CONFIG.API_BASE : 'http://localhost:8080';
    }

    // Verificar si hay sesión activa
    async checkSession() {
        // Si ya tenemos token local, la sesión parece activa
        if (this.token) return true;

        // Intentar validar sesión por cookie (backend podría usar cookies en vez de tokens)
        try {
            const res = await fetch(`${this.baseURL}/auth/me`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' }
            });
            if (res.ok) {
                const profile = await res.json();
                const userFromProfile = profile.user || profile;
                if (userFromProfile) {
                    this.user = {
                        id: userFromProfile.userId || userFromProfile.id || null,
                        name: userFromProfile.name || userFromProfile.nombre || 'Estudiante',
                        role: userFromProfile.role || userFromProfile.rol || 'estudiante'
                    };
                    try { localStorage.setItem('user', JSON.stringify(this.user)); } catch (e) { }
                    return true;
                }
            }
        } catch (err) {
            // Ignorar y redirigir al login abajo
            console.warn('No se pudo validar sesión por cookie:', err);
        }

        // No hay sesión válida -> redirigir a login
        window.location.href = '/';
        return false;
    }

    // Obtener datos del usuario desde el token
    async getUserData() {
        // Intentar decodificar token si parece un JWT
        if (this.token && this.token.split && this.token.split('.').length === 3) {
            try {
                const payload = JSON.parse(atob(this.token.split('.')[1]));
                this.user = {
                    id: payload.userId,
                    name: payload.name || 'Estudiante',
                    role: payload.roles ? payload.roles[0] : (payload.role || 'estudiante')
                };

                // Verificar que sea estudiante
                if (this.user.role !== 'estudiante') {
                    this.showMessage('Acceso denegado. Solo para estudiantes.', 'error');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                    return null;
                }

                return this.user;
            } catch (error) {
                console.warn('Error al decodificar token JWT:', error);
                // continuar para intentar otras estrategias
            }
        }

        // Si no es un JWT o la decodificación falló, intentar obtener perfil desde /auth/me
        try {
            const res = await fetch(`${this.baseURL}/auth/me`, {
                method: 'GET',
                headers: this.getAuthHeaders()
            });
            if (res.ok) {
                const profile = await res.json();
                const userFromProfile = profile.user || profile;
                if (userFromProfile) {
                    this.user = {
                        id: userFromProfile.userId || userFromProfile.id || null,
                        name: userFromProfile.name || userFromProfile.nombre || 'Estudiante',
                        role: userFromProfile.role || userFromProfile.rol || 'estudiante'
                    };

                    if (this.user.role !== 'estudiante') {
                        this.showMessage('Acceso denegado. Solo para estudiantes.', 'error');
                        setTimeout(() => {
                            window.location.href = '/';
                        }, 2000);
                        return null;
                    }

                    // Guardar user en localStorage para reutilizar
                    try { localStorage.setItem('user', JSON.stringify(this.user)); } catch (e) { }
                    return this.user;
                }
            }
        } catch (err) {
            console.warn('No se pudo obtener perfil desde /auth/me:', err);
        }

        // Como fallback, usar lo que haya en localStorage
        try {
            const raw = localStorage.getItem('user');
            if (raw) {
                const parsed = JSON.parse(raw);
                this.user = {
                    id: parsed.userId || parsed.id || null,
                    name: parsed.name || parsed.nombre || 'Estudiante',
                    role: parsed.role || parsed.rol || 'estudiante'
                };

                if (this.user.role !== 'estudiante') {
                    this.showMessage('Acceso denegado. Solo para estudiantes.', 'error');
                    setTimeout(() => {
                        window.location.href = '/';
                    }, 2000);
                    return null;
                }

                return this.user;
            }
        } catch (e) {
            console.warn('Error leyendo user desde localStorage:', e);
        }

        // Si no se obtuvo nada, cerrar sesión por seguridad
        this.logout();
        return null;
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    }

    // Obtener headers para requests autenticados
    getAuthHeaders() {
        return {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
    }

    // Mostrar mensaje de estado
    showMessage(message, type = 'info') {
        const statusMessage = document.getElementById('status-message');
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
            statusMessage.style.display = 'block';

            setTimeout(() => {
                statusMessage.style.display = 'none';
            }, 5000);
        }
    }
}

// Instancia global
const authManager = new AuthManager();

// Inicializar cuando se carga la página
document.addEventListener('DOMContentLoaded', async () => {
    // Verificar sesión (ahora puede validar por token o cookie)
    if (!await authManager.checkSession()) {
        return;
    }

    // Obtener datos del usuario
    const user = await authManager.getUserData();
    if (user) {
        // Actualizar UI con datos del usuario
        const userNameElement = document.getElementById('user-name');
        if (userNameElement) {
            userNameElement.textContent = user.name;
        }

        // Configurar botón de logout
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => {
                authManager.logout();
            });
        }
    }
});