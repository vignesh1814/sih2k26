import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRBAC } from '../contexts/RBACContext'
import { 
  LayoutDashboard, 
  Scan, 
  FileText, 
  LogOut, 
  Menu, 
  X, 
  Shield, 
  Book, 
  BarChart3, 
  Building2, 
  Scale,
  Globe,
  Award,
  ExternalLink
} from 'lucide-react'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [fontSizeOffset, setFontSizeOffset] = useState<number>(0)
  const [isHighContrast, setIsHighContrast] = useState<boolean>(false)
  const [language, setLanguage] = useState<'EN' | 'HI'>('EN')

  const { user, logout } = useAuth()
  const { hasPermission, hasAnyRole } = useRBAC()
  const location = useLocation()
  const navigate = useNavigate()

  const handleFontSizeChange = (delta: number) => {
    const newOffset = Math.max(-2, Math.min(4, fontSizeOffset + delta))
    setFontSizeOffset(newOffset)
    document.documentElement.style.fontSize = `${16 + newOffset}px`
  }

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

  const isDLMO = hasAnyRole(['DLMO', 'SUPERIOR', 'ADMIN'])
  const isInspector = user?.role === 'INSPECTOR'
  const isManufacturer = user?.role === 'MANUFACTURER'

  const navigation = [
    // 1. DLMO Navigation Items
    ...(isDLMO ? [
      { 
        name: language === 'HI' ? 'डीएलएमओ एनालिटिक्स' : 'DLMO Analytics', 
        href: '/superior-analytics', 
        icon: BarChart3, 
        badge: 'Authority',
        permission: { resource: 'superior_analytics', action: 'view' }
      },
      { 
        name: language === 'HI' ? 'निरीक्षण रिपोर्ट एवं चालान' : 'Inspection Reports & Challans', 
        href: '/reports', 
        icon: FileText, 
        permission: { resource: 'reports', action: 'view' } 
      },
      { 
        name: language === 'HI' ? 'ऑडिट ट्रेल' : 'Statutory Audit Trail', 
        href: '/audit-trail', 
        icon: Shield, 
        permission: { resource: 'audit', action: 'view' }
      },
      { 
        name: language === 'HI' ? 'वैधानिक नियमावली' : 'Statutory Manual (PCR)', 
        href: '/documentation', 
        icon: Book, 
        permission: { resource: 'docs', action: 'view' } 
      },
    ] : []),

    // 2. Field Inspector Navigation Items
    ...(isInspector ? [
      { 
        name: language === 'HI' ? 'निरीक्षक डैशबोर्ड' : 'Inspector Dashboard', 
        href: '/dashboard', 
        icon: LayoutDashboard, 
        permission: { resource: 'dashboard', action: 'view' }
      },
      { 
        name: language === 'HI' ? 'पैकेज लेबल स्कैन' : 'Scan Package Label', 
        href: '/scan', 
        icon: Scan, 
        badge: 'Rule 6 OCR',
        permission: { resource: 'scan', action: 'create' } 
      },
      {
        name: language === 'HI' ? 'मात्रा सत्यापन (MPE)' : 'Physical Quantity Verification', 
        href: '/quantity', 
        icon: Scale, 
        badge: 'Sched. 2 MPE',
        permission: { resource: 'scan', action: 'create' }
      },
      { 
        name: language === 'HI' ? 'निरीक्षण रिपोर्ट' : 'Inspection Reports', 
        href: '/reports', 
        icon: FileText, 
        permission: { resource: 'reports', action: 'view' } 
      },
      {
        name: language === 'HI' ? 'ऑफलाइन फील्ड सिंक' : 'Offline Field Sync', 
        href: '/sync', 
        icon: Shield, 
        permission: { resource: 'scan', action: 'create' }
      },
      { 
        name: language === 'HI' ? 'वैधानिक नियमावली' : 'Statutory Manual', 
        href: '/documentation', 
        icon: Book, 
        permission: { resource: 'docs', action: 'view' } 
      },
    ] : []),

    // 3. Manufacturer Navigation Items
    ...(isManufacturer ? [
      { 
        name: language === 'HI' ? 'ब्रांड अनुपालन कंसोल' : 'Brand Compliance Portal', 
        href: '/manufacturer-portal', 
        icon: Building2, 
        badge: 'Brand Console',
        permission: { resource: 'manufacturer_portal', action: 'view' }
      },
      { 
        name: language === 'HI' ? 'पूर्व-बाजार स्व-सत्यापन' : 'Pre-Market Self-Check', 
        href: '/scan', 
        icon: Scan, 
        badge: 'Pre-Market',
        permission: { resource: 'scan', action: 'create' } 
      },
      { 
        name: language === 'HI' ? 'निरीक्षण अभिलेखागार' : 'Inspection Archive', 
        href: '/reports', 
        icon: FileText, 
        permission: { resource: 'reports', action: 'view' } 
      },
      { 
        name: language === 'HI' ? 'पैकेजिंग दिशानिर्देश' : 'Packaging Guidelines', 
        href: '/documentation', 
        icon: Book, 
        permission: { resource: 'docs', action: 'view' } 
      },
    ] : [])
  ]

  const filteredNavigation = navigation.filter(item => 
    hasPermission(item.permission.resource, item.permission.action)
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadge = (role?: string) => {
    switch(role) {
      case 'DLMO':
      case 'SUPERIOR':
        return { label: 'District Legal Metrology Officer (DLMO)', color: 'bg-indigo-100 text-indigo-900 border-indigo-300' }
      case 'MANUFACTURER':
        return { label: 'Registered Manufacturer / Packer', color: 'bg-emerald-100 text-emerald-900 border-emerald-300' }
      case 'ADMIN':
        return { label: 'National Administrator', color: 'bg-red-100 text-red-900 border-red-300' }
      default:
        return { label: 'Field Legal Metrology Inspector', color: 'bg-blue-100 text-[#0B2F5C] border-blue-300' }
    }
  }

  const roleMeta = getRoleBadge(user?.role)

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-[#111827] flex flex-col font-sans">
      {/* Skip to Main Content */}
      <a href="#portal-content" className="skip-link">
        {language === 'HI' ? 'मुख्य सामग्री पर जाएं' : 'Skip to Main Content'}
      </a>

      {/* 1. Global Top Utility Bar (GIGW 3.0) */}
      <div className="bg-[#072040] text-gray-200 text-xs border-b border-blue-900/40 px-4 sm:px-8 py-1.5 flex items-center justify-between z-30">
        <div className="flex items-center space-x-3">
          <span className="font-semibold text-gray-300">
            {language === 'HI' ? 'भारत सरकार | Government of India' : 'Government of India | भारत सरकार'}
          </span>
          <span className="hidden md:inline text-gray-400">•</span>
          <span className="hidden md:inline text-gray-300">
            {language === 'HI' ? 'उपभोक्ता मामले विभाग' : 'Department of Consumer Affairs'}
          </span>
        </div>

        {/* Accessibility & Language Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1 bg-white/10 px-2 py-0.5 rounded border border-white/10">
            <button onClick={() => handleFontSizeChange(-1)} className="px-1 font-bold hover:text-white" title="Decrease Font Size (A-)">A-</button>
            <button onClick={() => handleFontSizeChange(0)} className="px-1 font-bold hover:text-white" title="Reset Font Size (A)">A</button>
            <button onClick={() => handleFontSizeChange(1)} className="px-1 font-bold hover:text-white" title="Increase Font Size (A+)">A+</button>
          </div>

          <button
            onClick={toggleHighContrast}
            className={`px-2 py-0.5 rounded text-[11px] font-bold border transition-colors ${
              isHighContrast 
                ? 'bg-yellow-400 text-black border-yellow-500' 
                : 'bg-white/10 hover:bg-white/20 text-white border-white/10'
            }`}
            title="Toggle High Contrast Mode (WCAG 2.1 AA)"
          >
            {isHighContrast ? 'Standard' : 'High Contrast'}
          </button>

          <button
            onClick={() => setLanguage(lang => lang === 'EN' ? 'HI' : 'EN')}
            className="px-2 py-0.5 bg-[#1A5699] hover:bg-blue-600 text-white font-bold rounded text-[11px] flex items-center space-x-1"
          >
            <Globe className="h-3 w-3" />
            <span>{language === 'EN' ? 'हिन्दी' : 'English'}</span>
          </button>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/60 z-40 lg:hidden backdrop-blur-xs"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 2. Sidebar Navigation */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#0B2F5C] text-white shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} flex flex-col justify-between`}>
        <div className="flex flex-col h-full">
          {/* Logo Header */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-blue-900/60 bg-[#072040]">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-[#1A5699] rounded-goi">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight text-white">CAMS</h1>
                <p className="text-[10px] text-blue-200 font-semibold tracking-wider uppercase">Legal Metrology Division</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden text-gray-300 hover:text-white p-1"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Profile Card */}
          <div className="p-4 border-b border-blue-900/50 bg-white/5">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-goi bg-[#1A5699] text-white flex items-center justify-center font-black text-sm shadow-xs border border-white/20">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                <div className="mt-0.5">
                  <span className="inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded bg-white/10 text-yellow-300 border border-white/10 truncate max-w-[170px]">
                    {user?.role === 'INSPECTOR' ? 'Field Inspector' : user?.role === 'DLMO' ? 'DLMO Officer' : 'Manufacturer'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-goi transition-all ${
                    isActive
                      ? 'bg-[#1A5699] text-white shadow-xs'
                      : 'text-gray-200 hover:bg-white/10 hover:text-white'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center space-x-2.5">
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-yellow-300' : 'text-blue-200'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isActive ? 'bg-white/20 text-white' : 'bg-black/20 text-blue-200'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
          </nav>

          {/* Logout Section */}
          <div className="p-3 border-t border-blue-900/60 bg-[#072040]">
            <button
              id="sidebar-logout-btn"
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2.5 text-xs font-bold text-red-200 hover:text-white bg-red-950/40 hover:bg-red-900/60 border border-red-800/40 rounded-goi transition-colors"
            >
              <LogOut className="mr-2 h-4 w-4 text-red-300" />
              <span>{language === 'HI' ? 'सत्र समाप्त (लॉगआउट)' : 'Sign Out Session'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. Main Content Container */}
      <div className="lg:pl-64 flex-1 flex flex-col justify-between">
        {/* Top Navbar */}
        <header className="bg-white border-b border-[#D1D5DB] sticky top-0 z-30 shadow-xs">
          <div className="flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-goi text-gray-700 hover:bg-gray-100"
              aria-label="Open Navigation"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 flex items-center justify-between ml-2 lg:ml-0">
              <div className="flex items-center space-x-2">
                <h2 className="text-base font-black text-[#0B2F5C] tracking-tight">
                  CAMS <span className="hidden sm:inline font-semibold text-xs text-[#1A5699]">• Compliance And Metrology System</span>
                </h2>
                <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  PCR 2011 Verified
                </span>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="hidden sm:flex flex-col text-right text-xs">
                  <span className="font-bold text-[#111827]">{user?.name}</span>
                  <span className="text-[11px] text-[#6B7280]">{user?.department || 'Legal Metrology Division'}</span>
                </div>
                <button
                  id="topbar-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold text-red-700 hover:text-red-800 bg-red-50 hover:bg-red-100 border border-red-200 rounded-goi transition-all shadow-xs"
                  title="Logout session"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">{language === 'HI' ? 'लॉगआउट' : 'Logout'}</span>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main id="portal-content" className="p-4 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto flex-1">
          {children}
        </main>

        {/* Official Footer */}
        <footer className="bg-white border-t border-[#D1D5DB] py-4 px-4 sm:px-8 text-xs text-[#6B7280] mt-8">
          <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>
              © 2026 Legal Metrology Division, Department of Consumer Affairs, Government of India.
            </p>
            <div className="flex items-center space-x-3 font-semibold text-[11px]">
              <span className="text-[#0B2F5C]">GIGW 3.0 Standard</span>
              <span>•</span>
              <span className="text-[#16A34A]">WCAG 2.1 AA Compliant</span>
              <span>•</span>
              <span className="text-[#1A5699]">Digital India</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default Layout