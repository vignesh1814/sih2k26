import React, { useState, useEffect } from 'react'
import { MapPin, Navigation, Calendar, Clock, Shield, CheckCircle, AlertCircle, X, Building2 } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { startInspectionSession, InspectionSession } from '../services/api'
import toast from 'react-hot-toast'

interface StartInspectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSessionStarted: (session: InspectionSession) => void
  initialEstablishmentName?: string
}

const StartInspectionModal: React.FC<StartInspectionModalProps> = ({
  isOpen,
  onClose,
  onSessionStarted,
  initialEstablishmentName = ''
}) => {
  const { user } = useAuth()
  const [establishmentName, setEstablishmentName] = useState(initialEstablishmentName)
  const [premisesAddress, setPremisesAddress] = useState('')
  const [establishmentType, setEstablishmentType] = useState('Retail Store / Supermarket')
  const [inspectionType, setInspectionType] = useState<InspectionSession['inspection_type']>('Routine inspection')
  const [district, setDistrict] = useState(user?.jurisdiction || 'Central Enforcement District')
  const [state, setState] = useState('Telangana')
  const [location, setLocation] = useState({
    latitude: 17.3850,
    longitude: 78.4867,
    accuracy: 4.8,
    resolvedAddress: 'District Inspection Hub',
    isGpsLocked: false
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    if (initialEstablishmentName) setEstablishmentName(initialEstablishmentName)
  }, [initialEstablishmentName])

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
            resolvedAddress: `${district}, ${state} (GPS Tagged)`,
            isGpsLocked: true
          })
        },
        (err) => {
          console.warn('Geolocation fallback:', err.message)
          setLocation(prev => ({
            ...prev,
            resolvedAddress: `${district}, ${state}`,
            isGpsLocked: false
          }))
        },
        { enableHighAccuracy: true, timeout: 5000 }
      )
    }
  }, [isOpen, district, state])

  if (!isOpen) return null

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!establishmentName.trim()) {
      toast.error('Please enter the establishment or trader name')
      return
    }

    setIsSubmitting(true)
    try {
      const res = await startInspectionSession({
        inspector_id: user?.id || 'INSP-LM-2026',
        inspector_name: user?.name || 'Field Inspector',
        jurisdiction_district: district,
        jurisdiction_state: state,
        inspection_type: inspectionType,
        gps_location: {
          latitude: location.latitude,
          longitude: location.longitude,
          accuracy_meters: location.accuracy,
          address_resolved: location.resolvedAddress
        },
        entity_name: establishmentName.trim(),
        entity_type: establishmentType,
        premises_address: premisesAddress.trim() || location.resolvedAddress
      })

      if (res.success && res.data) {
        toast.success(`Inspection Session ${res.data.session_id} initiated`)
        onSessionStarted(res.data)
        onClose()
      } else {
        toast.error('Could not create inspection session')
      }
    } catch (err: any) {
      console.error('Failed to start inspection session:', err)
      toast.error(err?.response?.data?.error || 'Failed to start inspection session')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white p-5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-600/80 rounded-xl">
              <Shield className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Initiate Section 15 Inspection</h3>
              <p className="text-xs text-blue-200">Packaged Commodities Statutory Inspection Record</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleStart} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Establishment / Trader Name *
            </label>
            <div className="relative">
              <Building2 className="h-4 w-4 text-gray-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={establishmentName}
                onChange={(e) => setEstablishmentName(e.target.value)}
                placeholder="e.g. Royal Mart Supermarket / Modern Retail Depot"
                className="w-full pl-10 pr-3.5 py-2.5 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Premises Type
              </label>
              <select
                value={establishmentType}
                onChange={(e) => setEstablishmentType(e.target.value)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Retail Store / Supermarket">Retail Store / Supermarket</option>
                <option value="Wholesale Distributor">Wholesale Distributor</option>
                <option value="Manufacturing / Packing Plant">Manufacturing Plant</option>
                <option value="Warehouse / Logistics Depot">Warehouse Depot</option>
                <option value="E-Commerce Fulfillment Hub">E-Commerce Hub</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Inspection Type
              </label>
              <select
                value={inspectionType}
                onChange={(e) => setInspectionType(e.target.value as any)}
                className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
              >
                <option value="Routine inspection">Routine Inspection</option>
                <option value="Surprise inspection">Surprise Inspection</option>
                <option value="Complaint-based inspection">Complaint-Based</option>
                <option value="Follow-up inspection">Follow-Up Inspection</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1.5">
              Premises Physical Address
            </label>
            <input
              type="text"
              value={premisesAddress}
              onChange={(e) => setPremisesAddress(e.target.value)}
              placeholder="e.g. Plot 14, Commercial Complex, Sector 2"
              className="w-full px-3.5 py-2 text-sm bg-gray-50 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-600 focus:outline-none"
            />
          </div>

          {/* GPS Location Pill */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-xs text-blue-900 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-blue-600" />
              <span>
                GPS: {location.latitude.toFixed(4)}°N, {location.longitude.toFixed(4)}°E (±{location.accuracy}m)
              </span>
            </div>
            <span className="font-bold text-[10px] bg-blue-200 text-blue-800 px-2 py-0.5 rounded">
              {location.isGpsLocked ? 'GPS Verified' : 'Standard Circle'}
            </span>
          </div>

          {/* Officer & Timestamp */}
          <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t border-gray-100">
            <span>Inspector: <strong className="text-gray-800">{user?.name}</strong></span>
            <span>{now.toLocaleTimeString()}</span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-md transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Initiating Session...' : 'Create & Start Inspection'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StartInspectionModal
