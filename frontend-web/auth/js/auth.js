/**
 * Módulo Principal de Autenticación
 * Sistema de Acompañamiento Académico
 */

class AuthManager {
    constructor() {
        this.currentTab = 'login';
        this.selectedRole = null;
        this.isLoading = false;

        // Elementos DOM
        this.loginForm = document.getElementById('login-form');
        this.registerForm = document.getElementById('register-form');
        this.tabButtons = document.querySelectorAll('.tab-btn');
        this.roleButtons = document.querySelectorAll('.role-btn');
        this.submitButtons = document.querySelectorAll('.submit-btn');

        this.init();
    }

    /**
     * Inicializar el sistema de autenticación
     */
    init() {
        this.setupEventListeners();
        this.checkExistingSession();
        this.setupFormValidation();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Tabs de login/registro
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });

        // Selección de roles
        this.roleButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                this.selectRole(e.target.dataset.role);
            });
        });

        // Formularios
        this.loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        this.registerForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegister();
        });

        // Validación en tiempo real
        document.querySelectorAll('input').forEach(input => {
            input.addEventListener('blur', () => {
                this.validateField(input);
            });
            input.addEventListener('input', () => {
                this.clearFieldError(input);
            });
        });
    }

    /**
     * Verificar sesión existente
     */
    checkExistingSession() {
        if (apiClient.isAuthenticated()) {
            const user = apiClient.getCurrentUser();
            this.showSuccess('Sesión existente encontrada. Redirigiendo...');
            setTimeout(() => {
                apiClient.redirectByRole(user);
            }, 1500);
        }
    }

    /**
     * Cambiar entre tabs de login y registro
     * @param {string} tab - Tab a mostrar ('login' o 'register')
     */
    switchTab(tab) {
        this.currentTab = tab;

        // Actualizar botones de tabs
        this.tabButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tab);
        });

        // Mostrar/ocultar formularios
        document.getElementById('login-form').classList.toggle('active', tab === 'login');
        document.getElementById('register-form').classList.toggle('active', tab === 'register');

        // Resetear validación
        this.clearAllErrors();
        this.selectedRole = null;
        this.updateRoleButtons();
    }

    /**
     * Seleccionar rol del usuario
     * @param {string} role - Rol seleccionado
     */
    selectRole(role) {
        this.selectedRole = role;
        this.updateRoleButtons();

        // Actualizar campo oculto en formulario de registro
        const roleInput = document.getElementById('register-role');
        if (roleInput) {
            roleInput.value = role;
        }
    }

    /**
     * Actualizar apariencia de botones de rol
     */
    updateRoleButtons() {
        this.roleButtons.forEach(button => {
            button.classList.toggle('selected', button.dataset.role === this.selectedRole);
        });
    }

    /**
     * Manejar login
     */
    async handleLogin() {
        if (!this.validateLoginForm()) {
            return;
        }

        this.setLoading(true);

        try {
            const formData = new FormData(this.loginForm);
            const email = formData.get('email');
            const password = formData.get('password');

            const response = await apiClient.login(email, password);

            this.showSuccess('¡Inicio de sesión exitoso! Redirigiendo...');

            setTimeout(() => {
                apiClient.redirectByRole(response.user);
            }, 1500);

        } catch (error) {
            this.showError(error.message || 'Error al iniciar sesión');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Manejar registro
     */
    async handleRegister() {
        if (!this.validateRegisterForm()) {
            return;
        }

        this.setLoading(true);

        try {
            const formData = new FormData(this.registerForm);
            const userData = {
                nombre: formData.get('nombre'),
                apellido: '', // No hay campo apellido en el formulario
                email: formData.get('email'),
                password: formData.get('password'),
                rol: this.selectedRole
            };

            const response = await apiClient.register(userData);

            this.showSuccess('¡Registro exitoso! Puedes iniciar sesión ahora.');

            // Cambiar a tab de login después de 2 segundos
            setTimeout(() => {
                this.switchTab('login');
                // Limpiar formulario de registro
                this.registerForm.reset();
                this.selectedRole = null;
                this.updateRoleButtons();
            }, 2000);

        } catch (error) {
            this.showError(error.message || 'Error al registrar usuario');
        } finally {
            this.setLoading(false);
        }
    }

    /**
     * Validar formulario de login
     * @returns {boolean} True si es válido
     */
    validateLoginForm() {
        const email = document.getElementById('login-email');
        const password = document.getElementById('login-password');

        let isValid = true;

        if (!this.validateField(email)) isValid = false;
        if (!this.validateField(password)) isValid = false;

        return isValid;
    }

    /**
     * Validar formulario de registro
     * @returns {boolean} True si es válido
     */
    validateRegisterForm() {
        const fields = [
            'register-nombre', 'register-email',
            'register-password', 'register-confirm-password'
        ];

        let isValid = true;

        fields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!this.validateField(field)) isValid = false;
        });

        // Validar rol seleccionado
        if (!this.selectedRole) {
            this.showError('Por favor selecciona un rol');
            isValid = false;
        }

        // Validar contraseñas coincidan
        const password = document.getElementById('register-password');
        const confirmPassword = document.getElementById('register-confirm-password');

        if (password.value !== confirmPassword.value) {
            this.showFieldError(confirmPassword, 'Las contraseñas no coinciden');
            isValid = false;
        }

        return isValid;
    }

    /**
     * Configurar validación de formularios
     */
    setupFormValidation() {
        // Configuración de validación personalizada
        const validators = {
            email: (value) => {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                return emailRegex.test(value) || 'Correo electrónico inválido';
            },
            password: (value) => {
                return value.length >= 8 || 'La contraseña debe tener al menos 8 caracteres';
            },
            nombre: (value) => {
                return value.length >= 2 || 'El nombre debe tener al menos 2 caracteres';
            },
            apellido: (value) => {
                return value.length >= 2 || 'El apellido debe tener al menos 2 caracteres';
            },
            telefono: (value) => {
                const phoneRegex = /^\+?[\d\s\-\(\)]+$/;
                return phoneRegex.test(value) || 'Número de teléfono inválido';
            },
            fechaNacimiento: (value) => {
                const today = new Date();
                const birthDate = new Date(value);
                const age = today.getFullYear() - birthDate.getFullYear();
                return age >= 13 || 'Debes tener al menos 13 años';
            }
        };

        // Aplicar validadores
        Object.keys(validators).forEach(fieldName => {
            const field = document.getElementById(`register${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`) ||
                         document.getElementById(`login${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)}`);
            if (field) {
                field.dataset.validator = fieldName;
            }
        });
    }

    /**
     * Validar campo individual
     * @param {HTMLElement} field - Campo a validar
     * @returns {boolean} True si es válido
     */
    validateField(field) {
        const validatorName = field.dataset.validator;
        if (!validatorName || !window.validators[validatorName]) {
            return true; // No hay validador personalizado
        }

        const value = field.value.trim();
        const error = window.validators[validatorName](value);

        if (error !== true) {
            this.showFieldError(field, error);
            return false;
        }

        this.clearFieldError(field);
        return true;
    }

    /**
     * Mostrar error en campo
     * @param {HTMLElement} field - Campo con error
     * @param {string} message - Mensaje de error
     */
    showFieldError(field, message) {
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
        }
        field.classList.add('error');
    }

    /**
     * Limpiar error de campo
     * @param {HTMLElement} field - Campo a limpiar
     */
    clearFieldError(field) {
        const errorElement = field.parentElement.querySelector('.field-error');
        if (errorElement) {
            errorElement.style.display = 'none';
        }
        field.classList.remove('error');
    }

    /**
     * Limpiar todos los errores
     */
    clearAllErrors() {
        document.querySelectorAll('.field-error').forEach(error => {
            error.style.display = 'none';
        });
        document.querySelectorAll('.error').forEach(field => {
            field.classList.remove('error');
        });
    }

    /**
     * Mostrar mensaje de éxito
     * @param {string} message - Mensaje a mostrar
     */
    showSuccess(message) {
        this.showMessage(message, 'success');
    }

    /**
     * Mostrar mensaje de error
     * @param {string} message - Mensaje a mostrar
     */
    showError(message) {
        this.showMessage(message, 'error');
    }

    showMessage(message, type) {
        const messageElement = document.getElementById('message-content');
        const container = document.getElementById('message-container');

        if (messageElement && container) {
            messageElement.textContent = message;
            messageElement.className = `message-content ${type}`;
            container.style.display = 'block';

            // Auto-ocultar después de 5 segundos
            setTimeout(() => {
                container.style.display = 'none';
            }, 5000);
        }
    }

    /**
     * Establecer estado de carga
     * @param {boolean} loading - Estado de carga
     */
    setLoading(loading) {
        this.isLoading = loading;

        this.submitButtons.forEach(button => {
            button.disabled = loading;
            button.textContent = loading ? 'Procesando...' : button.dataset.originalText || button.textContent;
        });

        // Guardar texto original
        if (loading) {
            this.submitButtons.forEach(button => {
                if (!button.dataset.originalText) {
                    button.dataset.originalText = button.textContent;
                }
            });
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.authManager = new AuthManager();
});

// Exportar para uso global
window.AuthManager = AuthManager;