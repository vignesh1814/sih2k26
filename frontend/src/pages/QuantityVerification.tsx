import React, { useState, useEffect } from 'react'
import { Scale, CheckCircle2, XCircle, AlertTriangle, FileText, ArrowRight, Shield, RefreshCw } from 'lucide-react'
import { recordQuantityMeasurement, fetchMeasurements, QuantityMeasurement } from '../services/api'

const QuantityVerification: React.FC = () => {
  const [productName, setProductName] = useState('Wheat Flour / Atta Pack')
  const [declaredQty, setDeclaredQty] = useState('1000')
  const [declaredUnit, setDeclaredUnit] = useState('g')
  const [actualQty, setActualQty] = useState('980')
  const [sampleNo, setSampleNo] = useState('SMPL-01')
  const [instrumentType, setInstrumentType] = useState('Electronic Precision Balance (Class II, Verified d=0.1g)')
  const [instrumentCert, setInstrumentCert] = useState('LM/VER/2026/7821')

  const [currentResult, setCurrentResult] = useState<QuantityMeasurement | null>(null)
  const [measurements, setMeasurements] = useState<QuantityMeasurement[]>([])
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

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

  // Dynamic live calculation preview
  const declaredNum = parseFloat(declaredQty) || 0
  const actualNum = parseFloat(actualQty) || 0
  const diff = actualNum - declaredNum

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
        loadRecentMeasurements()
      }
    } catch (err) {
      console.error('Failed to record measurement:', err)
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
              Module 3: Physical Quantity Verification
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30">
              Rule 12 & Second Schedule MPE
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">Physical Net Quantity & Tare Verification</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-2xl">
            Compare declared net quantity against actual physical measurement using standard calibrated weighing instruments under the statutory Maximum Permissible Error (MPE) table.
          </p>
        </div>

        <div className="p-3 bg-white/10 rounded-xl border border-white/20 backdrop-blur-sm text-xs space-y-1">
          <p className="font-bold text-white flex items-center space-x-1.5">
            <Scale className="h-4 w-4 text-cyan-300" />
            <span>Statutory Tolerance Standard</span>
          </p>
          <p className="text-blue-200">Packaged Commodities Second Schedule</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Verification Form */}
        <div className="lg:col-span-7 bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-5">
          <h2 className="text-lg font-bold text-gray-900 flex items-center space-x-2">
            <Scale className="h-5 w-5 text-blue-600" />
            <span>Record Physical Sample Measurement</span>
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
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Declared Net Quantity on Package</label>
                <input
                  type="number"
                  step="any"
                  value={declaredQty}
                  onChange={(e) => setDeclaredQty(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Unit of Measure</label>
                <select
                  value={declaredUnit}
                  onChange={(e) => setDeclaredUnit(e.target.value)}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
                >
                  <option value="g">grams (g)</option>
                  <option value="kg">kilograms (kg)</option>
                  <option value="ml">millilitres (ml)</option>
                  <option value="l">litres (l)</option>
                  <option value="N">count / number (N)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">
                Actual Measured Net Quantity (after Tare Weight deduction)
              </label>
              <input
                type="number"
                step="any"
                value={actualQty}
                onChange={(e) => setActualQty(e.target.value)}
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
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Verification Stamp / Cert No.</label>
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
                  <span className="text-gray-500 block">Difference (Δ)</span>
                  <span className={`font-black text-sm ${diff < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {diff > 0 ? `+${diff}` : diff} {declaredUnit}
                  </span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <span className="text-gray-500 block">Max Permissible Error</span>
                  <span className="font-bold text-gray-800 text-sm">±{mpeLimit.toFixed(1)} g</span>
                </div>
                <div className="bg-white/80 p-2 rounded-lg">
                  <span className="text-gray-500 block">Statutory Verdict</span>
                  <span className={`font-bold text-sm ${isDeficitExceeded ? 'text-red-700' : 'text-emerald-700'}`}>
                    {isDeficitExceeded ? 'Excess Deficiency' : 'Within Tolerance'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center justify-center space-x-2"
            >
              <CheckCircle2 className="h-5 w-5" />
              <span>{submitting ? 'Recording...' : 'Save Physical Measurement Record'}</span>
            </button>
          </form>
        </div>

        {/* Schedule Reference & Recent Logs */}
        <div className="lg:col-span-5 space-y-4">
          {/* Statutory Schedule Reference Card */}
          <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-3">
            <h3 className="font-bold text-sm flex items-center space-x-2 text-indigo-200">
              <Shield className="h-4 w-4 text-indigo-400" />
              <span>Second Schedule MPE Reference (Rule 12)</span>
            </h3>
            <div className="text-xs space-y-1.5 text-indigo-100/90 divide-y divide-indigo-800/60">
              <div className="flex justify-between py-1"><span>Up to 50 g</span><span className="font-bold">9%</span></div>
              <div className="flex justify-between py-1"><span>50 to 100 g</span><span className="font-bold">4.5 g</span></div>
              <div className="flex justify-between py-1"><span>100 to 200 g</span><span className="font-bold">4.5%</span></div>
              <div className="flex justify-between py-1"><span>200 to 300 g</span><span className="font-bold">9.0 g</span></div>
              <div className="flex justify-between py-1"><span>300 to 500 g</span><span className="font-bold">3%</span></div>
              <div className="flex justify-between py-1"><span>500 g to 1 kg</span><span className="font-bold">15.0 g</span></div>
              <div className="flex justify-between py-1"><span>1 kg to 10 kg</span><span className="font-bold">1.5%</span></div>
            </div>
          </div>

          {/* Recent Records Log */}
          <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-gray-900">Recorded Measurements Log</h3>
              <button onClick={loadRecentMeasurements} className="text-gray-400 hover:text-blue-600">
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="space-y-2.5 max-h-[280px] overflow-y-auto pr-1">
              {measurements.length === 0 ? (
                <p className="text-xs text-gray-500 py-4 text-center">No physical measurements recorded yet.</p>
              ) : (
                measurements.map((m) => (
                  <div
                    key={m.measurement_id}
                    className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                      m.result === 'PASS' ? 'bg-emerald-50/70 border-emerald-200' : 'bg-red-50/70 border-red-200'
                    }`}
                  >
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{m.sample_no}</span>
                        <span className="text-gray-600 truncate max-w-[140px]">{m.product_name}</span>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-0.5">
                        Declared: {m.declared_quantity}{m.declared_unit} • Actual: {m.actual_quantity}{m.declared_unit} (Δ: {m.difference > 0 ? `+${m.difference}` : m.difference}{m.declared_unit})
                      </p>
                    </div>

                    <div className="text-right">
                      <span className={`px-2 py-0.5 rounded font-black text-[10px] ${
                        m.result === 'PASS' ? 'bg-emerald-200 text-emerald-900' : 'bg-red-200 text-red-900'
                      }`}>
                        {m.result}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuantityVerification
