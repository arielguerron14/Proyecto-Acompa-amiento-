import React from 'react'

export const Loading: React.FC = () => (
  <div className="flex items-center justify-center p-4">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
    <span className="ml-2 text-gray-600">Cargando...</span>
  </div>
)

export const Skeleton: React.FC<{ className?: string }> = ({ className = 'h-4 bg-gray-200 rounded' }) => (
  <div className={`animate-pulse ${className}`}></div>
)