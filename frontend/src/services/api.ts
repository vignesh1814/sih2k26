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

export const fetchScans = async (limit: number = 50): Promise<{ scans: any[]; count: number }> => {
  try {
    const response = await api.get('/scans', { params: { limit } })
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

export const checkHealth = async (): Promise<{ status: string; gemini_active?: boolean }> => {
  try {
    const response = await api.get('/health')
    return response.data
  } catch (error) {
    return { status: 'OFFLINE' }
  }
}

