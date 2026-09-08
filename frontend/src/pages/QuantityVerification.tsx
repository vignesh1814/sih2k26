import React, { useState, useEffect } from 'react'
import { Scale, CheckCircle2, XCircle, AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'
import { recordQuantityMeasurement, fetchMeasurements, QuantityMeasurement } from '../services/api'
import toast from 'react-hot-toast'

const QuantityVerification: React.FC = () => {
  const [productName, setProductName] = useState('')
  const [declaredQty, setDeclaredQty] = useState('')
  const [declaredUnit, setDeclaredUnit] = useState('g')
  const [actualQty, setActualQty] = useState('')
  const [sampleNo, setSampleNo] = useState('SMPL-01')
  const [instrumentType, setInstrumentType] = useState('Electronic Precision Balance (Class II, Verified d=0.1g)')
  const [instrumentCert, setInstrumentCert] = useState('LM/VER/2026/7821')

  const [currentResult, setCurrentResult] = useState<QuantityMeasurement | null>(null)
  const [measurements, setMeasurements] = useState<QuantityMeasurement[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  // Ingest declared quantity from the active scan if available
  useEffect(() => {
    const rawScanned = sessionStorage.getItem('sih26034_last_scanned_commodity')
    if (rawScanned) {
      try {
        const parsed = JSON.parse(rawScanned)
        if (parsed.generic_name) setProductName(parsed.generic_name)
        if (parsed.net_quantity) {
          const num = parseFloat(parsed.net_quantity)
          if (!isNaN(num) && num > 0) {
            setDeclaredQty(String(num))
            // Suggest a realistic test measured weight
            setActualQty(String(num))
          }
        }
        if (parsed.unit) setDeclaredUnit(parsed.unit)
        toast.success(`Loaded "${parsed.generic_name}" from recent scan`, { id: 'prefill-scan' })
      } catch (e) {}
    } else {
      // Clean fallback defaults
      setProductName('Inspected Package')
      setDeclaredQty('500')
      setActualQty('495')
    }
  }, [])

  const loadRecentMeasurements = async () => {
    setLoading(true)
    try {
      const res = await fetchMeasurements()
      if (res.success && res.data) {
        setMeasurements(res.data)
      }
    } catch (err) {
      console.error('Error loading measurements:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadRecentMeasurements()
  }, [])

  // Dynamic calculation preview
  const declaredNum = parseFloat(declaredQty) || 0
  const actualNum = parseFloat(actualQty) || 0
  const diff = Math.round((actualNum - declaredNum) * 100) / 100

  // Schedule 2 MPE calculator preview
  const getMpePreview = (qty: number, unit: string) => {
    let base = qty
    if (['kg', 'l', 'litre'].includes(unit.toLowerCase())) base = qty * 1000
    if (base <= 50) return base * 0.09
    if (base <= 100) return 4.5
    if (base <= 200) return base * 0.045
    if (base <= 300) return 9.0
    if (base <= 500) return base * 0.03
    if (base <= 1000) return 15.0
    if (base <= 10000) return base * 0.015
    if (base <= 15000) return 150.0
    return base * 0.01
  }

  const mpeLimit = getMpePreview(declaredNum, declaredUnit)
  let diffInGrams = diff
  if (['kg', 'l', 'litre'].includes(declaredUnit.toLowerCase())) diffInGrams = diff * 1000
  const isDeficitExceeded = diffInGrams < 0 && Math.abs(diffInGrams) > mpeLimit

  const handleRecordMeasurement = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const activeSessionRaw = sessionStorage.getItem('sih26034_active_session')
      const activeSession = activeSessionRaw ? JSON.parse(activeSessionRaw) : null

      const res = await recordQuantityMeasurement({
        session_id: activeSession?.session_id,
        sample_no: sampleNo,
        product_name: productName,
        declared_quantity: declaredNum,
        declared_unit: declaredUnit,
        actual_quantity: actualNum,
        instrument_type: instrumentType,
        instrument_certificate_no: instrumentCert
      })

      if (res.success && res.data) {
        setCurrentResult(res.data)
        toast.success('Quantity measurement verified & saved to database!')
        loadRecentMeasurements()
      }
    } catch (err: any) {
      toast.error('Failed to record measurement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-700/60 text-blue-200 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-500/30">
              Statutory Quantity Verification
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30">
              Rule 12 & Second Schedule MPE
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">Net Quantity & Tare Weight Verification</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-2xl">
            Compare declared net quantity against actual physical measurement using standard calibrated weighing instruments under the statutory Maximum Permissible Error (MPE) table.
          </p>
        </div>

        <Link
          to="/scan"
          className="inline-flex items-center space-x-1.5 px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold border border-white/20 transition-all self-start md:self-auto"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Label Scan</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <span>Record Sample Net Quantity Measurement</span>
          </h2>

          <form onSubmit={handleRecordMeasurement} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Sample Identification</label>
                <input
                  type="text"
                  value={sampleNo}
                  onChange={(e) => setSampleNo(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Commodity / Product Name</label>
                <input
                  type="text"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  placeholder="e.g. Tata Iodized Salt"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Declared Quantity on Label</label>
                <input
                  type="number"
                  step="any"
                  value={declaredQty}
                  onChange={(e) => setDeclaredQty(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Declared Unit</label>
                <select
                  value={declaredUnit}
                  onChange={(e) => setDeclaredUnit(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="g">grams (g)</option>
                  <option value="kg">kilograms (kg)</option>
                  <option value="ml">millilitres (ml)</option>
                  <option value="l">litres (l)</option>
                  <option value="N">number / count (N)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Measured Quantity (after Tare Weight deduction)
              </label>
              <input
                type="number"
                step="any"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
                placeholder="e.g. 992"
                className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Weighing Instrument Model</label>
                <select
                  value={instrumentType}
                  onChange={(e) => setInstrumentType(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="Electronic Precision Balance (Class II, Verified d=0.1g)">Electronic Balance (Class II, d=0.1g)</option>
                  <option value="Digital Platform Scale (Class III, Verified d=1g)">Platform Scale (Class III, d=1g)</option>
                  <option value="Volumetric Standard Flask (Class A Verified)">Volumetric Flask (Class A)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Verification Certificate No.</label>
                <input
                  type="text"
                  value={instrumentCert}
                  onChange={(e) => setInstrumentCert(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            {/* Real-time Statutory Calculation Preview Box */}
            <div className={`p-4 rounded-xl border ${isDeficitExceeded ? 'bg-red-50 border-red-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-bold uppercase tracking-wider text-gray-700">Live Statutory Schedule Tolerance</span>
                <span className={`font-black px-2.5 py-0.5 rounded-full ${isDeficitExceeded ? 'bg-red-200 text-red-900' : 'bg-emerald-200 text-emerald-900'}`}>
                  {isDeficitExceeded ? 'NON-COMPLIANT' : 'COMPLIANT'}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 text-center text-xs mt-2">
                <div className="bg-white/80 p-2 rounded-lg">
                  <span className="text-gray-500 block">Deviation</span>
                  <span className={`font-black text-sm ${diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {diff > 0 ? `+${diff}` : diff} {declaredUnit}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <span className="text-gray-500 block">Maximum Permissible Error</span>
                  <span className="font-bold text-gray-800 text-sm">±{mpeLimit.toFixed(1)} g</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <span className="text-gray-500 block">Statutory Status</span>
                  <span className={`font-bold text-xs ${isDeficitExceeded ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isDeficitExceeded ? 'Deficiency Exceeds MPE' : 'Within Tolerance'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>Recording Measurement in Database...</span>
                </>
              ) : (
                <>
                  <Scale className="h-4 w-4" />
                  <span>Save Official Quantity Verification Record</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Right Column: Measurement Log */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-base text-gray-900 flex items-center space-x-2">
                <span>Verified Measurement Records</span>
              </h3>
              <button
                onClick={loadRecentMeasurements}
                className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                title="Refresh"
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {measurements.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-gray-50 rounded-xl">
                No physical quantity verification records logged yet.
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                {measurements.map((m, idx) => {
                  const isPass = (m as any).result === 'PASS' || (m as any).is_compliant
                  return (
                    <div
                      key={m.measurement_id || idx}
                      className={`p-3.5 rounded-xl border transition-all ${
                        isPass ? 'bg-emerald-50/40 border-emerald-200' : 'bg-red-50/40 border-red-200'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-gray-900">{m.product_name}</span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                          isPass ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {isPass ? 'PASS' : 'FAIL'}
                        </span>
                      </div>
                      <div className="text-[11px] text-gray-600 flex items-center justify-between">
                        <span>Declared: <strong>{m.declared_quantity}{m.declared_unit}</strong></span>
                        <span>Measured: <strong>{(m as any).measured_quantity || (m as any).actual_quantity}{m.declared_unit}</strong></span>
                        <span>MPE: <strong>±{(m as any).mpe_limit || (m as any).permissible_error_limit}g</strong></span>
                      </div>
                      <p className="text-[10px] text-gray-400 mt-1 font-mono">
                        {m.measurement_id} • {new Date((m as any).created_at || Date.now()).toLocaleDateString()}
                      </p>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuantityVerification
