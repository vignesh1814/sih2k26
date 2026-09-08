import React, { useState, useEffect } from 'react'
import { useRBAC } from '../contexts/RBACContext'
import { 
  History, 
  Search, 
  Filter, 
  User, 
  Shield,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  FileText
} from 'lucide-react'

import { fetchAuditLogs as fetchAuditLogsApi } from '../services/api'

interface AuditLog {
  id: string
  timestamp: string
  user_id: string
  user_name: string
  user_role: string
  action: string
  resource: string
  details: string
  ip_address: string
  status: 'SUCCESS' | 'FAILURE' | 'WARNING'
}

const AuditTrail: React.FC = () => {
  const { hasPermission } = useRBAC()
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')

  useEffect(() => {
    // Fetch persistent statutory audit logs from MongoDB
    const fetchAuditLogsData = async () => {
      try {
        const data = await fetchAuditLogsApi(100)
        if (data && data.logs && data.logs.length > 0) {
          const mapped: AuditLog[] = data.logs.map((l: any, idx: number) => ({
            id: l._id || String(idx + 1),
            timestamp: l.timestamp || new Date().toISOString(),
            user_id: l.user_id || '1',
            user_name: l.user_name || 'Field Inspector',
            user_role: l.user_role || 'INSPECTOR',
            action: l.action || 'AUDIT_EVENT',
            resource: l.resource || '/api/v1',
            details: l.details || 'Event logged',
            ip_address: l.ip_address || '127.0.0.1',
            status: l.status === 'SUCCESS' ? 'SUCCESS' : (l.status === 'FAILURE' ? 'FAILURE' : 'WARNING')
          }))
          setLogs(mapped)
          setIsLoading(false)
          return
        }
      } catch (err) {
        console.warn('Failed to load audit logs from MongoDB, using fallback:', err)
      }

      // Mock fallback data
      const mockLogs: AuditLog[] = [
        {
          id: '1',
          timestamp: '2026-09-07T15:30:00Z',
          user_id: '2',
          user_name: 'Field Inspector',
          user_role: 'INSPECTOR',
          action: 'SCAN_CREATE',
          resource: '/api/v1/scan',
          details: 'Created new scan for package ID: scan_12345',
          ip_address: '192.168.1.100',
          status: 'SUCCESS'
        },
        {
          id: '2',
          timestamp: '2026-09-07T15:25:00Z',
          user_id: '1',
          user_name: 'Admin User',
          user_role: 'ADMIN',
          action: 'USER_UPDATE',
          resource: '/api/v1/admin/users',
          details: 'Updated role for user ID: 3 to ANALYST',
          ip_address: '192.168.1.50',
          status: 'SUCCESS'
        },
        {
          id: '3',
          timestamp: '2026-09-07T15:20:00Z',
          user_id: '2',
          user_name: 'Field Inspector',
          user_role: 'INSPECTOR',
          action: 'REPORT_DOWNLOAD',
          resource: '/api/v1/report/scan_12345/download',
          details: 'Downloaded compliance report for scan_12345',
          ip_address: '192.168.1.100',
          status: 'SUCCESS'
        },
        {
          id: '4',
          timestamp: '2026-09-07T15:15:00Z',
          user_id: '3',
          user_name: 'Compliance Analyst',
          user_role: 'ANALYST',
          action: 'LOGIN_ATTEMPT',
          resource: '/auth/login',
          details: 'Failed login attempt - invalid credentials',
          ip_address: '192.168.1.75',
          status: 'FAILURE'
        },
        {
          id: '5',
          timestamp: '2026-09-07T15:10:00Z',
          user_id: '2',
          user_name: 'Field Inspector',
          user_role: 'INSPECTOR',
          action: 'SCAN_VIEW',
          resource: '/api/v1/scan/scan_12344',
          details: 'Viewed scan results for scan_12344',
          ip_address: '192.168.1.100',
          status: 'SUCCESS'
        }
      ]
      
      setLogs(mockLogs)
      setIsLoading(false)
    }

    fetchAuditLogsData()
  }, [])

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.details.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesAction = actionFilter === 'ALL' || log.action === actionFilter
    const matchesStatus = statusFilter === 'ALL' || log.status === statusFilter
    return matchesSearch && matchesAction && matchesStatus
  })

  const StatusIcon: React.FC<{ status: string }> = ({ status }) => {
    const icons = {
      SUCCESS: <CheckCircle className="h-4 w-4 text-green-600" />,
      FAILURE: <XCircle className="h-4 w-4 text-red-600" />,
      WARNING: <AlertTriangle className="h-4 w-4 text-yellow-600" />
    }
    
    const colors = {
      SUCCESS: 'bg-green-100 text-green-700',
      FAILURE: 'bg-red-100 text-red-700',
      WARNING: 'bg-yellow-100 text-yellow-700'
    }

    return (
      <div className="flex items-center space-x-2">
        {icons[status as keyof typeof icons]}
        <span className={`text-xs font-medium px-2 py-1 rounded ${colors[status as keyof typeof colors]}`}>
          {status}
        </span>
      </div>
    )
  }

  const ActionBadge: React.FC<{ action: string }> = ({ action }) => {
    const colors: Record<string, string> = {
      'SCAN_CREATE': 'bg-blue-100 text-blue-700',
      'SCAN_VIEW': 'bg-blue-50 text-blue-600',
      'REPORT_DOWNLOAD': 'bg-green-100 text-green-700',
      'USER_UPDATE': 'bg-purple-100 text-purple-700',
      'LOGIN_ATTEMPT': 'bg-orange-100 text-orange-700',
      'REPORT_GENERATE': 'bg-green-50 text-green-600'
    }

    const defaultColor = 'bg-gray-100 text-gray-700'

    return (
      <span className={`text-xs font-medium px-2 py-1 rounded ${colors[action] || defaultColor}`}>
        {action.replace('_', ' ')}
      </span>
    )
  }

  if (!hasPermission('audit', 'view')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access audit logs.</p>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Audit Trail</h1>
        <p className="text-gray-600 mt-1">System activity logs and security events</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search logs by user, action, or details..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="h-5 w-5 text-gray-400" />
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Actions</option>
              <option value="SCAN_CREATE">Scan Create</option>
              <option value="SCAN_VIEW">Scan View</option>
              <option value="REPORT_DOWNLOAD">Report Download</option>
              <option value="USER_UPDATE">User Update</option>
              <option value="LOGIN_ATTEMPT">Login Attempt</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">All Status</option>
              <option value="SUCCESS">Success</option>
              <option value="FAILURE">Failure</option>
              <option value="WARNING">Warning</option>
            </select>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5 text-gray-400" />
              <span className="text-sm font-medium text-gray-700">
                Showing {filteredLogs.length} of {logs.length} logs
              </span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Clock className="h-4 w-4" />
              <span>Last 24 hours</span>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredLogs.map((log) => (
            <div key={log.id} className="p-4 hover:bg-gray-50">
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-4 flex-1">
                  <div className="p-2 bg-gray-100 rounded-lg">
                    <User className="h-5 w-5 text-gray-600" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-1">
                      <p className="text-sm font-medium text-gray-900">{log.user_name}</p>
                      <span className="text-xs text-gray-500">•</span>
                      <span className="text-xs text-gray-500">{log.user_role}</span>
                      <ActionBadge action={log.action} />
                    </div>
                    
                    <p className="text-sm text-gray-700 mb-2">{log.details}</p>
                    
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="h-3 w-3" />
                        <span>{new Date(log.timestamp).toLocaleString()}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <FileText className="h-3 w-3" />
                        <span>{log.resource}</span>
                      </span>
                      <span>IP: {log.ip_address}</span>
                    </div>
                  </div>
                </div>
                
                <StatusIcon status={log.status} />
              </div>
            </div>
          ))}
        </div>

        {filteredLogs.length === 0 && (
          <div className="text-center py-12">
            <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No audit logs found matching your criteria.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default AuditTrail