import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { RBACProvider } from './contexts/RBACContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import Reports from './pages/Reports'
import AuditTrail from './pages/AuditTrail'
import SuperiorAnalytics from './pages/SuperiorAnalytics'
import ManufacturerPortal from './pages/ManufacturerPortal'
import Documentation from './pages/Documentation'
import QuantityVerification from './pages/QuantityVerification'
import OfflineSync from './pages/OfflineSync'
import ProtectedRoute from './components/ProtectedRoute'

const RoleDefaultRedirect: React.FC = () => {
  const { user } = useAuth()
  if (user?.role === 'DLMO' || user?.role === 'SUPERIOR') {
    return <Navigate to="/superior-analytics" replace />
  }
  if (user?.role === 'MANUFACTURER') {
    return <Navigate to="/manufacturer-portal" replace />
  }
  return <Navigate to="/dashboard" replace />
}

function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<RoleDefaultRedirect />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/quantity" element={<QuantityVerification />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/sync" element={<OfflineSync />} />
                      <Route 
                        path="/superior-analytics" 
                        element={
                          <ProtectedRoute requiredRoles={['DLMO', 'SUPERIOR', 'ADMIN']}>
                            <SuperiorAnalytics />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/manufacturer-portal" 
                        element={
                          <ProtectedRoute requiredRoles={['MANUFACTURER', 'DLMO', 'SUPERIOR', 'ADMIN']}>
                            <ManufacturerPortal />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/audit-trail" element={<AuditTrail />} />
                      <Route path="/documentation" element={<Documentation />} />
                      
                      {/* Backward compatibility redirects */}
                      <Route path="/entities" element={<Navigate to="/scan" replace />} />
                      <Route path="/seizures" element={<Navigate to="/reports" replace />} />
                      <Route path="/history" element={<Navigate to="/reports" replace />} />
                      <Route path="/admin" element={<Navigate to="/superior-analytics" replace />} />
                      <Route path="*" element={<RoleDefaultRedirect />} />
                    </Routes>
                  </Layout>
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </RBACProvider>
    </AuthProvider>
  )
}

export default App