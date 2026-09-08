import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { RBACProvider } from './contexts/RBACContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Scan from './pages/Scan'
import Reports from './pages/Reports'
import AuditTrail from './pages/AuditTrail'
import AdminPanel from './pages/AdminPanel'
import Documentation from './pages/Documentation'
import ProtectedRoute from './components/ProtectedRoute'

function App() {
  return (
    <AuthProvider>
      <RBACProvider>
        <Router>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/*"
              element={
                <ProtectedRoute>
                  <Layout>
                    <Routes>
                      <Route path="/" element={<Navigate to="/dashboard" replace />} />
                      <Route path="/dashboard" element={<Dashboard />} />
                      <Route path="/scan" element={<Scan />} />
                      <Route path="/reports" element={<Reports />} />
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