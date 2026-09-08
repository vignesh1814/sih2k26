import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Shield, AlertCircle, UserCheck, ShieldAlert, Building2 } from 'lucide-react'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Login successful')

      // Role-based target navigation based on authenticated role
      const storedUser = localStorage.getItem('lm_user')
      const parsedUser = storedUser ? JSON.parse(storedUser) : null
      const userRole = parsedUser?.role

      const from = (location.state as any)?.from?.pathname
      if (from && from !== '/login') {
        navigate(from, { replace: true })
      } else if (userRole === 'DLMO' || userRole === 'SUPERIOR') {
        navigate('/superior-analytics', { replace: true })
      } else if (userRole === 'MANUFACTURER') {
        navigate('/manufacturer-portal', { replace: true })
      } else {
        navigate('/dashboard', { replace: true })
      }
    } catch (err: any) {
      setError(err?.message || 'Invalid credentials. Please verify your email and password.')
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const fillDemoCredentials = (role: 'inspector' | 'dlmo' | 'manufacturer') => {
    const credentials = {
      inspector: { email: 'inspector@lm.gov.in', password: 'inspector123' },
      dlmo: { email: 'dlmo@lm.gov.in', password: 'dlmo123' },
      manufacturer: { email: 'manufacturer@brand.com', password: 'brand123' }
    }
    
    if (credentials[role]) {
      setEmail(credentials[role].email)
      setPassword(credentials[role].password)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 flex items-center justify-center p-4">
      <div className="max-w-xl w-full">
        {/* Logo and Header */}
        <div className="text-center mb-6">
          <div className="flex items-center justify-center space-x-3 mb-3">
            <div className="p-3 bg-blue-600 rounded-xl shadow-lg shadow-blue-500/30">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-2xl font-black tracking-tight text-white">SIH26034</h1>
              <p className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Legal Metrology Compliance Engine</p>
            </div>
          </div>
          <p className="text-sm text-slate-300">
            Ministry of Consumer Affairs, Food & Public Distribution • Govt. of India
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl p-6 sm:p-8 border border-white/20">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Sign In to Regulatory Portal</h2>
              <p className="text-xs text-gray-500 mt-0.5">Select role credentials to enter enforcement or brand console</p>
            </div>
            <span className="text-xs font-mono font-bold bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full border border-blue-200">
              MERN v2.0
            </span>
          </div>
          
          {error && (
            <div className="mb-5 p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-rose-600 flex-shrink-0" />
              <p className="text-xs font-medium text-rose-700">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Official Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
                placeholder="officer@lm.gov.in"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Security Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full px-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 text-white font-semibold py-3 px-4 rounded-xl hover:bg-blue-700 focus:ring-4 focus:ring-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md shadow-blue-600/20"
            >
              {isLoading ? 'Authenticating...' : 'Sign In'}
            </button>
          </form>

          {/* 3 Primary Actors per SRS */}
          <div className="mt-6 pt-5 border-t border-gray-200">
            <p className="text-xs font-bold text-gray-600 uppercase tracking-wider mb-3">
              SRS Three-Actor Quick Login:
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* 1. Field Inspector */}
              <button
                type="button"
                onClick={() => fillDemoCredentials('inspector')}
                className={`p-3 text-left border rounded-xl transition-all ${
                  email === 'inspector@lm.gov.in'
                    ? 'border-blue-600 bg-blue-50/80 ring-2 ring-blue-600'
                    : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <UserCheck className="h-4 w-4 text-blue-600" />
                  <span className="text-xs font-bold text-gray-900">1. Inspector</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">Package scanning, OCR check, MPE & reports</p>
              </button>

              {/* 2. DLMO */}
              <button
                type="button"
                onClick={() => fillDemoCredentials('dlmo')}
                className={`p-3 text-left border rounded-xl transition-all ${
                  email === 'dlmo@lm.gov.in' || email === 'superior@lm.gov.in'
                    ? 'border-indigo-600 bg-indigo-50/80 ring-2 ring-indigo-600'
                    : 'border-gray-200 hover:border-indigo-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <ShieldAlert className="h-4 w-4 text-indigo-600" />
                  <span className="text-xs font-bold text-gray-900">2. DLMO</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">District supervisory review & legal challans</p>
              </button>

              {/* 3. Manufacturer Portal */}
              <button
                type="button"
                onClick={() => fillDemoCredentials('manufacturer')}
                className={`p-3 text-left border rounded-xl transition-all ${
                  email === 'manufacturer@brand.com'
                    ? 'border-emerald-600 bg-emerald-50/80 ring-2 ring-emerald-600'
                    : 'border-gray-200 hover:border-emerald-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-2 mb-1">
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span className="text-xs font-bold text-gray-900">3. Manufacturer</span>
                </div>
                <p className="text-[11px] text-gray-500 leading-tight">Pre-market self check & brand compliance</p>
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-slate-400">
          <p>Statutory Portal • Authorized access under Legal Metrology Act, 2009</p>
          <p className="mt-1">© 2026 Legal Metrology Directorate, Ministry of Consumer Affairs</p>
        </div>
      </div>
    </div>
  )
}

export default Login