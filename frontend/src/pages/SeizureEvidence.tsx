import React, { useState, useEffect } from 'react'
import { ShieldAlert, Archive, FileText, CheckCircle, AlertTriangle, Plus, RefreshCw, MapPin } from 'lucide-react'
import { createSeizureMemo, fetchSeizures, updateSeizureStatus, SeizureRecord } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const SeizureEvidence: React.FC = () => {
  const { user } = useAuth()
  const [seizures, setSeizures] = useState<SeizureRecord[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    entity_name: 'Sunrise Foods & FMCG Ltd',
    entity_reg_no: 'GOI/GJ/2025/3810',
    product_name: 'Spicy Potato Sev Bhujia (400g Non-Compliant Batch)',
    quantity_seized_units: 150,
    unit_of_measure: 'pouches',
    estimated_stock_value: 13500,
    reason_for_seizure: 'Substantial Net Quantity Deficiency exceeding MPE (Rule 12)',
    statutory_act_section: 'Section 15 of Legal Metrology Act, 2009',
    custody_location: 'District Legal Metrology Vault / Safe Custody',
    custodian_officer: user?.name || 'Field Inspector Sharma',
    witness_details: 'Sub-Inspector Patel, Local Police Station'
  })

  const loadSeizures = async () => {
    setLoading(true)
    try {
      const res = await fetchSeizures()
      if (res.success && res.data) {
        setSeizures(res.data)
      }
    } catch (e) {
      console.error('Error fetching seizures:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSeizures()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const activeSessionRaw = sessionStorage.getItem('sih26034_active_session')
      const activeSession = activeSessionRaw ? JSON.parse(activeSessionRaw) : null

      const res = await createSeizureMemo({
        session_id: activeSession?.session_id || 'IN-MEMO-MANUAL',
        ...formData
      })

      if (res.success && res.data) {
        setShowForm(false)
        loadSeizures()
      }
    } catch (err) {
      console.error('Error recording seizure:', err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleStatusUpdate = async (seizureId: string, status: string) => {
    try {
      await updateSeizureStatus(seizureId, status, 'Status updated via Legal Metrology enforcement portal')
      loadSeizures()
    } catch (err) {
      console.error('Error updating status:', err)
    }
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-red-950 via-slate-900 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-red-800/60 text-red-200 text-xs font-bold rounded-full uppercase tracking-wider border border-red-500/30">
              Module 5: Enforcement & Physical Seizures
            </span>
            <span className="px-3 py-1 bg-amber-500/20 text-amber-300 text-xs font-semibold rounded-full border border-amber-500/30">
              Section 15 Legal Metrology Act, 2009
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">Seizure Memos & Evidence Custody</h1>
          <p className="text-sm text-red-200 mt-1 max-w-2xl">
            Execute statutory seizures of non-compliant packaged stock, document chain of custody, and manage vault storage records for court prosecution or compounding.
          </p>
        </div>

        <button
          onClick={() => setShowForm(!showForm)}
          className="px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <Plus className="h-5 w-5" />
          <span>{showForm ? 'Hide Form' : 'Issue Seizure Memo'}</span>
        </button>
      </div>

      {/* Seizure Form Modal/Card */}
      {showForm && (
        <div className="bg-white rounded-2xl p-6 border-2 border-red-300 shadow-xl space-y-4 animate-in slide-in-from-top-4 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-gray-100">
            <h2 className="text-lg font-black text-gray-900 flex items-center space-x-2">
              <ShieldAlert className="h-6 w-6 text-red-600" />
              <span>Section 15 Statutory Seizure Memo Form</span>
            </h2>
            <span className="text-xs px-2.5 py-1 bg-red-100 text-red-800 font-bold rounded-md">
              Legal Enforcement
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Establishment / Firm Name</label>
                <input
                  type="text"
                  value={formData.entity_name}
                  onChange={(e) => setFormData({ ...formData, entity_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Registration No. (if available)</label>
                <input
                  type="text"
                  value={formData.entity_reg_no}
                  onChange={(e) => setFormData({ ...formData, entity_reg_no: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Commodity / Package Description</label>
                <input
                  type="text"
                  value={formData.product_name}
                  onChange={(e) => setFormData({ ...formData, product_name: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-semibold text-gray-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Quantity Seized (Units)</label>
                <input
                  type="number"
                  value={formData.quantity_seized_units}
                  onChange={(e) => setFormData({ ...formData, quantity_seized_units: parseInt(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Statutory Grounds for Seizure</label>
                <select
                  value={formData.reason_for_seizure}
                  onChange={(e) => setFormData({ ...formData, reason_for_seizure: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900"
                >
                  <option value="Substantial Net Quantity Deficiency exceeding MPE (Rule 12)">Substantial Net Quantity Deficiency exceeding MPE (Rule 12)</option>
                  <option value="Missing Mandatory Declarations (Rule 6)">Missing Mandatory Declarations (Rule 6)</option>
                  <option value="Defaced / Altered / Over-printed MRP (Rule 6(1)(e))">Defaced / Altered / Over-printed MRP (Rule 6(1)(e))</option>
                  <option value="Unregistered Manufacturer / Packer (Rule 27)">Unregistered Manufacturer / Packer (Rule 27)</option>
                  <option value="Misleading Non-Standard Packaging (Rule 5)">Misleading Non-Standard Packaging (Rule 5)</option>
                  <option value="Counterfeit / Smuggled without Country of Origin (Rule 6(1)(g))">Counterfeit / Smuggled without Country of Origin (Rule 6(1)(g))</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Estimated Value of Seized Stock (₹)</label>
                <input
                  type="number"
                  value={formData.estimated_stock_value}
                  onChange={(e) => setFormData({ ...formData, estimated_stock_value: parseFloat(e.target.value) || 0 })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm font-bold text-gray-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Vault / Custody Location</label>
                <input
                  type="text"
                  value={formData.custody_location}
                  onChange={(e) => setFormData({ ...formData, custody_location: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Independent Witnesses / Panchas</label>
                <input
                  type="text"
                  value={formData.witness_details}
                  onChange={(e) => setFormData({ ...formData, witness_details: e.target.value })}
                  className="w-full px-3.5 py-2 bg-gray-50 border border-gray-300 rounded-xl text-sm text-gray-900"
                />
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-xl text-sm font-semibold text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>{submitting ? 'Executing Seizure...' : 'Confirm & Generate Seizure Memo'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Seizure Records Table */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900">Seized Physical Stock Records</h3>
            <p className="text-xs text-gray-500">Official evidence and seized property tracking under Legal Metrology Act</p>
          </div>
          <button onClick={loadSeizures} className="text-gray-400 hover:text-blue-600">
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-600 uppercase tracking-wider text-[11px] font-bold border-b border-gray-200">
              <tr>
                <th className="px-5 py-3.5">Seizure ID</th>
                <th className="px-5 py-3.5">Premise / Manufacturer</th>
                <th className="px-5 py-3.5">Seized Commodity</th>
                <th className="px-5 py-3.5">Quantity / Valuation</th>
                <th className="px-5 py-3.5">Statutory Grounds</th>
                <th className="px-5 py-3.5">Custody Status</th>
                <th className="px-5 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {seizures.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-5 py-8 text-center text-gray-500">
                    No physical seizure memos issued in this period.
                  </td>
                </tr>
              ) : (
                seizures.map((s) => (
                  <tr key={s.seizure_id} className="hover:bg-gray-50/80 transition-colors">
                    <td className="px-5 py-4 font-mono font-bold text-red-700">{s.seizure_id}</td>
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {s.entity_name}
                      {s.entity_reg_no && <span className="block text-[10px] text-gray-500 font-normal">{s.entity_reg_no}</span>}
                    </td>
                    <td className="px-5 py-4 font-medium text-gray-800">{s.product_name}</td>
                    <td className="px-5 py-4 font-bold text-gray-900">
                      {s.quantity_seized_units} {s.unit_of_measure}
                      <span className="block text-[10px] text-gray-500 font-normal">Est: ₹{s.estimated_stock_value.toLocaleString('en-IN')}</span>
                    </td>
                    <td className="px-5 py-4 text-gray-600 max-w-[200px] truncate">{s.reason_for_seizure}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2.5 py-1 rounded-full font-bold text-[10px] ${
                        s.status === 'SEIZED_IN_CUSTODY' ? 'bg-red-100 text-red-800' :
                        s.status === 'COMPOUNDED_DISPOSED' ? 'bg-emerald-100 text-emerald-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {s.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      {s.status === 'SEIZED_IN_CUSTODY' && (
                        <button
                          onClick={() => handleStatusUpdate(s.seizure_id, 'COMPOUNDED_DISPOSED')}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] shadow-sm"
                        >
                          Mark Disposed
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default SeizureEvidence
