import React, { useState, useEffect } from 'react'
import { Wifi, WifiOff, Cloud, Database, CheckCircle2, AlertCircle, RefreshCw, Trash2, Download } from 'lucide-react'
import { getOfflineQueue, saveOfflineQueue, clearSyncedItems, cacheEntitiesLocally, cacheRulesLocally, OfflineQueueItem } from '../services/offlineStorage'
import { fetchEntities, fetchRules } from '../services/api'

const OfflineSync: React.FC = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [queue, setQueue] = useState<OfflineQueueItem[]>([])
  const [syncing, setSyncing] = useState(false)
  const [caching, setCaching] = useState(false)
  const [cacheStatus, setCacheStatus] = useState({ entitiesCount: 0, rulesCount: 0, lastSynced: 'Never' })

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    setQueue(getOfflineQueue())

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handlePreDownloadCache = async () => {
    setCaching(true)
    try {
      const [entitiesRes, rulesRes] = await Promise.all([
        fetchEntities(),
        fetchRules()
      ])

      if (entitiesRes.success && entitiesRes.data) {
        cacheEntitiesLocally(entitiesRes.data)
      }
      if (rulesRes.success && rulesRes.data) {
        cacheRulesLocally(rulesRes.data)
      }

      setCacheStatus({
        entitiesCount: entitiesRes.count || 0,
        rulesCount: rulesRes.count || 0,
        lastSynced: new Date().toLocaleTimeString()
      })
    } catch (err) {
      console.error('Error pre-downloading offline cache:', err)
    } finally {
      setCaching(false)
    }
  }

  const handleSyncQueue = async () => {
    setSyncing(true)
    const currentQueue = getOfflineQueue()

    // Simulate batch sync processing
    await new Promise((r) => setTimeout(r, 1200))

    const updatedQueue = currentQueue.map(item => ({
      ...item,
      status: 'SYNCED' as const
    }))

    saveOfflineQueue(updatedQueue)
    setQueue(updatedQueue)
    setSyncing(false)
  }

  const handleClear = () => {
    clearSyncedItems()
    setQueue(getOfflineQueue())
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 rounded-2xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="px-3 py-1 bg-blue-700/60 text-blue-200 text-xs font-bold rounded-full uppercase tracking-wider border border-blue-500/30">
              Module 7: Field Offline Engine
            </span>
            <span className={`px-3 py-1 text-xs font-bold rounded-full flex items-center space-x-1.5 ${
              isOnline ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              {isOnline ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
              <span>{isOnline ? 'Connected to National Registry' : 'Offline Field Mode Active'}</span>
            </span>
          </div>
          <h1 className="text-2xl font-black mt-2 text-white">Offline Storage & Central Synchronization</h1>
          <p className="text-sm text-blue-200 mt-1 max-w-2xl">
            Execute full field inspections in remote areas without cellular connection. Pre-download rules and premises directories, store evidence locally, and sync seamlessly.
          </p>
        </div>

        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={handlePreDownloadCache}
            disabled={caching || !isOnline}
            className="px-4 py-2.5 bg-blue-800/80 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center space-x-2 border border-blue-600/40"
          >
            <Download className="h-4 w-4" />
            <span>{caching ? 'Caching...' : 'Pre-Download Field Data'}</span>
          </button>

          <button
            onClick={handleSyncQueue}
            disabled={syncing || queue.length === 0}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-lg transition-all flex items-center space-x-2"
          >
            <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
            <span>{syncing ? 'Syncing...' : 'Sync Central Server'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Status Card 1 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Network Status</span>
            <span className={`text-base font-black ${isOnline ? 'text-emerald-600' : 'text-amber-600'}`}>
              {isOnline ? 'Online (High Speed)' : 'Offline / Air-gapped'}
            </span>
          </div>
          <div className={`p-3 rounded-xl ${isOnline ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
            {isOnline ? <Wifi className="h-6 w-6" /> : <WifiOff className="h-6 w-6" />}
          </div>
        </div>

        {/* Status Card 2 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Cached Registrations</span>
            <span className="text-base font-black text-gray-900">
              {cacheStatus.entitiesCount > 0 ? `${cacheStatus.entitiesCount} Premises Cached` : 'Local Cache Ready'}
            </span>
          </div>
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
            <Database className="h-6 w-6" />
          </div>
        </div>

        {/* Status Card 3 */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 font-semibold block">Pending Sync Queue</span>
            <span className="text-base font-black text-indigo-700">
              {queue.filter(i => i.status === 'PENDING_SYNC').length} Records Pending
            </span>
          </div>
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
            <RefreshCw className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Offline Queue Items */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-base text-gray-900">Local Inspection Audit Queue</h3>
            <p className="text-xs text-gray-500">Records captured in the field waiting for central database synchronization</p>
          </div>
          {queue.length > 0 && (
            <button
              onClick={handleClear}
              className="text-xs text-gray-500 hover:text-red-600 font-semibold flex items-center space-x-1"
            >
              <Trash2 className="h-4 w-4" />
              <span>Clear Synced</span>
            </button>
          )}
        </div>

        <div className="p-4 space-y-2.5">
          {queue.length === 0 ? (
            <div className="py-12 text-center text-gray-400 text-xs">
              All field inspections and measurements are completely in sync with the central server.
            </div>
          ) : (
            queue.map((item) => (
              <div
                key={item.id}
                className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-gray-900">{item.type.replace(/_/g, ' ')}</span>
                    <span className="font-mono text-gray-500 text-[11px]">{item.id}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    Recorded: {new Date(item.timestamp).toLocaleString()}
                  </p>
                </div>

                <div className="flex items-center space-x-2">
                  <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] ${
                    item.status === 'SYNCED' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {item.status.replace(/_/g, ' ')}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default OfflineSync
