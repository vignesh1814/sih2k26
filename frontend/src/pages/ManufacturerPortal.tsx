import React, { useState, useEffect } from 'react'
import { 
  fetchManufacturerDashboard, 
  fetchChallans,
  updateChallanStatus, 
  ManufacturerDashboardData, 
  Challan 
} from '../services/api'
import { 
  Building2, 
  FileWarning, 
  FileCheck2, 
  CheckCircle, 
  AlertTriangle, 
  Gavel, 
  ShieldCheck, 
  RefreshCw,
  X,
  CreditCard,
  Lock,
  Filter
} from 'lucide-react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'

const PAYMENT_METHODS = [
  { id: 'netbanking', name: 'Treasury Net Banking (SBI / HDFC / ICICI / PNB)', icon: '🏛️' },
  { id: 'upi', name: 'UPI Fast Settlement (Bharat e-Pay Treasury)', icon: '⚡' },
  { id: 'rtgs', name: 'RTGS / NEFT e-Challan Transfer', icon: '🏦' },
  { id: 'dd', name: 'Treasury Demand Draft (Legal Metrology Account)', icon: '📜' }
]

const ManufacturerPortal: React.FC = () => {
  const { user } = useAuth()
  const [data, setData] = useState<ManufacturerDashboardData | null>(null)
  const [allChallans, setAllChallans] = useState<Challan[]>([])
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('ALL')
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeTab, setActiveTab] = useState<'challans' | 'audits'>('challans')
  
  // Payment Modal State
  const [payingChallan, setPayingChallan] = useState<Challan | null>(null)
  const [selectedPaymentMode, setSelectedPaymentMode] = useState<string>(PAYMENT_METHODS[0].name)
  const [isProcessingPayment, setIsProcessingPayment] = useState(false)
  const [paymentSuccessReceipt, setPaymentSuccessReceipt] = useState<any | null>(null)

  // Rectification Modal State
  const [selectedChallan, setSelectedChallan] = useState<Challan | null>(null)
  const [responseText, setResponseText] = useState('')
  const [proofUrl, setProofUrl] = useState('')

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true)
    else setIsRefreshing(true)
    try {
      const [dashRes, challansRes] = await Promise.all([
        fetchManufacturerDashboard(selectedBrandFilter === 'ALL' ? '' : selectedBrandFilter),
        fetchChallans(selectedBrandFilter === 'ALL' ? undefined : selectedBrandFilter)
      ])

      const combinedList: Challan[] = (challansRes && challansRes.challans && challansRes.challans.length > 0)
        ? challansRes.challans
        : (dashRes?.challans || [])

      setAllChallans(combinedList)

      const pending = combinedList.filter(c => c.status === 'ISSUED' || c.status === 'ACKNOWLEDGED' || c.status === 'RECTIFIED')
      const totalPenalties = pending.reduce((acc, c) => acc + (c.penalty_amount || 0), 0)

      setData({
        brand_name: selectedBrandFilter === 'ALL' ? 'All Registered Establishments' : selectedBrandFilter,
        compliance_grade: dashRes?.compliance_grade || 'Grade B (Monitored)',
        total_inspections_conducted: dashRes?.total_inspections_conducted || combinedList.length + 10,
        compliance_rate: dashRes?.compliance_rate || '82%',
        active_challans_count: pending.length,
        total_penalties_assessed: totalPenalties,
        challans: combinedList,
        inspections: dashRes?.inspections || []
      })
    } catch (err) {
      console.error('Failed to load manufacturer dashboard:', err)
      toast.error('Could not load brand data')
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // Periodic auto-sync every 10 seconds so newly issued challans update automatically
    const interval = setInterval(() => loadData(true), 10000)
    return () => clearInterval(interval)
  }, [selectedBrandFilter])

  // Extract unique brands for filtering
  const availableBrands = Array.from(
    new Set([
      'ALL',
      'Sunrise Foods & FMCG Ltd',
      'Himalayan Dry Fruits Pvt Ltd',
      'Shree Balaji Confectioneries',
      'Ananda Dairy & Agro Foods',
      ...allChallans.map(c => c.manufacturer_name).filter(Boolean)
    ])
  )

  const handleUpdateStatus = async (challanId: string, status: string) => {
    try {
      await updateChallanStatus(challanId, status, responseText, proofUrl, undefined, user?.name || 'Manufacturer Compliance Desk')
      toast.success(`Challan status updated to: ${status}`)
      setSelectedChallan(null)
      setResponseText('')
      setProofUrl('')
      loadData(true)
    } catch (err) {
      toast.error('Failed to update challan status')
    }
  }

  const handleExecutePayment = async () => {
    if (!payingChallan) return
    setIsProcessingPayment(true)
    try {
      const res = await updateChallanStatus(
        payingChallan.challan_id, 
        'PAID', 
        `Settled via ${selectedPaymentMode}`, 
        undefined, 
        selectedPaymentMode, 
        user?.name || 'Authorized Manufacturer Representative'
      )
      
      setPaymentSuccessReceipt({
        challan_id: payingChallan.challan_id,
        product_name: payingChallan.product_name,
        amount: payingChallan.penalty_amount,
        payment_mode: selectedPaymentMode,
        transaction_id: res.transaction_id || `TXN-LM-${Math.floor(100000 + Math.random() * 900000)}`,
        timestamp: new Date().toISOString()
      })
      
      toast.success(`Penalty ₹${payingChallan.penalty_amount.toLocaleString('en-IN')} paid successfully! Case settled.`)
      loadData(true)
    } catch (err) {
      toast.error('Payment processing failed. Please retry.')
    } finally {
      setIsProcessingPayment(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-emerald-600"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Brand Top Header */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-emerald-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-emerald-600 rounded-lg text-xs font-black uppercase tracking-wider">Manufacturer Console</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">{data?.brand_name || 'Manufacturer & Packer Portal'}</h1>
          </div>
          <p className="text-xs sm:text-sm text-emerald-200">
            Corporate Compliance Desk • Statutory Notice Management • Product Inspection Audit Records • Fine Settlement
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Brand Quick Selector */}
          <div className="flex items-center space-x-1.5 bg-black/40 px-3 py-1.5 rounded-xl border border-white/10 text-xs">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <select
              value={selectedBrandFilter}
              onChange={(e) => setSelectedBrandFilter(e.target.value)}
              className="bg-transparent text-white font-bold outline-none cursor-pointer text-xs"
            >
              {availableBrands.map(b => (
                <option key={b} value={b} className="bg-slate-900 text-white">
                  {b === 'ALL' ? '🏢 All Brands & Establishments' : b}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => {
              loadData(true)
              toast.success('Challan records synchronized with Legal Metrology Server')
            }}
            disabled={isRefreshing}
            className="flex items-center space-x-1.5 px-3 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded-xl border border-white/20 transition-all"
            title="Refresh latest notices"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-yellow-300' : ''}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Challans'}</span>
          </button>

          <Link
            to="/scan"
            className="flex items-center space-x-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
          >
            <ShieldCheck className="h-4 w-4" />
            <span>Pre-Market Label Check</span>
          </Link>
        </div>
      </div>

      {/* Brand Stat Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Active Legal Notices</p>
              <p className="text-2xl font-black text-rose-600 mt-1">{data?.active_challans_count || 0}</p>
              <p className="text-xs text-rose-700 font-semibold mt-1">Requires response or settlement</p>
            </div>
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <FileWarning className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Penalties Assessed</p>
              <p className="text-2xl font-black text-gray-900 mt-1">₹ {(data?.total_penalties_assessed || 0).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Compounding statutory dues</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Gavel className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Total Market Audits</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{data?.total_inspections_conducted || 0}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Surveillance samples audited</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Building2 className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compliance Rating</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{data?.compliance_rate || '85%'}</p>
              <p className="text-xs text-amber-700 font-semibold mt-1">{data?.compliance_grade}</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('challans')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'challans'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileWarning className="h-4 w-4" />
          <span>Received Challans &amp; Payment Settlement ({allChallans.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('audits')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'audits'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileCheck2 className="h-4 w-4" />
          <span>Product Inspection Certificates</span>
        </button>
      </div>

      {/* TAB 1: RECEIVED CHALLANS & PAYMENT */}
      {activeTab === 'challans' && (
        <div className="space-y-4">
          {allChallans.map((ch: Challan) => (
            <div key={ch.challan_id} className={`bg-white rounded-2xl border shadow-sm p-5 sm:p-6 transition-all ${
              ch.status === 'PAID' ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 hover:border-emerald-300'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-gray-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center space-x-2.5 mb-1">
                    <span className="font-mono text-sm font-extrabold text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-200">
                      {ch.challan_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                      ch.status === 'PAID'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : ch.status === 'ISSUED'
                        ? 'bg-rose-100 text-rose-800 border border-rose-200'
                        : ch.status === 'ACKNOWLEDGED'
                        ? 'bg-blue-100 text-blue-800 border border-blue-200'
                        : 'bg-purple-100 text-purple-800 border border-purple-200'
                    }`}>
                      {ch.status === 'PAID' ? '✅ SETTLED & PAID' : `STATUS: ${ch.status}`}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{ch.product_name}</h3>
                  <p className="text-xs text-emerald-800 font-semibold mt-0.5">
                    Manufacturer / Entity: {ch.manufacturer_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    Issued by: {ch.issued_by} ({ch.issued_by_role || 'DLMO'}) • {ch.inspector_name}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xs text-gray-400 font-bold uppercase">Compounding Penalty</p>
                  <p className={`text-xl font-black font-mono ${ch.status === 'PAID' ? 'text-emerald-700' : 'text-rose-600'}`}>
                    ₹ {ch.penalty_amount.toLocaleString('en-IN')}
                  </p>
                  <p className="text-[11px] text-gray-500">
                    {ch.status === 'PAID' 
                      ? `Paid via ${ch.payment_mode || 'Treasury Transfer'}` 
                      : `Due: ${new Date(ch.due_date).toLocaleDateString('en-IN')}`}
                  </p>
                </div>
              </div>

              {/* Violations & Act Sections */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4 text-xs">
                <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                  <p className="font-bold text-rose-900 mb-1.5 flex items-center space-x-1.5">
                    <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                    <span>Statutory Rule Violations Cited:</span>
                  </p>
                  <ul className="space-y-1 text-rose-800">
                    {(ch.violation_codes || []).map((v: string, i: number) => (
                      <li key={i}>• {v}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200">
                  <p className="font-bold text-slate-800 mb-1.5 flex items-center space-x-1.5">
                    <Gavel className="h-3.5 w-3.5 text-slate-600" />
                    <span>Legal Provisions Cited:</span>
                  </p>
                  <ul className="space-y-1 text-slate-700">
                    {(ch.act_sections || []).map((s: string, i: number) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {ch.manufacturer_response && (
                <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs text-blue-900">
                  <span className="font-bold">Your Submitted Reply: </span>
                  <span>{ch.manufacturer_response}</span>
                </div>
              )}

              {/* Payment Details if Paid */}
              {ch.status === 'PAID' && (
                <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900 flex items-center justify-between">
                  <div>
                    <span className="font-bold">Settlement Reference: </span>
                    <span className="font-mono font-bold">{ch.transaction_id || 'TXN-LM-892110'}</span>
                    <span className="text-gray-500 ml-2">({ch.payment_mode || 'Treasury Net Banking'})</span>
                  </div>
                  <span className="text-[10px] bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded font-bold">CASE CLOSED</span>
                </div>
              )}

              {/* Action Buttons & Payment Trigger */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-2 border-t border-gray-100">
                {ch.status === 'ISSUED' && (
                  <button
                    onClick={() => handleUpdateStatus(ch.challan_id, 'ACKNOWLEDGED')}
                    className="px-3.5 py-1.5 text-xs font-bold bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-lg transition-all"
                  >
                    Acknowledge Notice Receipt
                  </button>
                )}

                {ch.status !== 'PAID' && (
                  <>
                    <button
                      onClick={() => setSelectedChallan(ch)}
                      className="px-3.5 py-1.5 text-xs font-bold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition-all"
                    >
                      Submit Rectification Proof
                    </button>

                    <button
                      onClick={() => {
                        setPayingChallan(ch)
                        setSelectedPaymentMode(PAYMENT_METHODS[0].name)
                        setPaymentSuccessReceipt(null)
                      }}
                      className="flex items-center space-x-1.5 px-4 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-all shadow-sm"
                    >
                      <CreditCard className="h-4 w-4" />
                      <span>Pay &amp; Settle Fine (₹{ch.penalty_amount.toLocaleString('en-IN')})</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}

          {allChallans.length === 0 && (
            <div className="bg-white p-12 text-center rounded-2xl border border-gray-200">
              <ShieldCheck className="h-12 w-12 text-emerald-500 mx-auto mb-2" />
              <p className="font-bold text-gray-800">No active challans pending</p>
              <p className="text-xs text-gray-500 mt-1">All packaging declarations comply with LMPC standards or have been settled.</p>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: DETAILED PRODUCT INSPECTION CERTIFICATES */}
      {activeTab === 'audits' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <div>
              <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Official Inspection Reports for {data?.brand_name}</h3>
              <p className="text-xs text-gray-500">Evidence-grade certificates recorded by Legal Metrology inspection squads</p>
            </div>
            <Link to="/reports" className="text-xs font-bold text-emerald-600 hover:underline">
              View Global Reports Archive →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">Spicy Potato Sev Bhujia (400g)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded border border-rose-200">FAIL (2 VIOLATIONS)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200">
                <div><span className="text-gray-400">Scan ID:</span> SCAN-IN-2026-0892</div>
                <div><span className="text-gray-400">Declared MRP:</span> ₹90.00</div>
                <div><span className="text-gray-400">Net Quantity:</span> 400 gms (Non-standard)</div>
                <div><span className="text-gray-400">Tax Clause:</span> Missing 'incl. of all taxes'</div>
              </div>
              <p className="text-rose-700 font-semibold">• Rule 6(1)(c): Non-standard unit 'gms' instead of standard SI symbol 'g'</p>
              <p className="text-rose-700 font-semibold">• Rule 6(1)(e): MRP declaration lacks statutory tax inclusion phrase</p>
              <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                <span className="text-[10px] text-gray-400 font-mono">SHA-256: 9f2b84c7a1e0...</span>
                <Link to="/reports" className="text-blue-600 hover:underline font-bold text-[11px]">View Full Certificate →</Link>
              </div>
            </div>

            <div className="p-4 rounded-xl border border-gray-200 bg-gray-50/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-gray-900">Pure Desi Cow Ghee (1L)</span>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-100 text-rose-800 rounded border border-rose-200">FAIL (2 VIOLATIONS)</span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-gray-600 bg-white p-2.5 rounded-lg border border-gray-200">
                <div><span className="text-gray-400">Scan ID:</span> SCAN-IN-2026-0893</div>
                <div><span className="text-gray-400">Declared MRP:</span> ₹650.00</div>
                <div><span className="text-gray-400">Net Quantity:</span> 1 ltr (Prohibited symbol)</div>
                <div><span className="text-gray-400">Consumer Care:</span> Missing toll-free number</div>
              </div>
              <p className="text-rose-700 font-semibold">• Rule 6(1)(c): Colloquial unit 'ltr' used instead of SI symbol 'l'</p>
              <p className="text-rose-700 font-semibold">• Rule 6(2): Consumer grievance telephone number missing on packaging</p>
              <div className="pt-2 flex items-center justify-between border-t border-gray-200">
                <span className="text-[10px] text-gray-400 font-mono">SHA-256: 2e4b6c8d0f1a...</span>
                <Link to="/reports" className="text-blue-600 hover:underline font-bold text-[11px]">View Full Certificate →</Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PAY & SETTLE PENALTY */}
      {payingChallan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200 text-xs">
            {!paymentSuccessReceipt ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <div className="flex items-center space-x-2">
                    <div className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900">Legal Metrology Penalty Settlement</h3>
                      <p className="text-[11px] text-gray-500">Section 36(1) Compounding e-Treasury Portal</p>
                    </div>
                  </div>
                  <button onClick={() => setPayingChallan(null)} className="text-gray-400 hover:text-gray-600">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Challan Ref:</span>
                    <span className="font-mono font-bold text-emerald-900">{payingChallan.challan_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Product:</span>
                    <span className="font-bold text-gray-900">{payingChallan.product_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-semibold">Manufacturer:</span>
                    <span className="font-bold text-gray-700">{payingChallan.manufacturer_name}</span>
                  </div>
                  <div className="flex justify-between items-center pt-1 border-t border-emerald-200">
                    <span className="text-gray-800 font-bold">Total Compounding Fine:</span>
                    <span className="font-black text-base text-emerald-800 font-mono">₹ {payingChallan.penalty_amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                {/* PAYMENT METHOD DROPDOWN */}
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                    Select Official Payment Channel
                  </label>
                  <select
                    value={selectedPaymentMode}
                    onChange={(e) => setSelectedPaymentMode(e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-xl font-semibold text-gray-900 bg-white focus:ring-2 focus:ring-emerald-500 text-xs shadow-sm"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.icon} {m.name}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-gray-500 mt-1">
                    Payment directly credits the Consolidated Fund of India under Legal Metrology Account Head 1475.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 space-y-1">
                  <p className="font-bold flex items-center space-x-1 text-slate-900">
                    <Lock className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Automated Settlement Note:</span>
                  </p>
                  <p className="text-[11px]">
                    Once payment is confirmed, this violation will be marked <strong className="text-emerald-700">SETTLED</strong> and automatically removed from active inspection reports across Inspector and DLMO queues.
                  </p>
                </div>

                <div className="pt-2 flex items-center justify-end space-x-2 border-t border-gray-100">
                  <button
                    onClick={() => setPayingChallan(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isProcessingPayment}
                    onClick={handleExecutePayment}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all flex items-center space-x-1.5"
                  >
                    <span>{isProcessingPayment ? 'Connecting Treasury...' : `Confirm & Pay ₹${payingChallan.penalty_amount.toLocaleString('en-IN')}`}</span>
                  </button>
                </div>
              </div>
            ) : (
              /* SUCCESS RECEIPT */
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <CheckCircle className="h-7 w-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-gray-900">Statutory Compounding Settled!</h3>
                  <p className="text-xs text-gray-500">e-Challan payment receipt generated successfully.</p>
                </div>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-left space-y-1.5 font-mono text-[11px]">
                  <div className="flex justify-between"><span className="text-gray-500">Transaction ID:</span> <span className="font-bold text-gray-900">{paymentSuccessReceipt.transaction_id}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Challan Ref:</span> <span className="font-bold text-gray-900">{paymentSuccessReceipt.challan_id}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Commodity:</span> <span className="text-gray-900">{paymentSuccessReceipt.product_name}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Settled Amount:</span> <span className="font-bold text-emerald-700">₹ {paymentSuccessReceipt.amount.toLocaleString('en-IN')}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Channel:</span> <span className="text-gray-700">{paymentSuccessReceipt.payment_mode}</span></div>
                  <div className="flex justify-between border-t pt-1"><span className="text-gray-500">Status:</span> <span className="text-emerald-700 font-bold">SETTLED &amp; CLOSED</span></div>
                </div>

                <button
                  onClick={() => {
                    setPayingChallan(null)
                    setPaymentSuccessReceipt(null)
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all"
                >
                  Done
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: SUBMIT RECTIFICATION PROOF */}
      {selectedChallan && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-gray-900">Submit Packaging Rectification Proof</h3>
              </div>
              <button onClick={() => setSelectedChallan(null)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="p-3 bg-gray-50 rounded-xl border border-gray-200">
                <p className="font-bold text-gray-900">{selectedChallan.product_name} ({selectedChallan.challan_id})</p>
                <p className="text-gray-500 mt-0.5">Assessed fine: ₹{selectedChallan.penalty_amount.toLocaleString('en-IN')}</p>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Rectification Description &amp; Packaging Artwork Changes
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Artwork revised from '400 gms' to '400 g'. Suffix 'incl. of all taxes' added next to MRP."
                  value={responseText}
                  onChange={e => setResponseText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                  Proof / Artwork File Reference URL
                </label>
                <input
                  type="text"
                  placeholder="https://packaging-cloud.com/proofs/artwork_rev2.pdf"
                  value={proofUrl}
                  onChange={e => setProofUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setSelectedChallan(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleUpdateStatus(selectedChallan.challan_id, 'RECTIFIED')}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg shadow-md transition-all"
                >
                  Submit Proof to Controller
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ManufacturerPortal
