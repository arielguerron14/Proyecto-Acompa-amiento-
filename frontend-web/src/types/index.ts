export interface User {
  id: string
  email: string
  rol: 'admin' | 'maestro' | 'estudiante' | 'auditor'
  nombre: string
}

export interface AuthState {
  user: User | null
  token: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<User>
  logout: () => void
  refreshAccessToken: () => Promise<void>
}

export interface ApiResponse<T> {
  data: T
  message?: string
  success: boolean
}

export interface LoginRequest {
  email: string
  password: string
}

export interface LoginResponse {
  user: User
  token: string
  refreshToken: string
}