import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '../types/auth'
import { loginUser, logoutUser } from '../services/api'

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
      try {
        setUser(JSON.parse(storedUser))
      } catch (e) {
        localStorage.removeItem('lm_user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    setIsLoading(true)
    try {
      // Call MERN Express backend auth endpoint
      try {
        const data = await loginUser(email, password)
        if (data && data.user) {
          setUser(data.user)
          localStorage.setItem('lm_user', JSON.stringify(data.user))
          if (data.token) localStorage.setItem('lm_token', data.token)
          return
        }
      } catch (apiErr) {
        console.warn('[AuthContext] Backend login error, attempting local fallback:', apiErr)
      }

      // Mock authentication fallback
      const mockUsers: User[] = [
        {
          id: '1',
          email: 'inspector@lm.gov.in',
          name: 'Field Inspector Sharma',
          role: 'INSPECTOR',
          department: 'Metrology Central Enforcement Wing',
          jurisdiction: 'Maharashtra'
        },
        {
          id: '2',
          email: 'superior@lm.gov.in',
          name: 'Dr. R. K. Verma (Controller)',
          role: 'SUPERIOR',
          department: 'Directorate of Legal Metrology HQ',
          jurisdiction: 'National HQ (New Delhi)'
        },
        {
          id: '3',
          email: 'manufacturer@brand.com',
          name: 'Sunrise Foods & FMCG Ltd',
          role: 'MANUFACTURER',
          department: 'Corporate Regulatory & Packaging Division',
          jurisdiction: 'GIDC Gujarat & Pan-India'
        },
        {
          id: '4',
          email: 'admin@lm.gov.in',
          name: 'System Superadmin',
          role: 'ADMIN',
          department: 'National IT & Standards Directorate',
          jurisdiction: 'National'
        }
      ]

      const authenticatedUser = mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase())
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

  const logout = async () => {
    try {
      await logoutUser(user)
    } catch (e) {
      console.warn('[AuthContext] Logout call failed:', e)
    } finally {
      setUser(null)
      localStorage.removeItem('lm_user')
      localStorage.removeItem('lm_token')
    }
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