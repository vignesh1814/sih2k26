export type UserRole = 'ADMIN' | 'INSPECTOR' | 'ANALYST' | 'VIEWER'

export interface Permission {
  id: string
  name: string
  description: string
  resource: string
  action: string
}

export interface RolePermissions {
  role: UserRole
  permissions: Permission[]
}

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    { id: 'admin_all', name: 'Full Access', description: 'Complete system access', resource: '*', action: '*' },
    { id: 'user_manage', name: 'User Management', description: 'Create, edit, delete users', resource: 'users', action: 'manage' },
    { id: 'role_manage', name: 'Role Management', description: 'Manage user roles and permissions', resource: 'roles', action: 'manage' },
    { id: 'audit_view', name: 'View Audit Logs', description: 'Access system audit trails', resource: 'audit', action: 'view' },
    { id: 'config_manage', name: 'System Configuration', description: 'Modify system settings', resource: 'config', action: 'manage' },
    { id: 'scan_all', name: 'All Scan Operations', description: 'Perform any scanning operation', resource: 'scan', action: '*' },
    { id: 'report_all', name: 'All Report Operations', description: 'Generate and manage all reports', resource: 'reports', action: '*' },
  ],
  INSPECTOR: [
    { id: 'scan_create', name: 'Create Scans', description: 'Initiate new compliance scans', resource: 'scan', action: 'create' },
    { id: 'scan_view', name: 'View Scans', description: 'View scan results and details', resource: 'scan', action: 'view' },
    { id: 'report_view', name: 'View Reports', description: 'View statutory reports', resource: 'reports', action: 'view' },
    { id: 'report_generate', name: 'Generate Reports', description: 'Generate compliance reports', resource: 'reports', action: 'generate' },
    { id: 'report_download', name: 'Download Reports', description: 'Download PDF reports', resource: 'reports', action: 'download' },
    { id: 'audit_view', name: 'View Audit Logs', description: 'View statutory audit trail', resource: 'audit', action: 'view' },
    { id: 'docs_view', name: 'View Documentation', description: 'View legal metrology references', resource: 'docs', action: 'view' },
  ],
  ANALYST: [
    { id: 'scan_view', name: 'View Scans', description: 'View scan results and details', resource: 'scan', action: 'view' },
    { id: 'report_view', name: 'View Reports', description: 'View generated reports', resource: 'reports', action: 'view' },
    { id: 'report_download', name: 'Download Reports', description: 'Download PDF reports', resource: 'reports', action: 'download' },
    { id: 'audit_view', name: 'View Audit Logs', description: 'Access system audit trails', resource: 'audit', action: 'view' },
    { id: 'analytics_view', name: 'View Analytics', description: 'Access compliance analytics', resource: 'analytics', action: 'view' },
  ],
  VIEWER: [
    { id: 'scan_view', name: 'View Scans', description: 'View scan results and details', resource: 'scan', action: 'view' },
    { id: 'report_view', name: 'View Reports', description: 'View generated reports', resource: 'reports', action: 'view' },
    { id: 'dashboard_view', name: 'View Dashboard', description: 'Access main dashboard', resource: 'dashboard', action: 'view' },
  ],
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 100,
  INSPECTOR: 75,
  ANALYST: 50,
  VIEWER: 25,
}