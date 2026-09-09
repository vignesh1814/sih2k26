import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Shield, 
  AlertCircle, 
  UserCheck, 
  ShieldAlert, 
  Building2, 
  CheckCircle2, 
  Scan, 
  Gavel, 
  ExternalLink, 
  Lock, 
  ArrowRight,
  Award
} from 'lucide-react'
import toast from 'react-hot-toast'

const Login: React.FC = () => {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [selectedRoleModal, setSelectedRoleModal] = useState<string | null>(null)
  
  // Accessibility State (GIGW 3.0)
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0)
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false)

  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  // Font resize handler (GIGW 3.0)
  const handleFontSizeChange = (delta: number) => {
    const newOffset = Math.max(-2, Math.min(4, fontSizeOffset + delta))
    setFontSizeOffset(newOffset)
    document.documentElement.style.fontSize = `${16 + newOffset}px`
  }

  // High contrast toggle (GIGW 3.0)
  const toggleHighContrast = () => {
    setIsHighContrast(prev => {
      const next = !prev
      if (next) {
        document.body.classList.add('high-contrast')
      } else {
        document.body.classList.remove('high-contrast')
      }
      return next
    })
  }

  const handleRoleDirectLogin = async (roleKey: 'INSPECTOR' | 'DLMO' | 'MANUFACTURER') => {
    setIsLoading(true)
    setError('')
    const credentialsMap = {
      INSPECTOR: { email: 'inspector@lm.gov.in', password: 'inspector123', target: '/dashboard' },
      DLMO: { email: 'dlmo@lm.gov.in', password: 'dlmo123', target: '/superior-analytics' },
      MANUFACTURER: { email: 'manufacturer@brand.com', password: 'brand123', target: '/manufacturer-portal' }
    }

    const cred = credentialsMap[roleKey]
    try {
      await login(cred.email, cred.password)
      toast.success(
        `Authenticated successfully as ${roleKey === 'INSPECTOR' ? 'Field Inspector' : roleKey === 'DLMO' ? 'District Legal Metrology Officer' : 'Registered Manufacturer'}!`
      )
      navigate(cred.target, { replace: true })
    } catch (err: any) {
      setError(err?.message || 'Authentication error. Please check backend connection.')
      toast.error('Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  const handleCustomFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      await login(email, password)
      toast.success('Login successful')

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

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#111827] flex flex-col justify-between font-sans">
      {/* Skip to Main Content (GIGW 3.0 Requirement) */}
      <a href="#main-content" className="skip-link">
        Skip to Main Content
      </a>

      {/* 1. Global Top Bar (Utility & Accessibility Toolbar - GIGW 3.0) */}
      <div className="bg-[#072040] text-gray-200 text-xs border-b border-blue-900/40 px-4 sm:px-8 py-1.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-300">
            Government of India | भारत सरकार
          </span>
          <span className="hidden md:inline text-gray-400">•</span>
          <span className="hidden md:inline text-gray-300">
            Department of Consumer Affairs
          </span>
        </div>

        {/* Accessibility Tools */}
        <div className="flex items-center space-x-3">
          {/* Text Size Controls */}
          <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded border border-white/10">
            <span className="text-[11px] text-gray-300 mr-1 hidden sm:inline">Text Size:</span>
            <button 
              onClick={() => handleFontSizeChange(-1)} 
              className="px-1 font-bold hover:text-white"
              title="Decrease Font Size (A-)"
              aria-label="Decrease Font Size"
            >
              A-
            </button>
            <button 
              onClick={() => handleFontSizeChange(0)} 
              className="px-1 font-bold hover:text-white"
              title="Reset Font Size (A)"
              aria-label="Reset Font Size"
            >
              A
            </button>
            <button 
              onClick={() => handleFontSizeChange(1)} 
              className="px-1 font-bold hover:text-white"
              title="Increase Font Size (A+)"
              aria-label="Increase Font Size"
            >
              A+
            </button>
          </div>

          {/* High Contrast Toggle */}
          <button
            onClick={toggleHighContrast}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
              isHighContrast 
                ? 'bg-yellow-400 text-black border-yellow-500' 
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
            }`}
            title="Toggle High Contrast Mode (WCAG 2.1 AA)"
            aria-label="Toggle High Contrast Mode"
          >
            {isHighContrast ? 'Standard Mode' : 'High Contrast'}
          </button>
        </div>
      </div>

      {/* 2. Official Header (National Emblem & Department Identity) */}
      <header className="bg-white border-b border-[#D1D5DB] shadow-xs px-4 sm:px-8 py-3.5">
        <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-4">
            {/* Ashoka Lion Capital Emblem of India */}
            <div className="flex-shrink-0 flex flex-col items-center">
              <img 
                src="https://upload.wikimedia.org/wikipedia/commons/5/55/Emblem_of_India.svg" 
                alt="State Emblem of India - Lion Capital of Ashoka"
                className="h-14 w-auto drop-shadow-xs"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none'
                }}
              />
            </div>

            <div className="border-l-2 border-gray-300 pl-3">
              <p className="text-[11px] font-bold text-[#0B2F5C] uppercase tracking-wide">
                Ministry of Consumer Affairs, Food & Public Distribution
              </p>
              <p className="text-xs font-semibold text-gray-700">
                Department of Consumer Affairs • Legal Metrology Division
              </p>
              <div className="flex items-center space-x-2 mt-0.5">
                <h1 className="text-lg sm:text-xl font-black text-[#0B2F5C] tracking-tight">
                  CAMS
                </h1>
                <span className="text-xs font-bold text-[#1A5699] uppercase tracking-wider">
                  • Compliance And Metrology System
                </span>
                <span className="text-[10px] bg-blue-100 text-[#0B2F5C] px-1.5 py-0.5 rounded font-mono font-bold border border-blue-200">
                  GIGW 3.0
                </span>
              </div>
            </div>
          </div>

          {/* National Branding Badges */}
          <div className="hidden lg:flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 inline-block">
                Legal Metrology Act, 2009
              </span>
              <p className="text-xs text-gray-600 font-medium mt-0.5">Packaged Commodities Rules (PCR), 2011</p>
            </div>
            <div className="p-2 bg-blue-50 border border-blue-200 rounded-xl">
              <Shield className="h-6 w-6 text-[#0B2F5C]" />
            </div>
          </div>
        </div>
      </header>

      {/* 3. Main Content Area (Landing & 3 Role-Based Logins) */}
      <main id="main-content" className="max-w-[1440px] mx-auto w-full px-4 sm:px-8 py-8 space-y-8 flex-1">
        
        {/* Hero Section Banner */}
        <div className="bg-gradient-to-r from-[#0B2F5C] via-[#103D75] to-[#1A5699] text-white rounded-2xl p-6 sm:p-8 shadow-lg border border-blue-900/40 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-3">
            <div className="inline-flex items-center space-x-2 bg-white/10 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm border border-white/20 text-yellow-300">
              <Award className="h-4 w-4" />
              <span>Official Statutory Verification & Enforcement Portal</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black tracking-tight leading-snug">
              Automated AI Compliance Engine for Pre-Packaged Commodities
            </h2>
            <p className="text-sm text-blue-100 leading-relaxed font-normal">
              Empowering Field Officers, District Regulatory Authorities, and Packaged Goods Manufacturers with automated multi-panel label verification, Rule 6 statutory declaration audits, USP rate verification, MPE scale verification, and instant compounding challan generation.
            </p>
          </div>

          {/* Quick Metrics Ticker */}
          <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 mt-4 border-t border-white/15 text-xs">
            <div>
              <p className="text-blue-200">Standards Compliance</p>
              <p className="font-bold text-white text-sm">GIGW 3.0 / WCAG 2.1 AA</p>
            </div>
            <div>
              <p className="text-blue-200">Evidence Integrity</p>
              <p className="font-bold text-white text-sm">SHA-256 Chain of Custody</p>
            </div>
            <div>
              <p className="text-blue-200">Statutory Act</p>
              <p className="font-bold text-white text-sm">Sec 36(1) & Sec 39</p>
            </div>
            <div>
              <p className="text-blue-200">Vision Analysis</p>
              <p className="font-bold text-white text-sm">Google Gemini Vision API</p>
            </div>
          </div>
        </div>

        {/* Global Error Banner if any */}
        {error && (
          <div className="p-4 bg-red-50 border-2 border-[#DC2626] rounded-xl flex items-center space-x-3 text-sm text-[#DC2626] animate-in fade-in">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="font-bold">{error}</span>
          </div>
        )}

        {/* 3 Dedicated Role Logins Grid */}
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#D1D5DB] pb-3">
            <div>
              <h3 className="text-xl font-black text-[#0B2F5C]">
                Select Your Operational Role to Access CAMS Portal
              </h3>
              <p className="text-xs text-[#6B7280]">
                Access authorized regulatory workspaces with role-based access control (RBAC)
              </p>
            </div>
            <span className="text-xs font-mono font-bold text-[#1A5699] bg-blue-50 px-2.5 py-1 rounded border border-blue-200 self-start sm:self-auto">
              Secure Auth v2.0
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* ROLE 1: Field Legal Metrology Inspector */}
            <div className="bg-white rounded-xl border-2 border-blue-200 hover:border-[#0B2F5C] shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-blue-100 text-[#0B2F5C] font-black text-[11px] rounded-full border border-blue-200">
                    ROLE 1: FIELD ENFORCEMENT
                  </span>
                  <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-[#0B2F5C] group-hover:text-white transition-colors">
                    <Scan className="h-5 w-5 text-[#0B2F5C] group-hover:text-white" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-[#111827]">
                    Field Legal Metrology Inspector
                  </h4>
                  <p className="text-xs text-[#1A5699] font-semibold mt-0.5">
                    On-Site Market Audits & Verification
                  </p>
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Execute multi-panel AI packaging scans, physical scale net-weight calibration verification, on-site inspection sessions, and seizure memos.
                </p>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-700">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Rule 6(1) Declarations AI Inspection</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Scale Weighing & MPE Tolerance</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>GPS & Geotagged Field Sessions</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleRoleDirectLogin('INSPECTOR')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0B2F5C] hover:bg-[#072040] text-white font-bold text-xs rounded-goi shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <UserCheck className="h-4 w-4" />
                  <span>Login as Field Inspector</span>
                </button>

                <button
                  onClick={() => {
                    setEmail('inspector@lm.gov.in')
                    setPassword('inspector123')
                    setSelectedRoleModal('INSPECTOR')
                  }}
                  className="w-full py-1.5 px-3 bg-transparent hover:bg-gray-100 text-[#0B2F5C] font-semibold text-[11px] rounded-goi border border-[#D1D5DB] flex items-center justify-center space-x-1"
                >
                  <span>Enter Custom Credentials</span>
                </button>
              </div>
            </div>

            {/* ROLE 2: District Legal Metrology Officer (DLMO / Supervisory) */}
            <div className="bg-white rounded-xl border-2 border-indigo-200 hover:border-[#0B2F5C] shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-indigo-100 text-indigo-900 font-black text-[11px] rounded-full border border-indigo-200">
                    ROLE 2: DLMO & ADJUDICATION
                  </span>
                  <div className="p-2 bg-indigo-50 rounded-lg group-hover:bg-[#0B2F5C] group-hover:text-white transition-colors">
                    <Gavel className="h-5 w-5 text-indigo-900 group-hover:text-white" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-[#111827]">
                    District Legal Metrology Officer
                  </h4>
                  <p className="text-xs text-[#1A5699] font-semibold mt-0.5">
                    Adjudication & Supervisory Intelligence
                  </p>
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Superior district & state analytics, statutory compounding challan issuance under Section 36(1)/39, hearing scheduling, and inspector monitoring.
                </p>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-700">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Statutory Challan & Penalty Management</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Inspector Productivity & Area Metrics</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Evidence-Sealed Audit Trail Oversight</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleRoleDirectLogin('DLMO')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0B2F5C] hover:bg-[#072040] text-white font-bold text-xs rounded-goi shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <ShieldAlert className="h-4 w-4 text-yellow-300" />
                  <span>Login as DLMO Officer</span>
                </button>

                <button
                  onClick={() => {
                    setEmail('dlmo@lm.gov.in')
                    setPassword('dlmo123')
                    setSelectedRoleModal('DLMO')
                  }}
                  className="w-full py-1.5 px-3 bg-transparent hover:bg-gray-100 text-[#0B2F5C] font-semibold text-[11px] rounded-goi border border-[#D1D5DB] flex items-center justify-center space-x-1"
                >
                  <span>Enter Custom Credentials</span>
                </button>
              </div>
            </div>

            {/* ROLE 3: Registered Manufacturer / Packer / Trader */}
            <div className="bg-white rounded-xl border-2 border-emerald-200 hover:border-[#0B2F5C] shadow-sm hover:shadow-md transition-all p-6 flex flex-col justify-between space-y-5 group">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="px-2.5 py-1 bg-emerald-100 text-emerald-900 font-black text-[11px] rounded-full border border-emerald-200">
                    ROLE 3: INDUSTRY DESK
                  </span>
                  <div className="p-2 bg-emerald-50 rounded-lg group-hover:bg-[#0B2F5C] group-hover:text-white transition-colors">
                    <Building2 className="h-5 w-5 text-emerald-800 group-hover:text-white" />
                  </div>
                </div>

                <div>
                  <h4 className="text-base font-bold text-[#111827]">
                    Registered Manufacturer / Packer
                  </h4>
                  <p className="text-xs text-[#1A5699] font-semibold mt-0.5">
                    Pre-Market Self-Check & Rectification
                  </p>
                </div>

                <p className="text-xs text-[#6B7280] leading-relaxed">
                  Pre-market packaging label self-check, USP statutory compliance validation, brand compliance grading, and online challan rectification.
                </p>

                <div className="pt-2 border-t border-gray-100 space-y-1.5 text-[11px] text-gray-700">
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Pre-Market Label Verification</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Rule 6(11) Unit Sale Price Calculator</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <CheckCircle2 className="h-3.5 w-3.5 text-[#16A34A]" />
                    <span>Online Rectification & Grievance Response</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2 pt-3 border-t border-gray-100">
                <button
                  onClick={() => handleRoleDirectLogin('MANUFACTURER')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-4 bg-[#0B2F5C] hover:bg-[#072040] text-white font-bold text-xs rounded-goi shadow-sm flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
                >
                  <Building2 className="h-4 w-4 text-emerald-300" />
                  <span>Login as Registered Manufacturer</span>
                </button>

                <button
                  onClick={() => {
                    setEmail('manufacturer@brand.com')
                    setPassword('brand123')
                    setSelectedRoleModal('MANUFACTURER')
                  }}
                  className="w-full py-1.5 px-3 bg-transparent hover:bg-gray-100 text-[#0B2F5C] font-semibold text-[11px] rounded-goi border border-[#D1D5DB] flex items-center justify-center space-x-1"
                >
                  <span>Enter Custom Credentials</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* 4. Statutory Legal Metrology Highlights & Principles Section */}
        <div className="bg-white rounded-xl border border-[#D1D5DB] p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-[#0B2F5C] flex items-center space-x-2">
              <Shield className="h-5 w-5 text-[#1A5699]" />
              <span>
                Statutory Metrology Compliance Verification Pillars (PCR, 2011)
              </span>
            </h3>
            <span className="text-xs text-gray-500 font-semibold">Standard Operating Procedures</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
              <span className="font-mono font-bold text-[#0B2F5C] bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">Rule 6(1)(a)-(g)</span>
              <h5 className="font-bold text-gray-900 mt-1">Mandatory Declarations</h5>
              <p className="text-gray-600">Generic name, Net quantity, MRP with 'incl. of all taxes', Mfg Month/Year, Packer name, Country of Origin & Customer Care.</p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
              <span className="font-mono font-bold text-[#0B2F5C] bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">Rule 6(11) & 2022 Amend</span>
              <h5 className="font-bold text-gray-900 mt-1">Unit Sale Price (USP)</h5>
              <p className="text-gray-600">Statutory calculation and display of price per g/kg/ml/l on all packages manufactured after October 2022.</p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
              <span className="font-mono font-bold text-[#0B2F5C] bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">Second Schedule PCR</span>
              <h5 className="font-bold text-gray-900 mt-1">Maximum Permissible Error</h5>
              <p className="text-gray-600">Standard tolerance limits (9% for &le;50g down to 1.5% for &gt;1kg) to protect consumers from short-weight delivery.</p>
            </div>

            <div className="p-3.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
              <span className="font-mono font-bold text-[#0B2F5C] bg-blue-100 px-1.5 py-0.5 rounded text-[10px]">Sec 36(1) & Sec 39</span>
              <h5 className="font-bold text-gray-900 mt-1">Digital Compounding Challans</h5>
              <p className="text-gray-600">Instant generation of statutory compounding notices with SHA-256 evidence chain of custody and tracking.</p>
            </div>
          </div>
        </div>

      </main>

      {/* 5. Custom Credentials Login Modal */}
      {selectedRoleModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-gray-200 p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-blue-100 text-[#0B2F5C] rounded-lg">
                  <Lock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-[#111827]">
                    {selectedRoleModal === 'INSPECTOR' ? 'Field Inspector Sign-In' :
                     selectedRoleModal === 'DLMO' ? 'DLMO Officer Sign-In' :
                     'Registered Manufacturer Sign-In'}
                  </h4>
                  <p className="text-xs text-gray-500">Enter your official credentials</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedRoleModal(null)}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 hover:bg-gray-100 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCustomFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Official Email Address <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#D1D5DB] rounded-goi text-sm font-semibold text-gray-900 focus:border-[#1A5699] focus:bg-white outline-none"
                  placeholder="name@domain.gov.in"
                />
                <p className="text-[11px] text-[#6B7280] mt-0.5">Enter registered government or brand email</p>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Password <span className="text-[#DC2626]">*</span>
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-gray-50 border border-[#D1D5DB] rounded-goi text-sm font-semibold text-gray-900 focus:border-[#1A5699] focus:bg-white outline-none"
                  placeholder="••••••••"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setSelectedRoleModal(null)}
                  className="px-4 py-2 bg-transparent text-gray-700 hover:bg-gray-100 rounded-goi text-xs font-bold border border-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2 bg-[#0B2F5C] hover:bg-[#072040] text-white rounded-goi text-xs font-bold shadow flex items-center space-x-1.5 disabled:opacity-50"
                >
                  <span>{isLoading ? 'Authenticating...' : 'Sign In'}</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 6. Official Government Footer (GIGW 3.0 & WCAG 2.1 AA Compliant) */}
      <footer className="bg-[#0B2F5C] text-white border-t-4 border-[#1A5699] mt-12">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs border-b border-blue-900/60 pb-6">
            
            {/* Column 1: Ministry Info */}
            <div className="space-y-2">
              <p className="font-bold text-yellow-400 text-sm">Legal Metrology Division</p>
              <p className="text-gray-300 leading-relaxed">
                Department of Consumer Affairs<br />
                Ministry of Consumer Affairs, Food & Public Distribution<br />
                Krishi Bhawan, New Delhi - 110001
              </p>
            </div>

            {/* Column 2: Essential Portals */}
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">National Portals</p>
              <ul className="space-y-1 text-gray-300">
                <li><a href="https://consumeraffairs.nic.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center space-x-1"><span>Department of Consumer Affairs</span><ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://consumerhelpline.gov.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center space-x-1"><span>National Consumer Helpline (NCH - 1915)</span><ExternalLink className="h-3 w-3" /></a></li>
                <li><a href="https://edaakhil.nic.in" target="_blank" rel="noreferrer" className="hover:underline flex items-center space-x-1"><span>e-Daakhil Consumer Grievance Portal</span><ExternalLink className="h-3 w-3" /></a></li>
              </ul>
            </div>

            {/* Column 3: Legal Metrology Acts & Rules */}
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">Statutory Rules</p>
              <ul className="space-y-1 text-gray-300">
                <li><span>The Legal Metrology Act, 2009 (No. 1 of 2010)</span></li>
                <li><span>LM (Packaged Commodities) Rules, 2011</span></li>
                <li><span>LM (General) Rules, 2011</span></li>
                <li><span>Rule 6(11) Unit Sale Price Amendment (2022)</span></li>
              </ul>
            </div>

            {/* Column 4: Helpdesk & Support */}
            <div className="space-y-2">
              <p className="font-bold text-white text-sm">Regulatory Helpdesk</p>
              <p className="text-gray-300">Toll Free: 1800-11-4000 / 1915</p>
              <p className="text-gray-300">Email: lmd-ca@nic.in</p>
              <p className="text-emerald-400 font-bold">Mon - Sat: 09:30 AM - 06:00 PM</p>
            </div>

          </div>

          {/* Bottom Copyright & GIGW Compliance Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between text-xs text-gray-300 gap-3">
            <p>
              © 2026 Legal Metrology Division, Department of Consumer Affairs, Government of India. All Rights Reserved.
            </p>
            <div className="flex items-center space-x-4">
              <span className="text-yellow-300 font-bold">GIGW 3.0 Compliant</span>
              <span>•</span>
              <span className="text-emerald-300 font-bold">WCAG 2.1 AA Standard</span>
              <span>•</span>
              <span>Digital India</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Login