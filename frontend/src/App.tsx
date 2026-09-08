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
import AdminPanel from './pages/AdminPanel'
import SuperiorAnalytics from './pages/SuperiorAnalytics'
import ManufacturerPortal from './pages/ManufacturerPortal'
import Documentation from './pages/Documentation'
import EntityIdentification from './pages/EntityIdentification'
import QuantityVerification from './pages/QuantityVerification'
import EntityHistory from './pages/EntityHistory'
import SeizureEvidence from './pages/SeizureEvidence'
import OfflineSync from './pages/OfflineSync'
import ProtectedRoute from './components/ProtectedRoute'

const RoleDefaultRedirect: React.FC = () => {
  const { user } = useAuth()
  if (user?.role === 'SUPERIOR') {
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
                      <Route path="/entities" element={<EntityIdentification />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/quantity" element={<QuantityVerification />} />
                      <Route path="/reports" element={<Reports />} />
                      <Route path="/history" element={<EntityHistory />} />
                      <Route path="/seizures" element={<SeizureEvidence />} />
                      <Route path="/sync" element={<OfflineSync />} />
                      <Route 
                        path="/superior-analytics" 
                        element={
                          <ProtectedRoute requiredRoles={['SUPERIOR', 'ADMIN']}>
                            <SuperiorAnalytics />
                          </ProtectedRoute>
                        } 
                      />
                      <Route 
                        path="/manufacturer-portal" 
                        element={
                          <ProtectedRoute requiredRoles={['MANUFACTURER', 'SUPERIOR', 'ADMIN']}>
                            <ManufacturerPortal />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/audit-trail" element={<AuditTrail />} />
                      <Route 
                        path="/admin" 
                        element={
                          <ProtectedRoute requiredRoles={['ADMIN']}>
                            <AdminPanel />
                          </ProtectedRoute>
                        } 
                      />
                      <Route path="/documentation" element={<Documentation />} />
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