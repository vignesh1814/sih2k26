import React, { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useRBAC } from '../contexts/RBACContext'
import { UserRole, ROLE_PERMISSIONS } from '../types/auth'
import { 
  Users, 
  Shield, 
  Settings, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  Filter,
  Key,
  Lock,
  Unlock,
  AlertCircle
} from 'lucide-react'
import toast from 'react-hot-toast'

interface User {
  id: string
  name: string
  email: string
  role: UserRole
  department: string
  jurisdiction: string
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED'
  last_login: string
  created_at: string
}

const AdminPanel: React.FC = () => {
  const { user: currentUser } = useAuth()
  const { canManageUser, hasPermission } = useRBAC()
  const [users, setUsers] = useState<User[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [roleFilter, setRoleFilter] = useState<string>('ALL')
  const [statusFilter, setStatusFilter] = useState<string>('ALL')
  const [selectedTab, setSelectedTab] = useState<'users' | 'roles' | 'settings'>('users')
  const [showAddUserModal, setShowAddUserModal] = useState(false)

  useEffect(() => {
    // Simulate fetching users
    const fetchUsers = async () => {
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      // Mock data
      const mockUsers: User[] = [
        {
          id: '1',
          name: 'Admin User',
          email: 'admin@lm.gov.in',
          role: 'ADMIN',
          department: 'Legal Metrology Directorate',
          jurisdiction: 'National',
          status: 'ACTIVE',
          last_login: '2026-09-07T15:30:00Z',
          created_at: '2026-01-01T00:00:00Z'
        },
        {
          id: '2',
          name: 'Field Inspector',
          email: 'inspector@lm.gov.in',
          role: 'INSPECTOR',
          department: 'Metrology Central Enforcement Wing',
          jurisdiction: 'Maharashtra',
          status: 'ACTIVE',
          last_login: '2026-09-07T14:20:00Z',
          created_at: '2026-02-15T00:00:00Z'
        },
        {
          id: '3',
          name: 'Compliance Analyst',
          email: 'analyst@lm.gov.in',
          role: 'ANALYST',
          department: 'Compliance Monitoring Division',
          jurisdiction: 'National',
          status: 'ACTIVE',
          last_login: '2026-09-07T13:10:00Z',
          created_at: '2026-03-01T00:00:00Z'
        },
        {
          id: '4',
          name: 'View Only User',
          email: 'viewer@lm.gov.in',
          role: 'VIEWER',
          department: 'Statistics Division',
          jurisdiction: 'National',
          status: 'ACTIVE',
          last_login: '2026-09-06T16:45:00Z',
          created_at: '2026-04-10T00:00:00Z'
        },
        {
          id: '5',
          name: 'Suspended Inspector',
          email: 'suspended@lm.gov.in',
          role: 'INSPECTOR',
          department: 'Metrology Central Enforcement Wing',
          jurisdiction: 'Delhi',
          status: 'SUSPENDED',
          last_login: '2026-08-20T10:30:00Z',
          created_at: '2026-05-20T00:00:00Z'
        }
      ]
      
      setUsers(mockUsers)
      setIsLoading(false)
    }

    fetchUsers()
  }, [])

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter
    const matchesStatus = statusFilter === 'ALL' || user.status === statusFilter
    return matchesSearch && matchesRole && matchesStatus
  })

  const handleStatusChange = (userId: string, newStatus: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED') => {
    setUsers(users.map(user => 
      user.id === userId ? { ...user, status: newStatus } : user
    ))
    toast.success(`User status updated to ${newStatus}`)
  }

  const handleRoleChange = (userId: string, newRole: UserRole) => {
    if (!canManageUser(newRole)) {
      toast.error('You cannot assign a role equal to or higher than your own')
      return
    }
    
    setUsers(users.map(user => 
      user.id === userId ? { ...user, role: newRole } : user
    ))
    toast.success(`User role updated to ${newRole}`)
  }

  const handleDeleteUser = (userId: string) => {
    const user = users.find(u => u.id === userId)
    if (!canManageUser(user?.role || 'VIEWER')) {
      toast.error('You cannot delete a user with equal or higher role')
      return
    }
    
    setUsers(users.filter(user => user.id !== userId))
    toast.success('User deleted successfully')
  }

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const colors = {
      ACTIVE: 'bg-green-100 text-green-700',
      INACTIVE: 'bg-gray-100 text-gray-700',
      SUSPENDED: 'bg-red-100 text-red-700'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[status as keyof typeof colors]}`}>
        {status}
      </span>
    )
  }

  const RoleBadge: React.FC<{ role: UserRole }> = ({ role }) => {
    const colors = {
      ADMIN: 'bg-purple-100 text-purple-700',
      INSPECTOR: 'bg-blue-100 text-blue-700',
      ANALYST: 'bg-green-100 text-green-700',
      VIEWER: 'bg-gray-100 text-gray-700'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[role]}`}>
        {role}
      </span>
    )
  }

  if (!hasPermission('users', 'manage')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access the admin panel.</p>
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
        <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
        <p className="text-gray-600 mt-1">User management and system configuration</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setSelectedTab('users')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'users'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Users className="h-4 w-4 inline mr-2" />
            Users
          </button>
          <button
            onClick={() => setSelectedTab('roles')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'roles'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Shield className="h-4 w-4 inline mr-2" />
            Roles & Permissions
          </button>
          <button
            onClick={() => setSelectedTab('settings')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'settings'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            <Settings className="h-4 w-4 inline mr-2" />
            System Settings
          </button>
        </nav>
      </div>

      {selectedTab === 'users' && (
        <div className="space-y-4">
          {/* Actions */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <select
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">Admin</option>
                  <option value="INSPECTOR">Inspector</option>
                  <option value="ANALYST">Analyst</option>
                  <option value="VIEWER">Viewer</option>
                </select>
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>

            <button
              onClick={() => setShowAddUserModal(true)}
              className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add User</span>
            </button>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Department
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last Login
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-xs text-gray-500">{user.email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {user.department}
                      </td>
                      <td className="px-6 py-4">
                        <StatusBadge status={user.status} />
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-700">
                        {new Date(user.last_login).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {canManageUser(user.role) && (
                            <>
                              <button
                                onClick={() => handleStatusChange(user.id, user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                title={user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              >
                                {user.status === 'ACTIVE' ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
                              </button>
                              <button
                                onClick={() => handleDeleteUser(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </>
                          )}
                          <button
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {filteredUsers.length === 0 && (
              <div className="text-center py-12">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No users found matching your criteria.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {selectedTab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Role Permissions Matrix</h2>
            <div className="space-y-4">
              {(Object.keys(ROLE_PERMISSIONS) as UserRole[]).map((role) => (
                <div key={role} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <RoleBadge role={role} />
                      <h3 className="font-medium text-gray-900">{role}</h3>
                    </div>
                    <Key className="h-5 w-5 text-gray-400" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {ROLE_PERMISSIONS[role].map((permission) => (
                      <div key={permission.id} className="flex items-center space-x-2 text-sm">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-gray-700">{permission.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedTab === 'settings' && (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow-sm p-6 border border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">System Configuration</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Maintenance Mode</p>
                  <p className="text-sm text-gray-600">Temporarily disable user access</p>
                </div>
                <button className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors">
                  Enable
                </button>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Audit Log Retention</p>
                  <p className="text-sm text-gray-600">Days to keep audit logs</p>
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option>30 days</option>
                  <option>60 days</option>
                  <option>90 days</option>
                  <option>1 year</option>
                </select>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Session Timeout</p>
                  <p className="text-sm text-gray-600">User session duration</p>
                </div>
                <select className="px-4 py-2 border border-gray-300 rounded-lg">
                  <option>30 minutes</option>
                  <option>1 hour</option>
                  <option>4 hours</option>
                  <option>8 hours</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminPanel