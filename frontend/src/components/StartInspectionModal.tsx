import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Calendar, Clock, Shield, CheckCircle, AlertCircle, X } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { startInspectionSession, Entity, InspectionSession } from '../services/api'

interface StartInspectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSessionStarted: (session: InspectionSession) => void
  selectedEntity?: Entity | null
}

const StartInspectionModal: React.FC<StartInspectionModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted,
  selectedEntity
}) => {
  const { user } = useAuth()
  const [inspectionType, setInspectionType] = useState<InspectionSession['inspection_type']>('Routine inspection')
  const [location, setLocation] = useState({
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 4.8,
    resolvedAddress: 'Hyderabad Central Zone, Telangana',
    isGpsLocked: false
  })
  const [district, setDistrict] = useState(user?.jurisdiction || 'Hyderabad')
  const [state, setState] = useState('Telangana')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (isOpen && 'geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
            accuracy: Math.round(pos.coords.accuracy * 10) / 10,
            resolvedAddress: `${district} Enforcement Circle, ${state} (GPS Verified)`,
            isGpsLocked: true
          })
        },
        (err) => {
          console.warn('Geolocation access fallback:', err.message)
          setLocation(prev => ({
            ...prev,
            resolvedAddress: `${district} Circle Office, ${state}`,
            isGpsLocked: false
          }))
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [isOpen, district, state])

  if (!isOpen) return null

  const handleStart = async () => {
    setIsSubmitting(true)
    try {
      const res = await startInspectionSession({
        inspector_id: user?.id || 'INSP-LM-2026',
        inspector_name: user?.name || 'Legal Metrology Officer',
        jurisdiction_district: district,
        jurisdiction_state: state,
        inspection_type: inspectionType,
        gps_location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy_meters: location.accuracy,
          address_resolved: location.resolvedAddress
        },
        entity_id: selectedEntity?.entity_id,
        entity_name: selectedEntity?.firm_name || 'Premises under Inspection',
        entity_reg_no: selectedEntity?.registration_no,
        entity_type: selectedEntity?.entity_type || 'Manufacturer & Packer',
        premises_address: selectedEntity?.establishment_address || location.resolvedAddress
      })

      if (res.success && res.data) {
        onSessionStarted(res.data)
        onClose()
      }
    } catch (err) {
      console.error('Failed to start inspection session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-800/80 rounded-xl border border-blue-700/50">
              <Shield className="h-6 w-6 text-blue-300" />
            </div>
            <div>
              <h2 className="text-lg font-bold">Start Field Inspection Session</h2>
              <p className="text-xs text-blue-200">Legal Metrology Act, 2009 • Section 15 Inspection Memo</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 text-white/80 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Automatic Metadata Banner */}
          <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-center justify-between text-xs">
            <div className="flex items-center space-x-2 text-blue-950 font-medium">
              <Calendar className="h-4 w-4 text-blue-700" />
              <span>{now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
            <div className="flex items-center space-x-2 text-blue-950 font-medium">
              <Clock className="h-4 w-4 text-blue-700" />
              <span>{now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>
            <div className="flex items-center space-x-1.5 bg-blue-200/70 px-2.5 py-1 rounded-full text-blue-900 font-semibold">
              <Navigation className="h-3.5 w-3.5 text-blue-800" />
              <span>{location.isGpsLocked ? 'GPS Locked' : 'Auto Geo'}</span>
            </div>
          </div>

          {/* Location & GPS */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Premises Coordinates & District
            </label>
            <div className="p-3 bg-gray-50 border border-gray-200 rounded-xl flex items-start space-x-3">
              <MapPin className="h-5 w-5 text-red-600 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-gray-900">{location.resolvedAddress}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Lat: {location.latitude.toFixed(4)}° N, Long: {location.longitude.toFixed(4)}° E • Accuracy ±{location.accuracy}m
                </p>
              </div>
            </div>
          </div>

          {/* Target Registered Entity (if pre-selected) */}
          {selectedEntity ? (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Target Registered Premises</span>
                <span className="text-xs px-2 py-0.5 bg-emerald-200 text-emerald-900 font-semibold rounded-full">
                  {selectedEntity.registration_no}
                </span>
              </div>
              <p className="text-sm font-bold text-emerald-950 mt-1">{selectedEntity.firm_name}</p>
              <p className="text-xs text-emerald-800/90 mt-0.5 truncate">{selectedEntity.establishment_address}</p>
            </div>
          ) : (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-amber-700 shrink-0" />
                <span>No entity pre-selected. You can search premises or identify during scan.</span>
              </div>
            </div>
          )}

          {/* Inspection Type Selector */}
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Statutory Inspection Type
            </label>
            <select
              value={inspectionType}
              onChange={(e) => setInspectionType(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl text-sm font-medium text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="Routine inspection">Routine Periodic Inspection (Quarterly/Annual)</option>
              <option value="Surprise inspection">Surprise Enforcement Inspection (Intelligence Driven)</option>
              <option value="Complaint-based inspection">Consumer / Trade Complaint Verification</option>
              <option value="Follow-up inspection">Follow-up Rectification Audit</option>
              <option value="Registration-related inspection">New Packer / Importer Registration Audit</option>
            </select>
          </div>

          {/* District Selector */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">Enforcement District</label>
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1">State / UT</label>
              <input
                type="text"
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-sm text-gray-800"
              />
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 rounded-xl hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            disabled={isSubmitting}
            onClick={handleStart}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-800 hover:to-indigo-800 text-white font-bold text-sm rounded-xl shadow-md transition-all flex items-center space-x-2"
          >
            <CheckCircle className="h-4 w-4" />
            <span>{isSubmitting ? 'Starting Session...' : 'Start Inspection'}</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default StartInspectionModal
