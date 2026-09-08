import React, { useState, useEffect } from 'react'
import { History, Building2, ShieldCheck, AlertOctagon, Calendar, CheckCircle2, XCircle, Search, ArrowUpRight, TrendingUp } from 'lucide-react'
import { fetchEntities, Entity } from '../services/api'

const EntityHistory: React.FC = () => {
  const [entities, setEntities] = useState<Entity[]>([])
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const res = await fetchEntities()
        if (res.success && res.data) {
          setEntities(res.data)
          if (res.data.length > 0) {
            setSelectedEntity(res.data[0])
          }
        }
      } catch (e) {
        console.error('Error fetching entity compliance histories:', e)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const filteredEntities = entities.filter(e =>
    e.firm_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.registration_no.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-700/60 text-blue-200 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-500/30">
              Module 6: Compliance History & Intelligence
            </span>
            <span className="px-3 py-1 bg-purple-500/20 text-purple-300 text-xs font-semibold rounded-full border border-purple-500/30">
              Repeat Offender Analytics
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">Entity Compliance History & Audit Timeline</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-2xl">
            Review past inspections, recurring declaration defects, compounding penalties, and compliance rating trends across registered manufacturers and packaging establishments.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Entity Selector Sidebar */}
        <div className="lg:col-span-4 bg-white rounded-2xl p-4 border border-gray-200 shadow-sm space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Filter establishments..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-gray-50 border border-gray-300 rounded-xl text-xs font-medium text-gray-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="space-y-2 max-h-[560px] overflow-y-auto pr-1">
            {filteredEntities.map((ent) => (
              <div
                key={ent.entity_id}
                onClick={() => setSelectedEntity(ent)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all ${
                  selectedEntity?.entity_id === ent.entity_id
                    ? 'bg-blue-50/80 border-blue-400 shadow-sm'
                    : 'bg-white border-gray-200 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-800 px-2 py-0.5 bg-blue-100 rounded">
                    {ent.registration_no}
                  </span>
                  <span className={`text-[11px] font-black ${ent.compliance_rating >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                    {ent.compliance_rating}% Rating
                  </span>
                </div>
                <h4 className="font-bold text-sm text-gray-900 mt-1 truncate">{ent.firm_name}</h4>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{ent.district}, {ent.state}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Detailed Compliance Profile & Timeline */}
        <div className="lg:col-span-8 space-y-5">
          {selectedEntity ? (
            <>
              {/* Profile Card */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 font-bold text-xs rounded-md">
                        {selectedEntity.registration_no}
                      </span>
                      <span className="px-2.5 py-0.5 bg-gray-100 text-gray-700 font-semibold text-xs rounded-md">
                        {selectedEntity.entity_type}
                      </span>
                      {selectedEntity.repeat_offender && (
                        <span className="px-2.5 py-0.5 bg-red-100 text-red-800 font-bold text-xs rounded-full flex items-center space-x-1">
                          <AlertOctagon className="h-3 w-3" />
                          <span>High Risk / Repeat Offender</span>
                        </span>
                      )}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 mt-1">{selectedEntity.firm_name}</h2>
                    <p className="text-xs text-gray-500">{selectedEntity.establishment_address}</p>
                  </div>

                  <div className="text-right shrink-0">
                    <span className="text-xs text-gray-500 block">Statutory Compliance Score</span>
                    <span className={`text-2xl font-black ${selectedEntity.compliance_rating >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {selectedEntity.compliance_rating}%
                    </span>
                  </div>
                </div>

                {/* Metrics row */}
                <div className="grid grid-cols-3 gap-3 text-center text-xs">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block">Total Audits</span>
                    <span className="text-base font-bold text-gray-900">{selectedEntity.total_inspections}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block">Flagged Violations</span>
                    <span className="text-base font-bold text-red-600">{selectedEntity.violations_count}</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="text-gray-500 block">License Validity</span>
                    <span className="text-base font-bold text-gray-800">{selectedEntity.valid_upto}</span>
                  </div>
                </div>
              </div>

              {/* Historical Inspection Timeline */}
              <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-gray-900 flex items-center space-x-2">
                  <History className="h-5 w-5 text-blue-600" />
                  <span>Statutory Inspection & Audit Timeline</span>
                </h3>

                <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-gray-200">
                  {/* Event 1 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900">Routine Periodic Inspection</span>
                        <span className="text-gray-500">08 Sep 2026</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold">Status: FULLY COMPLIANT</p>
                      <p className="text-xs text-gray-600">
                        Scanned 4 packaged commodity lines. Net quantity, MRP inclusion phrase, and font sizes within Legal Metrology Rule 6 & 9 limits.
                      </p>
                    </div>
                  </div>

                  {/* Event 2 */}
                  {selectedEntity.violations_count > 0 && (
                    <div className="relative">
                      <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-red-500 border-4 border-white shadow-sm flex items-center justify-center">
                        <XCircle className="h-3 w-3 text-white" />
                      </div>
                      <div className="bg-red-50/50 p-4 rounded-xl border border-red-200 space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-bold text-gray-900">Surprise Enforcement Inspection</span>
                          <span className="text-gray-500">14 Jul 2026</span>
                        </div>
                        <p className="text-xs text-red-700 font-semibold">Status: NON-COMPLIANT (Challan Issued)</p>
                        <p className="text-xs text-gray-700">
                          Detected non-standard unit &apos;gms&apos; on namkeen packages and missing &apos;inclusive of all taxes&apos; text. Compounding fine of Rs. 25,000 imposed under Section 36(1).
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Event 3 */}
                  <div className="relative">
                    <div className="absolute -left-6 top-1 h-5 w-5 rounded-full bg-emerald-500 border-4 border-white shadow-sm flex items-center justify-center">
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-900">Initial Registration Verification</span>
                        <span className="text-gray-500">10 Apr 2026</span>
                      </div>
                      <p className="text-xs text-emerald-700 font-semibold">Status: REGISTRATION APPROVED</p>
                      <p className="text-xs text-gray-600">
                        Premises and calibration testing approved under Rule 27 of LM (Packaged Commodities) Rules, 2011.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 text-center text-gray-500 border border-gray-200">
              Select an establishment to inspect its full compliance history and repeat violation timeline.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default EntityHistory
