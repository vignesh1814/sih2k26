import React, { useState, useRef } from 'react'
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
  Tag
} from 'lucide-react'
import toast from 'react-hot-toast'
import { 
  scanPackage, 
  scanMultiPackages,
  generateReport, 
  ScanResponse
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

export interface ActualProductSimulation {
  id: string
  name: string
  category: string
  type: 'single' | 'multi'
  panels: Array<{
    slot: PanelKey
    label: string
    imagePath: string
    filename: string
  }>
  badge: string
  description: string
}

export const ACTUAL_PRODUCT_SIMULATIONS: ActualProductSimulation[] = [
  {
    id: 'parle_g_multi',
    name: 'Parle-G Gluco Biscuits (Multi-Panel Fusion)',
    category: 'Biscuits / FMCG',
    type: 'multi',
    badge: 'Multi-Panel (Front & Back)',
    description: "Actual photographs of India's iconic biscuit pack: Front PDP and Back panel with nutrition, FSSAI license, barcode, and batch code.",
    panels: [
      { slot: 'front', label: 'Front (PDP)', imagePath: '/dataset/real_images/parle_g_front.jpg', filename: 'parle_g_front.jpg' },
      { slot: 'back', label: 'Back (Nutrition & Barcode)', imagePath: '/dataset/real_images/parle_g_back.jpg', filename: 'parle_g_back.jpg' }
    ]
  },
  {
    id: 'britannia_bourbon',
    name: 'Britannia Bourbon Chocolate Pack',
    category: 'Bakery & Biscuits',
    type: 'single',
    badge: 'Retail Store Photo',
    description: 'Genuine retail photograph of Britannia Bourbon chocolate sandwich biscuits with live brand name & net quantity detection.',
    panels: [
      { slot: 'front', label: 'Front (PDP)', imagePath: '/dataset/real_images/britannia_bourbon.jpg', filename: 'britannia_bourbon.jpg' }
    ]
  },
  {
    id: 'tata_salt',
    name: 'Tata Salt 1kg Iodized Pack',
    category: 'Essential Commodities',
    type: 'single',
    badge: 'Actual Commodity Photo',
    description: 'Real photo of Tata Salt 1kg consumer pouch inspecting SI units (kg) and statutory product branding.',
    panels: [
      { slot: 'front', label: 'Front (PDP)', imagePath: '/dataset/real_images/tata_salt.jpg', filename: 'tata_salt.jpg' }
    ]
  },
  {
    id: 'maggi_noodles',
    name: 'Maggi 2-Minute Masala Noodles',
    category: 'Instant Foods',
    type: 'single',
    badge: 'Actual Pouch Photo',
    description: 'Authentic Maggi 2-minute noodle packet evaluating net weight declaration and principal display panel formatting.',
    panels: [
      { slot: 'front', label: 'Front (PDP)', imagePath: '/dataset/real_images/maggi_noodles.jpg', filename: 'maggi_noodles.jpg' }
    ]
  },
  {
    id: 'haldiram_namkeen',
    name: "Haldiram's Traditional Sev Bhujia",
    category: 'Packaged Snacks',
    type: 'single',
    badge: 'Actual Snack Pouch',
    description: "Authentic Haldiram's savory snack packaging examining FSSAI license and metric weight declaration.",
    panels: [
      { slot: 'front', label: 'Front (PDP)', imagePath: '/dataset/real_images/haldiram_namkeen.jpg', filename: 'haldiram_namkeen.jpg' }
    ]
  },
  {
    id: 'dettol_soap',
    name: 'Dettol Original Germ Protection Pack',
    category: 'Personal Hygiene',
    type: 'single',
    badge: 'Actual Carton Photo',
    description: 'Personal care soap carton examining consumer commodity statutory labeling.',
    panels: [
      { slot: 'front', label: 'Front (PDP)', imagePath: '/dataset/real_images/dettol.jpg', filename: 'dettol.jpg' }
    ]
  }
]

// Actual authentic samples from synthetic_dataset/
const REAL_DATASET_ITEMS = [
  { id: 'SYN_000', label: 'SYN_000 • Fully Compliant (PASS)', status: 'PASS', issue: 'None (Full LMPC Compliance)' },
  { id: 'SYN_001', label: 'SYN_001 • Missing Inclusive Taxes (FAIL)', status: 'FAIL', issue: 'Rule 6(1)(e): MRP omits "Inclusive of all taxes"' },
  { id: 'SYN_003', label: 'SYN_003 • Illegal "ltrs" Unit (FAIL)', status: 'FAIL', issue: 'Rule 6(1)(c) & Rule 13: Non-standard unit "ltrs"' },
  { id: 'SYN_006', label: 'SYN_006 • Prohibited "gms" Unit (FAIL)', status: 'FAIL', issue: 'Rule 6(1)(c) & Rule 13: Non-standard unit "gms"' },
  { id: 'SYN_002', label: 'SYN_002 • Compliant 200g Pack (PASS)', status: 'PASS', issue: 'None (Standard SI grams unit)' },
  { id: 'SYN_007', label: 'SYN_007 • Compliant 500g Pack (PASS)', status: 'PASS', issue: 'None (Valid statutory declarations)' }
]

const Scan: React.FC = () => {
  const { hasPermission } = useRBAC()
  
  const [panels, setPanels] = useState<Record<PanelKey, PanelSlot>>(INITIAL_PANELS)
  const [activePanelKey, setActivePanelKey] = useState<PanelKey>('front')
  const [isScanning, setIsScanning] = useState(false)
  const [scanResult, setScanResult] = useState<ScanResponse | null>(null)
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(true)
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false)
  const [showHitlModal, setShowHitlModal] = useState(false)
  const [hitlVerified, setHitlVerified] = useState(false)
  const [officerNotes, setOfficerNotes] = useState('')
  const [selectedRealSampleId, setSelectedRealSampleId] = useState('SYN_000')

  const singleFileInputRef = useRef<HTMLInputElement>(null)
  const batchFileInputRef = useRef<HTMLInputElement>(null)

  const capturedCount = Object.values(panels).filter(p => p.previewUrl !== null).length

  // Live simulation using actual real-world commodity photographs from Open Food Facts / Retail
  const runActualProductSimulation = async (simId: string) => {
    const sim = ACTUAL_PRODUCT_SIMULATIONS.find(s => s.id === simId)
    if (!sim) return

    setIsScanning(true)
    try {
      const updatedPanels = { ...INITIAL_PANELS }
      const loadedFiles: Array<{ slot: PanelKey; label: string; file: File; url: string }> = []

      for (const p of sim.panels) {
        const res = await fetch(p.imagePath)
        if (!res.ok) throw new Error(`Could not load ${p.imagePath}`)
        const blob = await res.blob()
        const file = new File([blob], p.filename, { type: blob.type || 'image/jpeg' })
        loadedFiles.push({ slot: p.slot, label: p.label, file, url: p.imagePath })
        updatedPanels[p.slot] = {
          ...updatedPanels[p.slot],
          file: file,
          previewUrl: p.imagePath
        }
      }

      setPanels(updatedPanels)
      setActivePanelKey(sim.panels[0].slot)

      if (sim.type === 'single') {
        const result = await scanPackage(loadedFiles[0].file)
        setScanResult(result)
        toast.success(`Processed actual photo: ${sim.name}`)
      } else {
        const payload = loadedFiles.map(f => ({ panel: f.label, file: f.file }))
        const result = await scanMultiPackages(payload)
        setScanResult(result)
        toast.success(`Fused ${loadedFiles.length} actual packaging angles: ${sim.name}`)
      }
    } catch (err) {
      console.error('[Scan] Real simulation error:', err)
      toast.error('Failed to process real packaging photo')
    } finally {
      setIsScanning(false)
    }
  }

  // Real scan execution using actual synthetic image file sent to FastAPI backend
  const loadAndScanRealDatasetItem = async (imageId: string) => {
    setIsScanning(true)
    try {
      const imgUrl = `/dataset/images/${imageId}.png`
      const res = await fetch(imgUrl)
      if (!res.ok) throw new Error(`Could not load /dataset/images/${imageId}.png`)
      const blob = await res.blob()
      const file = new File([blob], `${imageId}.png`, { type: 'image/png' })

      // Set preview for front panel
      setPanels(prev => ({
        ...prev,
        front: {
          ...prev.front,
          file: file,
          previewUrl: imgUrl
        }
      }))
      setActivePanelKey('front')

      // Call backend /api/v1/scan with the real file
      const result = await scanPackage(file)
      setScanResult(result)
      toast.success(`Processed authentic dataset label ${imageId}.png: Status ${result.status}`)
    } catch (err) {
      console.error('[Scan] Real dataset load error:', err)
      toast.error('Failed to load dataset image')
    } finally {
      setIsScanning(false)
    }
  }

  // Real multi-panel demo using actual authentic dataset files
  const loadRealMultiPanelDemo = async (isViolation = false) => {
    setIsScanning(true)
    try {
      const frontId = isViolation ? 'SYN_001' : 'SYN_000'
      const backId = 'SYN_002'
      const sideId = isViolation ? 'SYN_006' : 'SYN_004'
      const bottomId = 'SYN_008'

      const fetchFile = async (id: string) => {
        const res = await fetch(`/dataset/images/${id}.png`)
        const blob = await res.blob()
        return new File([blob], `${id}.png`, { type: 'image/png' })
      }

      const [fFront, fBack, fSide, fBottom] = await Promise.all([
        fetchFile(frontId),
        fetchFile(backId),
        fetchFile(sideId),
        fetchFile(bottomId)
      ])

      setPanels({
        front: { ...INITIAL_PANELS.front, file: fFront, previewUrl: `/dataset/images/${frontId}.png` },
        back: { ...INITIAL_PANELS.back, file: fBack, previewUrl: `/dataset/images/${backId}.png` },
        side_mrp: { ...INITIAL_PANELS.side_mrp, file: fSide, previewUrl: `/dataset/images/${sideId}.png` },
        bottom: { ...INITIAL_PANELS.bottom, file: fBottom, previewUrl: `/dataset/images/${bottomId}.png` },
        top: INITIAL_PANELS.top,
        side_nutrition: INITIAL_PANELS.side_nutrition
      })

      setActivePanelKey('front')

      // Call actual backend /api/v1/scan-multi endpoint
      const payload = [
        { panel: 'Front (PDP)', file: fFront },
        { panel: 'Back Panel', file: fBack },
        { panel: 'Side (Price & Dates)', file: fSide },
        { panel: 'Bottom Panel', file: fBottom }
      ]
      const result = await scanMultiPackages(payload)
      setScanResult(result)
      toast.success(`Fused 4 authentic package surfaces on backend: Status ${result.status}`)
    } catch (err) {
      console.error('[Scan] Real multi-panel error:', err)
      toast.error('Failed to execute multi-panel audit')
    } finally {
      setIsScanning(false)
    }
  }

  const handleSinglePanelSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const url = URL.createObjectURL(file)
      setPanels(prev => ({
        ...prev,
        [activePanelKey]: {
          ...prev[activePanelKey],
          file: file,
          previewUrl: url
        }
      }))
      setScanResult(null)
      toast.success(`${panels[activePanelKey].label} photo loaded`)
    }
  }

  const handleBatchSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const keys: PanelKey[] = ['front', 'back', 'side_mrp', 'bottom', 'top', 'side_nutrition']
    const updated = { ...panels }

    for (let i = 0; i < Math.min(files.length, keys.length); i++) {
      const file = files[i]
      const k = keys[i]
      updated[k] = {
        ...updated[k],
        file: file,
        previewUrl: URL.createObjectURL(file)
      }
    }

    setPanels(updated)
    setScanResult(null)
    toast.success(`Assigned ${Math.min(files.length, keys.length)} photos to packaging angle slots`)
  }

  const handleRemovePanel = (key: PanelKey, e: React.MouseEvent) => {
    e.stopPropagation()
    setPanels(prev => ({
      ...prev,
      [key]: {
        ...prev[key],
        file: null,
        previewUrl: null
      }
    }))
  }

  const handleStartAudit = async () => {
    const filled = Object.values(panels).filter(p => p.file !== null)
    if (filled.length === 0) {
      toast.error('Please upload or select at least one package picture')
      return
    }

    setIsScanning(true)
    try {
      if (filled.length === 1 && filled[0].file) {
        const res = await scanPackage(filled[0].file)
        setScanResult(res)
      } else {
        const payload = filled.map(p => ({ panel: p.label, file: p.file! }))
        const res = await scanMultiPackages(payload)
        setScanResult(res)
      }
    } catch (err: any) {
      console.error('[Scan] Audit processing failed:', err)
      const detail = err?.response?.data?.detail || err?.message || 'Backend server is offline or unreachable'
      toast.error(`Audit failed: ${detail}`, { duration: 6000 })
    } finally {
      setIsScanning(false)
    }
  }

  const handleResetAll = () => {
    setPanels(INITIAL_PANELS)
    setActivePanelKey('front')
    setScanResult(null)
    setHitlVerified(false)
    if (singleFileInputRef.current) singleFileInputRef.current.value = ''
    if (batchFileInputRef.current) batchFileInputRef.current.value = ''
  }

  const handleDownloadChallan = async () => {
    if (!scanResult) return
    setIsGeneratingPdf(true)
    try {
      const res = await generateReport({
        scan_id: scanResult.scan_id,
        officer_name: 'Inspector S. K. Sharma',
        station_jurisdiction: 'Maharashtra Zone II',
        notes: officerNotes || `Statutory inspection of packaging label.`
      })
      window.open(res.pdf_url, '_blank')
      toast.success('Statutory Legal Metrology Challan generated')
    } catch (err) {
      toast.error('Failed to generate PDF Challan')
    } finally {
      setIsGeneratingPdf(false)
    }
  }

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
      PASS: { color: 'bg-emerald-100 text-emerald-800 border-emerald-300', icon: <CheckCircle className="h-4 w-4 text-emerald-600" /> },
      FAIL: { color: 'bg-rose-100 text-rose-800 border-rose-300', icon: <XCircle className="h-4 w-4 text-rose-600" /> },
      NEEDS_REVIEW: { color: 'bg-amber-100 text-amber-800 border-amber-300', icon: <AlertCircle className="h-4 w-4 text-amber-600" /> },
      INSUFFICIENT_EVIDENCE: { color: 'bg-indigo-100 text-indigo-800 border-indigo-300', icon: <AlertCircle className="h-4 w-4 text-indigo-600" /> }
    }
    const current = config[status as keyof typeof config] || config.INSUFFICIENT_EVIDENCE

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border ${current.color}`}>
        {current.icon}
        <span className="ml-1.5">{status.replace(/_/g, ' ')}</span>
      </span>
    )
  }

  if (!hasPermission('scan', 'create')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">You don't have permission to access the Scan Module.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Layers className="h-7 w-7 text-blue-600" />
            <span>Packaging Statutory Compliance Studio</span>
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Real OCR transcription &amp; deterministic Zen Engine validation under LMPC Rules, 2011.
          </p>
        </div>

        {/* Actual Commodity Photo Simulation Quick-Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => runActualProductSimulation('parle_g_multi')}
            className="text-xs bg-cyan-50 text-cyan-800 border border-cyan-300 px-3 py-1.5 rounded-lg hover:bg-cyan-100 font-bold transition-colors flex items-center space-x-1 shadow-sm"
          >
            <Camera className="h-3.5 w-3.5 text-cyan-600" />
            <span>Parle-G 2-Panel (Actual Photo)</span>
          </button>
          <button
            onClick={() => runActualProductSimulation('britannia_bourbon')}
            className="text-xs bg-amber-50 text-amber-800 border border-amber-300 px-3 py-1.5 rounded-lg hover:bg-amber-100 font-bold transition-colors flex items-center space-x-1 shadow-sm"
          >
            <Camera className="h-3.5 w-3.5 text-amber-600" />
            <span>Britannia Bourbon (Actual Photo)</span>
          </button>
          <button
            onClick={() => runActualProductSimulation('tata_salt')}
            className="text-xs bg-blue-50 text-blue-800 border border-blue-300 px-3 py-1.5 rounded-lg hover:bg-blue-100 font-bold transition-colors flex items-center space-x-1 shadow-sm"
          >
            <Camera className="h-3.5 w-3.5 text-blue-600" />
            <span>Tata Salt 1kg (Actual Photo)</span>
          </button>
          <button
            onClick={() => runActualProductSimulation('maggi_noodles')}
            className="text-xs bg-rose-50 text-rose-800 border border-rose-300 px-3 py-1.5 rounded-lg hover:bg-rose-100 font-bold transition-colors flex items-center space-x-1 shadow-sm"
          >
            <Camera className="h-3.5 w-3.5 text-rose-600" />
            <span>Maggi Noodles (Actual Photo)</span>
          </button>
        </div>
      </div>

      {/* Real-World Packaging Photographic Simulations Suite */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-4 rounded-xl shadow-md text-white flex flex-col md:flex-row md:items-center md:justify-between gap-4 border border-indigo-800/40">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-indigo-500/20 rounded-lg border border-indigo-400/30">
            <Camera className="h-5 w-5 text-cyan-400" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider text-cyan-300">
                Real-World Packaging Photographic Simulations:
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2 py-0.5 rounded-full font-semibold">
                100% Genuine Retail Photos
              </span>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5">
              Loads authentic consumer commodity packaging photos (Parle-G, Bourbon, Tata Salt, Maggi, Haldiram's, Dettol) with live RapidOCR &amp; deterministic LMPC compliance engine.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            onChange={(e) => {
              if (e.target.value) runActualProductSimulation(e.target.value)
            }}
            defaultValue=""
            className="bg-slate-800 border border-slate-600 text-white text-xs rounded-lg px-3 py-2 focus:ring-2 focus:ring-cyan-400 focus:outline-none"
          >
            <option value="" disabled>Select an Actual Product Simulation...</option>
            {ACTUAL_PRODUCT_SIMULATIONS.map((sim) => (
              <option key={sim.id} value={sim.id}>
                📷 {sim.name} — {sim.badge}
              </option>
            ))}
          </select>

          <button
            onClick={() => runActualProductSimulation('parle_g_multi')}
            className="text-xs bg-cyan-600 hover:bg-cyan-500 text-white px-3 py-2 rounded-lg font-bold transition-colors shadow-sm flex items-center space-x-1"
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Simulate Parle-G 2-Angle</span>
          </button>
        </div>
      </div>

      {/* Statutory Rule Benchmark Edge Cases Bar */}
      <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 text-white flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs">
        <div className="flex items-center space-x-2">
          <Database className="h-4 w-4 text-gov-gold flex-shrink-0" />
          <span className="text-slate-300 font-medium">
            Statutory Rule Edge Cases Benchmark (20 Synthetic Labels for Rule 6/13 Edge Scenarios):
          </span>
        </div>

        <div className="flex items-center space-x-2">
          <select
            value={selectedRealSampleId}
            onChange={(e) => {
              setSelectedRealSampleId(e.target.value)
              loadAndScanRealDatasetItem(e.target.value)
            }}
            className="bg-slate-700 border border-slate-600 text-white text-xs rounded px-2.5 py-1 focus:outline-none"
          >
            {REAL_DATASET_ITEMS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
          <button
            onClick={() => loadRealMultiPanelDemo(false)}
            className="text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 border border-slate-500 px-2.5 py-1 rounded transition-colors"
          >
            Fused 4-Panel Synthetic
          </button>
        </div>
      </div>

      {/* Hidden File Inputs */}
      <input
        ref={singleFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleSinglePanelSelect}
        className="hidden"
      />
      <input
        ref={batchFileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleBatchSelect}
        className="hidden"
      />

      {/* Packaging Surfaces & Angle Slots */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Camera className="h-5 w-5 text-blue-600" />
            <span className="font-bold text-sm text-gray-900">
              Packaging Surfaces &amp; Angles ({capturedCount} of 6 captured)
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => batchFileInputRef.current?.click()}
              className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-md hover:bg-blue-100 font-medium transition-colors flex items-center space-x-1"
            >
              <Upload className="h-3.5 w-3.5" />
              <span>Batch Upload Custom Photos</span>
            </button>
            {capturedCount > 0 && (
              <button
                onClick={handleResetAll}
                className="text-xs text-gray-500 hover:text-red-600 px-2 py-1 rounded transition-colors"
              >
                Clear All
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {(Object.values(panels) as PanelSlot[]).map((p) => {
            const isSelected = activePanelKey === p.key
            const hasPhoto = p.previewUrl !== null

            return (
              <div
                key={p.key}
                onClick={() => setActivePanelKey(p.key)}
                className={`relative p-2.5 rounded-lg border-2 cursor-pointer transition-all flex flex-col justify-between min-h-[115px] ${
                  isSelected 
                    ? 'border-blue-600 bg-blue-50/60 shadow-sm' 
                    : hasPhoto 
                      ? 'border-emerald-300 bg-emerald-50/30 hover:border-emerald-400' 
                      : 'border-dashed border-gray-300 bg-gray-50 hover:border-gray-400'
                }`}
              >
                {/* Top Badge */}
                <div className="flex items-center justify-between">
                  <span className={`text-[11px] font-bold ${isSelected ? 'text-blue-900' : 'text-gray-700'}`}>
                    {p.label}
                  </span>
                  {hasPhoto ? (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" title="Captured" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-gray-300" title="Empty" />
                  )}
                </div>

                {/* Center Preview or Add Button */}
                <div className="my-1.5 flex items-center justify-center">
                  {hasPhoto ? (
                    <div className="relative group w-full h-12 rounded overflow-hidden bg-white border border-gray-200 flex items-center justify-center">
                      <img src={p.previewUrl!} alt={p.label} className="w-full h-full object-contain" />
                      <button
                        onClick={(e) => handleRemovePanel(p.key, e)}
                        className="absolute inset-0 bg-red-600/80 text-white opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity"
                        title="Remove angle"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setActivePanelKey(p.key)
                        singleFileInputRef.current?.click()
                      }}
                      className="text-gray-400 hover:text-blue-600 p-1 rounded transition-colors flex flex-col items-center"
                    >
                      <Plus className="h-5 w-5" />
                      <span className="text-[10px] text-gray-500 font-medium">Add Photo</span>
                    </button>
                  )}
                </div>

                {/* Subtitle */}
                <p className="text-[10px] text-gray-500 leading-tight truncate">
                  {p.subtitle}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Main Studio Viewport (Image View + Audit Results) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Active Angle Photo & Bounding Box Viewer */}
        <div className="lg:col-span-5 bg-white rounded-xl shadow-sm p-5 border border-gray-200 flex flex-col space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-900">
                {panels[activePanelKey].label} Inspection View
              </h2>
              <p className="text-xs text-gray-500">{panels[activePanelKey].subtitle}</p>
            </div>

            {panels[activePanelKey].previewUrl && scanResult && (
              <button
                onClick={() => setShowBoundingBoxes(!showBoundingBoxes)}
                className="text-xs flex items-center space-x-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-2.5 py-1 rounded"
              >
                {showBoundingBoxes ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                <span>{showBoundingBoxes ? 'Hide BBoxes' : 'Show BBoxes'}</span>
              </button>
            )}
          </div>

          {/* Active Image Box */}
          {!panels[activePanelKey].previewUrl ? (
            <div 
              onClick={() => singleFileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 cursor-pointer transition-colors bg-gray-50 flex flex-col items-center justify-center min-h-[300px]"
            >
              <Upload className="h-10 w-10 text-gray-400 mb-3" />
              <p className="text-sm font-semibold text-gray-700">Upload or photograph {panels[activePanelKey].label}</p>
              <p className="text-xs text-gray-500 mt-1">
                Expected: {panels[activePanelKey].expectedDeclarations.join(', ')}
              </p>
              <button className="mt-4 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold shadow-sm">
                Choose Picture
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="relative w-full h-[320px] bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center">
                <img
                  src={panels[activePanelKey].previewUrl!}
                  alt={panels[activePanelKey].label}
                  className="w-full h-full object-contain"
                />

                {/* Overlaid Bounding Boxes (Accurately scaled to 800x500 real synthetic dimensions) */}
                {showBoundingBoxes && scanResult && scanResult.detections && (
                  <svg 
                    viewBox="0 0 800 500"
                    preserveAspectRatio="xMidYMid meet"
                    className="absolute inset-0 w-full h-full pointer-events-none"
                  >
                    {scanResult.detections.map((box, idx) => (
                      <g key={idx}>
                        <rect
                          x={box.x_min}
                          y={box.y_min}
                          width={box.x_max - box.x_min}
                          height={box.y_max - box.y_min}
                          fill="rgba(59, 130, 246, 0.15)"
                          stroke="#2563eb"
                          strokeWidth="2"
                        />
                        <text
                          x={box.x_min + 4}
                          y={Math.max(box.y_min - 4, 12)}
                          fill="#1d4ed8"
                          fontSize="11"
                          fontWeight="bold"
                        >
                          {box.text}
                        </text>
                      </g>
                    ))}
                  </svg>
                )}
              </div>

              {/* Angle Switcher & Retake */}
              <div className="flex items-center justify-between pt-1 text-xs">
                <button
                  onClick={() => singleFileInputRef.current?.click()}
                  className="text-blue-600 hover:text-blue-700 font-medium"
                >
                  Upload Alternate Picture for {panels[activePanelKey].label}
                </button>
                <span className="text-gray-500">
                  {capturedCount} angle{capturedCount > 1 ? 's' : ''} loaded
                </span>
              </div>
            </div>
          )}

          {/* Run Audit Button */}
          <div className="pt-2">
            <button
              onClick={handleStartAudit}
              disabled={isScanning || capturedCount === 0}
              className="w-full flex items-center justify-center space-x-2 bg-gov-navy text-white py-3 px-4 rounded-xl hover:bg-gov-blue disabled:opacity-50 font-bold text-sm transition-colors shadow-md"
            >
              {isScanning ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Analyzing Label &amp; Validating Rules on Backend...</span>
                </>
              ) : (
                <>
                  <ScanIcon className="h-4 w-4" />
                  <span>Run Statutory Audit ({capturedCount} Captured)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Extracted Declarations & LMPC Violations */}
        <div className="lg:col-span-7 bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h2 className="text-base font-bold text-gray-900">Extracted Declarations &amp; Findings</h2>
              <p className="text-xs text-gray-500">Verified against Legal Metrology (Packaged Commodities) Rules, 2011</p>
            </div>
            {scanResult && <StatusBadge status={scanResult.status} />}
          </div>

          {!scanResult ? (
            <div className="flex flex-col items-center justify-center py-16 text-gray-400 text-center space-y-3">
              <ScanIcon className="h-12 w-12 text-gray-300" />
              <div>
                <p className="text-sm font-semibold text-gray-700">No active audit results</p>
                <p className="text-xs text-gray-400 mt-1 max-w-sm">
                  Click one of the authentic dataset buttons above (<code className="text-blue-600">SYN_000</code>, <code className="text-blue-600">SYN_001</code>, <code className="text-blue-600">SYN_006</code>) to run the real OCR &amp; Zen Engine compliance audit.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Message Banner */}
              {scanResult.message && (
                <div className={`p-3 rounded-lg text-xs font-medium border flex items-start space-x-2 ${
                  scanResult.status === 'INSUFFICIENT_EVIDENCE'
                    ? 'bg-indigo-50 border-indigo-200 text-indigo-800'
                    : scanResult.status === 'FAIL'
                      ? 'bg-rose-50 border-rose-200 text-rose-800'
                      : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                }`}>
                  <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold">{scanResult.message}</p>
                    <p className="text-[11px] text-gray-600 mt-0.5">
                      Session Reference: <span className="font-mono font-bold text-gray-800">{scanResult.scan_id}</span> | 
                      Confidence: <span className="font-bold text-blue-700">{(scanResult.overall_confidence > 1 ? scanResult.overall_confidence : scanResult.overall_confidence * 100).toFixed(1)}%</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Violations List */}
              {scanResult.violations && scanResult.violations.length > 0 ? (
                <div className="bg-rose-50 border border-rose-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center space-x-2 text-rose-800">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <h3 className="font-bold text-sm">
                      {scanResult.violations.length} Statutory Violation{scanResult.violations.length > 1 ? 's' : ''} Detected
                    </h3>
                  </div>
                  <div className="space-y-2">
                    {scanResult.violations.map((v, i) => (
                      <div key={i} className="bg-white p-3 rounded border border-rose-200 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-rose-900">{v.rule_code} — {v.declaration}</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 font-bold text-[10px] uppercase">
                            {v.severity}
                          </span>
                        </div>
                        <p className="text-rose-700">{v.reason}</p>
                        {v.suggested_correction && (
                          <p className="text-gray-600 pt-1 border-t border-rose-100">
                            <span className="text-emerald-700 font-bold">Correction: </span>
                            {v.suggested_correction}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3.5 flex items-center space-x-3 text-emerald-800 text-xs">
                  <CheckCircle className="h-5 w-5 text-emerald-600 flex-shrink-0" />
                  <div>
                    <p className="font-bold">Zero Statutory Violations Detected</p>
                    <p className="text-emerald-700">All mandatory Rule 6 declarations present with standard SI symbols and inclusive taxes phrase.</p>
                  </div>
                </div>
              )}

              {/* Extracted Declarations Table */}
              <div className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3.5 py-2 border-b border-gray-200 flex items-center justify-between">
                  <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
                    Extracted Mandatory Declarations (Rule 6)
                  </span>
                  <span className="text-[11px] text-blue-700 font-medium">LMPC 2011 &amp; 2022 Amendment</span>
                </div>
                <div className="divide-y divide-gray-100 text-xs">
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Generic / Common Name:</span>
                    <span className="font-bold text-gray-900">
                      {scanResult.declarations.generic_name || <span className="text-rose-600">Missing</span>}
                    </span>
                  </div>
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Net Quantity:</span>
                    <span className="font-bold text-gray-900">
                      {scanResult.declarations.net_quantity 
                        ? `${scanResult.declarations.net_quantity} ${scanResult.declarations.unit || ''}`
                        : <span className="text-rose-600">Missing</span>
                      }
                    </span>
                  </div>
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Maximum Retail Price (MRP):</span>
                    <span className="font-bold text-gray-900">
                      {scanResult.declarations.mrp ? `₹${scanResult.declarations.mrp.toFixed(2)}` : <span className="text-rose-600">Missing</span>}
                      {scanResult.declarations.has_inclusive_phrase === true ? (
                        <span className="text-emerald-600 font-semibold ml-1.5 text-[11px]">(Inclusive of all taxes)</span>
                      ) : scanResult.declarations.has_inclusive_phrase === false ? (
                        <span className="text-rose-600 font-semibold ml-1.5 text-[11px]">(Omitted Inclusive Phrase - Rule Violation!)</span>
                      ) : null}
                    </span>
                  </div>
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Unit Sale Price (USP):</span>
                    <span className="font-bold text-gray-900">
                      {scanResult.declarations.unit_sale_price 
                        ? `₹${scanResult.declarations.unit_sale_price.toFixed(2)} / ${scanResult.declarations.unit || 'g'}`
                        : <span className="text-gray-500 font-normal">Not detected</span>
                      }
                    </span>
                  </div>
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Manufacturing Date:</span>
                    <span className="font-bold text-gray-900">{scanResult.declarations.mfg_date || 'Not detected'}</span>
                  </div>
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Manufacturer / Packer:</span>
                    <span className="font-bold text-gray-900 text-right max-w-xs truncate">
                      {scanResult.declarations.manufacturer || <span className="text-rose-600">Missing</span>}
                    </span>
                  </div>
                  <div className="px-3.5 py-2 flex justify-between">
                    <span className="text-gray-500 font-medium">Consumer Care Helpline:</span>
                    <span className="font-bold text-gray-900">{scanResult.declarations.consumer_care || 'Not detected'}</span>
                  </div>
                </div>
              </div>

              {/* Rule 7 Physical Font Size Calibration */}
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5 flex items-center justify-between text-xs">
                <div className="flex items-center space-x-2">
                  <Ruler className="h-4 w-4 text-amber-700 flex-shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900">Rule 7 PDP Font Height Verification</p>
                    <p className="text-amber-700 text-[11px]">
                      {hitlVerified ? 'Inspector verified font height with reference card.' : 'Calibrate physical millimeter font height.'}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowHitlModal(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded font-medium text-xs shadow-sm"
                >
                  {hitlVerified ? 'Re-Inspect' : 'HITL Calibrate'}
                </button>
              </div>

              {/* Action: Download Challan */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-100">
                <div className="text-[11px] text-gray-500 flex items-center space-x-1.5 truncate max-w-xs">
                  <span className="font-mono">Evidence SHA-256:</span>
                  <span className="font-mono text-gray-700 truncate">{scanResult.evidence_hash}</span>
                </div>
                <button
                  onClick={handleDownloadChallan}
                  disabled={isGeneratingPdf}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 bg-gov-navy text-white px-4 py-2 rounded-lg hover:bg-gov-blue text-xs font-semibold shadow-sm"
                >
                  {isGeneratingPdf ? (
                    <>
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      <span>Generating Challan...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>Download Statutory Challan (PDF)</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HITL Calibration Modal */}
      {showHitlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-gray-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2">
                <Ruler className="h-5 w-5 text-blue-600" />
                <span>Human-In-The-Loop Scale Calibration</span>
              </h3>
              <button 
                onClick={() => setShowHitlModal(false)}
                className="text-gray-400 hover:text-gray-600 text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <p className="text-xs text-gray-600">
              Per Section N of the SIH26034 Pre-Engineering Dossier, 2D monocular vision cannot resolve absolute millimeter font heights without a physical reference object.
            </p>

            <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 text-xs space-y-1.5">
              <p className="font-bold text-blue-900">Reference Standard Protocol:</p>
              <p className="text-blue-800">• Standard ISO/IEC 7810 Card: 85.60 mm width × 53.98 mm height.</p>
              <p className="text-blue-800">• Table I/II Minimum: 4.0 mm for 200g-1kg Net Quantity.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Inspector Font Height Compliance:
              </label>
              <select className="w-full text-xs border border-gray-300 rounded-lg p-2">
                <option>Compliant (&gt;= 4.0 mm for 200g-1kg)</option>
                <option>Compliant (&gt;= 2.0 mm for 50g-200g)</option>
                <option>Non-Compliant (&lt; statutory minimum)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Field Officer Endorsement:
              </label>
              <textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                placeholder="e.g., Physical font measured 4.2mm with vernier caliper across front and side panels."
                className="w-full text-xs border border-gray-300 rounded-lg p-2 h-16"
              />
            </div>

            <div className="flex space-x-2 pt-2">
              <button
                onClick={() => {
                  setHitlVerified(true)
                  setShowHitlModal(false)
                  toast.success('Rule 7 verification recorded.')
                }}
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg text-xs font-semibold hover:bg-blue-700 transition-colors"
              >
                Endorse &amp; Record Verification
              </button>
              <button
                onClick={() => setShowHitlModal(false)}
                className="px-3 py-2 border border-gray-300 rounded-lg text-xs font-semibold hover:bg-gray-100"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Scan