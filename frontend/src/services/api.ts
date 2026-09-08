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

export interface Entity {
  entity_id: string
  registration_no: string
  firm_name: string
  entity_type: 'Manufacturer' | 'Packer' | 'Importer' | 'Manufacturer & Packer' | 'Wholesaler / Distributor'
  establishment_address: string
  district: string
  state: string
  pincode: string
  registered_commodities: string[]
  license_status: 'ACTIVE' | 'EXPIRED' | 'SUSPENDED' | 'UNDER_REVIEW'
  registration_date: string
  valid_upto: string
  contact_email?: string
  contact_phone?: string
  compliance_rating: number
  total_inspections: number
  violations_count: number
  repeat_offender: boolean
}

export interface RuleVersion {
  rule_id: string
  rule_code: string
  rule_name: string
  act_reference: string
  section_or_rule: string
  amendment_version: string
  effective_date: string
  commodity_category: string
  requirement_description: string
  mandatory: boolean
  applicable_conditions?: string[]
  penalty_clause: string
  status: 'ACTIVE' | 'SUPERSEDED' | 'DRAFT'
}

export interface InspectionSession {
  session_id: string
  inspector_id: string
  inspector_name: string
  jurisdiction_district: string
  jurisdiction_state: string
  inspection_type: 'Routine inspection' | 'Surprise inspection' | 'Complaint-based inspection' | 'Follow-up inspection' | 'Registration-related inspection'
  gps_location: {
    latitude: number
    longitude: number
    accuracy_meters?: number
    address_resolved?: string
  }
  entity_id?: string
  entity_name?: string
  entity_reg_no?: string
  entity_type?: string
  premises_address?: string
  packages_inspected: number
  compliant_count: number
  review_required_count: number
  non_compliant_count: number
  violations_detected: number
  physical_measurements_recorded: number
  seizures_count: number
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUBMITTED_TO_SUPERVISOR' | 'APPROVED' | 'RETURNED'
  officer_observations?: string
  action_recommended: 'NONE' | 'WARNING_NOTICE' | 'STATUTORY_CHALLAN' | 'SEIZURE_OF_GOODS' | 'PROSECUTION'
  started_at: string
  completed_at?: string
  measurements?: QuantityMeasurement[]
  seizures?: SeizureRecord[]
}

export interface QuantityMeasurement {
  measurement_id: string
  session_id: string
  sample_no: string
  product_name: string
  declared_quantity: number
  declared_unit: string
  actual_quantity: number
  difference: number
  permissible_error_limit: number
  instrument_type: string
  instrument_certificate_no: string
  result: 'PASS' | 'FAIL'
  reason: string
  created_at: string
}

export interface SeizureRecord {
  seizure_id: string
  session_id: string
  scan_id?: string
  entity_name: string
  entity_reg_no?: string
  product_name: string
  quantity_seized_units: number
  unit_of_measure: string
  estimated_stock_value: number
  reason_for_seizure: string
  statutory_act_section: string
  evidence_photos: string[]
  custody_location: string
  custodian_officer: string
  witness_details?: string
  status: 'SEIZED_IN_CUSTODY' | 'RELEASED_ON_BOND' | 'COMPOUNDED_DISPOSED' | 'CONFISCATED_COURT'
  created_at: string
  notes?: string
}

export interface DeclarationCheckItem {
  id: string
  declaration_name: string
  rule_citation: string
  is_detected: boolean
  detected_value?: string
  expected_format: string
  status: 'DETECTED' | 'MISSING' | 'NON_STANDARD' | 'NOT_APPLICABLE'
  confidence: number
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

// Registered Entities API
export const fetchEntities = async (query?: string, district?: string, entityType?: string): Promise<{ success: boolean; count: number; data: Entity[] }> => {
  try {
    const response = await api.get('/entities', { params: { query, district, entity_type: entityType } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching entities:', error)
    return { success: false, count: 0, data: [] }
  }
}

export const fetchEntityByIdentifier = async (identifier: string): Promise<{ success: boolean; data?: Entity; message?: string }> => {
  try {
    const response = await api.get(`/entities/${encodeURIComponent(identifier)}`)
    return response.data
  } catch (error) {
    console.error('[API] Error fetching entity by ID/RegNo:', error)
    return { success: false, message: 'Entity not found' }
  }
}

export const createEntity = async (entityData: Partial<Entity>): Promise<{ success: boolean; data: Entity }> => {
  const response = await api.post('/entities', entityData)
  return response.data
}

// Rules & Versions API
export const fetchRules = async (status?: string, category?: string): Promise<{ success: boolean; count: number; data: RuleVersion[] }> => {
  try {
    const response = await api.get('/rules', { params: { status, category } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching rule versions:', error)
    return { success: false, count: 0, data: [] }
  }
}

export const createRule = async (ruleData: Partial<RuleVersion>): Promise<{ success: boolean; data: RuleVersion }> => {
  const response = await api.post('/rules', ruleData)
  return response.data
}

// Inspection Sessions API
export const startInspectionSession = async (sessionData: Partial<InspectionSession>): Promise<{ success: boolean; data: InspectionSession }> => {
  const response = await api.post('/inspections/start', sessionData)
  return response.data
}

export const fetchInspectionSessions = async (status?: string, inspectorId?: string, entityName?: string): Promise<{ success: boolean; count: number; data: InspectionSession[] }> => {
  try {
    const response = await api.get('/inspections', { params: { status, inspector_id: inspectorId, entity_name: entityName } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching inspection sessions:', error)
    return { success: false, count: 0, data: [] }
  }
}

export const fetchInspectionSessionDetails = async (sessionId: string): Promise<{ success: boolean; data: InspectionSession }> => {
  const response = await api.get(`/inspections/${sessionId}`)
  return response.data
}

// Physical Quantity Verification API
export const recordQuantityMeasurement = async (measurementData: {
  session_id?: string
  sample_no?: string
  product_name: string
  declared_quantity: number
  declared_unit: string
  actual_quantity: number
  instrument_type?: string
  instrument_certificate_no?: string
}): Promise<{ success: boolean; data: QuantityMeasurement }> => {
  const response = await api.post('/inspections/measurement', measurementData)
  return response.data
}

export const fetchMeasurements = async (sessionId?: string): Promise<{ success: boolean; count: number; data: QuantityMeasurement[] }> => {
  try {
    const response = await api.get('/inspections/measurements/list', { params: { session_id: sessionId } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching measurements:', error)
    return { success: false, count: 0, data: [] }
  }
}

// Enforcement & Seizures API
export const createSeizureMemo = async (seizureData: Partial<SeizureRecord>): Promise<{ success: boolean; data: SeizureRecord }> => {
  const response = await api.post('/enforcement/seizure', seizureData)
  return response.data
}

export const fetchSeizures = async (sessionId?: string, status?: string): Promise<{ success: boolean; count: number; data: SeizureRecord[] }> => {
  try {
    const response = await api.get('/enforcement/seizures', { params: { session_id: sessionId, status } })
    return response.data
  } catch (error) {
    console.error('[API] Error fetching seizures:', error)
    return { success: false, count: 0, data: [] }
  }
}

export const updateSeizureStatus = async (seizureId: string, status: string, notes?: string): Promise<{ success: boolean; data: SeizureRecord }> => {
  const response = await api.put(`/enforcement/seizures/${seizureId}/status`, { status, notes })
  return response.data
}
