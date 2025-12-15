import React, { useEffect, useState } from 'react'
import { useAuthStore } from '../store/authStore'
import { apiService } from '../services/apiService'
import { Loading } from '../components/Loading'
import { Button } from '../components/Button'

type DashboardData = unknown[]

export const DashboardPage: React.FC = () => {
  const { user, logout, isAuthenticated } = useAuthStore()
  const [data, setData] = useState<DashboardData>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated) return

    const loadData = async () => {
      try {
        let response
        switch (user?.rol) {
          case 'admin':
            response = await apiService.getMaestros()
            break
          case 'maestro':
            response = await apiService.getEstudiantes()
            break
          case 'estudiante':
            response = await apiService.getReportesEstudiantes()
            break
          case 'auditor':
            response = await apiService.getReportesMaestros()
            break
          default:
            response = { data: [] }
        }
        setData(response.data)
      } catch (error) {
        console.error('Error loading data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, isAuthenticated])

  if (!isAuthenticated) return <div>No autorizado</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Dashboard - {user?.rol}
            </h1>
            <Button onClick={logout} variant="secondary">
              Cerrar Sesión
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {loading ? (
          <Loading />
        ) : (
          <div className="bg-white overflow-hidden shadow rounded-lg">
            <div className="px-4 py-5 sm:p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">
                Información para {user?.rol}
              </h2>
              {data && data.length > 0 ? (
                <ul className="space-y-2">
                  {data.slice(0, 5).map((item: unknown, index: number) => (
                    <li key={index} className="text-gray-600">
                      {JSON.stringify(item)}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No hay datos disponibles</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}