/**
 * Módulo de Integración con API REST
 * Sistema de Acompañamiento Académico
 */

class ApiClient {
    constructor() {
        this.baseURL = 'http://localhost:8080'; // API Gateway
        this.token = localStorage.getItem('authToken');
    }

    /**
     * Realiza una petición HTTP
     * @param {string} endpoint - Endpoint de la API
     * @param {Object} options - Opciones de la petición
     * @returns {Promise<Object>} Respuesta de la API
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Agregar token si existe
        if (this.token && !config.headers.Authorization) {
            config.headers.Authorization = `Bearer ${this.token}`;
        }

        // Agregar body si es necesario
        if (options.data) {
            config.body = JSON.stringify(options.data);
        }

        try {
            const response = await fetch(url, config);
            const data = await response.json();

            if (!response.ok) {
                throw {
                    status: response.status,
                    message: data.message || 'Error en la petición',
                    data
                };
            }

            return data;
        } catch (error) {
            if (error.status) {
                throw error; // Error de API
            } else {
                throw {
                    status: 0,
                    message: 'Error de conexión. Verifica tu conexión a internet.',
                    data: null
                };
            }
        }
    }

    /**
     * Login de usuario
     * @param {string} email - Correo electrónico
     * @param {string} password - Contraseña
     * @returns {Promise<Object>} Datos del usuario y token
     */
    async login(email, password) {
        const response = await this.request('/auth/login', {
            method: 'POST',
            data: { email, password }
        });

        // Guardar token
        if (response.token) {
            this.token = response.token;
            localStorage.setItem('authToken', response.token);
            localStorage.setItem('userData', JSON.stringify(response.user));
        }

        return response;
    }

    /**
     * Registro de usuario
     * @param {Object} userData - Datos del usuario
     * @returns {Promise<Object>} Respuesta del registro
     */
    async register(userData) {
        // Transformar datos para que coincidan con la API
        const fullName = userData.apellido
            ? `${userData.nombre} ${userData.apellido}`.trim()
            : userData.nombre;

        const apiData = {
            name: fullName,
            email: userData.email,
            password: userData.password,
            role: userData.rol
        };

        const response = await this.request('/auth/register', {
            method: 'POST',
            data: apiData
        });

        return response;
    }

    /**
     * Logout de usuario
     * @returns {Promise<Object>} Respuesta del logout
     */
    async logout() {
        const response = await this.request('/auth/logout', {
            method: 'POST'
        });

        // Limpiar datos locales
        this.token = null;
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        return response;
    }

    /**
     * Verificar token actual
     * @returns {Promise<Object>} Datos del usuario si el token es válido
     */
    async verifyToken() {
        try {
            const response = await this.request('/auth/verify');
            return response;
        } catch (error) {
            // Token inválido, limpiar datos
            this.logout();
            throw error;
        }
    }

    /**
     * Refresh token
     * @returns {Promise<Object>} Nuevo token
     */
    async refreshToken() {
        try {
            const response = await this.request('/auth/refresh', {
                method: 'POST'
            });

            if (response.token) {
                this.token = response.token;
                localStorage.setItem('authToken', response.token);
            }

            return response;
        } catch (error) {
            this.logout();
            throw error;
        }
    }

    /**
     * Obtener datos del usuario actual
     * @returns {Object|null} Datos del usuario o null
     */
    getCurrentUser() {
        const userData = localStorage.getItem('userData');
        return userData ? JSON.parse(userData) : null;
    }

    /**
     * Verificar si el usuario está autenticado
     * @returns {boolean} True si está autenticado
     */
    isAuthenticated() {
        return !!this.token && !!this.getCurrentUser();
    }

    /**
     * Redireccionar según rol del usuario
     * @param {Object} user - Datos del usuario
     */
    redirectByRole(user) {
        const roleRoutes = {
            admin: '/admin/dashboard',
            maestro: '/maestro/dashboard',
            estudiante: '/estudiante/dashboard',
            auditor: '/auditor/dashboard'
        };

        const route = roleRoutes[user.rol] || '/dashboard';
        window.location.href = route;
    }
}

// Crear instancia global del cliente API
const apiClient = new ApiClient();

// Exportar para uso en otros módulos
window.ApiClient = ApiClient;
window.apiClient = apiClient;