import React from 'react'
import { useLogin } from '../hooks/useLogin'
import { Button } from '../components/Button'
import { Loading } from '../components/Loading'

export const LoginPage: React.FC = () => {
  const {
    email,
    password,
    loading,
    error,
    validationErrors,
    setEmail,
    setPassword,
    handleSubmit,
    isFormValid,
  } = useLogin()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-blue-600 rounded-full flex items-center justify-center">
            <svg
              className="h-6 w-6 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Iniciar Sesión
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Accede a tu cuenta del Sistema Educativo
          </p>
        </div>

        {/* Form */}
        <form className="mt-8 space-y-6 bg-white py-8 px-6 shadow-xl rounded-lg border border-gray-200" onSubmit={handleSubmit}>
          {/* Error Global */}
          {error && (
            <div
              className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md text-sm"
              role="alert"
              aria-live="assertive"
            >
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* Email Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Correo Electrónico
            </label>
            <input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                validationErrors.email ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              aria-invalid={!!validationErrors.email}
              aria-describedby={validationErrors.email ? "email-error" : undefined}
            />
            {validationErrors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">
                {validationErrors.email}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              className={`appearance-none relative block w-full px-3 py-2 border rounded-md placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
                validationErrors.password ? 'border-red-300' : 'border-gray-300'
              }`}
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-invalid={!!validationErrors.password}
              aria-describedby={validationErrors.password ? "password-error" : undefined}
            />
            {validationErrors.password && (
              <p id="password-error" className="mt-1 text-sm text-red-600" role="alert">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Submit Button */}
          <div>
            <Button
              type="submit"
              disabled={!isFormValid || loading}
              loading={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 disabled:bg-gray-400"
            >
              {loading ? 'Iniciando Sesión...' : 'Iniciar Sesión'}
            </Button>
          </div>

          {/* Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center rounded-lg">
              <Loading />
            </div>
          )}
        </form>

        {/* Footer */}
        <div className="text-center">
          <p className="text-sm text-gray-600">
            ¿Necesitas ayuda?{' '}
            <a href="#" className="font-medium text-blue-600 hover:text-blue-500 transition-colors">
              Contacta al administrador
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}