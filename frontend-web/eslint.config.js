import js from '@eslint/js'
import globals from 'globals'

export default [
  { ignores: ['dist', 'public/', 'server.js'] },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        authManager: 'readonly',
        reservasManager: 'readonly',
        reservarManager: 'readonly',
        reportesManager: 'readonly',
        notificacionesManager: 'readonly',
        dashboardManager: 'readonly',
        ReservasManager: 'readonly',
        ReservarManager: 'readonly',
        ReportesManager: 'readonly',
        NotificacionesManager: 'readonly',
        DashboardManager: 'readonly',
        currentTab: 'writable',
        isValid: 'writable',
        editarHorario: 'writable',
        eliminarHorario: 'writable',
        cambiarEstado: 'writable',
        progresos: 'writable',
        error: 'writable'
      },
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module',
      },
    },
    rules: {
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { varsIgnorePattern: '.*Manager|currentTab|isValid|editarHorario|eliminarHorario|cambiarEstado|progresos|error', argsIgnorePattern: '^_', caughtErrorsIgnorePattern: '^error$' }],
    },
  },
]