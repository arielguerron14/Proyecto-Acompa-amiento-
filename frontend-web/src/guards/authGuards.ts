import { useAuthStore } from '../store/authStore'

export const requireAuth = () => {
  const { isAuthenticated } = useAuthStore.getState()
  if (!isAuthenticated) {
    window.location.href = '/login'
    return false
  }
  return true
}

export const requireRole = (allowedRoles: string[]) => {
  const { user, isAuthenticated } = useAuthStore.getState()

  if (!isAuthenticated) {
    window.location.href = '/login'
    return false
  }

  if (!user || !allowedRoles.includes(user.rol)) {
    window.location.href = '/unauthorized'
    return false
  }

  return true
}

export const isAdmin = () => requireRole(['admin'])
export const isMaestro = () => requireRole(['admin', 'maestro'])
export const isEstudiante = () => requireRole(['admin', 'maestro', 'estudiante'])
export const isAuditor = () => requireRole(['admin', 'auditor'])