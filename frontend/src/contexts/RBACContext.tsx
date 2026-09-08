import React, { createContext, useContext, ReactNode } from 'react'
import { useAuth } from './AuthContext'
import { UserRole, ROLE_PERMISSIONS, ROLE_HIERARCHY, Permission } from '../types/auth'

interface RBACContextType {
  hasPermission: (resource: string, action: string) => boolean
  hasAnyPermission: (permissions: Array<{ resource: string; action: string }>) => boolean
  hasAllPermissions: (permissions: Array<{ resource: string; action: string }>) => boolean
  hasRole: (role: UserRole) => boolean
  hasAnyRole: (roles: UserRole[]) => boolean
  hasHigherRole: (role: UserRole) => boolean
  getPermissions: () => Permission[]
  canManageUser: (targetUserRole: UserRole) => boolean
}

const RBACContext = createContext<RBACContextType | undefined>(undefined)

export const RBACProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { user } = useAuth()

  const getPermissions = (): Permission[] => {
    if (!user) return []
    return ROLE_PERMISSIONS[user.role] || []
  }

  const hasPermission = (resource: string, action: string): boolean => {
    if (!user) return false
    
    const permissions = getPermissions()
    
    // Check for wildcard permission
    const hasWildcard = permissions.some(
      p => p.resource === '*' && p.action === '*'
    )
    if (hasWildcard) return true
    
    // Check for specific permission
    return permissions.some(
      p => (p.resource === resource || p.resource === '*') && 
           (p.action === action || p.action === '*')
    )
  }

  const hasAnyPermission = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.some(({ resource, action }) => hasPermission(resource, action))
  }

  const hasAllPermissions = (permissions: Array<{ resource: string; action: string }>): boolean => {
    return permissions.every(({ resource, action }) => hasPermission(resource, action))
  }

  const hasRole = (role: UserRole): boolean => {
    return user?.role === role
  }

  const hasAnyRole = (roles: UserRole[]): boolean => {
    return user ? roles.includes(user.role) : false
  }

  const hasHigherRole = (role: UserRole): boolean => {
    if (!user) return false
    return ROLE_HIERARCHY[user.role] > ROLE_HIERARCHY[role]
  }

  const canManageUser = (targetUserRole: UserRole): boolean => {
    if (!user) return false
    
    // Admin can manage everyone
    if (user.role === 'ADMIN') return true
    
    // Can only manage users with lower role hierarchy
    return ROLE_HIERARCHY[user.role] > ROLE_HIERARCHY[targetUserRole]
  }

  return (
    <RBACContext.Provider
      value={{
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        hasRole,
        hasAnyRole,
        hasHigherRole,
        getPermissions,
        canManageUser,
      }}
    >
      {children}
    </RBACContext.Provider>
  )
}

export const useRBAC = () => {
  const context = useContext(RBACContext)
  if (context === undefined) {
    throw new Error('useRBAC must be used within an RBACProvider')
  }
  return context
}