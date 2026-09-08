import axios from 'axios'

export interface BoundingBox {
  x_min: number
  y_min: number
  x_max: number
  y_max: number
  confidence: number
  text: string
}

export interface RuleViolation {
  rule_code: string
  declaration: string
  reason: string
  severity: 'CRITICAL' | 'WARNING'
  suggested_correction?: string
  bbox?: number[]
}

export interface ExtractedDeclarations {
  generic_name?: string
  net_quantity?: string
  unit?: string
  mrp?: number
  mrp_text?: string
  has_inclusive_phrase?: boolean
  unit_sale_price?: number
  mfg_date?: string
  expiry_date?: string
  manufacturer?: string
  country_of_origin?: string
  consumer_care?: string
  barcode?: string
}

export interface ImageQualityAssessment {
  is_acceptable: boolean
  blur_score: number
  glare_percentage: number
  exposure_status: 'UNDEREXPOSED' | 'NORMAL' | 'OVEREXPOSED'
  recommended_action: string
}

export interface ScanResponse {
  scan_id: string
  status: 'PASS' | 'FAIL' | 'NEEDS_REVIEW' | 'INSUFFICIENT_EVIDENCE'
  overall_confidence: number
  image_quality: ImageQualityAssessment
  declarations: ExtractedDeclarations
  violations: RuleViolation[]
  detections: BoundingBox[]
  evidence_hash: string
  report_download_url?: string
  message?: string
}

export interface ReportRequest {
  scan_id: string
  officer_name?: string
  station_jurisdiction?: string
  notes?: string
}

export interface ReportResponse {
  report_id: string
  pdf_url: string
  evidence_hash: string
  generated_at: string
  status: string
}

export interface Challan {
  challan_id: string
  scan_id?: string
  manufacturer_name: string
  product_name: string
  issued_by: string
  issued_by_role: string
  inspector_name: string
  violation_codes: string[]
  act_sections: string[]
  penalty_amount: number
  status: 'ISSUED' | 'ACKNOWLEDGED' | 'RECTIFIED' | 'PAID' | 'HEARING_SCHEDULED' | 'DISMISSED'
  due_date: string
  hearing_date?: string
  issued_at: string
  manufacturer_response?: string | null
  rectification_proof_url?: string | null
  payment_mode?: string
  transaction_id?: string
  paid_at?: string
  notes?: string
}

export interface SuperiorAnalyticsData {
  summary: {
    total_field_inspectors: number
    active_inspectors_today: number
    total_inspections: number
    national_compliance_rate: string
    total_challans_issued: number
    pending_challans_count: number
    total_penalties_issued: number
    hearings_scheduled: number
  }
  inspectors: Array<{
    id: string
    name: string
    jurisdiction: string
    scans_conducted: number
    violations_flagged: number
    compliance_rate: string
    challans_initiated: number
    status: string
  }>
  manufacturers: Array<{
    name: string
    total_scans: number
    passed_scans: number
    failed_scans: number
    compliance_rate: string
    risk_tier: string
    frequent_violations: string[]
    active_challans: number
    total_penalty_assessed: number
  }>
  recent_challans: Challan[]
  recent_audit_stream: any[]
}

export interface ManufacturerDashboardData {
  brand_name: string
  compliance_grade: string
  total_inspections_conducted: number
  compliance_rate: string
  active_challans_count: number
  total_penalties_assessed: number
  challans: Challan[]
  inspections: any[]
}

const api = axios.create({
  baseURL: '/api/v1',
  timeout: 120000,
})

export const scanPackage = async (file: File): Promise<ScanResponse> => {
  const formData = new FormData()
  formData.append('file', file)

  try {
    const response = await api.post<ScanResponse>('/scan', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('[API] Backend /api/v1/scan error:', error)
    throw error
  }
}

export const scanMultiPackages = async (panels: Array<{ panel: string; file: File }>): Promise<ScanResponse> => {
  const formData = new FormData()
  panels.forEach(p => {
    formData.append('files', p.file)
    formData.append('panel_names', p.panel)
  })

  try {
    const response = await api.post<ScanResponse>('/scan-multi', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  } catch (error) {
    console.error('[API] Backend /api/v1/scan-multi error:', error)
    throw error
  }
}

export const generateReport = async (request: ReportRequest): Promise<ReportResponse> => {
  try {
    const response = await api.post<ReportResponse>('/report/generate', request)
    return response.data
  } catch (error) {
    console.error('[API] Report generation error:', error)
    throw error
  }
}

export const fetchScans = async (limit: number = 50, exclude_settled: boolean = true): Promise<{ scans: any[]; count: number }> => {
  try {
    const response = await api.get('/scans', { params: { limit, exclude_settled } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching persistent scans:', error)
    return { scans: [], count: 0 }
  }
}

export const fetchAuditLogs = async (limit: number = 100): Promise<{ logs: any[]; count: number }> => {
  try {
    const response = await api.get('/audit-trail', { params: { limit } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching persistent audit logs:', error)
    return { logs: [], count: 0 }
  }
}

export const fetchChallans = async (manufacturer?: string, status?: string, exclude_settled: boolean = false): Promise<{ challans: Challan[]; count: number }> => {
  try {
    const response = await api.get('/challans', { params: { manufacturer, status, exclude_settled } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching challans:', error)
    return { challans: [], count: 0 }
  }
}

export const issueChallan = async (challanData: Partial<Challan>): Promise<{ success: boolean; challan: Challan; message: string }> => {
  const response = await api.post('/challans/issue', challanData)
  return response.data
}

export const updateChallanStatus = async (
  challanId: string, 
  status: string, 
  responseText?: string, 
  proofUrl?: string, 
  paymentMode?: string,
  userName?: string
): Promise<{ success: boolean; challan: Challan; transaction_id?: string; message?: string }> => {
  const response = await api.put(`/challans/${challanId}/status`, {
    status,
    response_text: responseText,
    proof_url: proofUrl,
    payment_mode: paymentMode,
    user_name: userName
  })
  return response.data
}

export const fetchSuperiorAnalytics = async (): Promise<SuperiorAnalyticsData> => {
  const response = await api.get<SuperiorAnalyticsData>('/analytics/superior')
  return response.data
}

export const fetchManufacturerDashboard = async (brand?: string): Promise<ManufacturerDashboardData> => {
  const response = await api.get<ManufacturerDashboardData>('/manufacturer/dashboard', { params: { brand } })
  return response.data
}

export const checkHealth = async (): Promise<{ status: string; gemini_active?: boolean }> => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    return { status: 'OFFLINE' }
  }
}

export const loginUser = async (email: string, password: string): Promise<{ success: boolean; user: any; token: string }> => {
  const response = await api.post('/auth/login', { email, password })
  return response.data
}

export const logoutUser = async (user?: any): Promise<{ success: boolean; message: string }> => {
  const response = await api.post('/auth/logout', { user })
  return response.data
}
