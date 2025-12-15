import { useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { useNavigate } from 'react-router-dom'

interface ValidationErrors {
  email?: string
  password?: string
}

interface UseLoginReturn {
  email: string
  password: string
  loading: boolean
  error: string
  validationErrors: ValidationErrors
  setEmail: (email: string) => void
  setPassword: (password: string) => void
  handleSubmit: (e: React.FormEvent) => Promise<void>
  isFormValid: boolean
}

export const useLogin = (): UseLoginReturn => {
  const [email, setEmailState] = useState('')
  const [password, setPasswordState] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({})

  const login = useAuthStore((state) => state.login)
  const navigate = useNavigate()

  // Validaciones en tiempo real
  const validateEmail = useCallback((email: string): string | undefined => {
    if (!email) return 'El correo electrónico es obligatorio'
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) return 'Formato de correo electrónico inválido'
    return undefined
  }, [])

  const validatePassword = useCallback((password: string): string | undefined => {
    if (!password) return 'La contraseña es obligatoria'
    if (password.length < 6) return 'La contraseña debe tener al menos 6 caracteres'
    return undefined
  }, [])

  const setEmail = useCallback((newEmail: string) => {
    setEmailState(newEmail)
    const emailError = validateEmail(newEmail)
    setValidationErrors(prev => ({ ...prev, email: emailError }))
  }, [validateEmail])

  const setPassword = useCallback((newPassword: string) => {
    setPasswordState(newPassword)
    const passwordError = validatePassword(newPassword)
    setValidationErrors(prev => ({ ...prev, password: passwordError }))
  }, [validatePassword])

  const isFormValid = !validationErrors.email && !validationErrors.password && !!email && !!password

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isFormValid) return

    setLoading(true)
    setError('')
    setValidationErrors({})

    try {
      const user = await login(email, password)

      // Redirección basada en rol
      switch (user.rol) {
        case 'admin':
          navigate('/admin/dashboard')
          break
        case 'maestro':
          navigate('/maestro/dashboard')
          break
        case 'estudiante':
          navigate('/estudiante/dashboard')
          break
        case 'auditor':
          navigate('/auditor/dashboard')
          break
        default:
          navigate('/dashboard')
      }
    } catch (err: any) {
      setError(err.message || 'Error desconocido')
    } finally {
      setLoading(false)
    }
  }, [isFormValid, login, email, password, navigate])

  return {
    email,
    password,
    loading,
    error,
    validationErrors,
    setEmail,
    setPassword,
    handleSubmit,
    isFormValid,
  }
}