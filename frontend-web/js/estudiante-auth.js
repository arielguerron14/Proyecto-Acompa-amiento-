// estudiante-auth.js - Gestión de autenticación y datos del usuario para estudiantes

class AuthManager {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = null;
        // Use /api prefix which will be proxied by the frontend server
        this.baseURL = '/api';
    }

    // Verificar si hay sesión activa
    checkSession() {
        if (!this.token) {
            window.location.href = '/';
            return false;
        }
        return true;
    }

    // Obtener datos del usuario desde el token
    async getUserData() {
        try {
            const payload = JSON.parse(atob(this.token.split('.')[1]));
            this.user = {
                id: payload.userId,
                name: payload.name || 'Estudiante',
                role: payload.roles ? payload.roles[0] : 'estudiante'
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
            console.error('Error al decodificar token:', error);
            this.logout();
            return null;
        }
    }

    // Cerrar sesión
    logout() {
        localStorage.removeItem('token');
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
    // Verificar sesión
    if (!authManager.checkSession()) {
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