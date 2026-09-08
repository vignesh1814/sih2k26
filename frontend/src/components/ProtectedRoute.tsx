import React from 'react'
import { Navigate, useLocation, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRBAC } from '../contexts/RBACContext'
import { UserRole } from '../types/auth'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRoles?: UserRole[]
  requiredPermissions?: Array<{ resource: string; action: string }>
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRoles = [],
  requiredPermissions = []
}) => {
  const { user, isAuthenticated, isLoading } = useAuth()
  const { hasAnyRole, hasAllPermissions } = useRBAC()
  const location = useLocation()

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  const defaultHome = (user?.role === 'DLMO' || user?.role === 'SUPERIOR')
    ? '/superior-analytics'
    : user?.role === 'MANUFACTURER'
    ? '/manufacturer-portal'
    : '/dashboard'

  if (requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Access Restricted</h1>
          <p className="text-sm text-gray-600 mb-6">
            Your role (<span className="font-semibold text-gray-800">{user?.role}</span>) does not have authorization to view this module.
          </p>
          <Link
            to={defaultHome}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Your Portal</span>
          </Link>
        </div>
      </div>
    )
  }

  if (requiredPermissions.length > 0 && !hasAllPermissions(requiredPermissions)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-gray-200 p-8 text-center">
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-xl flex items-center justify-center mx-auto mb-4">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Permission Required</h1>
          <p className="text-sm text-gray-600 mb-6">
            You do not have the required statutory privileges for this operation.
          </p>
          <Link
            to={defaultHome}
            className="inline-flex items-center space-x-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold hover:bg-blue-700 transition-all shadow-md shadow-blue-600/20"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Return to Your Portal</span>
          </Link>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

export default ProtectedRoute