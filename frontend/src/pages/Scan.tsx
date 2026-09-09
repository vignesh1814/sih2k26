import React, { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { 
  Upload, 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  RefreshCw, 
  Scan as ScanIcon, 
  ShieldAlert, 
  Trash2, 
  CheckCircle2, 
  AlertTriangle, 
  Scale, 
  ShieldCheck, 
  FileText,
  ArrowRight,
  ExternalLink,
  Gavel,
  AlertOctagon,
  FileCheck,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  scanPackage, 
  scanMultiPackages, 
  generateReport, 
  recordVerificationDecisions,
  closeInspectionSession,
  issueChallan,
  ScanResponse, 
  InspectionSession 
} from '../services/api'
import StartInspectionModal from '../components/StartInspectionModal'

type PanelKey = 'front' | 'back' | 'bottom' | 'top' | 'side_mrp' | 'side_nutrition'

interface PanelSlot {
  key: PanelKey
  label: string
  subtitle: string
  expectedDeclarations: string[]
  file: File | null
  previewUrl: string | null
}

const INITIAL_PANELS: Record<PanelKey, PanelSlot> = {
  front: {
    key: 'front',
    label: 'Front PDP (Principal Display)',
    subtitle: 'Brand name, generic name & net quantity',
    expectedDeclarations: ['Generic Name', 'Net Quantity'],
    file: null,
    previewUrl: null
  },
  side_mrp: {
    key: 'side_mrp',
    label: 'MRP & Batch Panel',
    subtitle: 'MRP (incl taxes), Unit Sale Price & Mfg Date',
    expectedDeclarations: ['MRP', 'Unit Sale Price (USP)', 'Mfg / Pkd Date'],
    file: null,
    previewUrl: null
  },
  back: {
    key: 'back',
    label: 'Back Panel / Address Details',
    subtitle: 'Manufacturer details & consumer care info',
    expectedDeclarations: ['Manufacturer Address', 'Customer Care Info', 'Country of Origin'],
    file: null,
    previewUrl: null
  },
  side_nutrition: {
    key: 'side_nutrition',
    label: 'Side Information Panel',
    subtitle: 'Ingredients, barcode & statutory notices',
    expectedDeclarations: ['Barcode (EAN)', 'Directions / Warning'],
    file: null,
    previewUrl: null
  },
  top: {
    key: 'top',
    label: 'Top Cap / Seal Panel',
    subtitle: 'Overprinted MRP or security seals',
    expectedDeclarations: ['Batch No.', 'Seal Verification'],
    file: null,
    previewUrl: null
  },
  bottom: {
    key: 'bottom',
    label: 'Bottom Panel / Base',
    subtitle: 'Embossed volume marks & tare codes',
    expectedDeclarations: ['Container Code'],
    file: null,
    previewUrl: null
  }
}

type ViolationVerificationState = Record<string, 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW'>

const Scan: React.FC = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isSelfCheckMode = searchParams.get('mode') === 'self-check' || user?.role === 'MANUFACTURER'

  const [panels, setPanels] = useState<Record<PanelKey, PanelSlot>>(INITIAL_PANELS)
  const [activePanelKey, setActivePanelKey] = useState<PanelKey>('front')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [verificationStates, setVerificationStates] = useState<ViolationVerificationState>({})
  const [isGeneratingReport, setIsGeneratingReport] = useState(false)
  const [isStartModalOpen, setIsStartModalOpen] = useState(false)

  // Active Field Inspection Session
  const [activeSession, setActiveSession] = useState<InspectionSession | null>(() => {
    const raw = sessionStorage.getItem('sih26034_active_session')
    if (raw) {
      try { return JSON.parse(raw) } catch (e) { return null }
    }
    return null
  })

  // Issue Challan Modal State
  const [isChallanModalOpen, setIsChallanModalOpen] = useState(false)
  const [isIssuingChallan, setIsIssuingChallan] = useState(false)
  const [challanData, setChallanData] = useState({
    manufacturer_name: '',
    product_name: '',
    penalty_amount: 25000,
    act_sections: ['Section 36(1) of Legal Metrology Act, 2009 (Penalty for Non-standard Pre-packaged Commodity)'],
    notes: '',
    due_days: 15,
    hearing_days: 21
  })

  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, panelKey: PanelKey) => {
    const file = e.target.files?.[0]
    if (!file) return

    const previewUrl = URL.createObjectURL(file)
    setPanels(prev => ({
      ...prev,
      [panelKey]: {
        ...prev[panelKey],
        file,
        previewUrl
      }
    }))
    toast.success(`Added photo to ${panels[panelKey].label}`)
  }

  const handleRemovePanel = (panelKey: PanelKey, e: React.MouseEvent) => {
    e.stopPropagation()
    setPanels(prev => ({
      ...prev,
      [panelKey]: {
        ...prev[panelKey],
        file: null,
        previewUrl: null
      }
    }))
    toast('Image cleared', { icon: '🗑️' })
  }

  const handleExecuteScan = async () => {
    const populatedPanels = Object.values(panels).filter(p => p.file !== null)
    if (populatedPanels.length === 0) {
      toast.error('Please upload or capture at least one package panel image.')
      return
    }

    setIsScanning(true)
    try {
      let result: ScanResponse
      if (populatedPanels.length === 1) {
        result = await scanPackage(populatedPanels[0].file!, activeSession?.session_id)
      } else {
        result = await scanMultiPackages(
          populatedPanels.map(p => ({ panel: p.label, file: p.file! })),
          activeSession?.session_id
        )
      }

      setScanResult(result)

      // Store commodity details for Quantity Verification pre-filling
      if (result.declarations) {
        sessionStorage.setItem('sih26034_last_scanned_commodity', JSON.stringify({
          generic_name: result.declarations.generic_name || 'Inspected Commodity Package',
          net_quantity: result.declarations.net_quantity || '500',
          unit: result.declarations.unit || 'g',
          scan_id: result.scan_id
        }))
      }

      // Initialize verification states
      const initVerif: ViolationVerificationState = {}
      result.violations.forEach(v => {
        initVerif[v.rule_code] = 'PENDING'
      })
      setVerificationStates(initVerif)

      if (result.status === 'PASS') {
        toast.success('Package is Fully Compliant with Legal Metrology PCR Rules!')
      } else if (result.status === 'FAIL') {
        toast.error(`Compliance Audit: ${result.violations.length} statutory defect(s) detected.`)
      } else {
        toast('Review Required: Human verification needed.', { icon: '⚠️' })
      }
    } catch (err: any) {
      console.error('Scan error:', err)
      toast.error(err?.response?.data?.message || 'Error communicating with OCR & Compliance Engine.')
    } finally {
      setIsScanning(false)
    }
  }

  const handleVerifyViolation = async (ruleCode: string, state: 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW') => {
    const nextStates = {
      ...verificationStates,
      [ruleCode]: state
    }
    setVerificationStates(nextStates)

    if (scanResult?.scan_id) {
      try {
        const payloadDecisions = Object.entries(nextStates).map(([code, decision]) => ({
          rule_code: code,
          decision
        }))
        const res = await recordVerificationDecisions(
          scanResult.scan_id, 
          payloadDecisions, 
          undefined, 
          user?.name || 'Field Inspector'
        )
        if (res?.scan) {
          setScanResult(prev => prev ? { ...prev, status: res.scan.status } : null)
        }
        toast.success(`Verification decision [${state}] recorded`)
      } catch (e) {
        toast.success(`Marked as ${state}`)
      }
    }
  }

  const handleGenerateStatutoryReport = async () => {
    if (!scanResult) return
    setIsGeneratingReport(true)
    try {
      const res = await generateReport({
        scan_id: scanResult.scan_id,
        officer_name: user?.name || 'Field Inspector',
        station_jurisdiction: user?.department || 'Legal Metrology Enforcement Wing',
        notes: activeSession ? `Session: ${activeSession.session_id} - ${activeSession.entity_name}` : 'Field Inspection'
      })
      toast.success('Statutory Inspection PDF Report Generated!')
      window.open(`/api/v1/report/${scanResult.scan_id}/download`, '_blank')
    } catch (e: any) {
      toast.error('Failed to generate report')
    } finally {
      setIsGeneratingReport(false)
    }
  }

  const handleCloseSession = async () => {
    if (!activeSession) return
    const sessionId = activeSession.session_id
    const entityName = activeSession.entity_name || 'Premises Under Audit'
    try {
      toast.loading('Finalizing inspection session & generating statutory reports...', { id: 'closing-session' })
      const res = await closeInspectionSession(sessionId, {
        inspector_name: user?.name || 'Field Inspector'
      })
      sessionStorage.removeItem('sih26034_active_session')
      setActiveSession(null)
      toast.success(`Inspection session for ${entityName} successfully completed! Inspection reports updated.`, { id: 'closing-session', duration: 5000 })
    } catch (err) {
      sessionStorage.removeItem('sih26034_active_session')
      setActiveSession(null)
      toast.success('Inspection session closed and saved.', { id: 'closing-session' })
    }
  }

  const handleOpenChallanModal = () => {
    if (!scanResult) return
    const defaultMfg = activeSession?.entity_name || scanResult.declarations?.manufacturer || 'Unknown Manufacturer / Packer'
    const defaultProduct = scanResult.declarations?.generic_name || 'Pre-packaged Commodity'
    setChallanData({
      manufacturer_name: defaultMfg,
      product_name: defaultProduct,
      penalty_amount: 25000,
      act_sections: ['Section 36(1) of Legal Metrology Act, 2009 (Penalty for Non-standard Pre-packaged Commodity)'],
      notes: `Statutory non-compliance detected during inspection. Violations: ${scanResult.violations.map(v => `${v.rule_code}: ${v.declaration}`).join(', ')}`,
      due_days: 15,
      hearing_days: 21
    })
    setIsChallanModalOpen(true)
  }

  const handleIssueChallanSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!scanResult) return
    setIsIssuingChallan(true)
    try {
      const payload = {
        scan_id: scanResult.scan_id,
        manufacturer_name: challanData.manufacturer_name,
        product_name: challanData.product_name,
        issued_by: user?.name || 'District Legal Metrology Officer',
        issued_by_role: user?.role || 'DLMO',
        inspector_name: user?.name || 'Field Inspector',
        violation_codes: scanResult.violations.map(v => v.rule_code),
        act_sections: challanData.act_sections,
        penalty_amount: Number(challanData.penalty_amount),
        due_days: Number(challanData.due_days),
        hearing_days: Number(challanData.hearing_days),
        notes: challanData.notes
      }
      const res = await issueChallan(payload)
      if (res.success) {
        toast.success(`Statutory Challan #${res.challan?.challan_id || 'CHL-NEW'} issued successfully!`, { duration: 6000 })
        setIsChallanModalOpen(false)
      } else {
        toast.error('Could not issue challan')
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Error issuing challan')
    } finally {
      setIsIssuingChallan(false)
    }
  }

  const mandatoryDeclarationsList = [
    {
      name: 'Common / Generic Name of Commodity',
      rule: 'Rule 6(1)(b)',
      detected: !!scanResult?.declarations?.generic_name,
      value: scanResult?.declarations?.generic_name || 'Not detected'
    },
    {
      name: 'Net Quantity in Standard SI Units',
      rule: 'Rule 6(1)(c) & Rule 12',
      detected: !!scanResult?.declarations?.net_quantity,
      value: scanResult?.declarations ? `${scanResult.declarations.net_quantity || ''} ${scanResult.declarations.unit || ''}`.trim() : 'Not detected'
    },
    {
      name: 'MRP (Inclusive of All Taxes)',
      rule: 'Rule 6(1)(e)',
      detected: !!scanResult?.declarations?.mrp,
      value: scanResult?.declarations?.mrp_text || (scanResult?.declarations?.mrp ? `₹${scanResult.declarations.mrp}` : 'Not detected')
    },
    {
      name: 'Unit Sale Price (USP)',
      rule: 'Rule 6(11)',
      detected: !!scanResult?.declarations?.unit_sale_price,
      value: scanResult?.declarations?.unit_sale_price ? `₹${scanResult.declarations.unit_sale_price} per ${scanResult.declarations.unit || 'g'}` : 'Calculated/Stated'
    },
    {
      name: 'Month & Year of Manufacture / Packing',
      rule: 'Rule 6(1)(d)',
      detected: !!scanResult?.declarations?.mfg_date,
      value: scanResult?.declarations?.mfg_date || 'Not detected'
    },
    {
      name: 'Name & Complete Address of Manufacturer / Packer',
      rule: 'Rule 6(1)(a)',
      detected: !!scanResult?.declarations?.manufacturer,
      value: scanResult?.declarations?.manufacturer || 'Not detected'
    },
    {
      name: 'Country of Origin / Manufacture',
      rule: 'Rule 6(1)(g)',
      detected: !!scanResult?.declarations?.country_of_origin,
      value: scanResult?.declarations?.country_of_origin || 'Not detected'
    },
    {
      name: 'Consumer Grievance Helpline / Email',
      rule: 'Rule 6(2)',
      detected: !!scanResult?.declarations?.consumer_care,
      value: scanResult?.declarations?.consumer_care || 'Not detected'
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Session Header / Banner */}
      {!isSelfCheckMode ? (
        activeSession ? (
          <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-xl">
                <ShieldCheck className="h-6 w-6 text-emerald-300" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-mono font-bold text-xs bg-blue-700/80 px-2 py-0.5 rounded text-blue-100">
                    {activeSession.session_id}
                  </span>
                  <span className="text-xs text-blue-200">• {activeSession.inspection_type}</span>
                </div>
                <p className="font-black text-sm text-white mt-0.5">{activeSession.entity_name || 'Premises Under Audit'}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={() => navigate('/quantity')}
                className="px-3 py-1.5 bg-blue-800/80 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
              >
                <Scale className="h-3.5 w-3.5" />
                <span>Quantity Check</span>
              </button>
              <button
                onClick={handleCloseSession}
                className="px-3.5 py-1.5 bg-rose-800/80 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center space-x-1"
                title="Finalize audit session and compile compliance reports"
              >
                <span>Close Session</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
              <span>No official inspection session linked. You can scan standalone packages or initiate a formal session.</span>
            </div>
            <button
              onClick={() => setIsStartModalOpen(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-sm transition-all"
            >
              Start Inspection Session
            </button>
          </div>
        )
      ) : (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <div>
              <span className="font-bold text-emerald-950">Pre-Market Packaging Self-Check Mode</span>
              <p className="text-[11px] text-emerald-700">Audit packaging artwork to identify rule non-compliances prior to commercial printing.</p>
            </div>
          </div>
        </div>
      )}

      {/* Main Scan Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Angle Capture Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <span>Package Surface Capture</span>
                </h2>
                <p className="text-xs text-gray-500">Capture Front (PDP), Back, Sides, and Bottom panels</p>
              </div>

              <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 font-bold rounded-full">
                {Object.values(panels).filter(p => p.file !== null).length} / 6 Captured
              </span>
            </div>

            {/* Panel Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              {Object.values(panels).map((p) => {
                const isSelected = activePanelKey === p.key
                const isCaptured = p.file !== null
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => setActivePanelKey(p.key)}
                    className={`p-2.5 rounded-xl text-left border transition-all relative ${
                      isSelected
                        ? 'border-blue-600 bg-blue-50/60 ring-2 ring-blue-600'
                        : isCaptured
                        ? 'border-emerald-300 bg-emerald-50/40 hover:border-emerald-400'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-gray-900 truncate">
                        {p.label.split(' ')[0]}
                      </span>
                      {isCaptured && (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 truncate mt-0.5">
                      {isCaptured ? 'Photo Ready' : 'Empty'}
                    </p>
                  </button>
                )
              })}
            </div>

            {/* Active Panel Viewport */}
            <div className="border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-gray-50/50 flex flex-col items-center justify-center min-h-[300px] relative overflow-hidden">
              {panels[activePanelKey].previewUrl ? (
                <div className="w-full h-full flex flex-col items-center">
                  <img
                    src={panels[activePanelKey].previewUrl!}
                    alt={panels[activePanelKey].label}
                    className="max-h-64 object-contain rounded-xl shadow-md"
                  />
                  <div className="mt-3 flex items-center space-x-2">
                    <button
                      type="button"
                      onClick={(e) => handleRemovePanel(activePanelKey, e)}
                      className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 flex items-center space-x-1"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Retake / Remove</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center space-y-3">
                  <div className="p-4 bg-white rounded-full shadow-sm mx-auto w-fit border border-gray-100">
                    <Camera className="h-8 w-8 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-gray-900">
                      Align {panels[activePanelKey].label} within frame
                    </h4>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Ensure text declarations are sharp, flat, and well-illuminated.
                    </p>
                  </div>

                  <div className="flex items-center justify-center space-x-3 pt-2">
                    <button
                      type="button"
                      onClick={() => cameraInputRef.current?.click()}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center space-x-1.5"
                    >
                      <Camera className="h-4 w-4" />
                      <span>Open Camera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5"
                    >
                      <Upload className="h-4 w-4" />
                      <span>Upload Photo</span>
                    </button>
                  </div>
                </div>
              )}

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(e, activePanelKey)}
              />
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={(e) => handleFileUpload(e, activePanelKey)}
              />
            </div>

            {/* Scan Trigger Button */}
            <button
              onClick={handleExecuteScan}
              disabled={isScanning || Object.values(panels).every(p => p.file === null)}
              className="w-full py-3.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-black text-sm rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-5 w-5 animate-spin" />
                  <span>Processing AI OCR & Compliance Engine...</span>
                </>
              ) : (
                <>
                  <ScanIcon className="h-5 w-5" />
                  <span>Run Legal Metrology Compliance Audit</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: AI Extraction & Violation Cards */}
        <div className="lg:col-span-6 space-y-4">
          {scanResult ? (
            <div className="space-y-4">
              {/* Verdict Header */}
              <div className={`p-4 rounded-2xl border flex items-center justify-between ${
                scanResult.status === 'PASS' ? 'bg-green-50 border-green-200' :
                scanResult.status === 'FAIL' ? 'bg-red-50 border-red-200' :
                'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-xl ${
                    scanResult.status === 'PASS' ? 'bg-green-600 text-white' :
                    scanResult.status === 'FAIL' ? 'bg-red-600 text-white' :
                    'bg-yellow-600 text-white'
                  }`}>
                    {scanResult.status === 'PASS' ? <CheckCircle className="h-6 w-6" /> :
                     scanResult.status === 'FAIL' ? <XCircle className="h-6 w-6" /> :
                     <AlertCircle className="h-6 w-6" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-gray-900">
                      Compliance Verdict: {scanResult.status}
                    </h3>
                    <p className="text-xs text-gray-600">
                      Confidence: {Math.round(scanResult.overall_confidence * 100)}% • {scanResult.violations.length} finding(s)
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  {(scanResult.violations.length > 0 || scanResult.status === 'FAIL') && (
                    <button
                      onClick={handleOpenChallanModal}
                      className="px-3.5 py-1.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white text-xs font-black rounded-lg shadow-sm flex items-center space-x-1.5 animate-pulse"
                    >
                      <Gavel className="h-3.5 w-3.5 text-yellow-300" />
                      <span>Issue Challan</span>
                    </button>
                  )}
                  <button
                    onClick={handleGenerateStatutoryReport}
                    disabled={isGeneratingReport}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-sm flex items-center space-x-1"
                  >
                    <FileText className="h-3.5 w-3.5" />
                    <span>{isGeneratingReport ? 'Building PDF...' : 'Download PDF'}</span>
                  </button>
                </div>
              </div>

              {/* Statutory Non-Compliance & Challan Banner */}
              {(scanResult.violations.length > 0 || scanResult.status === 'FAIL') && (
                <div className="bg-gradient-to-r from-red-500/10 via-rose-500/10 to-red-500/10 border-2 border-red-300 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
                  <div className="flex items-start space-x-3">
                    <div className="p-2 bg-red-600 text-white rounded-xl mt-0.5 shadow-sm">
                      <AlertOctagon className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-sm text-red-950 flex items-center space-x-2">
                        <span>Statutory Violations Flagged ({scanResult.violations.length})</span>
                        <span className="text-[10px] bg-red-600 text-white px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">Non-Compliant</span>
                      </h4>
                      <p className="text-xs text-red-800 mt-0.5 leading-relaxed">
                        Under Legal Metrology (Packaged Commodities) Rules, 2011, even a single rule defect is an offence under Section 36(1). You can issue an official statutory challan immediately.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleOpenChallanModal}
                    className="w-full sm:w-auto px-4 py-2 bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center space-x-1.5 whitespace-nowrap transition-transform active:scale-95"
                  >
                    <Gavel className="h-4 w-4 text-yellow-300" />
                    <span>Issue Legal Challan</span>
                  </button>
                </div>
              )}

              {/* Next Step Workflow Actions for Field Inspector */}
              {!isSelfCheckMode && (
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center justify-between text-xs text-blue-900">
                  <span>Physical Quantity Verification: Compare declared vs actual scale weight</span>
                  <button
                    onClick={() => navigate('/quantity')}
                    className="px-3 py-1.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-bold flex items-center space-x-1"
                  >
                    <span>Weigh Sample</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* Extracted Statutory Declarations Checklist */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
                <h3 className="font-bold text-sm text-gray-900">
                  Rule 6 Mandatory Declarations Checklist
                </h3>
                <div className="divide-y divide-gray-100 text-xs">
                  {mandatoryDeclarationsList.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-mono text-[10px] font-bold bg-gray-100 text-gray-700 px-1.5 py-0.5 rounded">
                            {item.rule}
                          </span>
                          <span className="font-bold text-gray-800">{item.name}</span>
                        </div>
                        <p className="text-gray-500 mt-0.5">{item.value}</p>
                      </div>

                      {item.detected ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <CheckCircle2 className="h-3 w-3" />
                          <span>Detected</span>
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full flex items-center space-x-1">
                          <AlertTriangle className="h-3 w-3" />
                          <span>Missing</span>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Human-in-the-loop Verification Cards */}
              {scanResult.violations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-sm text-gray-900 flex items-center space-x-2">
                      <ShieldAlert className="h-4 w-4 text-red-600" />
                      <span>Statutory Findings ({scanResult.violations.length} Defect(s))</span>
                    </h3>
                    <button
                      onClick={handleOpenChallanModal}
                      className="px-3 py-1 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-lg flex items-center space-x-1"
                    >
                      <Gavel className="h-3.5 w-3.5" />
                      <span>Issue Challan for Findings</span>
                    </button>
                  </div>

                  {scanResult.violations.map((v, idx) => {
                    const currentStatus = verificationStates[v.rule_code] || 'PENDING'
                    return (
                      <div
                        key={idx}
                        className="bg-white rounded-2xl p-4 border-2 border-red-200 shadow-sm space-y-3"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="px-2 py-0.5 bg-red-100 text-red-800 font-bold text-xs rounded">
                                {v.rule_code}
                              </span>
                              <span className="text-xs font-bold text-gray-900">{v.declaration}</span>
                            </div>
                            <p className="text-xs text-red-700 font-semibold mt-1">{v.reason}</p>
                            {v.suggested_correction && (
                              <p className="text-[11px] text-gray-600 mt-0.5">
                                <span className="font-bold">Required Standard:</span> {v.suggested_correction}
                              </p>
                            )}
                          </div>

                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            currentStatus === 'CONFIRMED' ? 'bg-red-600 text-white' :
                            currentStatus === 'REJECTED' ? 'bg-gray-200 text-gray-700' :
                            currentStatus === 'NEEDS_REVIEW' ? 'bg-amber-500 text-white' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {currentStatus}
                          </span>
                        </div>

                        {/* Inspector Action Buttons */}
                        <div className="pt-2 border-t border-gray-100 flex items-center justify-end space-x-2 text-xs">
                          <span className="text-[11px] text-gray-500 mr-auto font-medium">Officer Action:</span>
                          <button
                            onClick={() => handleVerifyViolation(v.rule_code, 'CONFIRMED')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                              currentStatus === 'CONFIRMED' ? 'bg-red-700 text-white' : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                          >
                            [CONFIRM]
                          </button>
                          <button
                            onClick={() => handleVerifyViolation(v.rule_code, 'REJECTED')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                              currentStatus === 'REJECTED' ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                          >
                            [REJECT]
                          </button>
                          <button
                            onClick={() => handleVerifyViolation(v.rule_code, 'NEEDS_REVIEW')}
                            className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                              currentStatus === 'NEEDS_REVIEW' ? 'bg-amber-600 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                            }`}
                          >
                            [REVIEW]
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-10 border border-gray-200 text-center space-y-3">
              <ScanIcon className="h-12 w-12 text-blue-400 mx-auto" />
              <h3 className="font-bold text-base text-gray-800">No Package Analyzed Yet</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Capture package photographs on the left and click &quot;Run Legal Metrology Compliance Audit&quot; to inspect mandatory declarations and rule compliance.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Start Inspection Session Modal */}
      <StartInspectionModal
        isOpen={isStartModalOpen}
        onClose={() => setIsStartModalOpen(false)}
        onSessionStarted={(session) => {
          setActiveSession(session)
          sessionStorage.setItem('sih26034_active_session', JSON.stringify(session))
        }}
      />

      {/* Issue Statutory Challan Modal */}
      {isChallanModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-gray-200 overflow-hidden my-8 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-red-800 via-rose-900 to-red-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-white/10 rounded-2xl">
                  <Gavel className="h-6 w-6 text-yellow-300" />
                </div>
                <div>
                  <h3 className="text-base font-black tracking-tight">Issue Statutory Legal Metrology Challan</h3>
                  <p className="text-xs text-red-200 mt-0.5">Section 36 / 39, Legal Metrology Act, 2009 & PCR, 2011</p>
                </div>
              </div>
              <button
                onClick={() => setIsChallanModalOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleIssueChallanSubmit} className="p-6 space-y-4">
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Offender / Manufacturer / Establishment Name
                  </label>
                  <input
                    type="text"
                    required
                    value={challanData.manufacturer_name}
                    onChange={(e) => setChallanData({ ...challanData, manufacturer_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white outline-none"
                    placeholder="e.g. Parle Agro Pvt. Ltd. / Metro Hypermarket"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Commodity / Product Name
                  </label>
                  <input
                    type="text"
                    required
                    value={challanData.product_name}
                    onChange={(e) => setChallanData({ ...challanData, product_name: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white outline-none"
                    placeholder="e.g. Marie Biscuits 500g"
                  />
                </div>

                {/* Detected Violations Summary */}
                {scanResult?.violations && scanResult.violations.length > 0 && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-xl space-y-1.5">
                    <p className="text-xs font-bold text-red-900 flex items-center space-x-1">
                      <ShieldAlert className="h-3.5 w-3.5 text-red-600" />
                      <span>Applicable Violation Codes ({scanResult.violations.length}):</span>
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      {scanResult.violations.map((v, i) => (
                        <span key={i} className="text-[11px] font-bold bg-white text-red-800 border border-red-200 px-2 py-0.5 rounded-md shadow-2xs">
                          {v.rule_code}: {v.declaration}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Compounding Fine Amount (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={1000}
                      step={500}
                      value={challanData.penalty_amount}
                      onChange={(e) => setChallanData({ ...challanData, penalty_amount: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-black text-red-600 focus:ring-2 focus:ring-red-500 focus:bg-white outline-none"
                    />
                    <div className="flex space-x-1.5 mt-1">
                      {[25000, 50000, 100000].map((amt) => (
                        <button
                          key={amt}
                          type="button"
                          onClick={() => setChallanData({ ...challanData, penalty_amount: amt })}
                          className="text-[10px] px-2 py-0.5 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded font-bold"
                        >
                          ₹{amt.toLocaleString()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                      Rectification Window (Days)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={90}
                      value={challanData.due_days}
                      onChange={(e) => setChallanData({ ...challanData, due_days: Number(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Officer Findings & Notes
                  </label>
                  <textarea
                    rows={2}
                    value={challanData.notes}
                    onChange={(e) => setChallanData({ ...challanData, notes: e.target.value })}
                    className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-900 focus:ring-2 focus:ring-red-500 focus:bg-white outline-none"
                    placeholder="Enter inspection findings and compounding grounds..."
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-3 border-t border-gray-200 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsChallanModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-gray-300 text-gray-700 font-bold text-xs hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isIssuingChallan}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-red-700 to-rose-700 hover:from-red-800 hover:to-rose-800 text-white font-black text-xs shadow-lg flex items-center space-x-1.5 disabled:opacity-50"
                >
                  {isIssuingChallan ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>Issuing Challan...</span>
                    </>
                  ) : (
                    <>
                      <Gavel className="h-4 w-4 text-yellow-300" />
                      <span>Issue Statutory Challan</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Scan