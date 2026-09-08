import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const from = (location.state as any)?.from?.pathname || '/dashboard'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Login successful')
      navigate(from, { replace: true })
    } catch (err) {
      setError('Invalid credentials. Please try again.')
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (role: string) => {
    const credentials: Record<string, { email: string; password: string }> = {
      admin: { email: 'admin@lm.gov.in', password: 'admin123' },
      inspector: { email: 'inspector@lm.gov.in', password: 'inspector123' },
      analyst: { email: 'analyst@lm.gov.in', password: 'analyst123' },
      viewer: { email: 'viewer@lm.gov.in', password: 'viewer123' },
    }
    
    if (credentials[role]) {
      setEmail(credentials[role].email)
      setPassword(credentials[role].password)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="p-3 bg-blue-600 rounded-lg">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-bold text-gray-900">SIH26034</h1>
              <p className="text-sm text-gray-600">Legal Metrology Compliance</p>
            </div>
          </div>
          <p className="text-gray-600">
            Government of India • Legal Metrology Division
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Sign In</h2>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="your.email@lm.gov.in"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isLoading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          {/* Demo Credentials */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <p className="text-sm font-medium text-gray-700 mb-3">Demo Credentials:</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => fillDemoCredentials('admin')}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Admin
              </button>
              <button
                onClick={() => fillDemoCredentials('inspector')}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Inspector
              </button>
              <button
                onClick={() => fillDemoCredentials('analyst')}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Analyst
              </button>
              <button
                onClick={() => fillDemoCredentials('viewer')}
                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded transition-colors"
              >
                Viewer
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-gray-600">
          <p>Authorized personnel only. All access is logged.</p>
          <p className="mt-1">© 2026 Government of India. All rights reserved.</p>
        </div>
      </div>
    </div>
  )
}

export default Login