import axios, { AxiosInstance, AxiosResponse } from 'axios'
import { useAuthStore } from '../store/authStore'

class ApiService {
  private api: AxiosInstance

  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    this.setupInterceptors()
  }

  private setupInterceptors() {
    // Request interceptor
    this.api.interceptors.request.use(
      (config) => {
        const token = useAuthStore.getState().token
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error)
    )

    // Response interceptor
    this.api.interceptors.response.use(
      (response: AxiosResponse) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired, try refresh
          try {
            await useAuthStore.getState().refreshToken()
            // Retry the original request
            const originalRequest = error.config
            const token = useAuthStore.getState().token
            originalRequest.headers.Authorization = `Bearer ${token}`
            return this.api(originalRequest)
          } catch (refreshError) {
            useAuthStore.getState().logout()
            window.location.href = '/login'
            return Promise.reject(refreshError)
          }
        }
        return Promise.reject(error)
      }
    )
  }

  // Auth endpoints
  async login(credentials: { email: string; password: string }) {
    return this.api.post('/auth/login', credentials)
  }

  async refresh(credentials: { refreshToken: string }) {
    return this.api.post('/auth/refresh', credentials)
  }

  async logout() {
    return this.api.post('/auth/logout')
  }

  // Maestros endpoints
  async getMaestros() {
    return this.api.get('/maestros')
  }

  async createMaestro(data: unknown) {
    return this.api.post('/maestros', data)
  }

  // Estudiantes endpoints
  async getEstudiantes() {
    return this.api.get('/estudiantes')
  }

  async createEstudiante(data: unknown) {
    return this.api.post('/estudiantes', data)
  }

  // Reportes endpoints
  async getReportesEstudiantes() {
    return this.api.get('/reportes-estudiantes')
  }

  async getReportesMaestros() {
    return this.api.get('/reportes-maestros')
  }
}

export const apiService = new ApiService()