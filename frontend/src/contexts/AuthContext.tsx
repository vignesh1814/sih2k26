import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { UserRole } from '../types/auth'
import { loginUser, logoutUser } from '../services/api'

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  department: string
  organization?: string
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
      } catch (apiErr: any) {
        if (apiErr?.response?.status === 401) {
          throw new Error('Invalid email or password')
        }
        console.warn('[AuthContext] Backend login connection error, falling back to local verification:', apiErr)
      }

      // Mock authentication fallback
      const mockUsers: (User & { password: string })[] = [
        {
          id: '1',
          email: 'inspector@lm.gov.in',
          name: 'Field Inspector Sharma',
          role: 'INSPECTOR',
          department: 'Metrology Central Enforcement Wing',
          organization: 'Legal Metrology Department',
          jurisdiction: 'District Enforcement Unit',
          password: 'inspector123'
        },
        {
          id: '2',
          email: 'dlmo@lm.gov.in',
          name: 'Dr. R. K. Verma',
          role: 'DLMO',
          department: 'Office of District Legal Metrology Officer',
          organization: 'District Legal Metrology Directorate',
          jurisdiction: 'District Headquarters',
          password: 'dlmo123'
        },
        {
          id: '2_compat',
          email: 'superior@lm.gov.in',
          name: 'Dr. R. K. Verma',
          role: 'DLMO',
          department: 'Office of District Legal Metrology Officer',
          organization: 'District Legal Metrology Directorate',
          jurisdiction: 'District Headquarters',
          password: 'superior123'
        },
        {
          id: '3',
          email: 'manufacturer@brand.com',
          name: 'Sunrise Foods & FMCG Ltd',
          role: 'MANUFACTURER',
          department: 'Corporate Regulatory & Packaging Division',
          organization: 'Sunrise Foods & FMCG Ltd',
          jurisdiction: 'GIDC Gujarat & Pan-India',
          password: 'brand123'
        }
      ]

      const authenticatedUser = mockUsers.find(
        u => u.email.toLowerCase() === email.toLowerCase() && u.password === password
      )
      if (!authenticatedUser) {
        throw new Error('Invalid email or password')
      }

      const { password: _, ...cleanUser } = authenticatedUser
      setUser(cleanUser)
      localStorage.setItem('lm_user', JSON.stringify(cleanUser))
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