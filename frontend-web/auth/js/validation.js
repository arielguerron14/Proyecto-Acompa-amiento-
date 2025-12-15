/**
 * Módulo de Validaciones para Formularios de Autenticación
 * Sistema de Acompañamiento Académico
 */

// Validadores globales para el sistema de autenticación
window.validators = {
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

/**
 * Clase para validación avanzada de formularios
 */
class FormValidator {
    constructor() {
        this.rules = {
            required: (value) => value.trim() !== '' || 'Este campo es obligatorio',
            email: (value) => window.validators.email(value),
            minLength: (value, min) => value.length >= min || `Debe tener al menos ${min} caracteres`,
            password: (value) => window.validators.password(value),
            confirmPassword: (value, confirmValue) => value === confirmValue || 'Las contraseñas no coinciden',
            nombre: (value) => window.validators.nombre(value),
            apellido: (value) => window.validators.apellido(value),
            telefono: (value) => window.validators.telefono(value),
            fechaNacimiento: (value) => window.validators.fechaNacimiento(value)
        };
    }

    /**
     * Valida un campo individual
     * @param {string} fieldName - Nombre del campo
     * @param {string} value - Valor del campo
     * @param {Array} validations - Array de validaciones a aplicar
     * @returns {string|null} Mensaje de error o null si es válido
     */
    validateField(fieldName, value, validations) {
        for (const validation of validations) {
            const [ruleName, ...params] = validation.split(':');
            const rule = this.rules[ruleName];

            if (!rule) continue;

            let result;
            if (ruleName === 'confirmPassword') {
                const confirmValue = document.getElementById(`${fieldName.replace('password', 'confirm-password')}`).value;
                result = rule(value, confirmValue);
            } else {
                result = rule(value, ...params);
            }

            if (result !== true) {
                return result;
            }
        }
        return null;
    }

    /**
     * Valida todo el formulario
     * @param {HTMLFormElement} form - Elemento del formulario
     * @param {Object} validationRules - Reglas de validación por campo
     * @returns {boolean} True si el formulario es válido
     */
    validateForm(form, validationRules) {
        let isValid = true;
        const errors = {};

        // Limpiar errores previos
        form.querySelectorAll('.error-message').forEach(el => el.textContent = '');
        form.querySelectorAll('.form-group input').forEach(el => el.classList.remove('error'));

        // Validar cada campo
        Object.keys(validationRules).forEach(fieldName => {
            const input = form.querySelector(`[name="${fieldName}"]`);
            if (!input) return;

            const value = input.value;
            const error = this.validateField(fieldName, value, validationRules[fieldName]);

            if (error) {
                errors[fieldName] = error;
                isValid = false;

                // Mostrar error
                const errorElement = document.getElementById(`${fieldName}-error`);
                if (errorElement) {
                    errorElement.textContent = error;
                }

                // Marcar campo como error
                input.classList.add('error');
            }
        });

        return isValid;
    }

    /**
     * Valida un campo en tiempo real
     * @param {HTMLInputElement} input - Elemento input
     * @param {Array} validations - Validaciones del campo
     */
    validateFieldRealtime(input, validations) {
        const errorElement = document.getElementById(`${input.name}-error`);
        if (!errorElement) return;

        const error = this.validateField(input.name, input.value, validations);

        if (error) {
            errorElement.textContent = error;
            input.classList.add('error');
        } else {
            errorElement.textContent = '';
            input.classList.remove('error');
        }
    }
}

// Crear instancia global del validador
const formValidator = new FormValidator();

// Exportar para uso en otros módulos
window.FormValidator = FormValidator;
window.formValidator = formValidator;