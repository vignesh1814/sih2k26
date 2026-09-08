import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '../types/auth'

interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department: string
  jurisdiction: string
}

interface AuthContextType {
  user: User | null
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => void
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing session
    const storedUser = localStorage.getItem('lm_user')
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Simulate API call - replace with actual authentication
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock authentication logic
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'admin@lm.gov.in',
          name: 'Admin User',
          role: 'ADMIN',
          department: 'Legal Metrology Directorate',
          jurisdiction: 'National'
        },
        {
          id: '2',
          email: 'inspector@lm.gov.in',
          name: 'Field Inspector',
          role: 'INSPECTOR',
          department: 'Metrology Central Enforcement Wing',
          jurisdiction: 'Maharashtra'
        },
        {
          id: '3',
          email: 'analyst@lm.gov.in',
          name: 'Compliance Analyst',
          role: 'ANALYST',
          department: 'Compliance Monitoring Division',
          jurisdiction: 'National'
        },
        {
          id: '4',
          email: 'viewer@lm.gov.in',
          name: 'View Only User',
          role: 'VIEWER',
          department: 'Statistics Division',
          jurisdiction: 'National'
        }
      ]

      const authenticatedUser = mockUsers.find(u => u.email === email)
      if (!authenticatedUser) {
        throw new Error('Invalid credentials')
      }

      setUser(authenticatedUser)
      localStorage.setItem('lm_user', JSON.stringify(authenticatedUser))
    } catch (error) {
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('lm_user')
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}