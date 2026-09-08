export type UserRole = 'INSPECTOR' | 'DLMO' | 'SUPERIOR' | 'MANUFACTURER' | 'ADMIN'

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
  DLMO: [
    { id: 'dashboard_view', name: 'Dashboard View', description: 'Access dashboard overview', resource: 'dashboard', action: 'view' },
    { id: 'analytics_all', name: 'DLMO Analytics', description: 'Access district and national inspector and manufacturer analytics', resource: 'superior_analytics', action: 'view' },
    { id: 'challan_manage', name: 'Manage Challans', description: 'Issue and track statutory compounding notices', resource: 'challans', action: 'manage' },
    { id: 'scan_view', name: 'View All Scans', description: 'View all field inspection scan records', resource: 'scan', action: 'view' },
    { id: 'report_view', name: 'View All Reports', description: 'View statutory compliance reports', resource: 'reports', action: 'view' },
    { id: 'audit_view', name: 'View Audit Trail', description: 'Access legal audit trail logs', resource: 'audit', action: 'view' },
    { id: 'docs_view', name: 'View Legal Framework', description: 'Access Legal Metrology Act & Rules references', resource: 'docs', action: 'view' },
  ],
  SUPERIOR: [
    { id: 'dashboard_view', name: 'Dashboard View', description: 'Access dashboard overview', resource: 'dashboard', action: 'view' },
    { id: 'analytics_all', name: 'DLMO Analytics', description: 'Access district and national inspector and manufacturer analytics', resource: 'superior_analytics', action: 'view' },
    { id: 'challan_manage', name: 'Manage Challans', description: 'Issue and track statutory compounding notices', resource: 'challans', action: 'manage' },
    { id: 'scan_view', name: 'View All Scans', description: 'View all field inspection scan records', resource: 'scan', action: 'view' },
    { id: 'report_view', name: 'View All Reports', description: 'View statutory compliance reports', resource: 'reports', action: 'view' },
    { id: 'audit_view', name: 'View Audit Trail', description: 'Access legal audit trail logs', resource: 'audit', action: 'view' },
    { id: 'docs_view', name: 'View Legal Framework', description: 'Access Legal Metrology Act & Rules references', resource: 'docs', action: 'view' },
  ],
  INSPECTOR: [
    { id: 'dashboard_view', name: 'Inspector Dashboard', description: 'Access Inspector Overview Dashboard', resource: 'dashboard', action: 'view' },
    { id: 'scan_create', name: 'Create Scans', description: 'Initiate new package label compliance scans', resource: 'scan', action: 'create' },
    { id: 'scan_view', name: 'View Scans', description: 'View scan results and bounding box detections', resource: 'scan', action: 'view' },
    { id: 'report_view', name: 'View Reports', description: 'View statutory reports', resource: 'reports', action: 'view' },
    { id: 'report_generate', name: 'Generate Reports', description: 'Generate compliance reports', resource: 'reports', action: 'generate' },
    { id: 'report_download', name: 'Download Reports', description: 'Download PDF reports', resource: 'reports', action: 'download' },
    { id: 'audit_view', name: 'View Audit Logs', description: 'View statutory audit trail', resource: 'audit', action: 'view' },
    { id: 'docs_view', name: 'View Documentation', description: 'View legal metrology references', resource: 'docs', action: 'view' },
  ],
  MANUFACTURER: [
    { id: 'mfg_portal', name: 'Manufacturer Portal', description: 'Access brand legal notices and inspection audits', resource: 'manufacturer_portal', action: 'view' },
    { id: 'challan_view', name: 'View Received Challans', description: 'View statutory notices issued against brand', resource: 'challans', action: 'view' },
    { id: 'scan_self', name: 'Self Verification Scan', description: 'Pre-market label verification check', resource: 'scan', action: 'create' },
    { id: 'report_view', name: 'View Brand Reports', description: 'View market surveillance inspection reports', resource: 'reports', action: 'view' },
    { id: 'docs_view', name: 'View Packaging Standards', description: 'View LMPC Rule 6 compliance checklist', resource: 'docs', action: 'view' },
  ],
  ADMIN: [
    { id: 'admin_all', name: 'Full Access', description: 'Complete system access across all modules', resource: '*', action: '*' },
    { id: 'dashboard_view', name: 'Dashboard View', description: 'Access dashboard', resource: 'dashboard', action: 'view' },
    { id: 'user_manage', name: 'User Management', description: 'Create, edit, delete users', resource: 'users', action: 'manage' },
    { id: 'audit_view', name: 'View Audit Logs', description: 'Access system audit trails', resource: 'audit', action: 'view' },
    { id: 'superior_analytics', name: 'DLMO Analytics', description: 'Access superior analytics', resource: 'superior_analytics', action: 'view' },
    { id: 'mfg_portal', name: 'Manufacturer Portal', description: 'Access manufacturer portal', resource: 'manufacturer_portal', action: 'view' },
  ],
}

export const ROLE_HIERARCHY: Record<UserRole, number> = {
  ADMIN: 100,
  DLMO: 80,
  SUPERIOR: 80,
  INSPECTOR: 60,
  MANUFACTURER: 40,
}