import React, { useState, useEffect } from 'react'
import { 
  fetchSuperiorAnalytics, 
  issueChallan, 
  SuperiorAnalyticsData, 
  Challan 
} from '../services/api'
import { 
  Users, 
  Building2, 
  FileWarning, 
  Scale, 
  PlusCircle, 
  CheckCircle, 
  AlertTriangle, 
  Clock, 
  Search, 
  Filter, 
  Gavel, 
  Download, 
  TrendingUp,
  MapPin,
  ShieldAlert,
  Calendar,
  X
} from 'lucide-react'
import toast from 'react-hot-toast'

const SuperiorAnalytics: React.FC = () => {
  const [data, setData] = useState<SuperiorAnalyticsData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'inspectors' | 'manufacturers' | 'challans'>('inspectors')
  const [searchTerm, setSearchTerm] = useState('')

  // Issue Challan Modal State
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalLoading, setModalLoading] = useState(false)
  const [formData, setFormData] = useState({
    manufacturer_name: 'Sunrise Foods & FMCG Ltd',
    product_name: '',
    inspector_name: 'Field Inspector Sharma',
    violation_codes: 'Rule 6(1)(c) - Non-standard unit (gms), Rule 6(1)(e) - Missing Inclusive Taxes',
    act_sections: 'Section 36(1) of Legal Metrology Act, 2009',
    penalty_amount: 25000,
    due_days: 15,
    notes: 'Compounding penalty notice under Section 48 & Rule 32.'
  })

  const loadAnalytics = async () => {
    try {
      const res = await fetchSuperiorAnalytics()
      setData(res)
    } catch (err) {
      console.error('Failed to load superior analytics:', err)
      toast.error('Could not refresh superior analytics')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAnalytics()
  }, [])

  const handleIssueChallan = async (e: React.FormEvent) => {
    e.preventDefault()
    setModalLoading(true)
    try {
      await issueChallan({
        manufacturer_name: formData.manufacturer_name,
        product_name: formData.product_name,
        inspector_name: formData.inspector_name,
        violation_codes: formData.violation_codes.split(',').map(s => s.trim()),
        act_sections: formData.act_sections.split(',').map(s => s.trim()),
        penalty_amount: Number(formData.penalty_amount) || 25000,
        due_date: new Date(Date.now() + Number(formData.due_days) * 24 * 60 * 60 * 1000).toISOString(),
        notes: formData.notes
      })
      toast.success('Statutory Legal Challan successfully issued!')
      setIsModalOpen(false)
      loadAnalytics()
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to issue legal challan')
    } finally {
      setModalLoading(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    )
  }

  const summary = data?.summary || {
    total_field_inspectors: 24,
    active_inspectors_today: 18,
    total_inspections: 442,
    national_compliance_rate: '76.4%',
    total_challans_issued: 16,
    pending_challans_count: 5,
    total_penalties_issued: 210000,
    hearings_scheduled: 5
  }

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-lg border border-indigo-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2.5 mb-1.5">
            <span className="p-1.5 bg-indigo-600 rounded-lg text-xs font-black uppercase tracking-wider">DLMO Console</span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight">District Legal Metrology Enforcement Hub</h1>
          </div>
          <p className="text-xs sm:text-sm text-indigo-200">
            District Officer Oversight • Inspector Performance Tracking • Brand Risk Matrix • Legal Compounding Notices
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2.5 bg-indigo-500 hover:bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg transition-all"
        >
          <PlusCircle className="h-4 w-4" />
          <span>Issue Statutory Challan</span>
        </button>
      </div>

      {/* High-Level Statutory Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Field Officers</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{summary.total_field_inspectors}</p>
              <p className="text-xs text-emerald-600 font-semibold mt-1">● {summary.active_inspectors_today} Active on Duty Today</p>
            </div>
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Users className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">National Compliance</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{summary.national_compliance_rate}</p>
              <p className="text-xs text-gray-500 font-medium mt-1">Across {summary.total_inspections} Audited Batches</p>
            </div>
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Scale className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Compounding Penalties</p>
              <p className="text-2xl font-black text-indigo-700 mt-1">₹ {(summary.total_penalties_issued).toLocaleString('en-IN')}</p>
              <p className="text-xs text-amber-600 font-semibold mt-1">{summary.pending_challans_count} Pending Compounding</p>
            </div>
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Gavel className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Statutory Hearings</p>
              <p className="text-2xl font-black text-gray-900 mt-1">{summary.hearings_scheduled}</p>
              <p className="text-xs text-indigo-600 font-semibold mt-1">Scheduled for this month</p>
            </div>
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <Calendar className="h-6 w-6" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-1.5 flex flex-wrap gap-1">
        <button
          onClick={() => setActiveTab('inspectors')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'inspectors'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Users className="h-4 w-4" />
          <span>1. Inspector Analytics ({data?.inspectors.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('manufacturers')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'manufacturers'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>2. Manufacturer Risk Matrix ({data?.manufacturers.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('challans')}
          className={`flex items-center space-x-2 px-4 py-2.5 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'challans'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          <FileWarning className="h-4 w-4" />
          <span>3. Legal Challans & Notices ({data?.recent_challans.length || 0})</span>
        </button>
      </div>

      {/* TAB 1: INSPECTOR ANALYTICS */}
      {activeTab === 'inspectors' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Field Officers Performance & Enforcement Roster</h2>
              <p className="text-xs text-gray-500">Live inspection volumes, violation detection rates, and initiated notices per officer</p>
            </div>
            <div className="relative w-full sm:w-64">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search inspector or wing..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Officer Name</th>
                  <th className="px-5 py-3.5">Jurisdiction Wing</th>
                  <th className="px-5 py-3.5">Scans Executed</th>
                  <th className="px-5 py-3.5">Violations Caught</th>
                  <th className="px-5 py-3.5">Compliance Rate</th>
                  <th className="px-5 py-3.5">Challans Initiated</th>
                  <th className="px-5 py-3.5">Duty Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.inspectors
                  .filter(ins => ins.name.toLowerCase().includes(searchTerm.toLowerCase()) || ins.jurisdiction.toLowerCase().includes(searchTerm.toLowerCase()))
                  .map(ins => (
                    <tr key={ins.id} className="hover:bg-indigo-50/30 transition-colors">
                      <td className="px-5 py-4 font-bold text-gray-900 flex items-center space-x-2">
                        <div className="w-7 h-7 bg-blue-100 text-blue-700 font-bold rounded-full flex items-center justify-center text-xs">
                          {ins.name.split(' ').pop()?.charAt(0)}
                        </div>
                        <span>{ins.name}</span>
                      </td>
                      <td className="px-5 py-4 text-gray-600 flex items-center space-x-1.5">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>{ins.jurisdiction}</span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-gray-900">{ins.scans_conducted}</td>
                      <td className="px-5 py-4 font-mono font-bold text-rose-600">{ins.violations_flagged}</td>
                      <td className="px-5 py-4">
                        <span className="font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          {ins.compliance_rate}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-mono font-bold text-indigo-700">{ins.challans_initiated}</td>
                      <td className="px-5 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold ${
                          ins.status === 'ACTIVE_DUTY' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {ins.status}
                        </span>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: MANUFACTURER RISK MATRIX */}
      {activeTab === 'manufacturers' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Manufacturer Compliance & Default Risk Matrix</h2>
            <p className="text-xs text-gray-500">Continuous surveillance scoring of packaged commodity producers and repeat offender tracking</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Brand / Manufacturer</th>
                  <th className="px-5 py-3.5">Total Audits</th>
                  <th className="px-5 py-3.5">Pass / Fail</th>
                  <th className="px-5 py-3.5">Compliance Rate</th>
                  <th className="px-5 py-3.5">Risk Tier</th>
                  <th className="px-5 py-3.5">Top Statutory Violations</th>
                  <th className="px-5 py-3.5">Penalties Assessed</th>
                  <th className="px-5 py-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.manufacturers.map(mfg => (
                  <tr key={mfg.name} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-4 font-bold text-gray-900">{mfg.name}</td>
                    <td className="px-5 py-4 font-mono">{mfg.total_scans}</td>
                    <td className="px-5 py-4 font-mono">
                      <span className="text-emerald-600 font-bold">{mfg.passed_scans}</span> / <span className="text-rose-600 font-bold">{mfg.failed_scans}</span>
                    </td>
                    <td className="px-5 py-4 font-bold text-gray-900">{mfg.compliance_rate}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        mfg.risk_tier === 'HIGH_RISK'
                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                          : mfg.risk_tier === 'MODERATE_RISK'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {mfg.risk_tier}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-gray-500 max-w-xs">
                      {mfg.frequent_violations.map((v, i) => (
                        <div key={i} className="text-[11px] text-rose-700 truncate">• {v}</div>
                      ))}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">
                      ₹ {mfg.total_penalty_assessed.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            manufacturer_name: mfg.name,
                            product_name: 'Packaged Stock Lot #2026',
                            penalty_amount: mfg.risk_tier === 'HIGH_RISK' ? 50000 : 25000
                          }))
                          setIsModalOpen(true)
                        }}
                        className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold rounded-lg transition-all"
                      >
                        Issue Challan
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: LEGAL CHALLANS & NOTICES */}
      {activeTab === 'challans' && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">Statutory Compounding Challans & Legal Notices</h2>
              <p className="text-xs text-gray-500">Official legal proceedings issued under Section 36 & Section 48 of Legal Metrology Act, 2009</p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-all"
            >
              + Issue Notice
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-gray-600">
              <thead className="bg-gray-50 text-gray-700 uppercase text-[11px] font-bold border-b border-gray-200">
                <tr>
                  <th className="px-5 py-3.5">Challan ID</th>
                  <th className="px-5 py-3.5">Target Manufacturer</th>
                  <th className="px-5 py-3.5">Commodity</th>
                  <th className="px-5 py-3.5">Statutory Violations</th>
                  <th className="px-5 py-3.5">Compounding Fine</th>
                  <th className="px-5 py-3.5">Hearing Date</th>
                  <th className="px-5 py-3.5">Current Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {data?.recent_challans.map(ch => (
                  <tr key={ch.challan_id} className="hover:bg-indigo-50/30 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-indigo-700">{ch.challan_id}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">{ch.manufacturer_name}</td>
                    <td className="px-5 py-4">{ch.product_name}</td>
                    <td className="px-5 py-4 text-[11px] text-gray-500 max-w-xs">
                      {ch.violation_codes.map((v, i) => (
                        <div key={i} className="truncate">• {v}</div>
                      ))}
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-gray-900">
                      ₹ {ch.penalty_amount.toLocaleString('en-IN')}
                    </td>
                    <td className="px-5 py-4 font-mono text-gray-600">
                      {ch.hearing_date ? new Date(ch.hearing_date).toLocaleDateString('en-IN') : 'Scheduled'}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                        ch.status === 'ISSUED'
                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                          : ch.status === 'ACKNOWLEDGED'
                          ? 'bg-blue-100 text-blue-800 border border-blue-200'
                          : ch.status === 'RECTIFIED'
                          ? 'bg-purple-100 text-purple-800 border border-purple-200'
                          : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      }`}>
                        {ch.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MODAL: ISSUE NEW LEGAL CHALLAN */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-gray-200">
            <div className="flex items-center justify-between pb-4 border-b border-gray-100 mb-4">
              <div className="flex items-center space-x-2">
                <Gavel className="h-5 w-5 text-indigo-600" />
                <h3 className="text-base font-bold text-gray-900">Issue Statutory Compounding Challan</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleIssueChallan} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Target Manufacturer / Packer</label>
                <input
                  type="text"
                  required
                  value={formData.manufacturer_name}
                  onChange={e => setFormData({ ...formData, manufacturer_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Packaged Commodity Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Premium Roasted Cashews 500g"
                  value={formData.product_name}
                  onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Compounding Penalty (₹)</label>
                  <input
                    type="number"
                    required
                    value={formData.penalty_amount}
                    onChange={e => setFormData({ ...formData, penalty_amount: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Response Window (Days)</label>
                  <input
                    type="number"
                    required
                    value={formData.due_days}
                    onChange={e => setFormData({ ...formData, due_days: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Statutory Violation Codes Cited</label>
                <input
                  type="text"
                  required
                  value={formData.violation_codes}
                  onChange={e => setFormData({ ...formData, violation_codes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Legal Metrology Act Section(s)</label>
                <input
                  type="text"
                  required
                  value={formData.act_sections}
                  onChange={e => setFormData({ ...formData, act_sections: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div>
                <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">Controller Remarks / Directives</label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={e => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg shadow-md transition-all"
                >
                  {modalLoading ? 'Issuing...' : 'Issue Notice'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default SuperiorAnalytics
