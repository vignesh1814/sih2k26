import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useRBAC } from '../contexts/RBACContext'
import { 
  Upload, 
  Camera, 
  AlertCircle, 
  CheckCircle, 
  XCircle, 
  RefreshCw,
  Scan as ScanIcon,
  Eye,
  EyeOff,
  Download,
  Ruler,
  Layers,
  Sparkles,
  ShieldAlert,
  Plus,
  Trash2,
  HelpCircle,
  Database,
  Tag,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Building2,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  scanPackage, 
  scanMultiPackages,
  generateReport, 
  ScanResponse,
  RuleViolation,
  InspectionSession
} from '../services/api'

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
    label: 'Front (PDP)',
    subtitle: 'Principal Display Panel',
    expectedDeclarations: ['Generic Name', 'Net Quantity (SI Units)'],
    file: null,
    previewUrl: null
  },
  back: {
    key: 'back',
    label: 'Back Panel',
    subtitle: 'Statutory Manufacturer & Helpline',
    expectedDeclarations: ['Manufacturer Name & Address', 'Consumer Helpline / Email'],
    file: null,
    previewUrl: null
  },
  side_mrp: {
    key: 'side_mrp',
    label: 'Side (Price & Dates)',
    subtitle: 'MRP & Unit Sale Price',
    expectedDeclarations: ['MRP (Inclusive of Taxes)', 'Unit Sale Price (USP)', 'Mfg/Expiry Date'],
    file: null,
    previewUrl: null
  },
  bottom: {
    key: 'bottom',
    label: 'Bottom Panel',
    subtitle: 'Batch & Barcode',
    expectedDeclarations: ['Barcode (EAN-13)', 'Batch / Lot Number'],
    file: null,
    previewUrl: null
  },
  top: {
    key: 'top',
    label: 'Top Panel',
    subtitle: 'Seal & Branding',
    expectedDeclarations: ['Tamper-evident seal', 'Brand crest'],
    file: null,
    previewUrl: null
  },
  side_nutrition: {
    key: 'side_nutrition',
    label: 'Side (Nutrition/FSSAI)',
    subtitle: 'License & Ingredients',
    expectedDeclarations: ['FSSAI / ISI License', 'Ingredients list'],
    file: null,
    previewUrl: null
  }
}

interface ViolationVerificationState {
  [ruleCode: string]: 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW' | 'PENDING'
}

const Scan: React.FC = () => {
  const navigate = useNavigate()
  const { hasPermission } = useRBAC()
  
  const [panels, setPanels] = useState<Record<PanelKey, PanelSlot>>(INITIAL_PANELS)
  const [activePanelKey, setActivePanelKey] = useState<PanelKey>('front')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [activeSession, setActiveSession] = useState<InspectionSession | null>(null)
  
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [selectedViolation, setSelectedViolation] = useState<RuleViolation | null>(null)
  const [verificationStates, setVerificationStates] = useState<ViolationVerificationState>({})
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const raw = sessionStorage.getItem('sih26034_active_session')
    if (raw) {
      try {
        setActiveSession(JSON.parse(raw))
      } catch (e) {
        console.warn('Could not parse active session:', e)
      }
    }
  }, [])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, panelKey?: PanelKey) => {
    const file = e.target.files?.[0]
    if (!file) return

    const targetKey = panelKey || activePanelKey
    const previewUrl = URL.createObjectURL(file)

    setPanels(prev => ({
      ...prev,
      [targetKey]: {
        ...prev[targetKey],
        file,
        previewUrl
      }
    }))
    toast.success(`Loaded image for ${panels[targetKey].label}`)
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
      toast.error('Please capture or upload at least 1 package panel photo.')
      return
    }

    setIsScanning(true)
    setScanResult(null)

    try {
      let result: ScanResponse
      if (populatedPanels.length === 1) {
        result = await scanPackage(populatedPanels[0].file!)
      } else {
        result = await scanMultiPackages(
          populatedPanels.map(p => ({ panel: p.label, file: p.file! }))
        )
      }

      setScanResult(result)

      // Initialize verification states
      const initVerif: ViolationVerificationState = {}
      result.violations.forEach(v => {
        initVerif[v.rule_code] = 'PENDING'
      })
      setVerificationStates(initVerif)

      if (result.status === 'PASS') {
        toast.success('Package is Fully Compliant with Legal Metrology PCR Rules!')
      } else if (result.status === 'FAIL') {
        toast.error(`Compliance Check Failed: ${result.violations.length} statutory defect(s) detected.`)
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

  const handleVerifyViolation = (ruleCode: string, state: 'CONFIRMED' | 'REJECTED' | 'NEEDS_REVIEW') => {
    setVerificationStates(prev => ({
      ...prev,
      [ruleCode]: state
    }))
    toast.success(`Violation marked as ${state.replace(/_/g, ' ')}`)
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
      {/* Active Session Bar */}
      {activeSession ? (
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
              <span>Weigh Sample</span>
            </button>
            <button
              onClick={() => navigate('/seizures')}
              className="px-3 py-1.5 bg-red-800/80 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center space-x-1"
            >
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>Seizure Memo</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between text-xs text-amber-900">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0" />
            <span>No active field inspection session linked. You can scan standalone or start an official session.</span>
          </div>
          <button
            onClick={() => navigate('/entities')}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs"
          >
            Identify Premises & Start
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Multi-Angle Capture Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <Camera className="h-5 w-5 text-blue-600" />
                  <span>Multi-Angle Package Photo Capture</span>
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
                    className={`p-2.5 rounded-xl border text-left transition-all relative ${
                      isSelected
                        ? 'bg-blue-50/80 border-blue-500 ring-2 ring-blue-500/20 shadow-sm'
                        : isCaptured
                        ? 'bg-emerald-50/60 border-emerald-300'
                        : 'bg-gray-50 border-gray-200 hover:bg-gray-100/70'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-gray-900 truncate">{p.label}</span>
                      {isCaptured && <CheckCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />}
                    </div>
                    <span className="text-[10px] text-gray-500 block truncate mt-0.5">{p.subtitle}</span>
                  </button>
                )
              })}
            </div>

            {/* Active Panel Viewfinder / Upload Box */}
            <div className="relative border-2 border-dashed border-gray-300 rounded-2xl p-6 bg-slate-50 flex flex-col items-center justify-center min-h-[280px] overflow-hidden">
              {panels[activePanelKey].previewUrl ? (
                <div className="relative w-full h-full flex flex-col items-center">
                  <img
                    src={panels[activePanelKey].previewUrl!}
                    alt={panels[activePanelKey].label}
                    className="max-h-[240px] w-auto object-contain rounded-xl shadow-md"
                  />
                  <div className="mt-3 flex items-center space-x-2">
                    <button
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

              {/* Hidden Inputs */}
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
                  <span>Extracting Declarations & Evaluating LMPC Rules...</span>
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

        {/* Right Column: AI Extraction & Declaration Detection Matrix */}
        <div className="lg:col-span-6 space-y-4">
          {scanResult ? (
            <div className="space-y-4">
              {/* Overall Compliance Verdict Banner */}
              <div className={`p-5 rounded-2xl border text-white shadow-md flex items-center justify-between ${
                scanResult.status === 'PASS' ? 'bg-gradient-to-r from-emerald-800 to-teal-900 border-emerald-500' :
                scanResult.status === 'FAIL' ? 'bg-gradient-to-r from-red-900 to-rose-950 border-red-600' :
                'bg-gradient-to-r from-amber-800 to-orange-950 border-amber-600'
              }`}>
                <div>
                  <div className="flex items-center space-x-2">
                    {scanResult.status === 'PASS' ? <CheckCircle2 className="h-6 w-6 text-emerald-300" /> : <AlertTriangle className="h-6 w-6 text-red-300" />}
                    <h3 className="text-lg font-black tracking-wide">
                      {scanResult.status === 'PASS' ? 'COMPLIANT PACKAGE' : scanResult.status === 'FAIL' ? 'NON-COMPLIANT' : 'REVIEW REQUIRED'}
                    </h3>
                  </div>
                  <p className="text-xs text-white/80 mt-1">
                    {scanResult.violations.length === 0
                      ? 'All mandatory Legal Metrology (Packaged Commodities) declarations verified.'
                      : `${scanResult.violations.length} statutory non-compliance defect(s) detected.`}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-[10px] uppercase text-white/70 block">AI Confidence</span>
                  <span className="text-xl font-black">{Math.round(scanResult.overall_confidence * 100)}%</span>
                </div>
              </div>

              {/* Declaration Detection Matrix */}
              <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Mandatory Declaration Detection Matrix</h3>
                    <p className="text-[11px] text-gray-500">Legal Metrology (Packaged Commodities) Rules, 2011</p>
                  </div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-md">
                    Rule 6 Checklist
                  </span>
                </div>

                <div className="divide-y divide-gray-100">
                  {mandatoryDeclarationsList.map((dec, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-gray-900">{dec.name}</span>
                          <span className="text-[10px] text-gray-400 font-mono">({dec.rule})</span>
                        </div>
                        <p className="text-[11px] text-gray-600 mt-0.5 truncate max-w-[280px]">
                          {dec.value}
                        </p>
                      </div>

                      <div>
                        {dec.detected ? (
                          <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 font-bold text-[10px] rounded-full flex items-center space-x-1">
                            <CheckCircle className="h-3 w-3" />
                            <span>✓ Detected</span>
                          </span>
                        ) : (
                          <span className="px-2.5 py-1 bg-red-100 text-red-800 font-bold text-[10px] rounded-full flex items-center space-x-1">
                            <XCircle className="h-3 w-3" />
                            <span>❌ Missing</span>
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Human-in-the-Loop Violation Cards */}
              {scanResult.violations.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-black text-gray-900 flex items-center space-x-2">
                    <ShieldAlert className="h-4 w-4 text-red-600" />
                    <span>Statutory Violation Cards (Inspector Verification Required)</span>
                  </h3>

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
                          <span className="text-[11px] text-gray-500 mr-auto font-medium">Officer Decision:</span>
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
                            [NEEDS REVIEW]
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
    </div>
  )
}

export default Scan