// Estado de la aplicación
let isLoginMode = true;

// Elementos del DOM
const authTitle = document.getElementById('auth-title');
const authSubtitle = document.getElementById('auth-subtitle');
const errorMessage = document.getElementById('error-message');
const authForm = document.getElementById('auth-form');
const registerFields = document.getElementById('register-fields');
const roleField = document.getElementById('role-field');
const submitBtn = document.getElementById('submit-btn');
const toggleModeBtn = document.getElementById('toggle-mode');

// Función para mostrar/ocultar elementos
function toggleVisibility(element, show) {
    if (show) {
        element.classList.remove('hidden');
    } else {
        element.classList.add('hidden');
    }
}

// Función para actualizar la UI según el modo
function updateUI() {
    if (isLoginMode) {
        if (authTitle) authTitle.textContent = 'Iniciar Sesión';
        if (authSubtitle) authSubtitle.textContent = 'Accede a tu cuenta';
        if (submitBtn) submitBtn.textContent = 'Ingresar';
        if (toggleModeBtn) toggleModeBtn.textContent = '¿No tienes cuenta? Regístrate';

        if (registerFields) toggleVisibility(registerFields, false);
        if (roleField) toggleVisibility(roleField, false);
    } else {
        if (authTitle) authTitle.textContent = 'Crear Cuenta';
        if (authSubtitle) authSubtitle.textContent = 'Regístrate en el sistema';
        if (submitBtn) submitBtn.textContent = 'Registrarse';
        if (toggleModeBtn) toggleModeBtn.textContent = '¿Ya tienes cuenta? Inicia sesión';

        if (registerFields) toggleVisibility(registerFields, true);
        if (roleField) toggleVisibility(roleField, true);
    }
}

// Función para mostrar errores
function showError(message) {
    errorMessage.textContent = message;
    toggleVisibility(errorMessage, true);
}

// Función para ocultar errores
function hideError() {
    toggleVisibility(errorMessage, false);
}

// Función para manejar el toggle de modo
function handleToggleMode() {
    isLoginMode = !isLoginMode;
    updateUI();
    hideError();

    // Limpiar el formulario
    authForm.reset();
}

// Función para manejar el envío del formulario
async function handleSubmit(event) {
    event.preventDefault();
    hideError();

    const formData = new FormData(authForm);
    const data = Object.fromEntries(formData);

    // Validación adicional para registro
    if (!isLoginMode) {
        if (!data.nombre || !data.nombre.trim()) {
            showError('El nombre es requerido');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
            return;
        }
        if (!data.role) {
            showError('El rol es requerido');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Registrarse';
            return;
        }
    }

    // Deshabilitar el botón durante el envío
    submitBtn.disabled = true;
    submitBtn.textContent = 'Cargando...';

    try {
        let url, body;

        if (isLoginMode) {
            url = window.API_CONFIG.buildUrl('/auth/login');
            body = {
                email: data.email,
                password: data.password
            };
        } else {
            url = window.API_CONFIG.buildUrl('/auth/register');
            body = {
                name: data.nombre,
                email: data.email,
                password: data.password,
                role: data.role
            };
        }

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        const result = await response.json();

        if (response.ok) {
            if (isLoginMode) {
                // Login: esperamos token
                if (result.token || result.success) {
                    // Guardar token si existe
                    if (result.token) {
                        localStorage.setItem('token', result.token);
                    }
                    
                    // Guardar info de usuario si existe
                    if (result.user) {
                        localStorage.setItem('user', JSON.stringify(result.user));
                    }
                    
                    // Intentar determinar el usuario/rol. Si el backend no devuelve
                    // `result.user`, intentamos consultar `/auth/me` usando el token
                    // y / o leerlo de localStorage.
                    let user = result.user || null;

                    // Si no tenemos user y hay token, intentar recuperar perfil
                    if (!user && localStorage.getItem('token')) {
                        try {
                            const profileRes = await fetch(window.API_CONFIG.buildUrl('/auth/me'), {
                                method: 'GET',
                                headers: {
                                    'Content-Type': 'application/json',
                                    'Authorization': 'Bearer ' + localStorage.getItem('token')
                                }
                            });

                            if (profileRes.ok) {
                                const profileJson = await profileRes.json();
                                // Acomodar distintos shapes: { user: {...} } o directamente { role: '...' }
                                if (profileJson.user) {
                                    user = profileJson.user;
                                } else if (profileJson.role || profileJson.email) {
                                    user = profileJson;
                                }

                                if (user) {
                                    localStorage.setItem('user', JSON.stringify(user));
                                }
                            }
                        } catch (err) {
                            // No bloquear el flujo si falla la consulta del perfil
                            console.warn('No se pudo recuperar perfil tras login:', err);
                        }
                    }

                    // También permitir que el user venga de localStorage previo
                    if (!user && localStorage.getItem('user')) {
                        try {
                            user = JSON.parse(localStorage.getItem('user'));
                        } catch (e) {
                            user = null;
                        }
                    }

                    // Redirigir según rol (fallback: dashboard.html)
                    let redirectUrl = 'dashboard.html';
                    if (user && user.role) {
                        if (user.role === 'estudiante') {
                            redirectUrl = 'estudiante.html';
                        } else if (user.role === 'maestro') {
                            redirectUrl = 'maestro.html';
                        }
                    }

                    // Usar redirección relativa
                    setTimeout(() => {
                        window.location.href = redirectUrl;
                    }, 500);
                } else {
                    showError('Respuesta inesperada del servidor');
                }
            } else {
                // Register: éxito, mostrar mensaje y cambiar a login
                errorMessage.textContent = '✅ Cuenta creada exitosamente. Por favor inicia sesión.';
                errorMessage.classList.remove('hidden');
                errorMessage.classList.add('success-message');
                errorMessage.classList.remove('error-message');
                
                setTimeout(() => {
                    isLoginMode = true;
                    updateUI();
                    hideError();
                    authForm.reset();
                }, 2500);
            }
        } else {
            // Error del servidor
            showError(result.message || result.error || 'Error en la autenticación');
        }
    } catch (error) {
        console.error('Error:', error);
        showError('Error de conexión. Verifica que el servidor esté ejecutándose.');
    } finally {
        // Rehabilitar el botón
        submitBtn.disabled = false;
        updateUI();
    }
}

// Event listeners
if (toggleModeBtn) {
    toggleModeBtn.addEventListener('click', handleToggleMode);
}
if (authForm) {
    authForm.addEventListener('submit', handleSubmit);
}

// Inicializar la UI
updateUI();