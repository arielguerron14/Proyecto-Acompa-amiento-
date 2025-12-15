import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { AuthState } from '../types'
import { apiService } from '../services/apiService'

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: async (email: string, password: string) => {
        try {
          const response = await apiService.login({ email, password })
          const data = response.data

          set({
            user: data.user,
            token: data.token,
            refreshToken: data.refreshToken,
            isAuthenticated: true,
          })

          return data.user // Retornar usuario para redirección basada en rol
        } catch (error: any) {
          // Manejar errores específicos del backend
          if (error.response?.status === 401) {
            throw new Error('Credenciales inválidas')
          } else if (error.response?.status === 403) {
            throw new Error('Usuario bloqueado o sin permisos')
          } else if (error.response?.status >= 500) {
            throw new Error('Error del servidor. Intente nuevamente.')
          } else {
            throw new Error('Error de conexión. Verifique su internet.')
          }
        }
      },

      logout: () => {
        set({ user: null, token: null, refreshToken: null, isAuthenticated: false })
      },

      refreshAccessToken: async () => {
        const { refreshToken } = get()
        if (!refreshToken) return

        try {
          const response = await apiService.refresh({ refreshToken })
          const data = response.data
          set({ token: data.token })
        } catch (error) {
          get().logout()
          throw error
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)