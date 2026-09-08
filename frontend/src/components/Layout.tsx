import React, { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useRBAC } from '../contexts/RBACContext'
import { 
  LayoutDashboard, 
  Scan, 
  FileText, 
  History, 
  LogOut, 
  Menu, 
  X, 
  Shield,
  Book,
  Users,
  BarChart3,
  Building2,
  AlertTriangle
} from 'lucide-react'

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { user, logout } = useAuth()
  const { hasPermission } = useRBAC()
  const location = useLocation()
  const navigate = useNavigate()

  const navigation = [
    // Superior Specific
    { 
      name: 'Superior Analytics & Challans', 
      href: '/superior-analytics', 
      icon: BarChart3, 
      permission: { resource: 'superior_analytics', action: 'view' },
      badge: 'HQ Authority'
    },
    // Manufacturer Specific
    { 
      name: 'Challans & Audit Reports', 
      href: '/manufacturer-portal', 
      icon: Building2, 
      permission: { resource: 'manufacturer_portal', action: 'view' },
      badge: 'Brand Portal'
    },
    // Inspector & General
    { 
      name: 'Inspector Dashboard', 
      href: '/dashboard', 
      icon: LayoutDashboard, 
      permission: { resource: 'dashboard', action: 'view' },
      hideForRoles: ['MANUFACTURER', 'SUPERIOR']
    },
    { 
      name: user?.role === 'MANUFACTURER' ? 'Pre-Market Label Scan' : 'Scan Package', 
      href: '/scan', 
      icon: Scan, 
      permission: { resource: 'scan', action: 'create' } 
    },
    { 
      name: user?.role === 'MANUFACTURER' ? 'Market Inspection Records' : 'Inspection Reports', 
      href: '/reports', 
      icon: FileText, 
      permission: { resource: 'reports', action: 'view' } 
    },
    { 
      name: 'Audit Trail', 
      href: '/audit-trail', 
      icon: History, 
      permission: { resource: 'audit', action: 'view' } 
    },
    { 
      name: 'LMPC Legal Standards', 
      href: '/documentation', 
      icon: Book, 
      permission: { resource: 'docs', action: 'view' } 
    },
  ]

  const adminNavigation = [
    { name: 'Admin Panel', href: '/admin', icon: Users, permission: { resource: 'users', action: 'manage' } },
  ]

  const filteredNavigation = navigation.filter(item => {
    if (item.hideForRoles && user?.role && item.hideForRoles.includes(user.role)) {
      return false
    }
    return hasPermission(item.permission.resource, item.permission.action)
  })

  const filteredAdminNavigation = adminNavigation.filter(item =>
    hasPermission(item.permission.resource, item.permission.action)
  )

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const getRoleBadge = (role?: string) => {
    switch(role) {
      case 'SUPERIOR':
        return { label: 'Superior Officer', color: 'bg-purple-100 text-purple-800 border-purple-200' }
      case 'MANUFACTURER':
        return { label: 'Manufacturer Portal', color: 'bg-amber-100 text-amber-800 border-amber-200' }
      case 'ADMIN':
        return { label: 'System Admin', color: 'bg-red-100 text-red-800 border-red-200' }
      default:
        return { label: 'Field Inspector', color: 'bg-blue-100 text-blue-800 border-blue-200' }
    }
  }

  const roleMeta = getRoleBadge(user?.role)

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between px-4 h-16 border-b border-gray-200 bg-slate-900 text-white">
            <div className="flex items-center space-x-2.5">
              <div className="p-1.5 bg-blue-600 rounded-lg">
                <Shield className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-sm font-bold tracking-tight text-white">SIH26034 LMPC</h1>
                <p className="text-[10px] text-blue-300 font-medium tracking-wide uppercase">Legal Metrology Dept.</p>
              </div>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)} 
              className="lg:hidden text-gray-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User info */}
          <div className="p-4 border-b border-gray-200 bg-slate-50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-sm">
                {user?.name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{user?.name}</p>
                <div className="mt-0.5">
                  <span className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded border ${roleMeta.color}`}>
                    {roleMeta.label}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <div className="flex items-center space-x-3">
                    <item.icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                    <span className="truncate">{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded font-semibold ${
                      isActive ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              )
            })}
            
            {filteredAdminNavigation.length > 0 && (
              <>
                <div className="pt-4 pb-2">
                  <p className="px-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    System Administration
                  </p>
                </div>
                {filteredAdminNavigation.map((item) => {
                  const isActive = location.pathname === item.href
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={`flex items-center px-3.5 py-2.5 text-sm font-medium rounded-lg transition-all ${
                        isActive
                          ? 'bg-blue-600 text-white shadow-sm'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      onClick={() => setSidebarOpen(false)}
                    >
                      <item.icon className={`mr-3 h-4 w-4 ${isActive ? 'text-white' : 'text-gray-500'}`} />
                      {item.name}
                    </Link>
                  )
                })}
              </>
            )}
          </nav>

          {/* Logout */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              id="sidebar-logout-btn"
              onClick={handleLogout}
              className="flex items-center justify-center w-full px-4 py-2.5 text-sm font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-colors shadow-sm"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out Session
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="lg:pl-64">
        {/* Top bar */}
        <div className="bg-white border-b border-gray-200">
          <div className="flex items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100"
            >
              <Menu className="h-6 w-6" />
            </button>
            
            <div className="flex-1 flex items-center justify-between">
              <div className="flex-1 flex">
                <h1 className="text-xl font-semibold text-gray-900">
                  Legal Metrology Compliance Engine
                </h1>
              </div>
              
              <div className="ml-4 flex items-center space-x-4">
                <div className="hidden sm:flex flex-col text-right text-xs text-gray-500">
                  <span className="font-semibold text-gray-700">{user?.name}</span>
                  <span>{user?.department} • {user?.jurisdiction}</span>
                </div>
                <button
                  id="topbar-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center space-x-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition-all shadow-sm"
                  title="Logout session"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Logout</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Page content */}
        <main className="p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}

export default Layout