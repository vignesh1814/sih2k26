import React, { useState, useEffect } from 'react'
import { Search, Building2, ShieldCheck, AlertTriangle, QrCode, CheckCircle, MapPin, Tag, Calendar, ChevronRight } from 'lucide-react'
import { fetchEntities, Entity, InspectionSession } from '../services/api'
import StartInspectionModal from '../components/StartInspectionModal'
import { useNavigate } from 'react-router-dom'

const EntityIdentification: React.FC = () => {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [selectedType, setSelectedType] = useState('')
  const [entities, setEntities] = useState<Entity[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const loadEntities = async () => {
    setLoading(true)
    try {
      const res = await fetchEntities(query, undefined, selectedType || undefined)
      if (res.success && res.data) {
        setEntities(res.data)
      }
    } catch (err) {
      console.error('Error searching registered entities:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEntities()
  }, [query, selectedType])

  const handleStartInspection = (entity: Entity) => {
    setSelectedEntity(entity)
    setIsModalOpen(true)
  }

  const handleSessionStarted = (session: InspectionSession) => {
    // Save active session in sessionStorage
    sessionStorage.setItem('sih26034_active_session', JSON.stringify(session))
    navigate('/scan')
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-700/60 text-blue-200 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-500/30">
              Module 1: Premise Identification
            </span>
            <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-semibold rounded-full border border-emerald-500/30">
              National Repository Cache
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">Registered Entity Repository</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-2xl">
            Search and verify registered Manufacturers, Packers, and Importers under Rule 27 of the Legal Metrology (Packaged Commodities) Rules before initiating field inspection.
          </p>
        </div>

        <button
          onClick={() => { setSelectedEntity(null); setIsModalOpen(true); }}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center space-x-2 shrink-0 self-start md:self-auto"
        >
          <CheckCircle className="h-5 w-5" />
          <span>Ad-hoc Quick Inspection</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3.5 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by Registration No (e.g. GOI/TS/2026/2779), Firm Name, or Commodity..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition-all"
          />
        </div>

        <select
          value={selectedType}
          onChange={(e) => setSelectedType(e.target.value)}
          className="px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600"
        >
          <option value="">All Entity Categories</option>
          <option value="Manufacturer">Manufacturer</option>
          <option value="Packer">Packer</option>
          <option value="Importer">Importer</option>
          <option value="Manufacturer & Packer">Manufacturer & Packer</option>
        </select>
      </div>

      {/* Entity Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-full py-12 text-center text-gray-500 font-medium">
            Loading registered establishment data...
          </div>
        ) : entities.length === 0 ? (
          <div className="col-span-full bg-white p-8 rounded-2xl border border-gray-200 text-center space-y-3">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto" />
            <p className="text-gray-700 font-semibold">No registered establishment found matching &quot;{query}&quot;</p>
            <p className="text-xs text-gray-500">You can still proceed with an ad-hoc unlisted premise inspection memo.</p>
          </div>
        ) : (
          entities.map((entity) => (
            <div
              key={entity.entity_id}
              className="bg-white rounded-2xl p-5 border border-gray-200 hover:border-blue-300 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                {/* Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="px-2.5 py-1 bg-blue-100 text-blue-800 text-xs font-bold rounded-lg border border-blue-200">
                    {entity.registration_no}
                  </span>
                  <div className="flex items-center space-x-1.5">
                    {entity.repeat_offender && (
                      <span className="px-2 py-0.5 bg-red-100 text-red-800 text-xs font-bold rounded-full flex items-center space-x-1">
                        <AlertTriangle className="h-3 w-3" />
                        <span>Repeat Violations</span>
                      </span>
                    )}
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs font-semibold rounded-md">
                      {entity.entity_type}
                    </span>
                  </div>
                </div>

                {/* Name & Address */}
                <h3 className="text-lg font-black text-gray-900 leading-tight">{entity.firm_name}</h3>
                <div className="flex items-start space-x-2 text-xs text-gray-600 mt-2">
                  <MapPin className="h-4 w-4 text-gray-400 shrink-0 mt-0.5" />
                  <span>{entity.establishment_address}, {entity.district}, {entity.state} - {entity.pincode}</span>
                </div>

                {/* Commodities */}
                {entity.registered_commodities && entity.registered_commodities.length > 0 && (
                  <div className="mt-3 flex items-center flex-wrap gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-gray-400" />
                    {entity.registered_commodities.map((com, idx) => (
                      <span key={idx} className="px-2 py-0.5 bg-gray-50 border border-gray-200 rounded text-[11px] font-medium text-gray-700">
                        {com}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Metrics & Action */}
              <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center space-x-4 text-xs">
                  <div>
                    <span className="text-gray-500 block">Compliance</span>
                    <span className={`font-black ${entity.compliance_rating >= 90 ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {entity.compliance_rating}%
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Inspections</span>
                    <span className="font-bold text-gray-800">{entity.total_inspections}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 block">Violations</span>
                    <span className="font-bold text-red-600">{entity.violations_count}</span>
                  </div>
                </div>

                <button
                  onClick={() => handleStartInspection(entity)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm transition-all flex items-center space-x-1.5"
                >
                  <span>Start Inspection</span>
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Start Inspection Modal */}
      <StartInspectionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSessionStarted={handleSessionStarted}
        selectedEntity={selectedEntity}
      />
    </div>
  )
}

export default EntityIdentification
